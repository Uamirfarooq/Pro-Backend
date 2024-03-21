import jwt from 'jsonwebtoken'
import { User } from '../models/User.models.js';
import ApiError from '../utils/ApiError.js';
export const getUserDetails = async (req, _, next) => {

    const token = req.cookie?.accessToken || req.header("Authorization"?.replace("Bearer ", ""))

    console.log(token);

    if (!token) {
        throw new ApiError(401, "UnAuthorized Request")
    }

    const decodedToken = jwt.decode(token,REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    req.user = user

    next()
}

