/**
 * Development Account Seeding Utility
 * 
 * Safely seeds Admin and Courier accounts for local development without
 * modifying existing production/staging data or resetting existing accounts
 * unless explicitly authorized via CLI flags.
 * 
 * Usage:
 *   npm run seed:development-accounts
 *   node scripts/seedDevelopmentAccounts.js [--reset-passwords]
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const EXPECTED_DATABASE = 'courier_tracking_db';
const BCRYPT_SALT_ROUNDS = 10;

// Default account definitions for local development
const ACCOUNTS_CONFIG = [
  {
    name: 'System Administrator',
    email: (process.env.ADMIN_SEED_EMAIL || 'admin@couriertrack.com').trim().toLowerCase(),
    password: process.env.ADMIN_SEED_PASSWORD || 'Admin@123',
    phone: '9999999999',
    role: 'admin',
    resetFlag: '--reset-admin',
  },
  {
    name: 'Fast Delivery Courier',
    email: (process.env.COURIER_SEED_EMAIL || 'courier@couriertrack.com').trim().toLowerCase(),
    password: process.env.COURIER_SEED_PASSWORD || 'Courier@123',
    phone: '8888888888',
    role: 'courier',
    resetFlag: '--reset-courier',
  },
];

async function seedDevelopmentAccounts() {
  const cliArgs = process.argv.slice(2);
  const resetAllRequested = cliArgs.includes('--reset-passwords');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ [Seed] Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  let exitCode = 0;

  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const activeDbName = mongoose.connection.name;
    console.log(`[Seed] Connected to database: ${activeDbName}`);

    // Verify targeted database is courier_tracking_db before any operations
    if (activeDbName !== EXPECTED_DATABASE) {
      throw new Error(
        `Safety Check Failed: Expected database '${EXPECTED_DATABASE}', but connected to '${activeDbName}'. Aborting seed operation.`
      );
    }

    console.log('----------------------------------------------------');
    console.log('[Seed] Verifying development accounts...');

    for (const account of ACCOUNTS_CONFIG) {
      const normalizedEmail = account.email;
      const shouldReset = resetAllRequested || cliArgs.includes(account.resetFlag);

      // 1. Check if user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        if (shouldReset) {
          // Explicit reset requested by administrator/developer
          const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
          const hashedPassword = await bcrypt.hash(account.password, salt);

          existingUser.password = hashedPassword;
          // Ensure role is exactly as expected without overwriting unintended accounts
          if (existingUser.role !== account.role) {
            existingUser.role = account.role;
          }
          await existingUser.save();

          console.log(`🔄 [Seed] Reset password for existing ${account.role.toUpperCase()} account:`);
          console.log(`   - Email: ${existingUser.email}`);
          console.log(`   - Role:  ${existingUser.role}`);
          console.log(`   - Status: Password updated successfully (credential not logged)`);
        } else {
          // Report existing account without mutating or overwriting
          console.log(`ℹ️ [Seed] ${account.role.toUpperCase()} account already exists:`);
          console.log(`   - Email: ${existingUser.email}`);
          console.log(`   - Role:  ${existingUser.role}`);
          console.log(`   - Notice: Account preserved. (To reset password, run with --reset-passwords)`);
        }
      } else {
        // 2. Account does not exist, create it safely
        if (account.password.length < 6) {
          throw new Error(`Password for ${account.email} does not meet minimum length requirement (6 characters).`);
        }

        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(account.password, salt);

        const newUser = await User.create({
          name: account.name,
          email: normalizedEmail,
          password: hashedPassword,
          phone: account.phone,
          role: account.role,
        });

        console.log(`✅ [Seed] Created new ${account.role.toUpperCase()} account:`);
        console.log(`   - Name:  ${newUser.name}`);
        console.log(`   - Email: ${newUser.email}`);
        console.log(`   - Role:  ${newUser.role}`);
        console.log(`   - Status: Ready for login`);
      }
    }

    console.log('----------------------------------------------------');
    console.log('✅ [Seed] Account verification and seeding completed successfully.');
  } catch (error) {
    console.error(`❌ [Seed] Error during seeding: ${error.message}`);
    exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Seed] Disconnected from MongoDB.');
    }
  }

  process.exit(exitCode);
}

seedDevelopmentAccounts();
