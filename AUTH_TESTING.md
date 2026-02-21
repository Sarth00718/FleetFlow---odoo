# Authentication System Testing Guide

## Overview
The authentication system has been implemented with the following components:

### Backend (Task 2.1 & 2.3)
- ✅ POST `/api/auth/login` - User login with JWT token generation
- ✅ POST `/api/auth/forgot-password` - Password recovery initiation
- ✅ POST `/api/auth/reset-password` - Password reset with token
- ✅ JWT verification middleware
- ✅ Role-based access control (RBAC) middleware
- ✅ Session expiration handling

### Frontend (Task 2.5 & 2.6)
- ✅ LoginForm component with email/password fields
- ✅ Forgot Password flow
- ✅ Error message display
- ✅ JWT token storage in localStorage
- ✅ ProtectedRoute component with JWT validation
- ✅ Redirect to login for unauthenticated users
- ✅ Role-based route protection

## Setup Instructions

### 1. Environment Configuration
Ensure your `.env` file in `FleetFlow/backend/` contains:
```
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h
```

### 2. Database Setup
Run migrations to create the users table:
```bash
cd FleetFlow/backend
npm run db:migrate
```

### 3. Seed Test User
Create a test user for authentication testing:
```bash
npm run seed:testuser
```

This creates:
- Email: `admin@fleetflow.com`
- Password: `password123`
- Role: `Fleet Manager`

## Testing the Authentication System

### Manual Testing with cURL

#### 1. Test Login (Valid Credentials)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetflow.com","password":"password123"}'
```

Expected Response:
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

#### 2. Test Login (Invalid Credentials)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetflow.com","password":"wrongpassword"}'
```

Expected Response:
```json
{
  "error": "Invalid credentials"
}
```

#### 3. Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetflow.com"}'
```

Expected Response:
```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

#### 4. Test Protected Endpoint (with token)
```bash
# First, get a token from login
TOKEN="your_token_here"

curl -X GET http://localhost:3000/api/protected-endpoint \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Test Protected Endpoint (without token)
```bash
curl -X GET http://localhost:3000/api/protected-endpoint
```

Expected Response:
```json
{
  "error": "Authentication required"
}
```

### Frontend Testing

#### 1. Start the Development Servers

Backend:
```bash
cd FleetFlow/backend
npm run dev
```

Frontend:
```bash
cd FleetFlow/frontend
npm run dev
```

#### 2. Test Login Flow
1. Navigate to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `admin@fleetflow.com`
   - Password: `password123`
3. Click "Login"
4. Should redirect to `/dashboard`
5. Token should be stored in localStorage

#### 3. Test Invalid Credentials
1. Navigate to `http://localhost:5173/login`
2. Enter invalid credentials
3. Should display error message: "Invalid credentials"

#### 4. Test Forgot Password
1. Navigate to `http://localhost:5173/login`
2. Click "Forgot Password?"
3. Enter email address
4. Should display success message

#### 5. Test Protected Route
1. Navigate to `http://localhost:5173/dashboard` without logging in
2. Should redirect to `/login`
3. After logging in, navigate to `/dashboard`
4. Should display dashboard content

#### 6. Test Session Expiration
1. Log in successfully
2. Manually edit the token in localStorage to an expired one
3. Try to access a protected route
4. Should redirect to login with session expired message

## Validation Tests

### Requirements Coverage

✅ **Requirement 1.1**: Valid credentials grant access
- Login endpoint validates email/password and returns JWT token

✅ **Requirement 1.2**: Invalid credentials are rejected
- Login endpoint returns 401 with "Invalid credentials" error

✅ **Requirement 1.3**: Forgot Password flow
- Forgot password endpoint initiates recovery process
- Reset password endpoint validates token and updates password

✅ **Requirement 1.4**: Role-based permissions
- JWT token includes user role
- RBAC middleware checks role before granting access

✅ **Requirement 1.5**: Session expiration
- JWT tokens expire after configured time (default 24h)
- Expired tokens return 401 with "Session expired" message
- Frontend checks token expiration and redirects to login

## Next Steps

The optional property-based tests (Tasks 2.2 and 2.4) can be implemented later:
- Task 2.2: Property tests for valid/invalid credentials
- Task 2.4: Property test for session expiration

These tests would use a property-based testing framework like `fast-check` to verify authentication properties across many random inputs.
