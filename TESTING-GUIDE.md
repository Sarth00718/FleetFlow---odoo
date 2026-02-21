# FleetFlow Testing Guide

This guide provides instructions for running all tests and manually verifying the FleetFlow system.

---

## Prerequisites

### 1. Start the Backend Server

```bash
cd FleetFlow/backend

# Install dependencies (if not already done)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
npm run db:migrate

# Seed test user (optional)
npm run seed:testuser

# Start the server
npm start
```

The backend should now be running on `http://localhost:3000`

### 2. Start the Frontend (Optional for API tests)

```bash
cd FleetFlow/frontend

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend should now be running on `http://localhost:5173`

---

## Running Integration Tests

### Test 1: Comprehensive API Endpoint Test

This test validates all API endpoints systematically.

```bash
cd FleetFlow/backend
node test-all-endpoints.js
```

**Expected Output:**
- Health check passes
- Database connection confirmed
- All CRUD operations tested
- Validation rules verified
- Success rate displayed

**What it tests:**
- ✅ Authentication endpoints
- ✅ Vehicle CRUD operations
- ✅ Driver CRUD operations
- ✅ Trip management
- ✅ Service logs
- ✅ Expense tracking
- ✅ Dashboard KPIs
- ✅ Analytics endpoints

### Test 2: Vehicle Endpoints

```bash
cd FleetFlow/backend
node test-vehicles.js
```

**What it tests:**
- Create vehicle
- Get all vehicles
- Filter vehicles by type
- Update vehicle
- Update vehicle status
- Duplicate license plate validation
- Invalid max capacity validation
- Delete vehicle

### Test 3: Trip Model and Associations

```bash
cd FleetFlow/backend
node test-trips.js
```

**What it tests:**
- Database connection
- Trip model attributes
- Trip associations (vehicle, driver)
- Available resources check

### Test 4: Driver Validation

```bash
cd FleetFlow/backend
node test-driver-validation.js
```

**What it tests:**
- Driver creation
- License expiration detection
- Trip completion rate calculation
- Safety score validation

### Test 5: Expense Tracking

```bash
cd FleetFlow/backend
node test-expenses.js
```

**What it tests:**
- Fuel expense logging
- Maintenance expense logging
- Operational cost calculation
- Date range filtering

### Test 6: Service Logs

```bash
cd FleetFlow/backend
node test-service-logs.js
```

**What it tests:**
- Service log creation
- Vehicle status update to "In Shop"
- Service log completion
- Vehicle status restoration to "Available"

### Test 7: Dashboard Analytics

```bash
cd FleetFlow/backend
node test-dashboard-analytics.js
```

**What it tests:**
- Active fleet count
- Maintenance alerts
- Utilization rate calculation
- Pending cargo count
- Dashboard filtering

### Test 8: System Checkpoint

```bash
cd FleetFlow/backend
node test-checkpoint.js
```

**What it tests:**
- Overall system health
- All modules operational
- Database integrity

---

## Manual Testing Workflows

### Workflow 1: Complete Trip Lifecycle

**Objective:** Test the full trip workflow from creation to completion

1. **Login to the system**
   - Navigate to `http://localhost:5173`
   - Login with test credentials

2. **Create a vehicle**
   - Go to Vehicle Registry
   - Click "Add Vehicle"
   - Fill in: Name, Model, License Plate, Type, Max Capacity
   - Submit

3. **Create a driver**
   - Go to Driver Management
   - Click "Add Driver"
   - Fill in: Name, License Number, License Expiry (future date), Safety Score
   - Set status to "On Duty"
   - Submit

4. **Create a trip**
   - Go to Trip Dispatcher
   - Click "Create Trip"
   - Select the vehicle and driver created above
   - Enter cargo weight (less than vehicle capacity)
   - Enter origin, destination, scheduled date
   - Save as Draft

5. **Dispatch the trip**
   - Find the trip in the list
   - Click "Dispatch"
   - Verify vehicle and driver are now unavailable

6. **Complete the trip**
   - Click "Complete" on the dispatched trip
   - Enter final odometer reading (greater than starting odometer)
   - Submit
   - Verify:
     - Trip status is "Completed"
     - Distance calculated correctly
     - Vehicle odometer updated
     - Vehicle and driver are available again

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Vehicle/driver availability managed correctly
- ✅ Odometer tracking works
- ✅ Real-time updates visible (if testing in multiple windows)

### Workflow 2: Vehicle Maintenance

**Objective:** Test the service log workflow

1. **Create a service log**
   - Go to Service Logs
   - Click "Add Service Log"
   - Select a vehicle
   - Choose service type (Preventative/Reactive/Inspection)
   - Enter description and cost
   - Submit

2. **Verify vehicle status**
   - Go to Vehicle Registry
   - Find the vehicle
   - Verify status is "In Shop"
   - Try to create a trip with this vehicle (should not be available)

