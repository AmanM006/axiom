#!/bin/bash
set -e
echo "============================================"
echo "  AXIOM — Autonomous Infrastructure Repair  "
echo "============================================"
echo ""

echo "[1/5] Starting MCP servers..."
docker-compose up -d terminal-sandbox logdb github-mcp
sleep 3

echo "[2/5] Checking GitHub connection..."
if curl -sf http://localhost:8003/health | grep -q "connected"; then
  echo "  ✓ GitHub connected"
else
  echo "  ⚠ WARNING: GitHub not connected (check GITHUB_TOKEN)"
fi

echo "[3/5] Starting backend..."
docker-compose up -d backend
sleep 4

echo "[4/5] Starting frontend..."
docker-compose up -d frontend
sleep 5

echo "[5/5] Health checks..."
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
  echo "  ✓ Backend OK"
else
  echo "  ✗ Backend not responding"
fi

if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  echo "  ✓ Frontend OK"
else
  echo "  ✗ Frontend not responding (may still be building)"
fi

echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  AXIOM is running                        │"
echo "│                                          │"
echo "│  Dashboard: http://localhost:3000         │"
echo "│  API:       http://localhost:8080         │"
echo "│  API Docs:  http://localhost:8080/docs    │"
echo "└──────────────────────────────────────────┘"
