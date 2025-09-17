import pkg from 'pg'
const { Client } = pkg

class CustomerStagingSyncService {
  constructor() {
    this.db = null
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'commerce_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      schema: process.env.DB_SCHEMA || 'averis_customer_staging'
    }
  }

  async initialize() {
    try {
      console.log('🔗 Customer Staging: Connecting to database...')
      console.log(`   Database: ${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`)
      console.log(`   Schema: ${this.dbConfig.schema}`)
      
      this.db = new Client(this.dbConfig)
      await this.db.connect()
      
      // Test connection and schema
      const result = await this.db.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = $1 AND table_name = 'customers'`,
        [this.dbConfig.schema]
      )
      
      if (result.rows[0].count === '0') {
        throw new Error(`Customer staging table not found in schema ${this.dbConfig.schema}`)
      }
      
      console.log('✅ Customer Staging: Database connection established')
      
    } catch (error) {
      console.error('❌ Customer Staging: Database connection failed:', error)
      throw error
    }
  }

  async syncCustomer(customerData) {
    try {
      // Extract data - handle both camelCase (from .NET) and snake_case formats
      const {
        id,
        disclosureLevel, disclosure_level = disclosureLevel,
        visitorFlag, visitor_flag = visitorFlag,
        visitorCookie, visitor_cookie = visitorCookie,
        sessionData, session_data = sessionData,
        firstName, first_name = firstName,
        lastName, last_name = lastName,
        email,
        phone,
        stytchUserId, stytch_user_id = stytchUserId,
        emailVerified, email_verified = emailVerified,
        billingAddress, billing_address = billingAddress,
        shippingAddresses, shipping_addresses = shippingAddresses,
        customerSegment, customer_segment = customerSegment,
        lifetimeValue, lifetime_value = lifetimeValue,
        acquisitionChannel, acquisition_channel = acquisitionChannel,
        marketingConsent, marketing_consent = marketingConsent,
        dataProcessingConsent, data_processing_consent = dataProcessingConsent,
        consentDate, consent_date = consentDate,
        status,
        firstPurchaseDate, first_purchase_date = firstPurchaseDate,
        lastActivity, last_activity = lastActivity,
        createdAt, created_at = createdAt,
        updatedAt, updated_at = updatedAt
      } = customerData

      // Check if customer exists in staging
      const existsQuery = `
        SELECT id FROM ${this.dbConfig.schema}.customers WHERE id = $1
      `
      const existsResult = await this.db.query(existsQuery, [id])

      if (existsResult.rows.length > 0) {
        // Update existing customer
        const updateQuery = `
          UPDATE ${this.dbConfig.schema}.customers SET
            disclosure_level = $2,
            visitor_flag = $3,
            visitor_cookie = $4,
            session_data = $5,
            first_name = $6,
            last_name = $7,
            email = $8,
            phone = $9,
            stytch_user_id = $10,
            email_verified = $11,
            billing_address = $12,
            shipping_addresses = $13,
            customer_segment = $14,
            lifetime_value = $15,
            acquisition_channel = $16,
            marketing_consent = $17,
            data_processing_consent = $18,
            consent_date = $19,
            status = $20,
            first_purchase_date = $21,
            last_activity = $22,
            created_at = $23,
            updated_at = $24
          WHERE id = $1
          RETURNING id, email, status
        `
        
        const updateResult = await this.db.query(updateQuery, [
          id, disclosure_level, visitor_flag, visitor_cookie, 
          JSON.stringify(session_data), first_name, last_name, email, phone,
          stytch_user_id, email_verified, JSON.stringify(billing_address),
          JSON.stringify(shipping_addresses), customer_segment, lifetime_value,
          acquisition_channel, marketing_consent, data_processing_consent, 
          consent_date, status, first_purchase_date, last_activity, 
          created_at, updated_at
        ])
        
        console.log(`✅ Customer Staging: Updated customer ${updateResult.rows[0].email} (${updateResult.rows[0].id})`)
        return { action: 'updated', customer: updateResult.rows[0] }
        
      } else {
        // Insert new customer
        const insertQuery = `
          INSERT INTO ${this.dbConfig.schema}.customers (
            id, disclosure_level, visitor_flag, visitor_cookie, session_data,
            first_name, last_name, email, phone, stytch_user_id, email_verified,
            billing_address, shipping_addresses, customer_segment, lifetime_value,
            acquisition_channel, marketing_consent, data_processing_consent,
            consent_date, status, first_purchase_date, last_activity, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24
          )
          RETURNING id, email, status
        `
        
        const insertResult = await this.db.query(insertQuery, [
          id, disclosure_level, visitor_flag, visitor_cookie,
          JSON.stringify(session_data), first_name, last_name, email, phone,
          stytch_user_id, email_verified, JSON.stringify(billing_address),
          JSON.stringify(shipping_addresses), customer_segment, lifetime_value,
          acquisition_channel, marketing_consent, data_processing_consent,
          consent_date, status, first_purchase_date, last_activity,
          created_at, updated_at
        ])
        
        console.log(`✅ Customer Staging: Created customer ${insertResult.rows[0].email} (${insertResult.rows[0].id})`)
        return { action: 'created', customer: insertResult.rows[0] }
      }
      
    } catch (error) {
      console.error('❌ Customer Staging: Failed to sync customer:', error)
      throw error
    }
  }

  async deleteCustomer(customerId) {
    try {
      const deleteQuery = `
        DELETE FROM ${this.dbConfig.schema}.customers WHERE id = $1
        RETURNING id, email
      `
      
      const result = await this.db.query(deleteQuery, [customerId])
      
      if (result.rows.length > 0) {
        console.log(`✅ Customer Staging: Deleted customer ${result.rows[0].email} (${result.rows[0].id})`)
        return { action: 'deleted', customer: result.rows[0] }
      } else {
        console.log(`⚠️ Customer Staging: Customer ${customerId} not found for deletion`)
        return { action: 'not_found', customerId }
      }
      
    } catch (error) {
      console.error('❌ Customer Staging: Failed to delete customer:', error)
      throw error
    }
  }

  async getCustomerCount() {
    try {
      const result = await this.db.query(
        `SELECT COUNT(*) as count FROM ${this.dbConfig.schema}.customers`
      )
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error('❌ Customer Staging: Failed to get customer count:', error)
      return 0
    }
  }

  async healthCheck() {
    try {
      if (!this.db) {
        return { status: 'unhealthy', reason: 'Database not connected' }
      }

      // Test database connectivity
      await this.db.query('SELECT 1')
      
      // Get basic stats
      const customerCount = await this.getCustomerCount()
      
      return {
        status: 'healthy',
        database: {
          connected: true,
          schema: this.dbConfig.schema,
          customerCount
        },
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async shutdown() {
    try {
      if (this.db) {
        await this.db.end()
        console.log('✅ Customer Staging: Database connection closed')
      }
    } catch (error) {
      console.error('❌ Customer Staging: Error closing database connection:', error)
    }
  }
}

export default CustomerStagingSyncService