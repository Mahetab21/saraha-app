import bcrypt from "bcryptjs";

export const Hash = async ({plainText,SOLT_ROUND=process.env.SOLTROUND}={})=>{
    return bcrypt.hashSync(plainText,+SOLT_ROUND);

}