import express from "express";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.config";
import logger from "./middlewares/logger";
import userRouter from "./routes/users";
import productsRouter from "./routes/products";
import authenticationRouter from "./routes/auth";
import cartRouter from "./routes/cart.routes";
import orderRouter from "./routes/order.routes";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(logger);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get("/", (req, res) => {
  return res.send("Welcome to my app  ");
});

// Swagger Documentation Route
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Product API Docs",
  })
);

// API versioning
const apiV1 = express.Router();

apiV1.use("/users", userRouter);
apiV1.use("/products", productsRouter);
apiV1.use("/auth", authenticationRouter);
apiV1.use("/cart", cartRouter);
apiV1.use("/orders", orderRouter);

app.use("/api/v1", apiV1);

export default app;
