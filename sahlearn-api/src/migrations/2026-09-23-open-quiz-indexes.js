/**
 * Migration — open the daily quiz to unregistered takers.
 *
 * WHY THIS EXISTS
 * The dailyquizattempts collection has a plain unique index on
 * { quizDate: 1, student: 1 }. Once `student` is null for guests, MongoDB
 * treats every null as the same value, so the SECOND guest to take a quiz on
 * any given day is rejected as a duplicate of the first. Mongoose never
 * rewrites an index that already exists, so this has to be done deliberately.
 *
 * WHAT IT DOES
 *   1. Drops  quizDate_1_student_1                     (the old plain unique)
 *   2. Creates quizDate + participant.phoneKey unique, partial on phoneKey
 *   3. Creates quizDate + student          unique, partial on student
 *   4. Creates participant.phoneKey + quizDate         (lookup support)
 *
 * Steps 2-4 match src/models/DailyQuizAttempt.js exactly. Running this twice is
 * harmless — every step checks first.
 *
 * RUN IT
 *   node src/migrations/2026-09-23-open-quiz-indexes.js           # apply
 *   node src/migrations/2026-09-23-open-quiz-indexes.js --dry-run # report only
 *
 * Reads MONGODB_URI from the environment, so point it at a COPY first.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const COLLECTION = 'dailyquizattempts';
const OLD_INDEX = 'quizDate_1_student_1';

const WANTED = [
  {
    name: 'quizDate_1_participant.phoneKey_1',
    keys: { quizDate: 1, 'participant.phoneKey': 1 },
    options: {
      unique: true,
      partialFilterExpression: { 'participant.phoneKey': { $type: 'string' } },
    },
  },
  {
    name: 'quizDate_1_student_1',
    keys: { quizDate: 1, student: 1 },
    options: { unique: true, partialFilterExpression: { student: { $type: 'objectId' } } },
  },
  {
    name: 'participant.phoneKey_1_quizDate_-1',
    keys: { 'participant.phoneKey': 1, quizDate: -1 },
    options: {},
  },
];

const isPartial = (index) => Boolean(index.partialFilterExpression);

// Exported so the test suite can run it against a scratch database seeded with
// the OLD index — the situation the live database is actually in, which the
// normal test run never reproduces because Mongoose builds fresh indexes there.
async function migrateIndexes(collection, { dryRun = false, log = console.log } = {}) {
  const describe = (i) =>
    `  ${i.name}${i.unique ? ' (unique)' : ''}${isPartial(i) ? ' (partial)' : ''}`;

  const before = await collection.indexes();
  log(`\nIndexes on ${COLLECTION} before:`);
  before.forEach((i) => log(describe(i)));

  if (dryRun) log('\n--dry-run: reporting only, nothing will change.\n');

  // 1. Drop the old plain unique index, but only if it is the plain one. If it
  //    is already partial this migration has run before.
  const old = before.find((i) => i.name === OLD_INDEX);
  if (!old) {
    log(`\n- ${OLD_INDEX}: not present, nothing to drop.`);
  } else if (isPartial(old)) {
    log(`\n- ${OLD_INDEX}: already partial, leaving it alone.`);
  } else {
    log(`\n- ${OLD_INDEX}: plain unique index found — dropping.`);
    if (!dryRun) await collection.dropIndex(OLD_INDEX);
  }

  // 2-4. Create each wanted index if it is not already there in the right shape.
  for (const wanted of WANTED) {
    const current = (await collection.indexes()).find((i) => i.name === wanted.name);
    if (current && isPartial(current) === Boolean(wanted.options.partialFilterExpression)) {
      log(`- ${wanted.name}: already correct.`);
      continue;
    }
    if (current) {
      log(`- ${wanted.name}: wrong shape — dropping and recreating.`);
      if (!dryRun) await collection.dropIndex(wanted.name);
    } else {
      log(`- ${wanted.name}: creating.`);
    }
    if (!dryRun) await collection.createIndex(wanted.keys, { name: wanted.name, ...wanted.options });
  }

  const after = await collection.indexes();
  log(`\nIndexes on ${COLLECTION} after:`);
  after.forEach((i) => log(describe(i)));
  log(dryRun ? '\nDry run complete. Nothing changed.\n' : '\nMigration complete.\n');

  return after;
}

// CLI wrapper. Owns the connection; migrateIndexes itself does not, so the
// tests can drive it against their own scratch database.
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Refusing to run.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  try {
    await migrateIndexes(mongoose.connection.db.collection(COLLECTION), { dryRun });
  } finally {
    await mongoose.disconnect();
  }
}

// Only runs when invoked directly, so requiring this file from a test is safe.
if (require.main === module) {
  main().catch(async (err) => {
    console.error('\nMigration failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { migrateIndexes, COLLECTION, OLD_INDEX, WANTED };
