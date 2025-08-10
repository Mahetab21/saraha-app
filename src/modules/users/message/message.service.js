import userModel from "../../../DB/models/user.model.js";
import messageModel from "../../../DB/models/message.model.js";
//=============== create Message===============
export const createMessage = async (req, res, next) => {
  const { userId, content } = req.body;
  const userExist = await userModel.findOne({
    _id: userId,
   isDeleted: { $exists: false },
  });
  if (!userExist) {
    throw new Error("User not found or freezen");
  }
  const message = await messageModel.create({
    userId,
    content,
  });
  res.status(201).json({ message: "Message Created Successfully", message });
};
//=============== list Messages===============
export const listMessages = async (req , res, next)=>{
    const messages = await messageModel.find({userId:req?.user?._id}).populate([
        {
            path: "userId",
        }
    ])
      res.status(200).json({ message: " Successfully", messages });

}
//=============== get One Message ============
export const getMessage = async (req, res, next) => {
  const { id } = req.params;
  const message = await messageModel.findOne({userId: req?.user?._id, _id: id});
    if (!message) {
        throw new Error("Message not found or you don't have permission to view it");
    }
  res.status(200).json({ message: "Message retrieved successfully", message });
};