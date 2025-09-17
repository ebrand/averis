#!/usr/bin/env bash

# Averis Commerce Platform Startup Script (Enhanced Parallel Version)
# Starts all services according to the official Port Map in CLAUDE.md

# Ensure we're running in bash (not sh/dash/zsh)
if [ -z "$BASH_VERSION" ]; then
    echo "ERROR: This script requires bash. Please run with: bash start.sh"
    exit 1
fi
# 
# ENHANCEMENTS:
# ✅ Parallel service startup within service groups (APIs, UIs)
# ✅ Process isolation using nohup - each service runs independently 
# ✅ Parallel health checks to reduce startup time
# ✅ Better error isolation - one service failure doesn't kill others
# ✅ Cross-platform compatibility (macOS, Linux, Unix)
#
# Port Map:
# UI (Vite):    Product(3001), Pricing(3003), E-comm(3004), Customer(3007), Dashboard(3012)  
# API (.NET):   Product(6001), P.Staging(6002), Pricing(6003), E-comm(6004), User/Customer(6007), C.Staging(6008)
# Ingest (Node): Product Staging(9002), Customer Staging(9008)
# Database:     PostgreSQL(5432), NATS(4222)

set -e  # Exit on any error

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

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port >/dev/null 2>&1; then
        # Port is in use - this is normal during startup verification
        return 0
    else
        return 1
    fi
}

# Function to clear processes on a specific port
clear_port() {
    local port=$1
    local service_name=$2
    if lsof -i :$port >/dev/null 2>&1; then
        print_status "Found existing process on port $port ($service_name) - cleaning up"
        local pids=$(lsof -ti :$port)
        if [ ! -z "$pids" ]; then
            # Try graceful shutdown first
            echo "$pids" | xargs kill -TERM 2>/dev/null || true
            sleep 3
            
            # Check if process is still running
            if lsof -i :$port >/dev/null 2>&1; then
                print_status "Process still running on port $port - force terminating"
                echo "$pids" | xargs kill -9 2>/dev/null || true
                sleep 2
                
                # Final check
                if lsof -i :$port >/dev/null 2>&1; then
                    print_warning "Unable to clear port $port - process may restart automatically"
                else
                    print_success "Successfully cleared port $port for $service_name"
                fi
            else
                print_success "Successfully cleared port $port for $service_name"
            fi
        fi
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service_name failed to start within $(($max_attempts * 2)) seconds"
    return 1
}

# Function to wait for multiple services in parallel (portable version)
wait_for_services_parallel() {
    local services_list="$1"
    local max_attempts=30
    
    print_status "Waiting for services to be ready in parallel..."
    
    # Start background health checks for each service
    local pids=""
    
    # Parse service list (format: "name1|url1 name2|url2 ...")
    for service_entry in $services_list; do
        local service_name=$(echo "$service_entry" | cut -d'|' -f1)
        local url=$(echo "$service_entry" | cut -d'|' -f2)
        
        (
            local attempt=1
            while [ $attempt -le $max_attempts ]; do
                if curl -s "$url" > /dev/null 2>&1; then
                    print_success "$service_name is ready!"
                    exit 0
                fi
                sleep 2
                attempt=$((attempt + 1))
            done
            print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
            exit 1
        ) &
        
        if [ -z "$pids" ]; then
            pids="$!"
        else
            pids="$pids $!"
        fi
    done
    
    # Wait for all health checks to complete
    local all_good=true
    for pid in $pids; do
        if ! wait $pid; then
            all_good=false
        fi
    done
    
    if $all_good; then
        print_success "All services are ready!"
        return 0
    else
        print_error "Some services failed to start"
        return 1
    fi
}

# Function to launch a service in an isolated process group (portable version)
launch_service_isolated() {
    local service_name=$1
    local work_dir=$2
    local command=$3
    local log_file=$4
    local port=$5
    
    print_status "Starting $service_name on port $port..."
    
    # Use nohup with subshell for process isolation
    # This provides good isolation and prevents hangup signals
    (
        cd "$work_dir" || exit 1
        
        # Parse command parts (separated by semicolons to handle spaces properly)
        local cmd_parts=$(echo "$command" | tr ';' ' ')
        
        # Create isolated process using nohup and background execution
        nohup bash -c "$cmd_parts" > "$log_file" 2>&1 &
        
        # Store the PID for potential future use
        echo $! > "${log_file}.pid"
    ) &
    
    # Give service a moment to start
    sleep 1
    
    # Verify the service process started
    if check_port $port "$service_name"; then
        print_success "$service_name process started successfully"
    else
        print_warning "$service_name may still be starting..."
    fi
}

