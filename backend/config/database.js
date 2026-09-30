const mongoose = require('mongoose');
const dns = require('dns');

// Use reliable DNS resolvers (Google & Cloudflare) to prevent SRV lookup failures on Windows/local ISP DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('DNS server configuration warning:', dnsErr.message);
}

/**
 * Connect to MongoDB Database
 * Reads connection URI from environment variables
 */
const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;

    if (!connUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(connUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

