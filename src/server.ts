import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./shared/database/connectDb.js";
import { connectRedis } from "./shared/config/redis.js";
import "./modules/inventory/workers/inventory.worker.js";
import "./shared/workers/email.worker.js";
import { setupLowStockCron } from "./modules/inventory/queues/inventory.queue.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDb();
        await connectRedis();
        await setupLowStockCron();
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Internal Server Error:", error);
        process.exit(1);
    }
};

startServer();

