import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-kong:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
    },
  },
});

console.log('Supabase client initialized with URL:', supabaseUrl);
console.log('Using service key:', !!supabaseServiceKey);

// Middleware
const isDemoEnv = process.env.DEMO_MODE === 'true';
app.use(cors({
  origin: isDemoEnv ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Demo mode middleware (safety guardrails for public demo)
import { demoModeMiddleware, DEMO_MODE } from './middleware/demoMode';
if (DEMO_MODE) {
  console.log('🎭 DEMO MODE is ACTIVE — safety guardrails enabled');
}
app.use(demoModeMiddleware);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files (with authentication check in route handler)
const uploadsDir = process.env.UPLOADS_DIR || '/app/uploads';
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test email endpoint (for verifying email configuration)
import { sendEmail, getEmailProvider } from './services/emailService';
import path from 'path';
import fs from 'fs';

app.post('/api/test-email', async (req, res) => {
  try {
    const { to, withAttachment } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const provider = getEmailProvider();
    console.log(`Testing email to ${to} via ${provider}...`);

    // Check for attachment
    let attachments;
    if (withAttachment) {
      const uploadsDir = process.env.UPLOADS_DIR || '/app/uploads';
      const filePath = path.join(uploadsDir, 'category-4baf9503/1766598518030-wu19bu.pdf');

      if (fs.existsSync(filePath)) {
        attachments = [{
          filename: 'Acceptable_Use_Policy.pdf',
          path: filePath,
          contentType: 'application/pdf',
        }];
        console.log('Attachment found:', filePath);
      } else {
        console.log('Attachment not found:', filePath);
      }
    }

    await sendEmail({
      to,
      from: process.env.SMTP_FROM || 'noreply@trustcenter.com',
      subject: withAttachment ? '📎 Your Requested Documents - Trust Center' : '✅ Trust Center Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #2563eb;">🎉 ${withAttachment ? 'Your Document Request Has Been Approved!' : 'Email Configuration Working!'}</h1>
          <p>This is ${withAttachment ? 'your approved document' : 'a test email'} from the Trust Center.</p>
          ${withAttachment ? '<p><strong>Attached:</strong> Acceptable Use Policy (PDF)</p>' : ''}
          <p><strong>Provider:</strong> ${provider}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280;">${withAttachment ? 'Please find your requested document attached to this email.' : 'Your email system is now configured correctly.'}</p>
        </div>
      `,
      attachments,
    });

    res.json({
      success: true,
      message: `Email sent to ${to} via ${provider}${withAttachment ? ' with attachment' : ''}`,
      provider,
      hasAttachment: !!attachments
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: error.message || 'Failed to send test email',
      provider: getEmailProvider()
    });
  }
});

// Import routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import documentRequestRoutes from './routes/documentRequests';
import organizationRoutes from './routes/organizations';
import categoryRoutes from './routes/categories';
import certificationRoutes from './routes/certifications';
import securityUpdateRoutes from './routes/securityUpdates';
import contactRoutes from './routes/contact';
import settingsRoutes from './routes/settings';
import accessRoutes from './routes/access';
import controlsRoutes from './routes/controls';
import adminRoutes from './routes/admin';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/document-categories', categoryRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/security-updates', securityUpdateRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/access', accessRoutes);
app.use('/api', controlsRoutes);
app.use('/api/admin', adminRoutes);


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);

  // In demo mode, generate demo PDFs and seed database
  if (DEMO_MODE) {
    seedDemoDocuments();
  }
});

async function seedDemoDocuments() {
  const fs = await import('fs');
  const path = await import('path');
  const { execSync } = await import('child_process');

  const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
  const checkFile = path.default.join(UPLOADS_DIR, 'documents', 'demo-soc2-type2-2025.pdf');

  // Step 1: Generate PDF files if they don't exist
  if (!fs.default.existsSync(checkFile)) {
    console.log('[DEMO] Generating demo PDF documents...');
    try {
      const scriptPath = path.default.join(__dirname, '..', 'scripts', 'generate-demo-pdfs.js');
      if (fs.default.existsSync(scriptPath)) {
        execSync(`node ${scriptPath}`, { stdio: 'inherit', env: process.env as any });
        console.log('[DEMO] Demo PDFs generated successfully');
      } else {
        console.warn('[DEMO] generate-demo-pdfs.js not found at', scriptPath);
        return;
      }
    } catch (err: any) {
      console.error('[DEMO] Failed to generate PDFs:', err.message);
      return;
    }
  } else {
    console.log('[DEMO] Demo PDF files already exist');
  }

  // Step 2: Seed document records into database
  console.log('[DEMO] Seeding demo document records...');
  try {
    const scriptPath = path.default.join(__dirname, '..', 'scripts', 'seed-demo-documents.js');
    if (fs.default.existsSync(scriptPath)) {
      execSync(`node ${scriptPath}`, { stdio: 'inherit', env: process.env as any });
      console.log('[DEMO] Demo document seeding complete');
    } else {
      console.warn('[DEMO] seed-demo-documents.js not found at', scriptPath);
    }
  } catch (err: any) {
    console.error('[DEMO] Failed to seed documents:', err.message);
  }
}
