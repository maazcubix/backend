import { v2 as cloudinary } from "cloudinary";
import fs from "fs" 


cloudinary.config({ 
    cloud_name: "drrzvyxkv", 
    api_key: "148773812798219", 
    api_secret: "hC2DrxlQJw7bkdltXOOyO_qNBQ4" // Click 'View Credentials' below to copy your API secret
});



const upload=async(localPath)=>{
    try {
        if (!localPath) {
            return null   }
      const response= await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })
        console.log("file is uploaded on cloudininary",response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localPath);
        return null
    }
}

export {upload}