# Function to launch multiple services in parallel (portable version)
launch_services_parallel() {
    local services_list="$1"
    local pids=""
    
    print_status "Launching services in parallel..."
    
    # Parse services list (format: "name1|dir1|cmd1|log1|port1 name2|dir2|cmd2|log2|port2 ...")
    for service_info in $services_list; do
        local service_name=$(echo "$service_info" | cut -d'|' -f1)
        local work_dir=$(echo "$service_info" | cut -d'|' -f2)
        local command=$(echo "$service_info" | cut -d'|' -f3)
        local log_file=$(echo "$service_info" | cut -d'|' -f4)
        local port=$(echo "$service_info" | cut -d'|' -f5)
        
        launch_service_isolated "$service_name" "$work_dir" "$command" "$log_file" "$port" &
        
        if [ -z "$pids" ]; then
            pids="$!"
        else
            pids="$pids $!"
        fi
    done
    
    # Wait for all launches to complete
    for pid in $pids; do
        wait $pid
    done
    
    print_success "All services launched in parallel!"
}

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down services..."
    
    # Kill .NET API processes
    pkill -f "Commerce.Services.ProductMdm.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.ProductStaging.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.PricingMdm.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.Ecommerce.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.Oms.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.Erp.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.UserMdm.Api" 2>/dev/null || true
    pkill -f "Commerce.Services.CustomerStaging.Api" 2>/dev/null || true
    
    # Kill Ingest services
    pkill -f "Commerce.Services.ProductStaging.Ingest" 2>/dev/null || true
    pkill -f "customer-staging.*ingest" 2>/dev/null || true
    
    # Kill UI processes
    pkill -f "product-mdm.*vite" 2>/dev/null || true
    pkill -f "pricing-mdm.*vite" 2>/dev/null || true
    pkill -f "ecommerce.*vite" 2>/dev/null || true
    pkill -f "order-management-system.*vite" 2>/dev/null || true
    pkill -f "enterprise-resource-planning.*vite" 2>/dev/null || true
    pkill -f "customer-mdm.*vite" 2>/dev/null || true
    pkill -f "commerce-dashboard.*vite" 2>/dev/null || true
    
    print_status "Cleanup complete"
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start timing
SCRIPT_START_TIME=$(date +%s)

# Start banner
echo "=============================================="
echo "🚀 Averis Commerce Platform Startup (Enhanced)"
echo "   Parallel Launch | Process Isolation | Fast Health Checks"
echo "   Following Official Port Map from CLAUDE.md"
echo "=============================================="

# Check required tools
if ! command -v dotnet &> /dev/null; then
    print_error ".NET SDK is not installed or not in PATH"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

print_success "All required tools are available (.NET, Node.js, npm)"

# Check infrastructure services
print_section "🏗️ Starting Infrastructure Services..."

# Check/Start PostgreSQL Database
print_status "Checking PostgreSQL Database..."
if ! check_port 5432 "PostgreSQL"; then
    print_status "Starting PostgreSQL via Docker..."
    cd "$BASE_DIR/cloud/database" && docker-compose up -d
    sleep 5
fi

# Note: RabbitMQ removed - using NATS only

# Check/Start NATS
print_status "Checking NATS..."
if ! check_port 4222 "NATS"; then
    print_status "Starting NATS via Docker..."
    if ! docker ps --filter name=commerce-nats --quiet | grep -q .; then
        docker run -d --name commerce-nats -p 4222:4222 -p 8222:8222 -p 6222:6222 nats:latest --jetstream --store_dir=/data
        sleep 5
    else
        print_status "NATS container already exists, ensuring it's running..."
        docker start commerce-nats 2>/dev/null || true
        sleep 5
    fi
fi

