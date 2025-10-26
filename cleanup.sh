#!/bin/bash

# Cleanup script for sui-otter project
# Removes temporary files, logs, and caches

echo "🧹 Cleaning up sui-otter project..."

# Remove Python cache
echo "  Removing Python __pycache__..."
find . -type d -name "__pycache__" -not -path "*/venv/*" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null

# Remove .pyc files
echo "  Removing .pyc files..."
find . -name "*.pyc" -not -path "*/venv/*" -not -path "*/node_modules/*" -delete 2>/dev/null

# Remove agent logs
echo "  Removing agent logs..."
rm -f agent/*.log 2>/dev/null

# Remove Next.js logs
echo "  Removing Next.js logs..."
find . -path "*/.next/dev/logs/*.log" -delete 2>/dev/null

# Remove .DS_Store (Mac)
echo "  Removing .DS_Store files..."
find . -name ".DS_Store" -delete 2>/dev/null

# Remove test files
echo "  Removing test files..."
rm -f agent/test_*.py 2>/dev/null

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Optional: Clean node_modules and rebuild"
echo "  Run: rm -rf node_modules package-lock.json && npm install"
echo ""
echo "Optional: Clean Python venv and rebuild"
echo "  Run: rm -rf agent/venv && python3 -m venv agent/venv"

