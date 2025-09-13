import * as UC from "./user.service.js";
import { Router } from "express";
import { authentication } from "../../middleware/authentication.js";
import { validation } from "../../middleware/validation.js";
import * as UV from "./user.validation.js";
import { userRole } from "../../DB/models/user.model.js";
import { authorization } from "../../middleware/authorization.js";
import { allowedExtentions, MulterHost } from "../../middleware/multer.js";
const userRoter = Router();

userRoter.post("/signUp",
  MulterHost({
    customPath: "users",
    customExtentions: [...allowedExtentions.image, ...allowedExtentions.videos],
  }).single("image"),
  validation(UV.signUpScheme),
  UC.signUp
);
userRoter.post("/signIn", validation(UV.signInScheme), UC.signIn);
userRoter.post("/logInWithGmail", UC.logInWtithGmail);
userRoter.get("/confirmEmail/:token", UC.confirmEmail);
userRoter.post(
  "/confirmEmailOTP",
  validation(UV.confirmEmailOTPScheme),
  UC.confirmEmailTask
);
userRoter.post("/resendOTP", validation(UV.resendOTPScheme), UC.resendEmailOTP);
userRoter.get(
  "/accountStatus/:email",
  validation(UV.checkAccountStatusScheme),
  UC.checkAccountStatus
);
userRoter.get(
  "/profile",
  authentication,
  authorization([userRole.user]),
  UC.getProfile
);
userRoter.post("/logOut", authentication, UC.logOut);
userRoter.post("/refreshToken", UC.refreshToken);
userRoter.put(
  "/updatePassword",
  validation(UV.updatePasswordScheme),
  authentication,
  UC.updatePassword
);
userRoter.put(
  "/updateProfile",
  validation(UV.updateProfileScheme),
  authentication,
  UC.updateProfile
);
userRoter.put(
  "/updateProfileImage",
  authentication,
  MulterHost({
    customExtentions: [...allowedExtentions.image, ...allowedExtentions.videos],
  }).single("image"),
  validation(UV.updateProfileImageScheme),
  UC.updateProfileImage
);
userRoter.put(
  "/forgetPassword",
  validation(UV.forgetPasswordScheme),
  UC.forgetPassword
);
userRoter.put(
  "/resetPassword",
  validation(UV.resetPasswordScheme),
  UC.resetPassword
);
userRoter.get("/profile/:id", UC.getProfileData);
userRoter.patch(
  "/freezeProfile/:id",
  validation(UV.freezeProfileScheme),
  authentication,
  UC.freezeProfile
);
userRoter.patch(
  "/unFreezeProfile/:id",
  validation(UV.unFreezeProfileScheme),
  authentication,
  UC.unFreezeProfile
);

export default userRoter;
