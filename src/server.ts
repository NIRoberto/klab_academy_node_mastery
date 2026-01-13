import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/database.connect";

dotenv.config({});

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("Server is up and running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
