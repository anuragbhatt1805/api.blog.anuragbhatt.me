import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    RegisterUser, LoginUser, LogoutUser,
    GetUser, UpdateUser, DeleteUser, GetUserById
} from "../controller/User.controller.js";


export const UserRouter = Router();

UserRouter.post("/register", upload.fields([{name:"image", maxCount:1}]), RegisterUser);
UserRouter.post("/login", LoginUser);
UserRouter.post("/logout", auth, LogoutUser);

UserRouter.get("/", auth, GetUser);
UserRouter.patch("/", auth, upload.fields([{name:"image", maxCount:1}]), UpdateUser);
UserRouter.delete("/", auth, DeleteUser);
UserRouter.get("/:id", GetUserById);