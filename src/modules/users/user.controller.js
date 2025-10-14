import * as UC from "./user.service.js";
import { Router } from "express";
import { authentication } from "../../middleware/authentication.js";
import { validation } from "../../middleware/validation.js";
import * as UV from "./user.validation.js";
import { userRole } from "../../DB/models/user.model.js";
import { authorization } from "../../middleware/authorization.js";
import { allowedExtentions, MulterHost } from "../../middleware/multer.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         userName:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: User email
 *         age:
 *           type: number
 *           description: User age
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         isConfirmed:
 *           type: boolean
 *           description: Email confirmation status
 *         profileImage:
 *           type: object
 *           description: Profile image details
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SignUpRequest:
 *       type: object
 *       required:
 *         - userName
 *         - email
 *         - password
 *         - cPassword
 *         - age
 *         - gender
 *       properties:
 *         userName:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *         cPassword:
 *           type: string
 *           minLength: 8
 *         age:
 *           type: number
 *           minimum: 13
 *           maximum: 100
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         image:
 *           type: string
 *           format: binary
 *     SignInRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const userRoter = Router();

/**
 * @swagger
 * /users/signUp:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Internal server error
 */
userRoter.post(
  "/signUp",
  MulterHost({
    customPath: "users",
    customExtentions: [...allowedExtentions.image, ...allowedExtentions.videos],
  }).single("image"),
  validation(UV.signUpScheme),
  UC.signUp
);
/**
 * @swagger
 * /users/signIn:
 *   post:
 *     summary: Sign in user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 *     responses:
 *       200:
 *         description: User signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Email not confirmed
 *       500:
 *         description: Internal server error
 */
userRoter.post("/signIn", validation(UV.signInScheme), UC.signIn);
/**
 * @swagger
 * /users/logInWithGmail:
 *   post:
 *     summary: Sign in with Google
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: User signed in successfully with Google
 *       400:
 *         description: Invalid Google token
 *       500:
 *         description: Internal server error
 */
userRoter.post("/logInWithGmail", UC.logInWtithGmail);
/**
 * @swagger
 * /users/confirmEmail/{token}:
 *   get:
 *     summary: Confirm user email
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email confirmation token
 *     responses:
 *       200:
 *         description: Email confirmed successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
userRoter.get("/confirmEmail/:token", UC.confirmEmail);
/**
 * @swagger
 * /users/confirmEmailOTP:
 *   post:
 *     summary: Confirm email using OTP
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               otp:
 *                 type: string
 *                 description: One-time password received via email
 *                 minLength: 4
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email confirmed successfully using OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email confirmed successfully"
 *       400:
 *         description: Invalid OTP or validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.post(
  "/confirmEmailOTP",
  validation(UV.confirmEmailOTPScheme),
  UC.confirmEmailTask
);
/**
 * @swagger
 * /users/resendOTP:
 *   post:
 *     summary: Resend OTP for email confirmation
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to your email"
 *       400:
 *         description: Validation error or email already confirmed
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests - wait before requesting again
 *       500:
 *         description: Internal server error
 */
userRoter.post("/resendOTP", validation(UV.resendOTPScheme), UC.resendEmailOTP);
/**
 * @swagger
 * /users/accountStatus/{email}:
 *   get:
 *     summary: Check account confirmation status
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User email address
 *     responses:
 *       200:
 *         description: Account status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isConfirmed:
 *                   type: boolean
 *                   description: Whether the email is confirmed
 *                 message:
 *                   type: string
 *                   example: "Account is confirmed"
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.get(
  "/accountStatus/:email",
  validation(UV.checkAccountStatusScheme),
  UC.checkAccountStatus
);
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
userRoter.get(
  "/profile",
  authentication,
  authorization([userRole.user]),
  UC.getProfile
);
/**
 * @swagger
 * /users/logOut:
 *   post:
 *     summary: Log out user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
userRoter.post("/logOut", authentication, UC.logOut);
/**
 * @swagger
 * /users/refreshToken:
 *   post:
 *     summary: Refresh authentication token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid refresh token
 *       500:
 *         description: Internal server error
 */
userRoter.post("/refreshToken", UC.refreshToken);
/**
 * @swagger
 * /users/updatePassword:
 *   put:
 *     summary: Update user password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - cNewPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               cNewPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error or incorrect old password
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
userRoter.put(
  "/updatePassword",
  validation(UV.updatePasswordScheme),
  authentication,
  UC.updatePassword
);
/**
 * @swagger
 * /users/updateProfile:
 *   put:
 *     summary: Update user profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: New username
 *               age:
 *                 type: number
 *                 minimum: 13
 *                 maximum: 100
 *                 description: User age
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 description: User gender
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username already exists
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
userRoter.put(
  "/updateProfile",
  validation(UV.updateProfileScheme),
  authentication,
  UC.updateProfile
);
/**
 * @swagger
 * /users/updateProfileImage:
 *   put:
 *     summary: Update user profile image
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, GIF, MP4, etc.)
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profileImage:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                     secure_url:
 *                       type: string
 *       400:
 *         description: Validation error or invalid file format
 *       401:
 *         description: Unauthorized - Invalid token
 *       413:
 *         description: File too large
 *       500:
 *         description: Internal server error
 */
userRoter.put(
  "/updateProfileImage",
  authentication,
  MulterHost({
    customExtentions: [...allowedExtentions.image, ...allowedExtentions.videos],
  }).single("image"),
  validation(UV.updateProfileImageScheme),
  UC.updateProfileImage
);
/**
 * @swagger
 * /users/forgetPassword:
 *   put:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset link sent to your email"
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.put(
  "/forgetPassword",
  validation(UV.forgetPasswordScheme),
  UC.forgetPassword
);
/**
 * @swagger
 * /users/resetPassword:
 *   put:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - cNewPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *               cNewPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *       400:
 *         description: Validation error or passwords don't match
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
userRoter.put(
  "/resetPassword",
  validation(UV.resetPasswordScheme),
  UC.resetPassword
);
/**
 * @swagger
 * /users/profile/{id}:
 *   get:
 *     summary: Get public profile data by user ID
 *     tags: [User Profile]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.get("/profile/:id", UC.getProfileData);
/**
 * @swagger
 * /users/freezeProfile/{id}:
 *   patch:
 *     summary: Freeze a user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to freeze
 *     responses:
 *       200:
 *         description: Profile frozen successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile frozen successfully"
 *       400:
 *         description: Validation error or profile already frozen
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.patch(
  "/freezeProfile/:id",
  validation(UV.freezeProfileScheme),
  authentication,
  UC.freezeProfile
);
/**
 * @swagger
 * /users/unFreezeProfile/{id}:
 *   patch:
 *     summary: Unfreeze a user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unfreeze
 *     responses:
 *       200:
 *         description: Profile unfrozen successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile unfrozen successfully"
 *       400:
 *         description: Validation error or profile not frozen
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoter.patch(
  "/unFreezeProfile/:id",
  validation(UV.unFreezeProfileScheme),
  authentication,
  UC.unFreezeProfile
);

export default userRoter;
