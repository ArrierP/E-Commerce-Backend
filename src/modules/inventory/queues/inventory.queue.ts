import { Queue } from "bullmq";
import { redisConnect } from "../../../shared/config/bullmq.js";
import { logger } from "../../../shared/config/logger.js";


export const INVENTORY_QUEUE_NAME = 'inventory-queue'


export const inventoryQueue = new Queue(INVENTORY_QUEUE_NAME, {
    connection: redisConnect,
    defaultJobOptions: {
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 7 * 86400 }
    }
})


export async function setupLowStockCron() {
    await inventoryQueue.upsertJobScheduler("check-low-stock",
        {
            pattern: '0 8 * * *',

        },
        {
            name: "check-low-stock",
            data: {},
        })

logger.info("Register Successfully Cron Check Low Stock.")
}


