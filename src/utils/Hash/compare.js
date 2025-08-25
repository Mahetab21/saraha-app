import bcrypt from "bcrypt";
export const Compare = async ({ plainText, hashedText } = {}) => {
  return bcrypt.compare(plainText, hashedText);
};
