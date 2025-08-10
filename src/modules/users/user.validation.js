import joi from "joi";
import { userGender } from "../../DB/models/user.model.js";
import generalRules,{customId} from "../../utils/generalRules/index.js";

export const signUpScheme = {
    body: joi.object({
        name: joi.string().alphanum().required(),                                                   //minDomainSegments, maxDomainSegments
        email: generalRules.email.required(),//{ tlds :{allow : false , deny : ["com","org","outlook"]}} ما عدا
        password: generalRules.password.required(),
        cPassword: joi.string().valid(joi.ref("password")).required(),
        gender: joi.string().valid(userGender.male,userGender.female).required(),
        age: joi.number().required().min(18).max(60),
        phone: joi.string().required()
    }).required(),
    file:generalRules.file.required(),
    //files:joi.array().items(generalRules.file).required(),
}

export const signInScheme = {
    body: joi.object({
        email: generalRules.email.required(),
        password: generalRules.password.required(),
    }).required(),  
}
export const updatePasswordScheme = {
    body: joi.object({
        oldPassword: generalRules.password.required(),
        newPassword: generalRules.password.required(),
        cNewPassword: joi.string().valid(joi.ref("newPassword")).required()
    }).required(),
}
export const forgetPasswordScheme = {
    body: joi.object({
        email: generalRules.email.required(),
    }).required(),
}
export const resetPasswordScheme = {
    body: joi.object({
        email: generalRules.email.required(),
        otp: joi.string().length(5).required(),
        newPassword: generalRules.password.required(),
        cNewPassword: joi.string().valid(joi.ref("newPassword")).required()
    }).required(),
}

export const updateProfileScheme = {
    body: joi.object({
        name: joi.string().alphanum().length(5),                                                  
        email: generalRules.email.required(),
        gender: joi.string().valid(userGender.male,userGender.female),
        age: joi.number().min(18).max(60),
        phone: joi.string()
    })
}
export const freezeProfileScheme= {
    params : joi.object ({
        id :generalRules.id,
    }),
}
export const unFreezeProfileScheme= freezeProfileScheme;
export const updateProfileImageScheme = {
  file: generalRules.file.required(),
}