#!/bin/bash

# Script to launch 10 products using the Product MDM API
# This will change their status from 'draft' to 'active' and trigger NATS message publishing

API_BASE_URL="http://localhost:6000"

echo "🚀 Starting to launch 10 products using Product MDM API..."
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

# First, get the list of current products to find their IDs
echo "📋 Getting list of products to launch..."
products_response=$(curl -s "$API_BASE_URL/api/products" || echo "FAILED")

if [[ "$products_response" == "FAILED" ]]; then
    echo "❌ Failed to get products list"
    exit 1
fi

# Extract the first 10 product IDs (we'll launch the first 10 alphabetically)
echo "🔍 Extracting product IDs for launch..."
product_ids=($(echo "$products_response" | python3 -c "
import json, sys
data = json.load(sys.stdin)
products = data.get('products', [])
# Sort products by name and take first 10
sorted_products = sorted(products, key=lambda x: x.get('name', ''))[:10]
for product in sorted_products:
    print(product.get('id', ''))
"))

if [ ${#product_ids[@]} -eq 0 ]; then
    echo "❌ No product IDs found"
    exit 1
fi

echo "📦 Found ${#product_ids[@]} products to launch"
echo

# Function to launch a product by updating its status to 'active'
launch_product() {
    local product_id="$1"
    local product_number="$2"
    local total="$3"
    
    echo "🚀 Launching product $product_number/$total (ID: $product_id)..."
    
    # Update product status to 'active' to trigger launch logic
    local response=$(curl -s -w "\n%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d '{"status": "active"}' \
        "$API_BASE_URL/api/products/$product_id")
    
    local http_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
        # Extract product name from response for better logging
        local product_name=$(echo "$response_body" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    product = data.get('data', {}) or data.get('product', {})
    print(product.get('name', 'Unknown Product'))
except:
    print('Unknown Product')
" 2>/dev/null || echo "Unknown Product")
        
        echo "✅ Launched: $product_name"
        echo "   Status changed from 'draft' to 'active'"
        echo "   NATS message published to downstream systems"
        echo
        return 0
    else
        echo "❌ Failed to launch product (HTTP $http_code)"
        echo "   Error: $response_body" | head -c 200
        echo
        return 1
    fi
}

# Launch the first 10 products
success_count=0
total_to_launch=10

for i in $(seq 0 $((total_to_launch - 1))); do
    if [ $i -lt ${#product_ids[@]} ]; then
        product_id="${product_ids[$i]}"
        echo "Launching product $((i+1))/$total_to_launch..."
        
        if launch_product "$product_id" "$((i+1))" "$total_to_launch"; then
            ((success_count++))
        fi
        
        # Small delay between launches to avoid overwhelming the system
        sleep 0.8
    fi
done

echo
echo "🎉 Product launch complete!"
echo "✅ Successfully launched: $success_count products"
echo "❌ Failed: $((total_to_launch - success_count)) products"
echo

if [[ $success_count -gt 0 ]]; then
    echo "📡 NATS messages have been published to:"
    echo "   • Pricing MDM ingest service"
    echo "   • E-commerce ingest service"
    echo
    echo "🔍 Check the downstream systems for message consumption:"
    echo "   • Pricing MDM: http://localhost:8001"
    echo "   • E-commerce: http://localhost:3001"
    echo
    echo "📊 Verifying active products in database..."
    curl -s "$API_BASE_URL/api/products?status=active" | head -300
fi