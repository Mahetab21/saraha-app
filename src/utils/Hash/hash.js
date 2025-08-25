import bcrypt from "bcrypt";
const saltRounds = parseInt(process.env.SALT_ROUND);
export const Hash = async ({ plainText } = {}) => {
  return bcrypt.hashSync(plainText, saltRounds);
};
