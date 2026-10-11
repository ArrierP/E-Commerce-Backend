import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const DEFAULT_MAIL_FROM = process.env.MAIL_FROM || 'onboarding@resend.dev';