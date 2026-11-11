const http = require('http');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// --------------------------------------------------------------------------
// 1. UNIT TESTS: Client-side compression & dimension logic
// --------------------------------------------------------------------------
console.log('\n=== STEP 1: Testing Client-Side Compressor Logic ===');

// Dimension fit calculation
function calculateFitDimensions(width, height, maxWidth, maxHeight) {
  let targetWidth = width;
  let targetHeight = height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
  }

  return { width: targetWidth, height: targetHeight };
}

// Test A: High-res smartphone photo (4032 x 3024)
const scaledPhone = calculateFitDimensions(4032, 3024, 1600, 1600);
console.log(`- 4032x3024 scaled: ${scaledPhone.width}x${scaledPhone.height} (Expected: 1600x1200)`);
assert.strictEqual(scaledPhone.width, 1600);
assert.strictEqual(scaledPhone.height, 1200);

// Test B: Vertical smartphone photo (3024 x 4032)
const scaledPortrait = calculateFitDimensions(3024, 4032, 1600, 1600);
console.log(`- 3024x4032 portrait scaled: ${scaledPortrait.width}x${scaledPortrait.height} (Expected: 1200x1600)`);
assert.strictEqual(scaledPortrait.width, 1200);
assert.strictEqual(scaledPortrait.height, 1600);

// Test C: Moderate size image (800 x 600) stays unchanged
const unscaled = calculateFitDimensions(800, 600, 1600, 1600);
console.log(`- 800x600 unscaled: ${unscaled.width}x${unscaled.height} (Expected: 800x600)`);
assert.strictEqual(unscaled.width, 800);
assert.strictEqual(unscaled.height, 600);

// MIME type validation tests
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

function validatePodImage(name, mime) {
  const ext = (name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')).toLowerCase() : '');
  return ALLOWED_MIME.includes(mime) || ALLOWED_EXT.includes(ext);
}

assert.strictEqual(validatePodImage('package.jpg', 'image/jpeg'), true);
assert.strictEqual(validatePodImage('package.png', 'image/png'), true);
assert.strictEqual(validatePodImage('package.webp', 'image/webp'), true);
assert.strictEqual(validatePodImage('malware.exe', 'application/x-msdownload'), false);
assert.strictEqual(validatePodImage('document.pdf', 'application/pdf'), false);
console.log('✓ Client-side dimension scaling & MIME validation passed.');

// --------------------------------------------------------------------------
// 2. UNIT TESTS: Backend Binary Signature Verification
// --------------------------------------------------------------------------
console.log('\n=== STEP 2: Testing Backend Image Magic Byte Verification ===');
const { validateImageMagicBytes } = require('../backend/middleware/uploadMiddleware');

// Valid JPEG minimal header: FF D8 FF E0 00 10 4A 46 49 46 00 01
const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const tempJpegPath = path.join(__dirname, 'temp-valid.jpg');
fs.writeFileSync(tempJpegPath, validJpeg);
assert.strictEqual(validateImageMagicBytes(tempJpegPath), true);
fs.unlinkSync(tempJpegPath);
console.log('✓ Valid JPEG magic bytes correctly identified.');

// Valid PNG header: 89 50 4E 47 0D 0A 1A 0A
const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const tempPngPath = path.join(__dirname, 'temp-valid.png');
fs.writeFileSync(tempPngPath, validPng);
assert.strictEqual(validateImageMagicBytes(tempPngPath), true);
fs.unlinkSync(tempPngPath);
console.log('✓ Valid PNG magic bytes correctly identified.');

// Valid WebP header: RIFF .... WEBP
const validWebP = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ', 'ascii');
const tempWebPPath = path.join(__dirname, 'temp-valid.webp');
fs.writeFileSync(tempWebPPath, validWebP);
assert.strictEqual(validateImageMagicBytes(tempWebPPath), true);
fs.unlinkSync(tempWebPPath);
console.log('✓ Valid WebP magic bytes correctly identified.');

// Fake image (text file disguised as JPG)
const fakeJpg = Buffer.from('<?php echo "malicious code"; ?>', 'utf8');
const tempFakePath = path.join(__dirname, 'temp-fake.jpg');
fs.writeFileSync(tempFakePath, fakeJpg);
assert.strictEqual(validateImageMagicBytes(tempFakePath), false);
fs.unlinkSync(tempFakePath);
console.log('✓ Fake image (tampered binary) correctly rejected.');

// --------------------------------------------------------------------------
// 3. INTEGRATION TESTS: Live HTTP Server Proof of Delivery Lifecycle
// --------------------------------------------------------------------------
console.log('\n=== STEP 3: Testing End-to-End POD Workflow Against Server ===');

function request(options, data, isBuffer = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (isBuffer || Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
    }
    req.end();
  });
}

