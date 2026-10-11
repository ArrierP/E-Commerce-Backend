import jwt from 'jsonwebtoken'
import type { Document } from 'mongoose';
import type { Request, Response, NextFunction, Express } from 'express';


export interface AuthPayload {
    userId: string,
    id?: string,
    role: "CUSTOMER" | "ADMIN" 
}

export interface AuthRequest extends Request {
    user?: AuthPayload
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeaders = req.headers.authorization

    if(!authHeaders || !authHeaders.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided."})
    }

    try {
        const token = authHeaders.split(" ")[1]

        if(!token) {
            return res.status(401).json({ message: "No token provided."})
        }

        const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET_KEY

        if(!secret) {
            return res.status(500).json({ message: "JWT_SECRET_KEY not configured."})
        }

        const decoded = jwt.verify(token, secret) as any

        const uid = decoded.userId || decoded.sub

        req.user = {
            userId: uid,
            id: uid,
            role: decoded.role
        }
        return next()
    } catch (err: any) {
        return res.status(401).json({ message: "Invalid or expired token."})
    }
}

export const requireAdmin = () => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if(!req.user || req.user.role !== "ADMIN" ) {
            return res.status(403).json({ message: "You don't have permission to access this service."})
        }
        return next()
    } 
}