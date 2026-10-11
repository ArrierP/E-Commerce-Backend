import express from "express";
import { AnalyticsController } from "./analytics.controller.js";
import {
  bestSellersQuerySchema,
  salesChartQuerySchema,
  orderStatusQuerySchema,
} from "./analytics.schema.js";
import { validate } from "../../shared/middlewares/validator.middleware.js";
import { authenticate, requireAdmin } from "../../shared/middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate, requireAdmin());

router.get("/overview", AnalyticsController.getOverview);
router.get("/chart", validate({ query: salesChartQuerySchema }), AnalyticsController.getSalesChart);
router.get("/best-sellers", validate({ query: bestSellersQuerySchema }), AnalyticsController.getBestSellers);
router.get("/order-status", validate({ query: orderStatusQuerySchema }), AnalyticsController.getOrderStatusStats);

export default router;