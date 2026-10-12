import { Worker, Job } from "bullmq";
import { redisConnect } from "../config/bullmq.js";
import { INVENTORY_QUEUE_NAME } from "../utils/queue.js";
import { queueMail } from "../utils/queue.js";
import { Inventory, type IInventory } from "../../modules/inventory/inventory.model.js";
import { logger } from "../config/logger.js";
import type { Types } from 'mongoose'


interface IProductInfo {
    _id: Types.ObjectId;
    name: string;
    slug: string;
}

type PopulatedInventory = Omit<IInventory, "productId"> & {
    productId: IProductInfo
}

export const inventoryWork = new Worker(
    INVENTORY_QUEUE_NAME,
    async (job: Job) => {
        logger.info("[Inventory Worker] Start scan product with low stock.")

        const lowStockProducts = await Inventory.find({
            $expr: {
                $lte: ["$stock", "$lowStockThreshold"]
            }
        }).populate<{ productId: IProductInfo }>("productId", "name slug")

        if (lowStockProducts.length === 0) {
            logger.info("[Inventory Worker] No product with low stock.")
            return { count: 0 }
        }

        logger.info(`[Inventory Worker] Find out ${lowStockProducts.length} product needed provide.`)

        const validProducts = lowStockProducts.filter((p) => p.productId);

        if (validProducts.length === 0) {
            logger.info("[Inventory Worker] No valid product with low stock.")
            return { count: 0 }
        }

        const itemsHtml = validProducts
            .map(
                (p) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.productId.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.productId.slug}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: red; font-weight: bold;">${p.stock}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.lowStockThreshold}</td>
        </tr>`
            )
            .join('');

        const emailContent = `
      <h2>Warning: Product with low stock</h2>
      <p>System record <strong>${validProducts.length}</strong> products with stock equal to or lower than secure threshold:</p>
      <table style="border-collapse: collapse; width: 100%; text-align: left;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd;">Name Product:</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Slug</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Current Stock</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Secure Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p style="margin-top: 16px;">Please recheck and restore.</p>
    `;

        const adminEmail = process.env.ADMIN_EMAIL || "tuanhuy23.1.26@gmail.com";

        await queueMail({
            to: adminEmail,
            subject: `[Warning Stock]: Have ${validProducts.length} products with low stock.`,
            html: emailContent,
            type: "SYSTEM_REPORT"
        })


        return { reportCount: lowStockProducts.length}
    },
    {
        connection: redisConnect,
        concurrency: 1
    }
)

