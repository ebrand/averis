#!/bin/bash

# Commerce Infrastructure Startup Script
# Starts the consolidated database container

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

# Function to check if a container is running
check_container_running() {
    local container_name=$1
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        return 0  # Container is running
    else
        return 1  # Container is not running
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

# Start banner
echo "=============================================="
echo "🚀 Commerce Infrastructure Startup"
echo "=============================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

print_success "Docker is available"

# Start consolidated database
print_status "Starting consolidated database..."
if check_container_running "commerce-postgres"; then
    print_warning "Database container is already running"
else
    cd "$BASE_DIR/cloud/database"
    docker-compose up -d
    print_success "Database container started"
fi

# Wait for services to be ready
print_status "Verifying services are ready..."

# Check Database (simple connection test)
print_status "Waiting for database to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec commerce-postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Database is ready!"
        break
    fi
    
    echo -n "."
    sleep 2
    ((attempt++))
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Database failed to start within $(($max_attempts * 2)) seconds"
        exit 1
    fi
done

# Show running containers
print_status "Infrastructure containers status:"
echo
docker ps --filter "name=commerce-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "=============================================="
print_success "🎉 Infrastructure is ready!"
echo "=============================================="

echo
echo "📋 Service URLs:"
echo "┌─────────────────────────────────────────────┐"
echo ""
echo "│ Database (pgAdmin):  http://localhost:8082  │"
echo "│ Database Connection: localhost:5432         │"
echo "└─────────────────────────────────────────────┘"

echo
echo "🗄️  Database Schemas:"
echo "┌─────────────────────────────────────────────┐"
echo "│ Database: commerce_db (postgres/postgres)   │"
echo "│   - product_mdm schema                      │"
echo "│   - pricing_mdm schema                      │"
echo "│   - ecommerce schema                        │"
echo "│   - audit schema                            │"
echo "└─────────────────────────────────────────────┘"

echo
echo "🔐 Default Credentials:"
echo "┌─────────────────────────────────────────────┐"
echo ""
echo "│ Database:  postgres/postgres                │"
echo "│ pgAdmin:   admin@admin.com/admin            │"
echo "└─────────────────────────────────────────────┘"

echo
print_status "Infrastructure startup complete!"
print_status "Run './start.sh' to start the application services"