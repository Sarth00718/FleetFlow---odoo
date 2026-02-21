# Checkpoint 5: Backend Foundation Verification Guide

## Overview
This checkpoint verifies that the backend foundation (Tasks 1-4) is complete and ready for the next phase of development.

## Prerequisites

### 1. Database Setup
You need a PostgreSQL database running. If you haven't set one up yet:

**Option A: Local PostgreSQL**
- Install PostgreSQL on your machine
- Create a database named `fleetflow`
- Note your database credentials

**Option B: Docker PostgreSQL**
```bash
docker run --name fleetflow-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fleetflow -p 5432:5432 -d postgres
```

### 2. Environment Configuration
Create a `.env` file in the `FleetFlow/backend` directory:

```bash
cp .env.example .env
```

Then edit `.env` with your database credentials:
```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetflow
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Install Dependencies
```bash
npm install
```

## Verification Steps

### Step 1: Run Database Migration
This will create all the required tables with constraints:

```bash
npm run db:migrate
```

**Expected Output:**
```
Testing database connection...
Database connection established successfully.
Synchronizing database schema...
Database schema synchronized successfully.
```

### Step 2: Seed Test User (Optional)
Create a test user for authentication testing:

```bash
npm run seed:testuser
```

**Expected Output:**
```
Test user created successfully!
Email: admin@fleetflow.com
Password: Admin123!
Role: Fleet Manager
```

### Step 3: Run Automated Checkpoint Tests
```bash
node test-checkpoint.js
```

**Expected Results:**
- ✓ Database connection successful
- ✓ Database schema synchronized
- ✓ All 6 models defined (User, Vehicle, Driver, Trip, ServiceLog, Expense)
- ✓ License plate uniqueness constraint working
- ✓ Max capacity validation constraint working
- ✓ Foreign key integrity constraint working
- ✓ Password hashing and verification working
- ✓ All 4 model associations defined

### Step 4: Start the Server
```bash
npm run dev
```

**Expected Output:**
```
Database connection established successfully.
FleetFlow API server running on port 3000
Environment: development
```

### Step 5: Test Health Endpoint
Open a new terminal and run:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{"status":"ok","message":"FleetFlow API is running"}
```

### Step 6: Test Database Status Endpoint
```bash
curl http://localhost:3000/api/db-status
```

**Expected Response:**
```json
{"status":"connected","message":"Database connection successful"}
```

### Step 7: Test Authentication Flow

#### 7.1 Login with Test User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fleetflow.com\",\"password\":\"Admin123!\"}"
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@fleetflow.com",
    "role": "Fleet Manager"
  }
}
```

#### 7.2 Test Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fleetflow.com\",\"password\":\"WrongPassword\"}"
```

**Expected Response:**
```json
{"error":"Invalid credentials"}
```

#### 7.3 Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@fleetflow.com\"}"
```

**Expected Response:**
```json
{"message":"If an account exists with this email, a password reset link has been sent"}
```

### Step 8: Test Vehicle Endpoints
Run the comprehensive vehicle test script:

```bash
node test-vehicles.js
```

**Expected Results:**
- ✓ Vehicle created
- ✓ Retrieved all vehicles
- ✓ Filtered vehicles by type
- ✓ Vehicle updated
- ✓ Vehicle status updated
- ✓ Duplicate license plate rejected
- ✓ Invalid max capacity rejected
- ✓ Vehicle deleted

### Step 9: Test Driver Validation Logic
```bash
node test-driver-validation.js
```

**Expected Results:**
- ✓ All validation logic tests pass
- ✓ License expiration detection working
- ✓ Safety score validation working
- ✓ Trip completion rate calculation working

## Verification Checklist

Use this checklist to confirm all backend foundation components are complete:

### Task 1: Project Setup and Database Schema
- [ ] Node.js backend initialized with Express
- [ ] PostgreSQL database connection configured
- [ ] All 6 database tables created (users, vehicles, drivers, trips, service_logs, expenses)
- [ ] Database constraints working (unique, check, foreign key)
- [ ] Indexes created for performance
- [ ] JWT authentication configured
- [ ] CORS configured
- [ ] Environment variables set up

### Task 2: Authentication System
- [ ] POST /api/auth/login endpoint working
- [ ] POST /api/auth/forgot-password endpoint working
- [ ] POST /api/auth/reset-password endpoint working
- [ ] Password hashing with bcrypt working
- [ ] JWT token generation working
- [ ] JWT verification middleware working
- [ ] Role-based access control (RBAC) middleware working
- [ ] Session expiration handling working

### Task 3: Vehicle Registry Backend
- [ ] GET /api/vehicles endpoint working
- [ ] POST /api/vehicles endpoint working
- [ ] PUT /api/vehicles/:id endpoint working
- [ ] DELETE /api/vehicles/:id endpoint working
- [ ] PATCH /api/vehicles/:id/status endpoint working
- [ ] License plate uniqueness validation working
- [ ] Max capacity validation working
- [ ] Filtering by type, status, region working

### Task 4: Driver Management Backend
- [ ] GET /api/drivers endpoint working
- [ ] POST /api/drivers endpoint working
- [ ] PUT /api/drivers/:id endpoint working
- [ ] DELETE /api/drivers/:id endpoint working
- [ ] License expiry validation working
- [ ] License expiration detection working
- [ ] Trip completion rate calculation working
- [ ] Safety score validation working

## Common Issues and Solutions

### Issue: Database connection failed
**Solution:** 
- Verify PostgreSQL is running
- Check .env file has correct database credentials
- Ensure database `fleetflow` exists

### Issue: JWT_SECRET not defined
**Solution:**
- Add JWT_SECRET to your .env file
- Use a strong random string (at least 32 characters)

### Issue: Port 3000 already in use
**Solution:**
- Change PORT in .env file to another port (e.g., 3001)
- Or stop the process using port 3000

### Issue: Module not found errors
**Solution:**
- Run `npm install` to install all dependencies
- Ensure you're in the FleetFlow/backend directory

## Next Steps

Once all verification steps pass:
1. ✓ Backend foundation is complete
2. ✓ Ready to proceed to Task 6: Trip Dispatch Backend
3. ✓ All database constraints are working correctly
4. ✓ Authentication flow is functional

## Questions or Issues?

If you encounter any issues during verification:
1. Check the error messages carefully
2. Review the .env configuration
3. Verify database is running and accessible
4. Check the console logs for detailed error information
5. Ask for help if needed!
