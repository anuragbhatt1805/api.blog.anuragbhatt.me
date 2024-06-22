import mongoose from "mongoose";

import { UserSchema } from "./User.model.js";
import { BlogSchema } from "./Blog.model.js";

export const User = mongoose.model("User", UserSchema);
export const Blog = mongoose.model("Blog", BlogSchema);