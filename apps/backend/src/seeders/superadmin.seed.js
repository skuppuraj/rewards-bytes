/**
 * Run from the backend directory:
 *   cd apps/backend && node src/seeders/superadmin.seed.js
 *
 * Or from repo root:
 *   node apps/backend/src/seeders/superadmin.seed.js
 */
const path = require('path');
const fs   = require('fs');

// Try .env locations from most specific to fallback
const envPaths = [
  path.resolve(__dirname, '../../.env'),        // apps/backend/.env
  path.resolve(__dirname, '../../../.env'),      // apps/.env
  path.resolve(__dirname, '../../../../.env'),   // repo root .env
  path.resolve(process.cwd(), '.env'),           // wherever you run from
];

const envFile = envPaths.find(p => fs.existsSync(p));
if (envFile) {
  require('dotenv').config({ path: envFile });
  console.log('Loaded .env from:', envFile);
} else {
  console.warn('No .env file found — relying on existing env vars');
}

const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const SuperAdmin = require('../models/SuperAdmin');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('\n❌ MONGODB_URI is not set.');
    console.error('Create apps/backend/.env with:');
    console.error('  MONGODB_URI=mongodb://localhost:27017/rewardbytes\n');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const email    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@rewardbytes.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

  const existing = await SuperAdmin.findOne({ email });
  if (existing) {
    console.log('⚠️  Super admin already exists:', email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await SuperAdmin.create({ name: 'Super Admin', email, password: hashed });
  console.log('✅ Super admin created!');
  console.log('   Email   :', email);
  console.log('   Password:', password);
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
