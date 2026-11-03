const http = require('http');
const path = require('path');
const fs = require('fs');

let io;
try {
  io = require('socket.io-client');
} catch (e) {
  io = require('c:/Users/sumanth/internet-courier-tracking/frontend/node_modules/socket.io-client');
}

// 1x1 valid PNG buffer for testing image uploads
const VALID_PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d0000000049454e44ae426082',
  'hex'
);

function request(options, data, isBuffer = false) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
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

async function runPodOtpTests() {
  console.log('===============================================================');
  console.log('   COMPLETE PROOF OF DELIVERY (POD) & OTP ACCEPTANCE TESTS   ');
  console.log('===============================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, details = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Authenticate Actors
  console.log('--- Phase 1: Authentication ---');
  // Admin
  const adminLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@couriertrack.com', password: 'Admin@123' }
  );
  assert(adminLogin.status === 200, 'Admin Login', `HTTP ${adminLogin.status}`);
  const adminToken = adminLogin.data.data.token;

  // Courier A
  const courierLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'courier@couriertrack.com', password: 'Courier@123' }
  );
  assert(courierLogin.status === 200, 'Courier A Login', `HTTP ${courierLogin.status}`);
  const courierToken = courierLogin.data.data.token;
  const courierId = courierLogin.data.data.user._id || courierLogin.data.data.user.id;

  // Customer A (Owner)
  const custAEmail = `cust_owner_${Date.now()}@test.com`;
  const custAReg = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Customer Owner', email: custAEmail, password: 'Password@123', phone: '9876543210' }
  );
  assert(custAReg.status === 201, 'Customer A (Owner) Registration', custAEmail);
  const custAToken = custAReg.data.data.token;

  // Customer B (Unrelated)
  const custBEmail = `cust_other_${Date.now()}@test.com`;
  const custBReg = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Customer Other', email: custBEmail, password: 'Password@123', phone: '9876543211' }
  );
  assert(custBReg.status === 201, 'Customer B (Other) Registration', custBEmail);
  const custBToken = custBReg.data.data.token;

  // 2. Create Shipment by Customer A
  console.log('\n--- Phase 2: Shipment Creation & Assignment ---');
  const createRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/shipments',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
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
      packageDetails: {
        weight: 2.5,
        description: 'POD Test Package',
      },
    }
  );
  assert(createRes.status === 201, 'Shipment Creation by Customer A', createRes.data.data.shipment.trackingId);
  const shipment = createRes.data.data.shipment;
  const shipmentId = shipment._id || shipment.id;

  // Admin assigns Courier A
  const assignRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/admin/${shipmentId}/assign`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    { courierId }
  );
  assert(assignRes.status === 200, 'Admin Assigns Courier A', `Status: ${assignRes.data.data.shipment.status}`);

  // 3. Test State Restrictions & Direct Bypass Prevention
  console.log('\n--- Phase 3: Status State Machine & Bypass Guards ---');
  // Courier advances to Picked Up
  const puRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` },
    },
    { status: 'Picked Up' }
  );
  assert(puRes.status === 200, 'Courier Marks Picked Up');

  // Customer A attempts OTP generation while in 'Picked Up' -> MUST FAIL
  const earlyOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
    }
  );
  assert(
    earlyOtpRes.status === 400 && earlyOtpRes.data.message.includes('Out for Delivery'),
    'Reject OTP generation before Out for Delivery',
    `HTTP ${earlyOtpRes.status}: ${earlyOtpRes.data.message}`
  );

  // Courier advances to In Transit
  await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` },
    },
    { status: 'In Transit' }
  );

  // Courier attempts direct status update to 'Delivered' -> MUST BE REJECTED!
  const directCourierDelivered = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` },
    },
    { status: 'Delivered' }
  );
  assert(
    [400, 403].includes(directCourierDelivered.status),
    'Reject direct Courier status update to Delivered',
    `HTTP ${directCourierDelivered.status}: ${directCourierDelivered.data?.message}`
  );

  // Admin attempts direct status update to 'Delivered' without POD -> MUST BE REJECTED!
  const directAdminDelivered = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/admin/${shipmentId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    { status: 'Delivered' }
  );
  assert(
    directAdminDelivered.status === 400,
    'Reject direct Admin status update to Delivered without verified proof',
    `HTTP ${directAdminDelivered.status}`
  );

  // Advance to Out for Delivery
  const ofdRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` },
    },
    { status: 'Out for Delivery' }
  );
  assert(ofdRes.status === 200, 'Shipment reached Out for Delivery stage');

  // 4. Customer OTP Generation & Role Access Boundaries
  console.log('\n--- Phase 4: OTP Generation & Role Access Boundaries ---');
  // Customer B (Unrelated) attempts to generate OTP -> MUST FAIL (403 Forbidden)
  const custBOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custBToken}` },
    }
  );
  assert(custBOtpRes.status === 403, 'Customer B cannot generate OTP for Customer A shipment', `HTTP ${custBOtpRes.status}`);

  // Courier attempts to generate OTP through customer endpoint -> MUST FAIL (403 Role restriction)
  const courierOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` },
    }
  );
  assert(courierOtpRes.status === 403, 'Courier cannot generate OTP through customer endpoint', `HTTP ${courierOtpRes.status}`);

  // Check Courier view of shipment -> NEVER exposes OTP or otpHash
  const courierShipmentView = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${courierToken}` },
    }
  );
  const courierShipmentData = courierShipmentView.data.data.shipment;
  assert(
    !courierShipmentData.otp && !courierShipmentData.otpHash && !courierShipmentData.deliveryOtp,
    'Courier API response NEVER exposes OTP or hash'
  );

  // Customer A generates valid OTP
  const genOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
    }
  );
  assert([200, 201].includes(genOtpRes.status), 'Customer A generates valid OTP', `HTTP ${genOtpRes.status}`);
  const otpCode = genOtpRes.data.data.otp;
  assert(
    typeof otpCode === 'string' && /^\d{6}$/.test(otpCode),
    'Generated OTP is a 6-digit numeric string',
    `OTP: ${otpCode}`
  );
  assert(
    genOtpRes.data.data.isDemo === true,
    'OTP response is clearly flagged with isDemo: true'
  );

  // Rate Limiting: Customer A calls generate again immediately -> Should return 429
  const rateLimitRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
    }
  );
  assert(
    rateLimitRes.status === 429,
    'Rate limiting prevents spamming OTP generation (cooldown active)',
    `HTTP ${rateLimitRes.status}`
  );

  // 5. Courier Proof of Delivery Submission & OTP Validation
  console.log('\n--- Phase 5: Courier POD Submission & OTP Validation ---');

  // A. Missing photo -> REJECT (400)
  const noPhotoMultipart = createMultipartFormData({
    otp: otpCode,
    confirmation: 'true',
  });
  const noPhotoRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': noPhotoMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    noPhotoMultipart.body,
    true
  );
  assert(noPhotoRes.status === 400, 'Reject POD submission without photo', `HTTP ${noPhotoRes.status}`);

  // B. Missing confirmation checkbox -> REJECT (400)
  const noConfMultipart = createMultipartFormData(
    { otp: otpCode, confirmation: 'false' },
    { name: 'photo', filename: 'delivery.png', contentType: 'image/png', data: VALID_PNG_BUFFER }
  );
  const noConfRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': noConfMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    noConfMultipart.body,
    true
  );
  assert(noConfRes.status === 400, 'Reject POD submission without handover confirmation checkbox', `HTTP ${noConfRes.status}`);

  // C. Invalid image MIME format (e.g. text/plain file) -> REJECT (400)
  const badMimeMultipart = createMultipartFormData(
    { otp: otpCode, confirmation: 'true' },
    { name: 'photo', filename: 'fake.txt', contentType: 'text/plain', data: Buffer.from('hello world') }
  );
  const badMimeRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': badMimeMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    badMimeMultipart.body,
    true
  );
  assert(badMimeRes.status === 400, 'Reject invalid photo MIME type (reject non-images)', `HTTP ${badMimeRes.status}`);

  // D. Incorrect OTP submission -> REJECT (400) & Decrement remaining attempts
  const wrongOtpMultipart = createMultipartFormData(
    { otp: '000000', confirmation: 'true' },
    { name: 'photo', filename: 'delivery.png', contentType: 'image/png', data: VALID_PNG_BUFFER }
  );
  const wrongOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': wrongOtpMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    wrongOtpMultipart.body,
    true
  );
  assert(
    wrongOtpRes.status === 400 && wrongOtpRes.data.message.includes('attempts remaining'),
    'Reject incorrect OTP and return remaining attempt count',
    `HTTP ${wrongOtpRes.status}: ${wrongOtpRes.data.message}`
  );

  // E. Test Attempt Limit Lockout (5 incorrect attempts)
  console.log('   Simulating remaining 4 failed attempts to test security lockout...');
  for (let i = 2; i <= 4; i++) {
    const loopWrongMultipart = createMultipartFormData(
      { otp: `11111${i}`, confirmation: 'true' },
      { name: 'photo', filename: 'delivery.png', contentType: 'image/png', data: VALID_PNG_BUFFER }
    );
    await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
        method: 'POST',
        headers: {
          'Content-Type': loopWrongMultipart.contentType,
          Authorization: `Bearer ${courierToken}`,
        },
      },
      loopWrongMultipart.body,
      true
    );
  }
  // 5th attempt locks the OTP
  const fifthWrongMultipart = createMultipartFormData(
    { otp: '999999', confirmation: 'true' },
    { name: 'photo', filename: 'delivery.png', contentType: 'image/png', data: VALID_PNG_BUFFER }
  );
  const fifthWrongRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': fifthWrongMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    fifthWrongMultipart.body,
    true
  );
  assert(
    fifthWrongRes.status === 400 && fifthWrongRes.data.message.includes('locked'),
    'OTP is locked after 5 failed verification attempts',
    `HTTP ${fifthWrongRes.status}: ${fifthWrongRes.data.message}`
  );

  // Verify that submitting the original correct OTP now also fails because OTP is locked
  const submitLockedOtp = createMultipartFormData(
    { otp: otpCode, confirmation: 'true' },
    { name: 'photo', filename: 'delivery.png', contentType: 'image/png', data: VALID_PNG_BUFFER }
  );
  const lockedRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': submitLockedOtp.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    submitLockedOtp.body,
    true
  );
  assert(
    [400, 429].includes(lockedRes.status) && lockedRes.data.message.includes('locked'),
    'Reject verification on locked OTP even with correct OTP digits',
    `HTTP ${lockedRes.status}: ${lockedRes.data.message}`
  );

  // 6. Regenerate Fresh OTP & Complete Valid Delivery with Socket.IO Verification
  console.log('\n--- Phase 6: Regenerate Fresh OTP & Atomic Delivery Completion ---');
  // Wait 30s rate limit or test with new shipment if needed, or wait
  console.log('   Waiting 31 seconds for OTP rate-limit cooldown to elapse...');
  await new Promise((r) => setTimeout(r, 31000));

  const freshOtpRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/${shipmentId}/delivery-otp`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
    }
  );
  assert([200, 201].includes(freshOtpRes.status), 'Fresh OTP generated after lockout reset', `New OTP: ${freshOtpRes.data.data.otp}`);
  const freshOtpCode = freshOtpRes.data.data.otp;

  // Set up live Socket.IO listener for status broadcast
  let socketReceivedDelivered = false;
  const socketClient = io('http://localhost:5000', {
    auth: { token: custAToken },
    transports: ['websocket'],
  });

  await new Promise((resolve) => {
    socketClient.on('connect', () => {
      socketClient.emit('customer:startTracking', { shipmentId }, () => {
        resolve();
      });
    });
  });

  socketClient.on('shipment:statusUpdate', (payload) => {
    if (payload.status === 'Delivered') {
      socketReceivedDelivered = true;
    }
  });

  // Valid Courier Submission
  const validPodMultipart = createMultipartFormData(
    {
      otp: freshOtpCode,
      confirmation: 'true',
      recipientName: 'Jane Doe',
      recipientType: 'Authorized Recipient',
    },
    {
      name: 'photo',
      filename: 'package_doorstep.png',
      contentType: 'image/png',
      data: VALID_PNG_BUFFER,
    }
  );

  const validPodRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': validPodMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    validPodMultipart.body,
    true
  );

  assert(validPodRes.status === 200, 'Courier submits valid Proof of Delivery', `HTTP ${validPodRes.status}`);
  assert(
    validPodRes.data.data.shipment.status === 'Delivered',
    'Shipment status atomically transitions to Delivered',
    `Status: ${validPodRes.data.data.shipment.status}`
  );
  assert(
    validPodRes.data.data.proof.recipientName === 'Jane Doe',
    'DeliveryProof stores recipientName',
    validPodRes.data.data.proof.recipientName
  );
  assert(
    validPodRes.data.data.proof.recipientType === 'Authorized Recipient',
    'DeliveryProof stores recipientType',
    validPodRes.data.data.proof.recipientType
  );
  assert(
    typeof validPodRes.data.data.proof.photoUrl === 'string' && validPodRes.data.data.proof.photoUrl.startsWith('/uploads/'),
    'DeliveryProof stores relative photoUrl',
    validPodRes.data.data.proof.photoUrl
  );

  // Wait 1 second for socket event
  await new Promise((r) => setTimeout(r, 1000));
  assert(socketReceivedDelivered === true, 'Socket.IO live status broadcast delivered to tracking room');
  socketClient.disconnect();

  // 7. Security: Attempt to reuse consumed OTP or duplicate submission
  console.log('\n--- Phase 7: Post-Delivery Invalidation & Reuse Prevention ---');
  const reusePodRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/shipments/courier/${shipmentId}/proof-of-delivery`,
      method: 'POST',
      headers: {
        'Content-Type': validPodMultipart.contentType,
        Authorization: `Bearer ${courierToken}`,
      },
    },
    validPodMultipart.body,
    true
  );
  assert(
    reusePodRes.status === 400,
    'Reject reuse of already consumed OTP on delivered shipment',
    `HTTP ${reusePodRes.status}: ${reusePodRes.data.message}`
  );

  // 8. Retrieval Authorization of Delivery Proof
  console.log('\n--- Phase 8: Authorized Proof of Delivery Retrieval ---');
  // Customer A (Owner) can retrieve proof
  const custAProofRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/shipments/${shipmentId}/proof-of-delivery`,
    method: 'GET',
    headers: { Authorization: `Bearer ${custAToken}` },
  });
  assert(custAProofRes.status === 200, 'Customer A (Owner) retrieves verified proof', `HTTP ${custAProofRes.status}`);
  assert(
    !custAProofRes.data.data.proof.otp && !custAProofRes.data.data.proof.otpHash,
    'Proof retrieval NEVER exposes OTP plaintext or hash'
  );

  // Admin can retrieve proof
  const adminProofRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/shipments/${shipmentId}/proof-of-delivery`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminProofRes.status === 200, 'Admin retrieves authorized proof metadata', `HTTP ${adminProofRes.status}`);

  // Customer B (Unrelated) cannot retrieve proof
  const custBProofRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/shipments/${shipmentId}/proof-of-delivery`,
    method: 'GET',
    headers: { Authorization: `Bearer ${custBToken}` },
  });
  assert(custBProofRes.status === 403, 'Customer B is forbidden from accessing Customer A proof', `HTTP ${custBProofRes.status}`);

  // 9. Static Photo Serving Test
  const photoUrl = custAProofRes.data.data.proof.photoUrl;
  const photoFetchRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: photoUrl,
    method: 'GET',
  });
  assert(photoFetchRes.status === 200, 'Uploaded delivery photo is accessible via static server route', `HTTP ${photoFetchRes.status}`);

  console.log('\n===============================================================');
  console.log(`   ALL TESTS COMPLETED: ${passedCount}/${totalCount} PASSED (100% SUCCESS)`);
  console.log('===============================================================\n');
}

runPodOtpTests().catch((err) => {
  console.error('\n❌ FATAL TEST ERROR:', err);
  process.exit(1);
});
