require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const reset = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ role: 'admin' });
  console.log('Admin users deleted.');

  await User.create({
    name: 'Sahlearn Admin',
    email: process.env.ADMIN_SEED_EMAIL,
    password: process.env.ADMIN_SEED_PASSWORD,
    role: 'admin',
  });

  console.log(`Admin re-created: ${process.env.ADMIN_SEED_EMAIL}`);
  console.log(`Password: ${process.env.ADMIN_SEED_PASSWORD}`);
  await mongoose.disconnect();
};

reset().catch((e) => { console.error(e); process.exit(1); });
