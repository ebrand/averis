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