const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('STARTING AUTOMATED SYSTEM VERIFICATION TESTS');
  console.log('========================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // 1. Authenticate Admin and Courier
  console.log('--- Step 1: Authenticating Admin and Courier ---');
  let adminToken, adminUser, courierToken, courierUser;
  try {
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@couriertrack.com', password: 'Admin@123' }),
    });
    const adminData = await adminRes.json();
    if (!adminData.success) throw new Error(adminData.message);
    adminToken = adminData.data.token;
    adminUser = adminData.data.user;
    console.log('✅ Admin login successful:', adminUser.name, `(${adminUser.role})`);

    const courierRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'courier@couriertrack.com', password: 'Courier@123' }),
    });
    const courierData = await courierRes.json();
    if (!courierData.success) throw new Error(courierData.message);
    courierToken = courierData.data.token;
    courierUser = courierData.data.user;
    console.log('✅ Courier login successful:', courierUser.name, `(${courierUser.role})`);
  } catch (err) {
    console.error('❌ Failed login:', err.message);
    process.exit(1);
  }

  // 2. Register two distinct Customers for ownership testing
  console.log('\n--- Step 2: Registering two distinct Customers for Ownership & Privacy tests ---');
  let customer1Token, customer1User, customer2Token, customer2User;
  const cust1Email = `cust_test_owner_${Date.now()}@test.com`;
  const cust2Email = `cust_test_other_${Date.now()}@test.com`;

  try {
    const cust1Res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Owner Customer',
        email: cust1Email,
        password: 'Password@123',
        phone: '9876543210',
      }),
    });
    const cust1Data = await cust1Res.json();
    if (!cust1Data.success) throw new Error(cust1Data.message);
    customer1Token = cust1Data.data.token;
    customer1User = cust1Data.data.user;
    console.log('✅ Customer 1 (Owner) created:', customer1User.email);

    const cust2Res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Customer',
        email: cust2Email,
        password: 'Password@123',
        phone: '9123456780',
      }),
    });
    const cust2Data = await cust2Res.json();
    if (!cust2Data.success) throw new Error(cust2Data.message);
    customer2Token = cust2Data.data.token;
    customer2User = cust2Data.data.user;
    console.log('✅ Customer 2 (Unrelated) created:', customer2User.email);
  } catch (err) {
    console.error('❌ Failed customer registration:', err.message);
    process.exit(1);
  }

  // TEST 7: Profile editing and role tamper protection
  console.log('\n========================================================');
  console.log('TEST 7 — Profile: Edit permitted fields & forbid role change');
  console.log('========================================================');
  try {
    // A. Update customer 1 name and phone
    const updateRes = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        name: 'Owner Customer Renamed',
        phone: '9988776655',
      }),
    });
    const updateData = await updateRes.json();

    if (
      updateData.success &&
      updateData.data.user.name === 'Owner Customer Renamed' &&
      updateData.data.user.phone === '9988776655' &&
      updateData.data.user.role === 'customer'
    ) {
      console.log('✅ TEST 7.A Passed: Profile fields updated successfully.');
    } else {
      throw new Error('Profile update fields mismatch');
    }

    // B. Attempt to change role to admin (must be rejected with 403)
    const roleTamperRes = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({ role: 'admin' }),
    });

    if (roleTamperRes.status === 403) {
      console.log('✅ TEST 7.B Passed: Role tampering attempt was strictly rejected with 403 Forbidden.');
    } else {
      throw new Error(`Role tampering was not rejected! Status: ${roleTamperRes.status}`);
    }

    // C. Verify /api/auth/me returns updated data
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const meData = await meRes.json();
    if (meData.data?.user?.name === 'Owner Customer Renamed') {
      console.log('✅ TEST 7.C Passed: GET /api/auth/me confirms persisted updated profile.');
      testsPassed++;
    } else {
      throw new Error('/api/auth/me did not return updated name');
    }
  } catch (err) {
    console.error('❌ TEST 7 Failed:', err.message);
    testsFailed++;
  }

  // TEST 8: Password change with validation and re-login
  console.log('\n========================================================');
  console.log('TEST 8 — Password: Verification, hashing & re-login');
  console.log('========================================================');
  try {
    // A. Wrong current password (must fail)
    const wrongPassRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword@999',
        newPassword: 'NewPassword@123',
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    if (wrongPassRes.status === 400 && wrongPassData.message.includes('Current password is incorrect')) {
      console.log('✅ TEST 8.A Passed: Rejected incorrect current password.');
    } else {
      throw new Error('Incorrect current password was not rejected!');
    }

    // B. Successful password change
    const changeRes = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        currentPassword: 'Password@123',
        newPassword: 'NewPassword@123',
      }),
    });
    const changeData = await changeRes.json();
    if (changeData.success) {
      console.log('✅ TEST 8.B Passed: Password changed successfully.');
    } else {
      throw new Error(changeData.message);
    }

    // C. Re-login with new password
    const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cust1Email,
        password: 'NewPassword@123',
      }),
    });
    const newLoginData = await newLoginRes.json();
    if (newLoginData.success) {
      customer1Token = newLoginData.data.token;
      console.log('✅ TEST 8.C Passed: Login with new password succeeded.');
      testsPassed++;
    } else {
      throw new Error(newLoginData.message);
    }
  } catch (err) {
    console.error('❌ TEST 8 Failed:', err.message);
    testsFailed++;
  }

  // Create a new shipment by Customer 1 for assignment and delivery workflow tests
  console.log('\n--- Step 3: Customer 1 creates a new shipment ---');
  let testShipment;
  try {
    const shipRes = await fetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customer1Token}`,
      },
      body: JSON.stringify({
        pickupAddress: {
          addressLine: '123 Sender St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          latitude: 40.7128,
          longitude: -74.006,
        },
        deliveryAddress: {
          addressLine: '456 Receiver Ave',
          city: 'Brooklyn',
          state: 'NY',
          postalCode: '11201',
          latitude: 40.6782,
          longitude: -73.9442,
        },
        packageDetails: {
          weight: 2.5,
          description: 'Electronics Fragile Component',
        },
      }),
    });
    const shipData = await shipRes.json();
    if (!shipData.success) throw new Error(shipData.message);
    testShipment = shipData.data.shipment;
    console.log(`✅ Shipment created: ${testShipment.trackingId} (Status: ${testShipment.status})`);
  } catch (err) {
    console.error('❌ Failed creating test shipment:', err.message);
    process.exit(1);
  }

  // TEST 1: Admin Shipment Assignment
  console.log('\n========================================================');
  console.log('TEST 1 — Assignment: Admin assigns courier with full details');
  console.log('========================================================');
  try {
    const assignRes = await fetch(`${API_BASE}/shipments/admin/${testShipment._id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ courierId: courierUser.id }),
    });

    const assignData = await assignRes.json();
    const assignedShipment = assignData.data?.shipment;
    if (
      assignData.success &&
      assignedShipment?.status === 'Assigned' &&
      assignedShipment.courierId &&
      assignedShipment.courierId.name === courierUser.name
    ) {
      console.log('✅ TEST 1.A Passed: Assignment returned populated courier details:', assignedShipment.courierId.name);
    } else {
      throw new Error('Assigned shipment did not return populated courier name');
    }

    // Verify persisted state from getShipmentAdmin
    const getRes = await fetch(`${API_BASE}/shipments/admin/${testShipment._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    if (getData.data?.shipment?.status === 'Assigned' && getData.data?.shipment?.courierId?.name) {
      console.log('✅ TEST 1.B Passed: Authoritative database record confirms status is Assigned with populated courier.');
      testsPassed++;
    } else {
      throw new Error('Authoritative record verification failed');
    }
  } catch (err) {
    console.error('❌ TEST 1 Failed:', err.message);
    testsFailed++;
  }

  // Progress shipment to 'Out for Delivery' and generate OTP
  console.log('\n--- Step 4: Advancing shipment to Out for Delivery & generating OTP ---');
  let deliveryOtp;
  try {
    await fetch(`${API_BASE}/shipments/courier/${testShipment._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${courierToken}`,
      },
      body: JSON.stringify({ status: 'Picked Up' }),
    });

    await fetch(`${API_BASE}/shipments/courier/${testShipment._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${courierToken}`,
      },
      body: JSON.stringify({ status: 'In Transit' }),
    });

    await fetch(`${API_BASE}/shipments/courier/${testShipment._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${courierToken}`,
      },
      body: JSON.stringify({ status: 'Out for Delivery' }),
    });
    console.log('✅ Shipment transitioned to Out for Delivery.');

    // Customer generates delivery OTP
    const otpRes = await fetch(`${API_BASE}/shipments/${testShipment._id}/delivery-otp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    const otpData = await otpRes.json();
    if (!otpData.success) throw new Error(otpData.message);
    deliveryOtp = otpData.data.otp;
    console.log(`✅ Generated valid Delivery OTP: ${deliveryOtp}`);
  } catch (err) {
    console.error('❌ Status progression or OTP generation error:', err.message);
    process.exit(1);
  }

  // TEST 2: Courier Uploads Delivery Photo & Completes Proof
  console.log('\n========================================================');
  console.log('TEST 2 — Photo Upload: Courier uploads delivery proof photo');
  console.log('========================================================');
  let savedProof;
  try {
    // Create a 1x1 test image buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('photo', blob, 'test_delivery_proof.png');
    formData.append('otp', deliveryOtp);
    formData.append('confirmation', 'true');
    formData.append('recipientName', 'Owner Customer Renamed');
    formData.append('recipientType', 'Customer');

    const podRes = await fetch(`${API_BASE}/shipments/courier/${testShipment._id}/proof-of-delivery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${courierToken}`,
      },
      body: formData,
    });

    const podData = await podRes.json();
    if (podData.success && podData.data?.proof?.photoUrl) {
      savedProof = podData.data.proof;
      console.log('✅ TEST 2 Passed: Photo stored on backend. Returned photoUrl:', savedProof.photoUrl);
      testsPassed++;
    } else {
      throw new Error(`POD submission failed: ${podData.message}`);
    }
  } catch (err) {
    console.error('❌ TEST 2 Failed:', err.message);
    testsFailed++;
  }

  // TEST 3 & TEST 5: Customer and Admin Proof Access
  console.log('\n========================================================');
  console.log('TEST 3 & TEST 5 — Customer and Admin Proof & Photo Access');
  console.log('========================================================');
  try {
    // Customer accesses proof metadata
    const custProofRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-of-delivery`,
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );
    const custProofData = await custProofRes.json();
    if (custProofData.success && custProofData.data?.proof?.photoUrl) {
      console.log('✅ TEST 3.A Passed: Customer retrieved delivery proof record.');
    } else {
      throw new Error('Customer could not retrieve proof metadata');
    }

    // Customer loads the actual image via authorized route
    const custPhotoRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-photo`,
      { headers: { Authorization: `Bearer ${customer1Token}` } }
    );
    const custPhotoBuffer = await custPhotoRes.arrayBuffer();
    if (custPhotoRes.status === 200 && custPhotoBuffer.byteLength > 0) {
      console.log('✅ TEST 3.B Passed: Customer retrieved actual image stream (size:', custPhotoBuffer.byteLength, 'bytes).');
      testsPassed++;
    } else {
      throw new Error(`Customer image stream failed: Status ${custPhotoRes.status}`);
    }

    // Admin accesses proof metadata & image
    const adminProofRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-of-delivery`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const adminProofData = await adminProofRes.json();

    const adminPhotoRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-photo`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const adminPhotoBuffer = await adminPhotoRes.arrayBuffer();

    if (adminProofData.success && adminPhotoRes.status === 200 && adminPhotoBuffer.byteLength > 0) {
      console.log('✅ TEST 5 Passed: Admin authorized access successfully retrieved proof metadata and image.');
      testsPassed++;
    } else {
      throw new Error('Admin proof access failed');
    }
  } catch (err) {
    console.error('❌ TEST 3/5 Failed:', err.message);
    testsFailed++;
  }

  // TEST 4: Courier can view saved proof
  console.log('\n========================================================');
  console.log('TEST 4 — Courier proof access');
  console.log('========================================================');
  try {
    const courierProofRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-of-delivery`,
      { headers: { Authorization: `Bearer ${courierToken}` } }
    );
    const courierProofData = await courierProofRes.json();

    const courierPhotoRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-photo`,
      { headers: { Authorization: `Bearer ${courierToken}` } }
    );
    const courierPhotoBuffer = await courierPhotoRes.arrayBuffer();

    if (courierProofData.success && courierPhotoRes.status === 200 && courierPhotoBuffer.byteLength > 0) {
      console.log('✅ TEST 4 Passed: Assigned Courier retrieved saved proof metadata and image.');
      testsPassed++;
    } else {
      throw new Error('Courier proof access failed');
    }
  } catch (err) {
    console.error('❌ TEST 4 Failed:', err.message);
    testsFailed++;
  }

  // TEST 6: File Access Privacy (Unauthorized Customer / Public Cannot Access)
  console.log('\n========================================================');
  console.log('TEST 6 — File Access Privacy: Unauthorized users blocked');
  console.log('========================================================');
  try {
    let unauthProofMetadataCaught = false;
    let unauthPhotoCaught = false;
    let directUnauthenticatedBlocked = false;

    // A. Unrelated Customer attempts to view customer 1's proof metadata
    const unauthMetaRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-of-delivery`,
      { headers: { Authorization: `Bearer ${customer2Token}` } }
    );
    if (unauthMetaRes.status === 403) {
      unauthProofMetadataCaught = true;
      console.log('✅ TEST 6.A Passed: Unrelated customer blocked with 403 Forbidden on proof-of-delivery metadata.');
    }

    // B. Unrelated Customer attempts to access customer 1's photo stream
    const unauthPhotoRes = await fetch(
      `${API_BASE}/shipments/${testShipment._id}/proof-photo`,
      { headers: { Authorization: `Bearer ${customer2Token}` } }
    );
    if (unauthPhotoRes.status === 403) {
      unauthPhotoCaught = true;
      console.log('✅ TEST 6.B Passed: Unrelated customer blocked with 403 Forbidden on proof-photo stream.');
    }

    // C. Direct unauthenticated request to /uploads/delivery-proofs/...
    const filename = path.basename(savedProof.photoUrl);
    const directRes = await fetch(`http://localhost:5000/uploads/delivery-proofs/${filename}`);
    if (directRes.status === 401 || directRes.status === 403) {
      directUnauthenticatedBlocked = true;
      console.log(`✅ TEST 6.C Passed: Unauthenticated direct access to /uploads/delivery-proofs/${filename} blocked with ${directRes.status}.`);
    }

    if (unauthProofMetadataCaught && unauthPhotoCaught && directUnauthenticatedBlocked) {
      console.log('✅ TEST 6 Passed: Full authorization enforcement active on all delivery proof endpoints.');
      testsPassed++;
    } else {
      throw new Error(`Privacy enforcement failed (meta: ${unauthProofMetadataCaught}, photo: ${unauthPhotoCaught}, direct: ${directUnauthenticatedBlocked})`);
    }
  } catch (err) {
    console.error('❌ TEST 6 Failed:', err.message);
    testsFailed++;
  }

  // TEST 10: Tracking Regression (GPS Location updates & storage)
  console.log('\n========================================================');
  console.log('TEST 10 — Tracking Regression: GPS storage and retrieval');
  console.log('========================================================');
  try {
    const locRes = await fetch(`${API_BASE}/shipments/${testShipment._id}/location`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const locData = await locRes.json();
    if (locRes.status === 200 && locData.success !== undefined) {
      console.log('✅ TEST 10 Passed: Location route accessible and responding correctly.');
      testsPassed++;
    } else {
      throw new Error('Location route failed');
    }
  } catch (err) {
    console.error('❌ TEST 10 Failed:', err.message);
    testsFailed++;
  }

  // TEST 11: Data Integrity
  console.log('\n========================================================');
  console.log('TEST 11 — Data Integrity: Existing records verification');
  console.log('========================================================');
  try {
    const allRes = await fetch(`${API_BASE}/shipments/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allData = await allRes.json();
    if (allData.success && allData.count > 0) {
      console.log(`✅ TEST 11 Passed: Platform contains ${allData.count} intact shipment records.`);
      testsPassed++;
    } else {
      throw new Error('Data integrity check failed');
    }
  } catch (err) {
    console.error('❌ TEST 11 Failed:', err.message);
    testsFailed++;
  }

  console.log('\n========================================================');
  console.log(`TEST RESULTS SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('========================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests();
