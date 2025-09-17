#!/usr/bin/env node

/**
 * Simple script to sync only active products from product-mdm to downstream systems
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
  console.log('🚀 Starting simple sync of active products...')
  
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
      console.log('⚠️  No active products found. Please create some active products first.')
      return
    }
    
    // 2. Sync to pricing-mdm (copy all fields for now)
    console.log('💰 Syncing to pricing-mdm...')
    let pricingSyncCount = 0
    
    for (const product of activeProducts) {
      try {
        const insertQuery = `
          INSERT INTO pricing_mdm.products (
            id, sku_code, inactive_flag, name, display_name, description,
            license_description, change_code, class, revenue_category, upgrade_type,
            categorization, license_count, seat_based_pricing_flag, seat_adjustment_flag,
            seat_min_price_break_level, seat_max_price_break_level, license_key_type,
            app_id, app_key, license_required_flag, renewal_required_flag,
            portal_renewal_flag, grouped_license_flag, additional_license_flag,
            additional_licenses_to_provision, term_license_flag, web_display_flag,
            sales_quotable_flag, channel_quotable_flag, web_quotable_flag,
            team_approval_needed_flag, base_price, pricing, ava_tax_code,
            tax_schedule, income_account, deferred_revenue_account, maintenance_item,
            renewal_item, item_revenue_category, rev_rec_rule, rev_rec_forecast_rule,
            rev_allocation_group, exclude_from_autoprocess_flag, can_be_fulfilled_flag,
            create_revenue_plans_on, contract_billing_frequency, contract_end_of_term_action,
            contract_item_flag, contract_item_type, contract_term_months,
            initial_contract_line_status_code, type, sub_type, include_children_flag,
            allocation_type, base_product, subsidiary, available_flag,
            direct_revenue_posting_flag, approvals, created_at, updated_at,
            created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
            $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
            $57, $58, $59, $60, $61, $62, $63
          )
          ON CONFLICT (id) DO UPDATE SET
            sku_code = EXCLUDED.sku_code,
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            class = EXCLUDED.class,
            base_price = EXCLUDED.base_price,
            available_flag = EXCLUDED.available_flag,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = 'sync-script'
        `
        
        await pricingMdmDb.query(insertQuery, [
          product.id, product.sku_code, product.inactive_flag, product.name, product.display_name,
          product.description, product.license_description || '', product.change_code || '',
          product.class, product.revenue_category || '', product.upgrade_type || '',
          product.categorization, product.license_count, product.seat_based_pricing_flag,
          product.seat_adjustment_flag, product.seat_min_price_break_level || '',
          product.seat_max_price_break_level || '', product.license_key_type || '',
          product.app_id, product.app_key, product.license_required_flag,
          product.renewal_required_flag, product.portal_renewal_flag, product.grouped_license_flag,
          product.additional_license_flag, product.additional_licenses_to_provision || '',
          product.term_license_flag, product.web_display_flag, product.sales_quotable_flag,
          product.channel_quotable_flag, product.web_quotable_flag, product.team_approval_needed_flag,
          product.base_price, product.pricing, product.ava_tax_code || '', product.tax_schedule || '',
          product.income_account || '', product.deferred_revenue_account || '',
          product.maintenance_item || '', product.renewal_item || '', product.item_revenue_category || '',
          product.rev_rec_rule || '', product.rev_rec_forecast_rule || '', product.rev_allocation_group || '',
          product.exclude_from_autoprocess_flag, product.can_be_fulfilled_flag,
          product.create_revenue_plans_on || '', product.contract_billing_frequency || '',
          product.contract_end_of_term_action || '', product.contract_item_flag,
          product.contract_item_type || '', product.contract_term_months,
          product.initial_contract_line_status_code || '', product.type, product.sub_type,
          product.include_children_flag, product.allocation_type || '', product.base_product || '',
          product.subsidiary, product.available_flag, product.direct_revenue_posting_flag,
          product.approvals, product.created_at, product.updated_at, product.created_by, product.updated_by
        ])
        
        pricingSyncCount++
      } catch (error) {
        console.error(`❌ Error syncing product ${product.id} to pricing-mdm:`, error.message)
      }
    }
    
    console.log(`✅ Synced ${pricingSyncCount} products to pricing-mdm`)
    
    // 3. Sync to ecommerce with simpler approach
    console.log('🛍️  Syncing to ecommerce...')
    let ecommerceSyncCount = 0
    
    for (const product of activeProducts) {
      try {
        const insertQuery = `
          INSERT INTO ecommerce.products (
            id, sku, name, display_name, short_description, long_description,
            brand, stock_status, stock_quantity, weight, meta_title, meta_description,
            status, source_system, last_sync_at, sync_version, is_active,
            created_at, updated_at, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          ON CONFLICT (id) DO UPDATE SET
            sku = EXCLUDED.sku,
            name = EXCLUDED.name,
            display_name = EXCLUDED.display_name,
            short_description = EXCLUDED.short_description,
            long_description = EXCLUDED.long_description,
            brand = EXCLUDED.brand,
            stock_status = EXCLUDED.stock_status,
            weight = EXCLUDED.weight,
            status = EXCLUDED.status,
            last_sync_at = EXCLUDED.last_sync_at,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        `
        
        await ecommerceDb.query(insertQuery, [
          product.id,
          product.sku_code,
          product.name,
          product.display_name || product.name,
          product.description ? product.description.substring(0, 500) : null,
          product.description,
          product.brand || null,
          product.available_flag ? 'in_stock' : 'out_of_stock',
          100, // Default stock quantity
          null, // weight
          product.name, // meta_title
          product.description ? product.description.substring(0, 160) : null, // meta_description
          'active',
          'product-mdm',
          new Date(),
          1,
          true,
          product.created_at || new Date(),
          new Date(),
          'sync-script',
          'sync-script'
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

// Run the sync
syncActiveProducts().catch(error => {
  console.error('💥 Sync failed:', error)
  process.exit(1)
})