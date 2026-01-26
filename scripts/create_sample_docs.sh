#!/bin/bash
# Script to create sample PDF documents for the Trust Center demo

# Create documents directory
mkdir -p /app/uploads/documents

# Create sample PDF files using base64-encoded minimal PDFs
# (These are simple one-page PDFs with text content)

# Security Policy PDF
cat > /app/uploads/documents/security_policy.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
50 700 Td
(Information Security Policy) Tj
0 -40 Td
/F1 12 Tf
(This document outlines our comprehensive security) Tj
0 -20 Td
(policies and procedures for protecting data.) Tj
0 -40 Td
(Version: 2.1 | Effective Date: January 2026) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000518 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
595
%%EOF
PDFEOF

# Penetration Test PDF
cat > /app/uploads/documents/penetration_test.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 220 >>
stream
BT
/F1 24 Tf
50 700 Td
(Penetration Test Summary 2025) Tj
0 -40 Td
/F1 12 Tf
(Executive summary of our annual penetration) Tj
0 -20 Td
(testing conducted by independent security firm.) Tj
0 -40 Td
(Status: No critical vulnerabilities found.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000538 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
615
%%EOF
PDFEOF

# Privacy Policy PDF
cat > /app/uploads/documents/privacy_policy.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
50 700 Td
(Privacy Policy) Tj
0 -40 Td
/F1 12 Tf
(This policy describes how we collect, use,) Tj
0 -20 Td
(and protect your personal information.) Tj
0 -40 Td
(Last Updated: January 2026) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000518 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
595
%%EOF
PDFEOF

# Data Processing Agreement PDF
cat > /app/uploads/documents/data_processing.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 220 >>
stream
BT
/F1 24 Tf
50 700 Td
(Data Processing Agreement) Tj
0 -40 Td
/F1 12 Tf
(Standard contractual clauses and data) Tj
0 -20 Td
(processing terms for GDPR compliance.) Tj
0 -40 Td
(Effective: January 2026) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000538 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
615
%%EOF
PDFEOF

# Incident Response Plan PDF
cat > /app/uploads/documents/incident_response.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 220 >>
stream
BT
/F1 24 Tf
50 700 Td
(Incident Response Plan) Tj
0 -40 Td
/F1 12 Tf
(Procedures for detecting, responding to,) Tj
0 -20 Td
(and recovering from security incidents.) Tj
0 -40 Td
(24/7 Security Operations Center contact info.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000538 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
615
%%EOF
PDFEOF

# Disaster Recovery Plan PDF
cat > /app/uploads/documents/disaster_recovery.pdf << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 220 >>
stream
BT
/F1 24 Tf
50 700 Td
(Business Continuity and DR Plan) Tj
0 -40 Td
/F1 12 Tf
(Strategies for maintaining operations) Tj
0 -20 Td
(during and after a disaster event.) Tj
0 -40 Td
(RTO: 4 hours | RPO: 1 hour) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000538 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
615
%%EOF
PDFEOF

echo "Sample PDF documents created successfully!"
ls -la /app/uploads/documents/
