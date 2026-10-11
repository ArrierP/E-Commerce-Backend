import { Cart } from "./cart.model.js";
import type { AddToCartInput, UpdateQuantityInput } from "./cart.schema.js";
import { logger } from "../../shared/config/logger.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";
import { Product } from "../product/product.model.js";
import { User } from "../auth/auth.model.js";
import { clearCachePattern, redisClient } from "../../shared/config/redis.js";


const REDIS_TTL_SECOND = 10 * 60


export class CartService {
    private static getCacheKey(userId: string) {
        return `cart:user:${userId}`
    }

    private static async invalidateCartCache(userId: string) {
        return redisClient.del(this.getCacheKey(userId))
    }

    static async getCart(userId: string) {
        const key = this.getCacheKey(userId)
        const cachedData = await redisClient.get(key)

        if (cachedData) {
            return JSON.parse(cachedData)
        }

        let cart = await Cart.findOne({ userId }).populate("items.productId")

        if (!cart) {
            cart = new Cart({ userId, items: [] })
        }

        await redisClient.setEx(key, REDIS_TTL_SECOND, JSON.stringify(cart))

        return cart
    }

    static async addToCart(userId: string, data: AddToCartInput) {
        const product = await Product.findById(data.productId)

        if (!product || !product.isActive) {
            logger.warn(`Product not found or inactive:  ${data.productId}`)
            throw new AppError("Product not found", 404)
        }

        let cart = await Cart.findOne({ userId })

        if (!cart) {
            cart = new Cart({ userId, items: [] })
        }

        const existingItem = cart.items.find(i => i.productId.toString() === data.productId)

        const totalRequestedQuantity = existingItem ? existingItem.quantity + data.quantity : data.quantity

        if (totalRequestedQuantity > product.stock) {
            throw new AppError(
                `Insufficient stock. Available stock: ${product.stock}`,
                400
            );
        }

        if (existingItem) {
            existingItem.quantity = totalRequestedQuantity
        }
        else {
            cart.items.push({
                productId: product._id as any,
                quantity: data.quantity
            })
        }

        await cart.save()

        await this.invalidateCartCache(userId)

        return this.getCart(userId)
    }

    static async updateQuantity(userId: string, productId: string, data: UpdateQuantityInput) {
        const product = await Product.findById(productId)

        if (!product) {
            logger.info("Product not found")
            throw new AppError("Product not found", 404)
        }

        if (data.quantity > product.stock) {
            throw new AppError(
                `Insufficient stock. Available stock: ${product.stock}`,
                400
            );
        }

        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw new AppError("Cart not found", 404);
        }

        const item = cart.items.find(i => i.productId.toString() === productId)

        if (!item) {
            throw new AppError("Product does not exist in cart", 404);
        }

        item.quantity = data.quantity

        await cart.save()
        await this.invalidateCartCache(userId)

        return this.getCart(userId)
    }

    static async removeCartItem(userId: string, productId: string) {
        const cart = await Cart.findOne({ userId })

        if (!cart) {
            throw new AppError("Cart not found", 404)
        }

        const initialLengh = cart.items.length
        cart.items = cart.items.filter(i => i.productId.toString() !== productId) as any

        if (initialLengh === cart.items.length) {
            throw new AppError("Product does not exist in cart", 404);
        }

        await cart.save()
        await this.invalidateCartCache(userId)

        return this.getCart(userId)
    }
}




