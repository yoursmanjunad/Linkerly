import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

console.log("Attempting to connect to MongoDB...");
// console.log("URI:", process.env.MONGO_URI); // Don't log credentials

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Connected successfully!");
    process.exit(0);
})
.catch((err) => {
    console.error("Connection failed!");
    console.error(err);
    process.exit(1);
});
