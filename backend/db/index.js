import mongoose from "mongoose";

export const connectDB = async()=>{
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {   
        console.error("MONGODB connection FAILED ", error);
        process.exit(1);
    }
}
export default connectDB;