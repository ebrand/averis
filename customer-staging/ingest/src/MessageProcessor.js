import { connect, StringCodec, headers } from 'nats'
import CustomerStagingSyncService from './CustomerStagingSyncService.js'
import CentralMessageLogger from './CentralMessageLogger.js'

class MessageProcessor {
  constructor(socketIOInstance = null) {
    this.natsConnection = null
    this.jetstream = null
    this.consumer = null
    this.subscription = null
    this.consumerName = null // Track the actual consumer name being used
    this.customerStagingSyncService = new CustomerStagingSyncService()
    this.centralLogger = new CentralMessageLogger()
    this.isRunning = false
    this.codec = StringCodec()
    this.io = socketIOInstance // Socket.IO instance for real-time notifications
  }

  async initialize() {
    try {
      // Initialize customer staging sync service
      await this.customerStagingSyncService.initialize()
      
      // Connect to NATS
      await this.connect()
      
      console.log('✅ Customer Staging Message Processor initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Customer Staging Message Processor:', error)
      throw error
    }
  }

  async connect() {
    try {
      const natsHost = process.env.NATS_HOST || 'localhost'
      const natsPort = process.env.NATS_PORT || 4222
      const natsUrl = `nats://${natsHost}:${natsPort}`
      
      console.log(`🔗 Customer Staging: Connecting to NATS at ${natsHost}:${natsPort}`)
      
      this.natsConnection = await connect({
        servers: natsUrl,
        name: 'customer-staging-ingest',
        timeout: 10000,
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnects
        reconnectTimeWait: 2000,
        maxReconnectTimeWait: 30000,
      })
      
      // Get JetStream context
      this.jetstream = this.natsConnection.jetstream()
      
      // Set up stream and consumer for customer staging
      const streamName = process.env.STREAM_NAME || 'CUSTOMER_EVENTS'
      const consumerName = process.env.CONSUMER_NAME || 'customer-staging-consumer'
      
      const jsm = await this.natsConnection.jetstreamManager()
      
      try {
        // Try to get existing stream info
        await jsm.streams.info(streamName)
        console.log(`✅ Customer Staging: Using existing NATS stream: ${streamName}`)
      } catch (error) {
        // Stream doesn't exist, create it
        console.log(`📦 Customer Staging: Creating NATS stream: ${streamName}`)
        await jsm.streams.add({
          name: streamName,
          subjects: ['customer.>'],
          storage: 'file',
          retention: 'workqueue',
          max_age: 86400 * 1000000000, // 24 hours in nanoseconds
          max_msgs: 10000,
          duplicate_window: 300 * 1000000000, // 5 minutes in nanoseconds
        })
      }

      // Try to get or create the customer-staging-consumer
      try {
        this.consumer = await jsm.consumers.info(streamName, consumerName)
        console.log(`✅ Customer Staging: Using existing NATS consumer: ${consumerName}`)
        this.consumerName = consumerName
      } catch (error) {
        // Consumer doesn't exist, create it
        console.log(`📦 Customer Staging: Creating NATS consumer: ${consumerName}`)
        await jsm.consumers.add(streamName, {
          name: consumerName,
          deliver_policy: 'all',
          ack_policy: 'explicit',
          ack_wait: 30 * 1000000000, // 30 seconds in nanoseconds
          max_deliver: 3,
          replay_policy: 'instant',
          filter_subject: 'customer.>',
          durable_name: consumerName
        })
        this.consumer = await jsm.consumers.info(streamName, consumerName)
        this.consumerName = consumerName
      }
      
      console.log('✅ Customer Staging: NATS connection established')
      
    } catch (error) {
      console.error('❌ Customer Staging: NATS connection failed:', error)
      throw error
    }
  }

  async startProcessing() {
    if (this.isRunning) {
      console.log('⚠️ Customer Staging: Message processing is already running')
      return
    }

    try {
      const streamName = process.env.STREAM_NAME || 'CUSTOMER_EVENTS'
      const consumerName = process.env.CONSUMER_NAME || 'customer-staging-consumer'
      
      console.log(`🚀 Customer Staging: Starting message processing with consumer: ${consumerName}`)
      
      // Use modern NATS consumer API
      const consumerNameToUse = this.consumerName || consumerName
      console.log(`🔗 Customer Staging: Creating subscription for consumer: ${consumerNameToUse}`)
      
      this.subscription = await this.jetstream.consumers.get(streamName, consumerNameToUse)
      
      this.isRunning = true
      console.log('✅ Customer Staging: Message processing started successfully')
      console.log(`✅ Customer Staging: Pull subscription created for consumer: ${consumerName}`)
      
      // Start the message processing loop
      this.processMessagesLoop()
      
    } catch (error) {
      console.error('❌ Customer Staging: Failed to start message processing:', error)
      throw error
    }
  }

