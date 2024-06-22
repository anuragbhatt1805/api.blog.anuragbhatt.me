import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    RegisterUser
} from "../controller/User.controller.js";


export const UserRouter = Router();

UserRouter.post("/register", upload.fields([{name:"image", maxCount:1}]), RegisterUser);