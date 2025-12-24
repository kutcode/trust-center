import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface MagicLinkEmailData {
  requesterName: string;
  requesterEmail: string;
  documents: Array<{ title: string }>;
  magicLinkUrl: string;
  expirationDate: string;
}

export const sendMagicLinkEmail = async (data: MagicLinkEmailData): Promise<void> => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
    to: data.requesterEmail,
    subject: 'Your Document Request Has Been Approved',
    html: `
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
          <p>
            <a href="${data.magicLinkUrl}" class="button">Access Your Documents</a>
          </p>
          <p><small>This link will expire on ${data.expirationDate}.</small></p>
          <div class="footer">
            <p><small>If you didn't request this, please ignore this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Magic link email sent to ${data.requesterEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendRejectionEmail = async (
  requesterEmail: string,
  requesterName: string,
  reason?: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
    to: requesterEmail,
    subject: 'Document Request Status Update',
    html: `
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent to ${requesterEmail}`);
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
};

