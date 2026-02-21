# FleetFlow Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
```bash
cd FleetFlow/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE fleetflow;
```

4. Copy the environment file and configure it:
```bash
copy .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetflow
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd FleetFlow/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Verify Setup

1. Check backend health:
```bash
curl http://localhost:3000/health
```

2. Check database connection:
```bash
curl http://localhost:3000/api/db-status
```

3. Open browser to `http://localhost:5173` to see the frontend

## Database Schema

The following tables are created automatically:
- `users` - User authentication and roles
- `vehicles` - Fleet vehicle registry
- `drivers` - Driver profiles and licenses
- `trips` - Trip dispatch and tracking
- `service_logs` - Maintenance records
- `expenses` - Fuel and maintenance expenses

All tables include proper indexes, foreign key constraints, and validation rules as specified in the design document.
