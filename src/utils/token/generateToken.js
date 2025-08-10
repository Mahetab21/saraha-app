import jwt from 'jsonwebtoken';


export const generateToken = async({payload,SINATURE,options}={})=>{
    return jwt.sign(payload,SINATURE,options)
}
