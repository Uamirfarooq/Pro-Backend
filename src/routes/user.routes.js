import express from "express";
import { upload } from "./../middleware/multer.middleware.js"
import { changeCurrentPassword, deleteUser, loginUser, logoutUser, refreshAccessToken, updateUserDetails, userRegister } from "../controllers/user.controller.js";
import { veryfyJWT } from "../middleware/verifyJWT.middleware.js";

const router = express();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    userRegister)

router.route("/login")
.post(loginUser)

router.route("/logout")
.post(veryfyJWT,logoutUser)

router.route("/refreshToken")
.get(refreshAccessToken);

router.route("/delete")
.get(veryfyJWT,deleteUser)

router.route("/change-password")
.get(veryfyJWT,changeCurrentPassword)

router.route("/update-user").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),veryfyJWT,updateUserDetails)

export default router