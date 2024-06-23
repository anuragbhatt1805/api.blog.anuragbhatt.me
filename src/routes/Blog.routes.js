import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
    CreateBlog, GetTags, GetBlogs, GetBlog,
    DeleteBlog, UpdateBlog, LikeBlog, UnLikeBlog,
    CommentOnBlog, DeleteComment
} from "../controller/Blog.controller.js";


export const BlogRouter = Router();


BlogRouter.get("/tags", GetTags);

BlogRouter.post("/create", auth, upload.fields([{name:"image", maxCount:1}]), CreateBlog);
BlogRouter.get("/", GetBlogs);

BlogRouter.get("/:id", GetBlog);
BlogRouter.patch("/:id", auth, upload.fields([{name:"image", maxCount:1}]), UpdateBlog);
BlogRouter.delete("/:id", auth, DeleteBlog);
BlogRouter.put("/:id/like", auth, LikeBlog);
BlogRouter.put("/:id/unlike", auth, UnLikeBlog);

BlogRouter.post("/:id/comment", auth, CommentOnBlog);
BlogRouter.delete("/:id/comment/:commentId", auth, DeleteComment);