import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({

    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET

});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;
    const responce = await cloudinary.uploader.upload(localFilePath,
        {
            resource_type: "auto"
        },
        function (error) { console.log("Error while uploading to cloudinary", error); }
    )
    console.log("file uploaded successfully", responce.url);
}

export { uploadOnCloudinary}