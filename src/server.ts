import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db.connect";

dotenv.config({});

const PORT = parseInt(process.env.PORT || '8080');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log("Server is up and running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
