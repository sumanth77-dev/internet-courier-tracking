const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createOrPromoteAdmin = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@couriertrack.com').trim().toLowerCase();
  const password = args[1] || 'Admin@123';
  const name = args[2] || 'System Administrator';
  const phone = args[3] || '9999999999';

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      if (args[1]) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      await user.save();
      console.log(`✅ Existing user updated to ADMIN:`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'admin',
      });
      console.log(`✅ New ADMIN account created successfully:`);
    }

    console.log('-------------------------------------------');
    console.log(`Name    : ${user.name}`);
    console.log(`Email   : ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role    : ${user.role}`);
    console.log('-------------------------------------------');
    console.log('You can now log in at http://localhost:5173/login');
  } catch (err) {
    console.error('❌ Error creating/updating admin user:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createOrPromoteAdmin();
