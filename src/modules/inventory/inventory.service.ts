import { Inventory } from "./inventory.model.js";
import { Cart } from "../cart/cart.model.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";
import { Product } from "../product/product.model.js";
import mongoose from "mongoose";

export class InventoryService {
    static async checkAndDecreaseStock(userId: string, session: mongoose.mongo.ClientSession) {
        const cart = await Cart.findOne({ userId })

        if (!cart || cart.items.length === 0) {
            throw new AppError("Cart is empty", 400);
        }

        const orderItem: Array<{
            productId: mongoose.Types.ObjectId,
            name: string,
            price: number,
            quantity: number
        }> = []

        let totalAmount = 0

        for (const item of cart.items) {
            const product = await Product.findOne({ _id: item.productId, isActive: true }).session(session);
            if (!product) {
                throw new AppError(`Product ${item.productId} not found or inactive`, 404);
            }
            const updatedInventory = await Inventory.findOneAndUpdate(
                {
                    productId: item.productId,
                    stock: { $gte: item.quantity }
                },
                {
                    $inc: { stock: -item.quantity, reservedStock: item.quantity }
                },
                {
                    session,
                    returnDocument: 'after'
                }
            )

            if (!updatedInventory) {
                const currentInventory = await Inventory.findOne({ productId: item.productId }).session(session);
                const availableStock = currentInventory?.stock ?? 0;
                throw new AppError(`Product "${product.name}" does not have enough stock (Available: ${availableStock})`, 400);
            }


            const itemTotal = product.price * item.quantity

            totalAmount += itemTotal

            orderItem.push({
                productId: product._id as mongoose.Types.ObjectId,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            })
        }

        return { cart, orderItem, totalAmount }
    }

    static async restoreStock(items: Array<{ productId: mongoose.Types.ObjectId | string; quantity: number }>, session?: mongoose.mongo.ClientSession, hasReserved: boolean = true) {
        if (!items || items.length === 0) return

        const updateOperations = items.map(i => {
            const incFields: Record<string, number> = {
                stock: i.quantity
            }

            if (hasReserved) {
                incFields.reservedStock = -i.quantity
            }

            return {
                updateOne: {
                    filter: { productId: i.productId },
                    update: { $inc: incFields }
                }
            }
        })

        await Inventory.bulkWrite(updateOperations, session ? { session } : {})
    }

    static async confirmReservedStock(items: Array<{ productId: mongoose.Types.ObjectId | string; quantity: number }>, session?: mongoose.mongo.ClientSession) {
        const updateOperations = items.map(i => ({
            updateOne: {
                filter: { productId: i.productId },
                update: { $inc: { reservedStock: -i.quantity } }
            }
        }))

        await Inventory.bulkWrite(updateOperations, session ? { session } : {})
    }
}