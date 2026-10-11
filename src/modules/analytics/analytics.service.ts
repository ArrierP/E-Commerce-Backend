import { Order } from "../order/order.model.js";
import type { BestSellerQuery, SalesChartQuery } from "./analytics.schema.js";
import { getOrSetCache } from "../../shared/utils/cache.js";

export class AnalyticsService {
    static async getRevenueOverview() {
        const now = new Date();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get Monday of current week (now.getDay(): 0 = Sunday, 1 = Monday, ...)
        const dayOfWeek = (now.getDay() + 6) % 7;
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [result] = await Order.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "paid"] },
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $facet: {
                    today: [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$totalAmount" },
                                orderCount: { $sum: 1 }
                            }
                        }
                    ],
                    thisWeek: [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$totalAmount" },
                                orderCount: { $sum: 1 }
                            }
                        }
                    ],
                    thisMonth: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$totalAmount" },
                                orderCount: { $sum: 1 }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    today: { $arrayElemAt: ["$today", 0] },
                    thisWeek: { $arrayElemAt: ["$thisWeek", 0] },
                    thisMonth: { $arrayElemAt: ["$thisMonth", 0] }
                }
            }
        ]);

        return {
            today: {
                totalRevenue: result?.today?.totalRevenue || 0,
                orderCount: result?.today?.orderCount || 0
            },
            thisWeek: {
                totalRevenue: result?.thisWeek?.totalRevenue || 0,
                orderCount: result?.thisWeek?.orderCount || 0
            },
            thisMonth: {
                totalRevenue: result?.thisMonth?.totalRevenue || 0,
                orderCount: result?.thisMonth?.orderCount || 0
            }
        };
    }

    static async getSalesChartData(query: SalesChartQuery) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);

        let dateFormat = "%Y-%m-%d";

        if (query.groupBy === "month") dateFormat = "%Y-%m";
        if (query.groupBy === "year") dateFormat = "%Y";

        const chartData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "paid"] },
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$createdAt",
                            timezone: "+07:00"
                        }
                    },
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalRevenue: 1,
                    totalOrders: 1,
                    averageOrderValue: { $round: ["$averageOrderValue", 2] }
                }
            }
        ]);

        return chartData;
    }

    static async getTopBestSellers(query: BestSellerQuery) {
        const { limit, sortBy, startDate, endDate } = query;

        const matchCondition: Record<string, any> = {
            status: { $in: ["completed", "paid"] }
        };

        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
            if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
        }

        const sortField = sortBy === "revenue" ? "totalRevenue" : "totalSold";

        const queryLimit = Number(limit)

        const topProducts = await Order.aggregate([
            {
                $match: matchCondition
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.name" },
                    unitPrice: { $first: "$items.price" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: { $multiply: ["$items.quantity", "$items.price"] }
                    }
                }
            },
            {
                $sort: { [sortField]: -1 }
            },
            {
                $limit: queryLimit
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    name: { $ifNull: ["$productDetails.name", "$productName"] },
                    category: "$productDetails.category",
                    unitPrice: 1,
                    totalSold: 1,
                    totalRevenue: 1
                }
            }
        ]);

        return topProducts;
    }

    static async getOrderStatusBreakdown(startDate?: string, endDate?: string) {
        const matchCondition: Record<string, any> = {};

        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
            if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
        }

        const aggregationPipeline: any[] = [];

        if (Object.keys(matchCondition).length > 0) {
            aggregationPipeline.push({ $match: matchCondition });
        }

        aggregationPipeline.push(
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$totalAmount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1,
                    totalValue: 1
                }
            }
        );

        const stats = await Order.aggregate(aggregationPipeline);

        const breakdown: Record<string, { count: number; totalValue: number }> = {
            pending: { count: 0, totalValue: 0 },
            paid: { count: 0, totalValue: 0 },
            shipping: { count: 0, totalValue: 0 },
            completed: { count: 0, totalValue: 0 },
            cancelled: { count: 0, totalValue: 0 }
        };

        let totalOrders = 0;
        stats.forEach((i: { status: string; count: number; totalValue: number }) => {
            if (breakdown[i.status]) {
                breakdown[i.status] = {
                    count: i.count,
                    totalValue: i.totalValue
                };
            }
            totalOrders += i.count;
        });

        return {
            totalOrders,
            breakdown
        };
    }

    static async getRevenueOverviewWithCache() {
        const key = "analytics:overview";
        return getOrSetCache(key, 900, () => this.getRevenueOverview());
    }

    static async getSalesChartDataWithCache(query: SalesChartQuery) {
        const key = `analytics:chart:${query.groupBy}:${query.startDate}:${query.endDate}`;
        return getOrSetCache(key, 900, () => this.getSalesChartData(query));
    }

    static async getTopBestSellersWithCache(query: BestSellerQuery) {
        const key = `analytics:best-sellers:${query.sortBy}:${query.limit}:${query.startDate || "all"}:${query.endDate || "all"}`;
        return getOrSetCache(key, 900, () => this.getTopBestSellers(query));
    }

    static async getOrderStatusBreakdownWithCache(startDate?: string, endDate?: string) {
        const key = `analytics:order-status:${startDate || "all"}:${endDate || "all"}`;
        return getOrSetCache(key, 900, () => this.getOrderStatusBreakdown(startDate, endDate));
    }
}