3. **Complete the service**
   - Go back to Service Logs
   - Find the service log
   - Click "Mark as Completed"

4. **Verify vehicle restored**
   - Go to Vehicle Registry
   - Verify vehicle status is "Available"
   - Vehicle should now be available for trips

**Expected Results:**
- ✅ Vehicle automatically marked "In Shop" on service log creation
- ✅ Vehicle unavailable for trips while in shop
- ✅ Vehicle restored to "Available" on service completion

### Workflow 3: Driver License Validation

**Objective:** Test driver license expiration handling

1. **Create a driver with expired license**
   - Go to Driver Management
   - Create driver with license expiry in the past
   - Set status to "On Duty"

2. **Attempt to create trip**
   - Go to Trip Dispatcher
   - Try to create a trip
   - Verify the driver with expired license is NOT in the available drivers list

3. **Update license expiry**
   - Go back to Driver Management
   - Edit the driver
   - Update license expiry to future date
   - Save

4. **Verify driver now available**
   - Go to Trip Dispatcher
   - Verify driver now appears in available drivers list

**Expected Results:**
- ✅ Drivers with expired licenses excluded from trip assignment
- ✅ Visual indicator shows expired license
- ✅ Updating license expiry makes driver available

### Workflow 4: Cargo Capacity Validation

**Objective:** Test cargo weight validation

1. **Create a vehicle with known capacity**
   - Create vehicle with max capacity = 5000 kg

2. **Attempt to create trip exceeding capacity**
   - Go to Trip Dispatcher
   - Select the vehicle
   - Enter cargo weight = 6000 kg (exceeds capacity)
   - Try to submit

3. **Verify validation error**
   - Should see error message: "Cargo weight exceeds vehicle capacity"
   - Trip should not be created

4. **Create trip within capacity**
   - Change cargo weight to 4000 kg
   - Submit successfully

**Expected Results:**
- ✅ Trips with cargo exceeding capacity are rejected
- ✅ Clear error message displayed
- ✅ Trips within capacity are accepted

### Workflow 5: Dashboard KPIs

**Objective:** Test dashboard metrics and filtering

1. **View dashboard**
   - Go to Command Center Dashboard
   - Observe the 4 KPIs:
     - Active Fleet Count
     - Maintenance Alerts
     - Utilization Rate
     - Pending Cargo

2. **Apply filters**
   - Select vehicle type: "Truck"
   - Observe KPIs update
   - Select status: "Available"
   - Observe KPIs update again

3. **Verify calculations**
   - Active Fleet = vehicles NOT "Out of Service"
   - Maintenance Alerts = vehicles "In Shop" + pending service logs
   - Pending Cargo = trips with "Draft" status

4. **Test auto-refresh**
   - Wait 30 seconds
   - Verify dashboard refreshes automatically

**Expected Results:**
- ✅ All KPIs display correct values
- ✅ Filters update KPIs correctly
- ✅ Auto-refresh works every 30 seconds

### Workflow 6: Real-Time Updates

**Objective:** Test WebSocket real-time synchronization

1. **Open two browser windows**
   - Window 1: `http://localhost:5173`
   - Window 2: `http://localhost:5173`
   - Login to both

2. **Test vehicle status update**
   - Window 1: Create a service log for a vehicle
   - Window 2: Go to Vehicle Registry
   - Verify vehicle status updates to "In Shop" in real-time

3. **Test trip dispatch**
   - Window 1: Dispatch a trip
   - Window 2: Go to Trip Dispatcher
   - Verify vehicle and driver become unavailable in real-time

4. **Test trip completion**
   - Window 1: Complete the trip
   - Window 2: Verify vehicle and driver become available again

**Expected Results:**
- ✅ Status changes propagate to all connected clients
- ✅ No page refresh needed
- ✅ Updates appear within 1-2 seconds

### Workflow 7: Expense Tracking and Analytics

**Objective:** Test expense logging and analytics

1. **Log fuel expenses**
   - Go to Expense Tracking
   - Add fuel expense with liters, cost, date
   - Repeat for multiple vehicles

2. **Log maintenance expenses**
   - Add maintenance expenses for vehicles
   - Include costs and dates

3. **View operational cost**
   - Verify operational cost = sum of fuel + maintenance
   - Test date range filtering

4. **View analytics**
   - Go to Analytics Dashboard
   - View fuel efficiency chart (km/L per vehicle)
   - View ROI comparison
   - Apply date range filter

5. **Export report**
   - Click "Export CSV"
   - Verify CSV file downloads with correct data

**Expected Results:**
- ✅ Expenses logged correctly
- ✅ Operational cost calculated accurately
- ✅ Charts display correct data
- ✅ CSV export works

---

## Validation Checklist

Use this checklist to verify all requirements are met:

