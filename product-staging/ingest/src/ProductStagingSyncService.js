import { Client } from 'pg'

class ProductStagingSyncService {
  constructor() {
    this.dbClient = null
    this.isInitialized = false
  }

  async initialize() {
    try {
      // Initialize database connection
      await this.connectToDatabase()
      
      console.log('✅ Product Staging Sync Service initialized successfully')
      this.isInitialized = true
      
    } catch (error) {
      console.error('❌ Failed to initialize Product Staging Sync Service:', error)
      throw error
    }
  }

  async connectToDatabase() {
    try {
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'commerce_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
      
      console.log(`🔗 Product Staging: Connecting to database at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
      
      this.dbClient = new Client(dbConfig)
      await this.dbClient.connect()
      
      console.log(`✅ Product Staging: Connected to database successfully`)
      
    } catch (error) {
      console.error('❌ Product Staging: Failed to connect to database:', error)
      throw error
    }
  }

  async processMessage(messageContent, routingKey, queueName) {
    try {
      const { eventType, productId, data } = messageContent
      
      console.log(`🔄 Product Staging: Processing ${eventType} for product ${productId}`)
      
      switch (eventType) {
        case 'created':
          await this.handleProductCreated(data)
          break
        case 'updated':
          await this.handleProductUpdated(data)
          break
        case 'launched':
          await this.handleProductLaunched(data)
          break
        case 'deactivated':
          await this.handleProductDeactivated(data)
          break
        case 'deleted':
          await this.handleProductDeleted(data)
          break
        default:
          console.log(`⏭️ Product Staging: Skipping unsupported event type: ${eventType}`)
      }
      
      console.log(`✅ Product Staging: Successfully processed ${eventType} for product ${productId}`)
      
    } catch (error) {
      console.error(`❌ Product Staging: Failed to process message:`, error)
      console.error(`   Event Type: ${messageContent.eventType}`)
      console.error(`   Product ID: ${messageContent.productId}`)
      throw error
    }
  }

  async handleProductCreated(productData) {
    // Only sync to staging if the product is active
    if (productData.status === 'active') {
      console.log(`   Product ${productData.sku} is active - syncing to staging`)
      await this.upsertProductToCache(productData)
    } else {
      console.log(`   Product ${productData.sku} is ${productData.status} - not adding to cache`)
    }
  }

  async handleProductUpdated(productData) {
    if (productData.status === 'active') {
      console.log(`   Product ${productData.sku} is active - upserting to staging`)
      await this.upsertProductToCache(productData)
    } else {
      console.log(`   Product ${productData.sku} is ${productData.status} - removing from staging if present`)
      await this.removeProductFromCache(productData.id)
    }
  }

  async handleProductLaunched(productData) {
    console.log(`   Product ${productData.sku} was launched - adding to staging`)
    await this.upsertProductToCache(productData)
  }

  async handleProductDeactivated(productData) {
    console.log(`   Product ${productData.sku} was deactivated - removing from staging`)
    await this.removeProductFromCache(productData.id)
  }

  async handleProductDeleted(productData) {
    console.log(`   Product ${productData.sku} was deleted - removing from staging`)
    await this.removeProductFromCache(productData.id)
  }

  async upsertProductToCache(productData) {
    try {
      const query = `
        INSERT INTO averis_product_staging.products (
          id, sku, name, description, long_description, type, status, slug, ava_tax_code,
          base_price, cost_price, available_flag, web_display_flag, license_required_flag,
          seat_based_pricing_flag, can_be_fulfilled_flag, contract_item_flag,
          categorization, pricing, approvals, created_at, updated_at, created_by, updated_by,
          synced_at, source_version
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP, $25
        )
        ON CONFLICT (id) DO UPDATE SET
          sku = EXCLUDED.sku,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          long_description = EXCLUDED.long_description,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          slug = EXCLUDED.slug,
          ava_tax_code = EXCLUDED.ava_tax_code,
          base_price = EXCLUDED.base_price,
          cost_price = EXCLUDED.cost_price,
          available_flag = EXCLUDED.available_flag,
          web_display_flag = EXCLUDED.web_display_flag,
          license_required_flag = EXCLUDED.license_required_flag,
          seat_based_pricing_flag = EXCLUDED.seat_based_pricing_flag,
          can_be_fulfilled_flag = EXCLUDED.can_be_fulfilled_flag,
          contract_item_flag = EXCLUDED.contract_item_flag,
          categorization = EXCLUDED.categorization,
          pricing = EXCLUDED.pricing,
          approvals = EXCLUDED.approvals,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by,
          synced_at = CURRENT_TIMESTAMP,
          source_version = EXCLUDED.source_version
      `
      
      const values = [
        productData.id,
        productData.sku,
        productData.name,
        productData.description || null,
        productData.longDescription || '',
        productData.type || 'Unknown',
        productData.status,
        productData.slug || '',
        productData.avaTaxCode || '',
        productData.basePrice || 0,
        productData.costPrice || 0,
        productData.availableFlag !== undefined ? productData.availableFlag : true,
        productData.webDisplayFlag || false,
        productData.licenseRequiredFlag || false,
        productData.seatBasedPricingFlag || false,
        productData.canBeFulfilledFlag || false,
        productData.contractItemFlag || false,
        JSON.stringify(productData.categorization || []),
        JSON.stringify(productData.pricing || []),
        JSON.stringify(productData.approvals || []),
        productData.createdAt,
        productData.updatedAt,
        productData.createdBy || 'system',
        productData.updatedBy || 'system',
        productData.sourceVersion || '1.0'
      ]
      
      await this.dbClient.query(query, values)
      
      console.log(`✅ Product Staging: Upserted product ${productData.sku} (${productData.id}) to cache`)
      
    } catch (error) {
      console.error(`❌ Product Staging: Failed to upsert product ${productData.sku}:`, error)
      throw error
    }
  }

  async removeProductFromCache(productId) {
    try {
      const query = 'DELETE FROM averis_product_staging.products WHERE id = $1'
      const result = await this.dbClient.query(query, [productId])
      
      if (result.rowCount > 0) {
        console.log(`✅ Product Staging: Removed product ${productId} from cache`)
      } else {
        console.log(`ℹ️  Product Staging: Product ${productId} was not in cache`)
      }
      
    } catch (error) {
      console.error(`❌ Product Staging: Failed to remove product ${productId}:`, error)
      throw error
    }
  }

  async healthCheck() {
    try {
      if (!this.isInitialized || !this.dbClient) {
        return {
          status: 'error',
          message: 'Service not initialized',
          database: { connected: false }
        }
      }
      
      // Test database connection with a simple query
      await this.dbClient.query('SELECT 1')
      
      // Get product count in staging
      const countResult = await this.dbClient.query(
        'SELECT COUNT(*) as count FROM averis_product_staging.products'
      )
      const productCount = parseInt(countResult.rows[0].count)
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ProductStagingSyncService',
        database: {
          connected: true,
          productsInCache: productCount
        }
      }
      
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'ProductStagingSyncService',
        database: { connected: false },
        error: error.message
      }
    }
  }

  async shutdown() {
    try {
      if (this.dbClient) {
        await this.dbClient.end()
        console.log('✅ Product Staging: Database connection closed')
      }
    } catch (error) {
      console.error('❌ Product Staging: Error closing database connection:', error)
    }
  }
}

export default ProductStagingSyncService