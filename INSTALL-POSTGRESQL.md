# PostgreSQL Installation Guide for Windows

FleetFlow requires PostgreSQL to run. Follow these steps to install it:

---

## Option 1: Quick Install (Recommended)

### Step 1: Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Download the latest version (PostgreSQL 16.x)

### Step 2: Run the Installer
1. Double-click the downloaded `.exe` file
2. Click "Next" through the welcome screens
3. **Installation Directory:** Keep default (`C:\Program Files\PostgreSQL\16`)
4. **Select Components:** Keep all selected (PostgreSQL Server, pgAdmin 4, Command Line Tools)
5. **Data Directory:** Keep default
6. **Password:** Enter a password and REMEMBER IT! (e.g., `postgres123`)
7. **Port:** Keep default `5432`
8. **Locale:** Keep default
9. Click "Next" and then "Finish"

### Step 3: Verify Installation
1. Open Command Prompt (Win + R, type `cmd`, press Enter)
2. Run: `"C:\Program Files\PostgreSQL\16\bin\psql" --version`
3. You should see: `psql (PostgreSQL) 16.x`

---

## Option 2: Using Docker (Alternative)

If you prefer Docker:

```bash
docker run --name fleetflow-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=fleetflow -p 5432:5432 -d postgres:16
```

---

## After Installation

Once PostgreSQL is installed, come back and I'll set up the database and run the project for you!

**What you'll need:**
- PostgreSQL password you set during installation
- Port: 5432 (default)

---

## Quick Test

To verify PostgreSQL is working:

```bash
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -c "SELECT version();"
```

Enter your password when prompted. You should see PostgreSQL version information.

---

**Next Step:** After installing PostgreSQL, let me know and I'll complete the setup automatically!
