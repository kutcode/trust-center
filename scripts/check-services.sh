#!/bin/bash

echo "=== Checking Docker Services ==="
echo ""
echo "1. Checking if containers are running:"
docker ps --filter "name=trust-center" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2. Checking Studio logs (last 50 lines):"
docker logs trust-center-studio --tail 50 2>&1
echo ""

echo "3. Checking PostgREST logs:"
docker logs trust-center-rest --tail 30 2>&1
echo ""

echo "4. Checking Kong logs:"
docker logs trust-center-kong --tail 30 2>&1
echo ""

echo "5. Checking Meta logs:"
docker logs trust-center-meta --tail 30 2>&1
echo ""

echo "6. Testing database connection:"
docker exec -it trust-center-db psql -U postgres -d postgres -c "SELECT version();" 2>&1
echo ""

echo "7. Testing PostgREST connection:"
curl -s http://localhost:8000/rest/v1/ || echo "PostgREST not accessible"
echo ""

echo "=== Done ==="

