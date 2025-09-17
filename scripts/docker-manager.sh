#!/bin/bash

# Averis Platform Docker Management Script
# Provides convenient commands for managing the Docker Compose environment

set -e

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="averis"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "Averis Platform Docker Management"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up              Start all services"
    echo "  down            Stop all services"
    echo "  restart         Restart all services"
    echo "  build           Build all images"
    echo "  rebuild         Build images without cache"
    echo "  logs [service]  Show logs (optionally for specific service)"
    echo "  status          Show service status"
    echo "  health          Show health status of all services"
    echo "  shell [service] Open shell in running container"
    echo "  clean           Remove all containers, networks, and volumes"
    echo "  traefik         Open Traefik dashboard"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start all services"
    echo "  $0 logs product-mdm-api  # Show logs for Product MDM API"
    echo "  $0 shell postgres        # Open shell in postgres container"
    echo "  $0 health               # Check health of all services"
}

# Function to start services
start_services() {
    log_info "Starting Averis Platform services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    log_success "Services started! Access points:"
    echo ""
    echo "  🌐 Traefik Dashboard: http://traefik.localhost:8080"
    echo "  🛒 Product MDM UI:    http://product-mdm.localhost"
    echo "  📊 NATS Monitoring:   http://nats.localhost"
    echo "  🔗 API Gateway:       http://api.localhost"
    echo ""
    echo "  API Endpoints:"
    echo "    • Product MDM:      http://api.localhost/product-mdm/api"
    echo "    • Product Staging:  http://api.localhost/product-staging/api"
    echo "    • Customer MDM:     http://api.localhost/customer-mdm/api"
    echo "    • System API:       http://api.localhost/system/api"
    echo ""
}

# Function to stop services
stop_services() {
    log_info "Stopping Averis Platform services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    log_success "Services stopped"
}

# Function to restart services
restart_services() {
    log_info "Restarting Averis Platform services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart
    log_success "Services restarted"
}

# Function to build images
build_images() {
    log_info "Building Averis Platform images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build
    log_success "Images built successfully"
}

# Function to rebuild images without cache
rebuild_images() {
    log_info "Rebuilding Averis Platform images (no cache)..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache
    log_success "Images rebuilt successfully"
}

# Function to show logs
show_logs() {
    local service="$1"
    if [ -n "$service" ]; then
        log_info "Showing logs for $service..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "$service"
    else
        log_info "Showing logs for all services..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
    fi
}

# Function to show status
show_status() {
    log_info "Service status:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

# Function to check health
check_health() {
    log_info "Checking service health..."
    echo ""
    
    # Check Traefik
    echo "🔧 Traefik Dashboard:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
        log_success "  ✅ Traefik dashboard accessible"
    else
        log_error "  ❌ Traefik dashboard not accessible"
    fi
    
    # Check APIs
    echo ""
    echo "🔗 API Services:"
    
    # Product MDM API
    if curl -s -o /dev/null -w "%{http_code}" http://api.localhost/product-mdm/api/products/health | grep -q "200"; then
        log_success "  ✅ Product MDM API healthy"
    else
        log_error "  ❌ Product MDM API not healthy"
    fi
    
    # Product Staging API
    if curl -s -o /dev/null -w "%{http_code}" http://api.localhost/product-staging/api/products/health | grep -q "200"; then
        log_success "  ✅ Product Staging API healthy"
    else
        log_error "  ❌ Product Staging API not healthy"
    fi
    
    # Customer MDM API
    if curl -s -o /dev/null -w "%{http_code}" http://api.localhost/customer-mdm/api/health | grep -q "200"; then
        log_success "  ✅ Customer MDM API healthy"
    else
        log_error "  ❌ Customer MDM API not healthy"
    fi
    
    # System API
    if curl -s -o /dev/null -w "%{http_code}" http://api.localhost/system/api/health | grep -q "200"; then
        log_success "  ✅ System API healthy"
    else
        log_error "  ❌ System API not healthy"
    fi
    
    # Ingest Services
    echo ""
    echo "📥 Ingest Services:"
    if curl -s -o /dev/null -w "%{http_code}" http://ingest.localhost/product-staging/health | grep -q "200"; then
        log_success "  ✅ Product Staging Ingest healthy"
    else
        log_error "  ❌ Product Staging Ingest not healthy"
    fi
    
    echo ""
}

# Function to open shell in container
open_shell() {
    local service="$1"
    if [ -z "$service" ]; then
        log_error "Please specify a service name"
        echo "Available services:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --services
        return 1
    fi
    
    log_info "Opening shell in $service container..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec "$service" /bin/sh
}

# Function to clean everything
clean_all() {
    log_warning "This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Function to open Traefik dashboard
open_traefik() {
    log_info "Opening Traefik dashboard..."
    if command -v open >/dev/null 2>&1; then
        open http://traefik.localhost:8080
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://traefik.localhost:8080
    else
        echo "Open manually: http://traefik.localhost:8080"
    fi
}

# Main command handler
case "$1" in
    "up")
        start_services
        ;;
    "down")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "build")
        build_images
        ;;
    "rebuild")
        rebuild_images
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "health")
        check_health
        ;;
    "shell")
        open_shell "$2"
        ;;
    "clean")
        clean_all
        ;;
    "traefik")
        open_traefik
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac