
import bcrypt from "bcryptjs";
export const Compare = async ({plainText,ciperText}={})=>{
    return bcrypt.hashSync(plainText,ciperText);

}