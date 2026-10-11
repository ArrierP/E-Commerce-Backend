import z from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const inventoryBodySchema = z.object({
    productId: z.string().regex(objectIdRegex, "Invalid Product ID"),
    stock: z.number().int().nonnegative(),
    reservedStock: z.number().int().nonnegative().default(0),
    lowStockThreshold: z.number().int().nonnegative().default(5)
});

export const updateStockBodySchema = z.object({
    stock: z.number().int().nonnegative()
});

export type InventoryInput = z.infer<typeof inventoryBodySchema>;
export type UpdateStockInput = z.infer<typeof updateStockBodySchema>;