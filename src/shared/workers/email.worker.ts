import { Worker, type Job } from "bullmq";
import { redisConnect } from "../config/bullmq.js";
import { resend, DEFAULT_MAIL_FROM } from "../config/resend.js";
import { logger } from "../config/logger.js";
import { MAIL_QUEUE_NAME, type SendEmailJobData } from "../utils/mail.js";

export const emailWorker = new Worker<SendEmailJobData>(
  MAIL_QUEUE_NAME,
  async (job: Job<SendEmailJobData>) => {
    const { to, subject, html, from, type } = job.data;
    logger.info(`[Email Worker] Processing ${type || "mail"} job for: ${to}`);

    try {
      const response = await resend.emails.send({
        from: from || DEFAULT_MAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });

      if (response.error) {
        logger.error({ error: response.error }, `[Email Worker] Failed to send email to ${to}`);
        throw new Error(response.error.message);
      }

      logger.info({ id: response.data?.id }, `[Email Worker] Email sent successfully to ${to}`);
      return response.data;
    } catch (error: any) {
      logger.error({ error }, `[Email Worker] Error sending email to ${to}`);
      throw error;
    }
  },
  {
    connection: redisConnect,
    concurrency: 5,
  }
);
