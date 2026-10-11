import { logger } from "../../../shared/config/logger.js";
import { AppError } from "../../../shared/middlewares/error.middleware.js";
import { Product } from "../product.model.js";
import type { ProductQueryInput } from "../product.schema.js";
import { redisClient, clearCachePattern } from "../../../shared/config/redis.js";
import { ProductAdminService } from "../admin/product.service.js";
import type { QueryFilter } from "mongoose";

const CACHE_TTL_SECONDS = 60 * 10;

export class ProductCustomerService extends ProductAdminService {
    static async getProductDetailCustomer(idOrSlug: string) {
        const key = `products:detail:${idOrSlug}`
        const cachedData = await redisClient.get(key)

        if (cachedData) {
            return JSON.parse(cachedData)
        }

        const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug, isActive: true } : { slug: idOrSlug, isActive: true }

        const product = await Product.findOne(query)

        if (!product) {
            throw new AppError("Product not found.", 404)
        }

        await redisClient.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(product))

        return product
    }

    static async getProductsCustomer(query: ProductQueryInput) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
        const { category, minPrice, maxPrice, search, sortBy } = query;

        const key = `products:list:${JSON.stringify({ ...query, page, limit })}`;
        const cachedData = await redisClient.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const filter: QueryFilter<string> = { isActive: true };

        if (category && category !== "All") filter.category = category;
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        if (search && search.trim()) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            (filter as any).$or = [
                { name: { $regex: escapedSearch, $options: "i" } },
                { description: { $regex: escapedSearch, $options: "i" } },
                { category: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
        if (sortBy === "price_asc") sortOptions = { price: 1 };
        if (sortBy === "price_desc") sortOptions = { price: -1 };

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
            Product.countDocuments(filter)
        ]);

        const result = {
            data: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            }
        };

        return result;
    }
}