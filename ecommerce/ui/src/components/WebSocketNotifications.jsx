import React, { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  WifiIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const WebSocketNotifications = () => {
  const { 
    isConnected, 
    connectionStatus, 
    addEventListener, 
    removeEventListener,
    reconnectAttempts,
    maxReconnectAttempts 
  } = useWebSocket()
  
  const [notifications, setNotifications] = useState([])
  const [showConnectionStatus, setShowConnectionStatus] = useState(true)
  const notificationIdRef = useRef(0)

  const addNotification = (type, title, message, duration = 5000) => {
    const id = notificationIdRef.current++
    const notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      duration
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    // Listen for product updates
    const unsubscribeProductUpdate = addEventListener('product_update', (message) => {
      const { product, eventType } = message
      addNotification(
        'info',
        'Product Updated',
        `${product.name} (${product.sku}) has been ${eventType}`,
        7000
      )
    })

    // Listen for inventory updates
    const unsubscribeInventoryUpdate = addEventListener('inventory_update', (message) => {
      const { productId, stockStatus, stockQuantity } = message
      addNotification(
        'warning',
        'Inventory Update',
        `Product ${productId} - Stock: ${stockStatus} (${stockQuantity} units)`,
        6000
      )
    })

    // Listen for system status updates
    const unsubscribeSystemStatus = addEventListener('system_status', (message) => {
      const { status, message: statusMessage } = message
      addNotification(
        status === 'healthy' ? 'success' : 'error',
        'System Status',
        statusMessage,
        5000
      )
    })

    // Listen for connection events
    const unsubscribeConnection = addEventListener('connection', (message) => {
      addNotification(
        'success',
        'WebSocket Connected',
        message.message,
        3000
      )
    })

    return () => {
      unsubscribeProductUpdate()
      unsubscribeInventoryUpdate()
      unsubscribeSystemStatus()
      unsubscribeConnection()
    }
  }, [addEventListener])

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'connecting':
      case 'reconnecting':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'error':
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <WifiIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
      case 'failed':
        return 'Connection Failed'
      default:
        return 'Unknown'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <>
      {/* Connection Status - Fixed position */}
      {showConnectionStatus && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border ${
            isConnected 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {getConnectionIcon()}
            <span className="text-sm font-medium">{getConnectionText()}</span>
            <button
              onClick={() => setShowConnectionStatus(false)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications - Stacked */}
      <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border ${getNotificationBgColor(notification.type)} animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start space-x-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default WebSocketNotifications