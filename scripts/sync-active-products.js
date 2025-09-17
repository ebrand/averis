#!/usr/bin/env node

/**
 * Script to copy only 'active' products from product-mdm to pricing-mdm and ecommerce
 * This establishes the baseline for lifecycle-based product distribution
 */

import pkg from 'pg'
const { Pool } = pkg

// Database connections
const productMdmDb = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'product_mdm',
  user: 'postgres',
  password: 'postgres'
})

const pricingMdmDb = new Pool({
  host: 'localhost',
  port: 5434,
  database: 'pricing_mdm',
  user: 'postgres',
  password: 'postgres'
})

const ecommerceDb = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'ecommerce',
  user: 'postgres',
  password: 'postgres'
})

async function syncActiveProducts() {
  console.log('🚀 Starting sync of active products...')
  
  try {
    // 1. Get all active products from product-mdm
    console.log('📋 Fetching active products from product-mdm...')
    const activeProductsQuery = `
      SELECT * FROM product_mdm.products 
      WHERE status = 'active' AND inactive_flag = false
      ORDER BY created_at DESC
    `
    
    const result = await productMdmDb.query(activeProductsQuery)
    const activeProducts = result.rows
    
    console.log(`✅ Found ${activeProducts.length} active products in product-mdm`)
    
    if (activeProducts.length === 0) {
      console.log('⚠️  No active products found. Creating some sample products...')
      await createSampleActiveProducts()
      
      // Re-fetch active products
      const newResult = await productMdmDb.query(activeProductsQuery)
      activeProducts.push(...newResult.rows)
    }
    
    // 2. Convert and insert into pricing-mdm (minimal format)
    console.log('💰 Syncing to pricing-mdm...')
    let pricingSyncCount = 0
    
    for (const product of activeProducts) {
      try {
        const minimalProduct = convertToMinimalPricingFormat(product)
        
        const insertQuery = `
          INSERT INTO pricing_mdm.products (
            id, sku_code, inactive_flag, name, display_name, description, license_description,
            change_code, class, revenue_category, upgrade_type, categorization, license_count,
            seat_based_pricing_flag, seat_adjustment_flag, seat_min_price_break_level,
            seat_max_price_break_level, license_key_type, app_id, app_key, license_required_flag,
            renewal_required_flag, portal_renewal_flag, grouped_license_flag, additional_license_flag,
            additional_licenses_to_provision, term_license_flag, web_display_flag, sales_quotable_flag,
            channel_quotable_flag, web_quotable_flag, team_approval_needed_flag, base_price, pricing,
            ava_tax_code, tax_schedule, income_account, deferred_revenue_account, maintenance_item,
            renewal_item, item_revenue_category, rev_rec_rule, rev_rec_forecast_rule, rev_allocation_group,
            exclude_from_autoprocess_flag, can_be_fulfilled_flag, create_revenue_plans_on,
            contract_billing_frequency, contract_end_of_term_action, contract_item_flag, contract_item_type,
            contract_term_months, initial_contract_line_status_code, type, sub_type, include_children_flag,
            allocation_type, base_product, subsidiary, available_flag, direct_revenue_posting_flag,
            status, approvals, created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62)
          ON CONFLICT (id) DO UPDATE SET
            sku_code = EXCLUDED.sku_code,
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            class = EXCLUDED.class,
            base_price = EXCLUDED.base_price,
            available_flag = EXCLUDED.available_flag,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        `
        
        await pricingMdmDb.query(insertQuery, [
          minimalProduct.id, minimalProduct.sku_code, minimalProduct.inactive_flag, minimalProduct.name,
          minimalProduct.display_name, minimalProduct.description, minimalProduct.license_description,
          minimalProduct.change_code, minimalProduct.class, minimalProduct.revenue_category,
          minimalProduct.upgrade_type, minimalProduct.categorization, minimalProduct.license_count,
          minimalProduct.seat_based_pricing_flag, minimalProduct.seat_adjustment_flag,
          minimalProduct.seat_min_price_break_level, minimalProduct.seat_max_price_break_level,
          minimalProduct.license_key_type, minimalProduct.app_id, minimalProduct.app_key,
          minimalProduct.license_required_flag, minimalProduct.renewal_required_flag,
          minimalProduct.portal_renewal_flag, minimalProduct.grouped_license_flag,
          minimalProduct.additional_license_flag, minimalProduct.additional_licenses_to_provision,
          minimalProduct.term_license_flag, minimalProduct.web_display_flag,
          minimalProduct.sales_quotable_flag, minimalProduct.channel_quotable_flag,
          minimalProduct.web_quotable_flag, minimalProduct.team_approval_needed_flag,
          minimalProduct.base_price, minimalProduct.pricing, minimalProduct.ava_tax_code,
          minimalProduct.tax_schedule, minimalProduct.income_account,
          minimalProduct.deferred_revenue_account, minimalProduct.maintenance_item,
          minimalProduct.renewal_item, minimalProduct.item_revenue_category,
          minimalProduct.rev_rec_rule, minimalProduct.rev_rec_forecast_rule,
          minimalProduct.rev_allocation_group, minimalProduct.exclude_from_autoprocess_flag,
          minimalProduct.can_be_fulfilled_flag, minimalProduct.create_revenue_plans_on,
          minimalProduct.contract_billing_frequency, minimalProduct.contract_end_of_term_action,
          minimalProduct.contract_item_flag, minimalProduct.contract_item_type,
          minimalProduct.contract_term_months, minimalProduct.initial_contract_line_status_code,
          minimalProduct.type, minimalProduct.sub_type, minimalProduct.include_children_flag,
          minimalProduct.allocation_type, minimalProduct.base_product, minimalProduct.subsidiary,
          minimalProduct.available_flag, minimalProduct.direct_revenue_posting_flag,
          minimalProduct.status, minimalProduct.approvals, minimalProduct.created_at,
          minimalProduct.updated_at, minimalProduct.created_by, minimalProduct.updated_by
        ])
        
        pricingSyncCount++
      } catch (error) {
        console.error(`❌ Error syncing product ${product.id} to pricing-mdm:`, error.message)
      }
    }
    
    console.log(`✅ Synced ${pricingSyncCount} products to pricing-mdm`)
    
    // 3. Convert and insert into ecommerce (display format)
    console.log('🛍️  Syncing to ecommerce...')
    let ecommerceSyncCount = 0
    
    for (const product of activeProducts) {
      try {
        const displayProduct = convertToDisplayFormat(product)
        
        const insertQuery = `
          INSERT INTO ecommerce.products (
            id, sku, name, display_name, short_description, long_description,
            brand, specifications, features, stock_status, stock_quantity,
            weight, meta_title, meta_description, status, source_system,
            last_sync_at, sync_version, is_active, created_at, updated_at,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO UPDATE SET
            sku = EXCLUDED.sku,
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            short_description = EXCLUDED.short_description,
            long_description = EXCLUDED.long_description,
            brand = EXCLUDED.brand,
            specifications = EXCLUDED.specifications,
            features = EXCLUDED.features,
            stock_status = EXCLUDED.stock_status,
            stock_quantity = EXCLUDED.stock_quantity,
            weight = EXCLUDED.weight,
            meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            status = EXCLUDED.status,
            last_sync_at = EXCLUDED.last_sync_at,
            sync_version = EXCLUDED.sync_version,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        `
        
        await ecommerceDb.query(insertQuery, [
          displayProduct.id,
          displayProduct.sku,
          displayProduct.name,
          displayProduct.display_name,
          displayProduct.short_description,
          displayProduct.long_description,
          displayProduct.brand,
          displayProduct.specifications,
          displayProduct.features,
          displayProduct.stock_status,
          displayProduct.stock_quantity,
          displayProduct.weight,
          displayProduct.meta_title,
          displayProduct.meta_description,
          displayProduct.status,
          displayProduct.source_system,
          displayProduct.last_sync_at,
          displayProduct.sync_version,
          displayProduct.is_active,
          displayProduct.created_at,
          displayProduct.updated_at,
          displayProduct.created_by,
          displayProduct.updated_by
        ])
        
        ecommerceSyncCount++
      } catch (error) {
        console.error(`❌ Error syncing product ${product.id} to ecommerce:`, error.message)
      }
    }
    
    console.log(`✅ Synced ${ecommerceSyncCount} products to ecommerce`)
    
    // 4. Summary
    console.log('\n📊 Sync Summary:')
    console.log(`   Active products in product-mdm: ${activeProducts.length}`)
    console.log(`   Synced to pricing-mdm: ${pricingSyncCount}`)
    console.log(`   Synced to ecommerce: ${ecommerceSyncCount}`)
    console.log('\n🎉 Active product sync completed!')
    
  } catch (error) {
    console.error('💥 Error during sync:', error)
    throw error
  } finally {
    await productMdmDb.end()
    await pricingMdmDb.end()
    await ecommerceDb.end()
  }
}

