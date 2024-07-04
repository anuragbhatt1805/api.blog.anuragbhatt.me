import { ApiError, ApiResponse, AsyncHandler } from '../util/index.js';
import { User, Blog } from '../model/index.js';
import { uploadOnCloudinary } from '../util/cloudinary.js';
import { generateToken } from '../util/TokenGeneration.js';

export const RegisterUser = AsyncHandler(async (req, res) => {
    try {
        const {name, email, username, password} = req.body;

        if (!name || !email || !username || !password) {
            return res.status(400).json(new ApiError(400, "Please provide all required fields"));
        }

        const existingUser = await User.findOne({$or : [{email}, {username}]});

        if (existingUser) {
            return res.status(400).json(new ApiError(400, "User already exists"));
        }

        if (!req?.files?.image[0]?.path){
            return res.status(400).json(new ApiError(400, "Please provide an profile picture"));
        }

        const image = await uploadOnCloudinary(req.files.image[0].path);

        if (!image) {
            return res.status(500).json(new ApiError(500, "Image upload failed"));
        }

        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            username: username.trim().toUpperCase(),
            password,
            image: image.url,
        })

        if (!user) {
            return res.status(500).json(new ApiError(500, "User registration failed"));
        }

        const {accessToken, refreshToken} = await generateToken(user._id);

        const newUser = await User.findById(user._id).select("-password -__v -_id");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

        return res.status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(201, {...newUser?._doc, accessToken, refreshToken}, "User registered successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const LoginUser = AsyncHandler(async (req, res) => {
    try {
        const {login, password} = req.body;

        if (!login || !password) {
            return res.status(400).json(new ApiError(400, "Please provide all required fields"));
        }

        const user = await User.findOne({$or: [{email: login.toLowerCase()}, {username: login.toUpperCase()}]})
            .select("-access_token -refresh_token -__v");

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        if (!await user.verifyPassword(password)) {
            return res.status(401).json(new ApiError(401, "Invalid credentials"));
        }

        const {accessToken, refreshToken} = await generateToken(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, {...user?._doc, accessToken, refreshToken}, "User logged in successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const LogoutUser = AsyncHandler(async (req, res) => {
    try {
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const GetUser = AsyncHandler(async (req, res) => {
    try {
        return res.status(200)
            .json(new ApiResponse(200, {...req.user?._doc}, "User fetched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const UpdateUser = AsyncHandler(async (req, res) => {
    try {
        const data = {};

        if ("name" in req.body) {
            data.name = req.body.name;
        }
        if ("email" in req.body) {
            data.email = req.body.email;
        }
        if ("username" in req.body) {
            data.username = req.body.username;
        }
        if ("password" in req.body) {
            data.password = req.body.password;
        }
        if ("image" in req.files) {
            const image = await uploadOnCloudinary(req?.files?.image[0]?.path);

            if (!image) {
                return res.status(500).json(new ApiError(500, "Image upload failed"));
            }

            data.image = image.url;
        }

        const user = await User.findByIdAndUpdate(req.user._id, data, {new: true}).select("-password -__v -_id");

        if (!user) {
            return res.status(500).json(new ApiError(500, "User update failed"));
        }

        return res.status(200)
            .json(new ApiResponse(200, {...user?._doc}, "User updated successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const DeleteUser = AsyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user._id);

        if (!user) {
            return res.status(500).json(new ApiError(500, "User deletion failed"));
        }

        await Blog.deleteMany({author: req.user._id});

        return res.status(200)
            .json(new ApiResponse(200, {}, "User deleted successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const GetUserById = AsyncHandler(async (req, res) => {
    try {
        const user = await User.findOne({username: req.params.id?.toUpperCase()}).select("-password -__v -_id -access_token -refresh_token");

        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const blogs = await Blog.find({ author: user._id }).select('_id title content image tags');

        const userData = {
            user: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            blogs: blogs.map(blog => ({
                _id: blog._id,
                title: blog.title,
                content: blog.content,
                image: blog.image,
                tags: blog.tags
            }))
        };

        return res.status(200)
            .json(new ApiResponse(200, userData, "User fetched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});