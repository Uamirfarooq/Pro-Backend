import { asyncHandler } from './../utils/asyncHandler.js';
import ApiError from './../utils/ApiError.js';
import ApiResponce from './../utils/ApiResponce.js';
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../middleware/cloudinary.middleware.js';

const userRegister = asyncHandler(async (req, res) => {
    // I get user details from frontend
    const { username, fullName, email, password } = req.body;

    // validation - not empty
    if (![username, fullName, email, password].some((field) => field?.trim() === "")) 
    {
        throw new ApiError(400, "All fields are required")
    }
    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User's Email Or Username all ready Exist")
    }
    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(409, "Avatar is required at local path")
    }
    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(409, "avatar is required") 
    }
    // create user object - create entsry in db
    const user = await User.create({
        username: username.toLowerCase(),
        email: email,
        fullName: fullName,
        password: password,
        avatar: avatar.url,
        coverImage: coverImage.url || ""
    })

    // remove password and refresh token field from response
    const createdUser = await User.findOne(user._id).select("-password -refreshToken")

    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating new user")
    }

    // return res
    return res.status(201).json(
        new ApiResponce(200, createdUser , "User Created SuccessFully")
    )


})

export { userRegister }