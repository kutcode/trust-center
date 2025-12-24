#!/bin/bash

echo "=== Checking Storage Container ==="
echo ""
echo "1. Storage container status:"
docker ps -a --filter "name=trust-center-storage" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
echo ""

echo "2. Storage logs (last 100 lines):"
docker logs trust-center-storage --tail 100 2>&1
echo ""

echo "3. Testing storage API:"
curl -s http://localhost:5001/health || echo "Storage API not responding"
echo ""

echo "4. Checking if storage volume exists:"
docker volume ls | grep storage
echo ""

echo "=== Done ==="

