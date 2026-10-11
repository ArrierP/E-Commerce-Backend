import z from "zod";

export const productBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z.string().trim().min(1, "Slug is required."),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  category: z.string().trim().min(1, "Category is required"),
  stock: z.number().int("Stock must be an integer").min(0, "Stock cannot be negative"),
  isActive: z.boolean().default(true),
});

export const updateProductBodySchema = productBodySchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "newest"]).default("newest"),
});

export type CreateProductInput = z.infer<typeof productBodySchema>;
export type UpdateProductInput = z.infer<typeof updateProductBodySchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;