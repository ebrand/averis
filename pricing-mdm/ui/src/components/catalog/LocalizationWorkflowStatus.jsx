import React, { useEffect } from 'react'
import {
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ArrowPathIcon,
  UserIcon,
  CpuChipIcon,
  WifiIcon,
  LanguageIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useLocalizationWorkflows } from '../../hooks/useLocalizationWorkflows'

const LocalizationWorkflowStatus = ({ catalogProduct, isExpanded }) => {
  const { workflows, loading, error, isConnected, refreshWorkflows } = useLocalizationWorkflows(
    catalogProduct?.catalogId,
    catalogProduct?.id  // Use catalog product ID, not product ID
  )

  // Trigger immediate refresh when the component becomes expanded
  // This ensures new workflows appear immediately after being started
  useEffect(() => {
    if (isExpanded && catalogProduct) {
      console.log(`🔥 LocalizationWorkflowStatus: Expanded! Triggering comprehensive refresh`)
      console.log(`🔥 CatalogProduct:`, catalogProduct)
      console.log(`🔥 Catalog ID: ${catalogProduct?.catalogId}, Product ID: ${catalogProduct?.id}`)
      console.log(`🔥 Expected useLocalizationWorkflows query: catalogId=${catalogProduct?.catalogId}, productId=${catalogProduct?.id}`)
      
      // Multiple refresh attempts with different delays to catch workflows
      // that might be created with slight timing differences
      setTimeout(() => {
        console.log(`🔥 LocalizationWorkflowStatus: Executing immediate refresh (500ms)`)
        refreshWorkflows()
      }, 500)
      
      setTimeout(() => {
        console.log(`🔥 LocalizationWorkflowStatus: Executing delayed refresh (1500ms)`)
        refreshWorkflows()
      }, 1500)
      
      setTimeout(() => {
        console.log(`🔥 LocalizationWorkflowStatus: Executing final refresh (3000ms)`)
        refreshWorkflows()
      }, 3000)
    }
  }, [isExpanded, catalogProduct, refreshWorkflows])

  // Add periodic refresh when expanded to catch new jobs being created
  useEffect(() => {
    if (!isExpanded || !catalogProduct) return

    const interval = setInterval(() => {
      console.log(`⚡ LocalizationWorkflowStatus: Periodic refresh for new jobs`)
      refreshWorkflows()
    }, 2000) // Check every 2 seconds while expanded

    return () => {
      console.log(`⚡ LocalizationWorkflowStatus: Cleaning up periodic refresh`)
      clearInterval(interval)
    }
  }, [isExpanded, catalogProduct, refreshWorkflows])
  
  // Add comprehensive debugging for workflows
  useEffect(() => {
    if (isExpanded) {
      console.log(`🔥 LocalizationWorkflowStatus - Workflows updated:`, workflows)
      console.log(`🔥 Loading: ${loading}, Error: ${error}, Connected: ${isConnected}`)
      console.log(`🔥 Filtered workflows:`, workflows.filter(shouldShowWorkflow))
    }
  }, [workflows, loading, error, isConnected, isExpanded])

  if (!isExpanded) {
    return null
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return ClockIcon
      case 'running':
        return PlayIcon
      case 'completed':
        return CheckIcon
      case 'failed':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500 bg-gray-100'
      case 'running':
        return 'text-blue-600 bg-blue-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A'
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end - start
    const diffSecs = Math.floor(diffMs / 1000)
    const mins = Math.floor(diffSecs / 60)
    const secs = diffSecs % 60
    return `${mins}m ${secs}s`
  }

  const getJobType = (workflow) => {
    const jobName = workflow.jobName?.toLowerCase() || ''
    const jobType = workflow.jobType?.toLowerCase() || ''
    
    if (jobName.includes('financial') || jobName.includes('pricing') || jobType.includes('financial')) {
      return 'financial'
    }
    if (jobName.includes('language') || jobName.includes('translation') || jobName.includes('localization') || jobType.includes('language')) {
      return 'language'
    }
    return 'language' // Default to language for most localization jobs
  }

  const getJobColors = (workflow) => {
    const jobType = getJobType(workflow)
    
    if (jobType === 'financial') {
      return {
        bg: 'bg-green-100',
        border: 'border-green-200',
        text: 'text-green-800',
        progress: 'bg-green-500',
        icon: CurrencyDollarIcon
      }
    } else {
      return {
        bg: 'bg-blue-100',
        border: 'border-blue-200', 
        text: 'text-blue-800',
        progress: 'bg-blue-500',
        icon: LanguageIcon
      }
    }
  }

  const getCountryLanguageInfo = (workflow) => {
    const fromLocale = workflow.fromLocale || 'en_US'
    const toLocale = workflow.toLocale || 'unknown'
    
    // Extract country and language info
    const [fromLang, fromCountry] = fromLocale.split('_')
    const [toLang, toCountry] = toLocale.split('_')
    
    const countryNames = {
      'US': 'United States',
      'GB': 'United Kingdom', 
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'JP': 'Japan',
      'CN': 'China',
      'RU': 'Russia'
    }
    
    const languageNames = {
      'en': 'English',
      'de': 'German', 
      'fr': 'French',
      'it': 'Italian',
      'es': 'Spanish',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ru': 'Russian'
    }
    
    return {
      country: countryNames[toCountry] || toCountry || 'Unknown',
      language: languageNames[toLang] || toLang || 'Unknown',
      code: toLocale
    }
  }

  const shouldShowWorkflow = (workflow) => {
    // Only show workflows that are in progress (pending or running)
    // Do not show completed, failed, or cancelled workflows
    return workflow.status === 'running' || workflow.status === 'pending'
  }

  const filteredWorkflows = workflows.filter(shouldShowWorkflow)

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
          <CpuChipIcon className="h-4 w-4 text-blue-600 mr-2" />
          Localization Workflows
          {isConnected && (
            <span className="ml-2 flex items-center text-xs text-green-600">
              <WifiIcon className="h-3 w-3 mr-1" />
              Live
            </span>
          )}
        </h5>
        <div className="flex items-center space-x-2">
          {filteredWorkflows.length > 0 && (
            <span className="text-xs text-gray-500">
              {filteredWorkflows.filter(w => w.status === 'completed').length} completed, {filteredWorkflows.filter(w => w.status === 'running').length} running
            </span>
          )}
          <button
            onClick={refreshWorkflows}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh workflows"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && workflows.length === 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="mx-auto h-6 w-6 text-red-400 mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && filteredWorkflows.length === 0 && (
        <div className="text-center py-4">
          <ClockIcon className="mx-auto h-6 w-6 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No recent localization workflows to display.
          </p>
        </div>
      )}

      {filteredWorkflows.length > 0 && (
        <div className="space-y-2">
          {filteredWorkflows.map((workflow) => {
            const colors = getJobColors(workflow)
            const info = getCountryLanguageInfo(workflow)
            const progressPercentage = workflow.progressPercentage || 0
            const isCompleted = workflow.status === 'completed'
            const isRunning = workflow.status === 'running'
            const StatusIcon = colors.icon
            
            return (
              <div 
                key={workflow.id} 
                className={`relative rounded-xl ${colors.bg} ${colors.border} border-2 p-2 hover:shadow-sm transition-all duration-200`}
              >
                <div className="flex items-center">
                  {/* Job Type Icon */}
                  <div className="flex-shrink-0 mr-3">
                    <StatusIcon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center text-sm font-medium">
                      <span className={colors.text}>
                        {info.language} ({info.country})
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 mx-4 relative">
                    <div className="w-full bg-white bg-opacity-60 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${colors.progress} bg-opacity-80`}
                        style={{ width: `${Math.max(progressPercentage, isCompleted ? 100 : 5)}%` }}
                      ></div>
                    </div>
                    {isRunning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {progressPercentage}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="flex-shrink-0 ml-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium ${colors.text} bg-white bg-opacity-70`}>
                      {isCompleted && <CheckIcon className="h-3 w-3 mr-1" />}
                      {isRunning && <PlayIcon className="h-3 w-3 mr-1" />}
                      {workflow.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                      {workflow.status === 'failed' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                      {workflow.status}
                    </span>
                  </div>
                </div>
                
                
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LocalizationWorkflowStatus