function convertToMinimalPricingFormat(product) {
  return {
    id: product.id,
    sku_code: product.sku_code,
    inactive_flag: false,
    name: product.name,
    display_name: product.display_name || product.name,
    description: product.description || '',
    license_description: '',
    change_code: '',
    class: product.class || 'general',
    revenue_category: product.revenue_category || '',
    upgrade_type: '',
    categorization: JSON.stringify([]),
    license_count: 0,
    seat_based_pricing_flag: false,
    seat_adjustment_flag: false,
    seat_min_price_break_level: '',
    seat_max_price_break_level: '',
    license_key_type: '',
    app_id: 0,
    app_key: 0,
    license_required_flag: false,
    renewal_required_flag: false,
    portal_renewal_flag: false,
    grouped_license_flag: false,
    additional_license_flag: false,
    additional_licenses_to_provision: '',
    term_license_flag: false,
    web_display_flag: product.web_display_flag || false,
    sales_quotable_flag: true,
    channel_quotable_flag: true,
    web_quotable_flag: true,
    team_approval_needed_flag: false,
    base_price: parseFloat(product.base_price || 0),
    pricing: JSON.stringify([]),
    ava_tax_code: '',
    tax_schedule: '',
    income_account: '',
    deferred_revenue_account: '',
    maintenance_item: '',
    renewal_item: '',
    item_revenue_category: '',
    rev_rec_rule: '',
    rev_rec_forecast_rule: '',
    rev_allocation_group: '',
    exclude_from_autoprocess_flag: false,
    can_be_fulfilled_flag: true,
    create_revenue_plans_on: '',
    contract_billing_frequency: '',
    contract_end_of_term_action: '',
    contract_item_flag: false,
    contract_item_type: '',
    contract_term_months: 0,
    initial_contract_line_status_code: '',
    type: product.type || '',
    sub_type: product.sub_type || '',
    include_children_flag: false,
    allocation_type: '',
    base_product: '',
    subsidiary: product.subsidiary || '',
    available_flag: product.available_flag,
    direct_revenue_posting_flag: false,
    status: 'active',
    approvals: JSON.stringify([]),
    created_at: product.created_at || new Date(),
    updated_at: new Date(),
    created_by: 'sync-script',
    updated_by: 'sync-script'
  }
}

