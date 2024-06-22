import { ApiError, ApiResponse, AsyncHandler } from '../util/index.js';
import { User } from '../model/index.js';
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