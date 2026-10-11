import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export class AppError extends Error {
    constructor(public message: string, public statusCode: number = 500) {
        super(message)
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err)
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        })
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message
            }))
        })
    }

    logger.error({ err }, "[Unhandled Error]")
    return res.status(500).json({
        success: false,
        message: "Internal Server Error."
    })
}

