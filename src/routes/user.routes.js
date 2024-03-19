import express from "express";
import { userRegister } from "../controllers/userRegister.controller.js";
import { upload } from "./../middleware/multer.middleware.js"

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

export default router