process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

beforeAll(async () => {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri);

  // Build every model's indexes before any test runs.
  //
  // Without this, unique indexes simply do not exist in the test database, so
  // the suite cannot see a constraint violation that production would raise.
  // That gap hid a real bug: a duplicate insert returned 500 in production
  // while every test passed.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});
