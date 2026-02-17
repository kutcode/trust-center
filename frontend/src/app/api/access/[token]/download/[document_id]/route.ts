import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; document_id: string }> }
) {
  const { token, document_id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const downloadUrl = `${apiUrl}/api/access/${token}/download/${document_id}`;

  // Proxy the request to backend
  return NextResponse.redirect(downloadUrl);
}
