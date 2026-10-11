import type { Request, Response, NextFunction } from "express";
import { ProductAdminService } from "./admin/product.service.js";
import { ProductCustomerService } from "./customer/product.service.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";
import { logger } from "../../shared/config/logger.js";
import type { CreateProductInput, ProductQueryInput, UpdateProductInput } from "./product.schema.js";


export class ProductController {
    // Admin Handlers
    static async create(req: Request<{}, {}, CreateProductInput>, res: Response) {
        try {
            const product = await ProductAdminService.createProduct(req.body);
            logger.info("Create product successfully.")
            res.status(201).json({ 
                success: true, 
                message: "Create product successfully",
                product 
            });
        } catch (err: any) {
            logger.error({err}, "Error while creating product.")
            return res.status(500).json({
                success: true,
                message: err.message
            })
        }
    }

    static async update(req: Request<{ id: string }, {}, UpdateProductInput>, res: Response) {
        try {
            const { id } = req.params
            if (!id) {
                throw new AppError("Id Product not found", 404)
            }
            const product = await ProductAdminService.updateProduct(id, req.body);
            logger.info("Update product successfully")
            res.status(200).json({
                success: true,
                message: "Update product successfully.",
                product
            });
        } catch (err: any) {
            logger.error({err}, "Error while updating product.")
            return res.status(500).json({
                success: true,
                message: err.message
            })
        }
    }

    static async delete(req: Request<{id: string}>, res: Response, next: NextFunction) {
        try {
            await ProductAdminService.removeProduct(req.params.id);
            res.status(200).json({ success: true, message: "Product deleted successfully" });
        } catch (err: any) {
            logger.error({err}, "Error while deleting product.")
            return res.status(500).json({
                success: true,
                message: err.message
            })
        }
    }

    // Customer Handlers
    static async getList(req: Request<{}, ProductQueryInput, {}>, res: Response) {
        try {
            const result = await ProductCustomerService.getProductsCustomer(req.query as any);
            res.status(200).json({ success: true, ...result });
        } catch (err: any) {
            logger.error({err}, "Error while fetching product.")
            return res.status(500).json({
                success: true,
                message: err.message
            })
        }
    }

    static async getDetail(req: Request<{idOrSlug: string}>, res: Response) {
        try {
            const product = await ProductCustomerService.getProductDetailCustomer(req.params.idOrSlug);
            res.status(200).json({ success: true, product });
        } catch (err: any) {
            logger.error({err}, "Error while fetching product.")
            return res.status(500).json({
                success: true,
                message: err.message
            })
        }
    }
}