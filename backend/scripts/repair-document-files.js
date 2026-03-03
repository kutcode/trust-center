/**
 * Repairs document files for local/dev environments:
 * - Generates a non-empty PDF for each current document
 * - Stores files under /app/uploads/documents
 * - Updates documents.file_url/file_name/file_size/file_type
 *
 * Run inside backend container:
 *   node scripts/repair-document-files.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const OUTPUT_DIR = path.join(UPLOADS_DIR, 'documents');

function slugify(value) {
  return String(value || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'document';
}

function escapePdfText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(value, maxChars = 90) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPdfBuffer(lines) {
  const escapedLines = lines.map((line) => escapePdfText(line));
  const content = [
    'BT',
    '/F1 12 Tf',
    '72 740 Td',
    ...escapedLines.map((line, idx) => (idx === 0 ? `(${line}) Tj` : `0 -16 Td (${line}) Tj`)),
    'ET',
    '',
  ].join('\n');

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  const obj4 = `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}endstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const header = '%PDF-1.4\n';
  const objects = [obj1, obj2, obj3, obj4, obj5];

  const offsets = [0];
  let cursor = Buffer.byteLength(header, 'utf8');
  for (const obj of objects) {
    offsets.push(cursor);
    cursor += Buffer.byteLength(obj, 'utf8');
  }

  const xrefPos = cursor;
  const xref = [
    'xref',
    '0 6',
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    String(xrefPos),
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(header + objects.join('') + xref, 'utf8');
}

async function generatePdf(filePath, documentRow) {
  const lines = [
    documentRow.title,
    'Trust Center Document',
    `Document ID: ${documentRow.id}`,
    `Access Level: ${documentRow.access_level}`,
    `NDA Required: ${documentRow.requires_nda ? 'Yes' : 'No'}`,
    `Status: ${documentRow.status}`,
    `Generated At: ${new Date().toISOString()}`,
    '',
    ...wrapText(
      documentRow.description && String(documentRow.description).trim().length > 0
        ? documentRow.description
        : 'This sample PDF was auto-generated to ensure this document has valid downloadable content for testing.'
    ),
    '',
    ...wrapText('Use admin document replace/upload actions to upload your production file when ready.'),
  ];

  const buffer = buildPdfBuffer(lines);
  fs.writeFileSync(filePath, buffer);
  const stats = fs.statSync(filePath);
  return stats.size;
}

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, description, access_level, requires_nda, status, is_current_version')
    .eq('is_current_version', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  if (!documents || documents.length === 0) {
    console.log('[REPAIR] No documents found');
    return;
  }

  let updated = 0;
  for (const doc of documents) {
    const fileName = `${slugify(doc.title)}-${doc.id.slice(0, 8)}.pdf`;
    const relativePath = `documents/${fileName}`;
    const absolutePath = path.join(UPLOADS_DIR, relativePath);

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    const fileSize = await generatePdf(absolutePath, doc);

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        file_url: relativePath,
        file_name: fileName,
        file_type: 'application/pdf',
        file_size: fileSize,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id);

    if (updateError) {
      throw new Error(`Failed to update ${doc.title}: ${updateError.message}`);
    }

    updated += 1;
    console.log(`[REPAIR] ${doc.title} -> ${relativePath} (${fileSize} bytes)`);
  }

  console.log(`[REPAIR] Completed. ${updated} document(s) repaired.`);
}

run().catch((err) => {
  console.error('[REPAIR] Error:', err.message);
  process.exit(1);
});
