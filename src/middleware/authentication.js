
import userModel from "../DB/models/user.model.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/token/verifyToken.js";
import rvokeTokenModel from "../DB/models/revoke-token.model.js";
export const authentication = async (req, res, next) => {
    const {authorization} = req.headers;

    const [prefix , token] = authorization.split(" ")|| []

    if( ! prefix || ! token){
      throw new Error("token not exist", { cause: 404 });
    }

    let signature = "";

    if(prefix === "Bearer"){
      signature = process.env.ACCESS_TOKEN_USER;
    } else if(prefix === "admin"){
      signature = process.env.ACCESS_TOKEN_ADMIN;
    } else {
      throw new Error("Invalid token prefix", { cause: 400});
    }
    //verify token
    const decoded = await verifyToken({token,SIGNATURE:signature});
    if(!decoded?.email){
      throw new Error("Invalid token", { cause: 400 });
    }
    const revoke= await rvokeTokenModel.findOne({tokenId:decoded.jti});
    if(revoke){
      throw new Error("Token has been revoked,please log in again", { cause: 400 });
    }
    //check if user exists
    const user = await userModel.findOne({email:decoded.email});
    if(!user){
       throw new Error("User not found", { cause: 404});
    }
    if (!user?.confirmed || user?.isDeleted){
      throw new Error("User is deleted", { cause: 404 });
    }
    req.user = user;
    req.decoded = decoded;
    return next();

 
}