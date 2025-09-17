import React, { createContext, useContext, useEffect, useState, useRef } from 'react'

const WebSocketContext = createContext({})

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // Event listeners for different message types
  const eventListeners = useRef(new Map())

  const connect = () => {
    try {
      // Connect to Product MDM WebSocket server for message log updates
      const wsUrl = `ws://localhost:8086/product-mdm-updates`
      console.log(`🔌 Connecting to Product MDM WebSocket: ${wsUrl}`)
      
      wsRef.current = new WebSocket(wsUrl)
      setConnectionStatus('connecting')

      wsRef.current.onopen = () => {
        console.log('🔌 Product MDM WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        // Subscribe to message log updates
        sendMessage({
          type: 'subscribe',
          topics: ['message-log', 'product-events']
        })
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Product MDM WebSocket message:', message)
          
          setLastMessage(message)
          
          // Notify specific event listeners
          const listeners = eventListeners.current.get(message.type) || []
          listeners.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in WebSocket event listener:', error)
            }
          })
          
          // Also notify generic message listeners
          const genericListeners = eventListeners.current.get('message') || []
          genericListeners.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in generic WebSocket listener:', error)
            }
          })
          
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ Product MDM WebSocket error:', error)
        setConnectionStatus('error')
      }

      wsRef.current.onclose = (event) => {
        console.log('🔌 Product MDM WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        wsRef.current = null

        // Attempt to reconnect unless it was a manual disconnection
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`🔄 Attempting to reconnect WebSocket (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          setConnectionStatus('reconnecting')
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('❌ Max reconnection attempts reached')
          setConnectionStatus('failed')
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnection')
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
  }

  const addEventListener = (eventType, callback) => {
    const listeners = eventListeners.current.get(eventType) || []
    listeners.push(callback)
    eventListeners.current.set(eventType, listeners)

    // Return cleanup function
    return () => {
      const currentListeners = eventListeners.current.get(eventType) || []
      const index = currentListeners.indexOf(callback)
      if (index > -1) {
        currentListeners.splice(index, 1)
        eventListeners.current.set(eventType, currentListeners)
      }
    }
  }

  const removeEventListener = (eventType, callback) => {
    const listeners = eventListeners.current.get(eventType) || []
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
      eventListeners.current.set(eventType, listeners)
    }
  }

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected, cannot send message')
    }
  }

  // Connect on mount - temporarily disabled until WebSocket server is implemented
  useEffect(() => {
    console.log('WebSocket connection temporarily disabled - using polling mode')
    // connect()

    return () => {
      disconnect()
    }
  }, [])

  const value = {
    isConnected,
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    addEventListener,
    removeEventListener,
    sendMessage,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketProvider