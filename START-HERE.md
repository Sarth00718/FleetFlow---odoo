# 🚀 FleetFlow - Start Here!

## Current Status

✅ **Node.js is installed** (v22.13.1)  
❌ **PostgreSQL is NOT installed** - Required for database

---

## Quick Start (2 Options)

### Option 1: Automatic Setup (Easiest) ⭐

**Step 1:** Install PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Install with default settings
- **Remember your password!** (e.g., `postgres123`)
- Port: `5432` (default)

**Step 2:** Run the automated setup script
```bash
cd FleetFlow
setup-and-run.bat
```

Enter your PostgreSQL password when prompted, and the script will:
- ✅ Create the database
- ✅ Install all dependencies
- ✅ Run migrations
- ✅ Create test user
- ✅ Start both backend and frontend
- ✅ Open your browser automatically

**That's it!** The app will be running at http://localhost:5173

---

### Option 2: Manual Setup

If you prefer to do it step by step, see **QUICKSTART.md**

---

## What You Need to Install

### 1. PostgreSQL (Database)

**Download:** https://www.postgresql.org/download/windows/

**Installation:**
1. Run the installer
2. Keep all default settings
3. Set a password (e.g., `postgres123`) - **REMEMBER THIS!**
4. Port: `5432`
5. Finish installation

**Verify:**
```bash
"C:\Program Files\PostgreSQL\16\bin\psql" --version
```

### 2. You Already Have Node.js ✅
Your system has Node.js v22.13.1 installed - perfect!

---

## After Installing PostgreSQL

Run this command in the FleetFlow folder:

```bash
setup-and-run.bat
```

The script will handle everything else automatically!

---

## Login Credentials

Once the app is running:

**URL:** http://localhost:5173

**Login:**
- Email: `admin@fleetflow.com`
- Password: `admin123`

---

## Need Help?

### PostgreSQL Installation Issues?
See: **INSTALL-POSTGRESQL.md**

### Want to do it manually?
See: **QUICKSTART.md**

### Something not working?
Check the troubleshooting section in **QUICKSTART.md**

---

## What Happens When You Run setup-and-run.bat?

1. ✅ Checks if PostgreSQL and Node.js are installed
2. ✅ Creates `.env` configuration file
3. ✅ Creates `fleetflow` database
4. ✅ Installs backend dependencies (npm install)
5. ✅ Installs frontend dependencies (npm install)
6. ✅ Runs database migrations (creates tables)
7. ✅ Seeds test user account
8. ✅ Starts backend server (port 3000)
9. ✅ Starts frontend server (port 5173)
10. ✅ Opens your browser to http://localhost:5173

**Total time:** ~2-3 minutes (after PostgreSQL is installed)

---

## Quick Test After Setup

1. Login with `admin@fleetflow.com` / `admin123`
2. Click "Vehicle Registry"
3. Click "Add Vehicle"
4. Fill in the form and save
5. You should see your vehicle in the list!

---

## Next Steps

Once running, explore:
- 🚗 Vehicle Registry - Manage your fleet
- 👤 Driver Management - Track drivers
- 📦 Trip Dispatcher - Create and manage trips
- 🔧 Service Logs - Maintenance tracking
- 💰 Expense Tracking - Cost management
- 📊 Dashboard - Real-time KPIs
- 📈 Analytics - Performance reports

---

**Ready?** Install PostgreSQL, then run `setup-and-run.bat` and you're done! 🎉
