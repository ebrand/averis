import { connect, StringCodec, headers } from 'nats'
import ProductStagingSyncService from './ProductStagingSyncService.js'
import CentralMessageLogger from './CentralMessageLogger.js'

class MessageProcessor {
  constructor(socketIOInstance = null) {
    this.natsConnection = null
    this.jetstream = null
    this.consumer = null
    this.subscription = null
    this.consumerName = null // Track the actual consumer name being used
    this.productStagingSyncService = new ProductStagingSyncService()
    this.centralLogger = new CentralMessageLogger()
    this.isRunning = false
    this.codec = StringCodec()
    this.io = socketIOInstance // Socket.IO instance for real-time notifications
  }

  async initialize() {
    try {
      // Initialize product staging sync service
      await this.productStagingSyncService.initialize()
      
      // Connect to NATS
      await this.connect()
      
      console.log('✅ Product Staging Message Processor initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Product Staging Message Processor:', error)
      throw error
    }
  }

  async connect() {
    try {
      const natsHost = process.env.NATS_HOST || 'localhost'
      const natsPort = process.env.NATS_PORT || 4222
      const natsUrl = `nats://${natsHost}:${natsPort}`
      
      console.log(`🔗 Product Staging: Connecting to NATS at ${natsHost}:${natsPort}`)
      
      this.natsConnection = await connect({
        servers: natsUrl,
        name: 'product-staging-ingest',
        timeout: 10000,
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnects
        reconnectTimeWait: 2000,
        maxReconnectTimeWait: 30000,
      })
      
      // Get JetStream context
      this.jetstream = this.natsConnection.jetstream()
      
      // Set up stream and consumer for product staging
      const streamName = process.env.STREAM_NAME || 'PRODUCT_EVENTS'
      const consumerName = process.env.CONSUMER_NAME || 'product-staging-consumer'
      
      const jsm = await this.natsConnection.jetstreamManager()
      
      try {
        // Try to get existing stream info
        await jsm.streams.info(streamName)
        console.log(`✅ Product Staging: Using existing NATS stream: ${streamName}`)
      } catch (error) {
        // Stream doesn't exist, create it
        console.log(`📦 Product Staging: Creating NATS stream: ${streamName}`)
        await jsm.streams.add({
          name: streamName,
          subjects: ['product.>'],
          storage: 'file',
          retention: 'workqueue',
          max_age: 86400 * 1000000000, // 24 hours in nanoseconds
          max_msgs: 10000,
          duplicate_window: 300 * 1000000000, // 5 minutes in nanoseconds
        })
      }

      // Try to get or create the product-staging-consumer
      try {
        this.consumer = await jsm.consumers.info(streamName, consumerName)
        console.log(`✅ Product Staging: Using existing consumer: ${consumerName}`)
        console.log(`🔍 Consumer config - Filter: ${this.consumer.config.filter_subject || 'none'}, Policy: ${this.consumer.config.deliver_policy}`)
      } catch (error) {
        // Consumer doesn't exist, create it
        console.log(`📦 Product Staging: Creating consumer: ${consumerName}`)
        try {
          await jsm.consumers.add(streamName, {
            name: consumerName,
            deliver_policy: 'all',
            ack_policy: 'explicit',
            ack_wait: 30 * 1000000000, // 30 seconds in nanoseconds
            max_deliver: 3,
            replay_policy: 'instant',
            filter_subject: 'product.>',
            durable_name: consumerName
          })
          this.consumer = await jsm.consumers.info(streamName, consumerName)
          console.log(`✅ Product Staging: Created and using consumer: ${consumerName}`)
        } catch (createError) {
          console.log('⚠️ Product Staging: Failed to create consumer, checking existing consumers...')
          const consumers = await jsm.consumers.list(streamName)
          for await (const consumer of consumers) {
            console.log(`🔄 Product Staging: Found consumer: ${consumer.name}, filter: ${consumer.config.filter_subject || 'none'}`)
            this.consumer = consumer
            this.consumerName = consumer.name
            break
          }
          if (!this.consumer) {
            throw new Error('No available consumer found and failed to create new consumer')
          }
        }
      }
      
      console.log(`✅ Product Staging: Connected to NATS JetStream, consumer: ${consumerName}`)
      
    } catch (error) {
      console.error('❌ Product Staging: Failed to connect to NATS:', error)
      throw error
    }
  }

