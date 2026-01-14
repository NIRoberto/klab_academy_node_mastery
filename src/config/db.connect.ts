import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "");
    console.log("DB connected successfully");
  } catch (error) {
    console.log("THere is error in connecting to mongoDB database", error);
  }
};

export { connectDB };
