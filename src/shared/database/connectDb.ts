import mongoose from 'mongoose'


export const connectDb = async () => {
    const uri = process.env.MONGO_URI || ""
    if(!uri) {
        throw new Error("❌ MONGO_URI is not defined in environment variables.")
    }
    try {
        await mongoose.connect(uri)
        console.log("✅ Connect to database successfully.");
    }
    catch (err: any) {
        console.error("❌ Error while connecting to database: ", err);
        throw err
    }
}