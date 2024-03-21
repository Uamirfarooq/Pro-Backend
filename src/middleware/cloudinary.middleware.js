import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({

    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET

});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Enter is cloudinary", localFilePath);
        if (!localFilePath) return null;
            const responce = await cloudinary.uploader.upload(localFilePath,
                {
                    resource_type: "auto"
                }
        )

        console.log("file uploaded successfully", responce.url);
        fs.unlinkSync(localFilePath)
        return responce
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log(error);
        return null
    }
}

export { uploadOnCloudinary }