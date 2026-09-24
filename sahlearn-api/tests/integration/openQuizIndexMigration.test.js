const mongoose = require('mongoose');
// Required purely for the side effect: registering the model is what puts this
// collection on the connection, which is how the shared afterEach in
// tests/setup.js knows to clear it between tests.
require('../../src/models/DailyQuizAttempt');
const { migrateIndexes, COLLECTION, OLD_INDEX } = require('../../src/migrations/2026-09-23-open-quiz-indexes');

// The normal suite never reproduces the live database's situation: Mongoose
// builds the new indexes from scratch there. These tests seed the OLD plain
// unique index first, the way the deployed database actually is, and then run
// the migration against it.
const collection = () => mongoose.connection.db.collection(COLLECTION);
const silent = () => {};
const migrate = (opts = {}) => migrateIndexes(collection(), { log: silent, ...opts });
const byName = (indexes, name) => indexes.find((i) => i.name === name);

const seedOldSchema = async () => {
  // Rows first: a unique index cannot be built over existing duplicates, and a
  // previous test in this file leaves some behind.
  await collection().deleteMany({});
  await collection().dropIndexes().catch(() => {}); // nothing to drop on a fresh run
  await collection().createIndex({ quizDate: 1, student: 1 }, { unique: true, name: OLD_INDEX });
};

const attempt = (overrides = {}) => ({
  quiz: new mongoose.Types.ObjectId(),
  quizDate: '2026-09-23',
  startedAt: new Date(),
  maxScore: 5,
  ...overrides,
});

// No afterAll cleanup: tests/setup.js gives each test file its own in-memory
// database and drops it, so the indexes rewritten here never reach another file.

describe('open-quiz index migration', () => {
  beforeEach(seedOldSchema);

  test('the old index really does break a second guest — this is the bug being fixed', async () => {
    await collection().insertOne(attempt({ student: null }));

    // Both rows have student null, and a plain unique index treats those as
    // equal. Without the migration, the second guest of the day is rejected.
    await expect(collection().insertOne(attempt({ student: null }))).rejects.toThrow(/duplicate key/i);
  });

  test('after migrating, two guests on the same day both insert', async () => {
    await migrate();

    await collection().insertOne(attempt({ student: null, participant: { phoneKey: '2348010000001' } }));
    await collection().insertOne(attempt({ student: null, participant: { phoneKey: '2348010000002' } }));

    expect(await collection().countDocuments()).toBe(2);
  });

  test('after migrating, a duplicate phone on the same day is still refused', async () => {
    await migrate();
    const participant = { phoneKey: '2348011111111' };

    await collection().insertOne(attempt({ student: null, participant }));
    await expect(collection().insertOne(attempt({ student: null, participant }))).rejects.toThrow(
      /duplicate key/i
    );
  });

  test('after migrating, one student still cannot take the same day twice', async () => {
    await migrate();
    const student = new mongoose.Types.ObjectId();

    await collection().insertOne(attempt({ student, participant: { phoneKey: '2348012222221' } }));
    await expect(
      collection().insertOne(attempt({ student, participant: { phoneKey: '2348012222222' } }))
    ).rejects.toThrow(/duplicate key/i);
  });

  test('the same phone on a different day is fine', async () => {
    await migrate();
    const participant = { phoneKey: '2348013333333' };

    await collection().insertOne(attempt({ participant, quizDate: '2026-09-23' }));
    await collection().insertOne(attempt({ participant, quizDate: '2026-09-24' }));

    expect(await collection().countDocuments()).toBe(2);
  });

  test('it produces exactly the indexes the model declares', async () => {
    const after = await migrate();

    const phoneIndex = byName(after, 'quizDate_1_participant.phoneKey_1');
    expect(phoneIndex.unique).toBe(true);
    expect(phoneIndex.partialFilterExpression).toEqual({ 'participant.phoneKey': { $type: 'string' } });

    const studentIndex = byName(after, OLD_INDEX);
    expect(studentIndex.unique).toBe(true);
    expect(studentIndex.partialFilterExpression).toEqual({ student: { $type: 'objectId' } });

    expect(byName(after, 'participant.phoneKey_1_quizDate_-1')).toBeDefined();
  });

  test('--dry-run reports without changing anything', async () => {
    const before = await collection().indexes();
    await migrate({ dryRun: true });
    const after = await collection().indexes();

    expect(after).toEqual(before);
    // Still broken, because a dry run must not have fixed it.
    await collection().insertOne(attempt({ student: null }));
    await expect(collection().insertOne(attempt({ student: null }))).rejects.toThrow(/duplicate key/i);
  });

  test('running it twice is harmless', async () => {
    const first = await migrate();
    const second = await migrate();

    expect(second.map((i) => i.name).sort()).toEqual(first.map((i) => i.name).sort());
  });

  test('it works on a collection that has no old index at all', async () => {
    await collection().dropIndexes().catch(() => {});
    const after = await migrate();
    expect(byName(after, 'quizDate_1_participant.phoneKey_1')).toBeDefined();
  });

  test('legacy rows with no phone do not collide with each other', async () => {
    await migrate();

    // Attempts recorded before the quiz opened up have no participant at all.
    // The partial index must skip them rather than treat them as duplicates.
    const a = new mongoose.Types.ObjectId();
    const b = new mongoose.Types.ObjectId();
    await collection().insertOne(attempt({ student: a }));
    await collection().insertOne(attempt({ student: b }));

    expect(await collection().countDocuments()).toBe(2);
  });
});
