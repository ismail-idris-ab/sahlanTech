const User = require('../models/User');

const seedAdmin = async () => {
  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin user already exists — skipping seed.');
    return;
  }

  const { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } = process.env;

  if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD) {
    console.warn('ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not set — skipping seed.');
    return;
  }

  await User.create({
    name: 'Sahlearn Admin',
    email: ADMIN_SEED_EMAIL,
    password: ADMIN_SEED_PASSWORD,
    role: 'admin',
  });

  console.log(`Admin seeded: ${ADMIN_SEED_EMAIL}`);
  console.log('IMPORTANT: Change the admin password immediately after first login.');
};

module.exports = seedAdmin;
