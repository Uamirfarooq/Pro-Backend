import express from "express";
import { userRegister } from "../controllers/userRegister.controller.js";

const router = express();

router.route("/register").post(userRegister)

export default router