  async startProcessing() {
    if (this.isRunning) {
      console.log('⚠️ Product Staging: Message processing is already running')
      return
    }

    try {
      const streamName = process.env.STREAM_NAME || 'PRODUCT_EVENTS'
      const consumerName = process.env.CONSUMER_NAME || 'product-staging-consumer'
      
      console.log(`🚀 Product Staging: Starting message processing with consumer: ${consumerName}`)
      
      // Use modern NATS consumer API (not deprecated pullSubscribe)
      const consumerNameToUse = this.consumerName || consumerName
      console.log(`🔗 Product Staging: Creating subscription for consumer: ${consumerNameToUse}`)
      
      this.subscription = await this.jetstream.consumers.get(streamName, consumerNameToUse)
      
      this.isRunning = true
      console.log('✅ Product Staging: Message processing started successfully')
      console.log(`✅ Product Staging: Pull subscription created for consumer: ${consumerName}`)
      
      // Start the message processing loop
      this.processMessagesLoop()
      
    } catch (error) {
      console.error('❌ Product Staging: Failed to start message processing:', error)
      throw error
    }
  }

  async processMessagesLoop() {
    if (!this.subscription) {
      console.error('❌ Product Staging: No subscription available for message processing')
      return
    }

    console.log('🔄 Product Staging: Starting message processing loop...')
    
    // Use modern consumer consume() method instead of deprecated approaches
    while (this.isRunning) {
      try {
        // Consume messages using the modern API
        const messages = await this.subscription.consume({
          max_messages: 1,
          max_waiting: 5000, // 5 second timeout
        })
        
        for await (const message of messages) {
          if (!this.isRunning) {
            console.log('🛑 Product Staging: Stopping message processing loop')
            return
          }
          
          await this.handleMessage(message)
        }
      } catch (error) {
        if (this.isRunning) {
          // Check if it's just a timeout (no messages available)
          if (error.message.includes('timeout') || error.message.includes('no messages')) {
            // Normal timeout, continue loop
            continue
          }
          
          console.error('❌ Product Staging: Error in message processing loop:', error)
          // Wait before retrying on actual errors
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }
    
    console.log('🛑 Product Staging: Message processing loop stopped')
  }

  async handleMessage(message) {
    const subject = message.subject
    const processingStartTime = Date.now()
    let messageContent = null
    
    try {
      messageContent = JSON.parse(this.codec.decode(message.data))
      
      console.log(`📥 Product Staging: Received message - Type: ${messageContent.eventType}, Subject: ${subject}`)
      console.log(`   Product: ${messageContent.name} (${messageContent.sku}) - Status: ${messageContent.status}`)
      
      // Check if this is a redelivery
      const deliveryCount = message.info?.redeliveryCount || 0
      
      // Always log consumed message to central system for this consumer instance
      // Note: NATS redeliveryCount may be > 0 due to previous consumer instances or failures
      try {
        this.centralLogger.logConsumedMessage(
          messageContent.eventType || subject,
          messageContent,
          messageContent.messageId || message.headers?.get('Nats-Msg-Id'),
          null, // Processing time not available yet
          null  // No error at this point
        ).catch(logError => {
          console.warn('Central logging failed (non-blocking):', logError.message)
        })
        console.log(`📝 Logged consumed message to central system (delivery count: ${deliveryCount})`)
      } catch (logError) {
        console.warn('Central logging failed (non-blocking):', logError.message)
      }
      
      // Process the message for Product Staging synchronization
      await this.productStagingSyncService.processMessage(messageContent, subject, 'nats-consumer')
      
      // Calculate processing time
      const processingTime = Date.now() - processingStartTime
      
      // Emit Socket.IO event for real-time UI notifications
      this.emitProductUpdateNotification(messageContent, subject, processingTime)
      
      // Acknowledge the message
      message.ack()
      console.log(`✅ Product Staging: Message processed and acknowledged (${processingTime}ms)`)
      
    } catch (error) {
      console.error(`❌ Product Staging: Error processing message:`, error)
      console.error(`   Message content: ${this.codec.decode(message.data)}`)
      
      const deliveryCount = message.info?.redeliveryCount || 0
      const maxDeliveries = 3
      
      if (deliveryCount < maxDeliveries - 1) {
        // Negative acknowledgment - will be redelivered
        console.log(`🔄 Product Staging: Message will be redelivered (attempt ${deliveryCount + 2}/${maxDeliveries})`)
        message.nak()
      } else {
        console.error(`💀 Product Staging: Message failed after ${maxDeliveries} attempts, terminating`)
        
        // Send to dead letter or log for manual intervention
        await this.handleFailedMessage(messageContent || { raw: this.codec.decode(message.data) }, error)
        message.term() // Terminal reject - won't be redelivered
      }
    }
  }

  async handleFailedMessage(messageContent, error) {
    try {
      // Log failed message for manual review
      console.error('💀 Product Staging: FAILED MESSAGE DETAILS:', {
        messageId: messageContent.messageId || 'unknown',
        eventType: messageContent.eventType,
        productId: messageContent.productId,
        sku: messageContent.sku,
        error: error.message,
        timestamp: new Date().toISOString(),
        messageContent: JSON.stringify(messageContent)
      })
      
      // Could also save to database for admin review
      // await this.saveFailedMessage(messageContent, error)
      
    } catch (logError) {
      console.error('❌ Product Staging: Failed to log failed message:', logError)
    }
  }

  async healthCheck() {
    try {
      const syncServiceHealth = await this.productStagingSyncService.healthCheck()
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ProductStagingMessageProcessor',
        nats: {
          connected: this.natsConnection && !this.natsConnection.isClosed(),
          jetstream: !!this.jetstream,
          subscription: !!this.subscription,
          consumer: this.consumer ? this.consumer.name : null
        },
        processing: {
          isRunning: this.isRunning
        },
        productCacheSync: syncServiceHealth
      }
      
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'ProductStagingMessageProcessor',
        error: error.message
      }
    }
  }

  emitProductUpdateNotification(messageContent, subject, processingTime) {
    if (!this.io) {
      console.log('🔌 No Socket.IO instance available for notifications')
      return
    }

    try {
      const eventType = messageContent.eventType || 'product.update'
      const notification = {
        eventType,
        productId: messageContent.productId || messageContent.id,
        sku: messageContent.sku || messageContent.skuCode,
        name: messageContent.name,
        status: messageContent.status,
        timestamp: new Date().toISOString(),
        processingTime,
        subject,
        source: 'product-staging-ingest'
      }

      // Emit to specific rooms based on the type of update
      if (eventType.includes('launched') || eventType.includes('activated')) {
        // Notify all consumer systems about product launches
        this.io.to('pricing-mdm').emit('product-launched', notification)
        this.io.to('ecommerce').emit('product-launched', notification)
        this.io.to('inventory-mdm').emit('product-launched', notification)
        console.log(`🔔 Emitted product-launched notification for: ${notification.name}`)
      }
      
      // Always emit general product update
      this.io.to('pricing-mdm').emit('product-updated', notification)
      this.io.to('ecommerce').emit('product-updated', notification)
      this.io.to('inventory-mdm').emit('product-updated', notification)
      
      console.log(`🔔 Emitted product-updated notification for: ${notification.name} (${notification.sku})`)
      
    } catch (error) {
      console.error('❌ Error emitting Socket.IO notification:', error)
    }
  }

  async shutdown() {
    console.log('🛑 Product Staging: Shutting down message processor...')
    
    this.isRunning = false
    
    try {
      if (this.subscription) {
        // Modern consumer API doesn't need explicit drain
        this.subscription = null
      }
      
      if (this.natsConnection) {
        await this.natsConnection.close()
        this.natsConnection = null
        this.jetstream = null
      }
      
      await this.productStagingSyncService.shutdown()
      
      console.log('✅ Product Staging: Message processor shut down successfully')
      
    } catch (error) {
      console.error('❌ Product Staging: Error during shutdown:', error)
    }
  }
}

export default MessageProcessor