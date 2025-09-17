#!/bin/bash

# Commerce Infrastructure Stop Script
# Stops the consolidated database container

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

# Start banner
echo "=============================================="
echo "🛑 Commerce Infrastructure Shutdown"
echo "=============================================="

# Stop consolidated database
print_status "Stopping consolidated database..."
cd "$BASE_DIR/cloud/database"
if docker-compose down; then
    print_success "Database containers stopped"
else
    print_warning "Database containers may have already been stopped"
fi

# Show remaining containers
print_status "Remaining commerce containers:"
if docker ps --filter "name=commerce-" --format "table {{.Names}}\t{{.Status}}" | grep -q commerce-; then
    docker ps --filter "name=commerce-" --format "table {{.Names}}\t{{.Status}}"
else
    print_success "No commerce containers running"
fi

echo
echo "=============================================="
print_success "🎉 Infrastructure shutdown complete!"
echo "=============================================="