/**
 * Run once to create the super admin account:
 *   node apps/backend/src/seeders/superadmin.seed.js
 *
 * Set env vars first or create a .env in backend root:
 *   MONGODB_URI=mongodb://...
 *   SUPER_ADMIN_EMAIL=admin@rewardbytes.com
 *   SUPER_ADMIN_PASSWORD=ChangeMe123!
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/SuperAdmin');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@rewardbytes.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
  const name     = 'Super Admin';

  const existing = await SuperAdmin.findOne({ email });
  if (existing) {
    console.log('Super admin already exists:', email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  await SuperAdmin.create({ name, email, password: hashed });
  console.log('✅ Super admin created:', email);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
