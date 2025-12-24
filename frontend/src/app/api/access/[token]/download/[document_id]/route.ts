import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; document_id: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const downloadUrl = `${apiUrl}/api/access/${params.token}/download/${params.document_id}`;
  
  // Proxy the request to backend
  return NextResponse.redirect(downloadUrl);
}

