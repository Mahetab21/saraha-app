import { EventEmitter } from 'events';
import { generateToken } from "../../utils/token/generateToken.js";
import { sendEmail } from "../../service/sendEmail.js";

export const eventEmitter = new EventEmitter();
eventEmitter.on("sendEmail",async(data)=>{
    const { email } = data;
     const token = await generateToken({
      payload:{email},
      SINATURE:process.env.SINATURE,
      options:{expiresIn:60 * 3}});
      
    const link = `http://localhost:3000/user/confirmEmail/${token}`;
    const isSend= await sendEmail({ 
      to:email,
      subject:"confirm email", 
      html :`<a href= '${link}'>confirm email</a>`})
    if(!isSend){
       throw new Error("Failed to send email", { cause: 400 });
    }
})

eventEmitter.on("forgetPassword",async(data)=>{
  const {email , otp} = data ; 
   const isSend= await sendEmail({ 
      to:email,
      subject:"firget password", 
      html :`<h1>your otp is ${otp}</h1>`})
    if(!isSend){
       throw new Error("Failed to send email", { cause: 400 });
    }
})