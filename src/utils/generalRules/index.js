import Joi from "joi";
import { Types } from "mongoose";
export const customId = (value, helper) => {
  const data = Types.ObjectId.isValid(value);
  return data ? value : helper.message("Invalid Id");
};
export const generalRules = {
  email: Joi.string().email({ tlds: { allow: ["com", "org", "outlook"] } }),
  password: Joi.string().min(6).max(20).required(),
  id: Joi.string().custom(customId),
  headers: Joi.object({
    authorization: Joi.string(),
    "content-type": Joi.string(),
    "content-length": Joi.string(),
    "postman-token": Joi.string(),
    "cache-control": Joi.string(),
    "user-agent": Joi.string(),
    host: Joi.string(),
  }),
  file: Joi.object({
    mimetype: Joi.string().required(),
    size: Joi.number().positive().required(),
    originalname: Joi.string().required(),
    path: Joi.string().required(),
    filename: Joi.string().required(),
    destination: Joi.string().required(),
    encoding: Joi.string().required(),
    fieldname: Joi.string().required(),
  })
    .required()
    .messages({
      "any.required": "File is required",
    }),
};
export default generalRules;
