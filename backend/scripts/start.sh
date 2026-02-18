#!/bin/sh
# Demo mode startup script
# Generates demo PDF files and seeds database if needed, then starts the server

if [ "$DEMO_MODE" = "true" ]; then
  echo "[DEMO] Demo mode enabled, checking for demo documents..."
  
  if [ ! -f "/app/uploads/documents/demo-soc2-type2-2025.pdf" ]; then
    echo "[DEMO] Generating demo PDF documents..."
    node /app/scripts/generate-demo-pdfs.js
    echo "[DEMO] Demo documents generated successfully"
  else
    echo "[DEMO] Demo documents already exist, skipping generation"
  fi

  # Seed document records into database (idempotent)
  echo "[DEMO] Seeding demo document records..."
  node /app/scripts/seed-demo-documents.js
fi

echo "Starting server..."
exec node dist/server.js
