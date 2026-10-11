import { User, type IUser } from "./auth.model.js";
import jwt from 'jsonwebtoken'
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppError } from "../../shared/middlewares/error.middleware.js";
import { redisClient } from "../../shared/config/redis.js";
import crypto from "crypto";
import { mailQueue } from "../../shared/utils/mail.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET! || ""
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET! || ""
const ACCESS_TOKEN_EXPIRED = (process.env.ACCESS_TOKEN_EXPIRED ?? "15m") as NonNullable<SignOptions["expiresIn"]>
const REFRESH_TOKEN_EXPIRED = (process.env.REFRESH_TOKEN_EXPIRED ?? "7d") as NonNullable<SignOptions['expiresIn']>

const REFRESH_TOKEN_TLL_SECONDS = 7 * 24 * 60 * 60

export class AuthService {
    private static generateToken(userId: string, role: string) {
        const access_token = jwt.sign({ sub: userId, userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRED })
        const refresh_token = jwt.sign({ sub: userId, userId, role }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRED })
        return { access_token, refresh_token }
    }


    static async loginService(email: string, passwordPlain: string) {
        const user = await User.findOne({ email: email })

        if (!user) {
            throw new AppError("User not found.", 404)
        }

        const check = await bcrypt.compare(passwordPlain, user.passwordHash)

        if (!check) {
            throw new AppError("Wrong password. Please try again.", 401)
        }

        const userId = user._id.toString()
        const { access_token, refresh_token } = this.generateToken(user._id.toString(), user.role)

        await redisClient.setEx(`refreshtoken:${userId}`, REFRESH_TOKEN_TLL_SECONDS, refresh_token)

        const userObj = user.toObject()
        delete (userObj as any).passwordHash

        return {
            access_token,
            refresh_token,
            user: userObj
        }
    }

    static async registerService(data: { email: string, fullname: string, password: string, phone?: string }) {
        const existingUser = await User.findOne({ email: data.email })

        if (existingUser) {
            throw new AppError("User already existing.", 400)
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(data.password, salt)
        const newUser: IUser = new User({
            email: data.email,
            passwordHash,
            fullname: data.fullname,
            phone: data.phone,
            role: "CUSTOMER"
        })

        await newUser.save()

        const userObj = newUser.toObject();
        delete (userObj as any).passwordHash;
        return userObj;
    }

    static async refreshAccessToken(token: string) {
        if (!token) {
            throw new AppError("Token not found.", 404)
        }

        try {
            const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { sub: string, role: string }
            const userId = payload.sub

            const storedToken = await redisClient.get(`refreshtoken:${userId}`)

            if (!storedToken || storedToken !== token) {
                throw new AppError("Invalid token or expired.")
            }

            const { access_token, refresh_token: newRefreshToken } = this.generateToken(userId, payload.role)

            await redisClient.setEx(`refreshtoken:${userId}`, REFRESH_TOKEN_TLL_SECONDS, newRefreshToken)

            return {
                access_token,
                refresh_token: newRefreshToken
            }
        } catch (error: any) {
            throw new AppError(error.message, 500)
        }
    }

    static async logoutService(userId: string) {
        await redisClient.del(`refreshtoken:${userId}`)
    }

    static async sendVerifyEmail(email: string) {
        const existingUser = await User.findOne({ email })


        if (!existingUser) {
            throw new AppError("User not found", 404)
        }


        if (existingUser.isEmailVerified) {
            throw new AppError("User already verified.", 400)
        }

        const token = crypto.randomBytes(32).toString('hex')

        const hashedToken = crypto.createHash("sha256").update(token).digest('hex')

        existingUser.verifyEmailToken = hashedToken
        existingUser.verifyEmailExpires = new Date(Date.now() + 15 * 60 * 1000);
        await existingUser.save()

        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

        const htmlContent = `
        <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Xác thực tài khoản của bạn</h2>
        <p>Vui lòng bấm vào nút bên dưới để xác thực địa chỉ email. Liên kết có hiệu lực trong 15 phút.</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Xác thực tài khoản
        </a>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      </div>
        `

        await mailQueue.add("send-verify-email", {
            to: email,
            subject: "[Verify Account] Verify your account to access.",
            html: htmlContent,
            type: "EMAIL_VERIFY"
        });

        return { message: "Verification email sent successfully." };
    }

    static async verifyEmail(token: string) {
        if (!token) {
            throw new AppError("Verification token is required", 400)
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");


        const user = await User.findOne({
            verifyEmailToken: hashedToken,
            verifyEmailExpires: { $gt: new Date() }
        });

        if (!user) {
            throw new AppError("Token is invalid or has expired", 400)
        }

        user.isEmailVerified = true
        user.verifyEmailToken = undefined
        user.verifyEmailExpires = undefined

        await user.save()

        return { message: "Email verified successfully" };
    }

    static async sendForgotPasswordEmail(email: string) {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            throw new AppError("User not found", 404);
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        existingUser.resetPasswordToken = hashedToken;
        existingUser.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await existingUser.save();

        const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
        const resetPasswordUrl = `${CLIENT_URL}/reset-password?token=${rawToken}`;

        const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Request reset password</h2>
        <p>You receive this email because your request reset password. You need to click this link below to reset password(expire after 15 minutes):</p>
        <p><a href="${resetPasswordUrl}" style="background-color: #dc3545; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
        <p>If you don't request this one, please skip this email.</p>
      </div>
    `;

        await mailQueue.add("send-forget-password-email", {
            to: email,
            subject: "[Forget Password] Guide to reset password",
            html: htmlContent,
            type: "FORGET_PASSWORD"
        });

        return { message: "Reset password instructions sent to your email." };
    }

    static async resetPasswordWithToken(token: string, newPasswordPlain: string) {
        if (!token) {
            throw new AppError("Reset token is required", 400);
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        }).select("+passwordHash");

        if (!user) {
            throw new AppError("Token is invalid or has expired", 400);
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPasswordPlain, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Thu hồi toàn bộ session đăng nhập cũ trong Redis
        await redisClient.del(`refreshtoken:${user._id.toString()}`);

        return { message: "Password reset successfully. Please login again." };
    }
}