function convertToDisplayFormat(product) {
  return {
    id: product.id,
    sku: product.sku_code,
    name: product.name,
    display_name: product.display_name || product.name,
    short_description: product.description ? product.description.substring(0, 500) : null,
    long_description: product.description,
    brand: product.brand || null,
    specifications: '{}',
    features: '[]',
    stock_status: product.available_flag ? 'in_stock' : 'out_of_stock',
    stock_quantity: 100, // Default stock
    weight: product.weight || null,
    meta_title: product.name,
    meta_description: product.description ? product.description.substring(0, 160) : null,
    status: 'active',
    source_system: 'product-mdm',
    last_sync_at: new Date(),
    sync_version: 1,
    is_active: true,
    created_at: product.created_at || new Date(),
    updated_at: new Date(),
    created_by: 'sync-script',
    updated_by: 'sync-script'
  }
}

async function createSampleActiveProducts() {
  console.log('🔧 Creating sample active products...')
  
  const sampleProducts = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      sku_code: 'PRD-ACTIVE-001',
      name: 'Enterprise Software License',
      display_name: 'Enterprise Software License - Premium',
      description: 'Comprehensive enterprise software license with full feature access',
      class: 'Software',
      brand: 'TechCorp',
      base_price: 999.99,
      available_flag: true,
      status: 'active',
      inactive_flag: false
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      sku_code: 'PRD-ACTIVE-002',
      name: 'Cloud Storage Service',
      display_name: 'Cloud Storage Service - 1TB',
      description: 'Secure cloud storage service with 1TB capacity and advanced features',
      class: 'Service',
      brand: 'CloudTech',
      base_price: 299.99,
      available_flag: true,
      status: 'active',
      inactive_flag: false
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      sku_code: 'PRD-ACTIVE-003',
      name: 'Security Suite',
      display_name: 'Advanced Security Suite',
      description: 'Complete security solution with antivirus, firewall, and monitoring',
      class: 'Security',
      brand: 'SecureFirst',
      base_price: 149.99,
      available_flag: true,
      status: 'active',
      inactive_flag: false
    }
  ]
  
  for (const product of sampleProducts) {
    const insertQuery = `
      INSERT INTO product_mdm.products (
        id, sku_code, name, display_name, description, class, brand, base_price,
        available_flag, status, inactive_flag, created_at, updated_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING
    `
    
    await productMdmDb.query(insertQuery, [
      product.id,
      product.sku_code,
      product.name,
      product.display_name,
      product.description,
      product.class,
      product.brand,
      product.base_price,
      product.available_flag,
      product.status,
      product.inactive_flag,
      new Date(),
      new Date(),
      'sync-script',
      'sync-script'
    ])
  }
  
  console.log(`✅ Created ${sampleProducts.length} sample active products`)
}

// Run the sync
syncActiveProducts().catch(error => {
  console.error('💥 Sync failed:', error)
  process.exit(1)
})