import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponce from '../utils/ApiResponce.js';
import jwt from "jsonwebtoken"
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../middleware/cloudinary.middleware.js';
import bcrypt from 'bcrypt'

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

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
    const vari = ([username, fullName, email, password].some((fields) => (fields?.trim() === "" || fields?.trim() === undefined)))
    if (vari) {
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


    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

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

    if (!incomingAccessToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const userId = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET)

    if (!userId) {
        throw new ApiError(401, "Unfit Token")
    }

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

const deleteUser = asyncHandler(async (req, res) => {
    const user = req.user
    const responce = await User.findByIdAndDelete(user._id)

    if (!responce) {
        throw new ApiError(401, "some Error while deleting user")
    }

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(201).json(
        new ApiResponce(200, "User is successfully deleted", responce)
    )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const currentUser = req.user;

    const pass = await currentUser.isPasswordCorrect(currentPassword)

    if (!pass) {
        throw new ApiError(401, "Current password is incorrect")
    }

    currentUser.password = newPassword

    const userWithPass = await currentUser.save({validateBeforeSave: false})
        

        if(!userWithPass){
        throw new ApiError(407, "Password is not updated")
        }

        res.status(200).json(
            new ApiResponce(200, "Your password has updated Successfully",{userWithPass})
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req?.user

    if(!user){
        throw new ApiError(407, "User is not Authenticated")
    }

    res.status(200).json(
        new ApiResponce(200, "User Found", {user})
    )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const user = req.user;

    const existedUser = await User.findById(user._id)

    const {username, email, fullName, password} = req.body

    if([username, email, fullName, password].some((field) => field?.trim() === "")){
        throw new ApiError(401, "All field Required")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(401, "Avatar is Required")
    }
    if(!coverImageLocalPath){
        throw new ApiError(401, "coverImage is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    existedUser.username = username;
    existedUser.email = email;
    existedUser.fullName = fullName;
    existedUser.password = password;
    existedUser.avatar = avatar;
    existedUser.coverImage = coverImage;

    const newUser =await existedUser.save()

    if (!newUser) {
        throw new ApiError(409, "User is not modifyed")
    }

    res.status(200).json(
        new ApiResponce(207, "user is modifyed Succesfully",{newUser})
    )
})

// in update user avatar and coverimage is panding to upload to cloudinary

const updateAvatar = asyncHandler(async(req, res) => {
    const user = req.user

    const avatarLocalPath =req.files?.avatar[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(407,"avatar not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(407,"Error Occure while Uploading")
    }

    user.avatar = avatar

    const UpdatedUser = user.save({validateBeforeSave: false})

    res.status(200).json(
        new ApiResponce(201,"Avatar is Updated Succesfully",{UpdatedUser})
    )
})

const updateCoverImage = asyncHandler(async(req, res) => {
    const user = req.user

    const coverImageLocalPath =req.files?.coverImage[0]?.path

    if (!coverImageLocalPath) {
        throw new ApiError(407,"coverImage not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(407,"Error Occure while Uploading")
    }

    user.coverImage = coverImage

    const UpdatedUser = user.save({validateBeforeSave: false})


    res.status(200).json(
        new ApiResponce(201,"coverImage is Updated Succesfully",{UpdatedUser})
    )
})

export {
    userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    deleteUser,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateCoverImage,
    updateAvatar
}