# Start Infrastructure Health Monitors
print_status "Starting Infrastructure Health Monitors..."
HEALTH_MONITORS_DIR="$BASE_DIR/cloud/health-monitors"
if [ -d "$HEALTH_MONITORS_DIR" ]; then
    cd "$HEALTH_MONITORS_DIR"
    
    # Start NATS health monitor
    if ! check_port 8090 "NATS Health Monitor"; then
        print_status "Starting NATS Health Monitor on port 8090..."
        nohup node nats-health.js > /tmp/nats-health.log 2>&1 &
        NATS_HEALTH_PID=$!
        sleep 2
        if check_port 8090 "NATS Health Monitor"; then
            print_success "NATS Health Monitor started (PID: $NATS_HEALTH_PID)"
        else
            print_error "Failed to start NATS Health Monitor"
        fi
    else
        print_success "NATS Health Monitor already running on port 8090"
    fi
    
    # Start PostgreSQL health monitor  
    if ! check_port 8091 "PostgreSQL Health Monitor"; then
        print_status "Starting PostgreSQL Health Monitor on port 8091..."
        nohup node postgres-health.js > /tmp/postgres-health.log 2>&1 &
        POSTGRES_HEALTH_PID=$!
        sleep 2
        if check_port 8091 "PostgreSQL Health Monitor"; then
            print_success "PostgreSQL Health Monitor started (PID: $POSTGRES_HEALTH_PID)"
        else
            print_error "Failed to start PostgreSQL Health Monitor"
        fi
    else
        print_success "PostgreSQL Health Monitor already running on port 8091"
    fi
    
    cd "$BASE_DIR"
else
    print_warning "Health monitors directory not found at $HEALTH_MONITORS_DIR"
fi

print_success "All infrastructure services are ready!"

# Check for existing healthy services and optionally skip restart
print_section "🔍 Checking for Running Services..."

# Function to check if service is healthy
check_service_health() {
    local port=$1
    local service_name=$2
    if check_port $port "$service_name"; then
        # Try health check
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || 
           curl -s "http://localhost:$port" > /dev/null 2>&1; then
            return 0  # Service is healthy
        fi
    fi
    return 1  # Service not healthy or not running
}

# Check if user wants to restart healthy services
HEALTHY_SERVICES=""
for port in 6001 6002 6003 6004 6005 6006 6007 6008 9002 9008 3001 3003 3004 3005 3006 3007 3012; do
    case $port in
        6001) service_name="Product MDM API" ;;
        6002) service_name="Product Staging API" ;;
        6003) service_name="Pricing MDM API" ;;
        6004) service_name="E-commerce API" ;;
        6005) service_name="OMS API" ;;
        6006) service_name="ERP API" ;;
        6007) service_name="User/Customer MDM API" ;;
        6008) service_name="Customer Staging API" ;;
        9002) service_name="Product Staging Ingest" ;;
        9008) service_name="Customer Staging Ingest" ;;
        3001) service_name="Product MDM UI" ;;
        3003) service_name="Pricing MDM UI" ;;
        3004) service_name="E-commerce UI" ;;
        3005) service_name="OMS UI" ;;
        3006) service_name="ERP UI" ;;
        3007) service_name="Customer MDM UI" ;;
        3012) service_name="Dashboard UI" ;;
    esac
    
    if check_service_health $port "$service_name"; then
        print_success "$service_name is already running and healthy on port $port"
        HEALTHY_SERVICES="$HEALTHY_SERVICES $port"
    fi
done

if [ ! -z "$HEALTHY_SERVICES" ]; then
    echo ""
    print_status "Some services are already running. Options:"
    echo "  1. Restart all services (clean slate)"
    echo "  2. Keep healthy services, start missing ones"
    echo "  3. Exit and use existing services"
    echo ""
    read -p "Enter choice (1-3) [default: 2]: " -r RESTART_CHOICE
    
    case ${RESTART_CHOICE:-2} in
        1)
            print_section "🧹 Restarting All Services..."
            for port in $HEALTHY_SERVICES; do
                case $port in
                    6001) clear_port $port "Product MDM API" ;;
                    6002) clear_port $port "Product Staging API" ;;
                    6003) clear_port $port "Pricing MDM API" ;;
                    6004) clear_port $port "E-commerce API" ;;
                    6005) clear_port $port "OMS API" ;;
                    6006) clear_port $port "ERP API" ;;
                    6007) clear_port $port "User/Customer MDM API" ;;
                    6008) clear_port $port "Customer Staging API" ;;
                    9002) clear_port $port "Product Staging Ingest" ;;
                    9008) clear_port $port "Customer Staging Ingest" ;;
                    3001) clear_port $port "Product MDM UI" ;;
                    3003) clear_port $port "Pricing MDM UI" ;;
                    3004) clear_port $port "E-commerce UI" ;;
                    3005) clear_port $port "OMS UI" ;;
                    3006) clear_port $port "ERP UI" ;;
                    3007) clear_port $port "Customer MDM UI" ;;
                    3012) clear_port $port "Dashboard UI" ;;
                esac
            done
            ;;
        3)
            print_success "Using existing healthy services. Exiting."
            exit 0
            ;;
        *)
            print_section "🔄 Starting Missing Services Only..."
            ;;
    esac
