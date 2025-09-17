import React, { useState, useEffect } from 'react'
import { ServerIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  // Complete services data - all 23+ components organized by category
  const mockServices = [
    // Product MDM Services
    {
      id: 'product-mdm-ui',
      name: 'Product UI',
      category: 'Product',
      type: 'UI',
      url: 'http://localhost:3001',
      status: 'healthy',
      description: 'Product Master Data Management User Interface',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '8ms',
      uptime: '99.9%'
    },
    {
      id: 'product-mdm-api',
      name: 'Product API',
      category: 'Product',
      type: 'API',
      url: 'http://localhost:6001',
      status: 'healthy',
      description: 'Product Master Data Management API',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '15ms',
      uptime: '99.9%'
    },
    {
      id: 'product-db',
      name: 'Product DB',
      category: 'Product',
      type: 'Database',
      url: 'postgresql://localhost:5432/commerce_db',
      status: 'healthy',
      description: 'Product database (averis_product schema)',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: '2ms',
      uptime: '99.9%'
    },
    {
      id: 'product-queuing',
      name: 'Product Queuing',
      category: 'Product',
      type: 'Queue',
      url: 'amqp://localhost:5672',
      status: 'healthy',
      description: 'Product event publishing to RabbitMQ',
      version: 'RabbitMQ 3.12',
      lastChecked: new Date(),
      responseTime: '1ms',
      uptime: '99.9%'
    },
    
    // Product Staging Services
    {
      id: 'product-staging-api',
      name: 'Product Staging API',
      category: 'Product Staging',
      type: 'API',
      url: 'http://localhost:6002',
      status: 'degraded',
      description: 'Product staging environment for pre-production testing',
      version: 'v1.0.0-beta',
      lastChecked: new Date(),
      responseTime: '35ms',
      uptime: '97.8%'
    },
    {
      id: 'product-staging-ingest',
      name: 'Product Staging Ingest',
      category: 'Product Staging',
      type: 'Ingest',
      url: 'http://localhost:9002',
      status: 'degraded',
      description: 'Product staging message ingest service',
      version: 'v1.0.0-beta',
      lastChecked: new Date(),
      responseTime: '40ms',
      uptime: '96.5%'
    },
    {
      id: 'product-staging-db',
      name: 'Product Staging DB',
      category: 'Product Staging',
      type: 'Database',
      url: 'postgresql://localhost:5433/staging_db',
      status: 'degraded',
      description: 'Product staging database',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: '8ms',
      uptime: '98.2%'
    },
    {
      id: 'product-staging-queueing',
      name: 'Product Staging Queueing',
      category: 'Product Staging',
      type: 'Queue',
      url: 'amqp://localhost:5673',
      status: 'unhealthy',
      description: 'Product staging message queue',
      version: 'RabbitMQ 3.12',
      lastChecked: new Date(),
      responseTime: 'timeout',
      uptime: '89.1%'
    },

    // Pricing MDM Services
    {
      id: 'pricing-mdm-ui',
      name: 'Pricing UI',
      category: 'Pricing',
      type: 'UI',
      url: 'http://localhost:3003',
      status: 'healthy',
      description: 'Pricing Master Data Management User Interface',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '10ms',
      uptime: '99.7%'
    },
    {
      id: 'pricing-mdm-api',
      name: 'Pricing API',
      category: 'Pricing',
      type: 'API',
      url: 'http://localhost:6003',
      status: 'healthy',
      description: 'Pricing Master Data Management API',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '12ms',
      uptime: '99.8%'
    },
    {
      id: 'pricing-db',
      name: 'Pricing DB',
      category: 'Pricing',
      type: 'Database',
      url: 'postgresql://localhost:5432/commerce_db',
      status: 'healthy',
      description: 'Pricing database (averis_pricing schema)',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: '3ms',
      uptime: '99.8%'
    },

    // E-Commerce Services
    {
      id: 'averis_ecomm-ui',
      name: 'E-commerce UI',
      category: 'E-Commerce',
      type: 'UI',
      url: 'http://localhost:3004',
      status: 'healthy',
      description: 'E-commerce Customer Interface',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '12ms',
      uptime: '99.1%'
    },
    {
      id: 'averis_ecomm-api',
      name: 'E-commerce API',
      category: 'E-Commerce',
      type: 'API',
      url: 'http://localhost:6004',
      status: 'healthy',
      description: 'E-commerce Platform API with catalog integration',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '25ms',
      uptime: '99.2%'
    },
    {
      id: 'averis_ecomm-db',
      name: 'E-commerce DB',
      category: 'E-Commerce',
      type: 'Database',
      url: 'postgresql://localhost:5432/commerce_db',
      status: 'healthy',
      description: 'E-commerce database (averis_ecomm schema)',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: '4ms',
      uptime: '99.2%'
    },

    // Customer Services
    {
      id: 'customer-api',
      name: 'Customer API',
      category: 'Customer',
      type: 'API',
      url: 'http://localhost:6007',
      status: 'unhealthy',
      description: 'Customer Management API',
      version: 'v0.9.0',
      lastChecked: new Date(),
      responseTime: 'timeout',
      uptime: '87.5%'
    },
    {
      id: 'customer-db',
      name: 'Customer DB',
      category: 'Customer',
      type: 'Database',
      url: 'postgresql://localhost:5436/customer_db',
      status: 'unhealthy',
      description: 'Customer database',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: 'timeout',
      uptime: '87.1%'
    },

    // System Monitor Services
    {
      id: 'commerce-dashboard-ui',
      name: 'Commerce Dashboard UI',
      category: 'Infrastructure',
      type: 'UI',
      url: 'http://localhost:3012',
      status: 'healthy',
      description: 'Centralized dashboard for commerce operations',
      version: 'v1.0.0',
      lastChecked: new Date(),
      responseTime: '5ms',
      uptime: '99.9%'
    },

    // Infrastructure Services
    {
      id: 'rabbitmq',
      name: 'RabbitMQ Message Queue',
      category: 'Infrastructure',
      type: 'Queue',
      url: 'http://localhost:15672',
      status: 'healthy',
      description: 'Message broker for microservice communication',
      version: 'v3.12.0',
      lastChecked: new Date(),
      responseTime: '3ms',
      uptime: '99.9%'
    },
    {
      id: 'postgres-main',
      name: 'PostgreSQL Main DB',
      category: 'Infrastructure',
      type: 'Database',
      url: 'postgresql://localhost:5432',
      status: 'healthy',
      description: 'Main PostgreSQL database server for all schemas',
      version: 'PostgreSQL 16',
      lastChecked: new Date(),
      responseTime: '2ms',
      uptime: '99.9%'
    },
  ]

  useEffect(() => {
    // Simulate loading data
    const loadServices = async () => {
      setLoading(true)
      try {
        // In real implementation, fetch from API
        await new Promise(resolve => setTimeout(resolve, 500))
        setServices(mockServices)
      } catch (err) {
        setError('Failed to load services')
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ServerIcon className="h-5 w-5 text-gray-400" />
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
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  // Sorting logic
  const sortServices = (field) => {
    let direction = 'asc'
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc'
    }
    setSortField(field)
    setSortDirection(direction)
  }

  const getSortedServices = () => {
    let sortedServices = [...services]
    
    // Apply filters first
    if (filterStatus !== 'all') {
      sortedServices = sortedServices.filter(service => service.status === filterStatus)
    }
    
    if (filterType !== 'all') {
      sortedServices = sortedServices.filter(service => service.type === filterType)
    }
    
    // Apply sorting
    sortedServices.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      
      // Handle special cases
      if (sortField === 'responseTime') {
        // Convert response times to numbers for sorting (handle 'timeout')
        aVal = aVal === 'timeout' ? 999999 : parseInt(aVal)
        bVal = bVal === 'timeout' ? 999999 : parseInt(bVal)
      } else if (sortField === 'uptime') {
        // Convert uptime percentage to numbers
        aVal = parseFloat(aVal.replace('%', ''))
        bVal = parseFloat(bVal.replace('%', ''))
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    return sortedServices
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4 text-gray-600" /> : 
      <ArrowDownIcon className="h-4 w-4 text-gray-600" />
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

  const sortedServices = getSortedServices()

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
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
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
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
        >
          <option value="all">All Types</option>
          <option value="UI">UI</option>
          <option value="API">API</option>
          <option value="Database">Database</option>
          <option value="Queue">Queue</option>
          <option value="Ingest">Ingest</option>
          <option value="Cache">Cache</option>
          <option value="Gateway">Gateway</option>
        </select>

        <div className="text-sm text-gray-500 ml-auto">
          Showing {sortedServices.length} of {services.length} services
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Service</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('category')}
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  {getSortIcon('type')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('responseTime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Response</span>
                  {getSortIcon('responseTime')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('uptime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Uptime</span>
                  {getSortIcon('uptime')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
                onClick={() => sortServices('version')}
              >
                <div className="flex items-center space-x-1">
                  <span>Version</span>
                  {getSortIcon('version')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(service.status)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {service.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(service.status)}>
                    {service.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.responseTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.uptime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.version}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a 
                    href={service.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800 truncate block max-w-48"
                  >
                    {service.url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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