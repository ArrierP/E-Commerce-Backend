import type { Request, Response } from "express";
import type { AddToCartInput, UpdateQuantityInput } from "./cart.schema.js";
import { CartService } from "./cart.service.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";

export class CartController {
    static async getCart(req: Request, res: Response) {
        try {
            const userId = req.user?.userId || (req as any).user?.id;
            if (!userId) throw new AppError("Unauthorized.", 401);

            const cart = await CartService.getCart(userId);
            res.status(200).json({ success: true, cart });
        } catch (err: any) {
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    static async addItem(req: Request<{}, {}, AddToCartInput>, res: Response) {
        try {
            const userId = req.user?.userId || (req as any).user?.id;
            if (!userId) throw new AppError("Unauthorized.", 401);

            const cart = await CartService.addToCart(userId, req.body);
            res.status(200).json({ success: true, message: "Add item to cart successfully.", cart });
        } catch (err: any) {
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    static async updateQuantity(req: Request<{ productId: string }, {}, UpdateQuantityInput>, res: Response) {
        try {
            const userId = req.user?.userId || (req as any).user?.id;
            if (!userId) throw new AppError("Unauthorized.", 401);

            const { productId } = req.params;
            const cart = await CartService.updateQuantity(userId, productId, req.body);
            res.status(200).json({ success: true, message: "Update quantity successfully.", cart });
        } catch (err: any) {
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }

    static async removeItem(req: Request<{ productId: string }>, res: Response) {
        try {
            const userId = req.user?.userId || (req as any).user?.id;
            if (!userId) throw new AppError("Unauthorized.", 401);

            const { productId } = req.params;
            const cart = await CartService.removeCartItem(userId, productId);
            res.status(200).json({ success: true, message: "Item removed", data: cart });
        } catch (err: any) {
            res.status(err.statusCode || 500).json({
                success: false,
                message: err.message
            });
        }
    }
}