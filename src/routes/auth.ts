import express from "express";
import { profile, register, login } from "../controllers/auth.controller";
import authenticate from "../middlewares/authenticate";

const authenticationRouter = express.Router();

authenticationRouter.post("/register", register);

authenticationRouter.post("/login", login);

authenticationRouter.get("/profile", authenticate, profile);

//  password reset, forgot password and many more

export default authenticationRouter;
