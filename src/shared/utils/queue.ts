import { Queue } from "bullmq";
import { redisConnect } from "../config/bullmq.js";
import { logger } from "../config/logger.js";


type Type = 'TRANSACTIONAL' | 'MARKETING' | 'SYSTEM_REPORT' | "EMAIL_VERIFY" | "FORGET_PASSWORD";

export interface SendEmailJobData {
    to: string | string[],
    subject: string,
    html: string,
    from?: string,
    type?: Type
}

export const MAIL_QUEUE_NAME = 'email-queue'
export const INVENTORY_QUEUE_NAME = 'inventory-queue'

export const mailQueue = new Queue<SendEmailJobData>(MAIL_QUEUE_NAME, {
    connection: redisConnect,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: {
            age: 3600,
            count: 500
        },
        removeOnFail: {
            age: 24 * 3600
        }
    }
})

export const inventoryQueue = new Queue(INVENTORY_QUEUE_NAME, {
    connection: redisConnect,
    defaultJobOptions: {
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 7 * 86400 }
    }
})

export async function queueMail(data: SendEmailJobData, delayMs?: number) {
    return await mailQueue.add("send-resend-mail", data, {
        delay: delayMs || 0
    })
}

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