import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import { httpLogger } from "./shared/config/httpLogger.js";
import authRoutes from "./modules/auth/auth.route.js";
import productRoutes from "./modules/product/product.route.js";
import orderRoutes from "./modules/order/order.route.js";
import cartRoutes from "./modules/cart/cart.route.js";
import analyticsRoutes from "./modules/analytics/analytics.route.js";
import { errorHandler } from "./shared/middlewares/error.middleware.js";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "API is running smoothly 🚀",
  });
});

app.use(errorHandler);

export default app;