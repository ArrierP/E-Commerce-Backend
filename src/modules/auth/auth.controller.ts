import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput, RefreshTokenInput } from "./auth.schema.js";
import { logger } from "../../shared/config/logger.js";
import { AppError } from "../../shared/middlewares/error.middleware.js";
export class AuthController {
  static async login(req: Request<{}, {}, LoginInput>, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginService(email, password);

      logger.info("Login successfully.");
      return res.status(200).json({
        success: true,
        message: "Login successfully.",
        result
      });
    } catch (error) {
      logger.error({ error }, "Error while login.");
      next(error);
    }
  }

  static async register(req: Request<{}, {}, RegisterInput>, res: Response, next: NextFunction) {
    try {
      const { email, fullname, password, phone } = req.body;
      const result = await AuthService.registerService({ email, fullname, password, ...(phone !== undefined && { phone }) });

      logger.info("Register successfully.");
      return res.status(201).json({
        success: true,
        message: "Register successfully.",
        result
      });
    } catch (error) {
      logger.error({ error }, "Error while register.");
      next(error);
    }
  }

  static async regenerateRefreshToken(req: Request<{}, {}, RefreshTokenInput>, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshAccessToken(refreshToken);

      logger.info("Regenerate refresh token successfully.");
      return res.status(200).json({
        success: true,
        message: "Refresh token rotated successfully.",
        result
      });
    } catch (error) {
      logger.error({ error }, "Error while regenerate refresh token.");
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Unauthorized.", 401);
      }

      await AuthService.logoutService(userId);

      logger.info("Logout successfully.");
      return res.status(200).json({
        success: true,
        message: "Logout successfully."
      });
    } catch (error) {
      logger.error({ error }, "Error while logout.");
      next(error);
    }
  }
  static async sendVerifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.sendVerifyEmail(email);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token as string;
      const result = await AuthService.verifyEmail(token);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.sendForgotPasswordEmail(email);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPasswordWithToken(token, newPassword);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}