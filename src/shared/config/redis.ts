import { createClient } from "redis";
import { logger } from "./logger.js";


export const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
})

redisClient.on("error", (err) => logger.error({err}, "Redis Client: Error"))
redisClient.on("connect", () => logger.info("Redis Client: Connect"))
redisClient.on("ready", () => logger.info("Redis Client: Ready"))

export const connectRedis = async() => {
    if(!redisClient.isOpen) {
        await redisClient.connect()
    }
}

export const disconnectRedis = async () => {
    if(redisClient.isOpen) {
        await redisClient.quit()
    }
}

export const clearCachePattern = async (pattern: string): Promise<void> => {
    const keys: string[] = []
    for await (const key of redisClient.scanIterator({MATCH: pattern, COUNT: 100})) {
        keys.push(...key)
    }

    if(keys.length > 0) {
        await redisClient.del(keys)
    }
}