  async processMessagesLoop() {
    if (!this.subscription) {
      console.error('❌ Customer Staging: No subscription available for message processing')
      return
    }

    console.log('🔄 Customer Staging: Starting message processing loop...')
    
    try {
      while (this.isRunning) {
        try {
          // Fetch messages with timeout
          const messages = await this.subscription.fetch({ max_messages: 1, expires: 5000 })
          
          for await (const msg of messages) {
            if (!this.isRunning) break
            await this.processMessage(msg)
          }
          
        } catch (fetchError) {
          if (fetchError.message?.includes('timeout') || fetchError.message?.includes('Request timeout')) {
            // Timeout is expected when no messages are available
            continue
          }
          
          console.error('❌ Customer Staging: Error fetching messages:', fetchError)
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
    } catch (error) {
      console.error('❌ Customer Staging: Error in message processing loop:', error)
      this.isRunning = false
    }
    
    console.log('🛑 Customer Staging: Message processing loop stopped')
  }

  async processMessage(msg) {
    const startTime = Date.now()
    let messageData = null
    
    try {
      // Decode message
      const messageText = this.codec.decode(msg.data)
      messageData = JSON.parse(messageText)
      
      const subject = msg.subject
      const eventType = subject // e.g., 'customer.created', 'customer.updated', 'customer.deleted'
      
      console.log(`📨 Customer Staging: Processing ${eventType} message for customer ${messageData.customerId}`)
      
      let result = null
      
      // Process based on event type
      switch (eventType) {
        case 'customer.created':
        case 'customer.updated':
          result = await this.customerStagingSyncService.syncCustomer(messageData.customerData)
          break
          
        case 'customer.deleted':
          result = await this.customerStagingSyncService.deleteCustomer(messageData.customerId)
          break
          
        default:
          console.log(`⚠️ Customer Staging: Unknown event type: ${eventType}`)
          msg.ack()
          return
      }
      
      const processingTime = Date.now() - startTime
      
      // Log successful processing
      await this.centralLogger.logConsumed(
        eventType,
        messageData.customerId,
        messageData.customerData?.email,
        messageData.customerData?.status,
        messageData,
        processingTime
      )
      
      // Send real-time notification via Socket.IO
      this.sendRealtimeNotification(eventType, messageData, result, processingTime)
      
      console.log(`✅ Customer Staging: Processed ${eventType} in ${processingTime}ms`)
      
      // Acknowledge message
      msg.ack()
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      console.error(`❌ Customer Staging: Error processing message:`, error)
      
      // Log failed processing
      if (messageData) {
        await this.centralLogger.logFailed(
          msg.subject,
          messageData.customerId,
          messageData.customerData?.email,
          messageData.customerData?.status,
          messageData,
          error.message,
          processingTime
        )
      }
      
      // Negative acknowledge - message will be redelivered
      msg.nak()
    }
  }

  sendRealtimeNotification(eventType, messageData, result, processingTime) {
    try {
      if (!this.io) return
      
      const notification = {
        eventType,
        customerId: messageData.customerId,
        customerEmail: messageData.customerData?.email,
        customerStatus: messageData.customerData?.status,
        action: result?.action,
        timestamp: new Date().toISOString(),
        processingTime,
        subject: eventType,
        source: 'customer-staging'
      }
      
      // Emit to relevant rooms
      this.io.to('customer-mdm').emit('customer-updated', notification)
      this.io.to('dashboard').emit('customer-staging-sync', notification)
      
      console.log(`🔔 Customer Staging: Sent real-time notification for ${eventType}`)
      
    } catch (error) {
      console.error('❌ Customer Staging: Error sending real-time notification:', error)
    }
  }

  async healthCheck() {
    try {
      const dbHealth = await this.customerStagingSyncService.healthCheck()
      
      return {
        status: this.isRunning && dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'CustomerStagingIngest',
        nats: {
          connected: this.natsConnection?.isClosed() === false,
          consumer: this.consumerName
        },
        database: dbHealth.database || { connected: false },
        processing: {
          running: this.isRunning
        }
      }
      
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'CustomerStagingIngest',
        error: error.message
      }
    }
  }

  async shutdown() {
    try {
      console.log('🛑 Customer Staging: Shutting down message processor...')
      
      this.isRunning = false
      
      // Close subscription
      if (this.subscription) {
        await this.subscription.unsubscribe()
        console.log('✅ Customer Staging: Subscription closed')
      }
      
      // Close NATS connection
      if (this.natsConnection) {
        await this.natsConnection.close()
        console.log('✅ Customer Staging: NATS connection closed')
      }
      
      // Close database connection
      await this.customerStagingSyncService.shutdown()
      
      console.log('✅ Customer Staging: Message processor shutdown complete')
      
    } catch (error) {
      console.error('❌ Customer Staging: Error during shutdown:', error)
      throw error
    }
  }
}

export default MessageProcessor