import React, { useState, useEffect } from 'react'
import { 
  ServerIcon, CheckCircleIcon, XCircleIcon, ClockIcon, FunnelIcon,
  ChartBarIcon, CubeIcon, TagIcon, ShoppingBagIcon, UserGroupIcon,
  ClipboardDocumentListIcon, BuildingOfficeIcon, ChartPieIcon, CogIcon
} from '@heroicons/react/24/outline'

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  // Health check utility functions
  const checkServiceHealth = async (service) => {
    if (!service.healthUrl) {
      // For database schemas, we'll assume they're healthy if they exist
      // since they're logical constructs rather than running services
      if (service.type === 'Schema') {
        return {
          status: 'healthy',
          responseTime: 'Schema',
          version: service.version || 'N/A',
          uptime: 'N/A',
          lastChecked: new Date()
        }
      }
      
      return {
        status: 'unknown',
        responseTime: 'N/A',
        version: service.version || 'N/A',
        uptime: 'N/A',
        lastChecked: new Date()
      }
    }

    const startTime = performance.now()
    try {
      const response = await fetch(service.healthUrl, {
        method: 'GET',
        mode: 'cors',
        headers: service.type === 'UI' ? {
          'Accept': 'text/html,*/*'
        } : {
          'Accept': 'application/json'
        },
        credentials: 'omit', // Don't send credentials to avoid CORS issues
        signal: AbortSignal.timeout(5000)
      })
      
      const endTime = performance.now()
      const responseTime = `${Math.round(endTime - startTime)}ms`
      const contentType = response.headers.get('content-type')
      
      // Check if response has JSON content (regardless of HTTP status)
      if (contentType && contentType.includes('application/json')) {
        // Handle JSON responses - some services return 503 with JSON health data
        try {
          const healthData = await response.json()
          
          // For health endpoints, trust the status field in JSON response over HTTP status
          let statusFromJson = healthData.status || 'unknown'
          
          // If HTTP response is not OK but JSON status exists, use JSON status
          if (!response.ok && statusFromJson) {
            console.log(`Service ${service.name} returned HTTP ${response.status} but JSON status: ${statusFromJson}`)
          }
          
          return {
            status: statusFromJson,
            responseTime,
            version: healthData.version || service.version || 'N/A',
            uptime: healthData.uptime ? `${Math.round(healthData.uptime / 1000)}s` : 'N/A',
            lastChecked: new Date(),
            details: healthData,
            httpStatus: response.status
          }
        } catch (jsonError) {
          console.error(`JSON parse error for ${service.name}:`, jsonError)
          return {
            status: 'unhealthy',
            responseTime,
            version: service.version || 'N/A',
            uptime: 'N/A',
            lastChecked: new Date(),
            error: `JSON parse error: ${jsonError.message}`
          }
        }
      }
      
      // Handle non-JSON responses - check HTTP status
      if (response.ok) {
        // Handle plain text responses like "Healthy" or UI HTML responses
        try {
          const text = await response.text()
          
          // For UI services, a successful HTML response means healthy
          if (service.type === 'UI') {
            const isHtml = text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('<head>')
            return {
              status: isHtml ? 'healthy' : 'degraded',
              responseTime,
              version: service.version || 'N/A',
              uptime: 'N/A',
              lastChecked: new Date()
            }
          } else {
            // For API text responses like "Healthy"
            return {
              status: text.toLowerCase().includes('healthy') ? 'healthy' : 'degraded',
              responseTime,
              version: service.version || 'N/A',
              uptime: 'N/A',
              lastChecked: new Date()
            }
          }
        } catch (textError) {
          console.error(`Text parse error for ${service.name}:`, textError)
          return {
            status: 'degraded',
            responseTime,
            version: service.version || 'N/A',
            uptime: 'N/A',
            lastChecked: new Date()
          }
        }
      } else {
        // Non-OK HTTP status with non-JSON response
        return {
          status: 'unhealthy',
          responseTime,
          version: service.version || 'N/A',
          uptime: 'N/A',
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (fetchError) {
      const endTime = performance.now()
      console.error(`Health check failed for ${service.name} (${service.healthUrl}):`, fetchError)
      
      let errorType = 'timeout'
      if (fetchError.name === 'TypeError') {
        errorType = fetchError.message.includes('cors') ? 'CORS error' : 'Network error'
      } else if (fetchError.name === 'AbortError') {
        errorType = 'timeout'
      }
      
      return {
        status: 'unhealthy',
        responseTime: errorType,
        version: service.version || 'N/A',
        uptime: 'N/A',
        lastChecked: new Date(),
        error: `${errorType}: ${fetchError.message}`
      }
    }
  }

  // Services configuration with health check endpoints
  // This matches the actual services launched by start.sh script
  const servicesConfig = [
    // Product MDM Services (Active)
    {
      id: 'product-mdm-ui',
      name: 'Product UI',
      category: 'Product MDM',
      type: 'UI',
      url: 'http://localhost:3001',
      healthUrl: 'http://localhost:3001/',
      description: 'Product Master Data Management User Interface',
      version: 'v1.0.0'
    },
    {
      id: 'product-mdm-api',
      name: 'Product API',
      category: 'Product MDM',
      type: 'API',
      url: 'http://localhost:6001',
      healthUrl: 'http://localhost:6001/health',
      description: 'Product Master Data Management API (.NET)',
      version: 'v1.0.0'
    },
    
    // Product Staging Services (Active)
    {
      id: 'product-staging-api',
      name: 'Product Staging API',
      category: 'Product Staging',
      type: 'API',
      url: 'http://localhost:6002',
      healthUrl: 'http://localhost:6002/health',
      description: 'Product staging cache API (.NET)',
      version: 'v1.0.0-beta'
    },
    {
      id: 'product-staging-ingest',
      name: 'Product Staging Ingest',
      category: 'Product Staging',
      type: 'Ingest',
      url: 'http://localhost:9002',
      healthUrl: 'http://localhost:9002/health',
      description: 'Product staging message ingest service (Node.js)',
      version: 'v1.0.0-beta'
    },

    // Pricing MDM Services (Active)
    {
      id: 'pricing-mdm-ui',
      name: 'Pricing UI',
      category: 'Pricing MDM',
      type: 'UI',
      url: 'http://localhost:3003',
      healthUrl: 'http://localhost:3003/',
      description: 'Pricing Master Data Management User Interface',
      version: 'v1.0.0'
    },
    {
      id: 'pricing-mdm-api',
      name: 'Pricing API',
      category: 'Pricing MDM',
      type: 'API',
      url: 'http://localhost:6003',
      healthUrl: 'http://localhost:6003/health',
      description: 'Pricing Master Data Management API (.NET)',
      version: 'v1.0.0'
    },

    // E-Commerce Services (Active)
    {
      id: 'ecommerce-ui',
      name: 'E-commerce UI',
      category: 'E-Commerce',
      type: 'UI',
      url: 'http://localhost:3004',
      healthUrl: 'http://localhost:3004/',
      description: 'Customer-facing E-commerce Interface',
      version: 'v1.0.0'
    },
    {
      id: 'ecommerce-api',
      name: 'E-commerce API',
      category: 'E-Commerce',
      type: 'API',
      url: 'http://localhost:6004',
      healthUrl: 'http://localhost:6004/health',
      description: 'E-commerce Platform API (.NET)',
      version: 'v1.0.0'
    },

    // Customer MDM Services (Active)
    {
      id: 'customer-mdm-ui',
      name: 'Customer UI',
      category: 'Customer MDM',
      type: 'UI',
      url: 'http://localhost:3007',
      healthUrl: 'http://localhost:3007/',
      description: 'Customer Management User Interface',
      version: 'v1.0.0'
    },
    {
      id: 'user-customer-api',
      name: 'Customer API',
      category: 'Customer MDM',
      type: 'API',
      url: 'http://localhost:6007',
      healthUrl: 'http://localhost:6007/health',
      description: 'User and Customer Management API (.NET)',
      version: 'v1.0.0'
    },

    // OMS Services (Active)
    {
      id: 'oms-ui',
      name: 'OMS UI',
      category: 'Order Management',
      type: 'UI',
      url: 'http://localhost:3005',
      healthUrl: 'http://localhost:3005/',
      description: 'Order Management System User Interface',
      version: 'v1.0.0'
    },
    {
      id: 'oms-api',
      name: 'OMS API',
      category: 'Order Management',
      type: 'API',
      url: 'http://localhost:6005',
      healthUrl: 'http://localhost:6005/health',
      description: 'Order Management System API (.NET)',
      version: 'v1.0.0'
    },

    // ERP Services (Active)
    {
      id: 'erp-ui',
      name: 'ERP UI',
      category: 'Enterprise Resource Planning',
      type: 'UI',
      url: 'http://localhost:3006',
      healthUrl: 'http://localhost:3006/',
      description: 'Enterprise Resource Planning User Interface',
      version: 'v1.0.0'
    },
    {
      id: 'erp-api',
      name: 'ERP API',
      category: 'Enterprise Resource Planning',
      type: 'API',
      url: 'http://localhost:6006',
      healthUrl: 'http://localhost:6006/health',
      description: 'Enterprise Resource Planning API (.NET)',
      version: 'v1.0.0'
    },

    // Dashboard Services (Active)
    {
      id: 'commerce-dashboard-ui',
      name: 'Commerce Dashboard UI',
      category: 'System Monitor',
      type: 'UI',
      url: 'http://localhost:3012',
      healthUrl: 'http://localhost:3012/',
      description: 'Centralized dashboard for commerce operations',
      version: 'v1.0.0'
    },

    // Infrastructure Services (External Dependencies)
    {
      id: 'nats-streaming',
      name: 'NATS Message Streaming',
      category: 'Infrastructure',
      type: 'Queue',
      url: 'nats://localhost:4222',
      healthUrl: 'http://localhost:8090/health',
      description: 'High-performance message streaming for product events',
      version: 'v2.10.0'
    },
    {
      id: 'postgresql-main',
      name: 'PostgreSQL Database',
      category: 'Infrastructure', 
      type: 'Database',
      url: 'postgresql://localhost:5432/commerce_db',
      healthUrl: 'http://localhost:8091/health',
      description: 'Main PostgreSQL database (all schemas)',
      version: 'PostgreSQL 16'
    },

    // Logical Database Schemas (Monitoring Views)
    {
      id: 'averis-product-schema',
      name: 'Product Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_product schema - Product master data',
      version: 'v1.0.0'
    },
    {
      id: 'averis-product-staging-schema',
      name: 'Product Staging Schema',
      category: 'Database Schemas', 
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_product_staging schema - Product cache',
      version: 'v1.0.0'
    },
    {
      id: 'averis-pricing-schema',
      name: 'Pricing Schema',
      category: 'Database Schemas',
      type: 'Schema', 
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_pricing schema - Pricing and catalog data',
      version: 'v1.0.0'
    },
    {
      id: 'averis-ecomm-schema',
      name: 'E-commerce Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_ecomm schema - Customer-facing commerce data',
      version: 'v1.0.0'
    },
    {
      id: 'averis-customer-schema',
      name: 'Customer Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_customer schema - Customer data',
      version: 'v1.0.0'
    },
    {
      id: 'averis-system-schema',
      name: 'System Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_system schema - Platform metadata and configuration',
      version: 'v1.0.0'
    },
    {
      id: 'averis-oms-schema',
      name: 'OMS Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_oms schema - Order management data',
      version: 'v1.0.0'
    },
    {
      id: 'averis-erp-schema',
      name: 'ERP Schema',
      category: 'Database Schemas',
      type: 'Schema',
      url: 'postgresql://localhost:5432/commerce_db',
      description: 'averis_erp schema - Enterprise resource planning data',
      version: 'v1.0.0'
    }
  ]

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true)
      try {
        // Perform health checks on all configured services
        const healthCheckPromises = servicesConfig.map(async (serviceConfig) => {
          const healthResult = await checkServiceHealth(serviceConfig)
          return {
            ...serviceConfig,
            ...healthResult
          }
        })

        const servicesWithHealth = await Promise.all(healthCheckPromises)
        setServices(servicesWithHealth)
      } catch (err) {
        console.error('Failed to load service health:', err)
        setError('Failed to load services')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
    
    // Refresh health checks every 30 seconds
    const interval = setInterval(loadServices, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircleIcon className="h-5 w-5 text-yellow-600" />
      case 'unknown':
        return <ServerIcon className="h-5 w-5 text-gray-500" />
      default:
        return <XCircleIcon className="h-5 w-5 text-red-600" /> // For error status
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'healthy':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'degraded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'unhealthy':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'unknown':
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  // Get service group styling and icons - aligned with Color Palette page
  const getGroupStyling = (groupName) => {
    switch (groupName) {
      case 'Dashboard':
        return {
          icon: ChartBarIcon,
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          iconColor: 'text-teal-600',
          textColor: 'text-teal-900',
          headerBg: 'bg-gradient-to-r from-teal-600 to-teal-500',
          headerText: 'text-white'
        }
      case 'Product MDM':
        return {
          icon: CubeIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200', 
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900',
          headerBg: 'bg-gradient-to-r from-blue-800 to-blue-600',
          headerText: 'text-white'
        }
      case 'Product Staging':
        return {
          icon: CogIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600', 
          textColor: 'text-blue-900',
          headerBg: 'bg-gradient-to-r from-blue-800 to-blue-600',
          headerText: 'text-white'
        }
      case 'Pricing MDM':
        return {
          icon: TagIcon,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          textColor: 'text-green-900',
          headerBg: 'bg-gradient-to-r from-green-800 to-green-600',
          headerText: 'text-white'
        }
      case 'E-commerce':
        return {
          icon: ShoppingBagIcon,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-900',
          headerBg: 'bg-gradient-to-r from-gray-600 to-gray-500',
          headerText: 'text-white'
        }
      case 'Customer MDM':
        return {
          icon: UserGroupIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-900',
          headerBg: 'bg-gradient-to-r from-red-700 to-red-500',
          headerText: 'text-white'
        }
      case 'Order Management':
        return {
          icon: ClipboardDocumentListIcon,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-600',
          textColor: 'text-purple-900',
          headerBg: 'bg-gradient-to-r from-purple-800 to-purple-600',
          headerText: 'text-white'
        }
      case 'Enterprise Resource Planning':
        return {
          icon: BuildingOfficeIcon,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-900',
          headerBg: 'bg-gradient-to-r from-orange-800 to-orange-600',
          headerText: 'text-white'
        }
      case 'Infrastructure':
        return {
          icon: ServerIcon,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-900',
          headerBg: 'bg-gradient-to-r from-gray-600 to-gray-500',
          headerText: 'text-white'
        }
      default:
        return {
          icon: ChartPieIcon,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-900',
          headerBg: 'bg-gradient-to-r from-gray-600 to-gray-500',
          headerText: 'text-white'
        }
    }
  }

  // Get Bento Grid layout configuration for each group - Custom layout
  const getBentoConfig = (groupName) => {
    switch (groupName) {
      case 'Dashboard':
        return { 
          colSpan: 'col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-8', // Full width
          rowSpan: 'row-span-1', 
          priority: 1 
        }
      case 'Product MDM':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 2 
        }
      case 'Product Staging':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 3 
        }
      case 'Pricing MDM':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 4 
        }
      case 'Customer MDM':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 5 
        }
      case 'Order Management':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 6 
        }
      case 'Enterprise Resource Planning':
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', // Standard 2-col
          rowSpan: 'row-span-1', 
          priority: 7 
        }
      case 'E-commerce':
        return { 
          colSpan: 'col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-4', // Wide - more stats
          rowSpan: 'row-span-1', 
          priority: 8 
        }
      case 'Infrastructure':
        return { 
          colSpan: 'col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-8', // Full width
          rowSpan: 'row-span-1', 
          priority: 9 
        }
      default:
        return { 
          colSpan: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2', 
          rowSpan: 'row-span-1', 
          priority: 10 
        }
    }
  }

  // Group services by functional area
  const getGroupedServices = () => {
    // Define service groups with their components including their database schemas
    const serviceGroups = [
      {
        name: 'Dashboard',
        services: services.filter(s => 
          s.id.includes('commerce-dashboard') || 
          s.id.includes('system') ||
          s.id.includes('averis-system-schema')
        )
      },
      {
        name: 'Product MDM',
        services: services.filter(s => 
          s.id.includes('product-mdm') ||
          s.id.includes('averis-product-schema')
        )
      },
      {
        name: 'Product Staging',
        services: services.filter(s => 
          s.id.includes('product-staging') ||
          s.id.includes('averis-product-staging-schema')
        )
      },
      {
        name: 'Pricing MDM',
        services: services.filter(s => 
          s.id.includes('pricing-mdm') ||
          s.id.includes('averis-pricing-schema')
        )
      },
      {
        name: 'E-commerce',
        services: services.filter(s => 
          s.id.includes('ecommerce') ||
          s.id.includes('averis-ecomm-schema')
        )
      },
      {
        name: 'Customer MDM',
        services: services.filter(s => 
          s.id.includes('customer') || 
          s.id.includes('user-customer') ||
          s.id.includes('averis-customer-schema')
        )
      },
      {
        name: 'Order Management',
        services: services.filter(s => 
          s.id.includes('oms') ||
          s.id.includes('averis-oms-schema')
        )
      },
      {
        name: 'Enterprise Resource Planning',
        services: services.filter(s => 
          s.id.includes('erp') ||
          s.id.includes('averis-erp-schema')
        )
      },
      {
        name: 'Infrastructure',
        services: services.filter(s => s.category === 'Infrastructure')
      }
    ].filter(group => group.services.length > 0) // Only show groups with services

    // Apply status filter if set
    if (filterStatus !== 'all') {
      const filteredGroups = serviceGroups.map(group => ({
        ...group,
        services: group.services.filter(service => service.status === filterStatus)
      })).filter(group => group.services.length > 0)
      
      // Sort by priority for Bento layout
      return filteredGroups.sort((a, b) => 
        getBentoConfig(a.name).priority - getBentoConfig(b.name).priority
      )
    }

    // Sort by priority for Bento layout
    return serviceGroups.sort((a, b) => 
      getBentoConfig(a.name).priority - getBentoConfig(b.name).priority
    )
  }


  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Services</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Services Overview</h1>
              <p className="mt-1 text-sm text-gray-500">Monitor the health and status of all microservices</p>
            </div>
          </div>
          
          {/* Summary Stats in Header */}
          <div className="hidden lg:flex space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'healthy').length}
              </div>
              <div className="text-xs text-gray-500">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'degraded').length}
              </div>
              <div className="text-xs text-gray-500">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {services.filter(s => s.status === 'unhealthy').length}
              </div>
              <div className="text-xs text-gray-500">Unhealthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {services.filter(s => s.status === 'unknown').length}
              </div>
              <div className="text-xs text-gray-500">Unknown</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        >
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="degraded">Degraded</option>
          <option value="unhealthy">Unhealthy</option>
          <option value="unknown">Unknown</option>
        </select>

        <div className="text-sm text-gray-500 ml-auto">
          {services.length} total services
        </div>
      </div>

      {/* Custom Bento Grid Services Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 auto-rows-min">
        {getGroupedServices().map((group) => {
          const groupStyle = getGroupStyling(group.name)
          const GroupIcon = groupStyle.icon
          const bentoConfig = getBentoConfig(group.name)
          
          return (
            <div 
              key={group.name} 
              className={`${bentoConfig.colSpan} ${bentoConfig.rowSpan} bg-white shadow-lg rounded-lg overflow-hidden ${groupStyle.borderColor} border`}
            >
              <div className={`px-6 py-4 ${groupStyle.headerBg}`}>
                <h3 className={`text-lg font-semibold flex items-center ${groupStyle.headerText}`}>
                  <GroupIcon className="h-6 w-6 mr-3" />
                  <span className="truncate flex-1">{group.name}</span>
                  <span className="ml-3 px-2 py-1 text-xs font-medium bg-white bg-opacity-20 rounded-full flex-shrink-0">
                    {group.services.length}
                  </span>
                </h3>
              </div>
            
            <div className={`p-4 ${groupStyle.bgColor}`}>
              <div className={`grid gap-3 auto-rows-min ${
                // Adaptive grid based on tile width for better space utilization
                group.name === 'Dashboard' || group.name === 'Infrastructure'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' // Full width tiles: multiple columns
                  : group.name === 'E-commerce'
                  ? 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2' // Wide tile: 2 columns
                  : 'grid-cols-1' // Standard tiles: single column
              }`}>
                {group.services.map((service) => {
                  // Determine background color based on status with group theme
                  const getBackgroundClass = (status) => {
                    switch (status) {
                      case 'healthy':
                        return 'bg-white hover:bg-green-50 border border-green-200 shadow-sm'
                      case 'degraded':
                        return 'bg-white hover:bg-yellow-50 border border-yellow-200 shadow-sm'
                      case 'unhealthy':
                        return 'bg-white hover:bg-red-50 border border-red-200 shadow-sm'
                      case 'unknown':
                        return 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                      default:
                        return 'bg-white hover:bg-red-50 border border-red-300 shadow-sm' // For error status
                    }
                  }

                  // Get end cap styling based on service type
                  const getEndCapStyling = (type) => {
                    switch (type) {
                      case 'UI':
                        return 'bg-gray-800 text-white'
                      case 'API':
                        return 'bg-gray-500 text-white'
                      case 'Schema':
                        return 'bg-gray-300 text-gray-700'
                      case 'Ingest':
                        return 'bg-blue-600 text-white'
                      case 'Queue':
                        return 'bg-purple-600 text-white'
                      case 'Database':
                        return 'bg-green-600 text-white'
                      default:
                        return 'bg-gray-400 text-white'
                    }
                  }

                  // Get end cap text based on service type
                  const getEndCapText = (type) => {
                    switch (type) {
                      case 'UI':
                        return 'UI'
                      case 'API':
                        return 'API'
                      case 'Schema':
                        return 'Schema'
                      case 'Ingest':
                        return 'ING'
                      case 'Queue':
                        return 'QUE'
                      case 'Database':
                        return 'DB'
                      default:
                        return type.substring(0, 3).toUpperCase()
                    }
                  }

                  return (
                    <div
                      key={service.id}
                      className={`flex items-center rounded-lg transition-colors overflow-hidden ${getBackgroundClass(service.status)} min-h-[3rem]`}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 p-2">
                        {getStatusIcon(service.status)}
                      </div>
                      
                      {/* Service Info */}
                      <div className="min-w-0 flex-1 p-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {service.name}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            service.status === 'healthy' 
                              ? 'bg-green-100 text-green-700'
                              : service.status === 'degraded'
                              ? 'bg-yellow-100 text-yellow-700' 
                              : service.status === 'unhealthy'
                              ? 'bg-red-100 text-red-700'
                              : service.status === 'unknown'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-red-200 text-red-800' // For error status
                          }`}>
                            {service.status}
                          </span>
                          {service.url && (
                            <a 
                              href={service.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs opacity-70 hover:opacity-100"
                              title={service.url}
                            >
                              🔗
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* End Cap */}
                      <div className={`flex items-center justify-center w-5 h-full ${getEndCapStyling(service.type)} flex-shrink-0`}>
                        <span 
                          className="text-xs font-bold"
                          style={{ 
                            writingMode: 'vertical-lr', 
                            transform: 'rotate(180deg)',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {getEndCapText(service.type)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {/* Mobile Summary Stats */}
      <div className="mt-8 lg:hidden bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'healthy').length}
              </div>
              <div className="text-sm text-gray-500">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'degraded').length}
              </div>
              <div className="text-sm text-gray-500">Degraded Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {services.filter(s => s.status === 'unhealthy').length}
              </div>
              <div className="text-sm text-gray-500">Unhealthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {services.filter(s => s.status === 'unknown').length}
              </div>
              <div className="text-sm text-gray-500">Unknown Services</div>
            </div>
            <div className="text-center col-span-2">
              <div className="text-2xl font-bold text-gray-900">
                {services.length}
              </div>
              <div className="text-sm text-gray-500">Total Services</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage