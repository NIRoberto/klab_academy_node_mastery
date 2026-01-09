import type { Request, Response, NextFunction } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`request Method  ${req.method}  ${req.originalUrl}  `);
  next();
};

export default logger;
