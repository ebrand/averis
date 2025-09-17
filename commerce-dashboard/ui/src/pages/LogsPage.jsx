import React, { useState, useEffect, useCallback } from 'react'
import { DocumentTextIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'

const LogsPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connection, setConnection] = useState(null)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [filterLevel, setFilterLevel] = useState('warning-and-above') // Default to warnings and errors
  const [filterService, setFilterService] = useState('all')
  
  // Available services for filtering
  const [services, setServices] = useState(new Set())

  // System API logs endpoint - aggregates all service logs
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const SYSTEM_API_LOGS_URL = `${apiBaseUrl}/logs`

  // Handle real-time log updates from SignalR
  const handleRealTimeLogUpdate = useCallback((logEntry) => {
    console.log('Received real-time log update:', logEntry)
    
    setLogs(currentLogs => {
      const newLog = {
        id: logEntry.id,
        timestamp: new Date(logEntry.timestamp),
        level: logEntry.level,
        source: logEntry.source,
        message: logEntry.message,
        exception: logEntry.exception,
        service: logEntry.service || logEntry.source
      }
      
      // Add to beginning of logs array and keep last 200 entries
      const updatedLogs = [newLog, ...currentLogs].slice(0, 200)
      
      // Update services set
      setServices(prevServices => new Set([...prevServices, newLog.service]))
      
      return updatedLogs
    })
  }, [])

  // Setup SignalR connection for real-time log updates
  useEffect(() => {
    let isCancelled = false
    let newConnection = null

    const initializeSignalR = async () => {
      try {
        console.log('LogsPage: Initializing SignalR connection...')
        
        newConnection = new HubConnectionBuilder()
          .withUrl(`${apiBaseUrl}/logsHub`, {
            transport: HttpTransportType.WebSockets,
            logMessageContent: true,
            logger: LogLevel.Information
          })
          .withAutomaticReconnect()
          .build()

        // Set up event handlers before starting connection
        newConnection.on('LogEntryReceived', (logData) => {
          if (!isCancelled) {
            handleRealTimeLogUpdate(logData)
          }
        })

        newConnection.onreconnecting = () => {
          console.log('SignalR: Reconnecting to logs hub...')
          if (!isCancelled) {
            setIsRealTimeConnected(false)
          }
        }

        newConnection.onreconnected = () => {
          console.log('SignalR: Reconnected to logs hub')
          if (!isCancelled) {
            setIsRealTimeConnected(true)
          }
        }

        newConnection.onclose = (error) => {
          console.log('SignalR: Connection closed', error)
          if (!isCancelled) {
            setIsRealTimeConnected(false)
            setConnection(null)
          }
        }

        // Start the connection
        console.log('SignalR: Starting logs connection...')
        await newConnection.start()
        console.log('SignalR: Logs connection established successfully')
        
        if (!isCancelled) {
          setIsRealTimeConnected(true)
          setConnection(newConnection)
        }
      } catch (err) {
        console.error('SignalR connection failed:', err)
        if (!isCancelled) {
          setError(`Failed to connect to log stream: ${err.message}`)
        }
      }
    }

    initializeSignalR()

    return () => {
      isCancelled = true
      if (newConnection) {
        console.log('SignalR: Cleaning up logs connection...')
        newConnection.stop()
      }
    }
  }, [handleRealTimeLogUpdate])

  // Fetch initial logs
  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(SYSTEM_API_LOGS_URL)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      const processedLogs = data.logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))
      
      setLogs(processedLogs)
      
      // Extract unique services for filtering
      const uniqueServices = new Set(processedLogs.map(log => log.service))
      setServices(uniqueServices)
      
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(`Failed to load logs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Get log level icon and color
  const getLogLevelInfo = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
      case 'ERR':
      case 'FATAL':
      case 'FTL':
        return { 
          icon: XCircleIcon, 
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'WARNING':
      case 'WARN':
      case 'WRN':
        return { 
          icon: ExclamationTriangleIcon, 
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'SUCCESS':
        return { 
          icon: CheckCircleIcon, 
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      default:
        return { 
          icon: InformationCircleIcon, 
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
    }
  }

  // Filter logs based on selected criteria
  const filteredLogs = logs.filter(log => {
    let levelMatch = false
    
    if (filterLevel === 'all') {
      levelMatch = true
    } else if (filterLevel === 'warning-and-above') {
      // Only show warnings, errors, and fatal logs
      const level = log.level?.toLowerCase()
      levelMatch = level === 'warning' || level === 'warn' || level === 'wrn' ||
                   level === 'error' || level === 'err' ||
                   level === 'fatal' || level === 'ftl'
    } else {
      levelMatch = log.level?.toLowerCase() === filterLevel.toLowerCase()
    }
    
    const serviceMatch = filterService === 'all' || log.service === filterService
    return levelMatch && serviceMatch
  })

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center">
            <XCircleIcon className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-red-800">Error Loading Logs</h2>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={fetchLogs}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                <p className="text-sm text-gray-600">
                  Real-time log monitoring across all services
                  {isRealTimeConnected && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="ml-1 text-green-600 font-medium">Live</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
                {filterLevel !== 'all' && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Filtered: {filterLevel === 'warning-and-above' ? 'Warnings & Errors Only' : filterLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Log Filters</h3>
            <button
              onClick={() => setFilterLevel(filterLevel === 'all' ? 'warning-and-above' : 'all')}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {filterLevel === 'all' ? 'Hide INFO logs' : 'Show all logs'}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-[300px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="warning-and-above">Warnings & Errors (Default)</option>
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings Only</option>
                <option value="info">Info Only</option>
                <option value="debug">Debug Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Service
              </label>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-[300px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Services</option>
                {Array.from(services).sort().map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Log Entries</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[800px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No log entries match the selected filters</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const levelInfo = getLogLevelInfo(log.level)
                const LevelIcon = levelInfo.icon
                
                return (
                  <div 
                    key={log.id} 
                    className={`p-4 hover:bg-gray-50 ${levelInfo.bgColor} border-l-4 ${levelInfo.borderColor}`}
                  >
                    <div className="flex items-start">
                      <LevelIcon className={`h-5 w-5 ${levelInfo.color} mr-3 mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelInfo.color} bg-white border`}>
                              {log.level?.toUpperCase() || 'INFO'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                              {log.service}
                            </span>
                          </div>
                          <time className="text-sm text-gray-500 flex-shrink-0">
                            {formatTimestamp(log.timestamp)}
                          </time>
                        </div>
                        <p className="text-sm text-gray-900 break-words">
                          {log.source && log.source !== log.service && (
                            <span className="text-gray-600 font-medium">{log.source}: </span>
                          )}
                          {log.message}
                        </p>
                        {log.exception && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs font-mono text-red-800 overflow-x-auto">
                            {log.exception}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogsPage