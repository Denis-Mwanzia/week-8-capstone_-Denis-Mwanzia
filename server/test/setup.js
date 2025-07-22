const mongoose = require('mongoose');

// Setup test database connection
beforeAll(async () => {
  const url =
    process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/tukomaji-test';
  await mongoose.connect(url);
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
