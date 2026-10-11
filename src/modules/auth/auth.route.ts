import express from 'express'
import { registerSchema, loginSchema, refreshTokenSchema, sendVerifyEmailSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordWithTokenSchema } from './auth.schema.js'
import { AuthController } from './auth.controller.js'
import { validate } from '../../shared/middlewares/validator.middleware.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'

const router = express.Router()





router.post('/register', validate(registerSchema), AuthController.register)
router.post('/login', validate(loginSchema), AuthController.login)
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.regenerateRefreshToken)
router.post('/logout', authenticate, AuthController.logout)

router.post('/send-verify-email', validate(sendVerifyEmailSchema), AuthController.sendVerifyEmail);
router.get('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);

router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordWithTokenSchema), AuthController.resetPassword);

export default router