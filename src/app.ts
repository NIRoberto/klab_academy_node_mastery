import express from "express";
import morgan from "morgan";
import logger from "./middlewares/logger";
import userRouter from "./routes/users";
import productsRouter from "./routes/products";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  return res.send("Welcome to my app  ");
});
// API versioning
const apiV1 = express.Router();


apiV1.use("/users", userRouter);
apiV1.use("/products", productsRouter);

app.use("/api/v1", apiV1);

export default app;
