#!/bin/bash

# ========================================
# AVERIS SCHEMA MIGRATION - CODE UPDATES
# ========================================
# This script updates all code references to use new schema names

set -e

echo "🔄 Starting Averis schema migration code updates..."

# Root directory
ROOT_DIR="/Users/eric.brand/Documents/source/github/Eric-Brand_swi/eb/commerce-ctx"

# ========================================
# UPDATE .NET SERVICES
# ========================================

echo "📦 Updating .NET Core services..."

# Update connection strings and schema references in .NET appsettings
find "$ROOT_DIR/dotnet-services" -name "appsettings*.json" -type f | while read file; do
    echo "  🔧 Updating $file"
    
    # Update schema names in connection strings
    sed -i.bak -E 's/product_mdm/averis_product/g' "$file"
    sed -i.bak -E 's/pricing_mdm/averis_pricing/g' "$file"
    sed -i.bak -E 's/ecommerce/averis_ecomm/g' "$file"
    sed -i.bak -E 's/customer_mdm/averis_customer/g' "$file"
    
    # Clean up backup files
    rm -f "${file}.bak"
done

# Update .NET DbContext files to reference new schemas
find "$ROOT_DIR/dotnet-services" -name "*.cs" -type f | while read file; do
    if grep -q "HasDefaultSchema\|ToTable" "$file"; then
        echo "  🔧 Updating schema references in $file"
        
        sed -i.bak -E 's/HasDefaultSchema\("product_mdm"\)/HasDefaultSchema("averis_product")/g' "$file"
        sed -i.bak -E 's/HasDefaultSchema\("pricing_mdm"\)/HasDefaultSchema("averis_pricing")/g' "$file"
        sed -i.bak -E 's/HasDefaultSchema\("ecommerce"\)/HasDefaultSchema("averis_ecomm")/g' "$file"
        sed -i.bak -E 's/HasDefaultSchema\("customer_mdm"\)/HasDefaultSchema("averis_customer")/g' "$file"
        
        # Update ToTable references
        sed -i.bak -E 's/ToTable\("([^"]+)", "product_mdm"\)/ToTable("\1", "averis_product")/g' "$file"
        sed -i.bak -E 's/ToTable\("([^"]+)", "pricing_mdm"\)/ToTable("\1", "averis_pricing")/g' "$file"
        sed -i.bak -E 's/ToTable\("([^"]+)", "ecommerce"\)/ToTable("\1", "averis_ecomm")/g' "$file"
        sed -i.bak -E 's/ToTable\("([^"]+)", "customer_mdm"\)/ToTable("\1", "averis_customer")/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

# ========================================
# UPDATE NODE.js SERVICES
# ========================================

echo "📦 Updating Node.js services..."

# Update JavaScript/TypeScript files for schema references
find "$ROOT_DIR" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | grep -E "(api|ingest|ui)/src" | while read file; do
    if grep -q "product_mdm\|pricing_mdm\|ecommerce\|customer_mdm" "$file"; then
        echo "  🔧 Updating schema references in $file"
        
        sed -i.bak -E 's/product_mdm/averis_product/g' "$file"
        sed -i.bak -E 's/pricing_mdm/averis_pricing/g' "$file"
        sed -i.bak -E 's/([^_])ecommerce([^_])/\1averis_ecomm\2/g' "$file"
        sed -i.bak -E 's/customer_mdm/averis_customer/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

# ========================================
# UPDATE ENVIRONMENT VARIABLES
# ========================================

echo "🔧 Updating environment files..."

# Update .env files
find "$ROOT_DIR" -name ".env*" -type f | while read file; do
    echo "  🔧 Updating $file"
    
    sed -i.bak -E 's/DB_SCHEMA=product_mdm/DB_SCHEMA=averis_product/g' "$file"
    sed -i.bak -E 's/DB_SCHEMA=pricing_mdm/DB_SCHEMA=averis_pricing/g' "$file"
    sed -i.bak -E 's/DB_SCHEMA=ecommerce/DB_SCHEMA=averis_ecomm/g' "$file"
    sed -i.bak -E 's/DB_SCHEMA=customer_mdm/DB_SCHEMA=averis_customer/g' "$file"
    
    rm -f "${file}.bak"
done

# ========================================
# UPDATE PACKAGE.JSON SCRIPTS
# ========================================

