module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  // Mongoose keeps handles open briefly after disconnect; this keeps CI honest
  // without failing the run.
  forceExit: true,
};
