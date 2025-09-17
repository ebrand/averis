import { useEffect, useRef } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'

/**
 * Custom hook for handling real-time data updates via WebSocket
 * @param {Object} options - Configuration options
 * @param {Function} options.onProductUpdate - Callback when a product is updated
 * @param {Function} options.onInventoryUpdate - Callback when inventory changes
 * @param {Function} options.onSystemStatus - Callback when system status changes
 * @param {Array} options.productIds - Array of specific product IDs to watch (optional)
 * @param {boolean} options.enabled - Whether to enable the hook (default: true)
 */
const useRealTimeUpdates = (options = {}) => {
  const {
    onProductUpdate,
    onInventoryUpdate,
    onSystemStatus,
    productIds = null,
    enabled = true
  } = options

  const { addEventListener, isConnected, connectionStatus } = useWebSocket()
  const unsubscribersRef = useRef([])

  useEffect(() => {
    if (!enabled || !isConnected) {
      return
    }

    const unsubscribers = []

    // Handle product updates
    if (onProductUpdate) {
      const unsubscribe = addEventListener('product_update', (message) => {
        const { product, eventType, productId } = message

        // If we're watching specific products, filter by ID
        if (productIds && !productIds.includes(productId)) {
          return
        }

        try {
          onProductUpdate({
            product,
            eventType,
            productId,
            timestamp: message.timestamp
          })
        } catch (error) {
          console.error('Error in onProductUpdate callback:', error)
        }
      })
      unsubscribers.push(unsubscribe)
    }

    // Handle inventory updates
    if (onInventoryUpdate) {
      const unsubscribe = addEventListener('inventory_update', (message) => {
        const { productId, stockStatus, stockQuantity } = message

        // If we're watching specific products, filter by ID
        if (productIds && !productIds.includes(productId)) {
          return
        }

        try {
          onInventoryUpdate({
            productId,
            stockStatus,
            stockQuantity,
            timestamp: message.timestamp
          })
        } catch (error) {
          console.error('Error in onInventoryUpdate callback:', error)
        }
      })
      unsubscribers.push(unsubscribe)
    }

    // Handle system status updates
    if (onSystemStatus) {
      const unsubscribe = addEventListener('system_status', (message) => {
        const { status, message: statusMessage } = message

        try {
          onSystemStatus({
            status,
            message: statusMessage,
            timestamp: message.timestamp
          })
        } catch (error) {
          console.error('Error in onSystemStatus callback:', error)
        }
      })
      unsubscribers.push(unsubscribe)
    }

    // Store unsubscribers
    unsubscribersRef.current = unsubscribers

    return () => {
      // Clean up all subscriptions
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      })
      unsubscribersRef.current = []
    }
  }, [
    enabled, 
    isConnected, 
    onProductUpdate, 
    onInventoryUpdate, 
    onSystemStatus,
    productIds ? JSON.stringify(productIds) : null, // Stringify array for dependency comparison
    addEventListener
  ])

  // Return connection info for consumers
  return {
    isConnected,
    connectionStatus,
    isActive: enabled && isConnected
  }
}

export default useRealTimeUpdates