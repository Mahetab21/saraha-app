import userModel, { userProvider, userRole } from "../../DB/models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../service/sendEmail.js";
import { generateToken ,verifyToken ,Hash,Compare ,Encrypt,Decrypt , eventEmitter} from "../../utils/index.js";
import { customAlphabet, nanoid } from "nanoid";
import revokeTokenModel from "../../DB/models/revoke-token.model.js";
import joi from "joi";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../../utils/cloudinary/index.js";
//============= SignUp User =============
export const signUp = async(req,res,next)=>{
   
    const {name,email,password,cPassword,phone,gender,age}=req.body;
    const {secure_url,public_id} = await cloudinary.uploader.upload(req?.file?.path,{
      folder:"sarahaApp/users/profileImages",
     })
      if(!req?.file){
        throw new Error("Image is required", { cause: 400 });
      }
    //check emails
    if(await userModel.findOne({email})){
      throw new Error("Email already exists", { cause: 400 });
    }
    //hash password
    const hash= await Hash({plainText:password,SOLT_ROUND:process.env.SOLT_ROUND});

    //encrypt phone
   var encryptedPhone = await Encrypt({plainText:phone,SECRET_KEY:process.env.SECRET_KEY});
  const generateOTP = () => {
  const otp = customAlphabet("1234567890", 6);
  return otp();
};
  const otp = generateOTP();
const user= await userModel.create(
 {
   name,
   email,
   password : hash ,
   phone : encryptedPhone,
   gender,
   age,
  //  emailVerificationCode : otp,
  //  emailVerificationExpire :Date.now() + 2 * 60 * 1000, 
  //  emailVerificationAttempts : 0,
  //  emailVerificationBanExpire : null,
  profileImag: {secure_url,public_id} ,
      });
//  eventEmitter.emit("sendEmail",{ email })

  return res.status(201).json({message:"User created successfully",user});

   
}
//============= signIn User =============
export const signIn = async(req,res,next)=>{
    const {email , password} = req.body;
    //check email
    const user = await userModel.findOne({email, confirmed: true});
    if(!user){
      throw new Error("Email not found", { cause: 404 });
    }
    //check password
    if(! await Compare({plainText:password,cyperText:user.password})){
      throw new Error("Incorrect password", { cause: 404 });
    }
      const access_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role=== userRole.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
        options:{expiresIn:"1h", jwtid : nanoid()}
      });

    const refresh_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role === userRole.user ? process.env.REFRESH_TOKEN_USER: process.env.REFRESH_TOKEN_ADMIN,
        options:{expiresIn:"1y", jwtid : nanoid()}
      });



    return res.status(200).json({message:"User signed in successfully",statusCode:200,access_token,refresh_token});

 
}
//============= logIn with gemail  =============
export const logInWtithGemail = async(req,res,next)=>{
    const {idToken} = req.body;  //from frontend
    const client = new OAuth2Client();
    async function verify() {
     const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
 return payload;
}
   const {email,email_verified, picture ,name} = await verify()
    //check email
    let user = await userModel.findOne({email});
    if(!user){
       user = await userModel.create({
        name,
        email,
        confirmed : email_verified,
        password: nanoid(),
        Image: picture,
        provider: userProvider.google
        }) 
}
     if(user.provider !== userProvider.google){
      throw new Error("You can not log in with google", { cause: 400 });
     }
      const access_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role=== userRole.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
        options:{expiresIn:"1h", jwtid : nanoid()}
      });

    const refresh_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role === userRole.user ? process.env.REFRESH_TOKEN_USER: process.env.REFRESH_TOKEN_ADMIN,
        options:{expiresIn:"1y", jwtid : nanoid()}
      });



    return res.status(200).json({message:"User signed in successfully",statusCode:200,access_token,refresh_token});

 
}
//============= Confirm Email =============
export const confirmEmail = async(req,res,next)=>{
 
    const {token} = req.params;
    if(!token){
      throw new Error("Token not provided", { cause: 400 });
    }
    const decoded = await verifyToken({token,SINATURE:process.env.SINATURE});

    const user = await userModel.findOne({email:decoded.email, confirmed: false});
    if(!user){
      throw new Error("User not found", { cause: 404 });
    }
    user.confirmed = true;
    await user.save();
    return res.status(200).json({message:"Email confirmed successfully",statusCode:200});


}
//============= Get User Profile =============
export const getProfile = async(req,res,next)=>{
  
    //decrypt phone
    var phone = Decrypt({ciperText:req.user.phone, SECRET_KEY:process.env.SECRET_KEY}).toString(CryptoJS.enc.Utf8);
    req.user.phone = phone;

    return res.status(200).json({messag:"User signed in successfully",user:req.user});

}
//============= logOut User ===============
export const logOut =async (req,res,next)=>{
  const revokeToken = await revokeTokenModel.create({
    tokenId: req.decoded.jti,
    expireAt: req.decoded.exp
    })
      return res.status(200).json({ messag: "logout successful", statusCode: 200 });

}
//============= refressh Token =============
export const refreshToken =async (req,res,next)=>{
    const {authorization} = req.headers;
    const [prefix , token] = authorization.split(" ")|| []
    if( ! prefix || ! token){
      throw new Error("token not exist", { cause: 404 });
    }

    let signature = "";

    if(prefix === "Bearer"){
      signature = process.env.REFRESH_TOKEN_USER;
    } else if(prefix === "admin"){
      signature = process.env.REFRESH_TOKEN_ADMIN;
    } else {
      throw new Error("Invalid token prefix", { cause: 400});
    }
    //verify token
    const decoded = await verifyToken({token,SIGNATURE:signature});
    if(!decoded?.email){
      throw new Error("Invalid token", { cause: 400 });
    }
    const revoke= await revokeTokenModel.findOne({tokenId:decoded.jti});
    if(revoke){
      throw new Error("Token has been revoked,please log in again", { cause: 400 });
    }
    //check if user exists
    const user = await userModel.findOne({email:decoded.email});
    if(!user){
       throw new Error("User not found", { cause: 404});
    }
     const access_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role=== userRole.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
        options:{expiresIn:"1h", jwtid : nanoid()}
      });

    const refresh_token = await generateToken({
        payload:{id:user._id, email: user.email },
        SINATURE:user.role === userRole.user ? process.env.REFRESH_TOKEN_USER: process.env.REFRESH_TOKEN_ADMIN,
        options:{expiresIn:"1y", jwtid : nanoid()}
      });
    return res.status(200).json({message:"Token refreshed successfully",statusCode:200,access_token,refresh_token});
}
//============= Update Password =============
export const updatePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if(!await Compare({plainText:oldPassword,cyperText:req.user.password})){
      throw new Error("invalid old passeord");
      }
    const hash = Hash({plainText:newPassword});  
    req.user.password = hash;
    await req.user.save();
    await revokeTokenModel.create({
      tokenId: req?.decoded?.jti,
      expireAt: req?.decoded?.exp
    })
    
    return res.status(200).json({ messag: "updata success", statusCode: 200 });
}
//============= Forget Password =============
export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  const otp = customAlphabet("123456789",5)();
  eventEmitter.emit("forgetPassword",{email , otp});
  user.otp= await Hash ({plainText:otp})
  await user.save();
    return res.status(200).json({ message: "success", statusCode: 200 });
}
//============= Reset Password =============
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await userModel.findOne({ email , otp: { $exists: true }
 });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  if (!await Compare({plainText:otp,ciperText:user?.otp})) {
    throw new Error("Invalid OTP", { cause: 400 });
  }
  const hash = await Hash({plainText:newPassword});
  await userModel.updateOne({email},{
    password:hash,
    $unset: { otp: "" } })
  return res.status(200).json({ message: "Password reset successfully", statusCode: 200 });
}
//============= update Profile =============
export const updateProfile = async (req, res, next) => {
  const {name , email ,gender , age , phone} = req.body;
  if (name) req.user.name = name;
  if(gender) req.user.gender= gender;
  if(age) req.user.age = age;
  if(phone){
    //encrypt phone
   var encryptedPhone = await Encrypt({plainText:phone,SECRET_KEY:process.env.SECRET_KEY});
   req.user.phone = encryptedPhone;
  }
  if(email){
    const user = await userModel.findOne({email});
    if(user)
      throw new Error("Email already exists", { cause: 400 });
    eventEmitter.emit("sendEmail",{ email: req.user.email });
  req.user.email = email;
  req.confirmed = false ;
  }
  await req.user.save();
  return res.status(200).json({ message: "Profile updated successfully", statusCode: 200, user: req.user });
}
//=============== get Profile ================
export const getProfileData = async (req, res, next) => {
  const {id} = req.params;
  const user = await userModel.findById(id).select("-password -phone -role -confirmed -createdAt -updatedAt ");
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  return res.status(200).json({ message: "User profile retrieved successfully", statusCode: 200, user });
}
//============= Freeze Profile =============
export const freezeProfile = async (req, res, next) => {
  const { id } = req.params;
  if(id && req.user.role !== userRole.admin) {
    throw new Error("You are not authorized to freeze this profile", { cause: 403 });
  }
  const user = await userModel.updateOne({
    _id : id || req.user._id ,
    isDeletes : {$exists : false}
  },
{
  isDeletes :true ,
  deletedBy : req.user._id
},
{
  $inc : {__v: 1}
}
)
user.matchedCount?
   res.status(200).json({ message: "Profile frozen successfully", statusCode: 200 }):
   res.status(404).json({ message: "Profile not found or already frozen", statusCode: 404 });
 
}
//============= un Freeze Profile =============
export const unFreezeProfile = async (req, res, next) => {
  const { id } = req.params;
  if(id && req.user.role !== userRole.admin) {
    throw new Error("You are not authorized to freeze this profile", { cause: 403 });
  }
  const user = await userModel.updateOne({
    _id : id || req.user._id ,
    isDeletes : {$exists : true}
  },
{
  $unset : {isDeletes : "" , deletedBy : ""}, 
  
},
{
  $inc : {__v: 1}
}
)
user.matchedCount?
   res.status(200).json({ message: "Profile frozen successfully", statusCode: 200 }):
   res.status(404).json({ message: "failed to un freeze", statusCode: 404 });
 
}
//============= Confirm Email TASK=============
export const confirmEmailTask = async (req, res, next) => {
  const { email, otp } = req.body;  
  const user = await userModel.findOne({ email, confirmed: false });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  if (user.emailVerificationBanExpire && user.emailVerificationBanExpire > Date.now()) {
    return res.status(403).json({ message: "is banned for 5 minutes due to too many attempts" });

  if (!user.emailVerificationCode || user.emailVerificationExpire < Date.now() ) {
    return res.status(400).json({ message: "Verification code expired or not sent" });
  }

  if (otp !== user.emailVerificationCode) {
    user.emailVerificationAttempts += 1;
    if (user.emailVerificationAttempts >= 5) {
      user.emailVerificationBanExpire = Date.now() + 5 * 60 * 1000;
      await user.save();
      return res.status(403).json({ message: "Too many attempts, please try again after 5 minutes" });

    }
    await user.save();
    return res.status(400).json({ message: "Invalid verification code" });
  }

  user.confirmed = true;
  user.emailVerificationCode = null;
  user.emailVerificationExpire = null;
  user.emailVerificationAttempts = 0;
  user.emailVerificationBanExpire = null;
  await user.save();
  return res.status(201).json({message:"User created successfully",user});
};
}
//================ update Profile Image =============
export const updateProfileImage = async (req, res, next) => {
   const {secure_url,public_id} = await cloudinary.uploader.upload(req?.file?.path,{
     folder:"sarahaApp/users/profileImages",
     })
     const user= await userModel.findByIdAndUpdate({_id : req?.user?._id},{
       profileImag: {secure_url,public_id} ,
     });
     await cloudinary.uploader.destroy(user?.profileImag?.public_id);
     return res.status(200).json({message:"Profile image updated successfully",user});
}