import * as signalR from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 5000
    this.messageCallbacks = []
    this.connectionCallbacks = []
  }

  async connect() {
    try {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        console.log('SignalR already connected')
        return
      }

      console.log('🔌 Connecting to SignalR hub...')

      // Create connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:6012/messageLogHub', {
          withCredentials: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build()

      // Set up event handlers
      this.connection.on('MessageCreated', (messageData) => {
        console.log('📨 Received real-time message:', messageData)
        this.notifyMessageCallbacks(messageData)
      })

      // Connection state handlers
      this.connection.onclose(async (error) => {
        this.isConnected = false
        console.warn('❌ SignalR connection closed:', error)
        this.notifyConnectionCallbacks('disconnected', error)
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          await this.attemptReconnect()
        }
      })

      this.connection.onreconnecting((error) => {
        this.isConnected = false
        console.log('🔄 SignalR reconnecting...', error)
        this.notifyConnectionCallbacks('reconnecting', error)
      })

      this.connection.onreconnected((connectionId) => {
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log('✅ SignalR reconnected:', connectionId)
        this.notifyConnectionCallbacks('connected', null)
      })

      // Start connection
      await this.connection.start()
      this.isConnected = true
      this.reconnectAttempts = 0

      console.log('✅ SignalR connected successfully')
      this.notifyConnectionCallbacks('connected', null)

    } catch (error) {
      console.error('❌ Failed to connect to SignalR:', error)
      this.isConnected = false
      this.notifyConnectionCallbacks('error', error)
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        await this.attemptReconnect()
      }
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.stop()
        this.isConnected = false
        console.log('📡 SignalR disconnected')
      }
    } catch (error) {
      console.error('❌ Error disconnecting SignalR:', error)
    }
  }

  async attemptReconnect() {
    this.reconnectAttempts++
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
    
    setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error(`❌ Reconnect attempt ${this.reconnectAttempts} failed:`, error)
      }
    }, this.reconnectDelay)
  }

  // Subscribe to new message notifications
  onMessageCreated(callback) {
    this.messageCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
    }
  }

  // Subscribe to connection status changes
  onConnectionStatusChanged(callback) {
    this.connectionCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback)
    }
  }

  // Get current connection status
  getConnectionStatus() {
    if (!this.connection) return 'disconnected'
    
    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'connected'
      case signalR.HubConnectionState.Connecting:
        return 'connecting'
      case signalR.HubConnectionState.Reconnecting:
        return 'reconnecting'
      case signalR.HubConnectionState.Disconnected:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }

  // Notify all message callbacks
  notifyMessageCallbacks(messageData) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(messageData)
      } catch (error) {
        console.error('Error in message callback:', error)
      }
    })
  }

  // Notify all connection callbacks
  notifyConnectionCallbacks(status, error) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(status, error)
      } catch (error) {
        console.error('Error in connection callback:', error)
      }
    })
  }

  // Manual retry connection
  async retry() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      await this.attemptReconnect()
    } else {
      console.warn('⚠️ Max reconnect attempts reached')
    }
  }
}

// Create singleton instance
const signalRService = new SignalRService()

export default signalRService