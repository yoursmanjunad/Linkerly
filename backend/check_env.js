import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
    console.log("MONGO_URI is undefined or empty");
} else {
    console.log("MONGO_URI is defined");
    console.log("Length:", uri.length);
    console.log("Starts with mongodb+srv://:", uri.startsWith("mongodb+srv://"));
    console.log("Contains @:", uri.includes("@"));
    // Log the domain part if safe? 
    // mongodb+srv://user:pass@PROJECT.mongodb.net/...
    try {
        const parts = uri.split('@');
        if (parts.length > 1) {
             const domainPart = parts[1].split('/')[0];
             console.log("Domain:", domainPart);
        }
    } catch (e) {
        console.log("Parse error");
    }
}
