
import CryptoJS from "crypto-js";
export const Encrypt = async ({plainText, SECRET_KEY}) => {
  return CryptoJS.AES.encrypt(plainText,SECRET_KEY).toString();

}