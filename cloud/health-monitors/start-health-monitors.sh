#!/bin/bash

# Infrastructure Health Monitors Startup Script
echo "🔍 Starting Infrastructure Health Monitors..."

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables with defaults
export NATS_URL="${NATS_URL:-nats://localhost:4222}"
export NATS_HEALTH_PORT="${NATS_HEALTH_PORT:-8090}"
export POSTGRES_HEALTH_PORT="${POSTGRES_HEALTH_PORT:-8091}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-commerce_db}"
export DB_USER="${DB_USER:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "🌐 Environment Configuration:"
echo "  NATS Server: $NATS_URL"
echo "  NATS Health Port: $NATS_HEALTH_PORT"
echo "  PostgreSQL Health Port: $POSTGRES_HEALTH_PORT"
echo "  Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Start both health monitors in background
echo "🚀 Starting NATS Health Monitor on port $NATS_HEALTH_PORT..."
node nats-health.js &
NATS_PID=$!

echo "🚀 Starting PostgreSQL Health Monitor on port $POSTGRES_HEALTH_PORT..."
node postgres-health.js &
POSTGRES_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down health monitors..."
    kill $NATS_PID 2>/dev/null || true
    kill $POSTGRES_PID 2>/dev/null || true
    wait
    echo "✅ Health monitors stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "✅ Health monitors started successfully!"
echo ""
echo "🔗 Health Check URLs:"
echo "  NATS Health:      http://localhost:$NATS_HEALTH_PORT/health"
echo "  PostgreSQL Health: http://localhost:$POSTGRES_HEALTH_PORT/health"
echo ""
echo "💡 Press Ctrl+C to stop all monitors"

# Wait for both processes
wait