else
    print_section "🧹 Clearing Any Conflicting Processes..."
    clear_port 6001 "Product MDM API"
    clear_port 6002 "Product Staging API"
    clear_port 6003 "Pricing MDM API"
    clear_port 6004 "E-commerce API"
    clear_port 6005 "OMS API"
    clear_port 6006 "ERP API"
    clear_port 6007 "User/Customer MDM API"
    clear_port 6008 "Customer Staging API"
    clear_port 9002 "Product Staging Ingest"
    clear_port 9008 "Customer Staging Ingest"
    clear_port 3001 "Product MDM UI"
    clear_port 3003 "Pricing MDM UI"
    clear_port 3004 "E-commerce UI"
    clear_port 3005 "OMS UI"
    clear_port 3006 "ERP UI"
    clear_port 3007 "Customer MDM UI"
    clear_port 3012 "Dashboard UI"
fi

# Start .NET API services in parallel
print_section "🔧 Starting .NET API Services (Parallel Launch)..."

# Define API services for parallel launch (portable format)
api_services="Product_MDM_API|$BASE_DIR/dotnet-services/src/Commerce.Services.ProductMdm.Api|ASPNETCORE_URLS=http://localhost:6001;dotnet;run|/tmp/product-mdm-api.log|6001 Product_Staging_API|$BASE_DIR/dotnet-services/src/Commerce.Services.ProductStaging.Api|ASPNETCORE_URLS=http://localhost:6002;dotnet;run|/tmp/product-staging-api.log|6002 Pricing_MDM_API|$BASE_DIR/dotnet-services/src/Commerce.Services.PricingMdm.Api|ASPNETCORE_URLS=http://localhost:6003;dotnet;run|/tmp/pricing-mdm-api.log|6003 E-commerce_API|$BASE_DIR/dotnet-services/src/Commerce.Services.Ecommerce.Api|ASPNETCORE_URLS=http://localhost:6004;dotnet;run|/tmp/ecommerce-api.log|6004 OMS_API|$BASE_DIR/dotnet-services/src/Commerce.Services.Oms.Api|ASPNETCORE_URLS=http://localhost:6005;dotnet;run|/tmp/oms-api.log|6005 ERP_API|$BASE_DIR/dotnet-services/src/Commerce.Services.Erp.Api|ASPNETCORE_URLS=http://localhost:6006;dotnet;run|/tmp/erp-api.log|6006 User-Customer_MDM_API|$BASE_DIR/dotnet-services/src/Commerce.Services.UserMdm.Api|ASPNETCORE_URLS=http://localhost:6007;dotnet;run|/tmp/user-customer-api.log|6007 Customer_Staging_API|$BASE_DIR/dotnet-services/src/Commerce.Services.CustomerStaging.Api|ASPNETCORE_URLS=http://localhost:6008;dotnet;run|/tmp/customer-staging-api.log|6008"

# Launch all API services in parallel
launch_services_parallel "$api_services"

print_success "All .NET API services launched in parallel!"

# Start Ingest Services
print_section "📡 Starting Ingest Services..."

# Product Staging Ingest (9002)
print_status "Starting Product Staging Ingest on port 9002..."
cd "$BASE_DIR/product-staging/ingest"
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Launch Product Staging ingest service in isolated process group
launch_service_isolated "Product Staging Ingest" "$BASE_DIR/product-staging/ingest" "PORT=9002;DB_HOST=localhost;DB_PORT=5432;DB_NAME=commerce_db;DB_SCHEMA=averis_product_staging;DB_USER=postgres;DB_PASSWORD=postgres;NATS_HOST=localhost;NATS_PORT=4222;STREAM_NAME=PRODUCT_EVENTS;CONSUMER_NAME=product-staging-consumer;npm;start" "/tmp/product-staging-ingest.log" "9002"

# Customer Staging Ingest (9008)
print_status "Starting Customer Staging Ingest on port 9008..."
cd "$BASE_DIR/customer-staging/ingest"
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Launch Customer Staging ingest service in isolated process group
launch_service_isolated "Customer Staging Ingest" "$BASE_DIR/customer-staging/ingest" "PORT=9008;DB_HOST=localhost;DB_PORT=5432;DB_NAME=commerce_db;DB_SCHEMA=averis_customer_staging;DB_USER=postgres;DB_PASSWORD=postgres;NATS_HOST=localhost;NATS_PORT=4222;STREAM_NAME=CUSTOMER_EVENTS;CONSUMER_NAME=customer-staging-consumer;npm;start" "/tmp/customer-staging-ingest.log" "9008"

