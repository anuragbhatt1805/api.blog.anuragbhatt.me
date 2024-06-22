import mongoose from "mongoose";

import { UserSchema } from "./User.model";
import { BlogSchema } from "./Blog.model";

export const User = mongoose.model("User", UserSchema);
export const Blog = mongoose.model("Blog", BlogSchema);