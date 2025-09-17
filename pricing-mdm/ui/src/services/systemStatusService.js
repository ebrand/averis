// System Status Service - provides comprehensive health checks for API and databases
import { getProductStats } from './productDataService'

class SystemStatusService {
  constructor() {
    this.apiBaseUrl = '/api'
  }

  // Test basic API connectivity
  async testApiConnection() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        return { 
          status: 'connected', 
          message: 'API server is running',
          details: data
        }
      } else {
        return { 
          status: 'error', 
          message: `API returned ${response.status}`,
          details: null
        }
      }
    } catch (error) {
      return { 
        status: 'offline', 
        message: error.name === 'AbortError' ? 'API timeout' : 'API unreachable',
        details: error.message
      }
    }
  }

  // Test users database functionality
  async testUsersDatabase() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      // Test users endpoint with a simple query
      const response = await fetch(`${this.apiBaseUrl}/users?page=1&limit=1`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        return { 
          status: 'connected', 
          message: 'Users database operational',
          details: {
            totalUsers: data.pagination?.total || 0,
            source: data.source || 'unknown'
          }
        }
      } else {
        return { 
          status: 'error', 
          message: `Users DB error (${response.status})`,
          details: null
        }
      }
    } catch (error) {
      return { 
        status: 'offline', 
        message: error.name === 'AbortError' ? 'Users DB timeout' : 'Users DB unavailable',
        details: error.message
      }
    }
  }

  // Test products database functionality
  async testProductsDatabase() {
    try {
      // Use the existing product stats function which tests products endpoints
      const result = await getProductStats()
      
      if (result.source === 'api' && !result.error) {
        return { 
          status: 'connected', 
          message: 'Products database operational',
          details: {
            totalProducts: result.total || 0,
            activeProducts: result.available || 0,
            source: result.source
          }
        }
      } else if (result.error) {
        return { 
          status: 'error', 
          message: 'Products DB has issues',
          details: result.error
        }
      } else {
        return { 
          status: 'fallback', 
          message: 'Using mock product data',
          details: { source: result.source }
        }
      }
    } catch (error) {
      return { 
        status: 'offline', 
        message: 'Products DB unavailable',
        details: error.message
      }
    }
  }

  // Test RabbitMQ status (Product MDM is publisher, not consumer)
  async testRabbitMQ() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      // Check RabbitMQ via our own API health endpoint
      const response = await fetch(`${this.apiBaseUrl}/health/rabbitmq`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'connected') {
          return { 
            status: 'connected', 
            message: 'RabbitMQ message broker operational',
            details: {
              service: data.service,
              timestamp: data.timestamp,
              role: 'Publisher (Product MDM sends messages)',
              exchange: 'product.exchange'
            }
          }
        } else {
          return { 
            status: 'error', 
            message: 'RabbitMQ broker disconnected',
            details: {
              service: data.service,
              error: data.error || 'Unknown error'
            }
          }
        }
      } else if (response.status === 503) {
        const errorData = await response.json()
        return { 
          status: 'offline', 
          message: 'RabbitMQ broker unavailable',
          details: {
            error: errorData.error || 'Service unavailable'
          }
        }
      } else {
        return { 
          status: 'error', 
          message: `RabbitMQ status check failed (${response.status})`,
          details: null
        }
      }
    } catch (error) {
      return { 
        status: 'offline', 
        message: error.name === 'AbortError' ? 'RabbitMQ check timeout' : 'RabbitMQ unavailable',
        details: error.message
      }
    }
  }

  // Get comprehensive system status
  async getSystemStatus() {
    console.log('🔍 Checking comprehensive system status...')
    
    const [apiStatus, usersStatus, productsStatus, rabbitMQStatus] = await Promise.all([
      this.testApiConnection(),
      this.testUsersDatabase(),
      this.testProductsDatabase(),
      this.testRabbitMQ()
    ])

    const overallStatus = this.calculateOverallStatus([apiStatus, usersStatus, productsStatus, rabbitMQStatus])
    
    return {
      timestamp: new Date().toISOString(),
      overall: overallStatus,
      components: {
        api: apiStatus,
        usersDatabase: usersStatus,
        productsDatabase: productsStatus,
        rabbitMQ: rabbitMQStatus
      }
    }
  }

  // Calculate overall system health
  calculateOverallStatus(componentStatuses) {
    const statusPriority = { 'offline': 0, 'error': 1, 'fallback': 2, 'connected': 3 }
    
    const worstStatus = componentStatuses.reduce((worst, current) => {
      return statusPriority[current.status] < statusPriority[worst.status] ? current : worst
    })

    const connectedCount = componentStatuses.filter(s => s.status === 'connected').length
    const totalCount = componentStatuses.length

    return {
      status: worstStatus.status,
      message: `${connectedCount}/${totalCount} systems operational`,
      healthPercentage: Math.round((connectedCount / totalCount) * 100)
    }
  }

  // Get status indicator properties for UI rendering
  getStatusIndicator(status) {
    const indicators = {
      'connected': {
        color: 'bg-green-400',
        textColor: 'text-green-600',
        icon: '✅',
        label: 'Connected'
      },
      'fallback': {
        color: 'bg-yellow-400',
        textColor: 'text-yellow-600',
        icon: '⚠️',
        label: 'Fallback'
      },
      'error': {
        color: 'bg-orange-400',
        textColor: 'text-orange-600',
        icon: '⚠️',
        label: 'Error'
      },
      'offline': {
        color: 'bg-red-400',
        textColor: 'text-red-600',
        icon: '❌',
        label: 'Offline'
      }
    }
    
    return indicators[status] || indicators['offline']
  }
}

// Create singleton instance
const systemStatusService = new SystemStatusService()

export default systemStatusService
export { SystemStatusService }