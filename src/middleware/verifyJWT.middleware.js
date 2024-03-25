import jwt from 'jsonwebtoken'
import { User } from '../models/User.models.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const veryfyJWT = asyncHandler(async (req, _, next) => {

    const token = req.cookies?.accessToken || req.header("Authorization"?.replace("Bearer ", ""))

    if (!token) {
        throw new ApiError(407, "UnAuthorized Request",)
    }

    const decodedToken = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    req.user = user

    next()
})


