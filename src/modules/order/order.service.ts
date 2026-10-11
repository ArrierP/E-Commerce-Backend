import mongoose from "mongoose";
import { Order } from "./order.model.js";

import { redisClient, clearCachePattern } from "../../shared/config/redis.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";
import { logger } from "../../shared/config/logger.js";
import type { CheckoutInput } from "./order.schema.js";
import { InventoryService } from "../inventory/inventory.service.js";


export class OrderService {
    static async checkout(userId: string, data: CheckoutInput) {
        const session = await mongoose.startSession()

        try {
            let createOrder: any = null

            await session.withTransaction(async () => {

                const { cart, orderItem, totalAmount } = await InventoryService.checkAndDecreaseStock(userId, session)

                const order = new Order({
                    userId,
                    items: orderItem,
                    totalAmount,
                    shippingAddress: data.shippingAddress,
                    status: "pending"

                })

                await order.save({ session })

                // cart.items = []
                // await cart.save({ session })


                await cart.updateOne(
                    { $set: { items: [] } },
                    { session }
                );

                createOrder = order
            })

            try {
                await Promise.all([
                    redisClient.del(`cart:user:${userId}`),
                    clearCachePattern("products:list:*"),
                ])
            } catch (error: any) {
                logger.error({ error }, "Failed to invalidate cache after checkout:")
            }


            return createOrder
        } catch (error: any) {
            logger.error("Checkout transaction failed:", error);
            throw error
        }
        finally {
            (await session).endSession()
        }
    }

    static async getUserOrders(userId: string) {
        return await Order.find({ userId }).sort({ createdAt: -1 });
    }

    static async getOrderDetail(userId: string, orderId: string) {
        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) {
            throw new AppError("Order not found", 404);
        }
        return order;
    }

    static async cancelOrder(userId: string, orderId: string) {
        const session = await mongoose.startSession()

        try {
            let canceledOrder: any = null

            await session.withTransaction(async () => {
                const order = await Order.findOne({ _id: orderId, userId }).session(session)

                if (!order) {
                    throw new AppError("Order not found", 404)
                }

                if (order.status !== 'pending') {
                    throw new AppError("Only pending order can be canceled.", 400)
                }

                await InventoryService.restoreStock(order.items, session, true)

                order.status = 'cancelled'
                await order.save({ session })

                canceledOrder = order
            })

            return canceledOrder
        } finally {
            (await session).endSession()
        }
    }
}