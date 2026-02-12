import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "", {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log("DB connected successfully");
  } catch (error) {
    console.log("There is error in connecting to MongoDB database", error);
    process.exit(1); // Exit if DB connection fails
  }
};

export { connectDB };
