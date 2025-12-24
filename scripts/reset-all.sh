#!/bin/bash

echo "🔄 Resetting Trust Center..."
echo ""

echo "1. Stopping all containers..."
docker-compose down

echo ""
echo "2. Removing all volumes (this will delete all data)..."
docker-compose down -v

echo ""
echo "3. Cleaning up any orphaned containers..."
docker-compose rm -f

echo ""
echo "4. Starting fresh..."
docker-compose up -d

echo ""
echo "✅ Reset complete! Waiting for services to start..."
echo ""
echo "⏳ Please wait 30-60 seconds for all services to initialize..."
echo ""
echo "Then check status with: docker ps"
echo "Or view logs with: docker-compose logs -f"

