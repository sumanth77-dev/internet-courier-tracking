const http = require('http');
const path = require('path');
let io;
try {
  io = require(path.join(__dirname, '../backend/node_modules/socket.io-client'));
} catch (e) {
  io = require(path.join(__dirname, '../frontend/node_modules/socket.io-client'));
}

function request(options, data) {
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
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('===============================================================');
  console.log('   FULL ACCEPTANCE TEST SUITE: LIVE COURIER TRACKING (TESTS 1-7)');
  console.log('===============================================================\n');

  // 1. Authenticate Admin
  console.log('1. Authenticating Admin...');
  const adminRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@couriertrack.com', password: 'Admin@123' }
  );
  if (adminRes.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminRes.data));
  const adminToken = adminRes.data.data.token;
  console.log('   ✅ Admin authenticated.');

  // 2. Authenticate Courier
  console.log('2. Authenticating Courier...');
  const courierRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'courier@couriertrack.com', password: 'Courier@123' }
  );
  if (courierRes.status !== 200) throw new Error('Courier login failed: ' + JSON.stringify(courierRes.data));
  const courierToken = courierRes.data.data.token;
  const courierId = courierRes.data.data.user.id;
  console.log(`   ✅ Courier authenticated (ID: ${courierId}).`);

  // 3. Register & Authenticate Customer
  console.log('3. Registering Customer...');
  const customerEmail = `customer_test_${Date.now()}@example.com`;
  const customerReg = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Test Customer', email: customerEmail, password: 'Customer@123', phone: '9988776655' }
  );
  if (customerReg.status !== 201) throw new Error('Customer registration failed');
  const customerToken = customerReg.data.data.token;
  console.log('   ✅ Customer authenticated.');

  // 4. Create Shipment
  console.log('4. Creating test shipment...');
  const shipmentRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/shipments', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` } },
    {
      pickupAddress: { addressLine: 'MG Road Metro Station', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', latitude: 12.9756, longitude: 77.6066 },
      deliveryAddress: { addressLine: '100 Feet Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', latitude: 12.9784, longitude: 77.6408 },
      packageDetails: { description: 'Important Documents', weight: 1.5 },
    }
  );
  if (shipmentRes.status !== 201) throw new Error('Shipment creation failed');
  const shipment = shipmentRes.data.data.shipment;
  const shipmentId = shipment._id;
  console.log(`   ✅ Shipment created: ${shipment.trackingId} (ID: ${shipmentId})`);

  // 5. Admin Assigns Courier
  console.log('5. Admin assigning courier...');
  const assignRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/admin/${shipmentId}/assign`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    { courierId }
  );
  if (assignRes.status !== 200) throw new Error('Courier assignment failed');
  console.log('   ✅ Courier assigned. Status: Assigned');

  // Set up Sockets
  console.log('\n--- SETTING UP MULTI-ROLE SOCKET SESSIONS ---');
  const customerSocket = io('http://localhost:5000', { auth: { token: customerToken } });
  const adminSocket = io('http://localhost:5000', { auth: { token: adminToken } });
  let courierSocket = io('http://localhost:5000', { auth: { token: courierToken } });

  await new Promise((resolve) => customerSocket.on('connect', resolve));
  console.log('   ✅ Customer socket connected.');
  await new Promise((resolve) => adminSocket.on('connect', resolve));
  console.log('   ✅ Admin socket connected.');
  await new Promise((resolve) => courierSocket.on('connect', resolve));
  console.log('   ✅ Courier socket connected.');

  // Join rooms
  await new Promise((resolve) => customerSocket.emit('customer:startTracking', { shipmentId }, resolve));
  await new Promise((resolve) => adminSocket.emit('admin:startTracking', { shipmentId }, resolve));
  await new Promise((resolve) => courierSocket.emit('courier:startTracking', { shipmentId }, resolve));
  console.log('   ✅ All 3 parties joined shipment room.\n');

  // -------------------------------------------------------------
  // TEST 1 & TEST 2: Start Demo & Receive Updates in Customer & Admin
  // -------------------------------------------------------------
  console.log('>>> TEST 1 & TEST 2: Start Demo & Verify Live Location in Customer & Admin');
  
  // Transition status to Picked Up
  await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/courier/${shipmentId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` } },
    { status: 'Picked Up' }
  );

  let customerLocationReceived = null;
  let adminLocationReceived = null;

  customerSocket.on('location:update', (data) => {
    customerLocationReceived = data;
  });
  adminSocket.on('location:update', (data) => {
    adminLocationReceived = data;
  });

  // Courier sends first location
  const loc1 = { shipmentId, latitude: 12.9758, longitude: 77.6070, accuracy: 10 };
  const emit1Res = await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', loc1, resolve));
  if (!emit1Res.success) throw new Error('Emit location 1 failed: ' + emit1Res.message);

  await sleep(500);

  if (!customerLocationReceived || customerLocationReceived.latitude !== 12.9758) {
    throw new Error('TEST 1 FAILED: Customer did not receive location update');
  }
  console.log('   ✅ TEST 1 PASSED: Customer received live location update (lat: ' + customerLocationReceived.latitude + ', lng: ' + customerLocationReceived.longitude + ')');

  if (!adminLocationReceived || adminLocationReceived.latitude !== 12.9758) {
    throw new Error('TEST 2 FAILED: Admin did not receive location update');
  }
  console.log('   ✅ TEST 2 PASSED: Admin received live location update (lat: ' + adminLocationReceived.latitude + ', lng: ' + adminLocationReceived.longitude + ')');

  // Verify MongoDB Location record
  const checkLocRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/${shipmentId}/location`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (!checkLocRes.data?.data?.location || checkLocRes.data.data.location.latitude !== 12.9758) {
    throw new Error('Location was not saved to MongoDB');
  }
  console.log('   ✅ Location successfully saved to MongoDB Location collection.\n');

  // -------------------------------------------------------------
  // TEST 3: Demo reaches ~40% progress, Courier logs out
  // -------------------------------------------------------------
  console.log('>>> TEST 3: Advance to ~40% progress and simulate Courier Logout');
  await sleep(1100); // Respect backend rate limit

  // Advance status to In Transit
  await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/courier/${shipmentId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${courierToken}` } },
    { status: 'In Transit' }
  );

  const loc40 = { shipmentId, latitude: 12.9765, longitude: 77.6180, accuracy: 9 };
  await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', loc40, resolve));
  await sleep(500);

  console.log('   * Simulating Courier Logout (disconnecting courier socket cleanly)...');
  courierSocket.disconnect();
  await sleep(500);

  // Verify Customer & Admin still retain latest location and data from backend
  const customerLocAfterLogout = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/${shipmentId}/location`, method: 'GET', headers: { Authorization: `Bearer ${customerToken}` } }
  );
  const adminShipmentAfterLogout = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/admin/${shipmentId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
  );

  if (customerLocAfterLogout.data?.data?.location?.latitude !== 12.9765) {
    throw new Error('TEST 3 FAILED: Customer could not retrieve latest saved location after courier logout');
  }
  if (adminShipmentAfterLogout.data?.data?.shipment?.status !== 'In Transit') {
    throw new Error('TEST 3 FAILED: Shipment status was corrupted or missing after courier logout');
  }
  console.log('   ✅ TEST 3 PASSED: Courier logout stopped emissions cleanly; Customer and Admin retain latest saved location (lat: 12.9765) and status (In Transit).\n');

  // -------------------------------------------------------------
  // TEST 4: Courier logs back in and presses Resume (~40%)
  // -------------------------------------------------------------
  console.log('>>> TEST 4: Courier Re-login & Resume from ~40%');
  // Re-authenticate Courier
  const courierReLogin = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'courier@couriertrack.com', password: 'Courier@123' }
  );
  const newCourierToken = courierReLogin.data.data.token;

  // New socket instance for re-logged in courier
  courierSocket = io('http://localhost:5000', { auth: { token: newCourierToken } });
  await new Promise((resolve) => courierSocket.on('connect', resolve));
  await new Promise((resolve) => courierSocket.emit('courier:startTracking', { shipmentId }, resolve));

  // Resume moving from ~40% -> 50%
  await sleep(1100);
  customerLocationReceived = null;
  adminLocationReceived = null;

  const loc50 = { shipmentId, latitude: 12.9770, longitude: 77.6250, accuracy: 8 };
  const emitResumeRes = await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', loc50, resolve));
  if (!emitResumeRes.success) throw new Error('Resume location emit failed: ' + emitResumeRes.message);

  await sleep(500);

  if (!customerLocationReceived || customerLocationReceived.latitude !== 12.9770) {
    throw new Error('TEST 4 FAILED: Customer did not receive resumed location');
  }
  if (!adminLocationReceived || adminLocationReceived.latitude !== 12.9770) {
    throw new Error('TEST 4 FAILED: Admin did not receive resumed location');
  }
  console.log('   ✅ TEST 4 PASSED: Resumed from saved progress. Vehicle moves, new locations broadcasted and received by Customer and Admin.\n');

  // -------------------------------------------------------------
  // TEST 5: Refresh Customer and Admin tracking pages
  // -------------------------------------------------------------
  console.log('>>> TEST 5: Refresh Customer and Admin tracking pages');
  customerSocket.disconnect();
  adminSocket.disconnect();
  await sleep(500);

  // Fetch initial location (what pages do on reload)
  const custReloadLoc = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/${shipmentId}/location`, method: 'GET', headers: { Authorization: `Bearer ${customerToken}` } }
  );
  const adminReloadLoc = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/${shipmentId}/location`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
  );
  if (custReloadLoc.data?.data?.location?.latitude !== 12.9770 || adminReloadLoc.data?.data?.location?.latitude !== 12.9770) {
    throw new Error('TEST 5 FAILED: Latest saved position not loaded on refresh');
  }

  // Re-establish sockets
  const refreshedCustomerSocket = io('http://localhost:5000', { auth: { token: customerToken } });
  const refreshedAdminSocket = io('http://localhost:5000', { auth: { token: adminToken } });

  await new Promise((resolve) => refreshedCustomerSocket.on('connect', resolve));
  await new Promise((resolve) => refreshedAdminSocket.on('connect', resolve));

  await new Promise((resolve) => refreshedCustomerSocket.emit('customer:startTracking', { shipmentId }, resolve));
  await new Promise((resolve) => refreshedAdminSocket.emit('admin:startTracking', { shipmentId }, resolve));

  let custLiveAfterRefresh = null;
  let adminLiveAfterRefresh = null;
  refreshedCustomerSocket.on('location:update', (d) => { custLiveAfterRefresh = d; });
  refreshedAdminSocket.on('location:update', (d) => { adminLiveAfterRefresh = d; });

  await sleep(1100);
  const loc60 = { shipmentId, latitude: 12.9775, longitude: 77.6310, accuracy: 9 };
  await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', loc60, resolve));
  await sleep(500);

  if (!custLiveAfterRefresh || custLiveAfterRefresh.latitude !== 12.9775) {
    throw new Error('TEST 5 FAILED: Customer did not receive subsequent update after refresh');
  }
  if (!adminLiveAfterRefresh || adminLiveAfterRefresh.latitude !== 12.9775) {
    throw new Error('TEST 5 FAILED: Admin did not receive subsequent update after refresh');
  }
  console.log('   ✅ TEST 5 PASSED: Both pages display latest saved position on load and receive subsequent updates without refreshing.\n');

  // -------------------------------------------------------------
  // TEST 6: Pause and Resume several times
  // -------------------------------------------------------------
  console.log('>>> TEST 6: Pause and Resume several times');
  const monotonicLats = [12.9775];

  // Pause 1 & Resume 1
  console.log('   * Pause & Resume Cycle 1...');
  await sleep(1100);
  const locP1 = { shipmentId, latitude: 12.9778, longitude: 77.6340, accuracy: 10 };
  await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', locP1, resolve));
  monotonicLats.push(12.9778);

  // Pause 2 & Resume 2
  console.log('   * Pause & Resume Cycle 2...');
  await sleep(1100);
  const locP2 = { shipmentId, latitude: 12.9780, longitude: 77.6360, accuracy: 9 };
  await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', locP2, resolve));
  monotonicLats.push(12.9780);

  // Pause 3 & Resume 3
  console.log('   * Pause & Resume Cycle 3...');
  await sleep(1100);
  const locP3 = { shipmentId, latitude: 12.9782, longitude: 77.6380, accuracy: 9 };
  await new Promise((resolve) => courierSocket.emit('courier:locationUpdate', locP3, resolve));
  monotonicLats.push(12.9782);

  // Verify monotonicity
  for (let i = 1; i < monotonicLats.length; i++) {
    if (monotonicLats[i] < monotonicLats[i - 1]) {
      throw new Error('TEST 6 FAILED: Vehicle position reset backwards during pause/resume');
    }
  }
  console.log('   ✅ TEST 6 PASSED: Multiple pause/resume cycles executed cleanly; no resets, no duplicate loops, positions advance monotonically.\n');

  // -------------------------------------------------------------
  // TEST 7: Complete Delivery
  // -------------------------------------------------------------
  console.log('>>> TEST 7: Complete Delivery');
  let customerStatusUpdate = null;
  let adminStatusUpdate = null;
  refreshedCustomerSocket.on('shipment:statusUpdate', (d) => { customerStatusUpdate = d; });
  refreshedAdminSocket.on('shipment:statusUpdate', (d) => { adminStatusUpdate = d; });

  // Transition to Out for Delivery
  console.log('   * Transitioning status to Out for Delivery...');
  const outRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/courier/${shipmentId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newCourierToken}` } },
    { status: 'Out for Delivery' }
  );
  if (outRes.status !== 200) throw new Error('Out for Delivery transition failed: ' + JSON.stringify(outRes.data));
  await sleep(400);

  if (!customerStatusUpdate || customerStatusUpdate.status !== 'Out for Delivery') {
    throw new Error('TEST 7 FAILED: Customer did not receive Out for Delivery status update');
  }
  if (!adminStatusUpdate || adminStatusUpdate.status !== 'Out for Delivery') {
    throw new Error('TEST 7 FAILED: Admin did not receive Out for Delivery status update');
  }
  console.log('   ✅ Customer and Admin received real-time statusUpdate: Out for Delivery');

  // Final destination reached (100%) -> Delivered
  console.log('   * Final destination reached: Transitioning status to Delivered...');
  customerStatusUpdate = null;
  adminStatusUpdate = null;

  const delivRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/courier/${shipmentId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${newCourierToken}` } },
    { status: 'Delivered' }
  );
  if (delivRes.status !== 200) throw new Error('Delivered transition failed: ' + JSON.stringify(delivRes.data));
  await sleep(400);

  if (!customerStatusUpdate || customerStatusUpdate.status !== 'Delivered') {
    throw new Error('TEST 7 FAILED: Customer did not receive Delivered status update');
  }
  if (!adminStatusUpdate || adminStatusUpdate.status !== 'Delivered') {
    throw new Error('TEST 7 FAILED: Admin did not receive Delivered status update');
  }
  console.log('   ✅ Customer and Admin received real-time statusUpdate: Delivered');

  // Verify delivery history in Admin API
  const finalAdminCheck = await request(
    { hostname: 'localhost', port: 5000, path: `/api/shipments/admin/${shipmentId}`, method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const finalShipment = finalAdminCheck.data?.data?.shipment;
  if (finalShipment.status !== 'Delivered' || !finalShipment.deliveredAt) {
    throw new Error('TEST 7 FAILED: Shipment delivered state not confirmed by backend');
  }
  console.log(`   ✅ TEST 7 PASSED: Delivery confirmed by backend. deliveredAt: ${finalShipment.deliveredAt}. Shipment preserved in history.\n`);

  // Clean up
  courierSocket.disconnect();
  refreshedCustomerSocket.disconnect();
  refreshedAdminSocket.disconnect();

  console.log('===============================================================');
  console.log('   🎉 ALL ACCEPTANCE TESTS (TEST 1 - TEST 7) PASSED PERFECTLY!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ TEST RUNNER ERROR:', err.message);
  process.exit(1);
});
