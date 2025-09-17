#!/usr/bin/env node

// Test script to verify message publishing via API for active product lifecycle changes
import fetch from 'node-fetch';
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'commerce_db',
  user: 'postgres',
  password: 'postgres'
});

async function testAPIMessaging() {
  console.log('🧪 Starting API-based Product Messaging Test...\n');
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. Create a test product in draft status via API
    const timestamp = Date.now();
    const testProduct = {
      skuCode: `TEST-API-${timestamp}`,
      name: 'Test Product for API Messaging',
      description: 'A product to test message publishing via API when status changes to active',
      status: 'draft',
      // Add any other required fields based on validation
      revenueCategory: 'Standard' // This was mentioned as required for active products
    };
    
    console.log('📡 Creating test product via Product MDM API...');
    const createResponse = await fetch('http://localhost:8001/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.log(`❌ Failed to create product: ${createResponse.status} - ${error}`);
      return;
    }
    
    const createdProduct = await createResponse.json();
    console.log(`✅ Created test product: ${createdProduct.skuCode || createdProduct.sku_code} (${createdProduct.id})`);
    console.log(`   Status: ${createdProduct.status} (should NOT have triggered messaging yet)`);
    
    // 2. Wait a moment, then update the product to active status
    console.log('\n🔄 Waiting 2 seconds before updating to active status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatePayload = {
      ...createdProduct,
      status: 'active',
      lifecycleStatus: 'active',
      availableFlag: true,
      webDisplayFlag: true,
      revenueCategory: 'Standard' // Ensure this required field is set
    };
    
    console.log('📡 Updating product to active status via Product MDM API...');
    console.log(`   Product ID: ${createdProduct.id}`);
    
    const updateResponse = await fetch(`http://localhost:8001/api/products/${createdProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });
    
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log(`❌ Failed to update product: ${updateResponse.status} - ${error}`);
      return;
    }
    
    const updatedProduct = await updateResponse.json();
    console.log(`✅ Updated product to active status: ${updatedProduct.status}`);
    console.log(`   🚀 This should have triggered message publishing to downstream systems!`);
    
    // 3. Wait and check if messages were published and consumed
    console.log('\n⏳ Waiting 8 seconds for message processing...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check if product appeared in downstream systems
    console.log('\n🔍 Checking downstream systems...');
    
    // Check Pricing MDM
    try {
      const pricingQuery = 'SELECT * FROM pricing_mdm.products WHERE id = $1';
      const pricingResult = await client.query(pricingQuery, [createdProduct.id]);
      
      if (pricingResult.rows.length > 0) {
        console.log('✅ Product found in Pricing MDM database:');
        console.log(`   ID: ${pricingResult.rows[0].id}`);
        console.log(`   Name: ${pricingResult.rows[0].name}`);
        console.log(`   SKU: ${pricingResult.rows[0].sku_code}`);
        console.log(`   Status: ${pricingResult.rows[0].lifecycle_status}`);
        console.log(`   Active: ${pricingResult.rows[0].is_active}`);
        console.log(`   Last Sync: ${pricingResult.rows[0].last_sync_at}`);
        console.log(`   Source: ${pricingResult.rows[0].source_system}`);
      } else {
        console.log('❌ Product NOT found in Pricing MDM database');
      }
    } catch (error) {
      console.log(`❌ Error checking Pricing MDM: ${error.message}`);
    }
    
    // Check E-commerce
    try {
      const ecommerceQuery = 'SELECT * FROM ecommerce.products WHERE id = $1';
      const ecommerceResult = await client.query(ecommerceQuery, [createdProduct.id]);
      
      if (ecommerceResult.rows.length > 0) {
        console.log('✅ Product found in E-commerce database:');
        console.log(`   ID: ${ecommerceResult.rows[0].id}`);
        console.log(`   Name: ${ecommerceResult.rows[0].name}`);
        console.log(`   Status: ${ecommerceResult.rows[0].status}`);
        console.log(`   Stock Status: ${ecommerceResult.rows[0].stock_status}`);
        console.log(`   Active: ${ecommerceResult.rows[0].is_active}`);
        console.log(`   Last Sync: ${ecommerceResult.rows[0].last_sync_at}`);
      } else {
        console.log('❌ Product NOT found in E-commerce database');
      }
    } catch (error) {
      console.log(`❌ Error checking E-commerce: ${error.message}`);
    }
    
    // 4. Check RabbitMQ message counts
    console.log('\n📊 Checking message processing...');
    try {
      // Check ingest service health endpoints for processing stats
      const pricingHealthResponse = await fetch('http://localhost:8005/status');
      if (pricingHealthResponse.ok) {
        const pricingHealth = await pricingHealthResponse.json();
        console.log('📊 Pricing MDM Ingest Status:');
        console.log(`   Status: ${pricingHealth.status}`);
        console.log(`   RabbitMQ Connected: ${pricingHealth.details?.rabbitmq?.connected}`);
        console.log(`   Consuming: ${pricingHealth.details?.rabbitmq?.consuming}`);
      }
      
      const ecommerceHealthResponse = await fetch('http://localhost:5002/health');
      if (ecommerceHealthResponse.ok) {
        const ecommerceHealth = await ecommerceHealthResponse.json();
        console.log('📊 E-commerce Ingest Status:');
        console.log(`   Status: ${ecommerceHealth.status}`);
      }
    } catch (error) {
      console.log(`❌ Error checking service health: ${error.message}`);
    }
    
    console.log('\n🎯 API-based messaging test completed!');
    console.log('\nTest Results Summary:');
    console.log('  📝 Created product via Product MDM API in draft status');
    console.log('  🔄 Updated product to active status via Product MDM API');
    console.log('  📨 Expected: Messages published to RabbitMQ');
    console.log('  🔄 Expected: Ingest services consume and create UPSERTs');
    console.log('  💾 Expected: Product appears in both downstream databases');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test
testAPIMessaging();