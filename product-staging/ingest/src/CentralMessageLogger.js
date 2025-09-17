/**
 * Central Message Logger for Product Staging Ingest
 * Logs consumed messages to the central averis_system.messages table via System API
 */

class CentralMessageLogger {
  constructor() {
    this.systemApiUrl = process.env.SYSTEM_API_URL || 'http://localhost:6012'
    this.sourceSystem = 'product-staging'
  }

  /**
   * Log a consumed message to the central system
   * @param {string} eventType - The event type (e.g., 'product.launched')
   * @param {Object} productData - The product data from the message
   * @param {string} correlationId - Message correlation ID
   * @param {number} processingTimeMs - Time taken to process the message
   * @param {string} errorMessage - Error message if processing failed
   */
  async logConsumedMessage(eventType, productData, correlationId = null, processingTimeMs = null, errorMessage = null) {
    const startTime = Date.now()
    
    try {
      console.log(`🔄 CENTRAL LOG ATTEMPT: consumed message for ${eventType} - Product ${productData.id}`)
      
      const logEntry = {
        messageType: 'consumed',
        sourceSystem: this.sourceSystem,
        eventType: eventType,
        correlationId: correlationId || `corr-${eventType.replace('.', '-')}-${productData.id}`,
        productId: productData.id,
        productSku: productData.sku,
        productName: productData.name,
        messagePayload: {
          productId: productData.id,
          action: eventType.replace('product.', ''),
          timestamp: new Date().toISOString(),
          productData: {
            id: productData.id,
            sku: productData.sku,
            name: productData.name,
            status: productData.status,
            description: productData.description
          }
        },
        processingTimeMs: processingTimeMs,
        retryCount: 0,
        errorMessage: errorMessage
      }

      const response = await fetch(`${this.systemApiUrl}/products/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ProductStagingIngest/1.0'
        },
        body: JSON.stringify(logEntry)
      })

      if (response.ok) {
        const logTime = Date.now() - startTime
        console.log(`✅ CENTRAL LOG SUCCESS: consumed message for ${eventType} - Product ${productData.id} (${logTime}ms)`)
      } else {
        const responseText = await response.text()
        console.warn(`⚠️ CENTRAL LOG FAILED: consumed message for ${eventType} - Product ${productData.id}. Status: ${response.status}, Response: ${responseText}`)
      }

    } catch (error) {
      const logTime = Date.now() - startTime
      console.error(`❌ CENTRAL LOG ERROR: consumed message for ${eventType} - Product ${productData.id} (${logTime}ms):`, error.message)
      
      // Don't throw - central logging shouldn't break the main message processing flow
    }
  }

  /**
   * Check if the central logging system is healthy
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      const response = await fetch(`${this.systemApiUrl}/health`, {
        method: 'GET',
        timeout: 5000
      })
      return response.ok
    } catch (error) {
      console.warn('Central message logging service health check failed:', error.message)
      return false
    }
  }
}

export default CentralMessageLogger