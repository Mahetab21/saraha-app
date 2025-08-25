import mongoose from "mongoose";
export const userGender = {
  male: "male",
  female: "female",
};
export const userRole = {
  user: "user",
  admin: "admin",
};
export const userProvider = {
  system: "system",
  google: "google",
};
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImag: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    coverImage: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(userGender),
      default: userGender.male,
    },
    age: {
      type: Number,
      min: 18,
      max: 60,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(userRole),
      default: userRole.user,
    },
    otp: {
      type: String,
    },
    emailVerificationCode: { type: String },
    emailVerificationExpire: { type: Date },
    emailVerificationAttempts: { type: Number, default: 0 },
    emailVerificationBanExpire: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    loginBanExpire: { type: Date },
    isDeleted: Boolean,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    provider: {
      type: String,
      enum: Object.values(userProvider),
      default: userProvider.system,
    },
  },
  {
    timestamps: true,
  }
);
const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
