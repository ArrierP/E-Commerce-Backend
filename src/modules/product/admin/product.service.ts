import { logger } from "../../../shared/config/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { Product } from "../product.model.js";
import { Inventory } from "../../inventory/inventory.model.js";
import type { CreateProductInput, UpdateProductInput } from "../product.schema.js";
import { redisClient, clearCachePattern } from "../../../shared/config/redis.js";

export class ProductAdminService {
    private static async invalidateProductCaches(productId?: string) {
        const pattern = "products:*"
        await clearCachePattern(pattern)

        if (productId) {
            await Promise.all([
                redisClient.del(`products:detail:${productId}`),
                redisClient.del(`products:list:${productId}`)
            ])
        }
    }

    static async createProduct(data: CreateProductInput) {
        const newProduct = new Product(data)
        await newProduct.save()

        await Inventory.create({
            productId: newProduct._id,
            stock: newProduct.stock,
            reservedStock: 0,
            lowStockThreshold: 5
        })

        await this.invalidateProductCaches()
        return newProduct
    }

    static async updateProduct(productId: string, data: UpdateProductInput) {
        const existingProduct = await Product.findByIdAndUpdate(productId, { $set: data }, {
            returnDocument: 'after',
            runValidators: true
        })

        if (!existingProduct) {
            logger.error("Product not found.")
            throw new AppError("Product not found", 404)
        }

        if (data.stock !== undefined) {
            await Inventory.findOneAndUpdate(
                { productId },
                { $set: { stock: data.stock } },
                { upsert: true }
            )
        }

        await this.invalidateProductCaches(productId)

        return existingProduct
    }

    static async removeProduct(productId: string) {
        const existingProduct = await Product.findByIdAndDelete(productId)

        if (!existingProduct) {
            logger.error("Product not found.")
            throw new AppError("Product not found", 404)
        }

        await Inventory.findOneAndDelete({ productId })

        await this.invalidateProductCaches(productId)
        return existingProduct
    }
}