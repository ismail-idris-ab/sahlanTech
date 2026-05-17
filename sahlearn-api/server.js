require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');
const seedAdmin = require('./src/utils/seedAdmin');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
