import type { Request, Response } from "express";
import { OrderService } from "./order.service.js";
import type { CheckoutInput } from "./order.schema.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";

export class OrderController {
  static async checkout(req: Request<{}, {}, CheckoutInput>, res: Response) {
    try {
      const userId = req.user?.userId || (req as any).user?.id;
      if (!userId) throw new AppError("Unauthorized.", 401);

      const order = await OrderService.checkout(userId, req.body);

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async getMyOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.userId || (req as any).user?.id;
      if (!userId) throw new AppError("Unauthorized.", 401);

      const orders = await OrderService.getUserOrders(userId);
      res.status(200).json({ success: true, orders });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async getOrderDetail(req: Request<{ id: string }>, res: Response) {
    try {
      const userId = req.user?.userId || (req as any).user?.id;
      if (!userId) throw new AppError("Unauthorized.", 401);

      const { id } = req.params;
      const order = await OrderService.getOrderDetail(userId, id);
      res.status(200).json({ success: true, order });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    }
  }
}