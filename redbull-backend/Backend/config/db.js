import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log("⚠️  No MONGO_URI found - running without database. User data will use localStorage only.");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.log("⚠️  DB Connection failed:", error.message);
    console.log("📝 Server will run without database - using localStorage fallback");
  }
};
