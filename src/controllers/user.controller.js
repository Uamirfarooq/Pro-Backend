import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponce from '../utils/ApiResponce.js';
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../middleware/cloudinary.middleware.js';
import mongoose from 'mongoose';

const userRegister = asyncHandler(async (req, res) => {
    // I get user details from frontend
    const { username, fullName, email, password } = req.body;

    // validation - not empty
    if ([username, fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User's Email Or Username all ready Exist")
    }
    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(409, "Avatar is required at local path")
    }
    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("this is error---->",avatar);
    if (!avatar) {
        throw new ApiError(409, "avatar is required")
    }
    // create user object - create entsry in db
    const user = await User.create({
        username: username?.toLowerCase(),
        email: email,
        fullName: fullName,
        password: password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // remove password and refresh token field from response
    const createdUser = await User.findOne(user._id).select("-password -refreshToken")

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating new user")
    }

    // return res
    return res.status(201).json(
        new ApiResponce(200, createdUser, "User Created SuccessFully")
    )


}) 

// const generateAccessAndRefereshTokens = async (user_id) => {
//     const user = User.findOne(user_id)

//     const accessToken = user.genrateAccessToken()
//     const refreshToken = user.genrateRefreshToken()

//     return {
//         accessToken, refreshToken
//     }
// }

// const loginUser = asyncHandler(async (req, res) => {
//     // need data from user
//     const { username, email, password } = req.body;
//     // check for email and username
//     console.log("this is ",username ,email,password);
//     if(!username || !email){
//         throw new ApiError(401, "User or Email is required")
//     }

//     const user = User.findOne({
//         $or: [{ username }, { email }]
//     })
//     if (!user) {
//         throw new ApiError(401, "Enter username or email for validation")
//     }

//     const inPasswordValid = await user.isPasswordCorrect(password)
    

//     // check for password
//     if (!inPasswordValid) {
//         throw new ApiError(401, "User crenditals are required")
//     }
//     // genrate access and refresh token
//     const { accessToken, refreshToken } = genrateAccessAndRefreshToken(user._id)

//     // get respoce of login user
//     const logedInUser = await User.findById(user._id).select("-password -refresh-token")
//     //set cookies
//     const option = {
//         httpOnly: true,
//         secure: true,
//     }
//     // return responce
//     return res.status(200).cookie("access_token", accessToken, option).cookie("refresh_token", refreshToken, option).json(
//         new ApiResponce(
//             200,
//             "User is logedin",
//             { user: logedInUser, accessToken, refreshToken },

//         )
//     )
// })

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // console.log(accessToken , refreshToken);
        user.refreshToken = refreshToken
        console.log("going to save");
        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponce(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    //delete refresh token from database
    const user = req.user
    await User.findByIdAndUpdate(user._id,{
        "accessToken": undefined,
    })

    const option= {
        httpOnly: true,
        secure: true,
    }

    //delete access and refresh token from cookie
    res.status(200).clearCookie("accessToken", option).clearCookie("refreshToken", option).json(
        new ApiResponce(200,"User is logged out",user)
    )
})

export {
    userRegister,
    loginUser,
    logoutUser
}