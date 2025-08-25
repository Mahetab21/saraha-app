# Saraha App - Enhanced Security Features

## Overview

This document describes the enhanced security features implemented in the Saraha App, including failed attempts tracking, account banning, and OTP-based email verification.

## New Database Fields

### User Model Additions

```javascript
// Email verification fields (existing)
emailVerificationCode: { type: String },
emailVerificationExpire: { type: Date },
emailVerificationAttempts: { type: Number, default: 0 },
emailVerificationBanExpire: { type: Date },

// New login attempt tracking fields
loginAttempts: { type: Number, default: 0 },
loginBanExpire: { type: Date },
```

## API Endpoints

### 1. Sign Up with OTP Verification

**POST** `/users/signUp`

- Creates user with email verification requirement
- Sends 6-digit OTP to user's email
- OTP expires in 5 minutes
- User must verify email before being able to sign in

### 2. Confirm Email with OTP

**POST** `/users/confirmEmailOTP`

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Security Features:**

- Maximum 5 attempts allowed
- Account banned for 5 minutes after 5 failed attempts
- OTP expires after 5 minutes
- Automatic cleanup of expired OTPs

**Response Examples:**

```json
// Success
{
  "message": "Email verified successfully!",
  "user": {
    "id": "userId",
    "name": "username",
    "email": "user@example.com",
    "confirmed": true
  }
}

// Failed attempt
{
  "message": "Invalid verification code",
  "attemptsLeft": 3,
  "totalAttempts": 2
}

// Account banned
{
  "message": "Too many failed attempts. Account banned for 5 minutes.",
  "attemptsLeft": 0,
  "banExpiresAt": "2025-08-18T15:30:00.000Z"
}

// OTP expired
{
  "message": "Verification code has expired. Please request a new one.",
  "expired": true
}
```

### 3. Resend OTP

**POST** `/users/resendOTP`

```json
{
  "email": "user@example.com"
}
```

**Security Features:**

- Rate limiting: Must wait 1 minute between requests
- Respects ban status
- Generates new 6-digit OTP
- 5-minute expiration

### 4. Sign In with Enhanced Security

**POST** `/users/signIn`

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Security Features:**

- Requires email verification before login
- Maximum 5 failed login attempts
- Account locked for 15 minutes after 5 failed attempts
- Automatic reset of attempts on successful login

**Response Examples:**

```json
// Success
{
  "message": "User signed in successfully",
  "statusCode": 200,
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "userId",
    "name": "username",
    "email": "user@example.com",
    "role": "user"
  }
}

// Email not verified
{
  "message": "Please verify your email before signing in",
  "needsEmailVerification": true
}

// Wrong password
{
  "message": "Incorrect password",
  "attemptsLeft": 3,
  "totalAttempts": 2
}

// Account locked
{
  "message": "Too many failed login attempts. Account locked for 15 minutes.",
  "attemptsLeft": 0,
  "banExpiresAt": "2025-08-18T15:45:00.000Z"
}
```

### 5. Check Account Status

**GET** `/users/accountStatus/:email`

Returns detailed account status including ban information:

```json
{
  "message": "Account status retrieved successfully",
  "status": {
    "email": "user@example.com",
    "confirmed": false,
    "isDeleted": false,
    "emailVerification": {
      "attempts": 2,
      "isBanned": false,
      "banExpiresAt": null,
      "hasActiveOTP": true,
      "otpExpiresAt": "2025-08-18T15:35:00.000Z"
    },
    "login": {
      "attempts": 0,
      "isBanned": false,
      "banExpiresAt": null
    }
  }
}
```

## Security Implementation Details

### Email Verification Security

- **Attempts Tracking**: Each failed OTP attempt is recorded
- **Progressive Penalties**: Account banned after 5 failed attempts
- **Ban Duration**: 5 minutes for email verification attempts
- **OTP Expiration**: 6-digit OTP expires after 5 minutes
- **Rate Limiting**: Resend OTP limited to once per minute

### Login Security

- **Failed Login Tracking**: Each failed login attempt is recorded
- **Account Locking**: Account locked after 5 failed login attempts
- **Lock Duration**: 15 minutes for login attempts
- **Auto-Reset**: Successful login resets failed attempt counters
- **Email Verification Requirement**: Must verify email before signing in

### Data Cleanup

- Expired OTPs are automatically cleared when checked
- Ban timers are automatically checked and respected
- Failed attempt counters reset on successful operations

## Email Templates

### OTP Verification Email

- Professional HTML template
- Clear OTP display with large font
- Expiration time mentioned
- Security warnings included

### Features Summary

1. ✅ Failed attempts tracking for email verification
2. ✅ Failed attempts tracking for login
3. ✅ Automatic account banning with time limits
4. ✅ OTP-based email verification
5. ✅ OTP expiration (5 minutes)
6. ✅ Rate limiting for OTP resend
7. ✅ Comprehensive account status checking
8. ✅ Enhanced email templates
9. ✅ Progressive security responses
10. ✅ Automatic cleanup of expired data

## Testing the APIs

Use tools like Postman or curl to test the endpoints:

1. **Sign up** a new user - receive OTP via email
2. **Try wrong OTP** multiple times - see attempts tracking
3. **Get banned** after 5 wrong attempts
4. **Wait for ban to expire** or use correct OTP
5. **Try login with wrong password** - see login attempts tracking
6. **Check account status** to see all security information

All security features are now properly implemented and integrated into your Saraha app!
