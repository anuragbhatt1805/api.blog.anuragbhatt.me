import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unqiue: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    access_token: {
        type: String
    },
    refresh_token: {
        type: String
    },
}, {
    timestamps: true
});

UserSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 1);
    }
    next();
});

UserSchema.methods.verifyPassword = async function (password){
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = async function() {
    return await jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userId: this.userId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '7d'
        }
    )
}


UserSchema.methods.generateRefreshToken = async function() {
    return await jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userId: this.userId
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: '30d'
        }
    )
}
