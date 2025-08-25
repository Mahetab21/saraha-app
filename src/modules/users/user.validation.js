import Joi from "joi";
import { userGender } from "../../DB/models/user.model.js";
import generalRules, { customId } from "../../utils/generalRules/index.js";

export const signUpScheme = {
  body: Joi.object({
    name: Joi.string().alphanum().min(2).max(10).required(),
    email: generalRules.email.required(),
    password: generalRules.password.required(),
    cPassword: Joi.string().valid(Joi.ref("password")).required(),
    gender: Joi.string().valid(userGender.male, userGender.female).required(),
    age: Joi.number().required().min(18).max(60),
    phone: Joi.string().required(),
  }).required(),
  file: generalRules.file.required(),
};

export const signInScheme = {
  body: Joi.object({
    email: generalRules.email.required(),
    password: generalRules.password.required(),
  }).required(),
};
export const updatePasswordScheme = {
  body: Joi.object({
    oldPassword: generalRules.password.required(),
    newPassword: generalRules.password.required(),
    cNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }).required(),
};
export const forgetPasswordScheme = {
  body: Joi.object({
    email: generalRules.email.required(),
  }).required(),
};
export const resetPasswordScheme = {
  body: Joi.object({
    email: generalRules.email.required(),
    otp: Joi.string().length(5).required(),
    newPassword: generalRules.password.required(),
    cNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }).required(),
};

export const updateProfileScheme = {
  body: Joi.object({
    name: Joi.string().alphanum().min(2).max(10),
    email: generalRules.email,
    gender: Joi.string().valid(userGender.male, userGender.female),
    age: Joi.number().min(18).max(60),
    phone: Joi.string(),
  }),
};
export const freezeProfileScheme = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
};
export const unFreezeProfileScheme = freezeProfileScheme;
export const updateProfileImageScheme = {
  file: generalRules.file.required(),
};

export const confirmEmailOTPScheme = {
  body: Joi.object({
    email: generalRules.email.required(),
    otp: Joi.string().length(6).required(),
  }).required(),
};

export const resendOTPScheme = {
  body: Joi.object({
    email: generalRules.email.required(),
  }).required(),
};

export const checkAccountStatusScheme = {
  params: Joi.object({
    email: generalRules.email.required(),
  }).required(),
};
