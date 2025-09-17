#!/bin/bash

# Debug connectivity issues between APIs and UIs
echo "🔍 Commerce System Connectivity Debug"
echo "====================================="

# Check if APIs are responding
echo
echo "📡 API Health Checks:"
echo "---------------------"

apis=("8001:Product MDM API" "8003:Pricing MDM API" "8004:E-commerce API")
for api in "${apis[@]}"; do
    port=$(echo $api | cut -d: -f1)
    name=$(echo $api | cut -d: -f2)
    
    if curl -s --max-time 3 http://localhost:$port/health > /dev/null; then
        echo "✅ $name (port $port): OK"
    else
        echo "❌ $name (port $port): NOT RESPONDING"
    fi
done

# Check if UIs are accessible
echo
echo "🌐 UI Accessibility:"
echo "--------------------"

uis=("3000:Product MDM UI" "3001:Pricing MDM UI" "3002:E-commerce UI")
for ui in "${uis[@]}"; do
    port=$(echo $ui | cut -d: -f1)
    name=$(echo $ui | cut -d: -f2)
    
    if curl -s --max-time 3 http://localhost:$port > /dev/null; then
        echo "✅ $name (port $port): OK"
    else
        echo "❌ $name (port $port): NOT RESPONDING"
    fi
done

# Check CORS and API endpoints from UI perspective
echo
echo "🔗 Cross-Origin API Tests:"
echo "--------------------------"

for api in "${apis[@]}"; do
    port=$(echo $api | cut -d: -f1)
    name=$(echo $api | cut -d: -f2)
    
    echo "Testing $name..."
    
    # Test with CORS headers that a browser would send
    response=$(curl -s -w "%{http_code}" -H "Origin: http://localhost:3000" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        --max-time 3 \
        http://localhost:$port/health)
    
    if [[ $response == *"200" ]]; then
        echo "  ✅ CORS test passed"
    else
        echo "  ❌ CORS test failed (response: $response)"
    fi
    
    # Test products endpoint if it's an API
    if [[ $name == *"API"* ]]; then
        products_response=$(curl -s -w "%{http_code}" \
            --max-time 3 \
            http://localhost:$port/api/products 2>/dev/null)
        
        if [[ $products_response == *"200" ]]; then
            echo "  ✅ Products endpoint working"
        else
            echo "  ❌ Products endpoint failed (response: $products_response)"
        fi
    fi
done

# Check processes
echo
echo "⚙️ Process Status:"
echo "------------------"

processes=("product-mdm/api" "pricing-mdm/api" "ecommerce/api" "product-mdm/ui" "pricing-mdm/ui" "ecommerce/ui")
for process in "${processes[@]}"; do
    if ps aux | grep "$process" | grep -v grep > /dev/null; then
        pid=$(ps aux | grep "$process" | grep -v grep | awk '{print $2}' | head -1)
        echo "✅ $process: Running (PID: $pid)"
    else
        echo "❌ $process: Not running"
    fi
done

# Check infrastructure
echo
echo "🛠️ Infrastructure:"
echo "------------------"

# Check database
if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d commerce_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL database: Connected"
else
    echo "❌ PostgreSQL database: Connection failed"
fi

# Check NATS
if curl -s --max-time 3 http://localhost:8222 > /dev/null; then
    echo "✅ NATS Management: Accessible"
else
    echo "❌ NATS Management: Not accessible"
fi

# Network connectivity between services
echo
echo "🌐 Network Connectivity:"
echo "------------------------"

# Test if services can reach each other
if curl -s --max-time 3 http://localhost:8001/health > /dev/null && \
   curl -s --max-time 3 http://localhost:8003/health > /dev/null; then
    echo "✅ Inter-service connectivity: Working"
else
    echo "❌ Inter-service connectivity: Issues detected"
fi

echo
echo "🔧 Quick Fixes:"
echo "---------------"
echo "1. Check system monitor: http://localhost:9001"
echo "2. Restart all services: ./start.sh"
echo "3. Check logs in /tmp/*.log files"
echo "4. Verify .env files have correct database settings"

echo
echo "Debug complete! Check system monitor for detailed status."