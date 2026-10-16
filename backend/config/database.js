const mongoose = require('mongoose');
const dns = require('dns');

const { execSync } = require('child_process');

// Use reliable DNS resolvers: dynamically detect active Windows adapter DNS, fallback to Google & Cloudflare
try {
  const current = dns.getServers();
  if (process.platform === 'win32' && (current.length === 0 || current[0] === '127.0.0.1')) {
    const psOut = execSync('powershell.exe -NoProfile -Command "(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 }).ServerAddresses"', { encoding: 'utf8' });
    const servers = psOut.split(/\r?\n/).map(s => s.trim()).filter(s => s && s !== '127.0.0.1');
    if (servers.length > 0) {
      dns.setServers([...servers, '8.8.8.8', '1.1.1.1']);
    } else {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    }
  } else {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
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

