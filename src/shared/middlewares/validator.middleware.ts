import type { ZodType } from "zod";
import type { Request, Response, NextFunction } from "express";

type ValidationSchema = {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
};

export const validate = (schema: ValidationSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                const parsedQuery = await schema.query.parseAsync(req.query);
                Object.assign(req.query, parsedQuery);
            }
            if (schema.params) {
                const parsedParams = await schema.params.parseAsync(req.params);
                Object.assign(req.params, parsedParams);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};