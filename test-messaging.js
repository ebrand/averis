#!/usr/bin/env node

// Test script to verify message publishing and consumption for active product lifecycle changes
import fetch from 'node-fetch';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'commerce_db',
  user: 'postgres',
  password: 'postgres'
});

async function testProductMessaging() {
  console.log('🧪 Starting Product Messaging Test...\n');
  
  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');
    
    // 1. Create a test product in draft status
    const productId = uuidv4();
    const testProduct = {
      id: productId,
      sku: 'TEST-MSG-' + Date.now(),
      name: 'Test Product for Messaging',
      description: 'A product to test message publishing when status changes to active',
      status: 'draft',
      brand: 'TestBrand',
      manufacturer: 'TestManufacturer',
      attributes: {},
      metadata: {},
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'test-script',
      updated_by: 'test-script'
    };
    
    const insertQuery = `
      INSERT INTO product_mdm.products (id, sku, name, description, status, brand, manufacturer, attributes, metadata, is_active, created_at, updated_at, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    await client.query(insertQuery, [
      testProduct.id, testProduct.sku, testProduct.name, testProduct.description,
      testProduct.status, testProduct.brand, testProduct.manufacturer, 
      JSON.stringify(testProduct.attributes), JSON.stringify(testProduct.metadata), testProduct.is_active,
      testProduct.created_at, testProduct.updated_at, testProduct.created_by, testProduct.updated_by
    ]);
    
    console.log(`✅ Created test product: ${testProduct.sku} (${testProduct.id})`);
    console.log(`   Status: ${testProduct.status} (should NOT trigger messaging)`);
    
    // 2. Wait a moment, then update the product to active status using Product MDM API
    console.log('\n🔄 Waiting 2 seconds before updating to active status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update via API to trigger the message publishing logic
    const updatePayload = {
      ...testProduct,
      status: 'active',  // This should trigger message publishing
      available_flag: true,
      web_display_flag: true,
      updated_at: new Date().toISOString()
    };
    
    console.log('📡 Updating product to active status via Product MDM API...');
    
    try {
      const response = await fetch(`http://localhost:6001/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Mock auth for testing
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Updated product to active status: ${result.status}`);
        console.log(`   This should have triggered message publishing to downstream systems`);
      } else {
        const error = await response.text();
        console.log(`❌ API update failed: ${response.status} - ${error}`);
        
        // Fallback: Update directly via SQL to trigger any database triggers
        console.log('🔄 Falling back to direct database update...');
        await client.query(
          `UPDATE product_mdm.products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [productId]
        );
        console.log('✅ Updated product status directly in database');
      }
    } catch (apiError) {
      console.log(`❌ API call failed: ${apiError.message}`);
      console.log('🔄 Falling back to direct database update...');
      await client.query(
        `UPDATE product_mdm.products SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [productId]
      );
      console.log('✅ Updated product status directly in database');
    }
    
    // 3. Wait and check if messages were published and consumed
    console.log('\n⏳ Waiting 5 seconds for message processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if product appeared in downstream systems
    console.log('\n🔍 Checking downstream systems...');
    
    // Check Pricing MDM
    try {
      const pricingQuery = 'SELECT * FROM pricing_mdm.products WHERE id = $1';
      const pricingResult = await client.query(pricingQuery, [productId]);
      
      if (pricingResult.rows.length > 0) {
        console.log('✅ Product found in Pricing MDM database:');
        console.log(`   Name: ${pricingResult.rows[0].name}`);
        console.log(`   SKU: ${pricingResult.rows[0].sku_code}`);
        console.log(`   Status: ${pricingResult.rows[0].lifecycle_status}`);
        console.log(`   Last Sync: ${pricingResult.rows[0].last_sync_at}`);
      } else {
        console.log('❌ Product NOT found in Pricing MDM database');
      }
    } catch (error) {
      console.log(`❌ Error checking Pricing MDM: ${error.message}`);
    }
    
    // Check E-commerce
    try {
      const ecommerceQuery = 'SELECT * FROM ecommerce.products WHERE id = $1';
      const ecommerceResult = await client.query(ecommerceQuery, [productId]);
      
      if (ecommerceResult.rows.length > 0) {
        console.log('✅ Product found in E-commerce database:');
        console.log(`   Name: ${ecommerceResult.rows[0].name}`);
        console.log(`   Status: ${ecommerceResult.rows[0].status}`);
        console.log(`   Stock Status: ${ecommerceResult.rows[0].stock_status}`);
        console.log(`   Last Sync: ${ecommerceResult.rows[0].last_sync_at}`);
      } else {
        console.log('❌ Product NOT found in E-commerce database');
      }
    } catch (error) {
      console.log(`❌ Error checking E-commerce: ${error.message}`);
    }
    
    // 4. Check RabbitMQ queues
    console.log('\n📊 Checking RabbitMQ queue status...');
    try {
      const response = await fetch('http://guest:guest@localhost:15672/api/queues/commerce', {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('guest:guest').toString('base64')
        }
      });
      
      if (response.ok) {
        const queues = await response.json();
        queues.forEach(queue => {
          console.log(`   Queue: ${queue.name} - Messages: ${queue.messages}`);
        });
      } else {
        console.log('❌ Could not fetch RabbitMQ queue status');
      }
    } catch (error) {
      console.log(`❌ Error checking RabbitMQ: ${error.message}`);
    }
    
    console.log('\n🎯 Test completed!');
    console.log('\nExpected Results:');
    console.log('  ✅ Product created in draft status (no messaging)');
    console.log('  ✅ Product updated to active status (triggers messaging)');
    console.log('  ✅ Messages published to RabbitMQ');
    console.log('  ✅ Pricing MDM ingest consumes message and creates UPSERT');
    console.log('  ✅ E-commerce ingest consumes message and creates UPSERT');
    console.log('  ✅ Product appears in both downstream databases');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test
testProductMessaging();