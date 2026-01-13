import express from "express";
import morgan from "morgan";
import logger from "./middlewares/logger";
import userRouter from "./routes/users";
import productsRouter from "./routes/products";

const app = express();

app.use(morgan("dev"));

app.use(express.json());

app.use(logger);

app.use((req, res, next) => {
  console.log("My first middleware Function");
  next();
});

app.get("/", (req, res) => {
  return res.send("Welcome to my app  ");
});

app.use("/users", userRouter);
app.use("/products", productsRouter);

export default app;
