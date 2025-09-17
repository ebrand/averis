#!/usr/bin/env bash

# Averis Commerce Platform Stop Script
# Stops all services according to the official Port Map in CLAUDE.md
# Compatible with both standard and enhanced parallel startup versions

# Ensure we're running in bash (not sh/dash/zsh)
if [ -z "$BASH_VERSION" ]; then
    echo "ERROR: This script requires bash. Please run with: bash stop.sh"
    exit 1
fi

set +e  # Don't exit on errors during cleanup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_section() {
    echo -e "${PURPLE}[SECTION]${NC} $1"
}

# Function to stop processes by port
stop_port() {
    local port=$1
    local service_name=$2
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    
    if [ ! -z "$pids" ]; then
        print_status "Stopping $service_name on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        
        # Check if still running and force kill
        pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            print_warning "Force killing $service_name (PIDs: $pids)"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        
        print_success "Stopped $service_name"
    else
        print_status "No process running on port $port ($service_name)"
    fi
}

# Function to stop processes by pattern
stop_pattern() {
    local pattern=$1
    local service_name=$2
    
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_status "Stopping $service_name processes (PIDs: $pids)"
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 3
        
        # Force kill if still running
        pids=$(pgrep -f "$pattern" 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            print_warning "Force killing $service_name (PIDs: $pids)"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        
        print_success "Stopped $service_name"
    else
        print_status "No $service_name processes running"
    fi
}

# Stop banner
echo "=============================================="
echo "🛑 Averis Commerce Platform Shutdown"
echo "   Following Official Port Map from CLAUDE.md"
echo "=============================================="

# Stop UI services first (Vite - ports 3001, 3003, 3004, 3005, 3006, 3007, 3012)
print_section "🖥️ Stopping UI Services..."
stop_port 3001 "Product MDM UI"
stop_port 3003 "Pricing MDM UI"
stop_port 3004 "E-commerce UI"
stop_port 3005 "OMS UI"
stop_port 3006 "ERP UI"
stop_port 3007 "Customer MDM UI"
stop_port 3012 "Dashboard UI"

# Stop .NET API services (ports 6001, 6002, 6003, 6004, 6005, 6006, 6007)
print_section "🔧 Stopping .NET API Services..."
stop_port 6001 "Product MDM API"
stop_port 6002 "Product Staging API"
stop_port 6003 "Pricing MDM API"
stop_port 6004 "E-commerce API"
stop_port 6005 "OMS API"
stop_port 6006 "ERP API"
stop_port 6007 "Customer MDM API"
stop_port 6008 "Customer Staging API"
stop_port 6009 "Pricing Staging API"
stop_port 6010 "Localization API"

# Stop Ingest services (ports 9002, 9008)
print_section "📡 Stopping Ingest Services..."
stop_port 9002 "Product Staging Ingest"
stop_port 9008 "Customer Staging Ingest"

# Stop any remaining processes by pattern
print_section "🧹 Cleaning up remaining processes..."
stop_pattern "Commerce.Services.ProductMdm.Api" "Product MDM API"
stop_pattern "Commerce.Services.ProductStaging.Api" "Product Staging API"
stop_pattern "Commerce.Services.PricingMdm.Api" "Pricing MDM API"
stop_pattern "Commerce.Services.Ecommerce.Api" "E-commerce API"
stop_pattern "Commerce.Services.Oms.Api" "OMS API"
stop_pattern "Commerce.Services.Erp.Api" "ERP API"
stop_pattern "Commerce.Services.CustomerMdm.Api" "Customer MDM API"
stop_pattern "Commerce.Services.CustomerStaging.Api" "Customer Staging API"
stop_pattern "product-cache.*ingest" "Product Staging Ingest"
stop_pattern "customer-staging.*ingest" "Customer Staging Ingest"
stop_pattern "product-mdm.*vite" "Product MDM UI"
stop_pattern "pricing-mdm.*vite" "Pricing MDM UI"
stop_pattern "ecommerce.*vite" "E-commerce UI"
stop_pattern "order-management-system.*vite" "OMS UI"
stop_pattern "enterprise-resource-planning.*vite" "ERP UI"
stop_pattern "customer-mdm.*vite" "Customer MDM UI"
stop_pattern "commerce-dashboard.*vite" "Dashboard UI"

# Optional: Stop Docker services (infrastructure)
print_section "🏗️ Infrastructure Services (optional)..."
read -p "Stop Docker infrastructure (PostgreSQL, NATS)? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Stopping Docker infrastructure services..."
    
    # Stop NATS
    if docker ps --filter name=commerce-nats --quiet | grep -q .; then
        print_status "Stopping NATS container..."
        docker stop commerce-nats 2>/dev/null || print_warning "Failed to stop NATS container"
        docker rm commerce-nats 2>/dev/null || print_warning "Failed to remove NATS container"
    fi
    
    # Note: RabbitMQ removed - cloud services no longer needed
    
    # Stop Database
    if [ -d "$BASE_DIR/cloud/database" ]; then
        cd "$BASE_DIR/cloud/database"
        docker-compose down 2>/dev/null || print_warning "Failed to stop database"
    fi
    
    print_success "Infrastructure services stopped"
else
    print_status "Infrastructure services left running"
fi

# Clean up log files
print_section "📝 Cleaning up log files..."
read -p "Clean up log files in /tmp? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning up log files..."
    
    rm -f /tmp/product-mdm-api.log
    rm -f /tmp/product-staging-api.log
    rm -f /tmp/pricing-mdm-api.log
    rm -f /tmp/ecommerce-api.log
    rm -f /tmp/oms-api.log
    rm -f /tmp/erp-api.log
    rm -f /tmp/customer-mdm-api.log
    rm -f /tmp/customer-staging-api.log
    rm -f /tmp/product-staging-ingest.log
    rm -f /tmp/customer-staging-ingest.log
    rm -f /tmp/product-mdm-ui.log
    rm -f /tmp/pricing-mdm-ui.log
    rm -f /tmp/ecommerce-ui.log
    rm -f /tmp/oms-ui.log
    rm -f /tmp/erp-ui.log
    rm -f /tmp/customer-mdm-ui.log
    rm -f /tmp/dashboard-ui.log
    
    print_success "Log files cleaned up"
else
    print_status "Log files preserved in /tmp"
fi

echo "=============================================="
print_success "🎉 Averis Commerce Platform stopped!"
echo "=============================================="

echo ""
echo "📋 Stopped Services Summary:"
echo "┌────────────────────────────────────────────────────┐"
echo "│ ✅ UI Services (Vite):                           │"
echo "│    - Product MDM UI (3001)                        │"
echo "│    - Pricing MDM UI (3003)                        │"
echo "│    - E-commerce UI (3004)                         │"
echo "│    - OMS UI (3005)                                │"
echo "│    - ERP UI (3006)                                │"
echo "│    - Customer MDM UI (3007)                       │"
echo "│    - Dashboard UI (3012)                          │"
echo "│                                                    │"
echo "│ ✅ API Services (.NET):                          │"
echo "│    - Product MDM API (6001)                       │"
echo "│    - Product Staging API (6002)                   │"
echo "│    - Pricing MDM API (6003)                       │"
echo "│    - E-commerce API (6004)                        │"
echo "│    - OMS API (6005)                               │"
echo "│    - ERP API (6006)                               │"
echo "│    - Customer MDM API (6007)                      │"
echo "│    - Customer Staging API (6008)                  │"
echo "│                                                    │"
echo "│ ✅ Ingest Services (Node.js):                     │"
echo "│    - Product Staging Ingest (9002)                │"
echo "│    - Customer Staging Ingest (9008)               │"
echo "│                                                    │"
echo "│ 🏗️ Infrastructure (optional):                    │"
echo "│    - PostgreSQL Database (5432)                   │"
echo "│    - NATS Message Streaming (4222)                │"
echo "└────────────────────────────────────────────────────┘"

echo ""
print_status "To start services again, run: ./start.sh"
print_status "To check for any remaining processes: ps aux | grep -E '(dotnet|vite|node)'"