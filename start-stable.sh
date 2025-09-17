#!/bin/bash

# Stable Commerce System Startup Script  
# Uses containerized infrastructure with consistent configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to cleanup on exit
cleanup() {
    print_status "Stopping all application services..."
    pkill -f "product-mdm.*api.*server" 2>/dev/null || true
    pkill -f "pricing-mdm.*api.*server" 2>/dev/null || true
    pkill -f "ecommerce.*api.*server" 2>/dev/null || true
    pkill -f "pricing-mdm.*ingest.*server" 2>/dev/null || true  
    pkill -f "ecommerce.*ingest.*server" 2>/dev/null || true
    pkill -f "vite.*dev" 2>/dev/null || true
    pkill -f "system-monitor.*server" 2>/dev/null || true
    print_status "Cleanup complete"
}

# Function to kill processes on specific ports
cleanup_ports() {
    print_status "Cleaning up existing processes on required ports..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    lsof -ti:3003 | xargs kill -9 2>/dev/null || true
    lsof -ti:3004 | xargs kill -9 2>/dev/null || true
    lsof -ti:3005 | xargs kill -9 2>/dev/null || true
    lsof -ti:3006 | xargs kill -9 2>/dev/null || true
    lsof -ti:6001 | xargs kill -9 2>/dev/null || true
    lsof -ti:6002 | xargs kill -9 2>/dev/null || true
    lsof -ti:6003 | xargs kill -9 2>/dev/null || true
    lsof -ti:6004 | xargs kill -9 2>/dev/null || true
    lsof -ti:6005 | xargs kill -9 2>/dev/null || true
    lsof -ti:6006 | xargs kill -9 2>/dev/null || true
    lsof -ti:9001 | xargs kill -9 2>/dev/null || true
    lsof -ti:9002 | xargs kill -9 2>/dev/null || true
    lsof -ti:9003 | xargs kill -9 2>/dev/null || true
    lsof -ti:9004 | xargs kill -9 2>/dev/null || true
    lsof -ti:9005 | xargs kill -9 2>/dev/null || true
    lsof -ti:9006 | xargs kill -9 2>/dev/null || true
    sleep 2  # Give processes time to terminate
    print_status "Port cleanup complete"
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

echo "=============================================="
echo "🚀 Stable Commerce System Startup"
echo "=============================================="

# Step 0: Clean up any existing processes on required ports
cleanup_ports

# Step 1: Start containerized infrastructure
print_status "Step 1: Starting containerized infrastructure..."
if ! ./start-infrastructure.sh; then
    print_error "Failed to start infrastructure"
    exit 1
fi

# Step 2: Wait for infrastructure to be ready
sleep 5

# Step 3: Set environment variables for distributed database architecture
export DB_USER=postgres
export DB_PASSWORD=postgres

print_success "Using consolidated database configuration with schema separation"

# Step 4: Start APIs with consistent configuration
print_status "Step 2: Starting API services..."

# Product MDM API
print_status "Starting Product MDM API..."
cd "$BASE_DIR/product-mdm/api"
[ ! -d "node_modules" ] && npm install
PORT=6001 DB_HOST=localhost DB_PORT=5432 DB_NAME=commerce_db DB_SCHEMA=product_mdm DB_USER=postgres DB_PASSWORD=postgres npm start > /tmp/product-api-stable.log 2>&1 &
PRODUCT_API_PID=$!
print_success "Product MDM API started (PID: $PRODUCT_API_PID)"

# Pricing MDM API  
print_status "Starting Pricing MDM API..."
cd "$BASE_DIR/pricing-mdm/api"
[ ! -d "node_modules" ] && npm install
PORT=6002 DB_HOST=localhost DB_PORT=5432 DB_NAME=commerce_db DB_SCHEMA=pricing_mdm DB_USER=postgres DB_PASSWORD=postgres npm start > /tmp/pricing-api-stable.log 2>&1 &
PRICING_API_PID=$!
print_success "Pricing MDM API started (PID: $PRICING_API_PID)"

# E-commerce API
print_status "Starting E-commerce API..."
cd "$BASE_DIR/ecommerce/api" 
[ ! -d "node_modules" ] && npm install
PORT=6003 DB_HOST=localhost DB_PORT=5432 DB_NAME=commerce_db DB_SCHEMA=ecommerce DB_USER=postgres DB_PASSWORD=postgres PRICING_MDM_API_URL=http://localhost:6002 npm start > /tmp/ecommerce-api-stable.log 2>&1 &
ECOMMERCE_API_PID=$!
print_success "E-commerce API started (PID: $ECOMMERCE_API_PID)"

# Step 5: Wait for APIs
print_status "Waiting for APIs to start..."
sleep 10

# Test API connectivity
for port in 6001 6002 6003; do
    if curl -s "http://localhost:$port/health" > /dev/null; then
        print_success "API on port $port is responding"
    else  
        print_warning "API on port $port is not responding yet"
    fi
done

# Step 6: Start ingest services
print_status "Step 3: Starting ingest services..."

# Pricing MDM Ingest
print_status "Starting Pricing MDM Ingest..."
cd "$BASE_DIR/pricing-mdm/ingest"
[ ! -d "node_modules" ] && npm install
PORT=9002 DB_HOST=localhost DB_PORT=5432 DB_NAME=commerce_db DB_SCHEMA=pricing_mdm DB_USER=postgres DB_PASSWORD=postgres PRICING_MDM_API_URL=http://localhost:6002 npm start > /tmp/pricing-ingest-stable.log 2>&1 &
PRICING_INGEST_PID=$!
print_success "Pricing MDM Ingest started (PID: $PRICING_INGEST_PID)"

# E-commerce Ingest  
print_status "Starting E-commerce Ingest..."
cd "$BASE_DIR/ecommerce/ingest"
[ ! -d "node_modules" ] && npm install
PORT=9003 DB_HOST=localhost DB_PORT=5432 DB_NAME=commerce_db DB_SCHEMA=ecommerce DB_USER=postgres DB_PASSWORD=postgres WEBSOCKET_PORT=8087 npm start > /tmp/ecommerce-ingest-stable.log 2>&1 &
ECOMMERCE_INGEST_PID=$!
print_success "E-commerce Ingest started (PID: $ECOMMERCE_INGEST_PID)"

# Step 7: Start UI services  
print_status "Step 4: Starting UI services..."

# Product MDM UI
print_status "Starting Product MDM UI..."
cd "$BASE_DIR/product-mdm/ui"
[ ! -d "node_modules" ] && npm install  
npm run dev > /tmp/product-ui-stable.log 2>&1 &
PRODUCT_UI_PID=$!
print_success "Product MDM UI started (PID: $PRODUCT_UI_PID)"

# Pricing MDM UI
print_status "Starting Pricing MDM UI..."
cd "$BASE_DIR/pricing-mdm/ui"
[ ! -d "node_modules" ] && npm install
npm run dev > /tmp/pricing-ui-stable.log 2>&1 &  
PRICING_UI_PID=$!
print_success "Pricing MDM UI started (PID: $PRICING_UI_PID)"

# E-commerce UI
print_status "Starting E-commerce UI..."
cd "$BASE_DIR/ecommerce/ui"
[ ! -d "node_modules" ] && npm install
npm run dev > /tmp/ecommerce-ui-stable.log 2>&1 &
ECOMMERCE_UI_PID=$!
print_success "E-commerce UI started (PID: $ECOMMERCE_UI_PID)"

# System Monitor
print_status "Starting System Monitor..."
cd "$BASE_DIR/system-monitor"
[ ! -d "node_modules" ] && npm install
PORT=3006 npm start > /tmp/system-monitor-stable.log 2>&1 &
SYSTEM_MONITOR_PID=$!
print_success "System Monitor started (PID: $SYSTEM_MONITOR_PID)"

# Final status
echo ""
echo "=============================================="
print_success "🎉 Stable Commerce System is running!"
echo "=============================================="

echo ""
echo "📋 Service URLs (Standardized Port Map):"
echo "┌──────────────────────────────────────────────────┐"
echo "│ Product MDM UI:      http://localhost:3001       │"
echo "│ Product MDM API:     http://localhost:6001       │" 
echo "│ Pricing MDM UI:      http://localhost:3002       │"
echo "│ Pricing MDM API:     http://localhost:6002       │"
echo "│ Pricing MDM Ingest:  http://localhost:9002       │"
echo "│ E-commerce UI:       http://localhost:3003       │"
echo "│ E-commerce API:      http://localhost:6003       │"
echo "│ E-commerce Ingest:   http://localhost:9003       │"
echo "│ System Monitor:      http://localhost:3006       │"
echo ""
echo "│ pgAdmin:             http://localhost:8082       │"
echo "└──────────────────────────────────────────────────┘"

echo ""
echo "📊 Consolidated Database Configuration:"
echo "┌──────────────────────────────────────────────────┐"
echo "│ Database:         localhost:5432/commerce_db     │"
echo "│ Credentials:      postgres/postgres             │"
echo "│ Product MDM:      product_mdm schema             │"
echo "│ Pricing MDM:      pricing_mdm schema             │" 
echo "│ E-commerce:       ecommerce schema               │"
echo ""
echo "│ pgAdmin:          localhost:8082 (admin@commerce.com/admin) │"
echo "└──────────────────────────────────────────────────┘"

echo ""
echo "📝 Stable Log files:"
echo "┌──────────────────────────────────────────────────┐"
echo "│ Product API:       /tmp/product-api-stable.log   │"
echo "│ Pricing API:       /tmp/pricing-api-stable.log   │"
echo "│ E-commerce API:    /tmp/ecommerce-api-stable.log │"
echo "│ Pricing Ingest:    /tmp/pricing-ingest-stable.log│"
echo "│ E-commerce Ingest: /tmp/ecommerce-ingest-stable.log│"
echo "│ Product UI:        /tmp/product-ui-stable.log    │"
echo "│ Pricing UI:        /tmp/pricing-ui-stable.log    │"
echo "│ E-commerce UI:     /tmp/ecommerce-ui-stable.log  │"
echo "│ System Monitor:    /tmp/system-monitor-stable.log│"
echo "└──────────────────────────────────────────────────┘"

echo ""
print_status "All services running with consolidated database and containerized infrastructure"
print_status "Press Ctrl+C to stop all services and cleanup"

# Monitor loop
while true; do
    # Check if key processes are still running
    for pid in $PRODUCT_API_PID $PRICING_API_PID $ECOMMERCE_API_PID; do
        if ! kill -0 $pid 2>/dev/null; then
            print_error "Critical API process died (PID: $pid)"
            exit 1
        fi
    done
    
    sleep 10
done