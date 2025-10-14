# Saraha App - Anonymous Messaging Platform

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Security Features](#security-features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Security Documentation](#security-documentation)

## 🎯 Overview

Saraha App is a secure anonymous messaging platform built with Node.js and Express.js. It allows users to create accounts, receive anonymous messages from others, and manage their profiles with enhanced security features including multi-factor authentication, rate limiting, and comprehensive user verification systems.

## ✨ Features

### User Management

- **User Registration & Authentication**: Secure signup/signin with JWT tokens
- **Email Verification**: OTP-based email verification system
- **Profile Management**: Update profile information and images
- **Google OAuth Integration**: Sign in with Google account
- **Password Management**: Secure password reset functionality
- **Account Status Tracking**: Monitor login attempts and verification status

### Messaging System

- **Anonymous Messages**: Send anonymous messages to registered users
- **Message Management**: View, delete, and manage received messages
- **User Discovery**: Find users by their profile information

### Security Features

- **Multi-layer Authentication**: JWT access and refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Account Lockout**: Automatic account banning after failed attempts
- **Token Revocation**: Secure logout with token invalidation
- **Data Encryption**: Phone numbers and sensitive data encryption
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation using Joi

## 🏗 Architecture

The application follows a modular MVC (Model-View-Controller) architecture:

```
├── Controllers (Route handlers)
├── Services (Business logic)
├── Models (Database schemas)
├── Middleware (Authentication, validation, error handling)
├── Utils (Helper functions, encryption, tokens)
├── Jobs (Background tasks)
└── Config (Database connection, environment)
```

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcrypt
- **Email Service**: Nodemailer
- **File Upload**: Multer with Cloudinary integration
- **Validation**: Joi
- **Scheduling**: node-cron

### Security & Middleware

- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Rate Limiting**: express-rate-limit
- **Data Encryption**: crypto-js
- **Google OAuth**: google-auth-library

## 🔒 Security Features

### Authentication & Authorization

- **JWT Tokens**: Separate access and refresh tokens for users and admins
- **Token Revocation**: Blacklist system for logout functionality
- **Role-based Access**: User and admin role separation
- **Session Management**: Secure token storage and validation

### Account Protection

- **Failed Login Tracking**: Monitor and limit failed login attempts
- **Account Lockout**: 15-minute ban after 5 failed login attempts
- **Email Verification**: Required email confirmation before account activation
- **OTP System**: 6-digit OTP with 5-minute expiration
- **Rate Limiting**: Global rate limiting (5 requests per minute)

### Data Protection

- **Password Hashing**: bcrypt with configurable salt rounds
- **Data Encryption**: AES encryption for sensitive data (phone numbers)
- **Input Validation**: Comprehensive validation for all endpoints
- **SQL Injection Prevention**: MongoDB with Mongoose protection
- **XSS Protection**: Helmet middleware for security headers

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)
- Gmail account (for email services)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/qwer1887/saraha_app.git
   cd saraha_app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp src/config/.env.example src/config/.env
   # Edit the .env file with your configuration
   ```

4. **Start the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file in `src/config/` directory:

```env
# Server Configuration
PORT=3000
FRONTEND_ORIGIN=http://localhost:4200

# Database
DB_URL=mongodb://127.0.0.1:27017/sarahaApp

# Security
SALT_ROUND=10
SECRET_KEY=your_secret_key_for_encryption
SIGNATURE=your_jwt_signature

# JWT Tokens
ACCESS_TOKEN_USER=your_user_access_token_secret
ACCESS_TOKEN_ADMIN=your_admin_access_token_secret
REFRESH_TOKEN_USER=your_user_refresh_token_secret
REFRESH_TOKEN_ADMIN=your_admin_refresh_token_secret

# Email Configuration
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password

