import z from "zod";

export const checkoutBodySchema = z.object({
  shippingAddress: z.string().trim().min(5, "Address must be at least 5 characters"),
});

export type CheckoutInput = z.infer<typeof checkoutBodySchema>;