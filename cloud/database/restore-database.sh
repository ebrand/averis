#!/bin/bash

# ========================================
# AVERIS DATABASE COMPLETE RESTORATION SCRIPT
# ========================================
# This script completely recreates the entire Averis database system
# Usage: ./restore-database.sh [--force] [--no-sample-data]
# 
# Options:
#   --force           Drop existing database and recreate (destructive!)
#   --no-sample-data  Skip sample data insertion (schema only)
#   --help           Show this help message

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_NAME="commerce_db"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
FORCE_RECREATE=false
SKIP_SAMPLE_DATA=false

for arg in "$@"; do
    case $arg in
        --force)
            FORCE_RECREATE=true
            shift
            ;;
        --no-sample-data)
            SKIP_SAMPLE_DATA=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--force] [--no-sample-data] [--help]"
            echo ""
            echo "Options:"
            echo "  --force           Drop existing database and recreate (destructive!)"
            echo "  --no-sample-data  Skip sample data insertion (schema only)"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_step() {
    print_message $BLUE "🔄 $1"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_step "Checking PostgreSQL connection..."
    
    # Check if Docker container is running
    if ! docker ps | grep -q commerce-postgres; then
        print_error "PostgreSQL Docker container 'commerce-postgres' is not running!"
        print_message $YELLOW "Please start the database with: cd $SCRIPT_DIR && docker-compose up -d"
        exit 1
    fi
    
    # Test database connection
    if ! docker exec commerce-postgres pg_isready -U $POSTGRES_USER -d $DATABASE_NAME >/dev/null 2>&1; then
        print_error "Cannot connect to PostgreSQL database!"
        exit 1
    fi
    
    print_success "PostgreSQL is running and accessible"
}

# Function to execute SQL file
execute_sql_file() {
    local sql_file=$1
    local description=$2
    
    if [[ ! -f "$sql_file" ]]; then
        print_error "SQL file not found: $sql_file"
        exit 1
    fi
    
    print_step "$description"
    
    if docker exec -i commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME < "$sql_file" >/dev/null 2>&1; then
        print_success "$description completed"
    else
        print_error "$description failed"
        print_message $YELLOW "Check the SQL file: $sql_file"
        exit 1
    fi
}

# Function to execute SQL command
execute_sql() {
    local sql_command=$1
    local description=$2
    
    print_step "$description"
    
    if docker exec commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -c "$sql_command" >/dev/null 2>&1; then
        print_success "$description completed"
    else
        print_error "$description failed"
        print_message $YELLOW "SQL: $sql_command"
        exit 1
    fi
}

# Main restoration process
main() {
    print_message $GREEN "========================================="
    print_message $GREEN "🚀 AVERIS DATABASE RESTORATION SYSTEM"
    print_message $GREEN "========================================="
    echo ""
    
    # Check prerequisites
    check_postgres
    
    # Handle force recreate option
    if [[ "$FORCE_RECREATE" == "true" ]]; then
        print_warning "FORCE MODE: This will destroy ALL existing data!"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_message $YELLOW "Operation cancelled"
            exit 0
        fi
        
        # Drop and recreate database
        execute_sql "DROP DATABASE IF EXISTS $DATABASE_NAME;" "Dropping existing database"
        execute_sql "CREATE DATABASE $DATABASE_NAME;" "Creating fresh database"
    fi
    
    echo ""
    print_message $BLUE "📋 RESTORATION PLAN:"
    print_message $BLUE "1. Extensions and functions"
    print_message $BLUE "2. All schemas (averis_system, averis_customer, etc.)"
    print_message $BLUE "3. All tables with proper relationships"
    print_message $BLUE "4. Reference data (regions, currencies, etc.)"
    if [[ "$SKIP_SAMPLE_DATA" != "true" ]]; then
        print_message $BLUE "5. Sample data (products, catalogs, users)"
    fi
    echo ""
    
    # Step 1: Extensions and Core Functions
    execute_sql_file "$SCRIPT_DIR/scripts/01-extensions.sql" "Installing PostgreSQL extensions"
    
    # Step 2: Create all schemas
    execute_sql_file "$SCRIPT_DIR/scripts/02-schemas.sql" "Creating all schemas"
    
    # Step 3: Create all tables
    execute_sql_file "$SCRIPT_DIR/scripts/03-tables.sql" "Creating all tables"
    
    # Step 4: Reference data
    execute_sql_file "$SCRIPT_DIR/scripts/04-reference-data.sql" "Loading reference data"
    
    # Step 5: Sample data (unless skipped)
    if [[ "$SKIP_SAMPLE_DATA" != "true" ]]; then
        execute_sql_file "$SCRIPT_DIR/scripts/05-sample-data.sql" "Loading sample data"
    fi
    
    # Step 6: Final verification
    print_step "Verifying database restoration..."
    
    local table_count
    table_count=$(docker exec commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema LIKE 'averis_%';")
    table_count=$(echo $table_count | tr -d ' ')
    
    local schema_count
    schema_count=$(docker exec commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -t -c \
        "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name LIKE 'averis_%';")
    schema_count=$(echo $schema_count | tr -d ' ')
    
    echo ""
    print_success "🎉 DATABASE RESTORATION COMPLETED SUCCESSFULLY!"
    print_message $GREEN "📊 Statistics:"
    print_message $GREEN "   • Schemas created: $schema_count"
    print_message $GREEN "   • Tables created: $table_count"
    
    if [[ "$SKIP_SAMPLE_DATA" != "true" ]]; then
        local product_count
        product_count=$(docker exec commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -t -c \
            "SELECT COUNT(*) FROM averis_pricing.products;" 2>/dev/null || echo "0")
        product_count=$(echo $product_count | tr -d ' ')
        
        local catalog_count
        catalog_count=$(docker exec commerce-postgres psql -U $POSTGRES_USER -d $DATABASE_NAME -t -c \
            "SELECT COUNT(*) FROM averis_pricing.catalogs;" 2>/dev/null || echo "0")
        catalog_count=$(echo $catalog_count | tr -d ' ')
        
        print_message $GREEN "   • Sample products: $product_count"
        print_message $GREEN "   • Sample catalogs: $catalog_count"
    fi
    
    echo ""
    print_message $BLUE "🔗 Next Steps:"
    print_message $BLUE "   • Test Pricing MDM API: curl http://localhost:6003/health"
    print_message $BLUE "   • View Catalogs: curl http://localhost:6003/api/catalogs"
    print_message $BLUE "   • Access pgAdmin: http://localhost:8082"
    echo ""
}

# Run main function
main "$@"