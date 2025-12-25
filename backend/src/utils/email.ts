import fs from 'fs';
import path from 'path';
import { sendEmail, EmailAttachment } from '../services/emailService';
import { validateEmailAddress, sanitizeEmailForLogging } from './emailValidation';

export interface MagicLinkEmailData {
  requesterName: string;
  requesterEmail: string;
  documents: Array<{ 
    title: string;
    filePath?: string;  // Full path to file (optional)
    fileName?: string;  // Original filename (optional)
    fileType?: string;  // MIME type (optional)
  }>;
  magicLinkUrl: string;
  expirationDate: string;
}


export const sendMagicLinkEmail = async (data: MagicLinkEmailData): Promise<void> => {
  // Validate email address
  if (!validateEmailAddress(data.requesterEmail)) {
    const sanitized = sanitizeEmailForLogging(data.requesterEmail);
    throw new Error(`Invalid email address format: ${sanitized}`);
  }

  const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
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
    ? `<p style="color: #d32f2f;"><small><strong>Note:</strong> Some documents could not be attached: ${attachmentErrors.join(', ')}. Please use the link below to access them.</small></p>`
    : '';

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
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your Document Request Has Been Approved</h2>
        <p>Hi ${data.requesterName},</p>
        <p>Your request for the following documents has been approved:</p>
        <ul>
          ${data.documents.map(doc => `<li>${doc.title}</li>`).join('')}
        </ul>
        ${attachmentInfo}
        ${attachmentWarning}
        <p>
          <a href="${data.magicLinkUrl}" class="button">Access Your Documents Online</a>
        </p>
        <p><small>This link will expire on ${data.expirationDate}.</small></p>
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