echo "🔧 Updating package.json scripts..."

find "$ROOT_DIR" -name "package.json" -type f | while read file; do
    if grep -q "product_mdm\|pricing_mdm\|ecommerce\|customer_mdm" "$file"; then
        echo "  🔧 Updating scripts in $file"
        
        sed -i.bak -E 's/DB_SCHEMA=product_mdm/DB_SCHEMA=averis_product/g' "$file"
        sed -i.bak -E 's/DB_SCHEMA=pricing_mdm/DB_SCHEMA=averis_pricing/g' "$file"
        sed -i.bak -E 's/DB_SCHEMA=ecommerce/DB_SCHEMA=averis_ecomm/g' "$file"
        sed -i.bak -E 's/DB_SCHEMA=customer_mdm/DB_SCHEMA=averis_customer/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

# ========================================
# UPDATE SQL FILES
# ========================================

echo "🔧 Updating SQL files..."

find "$ROOT_DIR" -name "*.sql" -type f | while read file; do
    if grep -q "product_mdm\|pricing_mdm\|ecommerce\|customer_mdm" "$file" && [[ "$file" != *"migrations"* ]]; then
        echo "  🔧 Updating SQL schema references in $file"
        
        sed -i.bak -E 's/product_mdm\./averis_product\./g' "$file"
        sed -i.bak -E 's/pricing_mdm\./averis_pricing\./g' "$file"
        sed -i.bak -E 's/ecommerce\./averis_ecomm\./g' "$file"
        sed -i.bak -E 's/customer_mdm\./averis_customer\./g' "$file"
        
        # Update CREATE SCHEMA statements
        sed -i.bak -E 's/CREATE SCHEMA.*product_mdm/CREATE SCHEMA IF NOT EXISTS averis_product/g' "$file"
        sed -i.bak -E 's/CREATE SCHEMA.*pricing_mdm/CREATE SCHEMA IF NOT EXISTS averis_pricing/g' "$file"
        sed -i.bak -E 's/CREATE SCHEMA.*ecommerce/CREATE SCHEMA IF NOT EXISTS averis_ecomm/g' "$file"
        sed -i.bak -E 's/CREATE SCHEMA.*customer_mdm/CREATE SCHEMA IF NOT EXISTS averis_customer/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

# ========================================
# UPDATE DOCUMENTATION
# ========================================

echo "📚 Updating documentation..."

find "$ROOT_DIR" -name "*.md" -type f | while read file; do
    if grep -q "product_mdm\|pricing_mdm\|ecommerce\|customer_mdm" "$file"; then
        echo "  🔧 Updating documentation in $file"
        
        sed -i.bak -E 's/product_mdm/averis_product/g' "$file"
        sed -i.bak -E 's/pricing_mdm/averis_pricing/g' "$file"
        sed -i.bak -E 's/([^_])ecommerce([^_])/\1averis_ecomm\2/g' "$file"
        sed -i.bak -E 's/customer_mdm/averis_customer/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

# ========================================
# SPECIAL UPDATES
# ========================================

echo "🔧 Applying special updates..."

# Update any hardcoded user table references to point to averis_system.users
find "$ROOT_DIR" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.cs" \) | while read file; do
    if grep -q "product_mdm\.users\|pricing_mdm\.users\|customer_mdm\.users" "$file"; then
        echo "  🔧 Updating user table references in $file"
        
        sed -i.bak -E 's/product_mdm\.users/averis_system.users/g' "$file"
        sed -i.bak -E 's/pricing_mdm\.users/averis_system.users/g' "$file"
        sed -i.bak -E 's/customer_mdm\.users/averis_system.users/g' "$file"
        
        rm -f "${file}.bak"
    fi
done

echo "✅ Averis schema migration code updates completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the migration SQL script: cloud/database/migrations/001-averis-schema-migration.sql"
echo "2. Run the database migration: psql -d commerce_db -f cloud/database/migrations/001-averis-schema-migration.sql"
echo "3. Test all services with the new schema structure"
echo "4. Update any remaining hardcoded references manually"
echo "5. Update your CLAUDE.md file to reflect the new schema names"
echo ""
echo "🔍 To find any remaining old schema references:"
echo "grep -r 'product_mdm\\|pricing_mdm\\|customer_mdm' . --exclude-dir=node_modules --exclude-dir=.git --exclude='*.bak'"