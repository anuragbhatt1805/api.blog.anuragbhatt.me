import mongoose from "mongoose";
import { createClient } from "redis";

export const connectDB = async () => {
    try {
        const mongo = await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DATABASE}`)
        console.log("MONGO:",`Database connected: ${mongo.connection?.name}`);
    } catch (error) {
        console.error("MONGO:","Database connection failed");
    }
}

export const redisClient = createClient({
    url: process.env.REDIS_URI
});