# Wait for APIs to be ready in parallel
print_section "⏳ Waiting for APIs to be ready (Parallel Health Checks)..."

api_health_urls="Product_MDM_API|http://localhost:6001/health Product_Staging_API|http://localhost:6002/health Pricing_MDM_API|http://localhost:6003/health E-commerce_API|http://localhost:6004/health OMS_API|http://localhost:6005/health ERP_API|http://localhost:6006/health User-Customer_MDM_API|http://localhost:6007/health Customer_Staging_API|http://localhost:6008/health Product_Staging_Ingest|http://localhost:9002/health Customer_Staging_Ingest|http://localhost:9008/health"

wait_for_services_parallel "$api_health_urls"

# Start UI services in parallel
print_section "🖥️ Starting UI Services (Parallel Launch)..."

# Pre-install UI dependencies to avoid race conditions
print_status "Ensuring UI dependencies are installed..."
for ui_dir in "$BASE_DIR/product-mdm/ui" "$BASE_DIR/pricing-mdm/ui" "$BASE_DIR/ecommerce/ui" "$BASE_DIR/order-management-system/ui" "$BASE_DIR/enterprise-resource-planning/ui" "$BASE_DIR/customer-mdm/ui" "$BASE_DIR/commerce-dashboard/ui"; do
    if [ -d "$ui_dir" ] && [ ! -d "$ui_dir/node_modules" ]; then
        print_status "Installing dependencies in $ui_dir..."
        cd "$ui_dir" && npm install
    fi
done

# Define UI services for parallel launch (portable format)
ui_services="Product_MDM_UI|$BASE_DIR/product-mdm/ui|PORT=3001;npm;run;dev|/tmp/product-mdm-ui.log|3001 Pricing_MDM_UI|$BASE_DIR/pricing-mdm/ui|PORT=3003;npm;run;dev|/tmp/pricing-mdm-ui.log|3003 E-commerce_UI|$BASE_DIR/ecommerce/ui|PORT=3004;npm;run;dev|/tmp/ecommerce-ui.log|3004 OMS_UI|$BASE_DIR/order-management-system/ui|PORT=3005;npm;run;dev|/tmp/oms-ui.log|3005 ERP_UI|$BASE_DIR/enterprise-resource-planning/ui|PORT=3006;npm;run;dev|/tmp/erp-ui.log|3006 Customer_MDM_UI|$BASE_DIR/customer-mdm/ui|PORT=3007;npm;run;dev|/tmp/customer-mdm-ui.log|3007 Dashboard_UI|$BASE_DIR/commerce-dashboard/ui|PORT=3012;npm;run;dev|/tmp/dashboard-ui.log|3012"

# Launch all UI services in parallel
launch_services_parallel "$ui_services"

print_success "All UI services launched in parallel!"

# Wait for UIs to be ready in parallel
print_section "⏳ Waiting for UIs to be ready (Parallel Health Checks)..."

ui_health_urls="Product_MDM_UI|http://localhost:3001 Pricing_MDM_UI|http://localhost:3003 E-commerce_UI|http://localhost:3004 OMS_UI|http://localhost:3005 ERP_UI|http://localhost:3006 Customer_MDM_UI|http://localhost:3007 Dashboard_UI|http://localhost:3012"

wait_for_services_parallel "$ui_health_urls"

# Calculate startup time
SCRIPT_END_TIME=$(date +%s)
TOTAL_STARTUP_TIME=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

# All services started
echo "=============================================="
print_success "🎉 Averis Commerce Platform is Running!"
print_success "⚡ Total startup time: ${TOTAL_STARTUP_TIME} seconds (Enhanced Parallel)"
echo "=============================================="