function createMultipartFormData(fields, fileField) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
      `${val}\r\n`
    );
  }

  let bodyBuffer;
  if (fileField && fileField.data) {
    const fileHeader =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\n` +
      `Content-Type: ${fileField.contentType}\r\n\r\n`;
    const headerBuffer = Buffer.from(parts.join('') + fileHeader, 'utf-8');
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    bodyBuffer = Buffer.concat([headerBuffer, fileField.data, footerBuffer]);
  } else {
    bodyBuffer = Buffer.from(parts.join('') + `--${boundary}--\r\n`, 'utf-8');
  }

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: bodyBuffer,
  };
}

async function runLiveIntegrationTests() {
  const PORT = 5000;

  // 1. Check health
  const healthRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/health',
    method: 'GET',
  });
  assert.strictEqual(healthRes.status, 200);
  console.log('✓ Health check responded with 200 OK.');

  // 2. Login accounts
  console.log('- Logging in Customer, Admin, and Courier...');

  let customerToken = null;
  let customerUser = null;

  const loginCustomerRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'customer@couriertrack.com', password: 'Customer@123' }
  );

  customerToken = loginCustomerRes.data?.data?.token || loginCustomerRes.data?.token;
  customerUser = loginCustomerRes.data?.data?.user || loginCustomerRes.data?.user;

  // If seeded customer password differs, register an isolated test customer
  if (!customerToken) {
    const regRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'POD Test Customer',
        email: `pod_cust_${Date.now()}@test.com`,
        password: 'Password@123',
        phone: '9876543210',
      }
    );
    customerToken = regRes.data?.data?.token || regRes.data?.token;
    customerUser = regRes.data?.data?.user || regRes.data?.user;
  }

  // Admin login
  const adminRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@couriertrack.com', password: 'Admin@123' }
  );
  const adminToken = adminRes.data?.data?.token || adminRes.data?.token;

  // Courier login
  const courierRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'courier@couriertrack.com', password: 'Courier@123' }
  );
  const courierToken = courierRes.data?.data?.token || courierRes.data?.token;
  const courierUser = courierRes.data?.data?.user || courierRes.data?.user;

  assert(customerToken, 'Customer token must exist');
  assert(adminToken, 'Admin token must exist');
  assert(courierToken, 'Courier token must exist');
  console.log('✓ Successfully authenticated all test roles.');

  // 3. Customer creates a shipment
  console.log('- Creating a test shipment...');
  const createRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/shipments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    },
    {
      pickupAddress: {
        addressLine: '123 Sender St',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      deliveryAddress: {
        addressLine: '456 Recipient Ave',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        latitude: 12.9352,
        longitude: 77.6245,
      },
      recipient: {
        name: 'Recipient Sumanth',
        phone: '9876543210',
        email: 'recipient@test.com',
      },
      packageDetails: {
        weight: 2.5,
        description: 'High-Value Fragile Electronics',
      },
    }
  );
  if (createRes.status !== 201) {
    console.error('Create shipment error:', createRes.data);
  }
  assert.strictEqual(createRes.status, 201);
  const shipment = createRes.data?.data?.shipment || createRes.data?.shipment;
  console.log(`✓ Shipment created: Tracking ID ${shipment.trackingId} (ID: ${shipment._id})`);

  // 4. Admin assigns courier
  console.log('- Admin assigning courier to shipment...');
  const assignRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/admin/${shipment._id}/assign`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    },
    { courierId: courierUser._id || courierUser.id }
  );
  assert.strictEqual(assignRes.status, 200);
  console.log('✓ Courier assigned successfully.');

  // 5. Courier updates status: Picked Up -> In Transit -> Out for Delivery
  console.log('- Moving shipment to Out for Delivery...');
  for (const status of ['Picked Up', 'In Transit', 'Out for Delivery']) {
    const statusRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/shipments/courier/${shipment._id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${courierToken}`,
        },
      },
      { status }
    );
    assert.strictEqual(statusRes.status, 200);
  }
  console.log('✓ Shipment is now Out for Delivery.');

  // 6. Customer generates Delivery OTP
  console.log('- Customer generating delivery OTP...');
  const otpRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/${shipment._id}/delivery-otp`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    },
    {}
  );
  assert.strictEqual(otpRes.status, 200);
  const plainOtp = otpRes.data?.data?.otp;
  assert(plainOtp && /^\d{6}$/.test(plainOtp), 'OTP must be 6 numeric digits');
  console.log(`✓ Delivery OTP generated: ${plainOtp}`);

  // 7. TEST: Reject fake image content on POD submission
  console.log('- Testing backend rejection of fake image content...');
  const fakeMultipart = createMultipartFormData(
    {
      otp: plainOtp,
      confirmation: 'true',
      recipientName: 'Recipient Sumanth',
      recipientType: 'Customer',
    },
    {
      name: 'photo',
      filename: 'fake-photo.jpg',
      contentType: 'image/jpeg',
      data: Buffer.from('This is a text file posing as an image', 'utf8'),
    }
  );

  const fakeRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/courier/${shipment._id}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': fakeMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    fakeMultipart.body,
    true
  );
  assert.strictEqual(fakeRes.status, 400);
  console.log(`✓ Fake image rejected with HTTP 400: "${fakeRes.data.message}"`);

  // 8. TEST: Submit valid compressed delivery photo + valid OTP
  console.log('- Submitting valid Proof of Delivery photo + OTP...');
  // 1x1 valid PNG image buffer
  const validPngImage = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d0000000049454e44ae426082',
    'hex'
  );

  const validMultipart = createMultipartFormData(
    {
      otp: plainOtp,
      confirmation: 'true',
      recipientName: 'Recipient Sumanth',
      recipientType: 'Customer',
    },
    {
      name: 'photo',
      filename: 'package-delivery-proof.png',
      contentType: 'image/png',
      data: validPngImage,
    }
  );

  const podRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/courier/${shipment._id}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': validMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    validMultipart.body,
    true
  );
  assert.strictEqual(podRes.status, 200);
  assert.strictEqual(podRes.data?.data?.shipment?.status, 'Delivered');
  console.log('✓ Proof of Delivery submitted successfully! Shipment marked as Delivered.');

  // 9. TEST: Customer views Proof of Delivery details & photo
  console.log('- Customer retrieving Proof of Delivery...');
  const customerPodRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: `/api/shipments/${shipment._id}/proof-of-delivery`,
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert.strictEqual(customerPodRes.status, 200);
  assert(customerPodRes.data?.data?.proof?.photoUrl, 'Proof photoUrl must exist');
  console.log(`✓ Customer successfully accessed POD: ${customerPodRes.data.data.proof.photoUrl}`);

  // Fetch actual photo binary as Customer
  const photoUrl = customerPodRes.data.data.proof.photoUrl;
  const photoRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: photoUrl,
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  assert.strictEqual(photoRes.status, 200);
  console.log('✓ Customer successfully loaded POD photo binary.');

  // 10. TEST: Admin views Proof of Delivery & photo
  console.log('- Admin retrieving Proof of Delivery photo...');
  const adminPhotoRes = await request({
    hostname: 'localhost',
    port: PORT,
    path: photoUrl,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminPhotoRes.status, 200);
  console.log('✓ Admin successfully loaded POD photo binary.');

  // 11. TEST: Duplicate POD submission prevented
  console.log('- Verifying duplicate POD submission is rejected...');
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/courier/${shipment._id}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': validMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    validMultipart.body,
    true
  );
  assert.strictEqual(dupRes.status, 400);
  console.log(`✓ Duplicate POD prevented with HTTP 400: "${dupRes.data.message}"`);

  // 12. TEST: Server-side limit on raw uncompressed file > 5 MB
  console.log('- Testing backend 5 MB limit on uncompressed raw upload...');
  const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0xff);
  // Fake JPEG header
  oversizedBuffer[0] = 0xff;
  oversizedBuffer[1] = 0xd8;
  oversizedBuffer[2] = 0xff;

  const oversizedMultipart = createMultipartFormData(
    { otp: '123456', confirmation: 'true' },
    {
      name: 'photo',
      filename: 'oversized-raw-photo.jpg',
      contentType: 'image/jpeg',
      data: oversizedBuffer,
    }
  );

  const overRes = await request(
    {
      hostname: 'localhost',
      port: PORT,
      path: `/api/shipments/courier/${shipment._id}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': oversizedMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    oversizedMultipart.body,
    true
  );
  assert.strictEqual(overRes.status, 400);
  assert(
    overRes.data.message && overRes.data.message.includes('too large'),
    'Error message should indicate file too large'
  );
  console.log(`✓ Server-side 5 MB limit correctly enforced: "${overRes.data.message}"`);

  console.log('\n======================================================');
  console.log('>>> ALL 12 PROOF OF DELIVERY TEST REQUIREMENTS PASSED! <<<');
  console.log('======================================================\n');
}

runLiveIntegrationTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
