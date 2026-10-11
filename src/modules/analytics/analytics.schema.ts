import z from "zod";

export const salesChartQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }),
  groupBy: z.enum(["day", "month", "year"]).default("day"),
});

export const bestSellersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
  sortBy: z.enum(["quantity", "revenue"]).default("quantity"),
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
});

export const orderStatusQuerySchema = z.object({
  startDate: z.string().datetime({ message: "Invalid startDate ISO format" }).optional(),
  endDate: z.string().datetime({ message: "Invalid endDate ISO format" }).optional(),
});

export type SalesChartQuery = z.infer<typeof salesChartQuerySchema>;
export type BestSellerQuery = z.infer<typeof bestSellersQuerySchema>;
export type OrderStatusQuery = z.infer<typeof orderStatusQuerySchema>;