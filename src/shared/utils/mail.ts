import { Queue } from "bullmq";
import { redisConnect } from "../config/bullmq.js";

type Type = 'TRANSACTIONAL' | 'MARKETING' | 'SYSTEM_REPORT' | "EMAIL_VERIFY" | "FORGET_PASSWORD";

export interface SendEmailJobData {
    to: string | string[],
    subject: string,
    html: string,
    from?: string,
    type?: Type
}

export const MAIL_QUEUE_NAME = 'email-queue'

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


export async function queueMail(data: SendEmailJobData, delayMs?: number) {
    return await mailQueue.add("send-resend-mail", data, {
        delay: delayMs || 0
    })
}

