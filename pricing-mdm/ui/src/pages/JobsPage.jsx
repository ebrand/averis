import React, { useState, useEffect } from 'react'
import { 
    ClockIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon,
    ChartBarIcon,
    PlayIcon,
    PauseIcon,
    ArrowPathIcon,
    FunnelIcon,
    LanguageIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline'

/**
 * JobsPage - Centralized monitoring for all background jobs and workflows
 * 
 * Features:
 * - Real-time job status monitoring
 * - Filtering by job type, status, and date
 * - Detailed job information and error logs
 * - Job retry and cancellation capabilities
 */
const JobsPage = () => {
    const [jobs, setJobs] = useState([])
    const [workflowJobs, setWorkflowJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showWorkflowJobs, setShowWorkflowJobs] = useState(true)
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        dateRange: '24h'
    })
    const [selectedJob, setSelectedJob] = useState(null)
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
    })

    useEffect(() => {
        loadJobs()
        loadWorkflowJobs()
        
        // Auto-refresh every 3 seconds
        const refreshInterval = setInterval(() => {
            loadJobs()
            loadWorkflowJobs()
        }, 3000)
        return () => clearInterval(refreshInterval)
    }, [filters])

    const loadJobs = async () => {
        try {
            setError(null)
            const response = await fetch(`/api/catalogmanagement/jobs?limit=100`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (response.ok) {
                const jobsData = await response.json()
                setJobs(jobsData)
                calculateStats(jobsData, workflowJobs)
            } else {
                throw new Error('Failed to load background jobs')
            }
        } catch (error) {
            console.error('Error loading background jobs:', error)
            setError(error.message)
        }
    }

    const loadWorkflowJobs = async () => {
        try {
            const response = await fetch(`/api/catalogmanagement/workflow-jobs?limit=100`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (response.ok) {
                const workflowJobsData = await response.json()
                setWorkflowJobs(workflowJobsData)
                calculateStats(jobs, workflowJobsData)
            } else {
                throw new Error('Failed to load workflow jobs')
            }
        } catch (error) {
            console.error('Error loading workflow jobs:', error)
            // Don't set error for workflow jobs since background jobs might still work
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (backgroundJobs = [], workflowJobsData = []) => {
        // Combine stats from both background jobs and workflow jobs
        const allJobs = [...backgroundJobs, ...workflowJobsData]
        const stats = {
            total: allJobs.length,
            pending: allJobs.filter(j => j.status === 'Pending' || j.status === 'pending').length,
            processing: allJobs.filter(j => j.status === 'Processing' || j.status === 'running').length,
            completed: allJobs.filter(j => j.status === 'Completed' || j.status === 'completed').length,
            failed: allJobs.filter(j => j.status === 'Failed' || j.status === 'failed').length
        }
        setStats(stats)
    }

    const shouldShowJob = (job) => {
        const now = new Date()
        const createdAt = new Date(job.createdAt)
        const completedAt = job.completedAt ? new Date(job.completedAt) : null
        
        // Show if in progress
        if (job.status === 'running' || job.status === 'pending' || job.status === 'Processing') {
            return true
        }
        
        // Show if completed within last 2 minutes for workflow jobs
        if (showWorkflowJobs && (job.status === 'completed' || job.status === 'Completed') && completedAt) {
            const minutesAgo = (now - completedAt) / (1000 * 60)
            return minutesAgo <= 2
        }
        
        // For background jobs, use original time-based filtering
        if (!showWorkflowJobs) {
            const hoursAgo = {
                '1h': 1,
                '24h': 24,
                '7d': 24 * 7,
                '30d': 24 * 30
            }[filters.dateRange] || 24

            if (now - createdAt > hoursAgo * 60 * 60 * 1000) {
                return false
            }
        }
        
        return true
    }

    const getFilteredJobs = () => {
        // Choose which jobs to show based on toggle
        const jobsToFilter = showWorkflowJobs ? workflowJobs : jobs
        
        return jobsToFilter.filter(job => {
            // First apply our time/status filter
            if (!shouldShowJob(job)) {
                return false
            }
            
            // Status filter - handle both background job and workflow job status formats
            if (filters.status !== 'all') {
                const jobStatus = job.status.toLowerCase()
                const filterStatus = filters.status.toLowerCase()
                
                // Map workflow job statuses to filter options
                if (filterStatus === 'processing' && jobStatus === 'running') {
                    // Allow 'running' workflow jobs to match 'processing' filter
                } else if (jobStatus !== filterStatus) {
                    return false
                }
            }

            // Type filter - handle both background jobs (type) and workflow jobs (jobType)
            if (filters.type !== 'all') {
                const jobType = job.type || job.jobType || ''
                if (jobType !== filters.type) {
                    return false
                }
            }

            return true
        })
    }

    const formatDuration = (job) => {
        if (job.duration?.totalSeconds) {
            const seconds = Math.round(job.duration.totalSeconds)
            if (seconds < 60) return `${seconds}s`
            if (seconds < 3600) return `${Math.round(seconds / 60)}m`
            return `${Math.round(seconds / 3600)}h`
        }
        
        if (job.startedAt && !job.completedAt) {
            const elapsed = (new Date() - new Date(job.startedAt)) / 1000
            return `${Math.round(elapsed)}s (running)`
        }
        
        return '-'
    }

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />
            case 'failed':
                return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            case 'processing':
            case 'running':
                return <PlayIcon className="h-5 w-5 text-yellow-500" />
            default:
                return <ClockIcon className="h-5 w-5 text-gray-400" />
        }
    }

    const getJobTypeIcon = (type) => {
        switch (type) {
            case 'CalculateLocaleFinancials':
                return '💰'
            case 'GenerateMultiLanguageContent':
                return '🌐'
            case 'RefreshCurrencyRates':
                return '💱'
            case 'UpdateComplianceScreening':
                return '🛡️'
            case 'full_localization':
                return '🌍'
            default:
                return '⚙️'
        }
    }

    const getJobType = (job) => {
        const jobName = job.jobName?.toLowerCase() || ''
        const jobType = (job.type || job.jobType || '').toLowerCase()
        
        if (jobName.includes('financial') || jobName.includes('pricing') || jobType.includes('financial')) {
            return 'financial'
        }
        if (jobName.includes('language') || jobName.includes('translation') || jobName.includes('localization') || jobType.includes('language')) {
            return 'language'
        }
        return 'language' // Default to language for most localization jobs
    }

    const getJobColors = (job) => {
        const jobType = getJobType(job)
        
        if (jobType === 'financial') {
            return {
                bg: 'bg-green-100',
                border: 'border-green-200',
                text: 'text-green-800',
                progress: 'bg-green-500'
            }
        } else {
            return {
                bg: 'bg-blue-100',
                border: 'border-blue-200', 
                text: 'text-blue-800',
                progress: 'bg-blue-500'
            }
        }
    }

    const getCountryLanguageInfo = (job) => {
        const fromLocale = job.fromLocale || 'en_US'
        const toLocale = job.toLocale || 'unknown'
        
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

    const filteredJobs = getFilteredJobs()

    if (loading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {showWorkflowJobs ? 'Workflow Jobs' : 'Background Jobs'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {showWorkflowJobs ? 
                                'Monitor recent and active localization workflows' : 
                                'Monitor background processing jobs'
                            }
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setShowWorkflowJobs(true)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    showWorkflowJobs 
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                Workflows
                            </button>
                            <button
                                onClick={() => setShowWorkflowJobs(false)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                    !showWorkflowJobs 
                                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                Background
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                loadJobs()
                                loadWorkflowJobs()
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total', value: stats.total, color: 'blue' },
                    { label: 'Pending', value: stats.pending, color: 'gray' },
                    { label: 'Processing', value: stats.processing, color: 'yellow' },
                    { label: 'Completed', value: stats.completed, color: 'green' },
                    { label: 'Failed', value: stats.failed, color: 'red' }
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {stat.label}
                                </p>
                                <p className={`text-2xl font-bold text-${stat.color}-600`}>
                                    {stat.value}
                                </p>
                            </div>
                            <ChartBarIcon className={`h-8 w-8 text-${stat.color}-500`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center space-x-4">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="block w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="block w-48 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="all">All Types</option>
                                <option value="CalculateLocaleFinancials">Locale Financials</option>
                                <option value="GenerateMultiLanguageContent">Multi-Language Content</option>
                                <option value="RefreshCurrencyRates">Currency Rates</option>
                                <option value="UpdateComplianceScreening">Compliance Screening</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Time Range
                            </label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                                className="block w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="1h">Last Hour</option>
                                <option value="24h">Last 24h</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Jobs ({filteredJobs.length})
                    </h3>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No jobs found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {showWorkflowJobs ? 'No recent or active workflow jobs to display.' : 'No background jobs match your current filters.'}
                        </p>
                    </div>
                ) : showWorkflowJobs ? (
                    // Workflow Jobs - Horizontal Card Design
                    <div className="p-6 space-y-3">
                        {filteredJobs.map((job) => {
                            const colors = getJobColors(job)
                            const info = getCountryLanguageInfo(job)
                            const progressPercentage = job.progressPercentage || 0
                            const isCompleted = job.status === 'completed'
                            const isRunning = job.status === 'running'
                            
                            return (
                                <div 
                                    key={job.id} 
                                    className={`relative rounded-full ${colors.bg} ${colors.border} border-2 p-3 hover:shadow-md transition-all duration-200 cursor-pointer`}
                                    onClick={() => setSelectedJob(job)}
                                >
                                    <div className="flex items-center">
                                        {/* Job Type Icon */}
                                        <div className="flex-shrink-0 mr-4">
                                            {getJobType(job) === 'financial' ? (
                                                <CurrencyDollarIcon className={`h-5 w-5 ${colors.text}`} />
                                            ) : (
                                                <LanguageIcon className={`h-5 w-5 ${colors.text}`} />
                                            )}
                                        </div>
                                        
                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center text-sm font-medium">
                                                <span className={colors.text}>
                                                    {info.country} {info.language} ({info.code})
                                                </span>
                                            </div>
                                            {job.jobName && (
                                                <div className={`text-xs ${colors.text} opacity-75 mt-0.5`}>
                                                    {job.jobName}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="flex-1 mx-6 relative">
                                            <div className="w-full bg-white bg-opacity-60 rounded-full h-5 overflow-hidden">
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
                                        <div className="flex-shrink-0 ml-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.text} bg-white bg-opacity-70`}>
                                                {isCompleted && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                                                {isRunning && <PlayIcon className="h-3 w-3 mr-1" />}
                                                {job.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                                                {job.status === 'failed' && <ExclamationCircleIcon className="h-3 w-3 mr-1" />}
                                                {job.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Optional: Show additional info for running jobs */}
                                    {isRunning && job.currentStep && (
                                        <div className="mt-2 text-xs text-center">
                                            <span className={`${colors.text} opacity-75`}>
                                                {job.currentStep}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // Background Jobs - Table Design
                    <div className="overflow-x-auto h-screen overflow-y-scroll">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Job
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {showWorkflowJobs ? 'Progress' : 'Entity'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Retries
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredJobs.map((job) => (
                                    <tr 
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-3">{getJobTypeIcon(job.type || job.jobType)}</span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {showWorkflowJobs ? 
                                                            (job.jobName || job.jobType?.replace(/([A-Z])/g, ' $1').trim()) :
                                                            job.type?.replace(/([A-Z])/g, ' $1').trim()
                                                        }
                                                    </div>
                                                    {showWorkflowJobs && (job.catalogCode || job.productSkus || job.localeCodes) && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                                            {job.catalogCode && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Catalog:</span>
                                                                    <span className="font-mono">{job.catalogCode}</span>
                                                                </div>
                                                            )}
                                                            {job.productSkus && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Products:</span>
                                                                    <span className="font-mono">{job.productSkus}</span>
                                                                </div>
                                                            )}
                                                            {job.localeCodes && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Locales:</span>
                                                                    <span className="font-mono">{job.localeCodes}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {job.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(job.status)}
                                                <span className={`ml-2 text-sm font-medium ${
                                                    job.status.toLowerCase() === 'completed' ? 'text-green-600' :
                                                    job.status.toLowerCase() === 'failed' ? 'text-red-600' :
                                                    (job.status.toLowerCase() === 'processing' || job.status.toLowerCase() === 'running') ? 'text-yellow-600' :
                                                    'text-gray-600'
                                                }`}>
                                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {showWorkflowJobs ? (
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span>{job.completedItems || 0} / {job.totalItems || 0}</span>
                                                        <span className="text-gray-500">({job.progressPercentage || 0}%)</span>
                                                    </div>
                                                    {job.failedItems > 0 && (
                                                        <div className="text-red-600 text-xs">
                                                            {job.failedItems} failed
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div>{job.entityType}</div>
                                                    <div className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                        {job.entityId?.substring(0, 12)}...
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {formatDuration(job)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(job.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {job.retryCount || 0} / {job.maxRetries || 3}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Job Detail Modal */}
            {selectedJob && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Job Details
                                </h3>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Job ID
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                        {selectedJob.id}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Type
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedJob.type}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Status
                                    </label>
                                    <div className="mt-1 flex items-center">
                                        {getStatusIcon(selectedJob.status)}
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                            {selectedJob.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Created By
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedJob.createdBy || 'System'}
                                    </p>
                                </div>
                            </div>

                            {selectedJob.parameters && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Parameters
                                    </label>
                                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(selectedJob.parameters, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedJob.result && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Result
                                    </label>
                                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                                        {selectedJob.result}
                                    </pre>
                                </div>
                            )}

                            {selectedJob.errorMessage && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                                        Error Message
                                    </label>
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-3 rounded">
                                        <p className="text-sm text-red-800 dark:text-red-200">
                                            {selectedJob.errorMessage}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default JobsPage