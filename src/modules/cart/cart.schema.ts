import z from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addToCartBodySchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const updateQuantityBodySchema = z.object({
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export type AddToCartInput = z.infer<typeof addToCartBodySchema>;
export type UpdateQuantityInput = z.infer<typeof updateQuantityBodySchema>;