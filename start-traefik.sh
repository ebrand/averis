#!/bin/bash

# Averis Platform Traefik-Based Startup
# Simple, reliable startup using Docker Compose + Traefik service mesh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "=============================================="
echo "🚀 Averis Platform - Traefik Startup"
echo "   Modern Container Orchestration"
echo "=============================================="

# Ensure we're in the right directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

log_info "Docker is running ✓"

# Check if we need to create the external database network
if ! docker network ls | grep -q "database_commerce-network"; then
    log_info "Creating external database network..."
    docker network create database_commerce-network
fi

# Start the platform
log_info "Starting Averis Platform with Traefik..."
docker compose up -d

# Wait a moment for services to initialize
log_info "Waiting for services to initialize..."
sleep 10

# Check Traefik dashboard
log_info "Checking Traefik dashboard..."
if curl -s http://localhost:8080 >/dev/null 2>&1; then
    log_success "Traefik dashboard is available at http://localhost:8080"
else
    log_warning "Traefik dashboard not yet ready"
fi

log_success "🎉 Averis Platform Started!"
echo ""
echo "📋 Service URLs (via Traefik):"
echo "┌──────────────────────────────────────────────────────┐"
echo "│ 🖥️  USER INTERFACES                                  │"
echo "│ Product MDM:       http://product.localhost         │"
echo "│ Pricing MDM:       http://pricing.localhost         │"
echo "│ E-commerce:        http://ecommerce.localhost        │"
echo "│ Customer MDM:      http://customer.localhost         │"
echo "│ System Dashboard:  http://dashboard.localhost        │"
echo "│                                                      │"
echo "│ 🔧 API SERVICES (via Traefik Gateway)                │"
echo "│ Product API:       http://api.localhost/product      │"
echo "│ Product Staging:   http://api.localhost/product-staging│"
echo "│ Pricing API:       http://api.localhost/pricing      │"
echo "│ E-commerce API:    http://api.localhost/ecommerce    │"
echo "│ Customer API:      http://api.localhost/customer     │"
echo "│ System API:        http://api.localhost/system       │"
echo "│                                                      │"
echo "│ 🔍 INFRASTRUCTURE                                     │"
echo "│ Traefik Dashboard: http://localhost:8080             │"
echo "│ NATS Monitoring:   http://nats.localhost             │"
echo "│ Database:          localhost:5432 (postgres/postgres)│"
echo "└──────────────────────────────────────────────────────┘"
echo ""
echo "🛠️  Management Commands:"
echo "  View logs:    docker compose logs -f [service]"
echo "  Stop all:     docker compose down"
echo "  Restart:      docker compose restart [service]"
echo "  Status:       docker compose ps"
echo ""
log_info "Press Ctrl+C to stop, or run 'docker compose down' to shutdown"

# Optional: Keep script running to monitor
if [ "${1:-}" = "--monitor" ]; then
    log_info "Monitoring services (Ctrl+C to exit)..."
    docker compose logs -f
fi