#!/usr/bin/env node

import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import MessageProcessor from './MessageProcessor.js'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const port = process.env.PORT || 9008  // Customer staging ingest port
const websocketPort = process.env.WEBSOCKET_PORT || (parseInt(port) + 1000) // Default to port + 1000

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3007",  // Customer MDM UI (original)
      "http://localhost:3010",  // Customer MDM UI (current)
      "http://localhost:3004",  // E-commerce UI
      "http://localhost:3012"   // Commerce Dashboard UI
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling']
})

// Security and CORS middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", "ws:", "wss:"]
    }
  }
}))
app.use(cors())
app.use(express.json())

// Initialize message processor with socket.io reference
const messageProcessor = new MessageProcessor(io)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await messageProcessor.healthCheck()
    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'CustomerStagingIngest',
      error: error.message
    })
  }
})

// System info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'Customer Staging Ingest',
    version: '1.0.0',
    description: 'Processes customer updates from Customer MDM to keep Customer Staging in sync',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      info: '/info'
    },
    database: {
      schema: process.env.DB_SCHEMA || 'averis_customer_staging',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432
    }
  })
})

// Test endpoint to manually trigger socket notifications (for debugging)
app.post('/test-socket', (req, res) => {
  const testNotification = {
    eventType: 'customer.test',
    customerId: 'test-123',
    customerEmail: 'test@example.com',
    customerStatus: 'active',
    timestamp: new Date().toISOString(),
    processingTime: 42,
    subject: 'customer.test',
    source: 'manual-test'
  }

  try {
    console.log('🧪 Manual socket test triggered')
    
    if (messageProcessor.io) {
      // Emit test notifications
      messageProcessor.io.to('customer-mdm').emit('customer-updated', testNotification)
      messageProcessor.io.to('dashboard').emit('customer-staging-sync', testNotification)
      
      console.log('🔔 Test socket events emitted to customer-mdm and dashboard rooms')
      
      res.json({
        success: true,
        message: 'Test socket events emitted',
        notification: testNotification,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(500).json({
        success: false,
        error: 'Socket.IO not available',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('❌ Error in socket test:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Customer Staging Ingest Server Error:', error)
  res.status(500).json({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  })
})

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Customer Staging Ingest...')
    console.log('🔧 Configuration:')
    console.log(`   - HTTP Port: ${port}`)
    console.log(`   - WebSocket Port: ${websocketPort} (embedded in HTTP server)`)
    console.log(`   - Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
    console.log(`   - Schema: ${process.env.DB_SCHEMA}`)
    console.log(`   - NATS: ${process.env.NATS_HOST || 'localhost'}:${process.env.NATS_PORT || 4222}`)
    console.log(`   - Stream: ${process.env.STREAM_NAME || 'CUSTOMER_EVENTS'}`)
    console.log(`   - Consumer: ${process.env.CONSUMER_NAME || 'customer-staging-consumer'}`)
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`)
    
    // Initialize message processor (connects to DB, NATS)
    await messageProcessor.initialize()
    
    // Setup Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('🔌 Client connected to Socket.IO:', socket.id)
      
      socket.on('join-room', (room) => {
        socket.join(room)
        console.log(`📡 Socket ${socket.id} joined room: ${room}`)
      })
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected from Socket.IO:', socket.id)
      })
    })
    
    // Start HTTP server (includes Socket.IO)
    server.listen(port, () => {
      console.log(`✅ Customer Staging Ingest listening on port ${port}`)
      console.log(`🔗 Health check available at http://localhost:${port}/health`)
      console.log(`ℹ️  Service info available at http://localhost:${port}/info`)
      console.log(`🔌 Socket.IO server ready at http://localhost:${port}/socket.io`)
    })
    
    // Start message processing
    await messageProcessor.startProcessing()
    
    console.log('🎉 Customer Staging Ingest started successfully!')
    console.log('🔄 Ready to sync customer updates to Customer Staging...')
    
  } catch (error) {
    console.error('💥 Failed to start Customer Staging Ingest:', error)
    process.exit(1)
  }
}

// Graceful shutdown handling
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n📡 Customer Staging: Received ${signal}, starting graceful shutdown...`)
    
    try {
      // Stop message processing
      await messageProcessor.shutdown()
      
      console.log('✅ Customer Staging: Graceful shutdown completed')
      process.exit(0)
      
    } catch (error) {
      console.error('❌ Customer Staging: Error during shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Customer Staging: Uncaught Exception:', error)
    shutdown('uncaughtException')
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Customer Staging: Unhandled Rejection at:', promise, 'reason:', reason)
    shutdown('unhandledRejection')
  })
}

// Setup graceful shutdown
setupGracefulShutdown()

// Start the server
startServer().catch(error => {
  console.error('💥 Fatal error starting server:', error)
  process.exit(1)
})