import fs from 'fs';
import path from 'path';
import { sendEmail, EmailAttachment } from '../services/emailService';
import { validateEmailAddress, sanitizeEmailForLogging } from './emailValidation';

export interface MagicLinkEmailData {
  requesterName: string;
  requesterEmail: string;
  documents: Array<{
    id: string;          // Document ID for direct download link
    title: string;
    filePath?: string;  // Full path to file (optional)
    fileName?: string;  // Original filename (optional)
    fileType?: string;  // MIME type (optional)
  }>;
  magicLinkToken: string;  // Just the token, not the full URL
  magicLinkUrl: string;    // Full URL to access page (fallback)
  expirationDate: string;
}


export const sendMagicLinkEmail = async (data: MagicLinkEmailData): Promise<void> => {
  // Validate email address
  if (!validateEmailAddress(data.requesterEmail)) {
    const sanitized = sanitizeEmailForLogging(data.requesterEmail);
    throw new Error(`Invalid email address format: ${sanitized}`);
  }

  const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
  const API_URL = process.env.FRONTEND_URL || 'http://localhost:4000';
  const attachments: EmailAttachment[] = [];
  const attachmentErrors: string[] = [];

  // Process document attachments
  for (const doc of data.documents) {
    if (doc.filePath && doc.fileName) {
      try {
        const fullPath = path.isAbsolute(doc.filePath)
          ? doc.filePath
          : path.join(UPLOADS_DIR, doc.filePath);

        // Security: Prevent path traversal
        if (fullPath.includes('..')) {
          attachmentErrors.push(`${doc.fileName}: Invalid path`);
          continue;
        }

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          attachmentErrors.push(`File not found: ${doc.fileName}`);
          continue;
        }

        // Add attachment (size validation happens in emailService)
        attachments.push({
          filename: doc.fileName,
          path: fullPath,
          contentType: doc.fileType || 'application/octet-stream',
        });
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        console.error(`Error processing attachment ${doc.fileName}:`, errorMsg);
        attachmentErrors.push(`${doc.fileName} (read error)`);
      }
    }
  }

  // Build email HTML with attachment info
  const attachmentInfo = attachments.length > 0
    ? `<p><strong>Documents attached:</strong> ${attachments.length} file(s)</p>`
    : '';

  const attachmentWarning = attachmentErrors.length > 0
    ? `<p style="color: #d32f2f;"><small><strong>Note:</strong> Some documents could not be attached: ${attachmentErrors.join(', ')}. Please use the download links below.</small></p>`
    : '';

  // Generate individual download links for each document
  const backendUrl = process.env.API_URL || 'http://localhost:4000';
  const documentLinks = data.documents.map(doc => {
    const downloadUrl = `${backendUrl}/api/access/${data.magicLinkToken}/download/${doc.id}`;
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${doc.title}</strong>
          ${doc.fileName ? `<br><small style="color: #666;">${doc.fileName}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          <a href="${downloadUrl}" style="display: inline-block; padding: 8px 16px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">Download</a>
        </td>
      </tr>
    `;
  }).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your Document Request Has Been Approved</h2>
        <p>Hi ${data.requesterName},</p>
        <p>Your request has been approved. Click the download buttons below to get your documents:</p>
        ${attachmentInfo}
        ${attachmentWarning}
        <table>
          ${documentLinks}
        </table>
        <p style="margin-top: 16px; padding: 12px; background-color: #fff3cd; border-radius: 4px; font-size: 14px;">
          ⏰ <strong>Links expire:</strong> ${data.expirationDate}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #666;">
          <a href="${data.magicLinkUrl}" style="color: #007bff;">View all documents online</a>
        </p>
        <div class="footer">
          <p><small>If you didn't request this, please ignore this email.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: data.requesterEmail,
      from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
      subject: 'Your Document Request Has Been Approved',
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    const sanitized = sanitizeEmailForLogging(data.requesterEmail);
    console.log(`Approval email sent successfully to ${sanitized}`);
  } catch (error: any) {
    const sanitized = sanitizeEmailForLogging(data.requesterEmail);
    console.error(`Failed to send approval email to ${sanitized}:`, error.message || 'Unknown error');
    throw new Error('Failed to send email');
  }
};

export const sendRejectionEmail = async (
  requesterEmail: string,
  requesterName: string,
  reason?: string
): Promise<void> => {
  // Validate email address
  if (!validateEmailAddress(requesterEmail)) {
    const sanitized = sanitizeEmailForLogging(requesterEmail);
    console.error(`Invalid email address format: ${sanitized}`);
    return; // Don't throw, just log and return
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Document Request Status Update</h2>
        <p>Hi ${requesterName},</p>
        <p>We regret to inform you that your document request has been denied.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: requesterEmail,
      from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
      subject: 'Document Request Status Update',
      html: emailHtml,
    });

    const sanitized = sanitizeEmailForLogging(requesterEmail);
    console.log(`Rejection email sent successfully to ${sanitized}`);
  } catch (error: any) {
    const sanitized = sanitizeEmailForLogging(requesterEmail);
    console.error(`Failed to send rejection email to ${sanitized}:`, error.message || 'Unknown error');
    // Don't throw - rejection emails are non-critical
  }
};

