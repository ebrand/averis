import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

class SignalRService {
  constructor() {
    this.connection = null
    this.listeners = new Map()
  }

  async connect() {
    try {
      // Build connection to Localization API SignalR hub via Traefik
      this.connection = new HubConnectionBuilder()
        .withUrl('http://api.localhost/localization/progressHub', {
          withCredentials: false
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build()

      // Set up event listeners
      this.connection.on('ProgressUpdate', (data) => {
        console.log('Progress update received:', data)
        this.notifyListeners('ProgressUpdate', data)
      })

      this.connection.on('JobComplete', (data) => {
        console.log('Job completed:', data)
        this.notifyListeners('JobComplete', data)
      })

      this.connection.on('JobFailed', (data) => {
        console.log('Job failed:', data)
        this.notifyListeners('JobFailed', data)
      })

      this.connection.on('WorkerAssigned', (data) => {
        console.log('Worker assigned:', data)
        this.notifyListeners('WorkerAssigned', data)
      })

      this.connection.on('WorkerReleased', (data) => {
        console.log('Worker released:', data)
        this.notifyListeners('WorkerReleased', data)
      })

      // Start the connection
      await this.connection.start()
      console.log('SignalR connection established')
      return true
    } catch (error) {
      console.error('Error connecting to SignalR hub:', error)
      return false
    }
  }

  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop()
        console.log('SignalR connection closed')
      } catch (error) {
        console.error('Error disconnecting from SignalR hub:', error)
      }
    }
  }

  // Subscribe to specific events
  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventName)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(eventName)
        }
      }
    }
  }

  // Notify all listeners for a specific event
  notifyListeners(eventName, data) {
    const eventListeners = this.listeners.get(eventName)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in SignalR event listener for ${eventName}:`, error)
        }
      })
    }
  }

  // Get connection state
  getConnectionState() {
    return this.connection?.state || 'Disconnected'
  }

  // Check if connected
  isConnected() {
    return this.connection?.state === 'Connected'
  }

  // Join a specific worker group
  async joinWorkerGroup(workerId) {
    if (this.connection && this.isConnected()) {
      try {
        await this.connection.invoke('JoinWorkerChannel', workerId.toString())
        console.log(`Joined worker group: ${workerId}`)
      } catch (error) {
        console.error(`Error joining worker group ${workerId}:`, error)
      }
    }
  }

  // Leave a specific worker group  
  async leaveWorkerGroup(workerId) {
    if (this.connection && this.isConnected()) {
      try {
        await this.connection.invoke('LeaveWorkerChannel', workerId.toString())
        console.log(`Left worker group: ${workerId}`)
      } catch (error) {
        console.error(`Error leaving worker group ${workerId}:`, error)
      }
    }
  }
}

// Export singleton instance
export const signalRService = new SignalRService()
export default signalRService