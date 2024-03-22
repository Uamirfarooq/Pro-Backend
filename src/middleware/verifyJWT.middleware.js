import jwt from 'jsonwebtoken'
import { User } from '../models/User.models.js';
import ApiError from '../utils/ApiError.js';
export const veryfyJWT = async (req, _ , next) => {

    const token = req.cookies?.accessToken || req.header("Authorization"?.replace("Bearer ", "")) 

    console.log(token);

    if (!token) {
        throw new ApiError(401, "UnAuthorized Request")
    }

    const decodedToken = jwt.decode(token,process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    req.user = user

    next()
}


