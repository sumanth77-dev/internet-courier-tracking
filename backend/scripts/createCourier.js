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

const createOrPromoteCourier = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || 'courier@couriertrack.com').trim().toLowerCase();
  const password = args[1] || 'Courier@123';
  const name = args[2] || 'Fast Delivery Courier';
  const phone = args[3] || '8888888888';

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
      user.role = 'courier';
      if (args[1]) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      await user.save();
      console.log(`✅ Existing user updated to COURIER:`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'courier',
      });
      console.log(`✅ New COURIER account created successfully:`);
    }

    console.log('-------------------------------------------');
    console.log(`Name    : ${user.name}`);
    console.log(`Email   : ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role    : ${user.role}`);
    console.log('-------------------------------------------');
    console.log('You can now log in at http://localhost:5173/login');
  } catch (err) {
    console.error('❌ Error creating/updating courier user:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createOrPromoteCourier();
