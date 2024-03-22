import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponce from '../utils/ApiResponce.js';
import jwt from "jsonwebtoken"
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../middleware/cloudinary.middleware.js';
import mongoose from 'mongoose';

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // console.log(accessToken , refreshToken);
        user.refreshToken = refreshToken
        // console.log(accessToken , refreshToken);
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const userRegister = asyncHandler(async (req, res) => {
    // I get user details from frontend
    const { username, fullName, email, password } = req.body;

    // validation - not empty
    if ([username, fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    // check if user already exists: username, email
    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

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
    console.log("this is error---->", avatar);
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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    
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
                "User logged In Successfully",
                {
                    user: loggedInUser, accessToken, refreshToken
                }
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    //delete refresh token from database
    const user = req.user
    await User.findByIdAndUpdate(user._id, {
        "accessToken": undefined,
    })

    const option = {
        httpOnly: true,
        secure: true,
    }

    //delete access and refresh token from cookie
    res.status(200).clearCookie("accessToken", option).clearCookie("refreshToken", option).json(
        new ApiResponce(200, "User is logged out", user)
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    
    const inComingAccessToken = req.cookies?.accessToken
    

    if (inComingAccessToken) {
        throw new ApiError(403, "UnWanted Request User has Access Token")
    }
    const incomingAccessToken = req.cookies?.refreshToken

    console.log(!!incomingAccessToken);
    if (!incomingAccessToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const userId = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET)

    if (!userId) {
        throw new ApiError(401,"Unfit Token")
    }

    // console.log(userId);

    const user = User.findById(userId._id)

    if (!user) {
        throw new ApiError(401, "User does not Exist")
    }
    
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(userId._id)
    
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
                "User Authentication successfully",
                {
                    accessToken, refreshToken
                }
            )
        )

})

const deleteUser =asyncHandler(async (req, res) => {
    const user = req.user
    const responce = await User.findByIdAndDelete(user._id)
    
    if (!responce) {
        throw new ApiError(401,"some Error while deleting user")
    }

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(201).json(
        new ApiResponce(200,"User is successfully deleted", responce)
    )
})

export {
    userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    deleteUser
}