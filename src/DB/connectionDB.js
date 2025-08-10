import mongoose from "mongoose";

export const checkConnectDB = async () => {

       await mongoose.connect(process.env.DB_URL)
       .then(()=>{
        console.log("Connected to MongoDB successfully");
       }).catch((err)=>{
        console.error("Error connecting to MongoDB:", err);
       })
 }
     
 export default checkConnectDB;