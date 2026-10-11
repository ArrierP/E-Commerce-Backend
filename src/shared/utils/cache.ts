import { redisClient } from "../config/redis.js";
import { logger } from "../config/logger.js";


export async function getOrSetCache<T> (
    key: string,
    ttlsecond: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    try {
        const cachedData = await redisClient.get(key)

        if(cachedData) {
            return JSON.parse(cachedData) as T
        }
    } catch (error: any) {
        logger.error({error, key}, "Redis GET failed, falling back to database")
    }

    const freshData = await fetchFn()
    try {
        await redisClient.setEx(key, ttlsecond, JSON.stringify(freshData))
    } catch (error: any) {
        logger.error({error, key}, "Redis SET failed")
    }

    return freshData
}