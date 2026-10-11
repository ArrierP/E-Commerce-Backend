import type { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "./analytics.service.js";
import type { BestSellerQuery, OrderStatusQuery, SalesChartQuery } from "./analytics.schema.js";

export class AnalyticsController {
    static async getOverview(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await AnalyticsService.getRevenueOverviewWithCache();
            return res.status(200).json({
                success: true,
                message: "Get revenue overview successfully",
                data
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesChart(req: Request<{}, {}, {}, SalesChartQuery>, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as SalesChartQuery;
            const data = await AnalyticsService.getSalesChartDataWithCache(query);

            return res.status(200).json({
                success: true,
                message: "Get sales chart data successfully",
                data
            });
        } catch (error) {
            next(error);
        }
    }

    static async getBestSellers(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as BestSellerQuery;
            const data = await AnalyticsService.getTopBestSellersWithCache(query);

            return res.status(200).json({
                success: true,
                message: "Get top best sellers successfully",
                data
            });
        } catch (error) {
            next(error);
        }
    }

    static async getOrderStatusStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate } = req.query as unknown as OrderStatusQuery;
            const data = await AnalyticsService.getOrderStatusBreakdownWithCache(
                startDate,
                endDate
            );

            return res.status(200).json({
                success: true,
                message: "Get order status breakdown successfully",
                data
            });
        } catch (error) {
            next(error);
        }
    }
}