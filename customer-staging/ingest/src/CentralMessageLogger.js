import fetch from 'node-fetch'

class CentralMessageLogger {
  constructor() {
    this.systemApiUrl = process.env.SYSTEM_API_URL || 'http://localhost:6012'
  }

  async logMessage(messageType, eventType, customerId, customerEmail, customerStatus, messagePayload, processingTimeMs = 0, errorMessage = null) {
    try {
      const logData = {
        messageType: messageType, // 'consumed', 'published', 'failed'
        eventType: eventType, // 'customer.created', 'customer.updated', 'customer.deleted'
        productId: null, // Not applicable for customer messages
        productName: null,
        productSku: null,
        customerId: customerId,
        customerEmail: customerEmail || null,
        customerStatus: customerStatus || null,
        sourceSystem: 'customer-staging',
        messagePayload: JSON.stringify(messagePayload),
        processingTimeMs: processingTimeMs,
        errorMessage: errorMessage,
        correlationId: messagePayload.correlationId || `corr-${eventType.replace('customer.', '')}-${customerId || 'unknown'}`
      }

      const response = await fetch(`${this.systemApiUrl}/products/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData),
        timeout: 5000
      })

      if (response.ok) {
        console.log(`📊 Customer Staging: Logged ${messageType} ${eventType} for customer ${customerId}`)
        return await response.json()
      } else {
        console.warn(`⚠️ Customer Staging: Failed to log message to System API: ${response.status}`)
        return null
      }

    } catch (error) {
      // Don't throw - message logging is not critical to the sync operation
      console.warn('⚠️ Customer Staging: Error logging message to System API:', error.message)
      return null
    }
  }

  async logConsumed(eventType, customerId, customerEmail, customerStatus, messagePayload, processingTimeMs = 0) {
    return await this.logMessage('consumed', eventType, customerId, customerEmail, customerStatus, messagePayload, processingTimeMs)
  }

  async logFailed(eventType, customerId, customerEmail, customerStatus, messagePayload, errorMessage, processingTimeMs = 0) {
    return await this.logMessage('failed', eventType, customerId, customerEmail, customerStatus, messagePayload, processingTimeMs, errorMessage)
  }
}

export default CentralMessageLogger