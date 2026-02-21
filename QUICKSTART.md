# FleetFlow - Quick Start Guide

Get the FleetFlow system up and running in minutes!

---

## Prerequisites

Before you start, make sure you have:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
3. **Git** (optional, for version control)

---

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port is `5432` (keep this)

### Verify PostgreSQL is running
Open Command Prompt and run:
```bash
psql --version
```

---

## Step 2: Create Database

Open **pgAdmin** (installed with PostgreSQL) or use command line:

### Using pgAdmin:
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name it: `fleetflow`
5. Click "Save"

### Using Command Line:
```bash
psql -U postgres
CREATE DATABASE fleetflow;
\q
```

---

## Step 3: Set Up Backend

### 3.1 Navigate to backend folder
```bash
cd FleetFlow/backend
```

### 3.2 Install dependencies
```bash
npm install
```

### 3.3 Create environment file
```bash
copy .env.example .env
```

### 3.4 Edit .env file
Open `.env` in a text editor and update these values:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetflow
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password!

### 3.5 Run database migrations
```bash
npm run db:migrate
```

You should see output like:
```
✓ Database connected successfully
✓ Creating tables...
✓ All tables created successfully
```

### 3.6 (Optional) Seed test user
```bash
npm run seed:testuser
```

This creates a test user:
- Email: `admin@fleetflow.com`
- Password: `admin123`

### 3.7 Start the backend server
```bash
npm start
```

You should see:
```
Server running on port 3000
Database connected successfully
WebSocket server initialized
```

**Keep this terminal window open!** The backend server needs to stay running.

---

## Step 4: Set Up Frontend

### 4.1 Open a NEW terminal window

### 4.2 Navigate to frontend folder
```bash
cd FleetFlow/frontend
```

### 4.3 Install dependencies
```bash
npm install
```

### 4.4 Start the frontend development server
```bash
npm run dev
```

You should see:
```
VITE v5.0.11  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal window open too!**

---

## Step 5: Access the Application

1. Open your web browser
2. Go to: **http://localhost:5173**
3. You should see the FleetFlow login page!

### Login Credentials (if you ran seed:testuser)
- **Email:** `admin@fleetflow.com`
- **Password:** `admin123`

---

## Quick Test

After logging in, try these quick tests:

### Test 1: Create a Vehicle
1. Click "Vehicle Registry" in the navigation
2. Click "Add Vehicle"
3. Fill in:
   - Name: `Test Truck 1`
   - Model: `Ford F-150`
   - License Plate: `ABC-123`
   - Type: `Truck`
   - Max Capacity: `5000`
   - Initial Odometer: `0`
   - Region: `North`
4. Click "Save"
5. You should see the vehicle in the list!

### Test 2: Create a Driver
1. Click "Driver Management"
2. Click "Add Driver"
3. Fill in:
   - Name: `John Doe`
   - License Number: `DL-12345`
   - License Expiry: (pick a future date)
   - Safety Score: `100`
   - Status: `On Duty`
4. Click "Save"

### Test 3: View Dashboard
1. Click "Dashboard" in the navigation
2. You should see KPIs:
   - Active Fleet: 1
   - Maintenance Alerts: 0
   - Utilization Rate: 0%
   - Pending Cargo: 0

---

## Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
1. Make sure PostgreSQL is running
2. Check your `.env` file has correct database credentials
3. Verify database `fleetflow` exists
4. Try running migrations again: `npm run db:migrate`

### Problem: "Port 3000 already in use"

**Solution:**
1. Close any other applications using port 3000
2. Or change the port in `.env` file:
   ```env
   PORT=3001
   ```
3. Also update frontend API URL in `frontend/src/utils/api.js`

### Problem: "npm: command not found"

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart your terminal
3. Verify with: `node --version`

### Problem: Frontend shows "Network Error"

**Solution:**
1. Make sure backend is running (check terminal)
2. Backend should be on `http://localhost:3000`
3. Check browser console for errors (F12)
4. Verify CORS_ORIGIN in backend `.env` matches frontend URL

### Problem: "psql: command not found"

**Solution:**
1. Add PostgreSQL to your PATH:
   - Windows: `C:\Program Files\PostgreSQL\15\bin`
2. Or use pgAdmin instead of command line

---

## Running Tests

### Backend Integration Tests

With the backend server running, open a new terminal:

```bash
cd FleetFlow/backend
node test-all-endpoints.js
```

This will test all API endpoints and show you a success rate.

---

## Stopping the Application

### Stop Backend
In the backend terminal, press: `Ctrl + C`

### Stop Frontend
In the frontend terminal, press: `Ctrl + C`

---

## Next Steps

Now that your system is running:

1. **Explore the modules:**
   - Vehicle Registry
   - Driver Management
   - Trip Dispatcher
   - Service Logs
   - Expense Tracking
   - Analytics

2. **Read the documentation:**
   - `TESTING-GUIDE.md` - Comprehensive testing instructions
   - `FINAL-CHECKPOINT-REPORT.md` - System status and features
   - `CORRECTNESS-PROPERTIES-STATUS.md` - Property validation status

3. **Try the workflows:**
   - Create a complete trip lifecycle
   - Add a vehicle to maintenance
   - Log expenses and view analytics

---

## Common Commands Reference

### Backend Commands
```bash
cd FleetFlow/backend

npm install              # Install dependencies
npm start               # Start server
npm run dev             # Start with auto-reload (nodemon)
npm run db:migrate      # Run database migrations
npm run seed:testuser   # Create test user
node test-all-endpoints.js  # Run integration tests
```

### Frontend Commands
```bash
cd FleetFlow/frontend

npm install             # Install dependencies
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
```

---

## Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review the error messages in the terminal
3. Check browser console (F12) for frontend errors
4. Verify all prerequisites are installed
5. Make sure both backend and frontend are running

---

**Congratulations!** 🎉 You now have FleetFlow running locally!

Enjoy exploring the fleet management system!
