require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ role: 'admin' }).select('+password');
  if (!user) {
    console.log('NO ADMIN USER FOUND in database.');
    await mongoose.disconnect();
    return;
  }

  console.log('Admin found:', user.email, '| isActive:', user.isActive);
  console.log('Password hash stored:', user.password ? 'YES (length=' + user.password.length + ')' : 'MISSING');

  const testPassword = process.env.ADMIN_SEED_PASSWORD;
  const match = await bcrypt.compare(testPassword, user.password);
  console.log(`Testing ADMIN_SEED_PASSWORD="${testPassword}" against hash → match: ${match}`);

  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
