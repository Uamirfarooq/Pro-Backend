import express from "express";
import { upload } from "./../middleware/multer.middleware.js"
import { deleteUser, loginUser, logoutUser, refreshAccessToken, userRegister } from "../controllers/user.controller.js";
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

router.route("/login").post(loginUser)

router.route("/logout").post(
    veryfyJWT,
    logoutUser)

router.route("/refreshToken").get(refreshAccessToken);

router.route("/delete").get(
    veryfyJWT,
    deleteUser)

export default router