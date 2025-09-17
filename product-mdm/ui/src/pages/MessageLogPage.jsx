import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import messageLogService from '../services/messageLogService'
import signalRService from '../services/signalRService'
import { 
  ChatBubbleLeftRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const MessageLogPage = () => {
  const { userProfile } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  const [signalRConnected, setSignalRConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [metadata, setMetadata] = useState(null)

  // Fetch message log using real service
  const fetchMessageLog = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const options = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim(),
        type: typeFilter,
        status: statusFilter,
        source: sourceFilter
      }
      
      const result = await messageLogService.getMessageLog(options)
      
      setMessages(result.messages || [])
      setTotalCount(result.pagination?.total || 0)
      setMetadata(result.metadata)
      setLastRefreshTime(new Date())
      
    } catch (err) {
      console.error('Error fetching message log:', err)
      setError(err.message)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // SignalR setup and real-time message handling
  useEffect(() => {
    let unsubscribeMessage, unsubscribeConnection

    const setupSignalR = async () => {
      try {
        // Connect to SignalR
        await signalRService.connect()
        
        // Subscribe to message created events
        unsubscribeMessage = signalRService.onMessageCreated((messageData) => {
          console.log('📨 Received SignalR message:', messageData)
          
          // Add new message to the top of the list if we're on page 1
          if (currentPage === 1) {
            setMessages(prevMessages => {
              // Transform SignalR message to match our expected format
              const newMessage = {
                id: messageData.id,
                timestamp: messageData.createdAt,
                type: messageData.eventType,
                status: messageData.messageType,
                source: messageData.sourceSystem === 'product-mdm' ? 'Product MDM' : 
                       messageData.sourceSystem === 'product-staging' ? 'Product Staging Ingest' : 
                       messageData.sourceSystem,
                productId: messageData.productId,
                productName: messageData.productName || `Product ${messageData.productId}`,
                sku: messageData.productSku || `SKU-${messageData.productId}`,
                processingTime: messageData.processingTimeMs || 100,
                retryCount: messageData.retryCount || 0,
                errorMessage: messageData.errorMessage
              }
              
              // Add to beginning and remove duplicates
              return [newMessage, ...prevMessages.filter(m => m.id !== newMessage.id)]
            })
            
            // Update total count
            setTotalCount(prev => prev + 1)
            setLastRefreshTime(new Date())
          } else {
            // If not on first page, just refresh to get accurate count
            fetchMessageLog()
          }
        })

        // Subscribe to connection status changes
        unsubscribeConnection = signalRService.onConnectionStatusChanged((status, error) => {
          setConnectionStatus(status)
          setSignalRConnected(status === 'connected')
        })

        // Set initial connection status
        setConnectionStatus(signalRService.getConnectionStatus())
        setSignalRConnected(signalRService.getConnectionStatus() === 'connected')

      } catch (error) {
        console.error('Failed to setup SignalR:', error)
        setConnectionStatus('error')
        setSignalRConnected(false)
      }
    }

    setupSignalR()

    // Cleanup
    return () => {
      if (unsubscribeMessage) unsubscribeMessage()
      if (unsubscribeConnection) unsubscribeConnection()
    }
  }, [currentPage]) // Re-run when page changes

  // Initial load
  useEffect(() => {
    fetchMessageLog()
  }, [currentPage, typeFilter, statusFilter, sourceFilter])

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchMessageLog()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Auto-refresh (only if SignalR is not connected or user prefers polling)
  useEffect(() => {
    let interval
    if (autoRefresh && !signalRConnected) {
      interval = setInterval(fetchMessageLog, 30000) // Refresh every 30 seconds
    }
    return () => interval && clearInterval(interval)
  }, [autoRefresh, signalRConnected, currentPage, typeFilter, statusFilter, sourceFilter, searchTerm])

  const handleRefresh = () => {
    fetchMessageLog()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { icon: ArrowUpIcon, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Published' },
      consumed: { icon: CheckCircleIcon, color: 'text-green-700 bg-green-50 border-green-200', label: 'Consumed' },
      failed: { icon: XCircleIcon, color: 'text-red-700 bg-red-50 border-red-200', label: 'Failed' },
      pending: { icon: ClockIcon, color: 'text-yellow-700 bg-yellow-50 border-yellow-200', label: 'Pending' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getTypeIcon = (type, source) => {
    if (source === 'Product MDM') {
      return <ArrowUpIcon className="h-4 w-4 text-blue-600" />
    } else {
      return <ArrowDownIcon className="h-4 w-4 text-green-600" />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-blue-600" />
            Message Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time log of messages published by Product MDM and consumed by staging services
          </p>
          <div className="flex items-center space-x-4 mt-2">
            {lastRefreshTime && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastRefreshTime.toLocaleString()}
              </p>
            )}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                signalRConnected ? 'bg-green-500' : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' 
                  ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {signalRConnected ? 'Live updates (SignalR)' : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' 
                  ? 'Connecting...' : connectionStatus === 'error' ? 'Connection error' : 'Polling mode'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center">
            <label htmlFor="auto-refresh" className="text-sm text-gray-600 dark:text-gray-300 mr-2">
              Auto-refresh
            </label>
            <input
              id="auto-refresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Messages
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search"
                type="text"
                placeholder="Search by product, SKU, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Message Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message Type
            </label>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="product.created">Product Created</option>
                <option value="product.updated">Product Updated</option>
                <option value="product.launched">Product Launched</option>
                <option value="product.deactivated">Product Deactivated</option>
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="consumed">Consumed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source Filter
            </label>
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="source-filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sources</option>
                <option value="Product MDM">Product MDM</option>
                <option value="Product Staging Ingest">Product Staging Ingest</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{totalCount.toLocaleString()}</span> messages found
              {searchTerm && (
                <span> matching "{searchTerm}"</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading message log</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Message Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Processing
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">No messages found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {searchTerm ? `No messages match "${searchTerm}"` : 'No messages have been logged yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {formatDate(message.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(message.type, message.source)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {message.source}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {message.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {message.productName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {message.sku}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(message.status)}
                      {message.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {message.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {message.processingTime}ms
                      </div>
                      {message.retryCount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {message.retryCount} retries
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount.toLocaleString()}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Message Flow Information</p>
            <p className="mt-1">
              Messages with an <ArrowUpIcon className="inline h-4 w-4 mx-1" /> icon represent messages published by Product MDM.
              Messages with an <ArrowDownIcon className="inline h-4 w-4 mx-1" /> icon represent messages consumed by Product Staging Ingest.
              Auto-refresh is enabled by default to show real-time message activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageLogPage