import userModel, {
  userProvider,
  userRole,
} from "../../DB/models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../service/sendEmail.js";
import {
  generateToken,
  verifyToken,
  Hash,
  Compare,
  Encrypt,
  Decrypt,
  eventEmitter,
} from "../../utils/index.js";
import { customAlphabet, nanoid } from "nanoid";
import revokeTokenModel from "../../DB/models/revoke-token.model.js";
import Joi from "joi";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../../utils/cloudinary/index.js";
import CryptoJS from "crypto-js";
//============= SignUp User =============
export const signUp = async (req, res, next) => {
  const { name, email, password, phone, gender, age } = req.body;
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req?.file?.path,
    {
      folder: "sarahaApp/users/profileImages/",
    }
  );
  if (!req?.file) {
    throw new Error("Image is required", { cause: 400 });
  }
  //check emails
  if (await userModel.findOne({ email })) {
    throw new Error("Email already exists", { cause: 400 });
  }
  //hash password
  const hash = await Hash({
    plainText: password,
    SALT_ROUND: process.env.SALT_ROUND,
  });

  //encrypt phone
  var encryptedPhone = await Encrypt({
    plainText: phone,
    SECRET_KEY: process.env.SECRET_KEY,
  });
  const generateOTP = () => {
    const otp = customAlphabet("1234567890", 6);
    return otp();
  };
  const otp = generateOTP();
  const user = await userModel.create({
    name,
    email,
    password: hash,
    phone: encryptedPhone,
    gender,
    age,
    emailVerificationCode: otp,
    emailVerificationExpire: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
    emailVerificationAttempts: 0,
    emailVerificationBanExpire: null,
    profileImag: { secure_url, public_id },
  });

  // Generate token for email confirmation link
  const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_USER, {
    expiresIn: "1h",
  });
  const confirmLink = `http://localhost:3000/confirmEmail/${token}`;

  console.log("🔥 About to emit sendEmail event");
  console.log("📧 Email:", email);
  console.log("📱 OTP:", otp);
  console.log("🔗 Link:", confirmLink);

  // Send verification email
  eventEmitter.emit("sendEmail", { email, otp, confirmLink });

  console.log("🔥 Event emitted successfully");

  return res.status(201).json({
    message:
      "User created successfully. Please check your email for OTP verification.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      confirmed: user.confirmed,
    },
  });
};
//============= signIn User =============
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("Email not found", { cause: 404 });
  }

  // Check if user is banned due to failed login attempts
  if (user.loginBanExpire && user.loginBanExpire > Date.now()) {
    const banTimeLeft = Math.ceil((user.loginBanExpire - Date.now()) / 60000);
    return res.status(403).json({
      message: `Account temporarily locked due to too many failed login attempts. Try again in ${banTimeLeft} minutes.`,
      banExpiresAt: user.loginBanExpire,
    });
  }

  // Check if email is confirmed
  if (!user.confirmed) {
    return res.status(401).json({
      message: "Please verify your email before signing in",
      needsEmailVerification: true,
    });
  }

  // Check password
  if (!(await Compare({ plainText: password, hashedText: user.password }))) {
    // Increment failed login attempts
    user.loginAttempts += 1;

    // Ban user if too many failed attempts (5 attempts)
    if (user.loginAttempts >= 5) {
      user.loginBanExpire = Date.now() + 15 * 60 * 1000; // 15 minutes ban
      await user.save();
      return res.status(403).json({
        message:
          "Too many failed login attempts. Account locked for 15 minutes.",
        attemptsLeft: 0,
        banExpiresAt: user.loginBanExpire,
      });
    }

    await user.save();
    const attemptsLeft = 5 - user.loginAttempts;
    return res.status(401).json({
      message: "Incorrect password",
      attemptsLeft,
      totalAttempts: user.loginAttempts,
    });
  }

  // Successful login - reset login attempts
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.loginBanExpire = null;
    await user.save();
  }

  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "1d", jwtid: nanoid() },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid: nanoid() },
  });

  return res.status(200).json({
    message: "User signed in successfully",
    statusCode: 200,
    access_token,
    refresh_token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
//============= logIn with gmail  =============
export const logInWtithGmail = async (req, res, next) => {
  const { idToken } = req.body; //from frontend
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email, email_verified, picture, name } = await verify();
  //check email
  let user = await userModel.findOne({ email });
  if (!user) {
    user = await userModel.create({
      name,
      email,
      confirmed: email_verified,
      password: nanoid(),
      profileImag: { secure_url: picture },
      provider: userProvider.google,
    });
  }
  if (user.provider !== userProvider.google) {
    throw new Error("You can not log in with google", { cause: 400 });
  }
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "1h", jwtid: nanoid() },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid: nanoid() },
  });

  return res.status(200).json({
    message: "User signed in successfully",
    statusCode: 200,
    access_token,
    refresh_token,
  });
};
//============= Confirm Email =============
export const confirmEmail = async (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    throw new Error("Token not provided", { cause: 400 });
  }
  const decoded = await verifyToken({
    token,
    SIGNATURE: process.env.ACCESS_TOKEN_USER,
  });
  const user = await userModel.findOne({
    email: decoded.email,
    confirmed: false,
  });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  user.confirmed = true;
  await user.save();
  return res
    .status(200)
    .json({ message: "Email confirmed successfully", statusCode: 200 });
};
//============= Get User Profile =============
export const getProfile = async (req, res, next) => {
  //decrypt phone
  var phone = await Decrypt({
    cipherText: req.user.phone,
    SECRET_KEY: process.env.SECRET_KEY,
  });
  req.user.phone = phone;

  return res
    .status(200)
    .json({ message: "User signed in successfully", user: req.user });
};
//============= logOut User ===============
export const logOut = async (req, res, next) => {
  const revokeToken = await revokeTokenModel.create({
    tokenId: req.decoded.jti,
    expireAt: req.decoded.exp,
  });
  return res
    .status(200)
    .json({ message: "logout successful", statusCode: 200 });
};
//============= refressh Token =============
export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  const [prefix, token] = authorization?.split(" ") || [];
  if (!prefix || !token) {
    throw new Error("token not exist", { cause: 404 });
  }

  let signature = "";
  if (prefix === "Bearer") {
    signature = process.env.REFRESH_TOKEN_USER;
  } else if (prefix === "admin") {
    signature = process.env.REFRESH_TOKEN_ADMIN;
  } else {
    throw new Error("Invalid token prefix", { cause: 400 });
  }
  //verify token
  const decoded = await verifyToken({ token, SIGNATURE: signature });
  if (!decoded?.email) {
    throw new Error("Invalid token", { cause: 400 });
  }
  const revoke = await revokeTokenModel.findOne({ tokenId: decoded.jti });
  if (revoke) {
    throw new Error("Token has been revoked,please log in again", {
      cause: 400,
    });
  }
  //check if user exists
  const user = await userModel.findOne({ email: decoded.email });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "1h", jwtid: nanoid() },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role === userRole.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid: nanoid() },
  });
  return res.status(200).json({
    message: "Token refreshed successfully",
    statusCode: 200,
    access_token,
    refresh_token,
  });
};
//============= Update Password =============
export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (
    !(await Compare({ plainText: oldPassword, hashedText: req.user.password }))
  ) {
    throw new Error("invalid old password");
  }
  const hash = await Hash({
    plainText: newPassword,
    SALT_ROUND: process.env.SALT_ROUND,
  });
  req.user.password = hash;
  await req.user.save();
  await revokeTokenModel.create({
    tokenId: req?.decoded?.jti,
    expireAt: req?.decoded?.exp,
  });

  return res.status(200).json({ message: "update success", statusCode: 200 });
};
//============= Forget Password =============
export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  const otp = customAlphabet("1234567890", 5)();
  eventEmitter.emit("forgetPassword", { email, otp });
  user.otp = await Hash({
    plainText: otp,
    SALT_ROUND: process.env.SALT_ROUND,
  });
  await user.save();
  return res.status(200).json({ message: "success", statusCode: 200 });
};
//============= Reset Password =============
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  if (!(await Compare({ plainText: otp, hashedText: user?.otp }))) {
    throw new Error("Invalid OTP", { cause: 400 });
  }
  const hash = await Hash({
    plainText: newPassword,
    SALT_ROUND: process.env.SALT_ROUND,
  });
  await userModel.updateOne(
    { email },
    {
      password: hash,
      $unset: { otp: "" },
    }
  );
  return res
    .status(200)
    .json({ message: "Password reset successfully", statusCode: 200 });
};
//============= update Profile =============
export const updateProfile = async (req, res, next) => {
  const { name, email, gender, age, phone } = req.body;
  if (name) req.user.name = name;
  if (gender) req.user.gender = gender;
  if (age) req.user.age = age;
  if (phone) {
    //encrypt phone
    var encryptedPhone = await Encrypt({
      plainText: phone,
      SECRET_KEY: process.env.SECRET_KEY,
    });
    req.user.phone = encryptedPhone;
  }
  if (email) {
    const user = await userModel.findOne({ email });
    if (user) throw new Error("Email already exists", { cause: 400 });
    eventEmitter.emit("sendEmail", { email: req.user.email });
    req.user.email = email;
    req.user.confirmed = false;
  }
  await req.user.save();
  return res.status(200).json({
    message: "Profile updated successfully",
    statusCode: 200,
    user: req.user,
  });
};
//=============== get Profile ================
export const getProfileData = async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel
    .findById(id)
    .select("-password -phone -role -confirmed -createdAt -updatedAt ");
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  return res.status(200).json({
    message: "User profile retrieved successfully",
    statusCode: 200,
    user,
  });
};
//============= Freeze Profile =============
export const freezeProfile = async (req, res, next) => {
  const { id } = req.params;
  if (id && req.user.role !== userRole.admin) {
    throw new Error("You are not authorized to freeze this profile", {
      cause: 403,
    });
  }
  const user = await userModel.updateOne(
    { _id: id || req.user._id, isDeleted: { $exists: false } },
    {
      $set: { isDeleted: true, deletedBy: req.user._id },
      $inc: { __v: 1 },
    }
  );
  user.matchedCount
    ? res
        .status(200)
        .json({ message: "Profile frozen successfully", statusCode: 200 })
    : res.status(404).json({
        message: "Profile not found or already frozen",
        statusCode: 404,
      });
};
//============= un Freeze Profile =============
export const unFreezeProfile = async (req, res, next) => {
  const { id } = req.params;
  if (id && req.user.role !== userRole.admin) {
    throw new Error("You are not authorized to freeze this profile", {
      cause: 403,
    });
  }
  const user = await userModel.updateOne(
    { _id: id || req.user._id, isDeleted: { $exists: true } },
    {
      $unset: { isDeleted: "", deletedBy: "" }, // أو { isDeleted: 1, deletedBy: 1 }
      $inc: { __v: 1 },
    }
  );
  user.matchedCount
    ? res
        .status(200)
        .json({ message: "Profile frozen successfully", statusCode: 200 })
    : res.status(404).json({ message: "failed to un freeze", statusCode: 404 });
};
//============= Confirm Email OTP =============
export const confirmEmailTask = async (req, res, next) => {
  const { email, otp } = req.body;

  // Find user by email who hasn't confirmed yet
  const user = await userModel.findOne({ email, confirmed: false });
  if (!user) {
    throw new Error("User not found or already confirmed", { cause: 404 });
  }

  // Check if user is banned due to too many failed attempts
  if (
    user.emailVerificationBanExpire &&
    user.emailVerificationBanExpire > Date.now()
  ) {
    const banTimeLeft = Math.ceil(
      (user.emailVerificationBanExpire - Date.now()) / 60000
    );
    return res.status(403).json({
      message: `Account temporarily banned due to too many failed attempts. Try again in ${banTimeLeft} minutes.`,
      banExpiresAt: user.emailVerificationBanExpire,
    });
  }

  // Check if OTP exists and hasn't expired
  if (!user.emailVerificationCode) {
    return res.status(400).json({
      message: "No verification code found. Please request a new one.",
    });
  }

  if (user.emailVerificationExpire < Date.now()) {
    // Clear expired OTP
    user.emailVerificationCode = null;
    user.emailVerificationExpire = null;
    await user.save();
    return res.status(400).json({
      message: "Verification code has expired. Please request a new one.",
      expired: true,
    });
  }

  // Check if OTP is correct
  if (otp !== user.emailVerificationCode) {
    user.emailVerificationAttempts += 1;

    // Ban user if too many attempts
    if (user.emailVerificationAttempts >= 5) {
      user.emailVerificationBanExpire = Date.now() + 5 * 60 * 1000; // 5 minutes ban
      await user.save();
      return res.status(403).json({
        message: "Too many failed attempts. Account banned for 5 minutes.",
        attemptsLeft: 0,
        banExpiresAt: user.emailVerificationBanExpire,
      });
    }

    const attemptsLeft = 5 - user.emailVerificationAttempts;
    await user.save();
    return res.status(400).json({
      message: "Invalid verification code",
      attemptsLeft,
      totalAttempts: user.emailVerificationAttempts,
    });
  }

  // OTP is correct - confirm user
  user.confirmed = true;
  user.emailVerificationCode = null;
  user.emailVerificationExpire = null;
  user.emailVerificationAttempts = 0;
  user.emailVerificationBanExpire = null;
  await user.save();

  return res.status(200).json({
    message: "Email verified successfully!",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      confirmed: user.confirmed,
    },
  });
};

//============= Resend Email OTP =============
export const resendEmailOTP = async (req, res, next) => {
  const { email } = req.body;

  // Find user by email who hasn't confirmed yet
  const user = await userModel.findOne({ email, confirmed: false });
  if (!user) {
    throw new Error("User not found or already confirmed", { cause: 404 });
  }

  // Check if user is banned
  if (
    user.emailVerificationBanExpire &&
    user.emailVerificationBanExpire > Date.now()
  ) {
    const banTimeLeft = Math.ceil(
      (user.emailVerificationBanExpire - Date.now()) / 60000
    );
    return res.status(403).json({
      message: `Account temporarily banned. Try again in ${banTimeLeft} minutes.`,
      banExpiresAt: user.emailVerificationBanExpire,
    });
  }

  // Rate limiting: Don't allow resend if current OTP is still valid (less than 1 minute old)
  if (
    user.emailVerificationExpire &&
    user.emailVerificationExpire - Date.now() > 4 * 60 * 1000
  ) {
    const timeLeft = Math.ceil(
      (user.emailVerificationExpire - Date.now() - 4 * 60 * 1000) / 1000
    );
    return res.status(429).json({
      message: `Please wait ${timeLeft} seconds before requesting a new OTP.`,
      timeLeft,
    });
  }

  // Generate new OTP
  const generateOTP = () => {
    const otp = customAlphabet("1234567890", 6);
    return otp();
  };
  const newOTP = generateOTP();

  // Update user with new OTP
  user.emailVerificationCode = newOTP;
  user.emailVerificationExpire = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
  await user.save();

  // Send new verification email
  eventEmitter.emit("sendEmail", { email, otp: newOTP });

  return res.status(200).json({
    message: "New verification code sent to your email",
    expiresAt: user.emailVerificationExpire,
  });
};

//============= Check Account Status =============
export const checkAccountStatus = async (req, res, next) => {
  const { email } = req.params;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }

  const now = Date.now();
  const status = {
    email: user.email,
    confirmed: user.confirmed,
    isDeleted: user.isDeleted || false,
    emailVerification: {
      attempts: user.emailVerificationAttempts,
      isBanned:
        user.emailVerificationBanExpire &&
        user.emailVerificationBanExpire > now,
      banExpiresAt: user.emailVerificationBanExpire,
      hasActiveOTP:
        user.emailVerificationCode && user.emailVerificationExpire > now,
      otpExpiresAt: user.emailVerificationExpire,
    },
    login: {
      attempts: user.loginAttempts,
      isBanned: user.loginBanExpire && user.loginBanExpire > now,
      banExpiresAt: user.loginBanExpire,
    },
  };

  return res.status(200).json({
    message: "Account status retrieved successfully",
    status,
  });
};

//================ update Profile Image =============
export const updateProfileImage = async (req, res, next) => {
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req?.file?.path,
    {
      folder: "sarahaApp/users/profileImages",
    }
  );
  const user = await userModel.findByIdAndUpdate(
    { _id: req?.user?._id },
    {
      profileImag: { secure_url, public_id },
    }
  );
  // await cloudinary.uploader.destroy(user?.profileImag?.public_id);
  return res
    .status(200)
    .json({ message: "Profile image updated successfully", user });
};
