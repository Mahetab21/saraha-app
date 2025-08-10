import multer from "multer";
import fs from 'fs';
export const allowedExtentions = {
    image:["image/png", "image/jpeg"],
    videos:["video/mp4"],
    };
export const MulterLocal =({customPath="generals",customExtentions=[]}={})=>{
    const fullPath= `uploads/${customPath}`;
    if(!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath, { recursive: true });
    }
    const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, fullPath)
  },
  filename: function (req, file, cb) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniqueSuffix  + '-' +  file.originalname)
  }
})
function fileFilter(req, file, cb) {
    if(!customExtentions.includes(file.mimetype)){
        cb(new Error("Only png files are allowed"));
    }else{
        cb(null, true);
    }
}

const upload = multer({ storage ,fileFilter})
return upload
}
export const MulterHost =({customExtentions=[]}={})=>{

  const storage = multer.diskStorage({})
  function fileFilter(req, file, cb) {
    if(!customExtentions.includes(file.mimetype)){
        cb(new Error("Only png files are allowed"));
    }else{
        cb(null, true);
    }
}

const upload = multer({ storage ,fileFilter})
return upload
}
export default MulterHost;