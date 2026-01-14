import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.config";
import logger from "./middlewares/logger";
import userRouter from "./routes/users";
import productsRouter from "./routes/products";
import authenticationRouter from "./routes/auth";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(logger);

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

app.use("/api/v1", apiV1);

export default app;
