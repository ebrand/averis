#!/bin/bash

# Script to create 20 fake products using curl and the Product MDM API
# All products will be created in 'draft' status with complete data

API_BASE_URL="http://localhost:6000"

echo "🚀 Starting to create 20 fake products using Product MDM API..."
echo

# Test API connectivity first
echo "🔍 Testing API connectivity..."
health_response=$(curl -s "$API_BASE_URL/health" || echo "FAILED")

if [[ "$health_response" == "FAILED" ]]; then
    echo "❌ Cannot connect to Product MDM API at $API_BASE_URL"
    echo "   Please ensure the API is running on port 6000"
    exit 1
fi

echo "✅ API is responding: $health_response"
echo

# Array of product data in JSON format (using simplified schema)
products=(
    '{
        "sku": "PRD-0001",
        "name": "Advanced Analytics Platform Pro",
        "description": "Comprehensive analytics and reporting solution for enterprise data",
        "longDescription": "Advanced Analytics Platform Pro provides enterprise-grade data visualization, reporting, and predictive analytics capabilities.",
        "type": "Software License",
        "basePrice": 15000,
        "costPrice": 9000,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": true,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Analytics", "Software"]
    }'
    
    '{
        "sku": "PRD-0002",
        "name": "Cloud Security Suite Enterprise",
        "description": "Complete cloud security solution with threat detection",
        "longDescription": "Cloud Security Suite Enterprise offers comprehensive protection for cloud infrastructure with real-time monitoring.",
        "type": "SaaS Subscription",
        "basePrice": 25000,
        "costPrice": 15000,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Security", "SaaS"]
    }'
    
    '{
        "sku": "PRD-0003",
        "name": "Developer Workstation Elite",
        "description": "High-performance workstation for software development",
        "longDescription": "Developer Workstation Elite features cutting-edge hardware optimized for software development workflows.",
        "type": "Hardware",
        "basePrice": 8500,
        "costPrice": 5100,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Development", "Hardware"]
    }'
    
    '{
        "sku": "PRD-0004",
        "name": "Database Migration Services",
        "description": "Professional database migration and optimization services",
        "longDescription": "Database Migration Services provides expert consultation for migrating and optimizing enterprise databases.",
        "type": "Service",
        "basePrice": 12000,
        "costPrice": 7200,
        "availableFlag": true,
        "webDisplayFlag": false,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Infrastructure", "Service"]
    }'
    
    '{
        "sku": "PRD-0005",
        "name": "DevOps Training Certification",
        "description": "Comprehensive DevOps training and certification program",
        "longDescription": "DevOps Training Certification offers hands-on training in modern DevOps practices and tools.",
        "type": "Training",
        "basePrice": 3500,
        "costPrice": 2100,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Development", "Training"]
    }'
    
    '{
        "sku": "PRD-0006",
        "name": "AI Implementation Consulting",
        "description": "Strategic AI implementation and consulting services",
        "longDescription": "AI Implementation Consulting helps organizations integrate artificial intelligence into their business processes.",
        "type": "Consulting",
        "basePrice": 18000,
        "costPrice": 10800,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Consulting", "AI"]
    }'
    
    '{
        "sku": "PRD-0007",
        "name": "Backup Recovery Solution",
        "description": "Enterprise backup and disaster recovery solution",
        "longDescription": "Backup & Recovery Solution provides comprehensive data protection and disaster recovery capabilities.",
        "type": "Software License",
        "basePrice": 22000,
        "costPrice": 13200,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": true,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Infrastructure", "Software"]
    }'
    
    '{
        "sku": "PRD-0008",
        "name": "Network Monitoring Plus",
        "description": "Advanced network monitoring and performance analysis",
        "longDescription": "Network Monitoring Plus delivers real-time network visibility and performance optimization tools.",
        "type": "SaaS Subscription",
        "basePrice": 8800,
        "costPrice": 5280,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Infrastructure", "SaaS"]
    }'
    
    '{
        "sku": "PRD-0009",
        "name": "Server Rack Standard 42U",
        "description": "Professional 42U server rack with cable management",
        "longDescription": "Server Rack Standard 42U provides enterprise-grade server housing with optimal airflow and cable management.",
        "type": "Hardware",
        "basePrice": 4500,
        "costPrice": 2700,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Infrastructure", "Hardware"]
    }'
    
    '{
        "sku": "PRD-0010",
        "name": "Security Audit Services",
        "description": "Comprehensive cybersecurity audit and assessment",
        "longDescription": "Security Audit Services offers thorough security assessments and vulnerability analysis for enterprise systems.",
        "type": "Service",
        "basePrice": 16000,
        "costPrice": 9600,
        "availableFlag": true,
        "webDisplayFlag": false,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Security", "Service"]
    }'
    
    '{
        "sku": "PRD-0011",
        "name": "Cloud Architecture Workshop",
        "description": "Intensive cloud architecture design workshop",
        "longDescription": "Cloud Architecture Workshop provides hands-on training in designing scalable cloud infrastructure.",
        "type": "Training",
        "basePrice": 5200,
        "costPrice": 3120,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Cloud", "Training"]
    }'
    
    '{
        "sku": "PRD-0012",
        "name": "Digital Transformation Strategy",
        "description": "Strategic digital transformation consulting",
        "longDescription": "Digital Transformation Strategy helps organizations modernize their technology stack and processes.",
        "type": "Consulting",
        "basePrice": 28000,
        "costPrice": 16800,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Strategy", "Consulting"]
    }'
    
    '{
        "sku": "PRD-0013",
        "name": "API Management Platform",
        "description": "Comprehensive API lifecycle management platform",
        "longDescription": "API Management Platform provides complete API design, deployment, and monitoring capabilities.",
        "type": "Software License",
        "basePrice": 19500,
        "costPrice": 11700,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": true,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["API", "Software"]
    }'
    
    '{
        "sku": "PRD-0014",
        "name": "Customer Data Platform",
        "description": "Unified customer data management and analytics",
        "longDescription": "Customer Data Platform consolidates customer data from multiple sources for unified analytics and insights.",
        "type": "SaaS Subscription",
        "basePrice": 32000,
        "costPrice": 19200,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Analytics", "SaaS"]
    }'
    
    '{
        "sku": "PRD-0015",
        "name": "High Performance Storage Array",
        "description": "Enterprise-grade high-performance storage system",
        "longDescription": "High-Performance Storage Array delivers exceptional performance for mission-critical applications.",
        "type": "Hardware",
        "basePrice": 45000,
        "costPrice": 27000,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Storage", "Hardware"]
    }'
    
    '{
        "sku": "PRD-0016",
        "name": "Infrastructure Assessment",
        "description": "Complete IT infrastructure evaluation service",
        "longDescription": "Infrastructure Assessment provides comprehensive evaluation of IT systems and recommendations for optimization.",
        "type": "Service",
        "basePrice": 14500,
        "costPrice": 8700,
        "availableFlag": true,
        "webDisplayFlag": false,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Infrastructure", "Service"]
    }'
    
    '{
        "sku": "PRD-0017",
        "name": "Kubernetes Administrator Course",
        "description": "Professional Kubernetes administration training",
        "longDescription": "Kubernetes Administrator Course offers comprehensive training in container orchestration and cluster management.",
        "type": "Training",
        "basePrice": 4200,
        "costPrice": 2520,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Kubernetes", "Training"]
    }'
    
    '{
        "sku": "PRD-0018",
        "name": "Enterprise Architecture Review",
        "description": "Strategic enterprise architecture consulting",
        "longDescription": "Enterprise Architecture Review provides expert analysis and recommendations for enterprise system design.",
        "type": "Consulting",
        "basePrice": 24000,
        "costPrice": 14400,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": false,
        "canBeFulfilledFlag": false,
        "contractItemFlag": true,
        "status": "draft",
        "categorization": ["Architecture", "Consulting"]
    }'
    
    '{
        "sku": "PRD-0019",
        "name": "Business Intelligence Suite",
        "description": "Complete business intelligence and reporting platform",
        "longDescription": "Business Intelligence Suite offers comprehensive data visualization, reporting, and dashboard capabilities.",
        "type": "Software License",
        "basePrice": 26500,
        "costPrice": 15900,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": true,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["BI", "Software"]
    }'
    
    '{
        "sku": "PRD-0020",
        "name": "Identity Management Cloud",
        "description": "Cloud-based identity and access management",
        "longDescription": "Identity Management Cloud provides secure, scalable identity and access management for cloud and on-premises applications.",
        "type": "SaaS Subscription",
        "basePrice": 15800,
        "costPrice": 9480,
        "availableFlag": true,
        "webDisplayFlag": true,
        "licenseRequiredFlag": false,
        "seatBasedPricingFlag": true,
        "canBeFulfilledFlag": true,
        "contractItemFlag": false,
        "status": "draft",
        "categorization": ["Identity", "SaaS"]
    }'
)

# Function to create a product
create_product() {
    local product_json="$1"
    local product_name=$(echo "$product_json" | grep -o '"name": "[^"]*"' | cut -d'"' -f4)
    
    echo "📦 Creating: $product_name"
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$product_json" \
        "$API_BASE_URL/api/products")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
        echo "✅ Created: $product_name"
        echo "   Response: $response_body" | head -c 100
        echo
        return 0
    else
        echo "❌ Failed: $product_name (HTTP $http_code)"
        echo "   Error: $response_body" | head -c 200
        echo
        return 1
    fi
}

# Create all products
success_count=0
total_count=${#products[@]}

for i in "${!products[@]}"; do
    echo "Creating product $((i+1))/$total_count..."
    
    if create_product "${products[$i]}"; then
        ((success_count++))
    fi
    
    # Small delay between requests
    sleep 0.5
done

echo
echo "🎉 Product creation complete!"
echo "✅ Successfully created: $success_count products"
echo "❌ Failed: $((total_count - success_count)) products"

if [[ $success_count -gt 0 ]]; then
    echo
    echo "📋 Verifying products in database..."
    curl -s "$API_BASE_URL/api/products" | head -200
fi