import mongoose from "mongoose";

const collaborators = new mongoose.Schema({
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
        required: [true, "Collection ID is required"]
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    role: {
        type: String,
        enum: ["viewer", "editor", "admin"],
        default: "viewer"
    }
},{
    timestamps: true
})

export const Collaborators = mongoose.model("Collaborators", collaborators);