# Google OAuth
WEB_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cloudinary (Image Upload)
api_key=your_cloudinary_api_key
api_secret=your_cloudinary_api_secret
cloud_name=your_cloudinary_cloud_name
```

## 📡 API Endpoints

### Authentication Routes (`/users`)

| Method | Endpoint                | Description                         | Auth Required |
| ------ | ----------------------- | ----------------------------------- | ------------- |
| POST   | `/signUp`               | Register new user with image upload | No            |
| POST   | `/signIn`               | User login                          | No            |
| POST   | `/logInWithGmail`       | Google OAuth login                  | No            |
| GET    | `/confirmEmail/:token`  | Confirm email via token             | No            |
| POST   | `/confirmEmailOTP`      | Confirm email via OTP               | No            |
| POST   | `/resendOTP`            | Resend OTP for email verification   | No            |
| GET    | `/accountStatus/:email` | Check account status                | No            |
| GET    | `/profile`              | Get current user profile            | Yes           |
| POST   | `/logOut`               | Logout user                         | Yes           |
| POST   | `/refreshToken`         | Refresh access token                | No            |
| PUT    | `/updatePassword`       | Update user password                | Yes           |
| PUT    | `/updateProfile`        | Update profile information          | Yes           |
| PUT    | `/updateProfileImage`   | Update profile image                | Yes           |
| PUT    | `/forgetPassword`       | Send password reset OTP             | No            |
| PUT    | `/resetPassword`        | Reset password with OTP             | No            |
| GET    | `/profile/:id`          | Get user profile by ID              | No            |
| DELETE | `/freezeProfile/:id`    | Freeze user account                 | Yes           |
| DELETE | `/unFreezeProfile/:id`  | Unfreeze user account               | Yes           |

### Message Routes (`/message`)

| Method | Endpoint | Description                   | Auth Required |
| ------ | -------- | ----------------------------- | ------------- |
| POST   | `/send`  | Send anonymous message        | No            |
| GET    | `/list`  | List user's received messages | Yes           |
| GET    | `/:id`   | Get specific message          | Yes           |
| DELETE | `/:id`   | Delete message                | Yes           |

## 🗃 Database Models

### User Model

```javascript
{
  name: String (2-10 chars, required),
  email: String (unique, required),
  password: String (hashed, required),
  profileImag: { secure_url, public_id },
  coverImage: { secure_url, public_id },
  phone: String (encrypted),
  gender: Enum ['male', 'female'],
  age: Number (18-60),
  confirmed: Boolean,
  role: Enum ['user', 'admin'],

  // Email verification
  emailVerificationCode: String,
  emailVerificationExpire: Date,
  emailVerificationAttempts: Number,
  emailVerificationBanExpire: Date,

  // Login security
  loginAttempts: Number,
  loginBanExpire: Date,

  // Account management
  isDeleted: Boolean,
  deletedBy: ObjectId,
  provider: Enum ['system', 'google'],

  timestamps: true
}
```

### Message Model

```javascript
{
  content: String (required, min 1 char),
  userId: ObjectId (ref: User, required),
  timestamps: true
}
```

### Revoke Token Model

```javascript
{
  tokenId: String (required),
  expireAt: Date (required),
  timestamps: true
}
```

## 📁 Project Structure

```
saraha_app/
├── src/
│   ├── app.controller.js           # Main app configuration
│   ├── config/
│   │   └── .env                    # Environment variables
│   ├── DB/
│   │   ├── connectionDB.js         # MongoDB connection
│   │   └── models/                 # Database models
│   │       ├── user.model.js
│   │       ├── message.model.js
│   │       └── revoke-token.model.js
│   ├── jobs/
│   │   └── deleteExpiredTokens.js  # Background cleanup job
│   ├── middleware/
│   │   ├── authentication.js       # JWT authentication
│   │   ├── authorization.js        # Role-based authorization
│   │   ├── globalErrorHandling.js  # Error handler
│   │   ├── multer.js              # File upload handler
│   │   └── validation.js          # Request validation
│   ├── modules/
│   │   └── users/
│   │       ├── user.controller.js  # User route definitions
│   │       ├── user.service.js     # User business logic
│   │       ├── user.validation.js  # User input validation
│   │       └── message/
│   │           ├── message.controller.js
│   │           ├── message.service.js
│   │           └── message.validation.js
│   ├── service/
│   │   └── sendEmail.js           # Email service
│   └── utils/
│       ├── index.js               # Utility exports
│       ├── cloudinary/            # Image upload utils
│       ├── EmailEvents/           # Email event handlers
│       ├── Encrypt/               # Encryption utilities
│       ├── generalRules/          # Validation rules
│       ├── Hash/                  # Password hashing
│       └── token/                 # JWT utilities
├── uploads/                       # File upload directory
├── mongodb-data/                  # Local MongoDB data
├── index.js                       # Application entry point
├── package.json                   # Dependencies and scripts
├── .gitignore                     # Git ignore rules
├── README.md                      # This file
└── SECURITY_FEATURES.md           # Detailed security documentation
```

## 🎮 Usage

### 1. User Registration

```bash
POST /users/signUp
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "gender": "male",
  "age": 25,
  "image": [file upload]
}
```

### 2. Email Verification

```bash
POST /users/confirmEmailOTP
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

### 3. User Login

```bash
POST /users/signIn
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### 4. Send Anonymous Message

```bash
POST /message/send
Content-Type: application/json

{
  "userId": "60d5ecb74b4a4c1234567890",
  "content": "This is an anonymous message!"
}
```

### 5. Get Messages (Authenticated)

```bash
GET /message/list
Authorization: Bearer <access_token>
```

## 📚 Security Documentation

For detailed security features and implementation details, see [SECURITY_FEATURES.md](./SECURITY_FEATURES.md).

### Key Security Highlights:

- **OTP-based email verification** with 5-minute expiration
- **Account lockout** after 5 failed attempts (15 minutes for login, 5 minutes for email verification)
- **Rate limiting** to prevent brute force attacks
- **Token revocation** system for secure logout
- **Data encryption** for sensitive information
- **Comprehensive input validation** using Joi schemas
- **Background jobs** for automatic cleanup of expired tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ using Node.js and Express.js**
# saraha-app 
#   s a r a h a - a p p  
 