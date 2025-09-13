import Joi from "joi";
import generalRules from "../../../utils/generalRules/index.js";
export const createMessageScheme = {
  body: Joi.object({
    userId: generalRules.id.required(),
    content: Joi.string().min(2).required(),
  }),
};
export const getMessageScheme = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
};

export const deleteMessageScheme = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
};
