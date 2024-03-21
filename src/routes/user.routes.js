import express from "express";
import { upload } from "./../middleware/multer.middleware.js"
import { loginUser, logoutUser, userRegister } from "../controllers/user.controller.js";
import { getUserDetails } from "../middleware/getUserDetail.middleware.js";

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

router.route("/login").post(loginUser)

router.route("/logout").post(
    getUserDetails,
    logoutUser)

export default router