### Authentication & Authorization
- [ ] Valid credentials grant access
- [ ] Invalid credentials rejected
- [ ] Forgot password flow works
- [ ] Role-based permissions enforced
- [ ] Session expiration after 24 hours

### Vehicle Registry
- [ ] Create vehicle with all fields
- [ ] Duplicate license plate rejected
- [ ] Update vehicle details
- [ ] Toggle "Out of Service" status
- [ ] Delete vehicle without dependencies
- [ ] Cannot delete vehicle with active trips
- [ ] Search and filter vehicles

### Driver Management
- [ ] Create driver profile
- [ ] License expiration detected
- [ ] Trip completion rate calculated
- [ ] Safety score displayed (0-100)
- [ ] Update driver status (On Duty/Off Duty/Suspended)
- [ ] Suspended drivers excluded from trips
- [ ] Expired license drivers excluded from trips

### Trip Dispatch
- [ ] Create trip with available resources only
- [ ] Cargo capacity validation
- [ ] Trip status: Draft → Dispatched → Completed
- [ ] Trip cancellation works
- [ ] Vehicle/driver marked unavailable on dispatch
- [ ] Vehicle/driver restored on completion/cancellation
- [ ] Odometer validation (final >= starting)
- [ ] Distance calculated correctly
- [ ] Vehicle odometer updated

### Service Logs
- [ ] Create service log
- [ ] Vehicle auto-marked "In Shop"
- [ ] Vehicle unavailable for trips while in shop
- [ ] Complete service log
- [ ] Vehicle restored to "Available"
- [ ] Maintenance history chronological

### Expense Tracking
- [ ] Log fuel expense with liters
- [ ] Log maintenance expense
- [ ] Operational cost calculated
- [ ] Expenses linked to vehicles
- [ ] Date range filtering works
- [ ] Chronological ordering

### Dashboard
- [ ] Active fleet count accurate
- [ ] Maintenance alerts accurate
- [ ] Utilization rate calculated
- [ ] Pending cargo count accurate
- [ ] Filter by vehicle type
- [ ] Filter by status
- [ ] Filter by region
- [ ] Auto-refresh every 30 seconds

### Analytics
- [ ] Fuel efficiency calculated (km/L)
- [ ] ROI calculated
- [ ] Monthly report generated
- [ ] CSV export works
- [ ] Date range filtering
- [ ] Charts display correctly

### Real-Time Features
- [ ] Vehicle status updates propagate
- [ ] Driver status updates propagate
- [ ] Trip dispatch updates propagate
- [ ] Service log updates propagate
- [ ] Multiple clients synchronized

### Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Unique constraints enforced (license plates, license numbers)
- [ ] Check constraints enforced (capacity > 0, safety score 0-100)
- [ ] Cannot delete vehicle with dependencies
- [ ] Cannot delete driver with active trips

---

## Troubleshooting

### Server Won't Start
- Check PostgreSQL is running
- Verify `.env` file exists with correct credentials
- Run `npm run db:migrate` to create tables
- Check port 3000 is not in use

### Tests Fail with "Cannot connect to database"
- Verify PostgreSQL is running
- Check database name, user, and password in `.env`
- Ensure database `fleetflow` exists

### Frontend Can't Connect to Backend
- Verify backend is running on port 3000
- Check CORS configuration in backend `.env`
- Verify frontend is using correct API URL

### Real-Time Updates Not Working
- Check WebSocket connection in browser console
- Verify Socket.io is properly configured
- Check firewall settings

---

## Test Results Summary

After running all tests, document your results:

**Integration Tests:**
- [ ] test-all-endpoints.js: PASS / FAIL
- [ ] test-vehicles.js: PASS / FAIL
- [ ] test-trips.js: PASS / FAIL
- [ ] test-driver-validation.js: PASS / FAIL
- [ ] test-expenses.js: PASS / FAIL
- [ ] test-service-logs.js: PASS / FAIL
- [ ] test-dashboard-analytics.js: PASS / FAIL
- [ ] test-checkpoint.js: PASS / FAIL

**Manual Workflows:**
- [ ] Complete trip lifecycle: PASS / FAIL
- [ ] Vehicle maintenance: PASS / FAIL
- [ ] Driver license validation: PASS / FAIL
- [ ] Cargo capacity validation: PASS / FAIL
- [ ] Dashboard KPIs: PASS / FAIL
- [ ] Real-time updates: PASS / FAIL
- [ ] Expense tracking and analytics: PASS / FAIL

**Overall System Status:** READY / NOT READY

---

## Next Steps

If all tests pass:
1. ✅ System is ready for deployment
2. Consider implementing optional enhancements (property-based tests, unit tests)
3. Conduct security audit
4. Perform load testing

If tests fail:
1. Review error messages
2. Check database schema and migrations
3. Verify environment configuration
4. Review implementation against requirements
5. Fix issues and re-test

---

**Last Updated:** February 21, 2026
