#!/usr/bin/env node

// Test script to directly publish messages to RabbitMQ to verify downstream consumption
import amqp from 'amqplib';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'commerce_db',
  user: 'postgres',
  password: 'postgres'
});

const rabbitmqConfig = {
  host: 'localhost',
  port: 5672,
  username: 'admin',
  password: 'admin',
  vhost: 'commerce',
  exchange: 'product.exchange'
};

async function testDirectMessaging() {
  console.log('🧪 Starting Direct Message Publishing Test...\n');
  
  let connection = null;
  let channel = null;
  
  try {
    // Connect to database and RabbitMQ
    await client.connect();
    console.log('✅ Connected to database');
    
    const connectionUrl = `amqp://${rabbitmqConfig.username}:${rabbitmqConfig.password}@${rabbitmqConfig.host}:${rabbitmqConfig.port}/${rabbitmqConfig.vhost}`;
    connection = await amqp.connect(connectionUrl);
    channel = await connection.createChannel();
    
    // Ensure exchange exists
    await channel.assertExchange(rabbitmqConfig.exchange, 'topic', { durable: true });
    console.log('✅ Connected to RabbitMQ and exchange verified');
    
    // Create a test product directly in the ProductMDM database
    const productId = uuidv4();
    const testProduct = {
      id: productId,
      sku: 'TEST-DIRECT-' + Date.now(),
      name: 'Test Product for Direct Messaging',
      description: 'A product to test direct message publishing and consumption',
      status: 'active',  // Create as active to simulate the "launched" state
      is_active: true,
      brand: 'TestBrand',
      manufacturer: 'TestMfg',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'test-direct-script',
      updated_by: 'test-direct-script'
    };
    
    // Insert into ProductMDM database
    const insertQuery = `
      INSERT INTO product_mdm.products (id, sku, name, description, status, is_active, created_at, updated_at, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    await client.query(insertQuery, [
      testProduct.id, testProduct.sku, testProduct.name, testProduct.description,
      testProduct.status, testProduct.is_active, testProduct.created_at, 
      testProduct.updated_at, testProduct.created_by, testProduct.updated_by
    ]);
    
    console.log(`✅ Created active test product: ${testProduct.sku} (${testProduct.id})`);
    
    // Manually publish the message that ProductMDM API would send
    const productUpdateMessage = {
      eventType: 'product.updated',
      timestamp: new Date().toISOString(),
      source: 'product-mdm-api',
      productId: testProduct.id,
      data: {
        operation: 'update',
        changes: {
          status: { from: 'draft', to: 'active' }
        },
        reason: 'product_launch',
        fullProduct: {
          id: testProduct.id,
          sku: testProduct.sku,
          skuCode: testProduct.sku, // Include both formats for compatibility
          name: testProduct.name,
          description: testProduct.description,
          status: testProduct.status,
          lifecycleStatus: testProduct.status,
          brand: 'TestBrand',
          manufacturer: 'TestMfg',
          basePrice: 99.99,
          listPrice: 149.99,
          costPrice: 49.99,
          unitOfMeasure: 'each',
          weight: 1.5,
          type: 'Software License',
          class: 'Core Product',
          category: 'Software',
          isActive: testProduct.is_active,
          availableFlag: true,
          webDisplayFlag: true,
          createdAt: testProduct.created_at,
          updatedAt: testProduct.updated_at,
          source: 'product-mdm'
        }
      },
      metadata: {
        correlationId: uuidv4(),
        version: '1.0',
        userId: 'test-direct-script'
      }
    };
    
    // Publish to product.updated routing key (this would trigger both ingest services)
    const messageBuffer = Buffer.from(JSON.stringify(productUpdateMessage));
    
    console.log('📡 Publishing product.updated message to RabbitMQ...');
    const published = channel.publish(
      rabbitmqConfig.exchange,
      'product.updated',
      messageBuffer,
      {
        persistent: true,
        timestamp: Date.now(),
        messageId: productUpdateMessage.metadata.correlationId
      }
    );
    
    if (published) {
      console.log(`✅ Published product.updated message for ${testProduct.name}`);
      console.log(`   Routing Key: product.updated`);
      console.log(`   Product ID: ${productId}`);
      console.log(`   This should trigger UPSERT operations in both downstream systems`);
    } else {
      console.log('❌ Failed to publish message');
      return;
    }
    
    // Wait for message processing
    console.log('\n⏳ Waiting 8 seconds for message consumption and UPSERT operations...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check downstream systems
    console.log('\n🔍 Checking downstream UPSERT results...');
    
    // Check Pricing MDM
    try {
      const pricingQuery = 'SELECT * FROM pricing_mdm.products WHERE id = $1';
      const pricingResult = await client.query(pricingQuery, [productId]);
      
      if (pricingResult.rows.length > 0) {
        const row = pricingResult.rows[0];
        console.log('✅ UPSERT SUCCESS in Pricing MDM:');
        console.log(`   ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   SKU: ${row.sku_code}`);
        console.log(`   Status: ${row.lifecycle_status}`);
        console.log(`   Active: ${row.is_active}`);
        console.log(`   Last Sync: ${row.last_sync_at}`);
        console.log(`   Source: ${row.source_system}`);
        console.log(`   Created By: ${row.created_by}`);
        console.log(`   Updated By: ${row.updated_by}`);
      } else {
        console.log('❌ UPSERT FAILED: Product NOT found in Pricing MDM database');
      }
    } catch (error) {
      console.log(`❌ Error checking Pricing MDM UPSERT: ${error.message}`);
    }
    
    // Check E-commerce
    try {
      const ecommerceQuery = 'SELECT * FROM ecommerce.products WHERE id = $1';
      const ecommerceResult = await client.query(ecommerceQuery, [productId]);
      
      if (ecommerceResult.rows.length > 0) {
        const row = ecommerceResult.rows[0];
        console.log('✅ UPSERT SUCCESS in E-commerce:');
        console.log(`   ID: ${row.id}`);
        console.log(`   Name: ${row.name}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Stock Status: ${row.stock_status}`);
        console.log(`   Active: ${row.is_active}`);
        console.log(`   Last Sync: ${row.last_sync_at}`);
        console.log(`   Display Name: ${row.display_name}`);
        console.log(`   SKU: ${row.sku}`);
        console.log(`   Slug: ${row.slug}`);
      } else {
        console.log('❌ UPSERT FAILED: Product NOT found in E-commerce database');
      }
    } catch (error) {
      console.log(`❌ Error checking E-commerce UPSERT: ${error.message}`);
    }
    
    console.log('\n🎯 Direct messaging test completed!');
    console.log('\nTest Verification:');
    console.log('  📝 Created product directly in ProductMDM database');
    console.log('  📡 Published product.updated message directly to RabbitMQ');
    console.log('  📨 Ingest services should have consumed message');
    console.log('  💾 Expected UPSERT operations in both downstream databases');
    console.log('  ✨ This tests the core messaging and data federation functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (channel) await channel.close();
    if (connection) await connection.close();
    await client.end();
    console.log('\n👋 Connections closed');
  }
}

// Run the test
testDirectMessaging();