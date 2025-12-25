/**
 * Email Service Abstraction Layer
 * Supports SendGrid, Resend, SMTP, and Mailpit (development)
 */

import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { validateEmailAddress, sanitizeEmailForLogging, isBlockedDomain } from '../utils/emailValidation';

export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

type EmailProvider = 'sendgrid' | 'resend' | 'mailpit' | 'smtp';

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

// Resend client (lazy initialization)
let resendClient: Resend | null = null;

// Mailpit transporter (lazy initialization)
let mailpitTransporter: nodemailer.Transporter | null = null;

// SMTP transporter (lazy initialization)
let smtpTransporter: nodemailer.Transporter | null = null;

// SendGrid initialization flag
let sendgridInitialized = false;

/**
 * Gets the email provider from environment
 */
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (provider === 'sendgrid') return 'sendgrid';
  if (provider === 'resend') return 'resend';
  if (provider === 'smtp') return 'smtp';
  return 'mailpit'; // default
}

/**
 * Initializes SendGrid client
 */
function initSendGrid(): void {
  if (!sendgridInitialized) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required when EMAIL_PROVIDER=sendgrid');
    }
    sgMail.setApiKey(apiKey);
    sendgridInitialized = true;
  }
}

/**
 * Initializes Resend client
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required when EMAIL_PROVIDER=resend');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Initializes Mailpit transporter for development
 */
function getMailpitTransporter(): nodemailer.Transporter {
  if (!mailpitTransporter) {
    mailpitTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mailpit',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
    });
  }
  return mailpitTransporter;
}

/**
 * Initializes SMTP transporter for real email delivery
 */
function getSMTPTransporter(): nodemailer.Transporter {
  if (!smtpTransporter) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER and SMTP_PASSWORD are required when EMAIL_PROVIDER=smtp');
    }

    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  return smtpTransporter;
}

/**
 * Sanitizes error messages to prevent credential leaks
 */
function sanitizeError(error: Error): Error {
  const message = error.message;
  
  // Remove API keys (Resend keys start with 're_')
  let sanitized = message.replace(/re_[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]');
  
  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  
  // Remove passwords or tokens
  sanitized = sanitized.replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]');
  sanitized = sanitized.replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]');
  
  return new Error(sanitized);
}

/**
 * Validates and processes attachments
 */
function processAttachments(attachments?: EmailAttachment[]): {
  processed: Array<{ filename: string; content: Buffer; contentType?: string }>;
  errors: string[];
} {
  const processed: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
  const errors: string[] = [];
  let totalSize = 0;

  if (!attachments || attachments.length === 0) {
    return { processed, errors };
  }

  for (const attachment of attachments) {
    try {
      let content: Buffer;
      let fileSize: number;

      // Read file content
      if (attachment.content) {
        content = attachment.content;
        fileSize = content.length;
      } else if (attachment.path) {
        const fullPath = path.isAbsolute(attachment.path)
          ? attachment.path
          : path.join(process.env.UPLOADS_DIR || '/app/uploads', attachment.path);

        // Security: Prevent path traversal
        if (fullPath.includes('..')) {
          errors.push(`${attachment.filename}: Invalid path`);
          continue;
        }

        if (!fs.existsSync(fullPath)) {
          errors.push(`${attachment.filename}: File not found`);
          continue;
        }

        content = fs.readFileSync(fullPath);
        fileSize = content.length;
      } else {
        errors.push(`${attachment.filename}: No content or path provided`);
        continue;
      }

      // Check size limit
      if (fileSize > MAX_ATTACHMENT_SIZE) {
        errors.push(`${attachment.filename}: File too large (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
        continue;
      }

      if (totalSize + fileSize > MAX_ATTACHMENT_SIZE) {
        errors.push(`${attachment.filename}: Would exceed total size limit`);
        continue;
      }

      processed.push({
        filename: attachment.filename,
        content,
        contentType: attachment.contentType,
      });

      totalSize += fileSize;
    } catch (error: any) {
      errors.push(`${attachment.filename}: ${error.message || 'Read error'}`);
    }
  }

  return { processed, errors };
}

/**
 * Sends email using SendGrid API (RECOMMENDED - works with all email types)
 */
async function sendWithSendGrid(data: EmailData): Promise<void> {
  initSendGrid();
  const emailDomain = sanitizeEmailForLogging(data.to);

  try {
    const { processed: attachments, errors: attachmentErrors } = processAttachments(data.attachments);

    if (attachmentErrors.length > 0) {
      console.warn(`Attachment errors for ${emailDomain}: ${attachmentErrors.join(', ')}`);
    }

    const sgAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType || 'application/octet-stream',
      disposition: 'attachment' as const,
    }));

    const msg: sgMail.MailDataRequired = {
      to: data.to,
      from: data.from,
      subject: data.subject,
      html: data.html,
      attachments: sgAttachments.length > 0 ? sgAttachments : undefined,
    };

    const [response] = await sgMail.send(msg);

    console.log(`Email sent via SendGrid to ${emailDomain} (Status: ${response.statusCode})`);
  } catch (error: any) {
    const sanitized = sanitizeError(error);
    console.error(`Failed to send email via SendGrid to ${emailDomain}:`, sanitized.message);
    throw sanitized;
  }
}

/**
 * Sends email using Resend API
 */
async function sendWithResend(data: EmailData): Promise<void> {
  const resend = getResendClient();
  const emailDomain = sanitizeEmailForLogging(data.to);

  try {
    const { processed: attachments, errors: attachmentErrors } = processAttachments(data.attachments);

    if (attachmentErrors.length > 0) {
      console.warn(`Attachment errors for ${emailDomain}: ${attachmentErrors.join(', ')}`);
    }

    const resendAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
    }));

    const result = await resend.emails.send({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Resend API error');
    }

    console.log(`Email sent via Resend to ${emailDomain} (ID: ${result.data?.id || 'unknown'})`);
  } catch (error: any) {
    const sanitized = sanitizeError(error);
    console.error(`Failed to send email via Resend to ${emailDomain}:`, sanitized.message);
    throw sanitized;
  }
}

/**
 * Sends email using Mailpit (development)
 */
async function sendWithMailpit(data: EmailData): Promise<void> {
  const transporter = getMailpitTransporter();
  const emailDomain = sanitizeEmailForLogging(data.to);

  try {
    const { processed: attachments, errors: attachmentErrors } = processAttachments(data.attachments);

    if (attachmentErrors.length > 0) {
      console.warn(`Attachment errors for ${emailDomain}: ${attachmentErrors.join(', ')}`);
    }

    const mailpitAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }));

    await transporter.sendMail({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: mailpitAttachments.length > 0 ? mailpitAttachments : undefined,
    });

    console.log(`Email sent via Mailpit to ${emailDomain}`);
  } catch (error: any) {
    const sanitized = sanitizeError(error);
    console.error(`Failed to send email via Mailpit to ${emailDomain}:`, sanitized.message);
    throw sanitized;
  }
}

/**
 * Sends email using SMTP (real email delivery)
 */
async function sendWithSMTP(data: EmailData): Promise<void> {
  const transporter = getSMTPTransporter();
  const emailDomain = sanitizeEmailForLogging(data.to);

  try {
    const { processed: attachments, errors: attachmentErrors } = processAttachments(data.attachments);

    if (attachmentErrors.length > 0) {
      console.warn(`Attachment errors for ${emailDomain}: ${attachmentErrors.join(', ')}`);
    }

    const smtpAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }));

    await transporter.sendMail({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: smtpAttachments.length > 0 ? smtpAttachments : undefined,
    });

    console.log(`Email sent via SMTP to ${emailDomain}`);
  } catch (error: any) {
    const sanitized = sanitizeError(error);
    console.error(`Failed to send email via SMTP to ${emailDomain}:`, sanitized.message);
    throw sanitized;
  }
}

/**
 * Main email sending function
 * Validates email and routes to appropriate provider
 */
export async function sendEmail(data: EmailData): Promise<void> {
  // Validate email address
  if (!validateEmailAddress(data.to)) {
    throw new Error('Invalid email address format');
  }

  // Check blocked domains in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isBlockedDomain(data.to, isProduction)) {
    throw new Error('Email domain is not allowed');
  }

  // Route to appropriate provider
  const provider = getEmailProvider();

  if (provider === 'sendgrid') {
    await sendWithSendGrid(data);
  } else if (provider === 'resend') {
    await sendWithResend(data);
  } else if (provider === 'smtp') {
    await sendWithSMTP(data);
  } else {
    await sendWithMailpit(data);
  }
}


