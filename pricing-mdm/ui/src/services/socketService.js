// Socket.IO service for real-time notifications from Product Staging ingest
// Connects to the Product Staging ingest service to receive product update notifications

import { io } from 'socket.io-client'

const PRODUCT_STAGING_INGEST_URL = import.meta.env.VITE_PRODUCT_STAGING_INGEST_URL || 'http://localhost:9008'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.eventListeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
  }

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket.IO already connected')
      return
    }

    console.log(`🔌 Connecting to Socket.IO at ${PRODUCT_STAGING_INGEST_URL}`)

    this.socket = io(PRODUCT_STAGING_INGEST_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      path: '/socket.io'
    })

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully:', this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Join the pricing-mdm room to receive targeted notifications
      this.socket.emit('join-room', 'pricing-mdm')
      console.log('📡 Joined pricing-mdm room for targeted notifications')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message)
      this.isConnected = false
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚫 Socket.IO max reconnection attempts reached')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`)
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Re-join the pricing-mdm room
      this.socket.emit('join-room', 'pricing-mdm')
    })

    // Setup product event listeners
    this.setupProductEventListeners()
  }

  setupProductEventListeners() {
    if (!this.socket) return

    // Listen for product launches
    this.socket.on('product-launched', (notification) => {
      console.log('🚀 Product launched notification received:', notification)
      this.notifyListeners('product-launched', notification)
    })

    // Listen for general product updates
    this.socket.on('product-updated', (notification) => {
      console.log('🔄 Product updated notification received:', notification)
      this.notifyListeners('product-updated', notification)
    })
  }

  // Subscribe to specific events
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, [])
    }
    this.eventListeners.get(eventName).push(callback)
    console.log(`📡 Subscribed to event: ${eventName}`)
  }

  // Unsubscribe from events
  off(eventName, callback = null) {
    if (!this.eventListeners.has(eventName)) return

    if (callback) {
      const listeners = this.eventListeners.get(eventName)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      // Remove all listeners for this event
      this.eventListeners.delete(eventName)
    }
    console.log(`📡 Unsubscribed from event: ${eventName}`)
  }

  // Notify all listeners of an event
  notifyListeners(eventName, data) {
    if (!this.eventListeners.has(eventName)) return

    const listeners = this.eventListeners.get(eventName)
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`❌ Error in event listener for ${eventName}:`, error)
      }
    })
  }

  // Disconnect from Socket.IO
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO')
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.eventListeners.clear()
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }

  // Get connection info
  getConnectionInfo() {
    return {
      connected: this.isSocketConnected(),
      socketId: this.socket?.id || null,
      url: PRODUCT_STAGING_INGEST_URL,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService