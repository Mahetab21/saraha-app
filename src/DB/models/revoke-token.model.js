import mongoose from "mongoose";
const revokeTokenScheme = new mongoose.Schema({
    tokenId:{
        type: String,
        required: true,
    },
    expireAt:{
        type: Date,
        required: true,
    }
},{
    timestamps:true
})
const revokeTokenModel = mongoose.models.RevokeToken || mongoose.model("RevokeToken", revokeTokenScheme);
export default revokeTokenModel;