echo ""
echo "📋 Service URLs (Official Port Map):"
echo "┌────────────────────────────────────────────────────┐"
echo "│ 🖥️ USER INTERFACES (Vite)                          │"
echo "│ Product MDM UI:        http://localhost:3001       │"
echo "│ Pricing MDM UI:        http://localhost:3003       │"
echo "│ E-commerce UI:         http://localhost:3004       │"
echo "│ OMS UI:                http://localhost:3005       │"
echo "│ ERP UI:                http://localhost:3006       │"
echo "│ Customer MDM UI:       http://localhost:3007       │"
echo "│ Dashboard UI:          http://localhost:3012       │"
echo "│                                                    │"
echo "│ 🔧 API SERVICES (.NET)                             │"
echo "│ Product MDM API:       http://localhost:6001      │"
echo "│ Product Staging API:   http://localhost:6002      │"
echo "│ Pricing MDM API:       http://localhost:6003      │"
echo "│ E-commerce API:        http://localhost:6004      │"
echo "│ OMS API:               http://localhost:6005      │"
echo "│ ERP API:               http://localhost:6006      │"
echo "│ User/Customer MDM API: http://localhost:6007      │"
echo "│ Customer Staging API:  http://localhost:6008      │"
echo "│                                                   │"
echo "│ 📡 INGEST SERVICES (Node.js)                       │"
echo "│ Product Staging Ingest: http://localhost:9002     │"
echo "│ Customer Staging Ingest: http://localhost:9008    │"
echo "│                                                   │"
echo "│ 🏗️ INFRASTRUCTURE                                 │"
echo "│ PostgreSQL Database:   localhost:5432             │"
echo "│ NATS Message Streaming: nats://localhost:4222     │"
echo "│ NATS Management:       http://localhost:8222      │"
echo "│                                                   │"
echo "│ 🔍 HEALTH MONITORING                              │"
echo "│ NATS Health Check:     http://localhost:8090/health│"
echo "│ PostgreSQL Health:     http://localhost:8091/health│"
echo "└────────────────────────────────────────────────────┘"

echo ""
echo "🗄️ Database Schema Information:"
echo "┌────────────────────────────────────────────────────┐"
echo "│ Database: commerce_db (PostgreSQL)                │"
echo "│ Schemas:                                           │"
echo "│ - averis_system (internal users)                  │"
echo "│ - averis_customer (external customers)            │"
echo "│ - averis_product (product master data)            │"
echo "│ - averis_product_staging (read-optimized cache)   │"
echo "│ - averis_pricing (catalogs & pricing)             │"
echo "│ - averis_ecomm (customer-facing commerce)         │"
echo "│                                                    │"
echo "│ Credentials: postgres/postgres                    │"
echo "└────────────────────────────────────────────────────┘"

echo ""
echo "📝 Log Files:"
echo "┌────────────────────────────────────────────────────┐"
echo "│ APIs:                                              │"
echo "│ /tmp/product-mdm-api.log                          │"
echo "│ /tmp/product-staging-api.log                      │"
echo "│ /tmp/pricing-mdm-api.log                          │"
echo "│ /tmp/ecommerce-api.log                            │"
echo "│ /tmp/oms-api.log                                  │"
echo "│ /tmp/erp-api.log                                  │"
echo "│ /tmp/user-customer-api.log                        │"
echo "│ /tmp/customer-staging-api.log                     │"
echo "│                                                    │"
echo "│ Ingest:                                            │"
echo "│ /tmp/product-staging-ingest.log                   │"
echo "│ /tmp/customer-staging-ingest.log                  │"
echo "│                                                    │"
echo "│ UIs:                                               │"
echo "│ /tmp/product-mdm-ui.log                           │"
echo "│ /tmp/pricing-mdm-ui.log                           │"
echo "│ /tmp/ecommerce-ui.log                             │"
echo "│ /tmp/oms-ui.log                                   │"
echo "│ /tmp/erp-ui.log                                   │"
echo "│ /tmp/customer-mdm-ui.log                          │"
echo "│ /tmp/dashboard-ui.log                             │"
echo "└────────────────────────────────────────────────────┘"

echo ""
print_status "Press Ctrl+C to stop all services"
print_status "Monitor logs with: tail -f /tmp/*-api.log"

# Keep script running and monitor services
while true; do
    sleep 10
    
    # Check critical services
    if ! check_port 6001 "Product MDM API"; then
        print_error "Product MDM API is down"
    fi
    
    if ! check_port 6004 "E-commerce API"; then
        print_error "E-commerce API is down"
    fi
    
    if ! check_port 9002 "Product Staging Ingest"; then
        print_error "Product Staging Ingest is down"
    fi
    
    if ! check_port 6008 "Customer Staging API"; then
        print_error "Customer Staging API is down"
    fi
    
    if ! check_port 9008 "Customer Staging Ingest"; then
        print_error "Customer Staging Ingest is down"
    fi
done