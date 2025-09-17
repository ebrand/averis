import React, { useState, useEffect } from 'react'
import { 
    XMarkIcon, 
    CheckIcon, 
    ExclamationTriangleIcon,
    GlobeAmericasIcon,
    LanguageIcon,
    CurrencyDollarIcon,
    ClockIcon,
    PlayIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'

/**
 * LocaleWorkflowModal - Enhanced modal for locale-specific pricing and content workflows
 * 
 * Features:
 * - Locale selection with country/currency information
 * - Workflow template selection
 * - Real-time progress tracking
 * - Integrated pricing and content workflows
 */
const LocaleWorkflowModal = ({ 
    isOpen, 
    onClose, 
    catalogProduct, 
    catalog,
    onWorkflowComplete,
    onWorkflowStarted // New callback for when workflow starts
}) => {
    // State management
    const [step, setStep] = useState(1) // 1: Locale Selection, 2: Workflow Config
    const [availableLocales, setAvailableLocales] = useState([])
    const [selectedLocales, setSelectedLocales] = useState([])
    const [workflowTemplates, setWorkflowTemplates] = useState([])
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [workflowType, setWorkflowType] = useState('full_localization') // locale_financials, multi_language_content, full_localization
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Workflow progress tracking
    const [activeWorkflow, setActiveWorkflow] = useState(null)
    const [progress, setProgress] = useState({
        localeProgress: 0,
        contentProgress: 0,
        overallProgress: 0,
        status: 'pending'
    })

    // Configuration options
    const [config, setConfig] = useState({
        autoApprove: false,
        translationQuality: 'standard',
        requireReview: true,
        includeTaxCalculations: true,
        includeRegulatoryFees: true
    })

    useEffect(() => {
        if (isOpen && catalog) {
            loadAvailableLocales()
            loadWorkflowTemplates()
            if (catalogProduct) {
                loadExistingProgress()
            }
        }
    }, [isOpen, catalog, catalogProduct])

    // Load available locales for the catalog
    const loadAvailableLocales = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/catalogproduct/catalog/${catalog.id}/available-locales`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (response.ok) {
                const allLocales = await response.json()
                
                // Filter out English locales (only show NON-ENGLISH locales for localization)
                const nonEnglishLocales = allLocales.filter(locale => !locale.localeCode.startsWith('en_'))
                setAvailableLocales(nonEnglishLocales)
                
                // Auto-select locales based on existing content and defaults
                const localizedLocales = nonEnglishLocales.filter(l => l.hasContent) // Locales with existing content
                const defaultLocales = nonEnglishLocales.filter(l => l.isDefault && !l.hasContent) // Default locales without content
                const otherLocales = nonEnglishLocales.filter(l => !l.isDefault && !l.hasContent) // Other locales
                
                // Prioritize: locales with content > default locales > other locales
                const prioritizedLocales = [...localizedLocales, ...defaultLocales, ...otherLocales]
                
                setSelectedLocales(prioritizedLocales.map(l => l.localeId))
            } else {
                throw new Error('Failed to load available locales')
            }
        } catch (error) {
            console.error('Error loading locales:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Load workflow templates
    const loadWorkflowTemplates = async () => {
        try {
            const response = await fetch('/api/catalogproduct/workflow-templates', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (response.ok) {
                const templates = await response.json()
                setWorkflowTemplates(templates)
                
                // Auto-select a reasonable default template
                const defaultTemplate = templates.find(t => t.templateName.includes('Quick Localization'))
                if (defaultTemplate) {
                    setSelectedTemplate(defaultTemplate)
                    applyTemplateConfig(defaultTemplate)
                }
            }
        } catch (error) {
            console.error('Error loading workflow templates:', error)
        }
    }

    // Load existing workflow progress
    const loadExistingProgress = async () => {
        try {
            const response = await fetch(`/api/catalogproduct/${catalogProduct.id}/workflow-progress`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (response.ok) {
                const progressData = await response.json()
                setProgress({
                    localeProgress: progressData.localeProgress?.length || 0,
                    contentProgress: progressData.contentProgress?.length || 0,
                    overallProgress: progressData.overallProgress || 0,
                    status: progressData.localWorkflowStatus || 'pending'
                })

                // Don't automatically switch to progress step - user will see progress in expanded row instead
            }
        } catch (error) {
            console.error('Error loading existing progress:', error)
        }
    }

    // Apply template configuration
    const applyTemplateConfig = (template) => {
        if (template?.defaultConfig) {
            setConfig(prev => ({
                ...prev,
                ...template.defaultConfig,
                autoApprove: template.defaultConfig.auto_approve_calculations || prev.autoApprove,
                translationQuality: template.defaultConfig.translation_quality || prev.translationQuality
            }))
        }

        // Set workflow type based on template
        if (template?.templateType) {
            setWorkflowType(template.templateType)
        }
    }

    // Start the workflow
    const startWorkflow = async () => {
        try {
            setLoading(true)
            setError(null)

            const workflowRequest = {
                jobName: `${workflowType.replace('_', ' ')} - ${catalog.name} - ${new Date().toLocaleDateString()}`,
                jobType: workflowType,
                catalogId: catalog.id,
                productIds: [catalogProduct.productId],
                localeIds: selectedLocales,
                templateId: selectedTemplate?.id,
                jobConfig: config,
                createdBy: 'current_user' // Would come from auth context
            }

            let response
            
            if (workflowType === 'locale_financials') {
                // Create individual currency conversion jobs for each locale
                const createdJobs = []
                const targetLocaleCodes = availableLocales
                    .filter(l => selectedLocales.includes(l.localeId))
                    .map(l => l.localeCode)

                for (const targetLocaleCode of targetLocaleCodes) {
                    try {
                        const currencyJobRequest = {
                            jobName: `Currency: ${catalogProduct.product?.name || 'Product'} -> ${targetLocaleCode}`,
                            jobType: 'currency_conversion',
                            catalogId: catalog.id,
                            fromLocale: 'en_US',
                            toLocale: targetLocaleCode,
                            createdBy: 'current_user',
                            jobData: {
                                catalogProductId: catalogProduct.id,
                                productId: catalogProduct.productId,
                                sourceLocaleCode: 'en_US',
                                targetLocaleCode: targetLocaleCode,
                                localeId: availableLocales.find(l => l.localeCode === targetLocaleCode)?.localeId,
                                autoApprove: config.autoApprove || false,
                                includeTaxCalculations: config.includeTaxCalculations || true,
                                includeRegulatoryFees: config.includeRegulatoryFees || true,
                                configuration: config
                            }
                        }

                        const currencyResponse = await fetch('http://api.localhost/localization/api/localization/jobs', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(currencyJobRequest)
                        })

                        if (currencyResponse.ok) {
                            const currencyResult = await currencyResponse.json()
                            createdJobs.push({
                                type: 'currency_conversion',
                                locale: targetLocaleCode,
                                result: currencyResult
                            })
                        }
                    } catch (jobError) {
                        console.error(`Failed to create currency job for locale ${targetLocaleCode}:`, jobError)
                    }
                }

                response = {
                    ok: createdJobs.length > 0,
                    json: () => Promise.resolve({
                        message: `Created ${createdJobs.length} currency conversion jobs`,
                        jobs: createdJobs,
                        totalJobs: createdJobs.length,
                        locales: targetLocaleCodes
                    })
                }
            } else if (workflowType === 'multi_language_content') {
                // Create individual translation jobs for each locale
                const createdJobs = []
                const targetLocaleCodes = availableLocales
                    .filter(l => selectedLocales.includes(l.localeId))
                    .map(l => l.localeCode)

                for (const targetLocaleCode of targetLocaleCodes) {
                    try {
                        const translationJobRequest = {
                            jobName: `Translation: ${catalogProduct.product?.name || 'Product'} -> ${targetLocaleCode}`,
                            jobType: 'translation',
                            catalogId: catalog.id,
                            fromLocale: 'en_US',
                            toLocale: targetLocaleCode,
                            createdBy: 'current_user',
                            jobData: {
                                catalogProductId: catalogProduct.id,
                                productId: catalogProduct.productId,
                                sourceLocaleCode: 'en_US',
                                targetLocaleCode: targetLocaleCode,
                                translationQuality: config.translationQuality || 'standard',
                                requireReview: config.requireReview || false,
                                configuration: config
                            }
                        }

                        const translationResponse = await fetch('http://api.localhost/localization/api/localization/jobs', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(translationJobRequest)
                        })

                        if (translationResponse.ok) {
                            const translationResult = await translationResponse.json()
                            createdJobs.push({
                                type: 'translation',
                                locale: targetLocaleCode,
                                result: translationResult
                            })
                        }
                    } catch (jobError) {
                        console.error(`Failed to create translation job for locale ${targetLocaleCode}:`, jobError)
                    }
                }

                response = {
                    ok: createdJobs.length > 0,
                    json: () => Promise.resolve({
                        message: `Created ${createdJobs.length} translation jobs`,
                        jobs: createdJobs,
                        totalJobs: createdJobs.length,
                        locales: targetLocaleCodes
                    })
                }
            } else {
                // Full localization: create individual jobs for each locale directly in Localization API
                const createdJobs = []
                const targetLocaleCodes = availableLocales
                    .filter(l => selectedLocales.includes(l.localeId))
                    .map(l => l.localeCode)

                // Create individual jobs directly in Localization API
                for (const targetLocaleCode of targetLocaleCodes) {
                    try {
                        // Create translation job in Localization API
                        const translationJobRequest = {
                            jobName: `Translation: ${catalogProduct.product?.name || 'Product'} -> ${targetLocaleCode}`,
                            jobType: 'translation',
                            catalogId: catalog.id,
                            fromLocale: 'en_US',
                            toLocale: targetLocaleCode,
                            createdBy: 'current_user',
                            jobData: {
                                catalogProductId: catalogProduct.id,
                                productId: catalogProduct.productId,
                                sourceLocaleCode: 'en_US',
                                targetLocaleCode: targetLocaleCode,
                                translationQuality: config.translationQuality || 'standard',
                                requireReview: config.requireReview || false,
                                configuration: config
                            }
                        }

                        const translationResponse = await fetch('http://api.localhost/localization/api/localization/jobs', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(translationJobRequest)
                        })

                        if (translationResponse.ok) {
                            const translationResult = await translationResponse.json()
                            createdJobs.push({
                                type: 'translation',
                                locale: targetLocaleCode,
                                result: translationResult
                            })
                        }

                        // Create currency conversion job in Localization API
                        const currencyJobRequest = {
                            jobName: `Currency: ${catalogProduct.product?.name || 'Product'} -> ${targetLocaleCode}`,
                            jobType: 'currency_conversion',
                            catalogId: catalog.id,
                            fromLocale: 'en_US',
                            toLocale: targetLocaleCode,
                            createdBy: 'current_user',
                            jobData: {
                                catalogProductId: catalogProduct.id,
                                productId: catalogProduct.productId,
                                sourceLocaleCode: 'en_US',
                                targetLocaleCode: targetLocaleCode,
                                localeId: availableLocales.find(l => l.localeCode === targetLocaleCode)?.localeId,
                                autoApprove: config.autoApprove || false,
                                includeTaxCalculations: config.includeTaxCalculations || true,
                                includeRegulatoryFees: config.includeRegulatoryFees || true,
                                configuration: config
                            }
                        }

                        const currencyResponse = await fetch('http://api.localhost/localization/api/localization/jobs', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(currencyJobRequest)
                        })

                        if (currencyResponse.ok) {
                            const currencyResult = await currencyResponse.json()
                            createdJobs.push({
                                type: 'currency_conversion',
                                locale: targetLocaleCode,
                                result: currencyResult
                            })
                        }
                    } catch (jobError) {
                        console.error(`Failed to create jobs for locale ${targetLocaleCode}:`, jobError)
                    }
                }

                // Create a summary response
                response = {
                    ok: createdJobs.length > 0,
                    json: () => Promise.resolve({
                        message: `Created ${createdJobs.length} individual jobs`,
                        jobs: createdJobs,
                        totalJobs: createdJobs.length,
                        locales: targetLocaleCodes
                    })
                }
            }

            if (response.ok) {
                const result = await response.json()
                console.log(`🚀 LocaleWorkflowModal: Workflow started successfully:`, result)
                console.log(`🚀 CatalogProduct being passed to onWorkflowStarted:`, catalogProduct)
                console.log(`🚀 WORKFLOW CREATION IDs USED:`, {
                    catalogId: catalog.id,
                    catalogProductId: catalogProduct.id,
                    productId: catalogProduct.productId,
                    catalogProductCatalogId: catalogProduct.catalogId
                })
                setActiveWorkflow(result)
                
                // Close modal and notify parent to expand product row
                onWorkflowStarted && onWorkflowStarted(catalogProduct, result)
                handleClose()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to start workflow')
            }
        } catch (error) {
            console.error('Error starting workflow:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Poll for progress updates
    const startProgressPolling = (jobId) => {
        const pollInterval = setInterval(async () => {
            try {
                // Get overall workflow progress
                const progressResponse = await fetch(`/api/catalogproduct/${catalogProduct.id}/workflow-progress`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })

                // Get detailed job status
                const jobsResponse = await fetch(`/api/catalogmanagement/jobs/entity/${catalogProduct.productId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })

                if (progressResponse.ok) {
                    const progressData = await progressResponse.json()
                    
                    // Enhanced progress tracking with detailed job information
                    let detailedProgress = {
                        localeProgress: progressData.localeProgress?.length || 0,
                        contentProgress: progressData.contentProgress?.length || 0,
                        overallProgress: progressData.overallProgress || 0,
                        status: progressData.localeWorkflowStatus || 'pending',
                        jobs: []
                    }

                    // Add job details if available
                    if (jobsResponse.ok) {
                        const jobsData = await jobsResponse.json()
                        detailedProgress.jobs = jobsData
                        
                        // Calculate progress based on job completion
                        const totalJobs = jobsData.length
                        const completedJobs = jobsData.filter(job => job.status === 'Completed').length
                        const failedJobs = jobsData.filter(job => job.status === 'Failed').length
                        
                        if (totalJobs > 0) {
                            detailedProgress.overallProgress = (completedJobs / totalJobs) * 100
                            detailedProgress.completedJobs = completedJobs
                            detailedProgress.failedJobs = failedJobs
                            detailedProgress.totalJobs = totalJobs
                        }
                    }

                    setProgress(detailedProgress)

                    // Stop polling when complete or failed
                    if (detailedProgress.overallProgress >= 100 || 
                        detailedProgress.status === 'completed' || 
                        detailedProgress.status === 'failed') {
                        clearInterval(pollInterval)
                        onWorkflowComplete && onWorkflowComplete(detailedProgress)
                    }
                }
            } catch (error) {
                console.error('Error polling progress:', error)
                clearInterval(pollInterval)
            }
        }, 1500) // Poll every 1.5 seconds for better responsiveness

        // Cleanup on unmount
        return () => clearInterval(pollInterval)
    }

    // Handle locale selection
    const toggleLocaleSelection = (localeId) => {
        setSelectedLocales(prev => 
            prev.includes(localeId) 
                ? prev.filter(id => id !== localeId)
                : [...prev, localeId]
        )
    }

    // Navigation handlers
    const handleNext = () => {
        if (step === 1 && selectedLocales.length === 0) {
            setError('Please select at least one locale')
            return
        }
        setError(null)
        setStep(step + 1)
    }

    const handleBack = () => {
        setError(null)
        setStep(Math.max(1, step - 1))
    }

    const handleClose = () => {
        setStep(1)
        setSelectedLocales([])
        setError(null)
        setProgress({ localeProgress: 0, contentProgress: 0, overallProgress: 0, status: 'pending' })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <GlobeAmericasIcon className="h-6 w-6 text-green-600 mr-3" />
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Locale-Specific Workflow
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Configure pricing and content for multiple markets
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            {[
                                { number: 1, title: 'Select Locales', icon: GlobeAmericasIcon },
                                { number: 2, title: 'Configure Workflow', icon: LanguageIcon }
                            ].map((stepInfo, index) => (
                                <div key={stepInfo.number} className="flex items-center">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                        step >= stepInfo.number 
                                            ? 'bg-green-600 border-green-600 text-white' 
                                            : 'border-gray-300 text-gray-500'
                                    }`}>
                                        {step > stepInfo.number ? (
                                            <CheckIcon className="h-5 w-5" />
                                        ) : (
                                            <stepInfo.icon className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${
                                            step >= stepInfo.number ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                            {stepInfo.title}
                                        </p>
                                    </div>
                                    {index < 1 && (
                                        <div className={`flex-1 h-0.5 mx-4 ${
                                            step > stepInfo.number ? 'bg-green-600' : 'bg-gray-300'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step Content */}
                    <div className="min-h-[400px]">
                        {/* Step 1: Locale Selection */}
                        {step === 1 && (
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Select Target Locales
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Choose the markets where you want to make this product available with localized pricing and content.
                                </p>

                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableLocales.map((locale) => (
                                            <div
                                                key={locale.localeId}
                                                onClick={() => toggleLocaleSelection(locale.localeId)}
                                                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                                                    selectedLocales.includes(locale.localeId)
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <GlobeAmericasIcon className="h-5 w-5 text-gray-500 mr-2" />
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {locale.countryName}
                                                        </span>
                                                        {locale.isDefault && (
                                                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    {selectedLocales.includes(locale.localeId) && (
                                                        <CheckIcon className="h-5 w-5 text-green-600" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center justify-between">
                                                        <span>{locale.localeName}</span>
                                                        <span className="font-mono">{locale.localeCode}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span>Currency: {locale.currencyCode}</span>
                                                        <span>Priority: {locale.priority}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedLocales.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex items-center">
                                            <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                {selectedLocales.length} locale{selectedLocales.length > 1 ? 's' : ''} selected
                                            </span>
                                        </div>
                                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                            Estimated processing time: {selectedLocales.length * 2} minutes
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Workflow Configuration */}
                        {step === 2 && (
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Configure Workflow
                                </h4>

                                {/* Workflow Type Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Workflow Type
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            {
                                                id: 'locale_financials',
                                                title: 'Pricing Only',
                                                description: 'Calculate locale-specific pricing with taxes and fees',
                                                icon: CurrencyDollarIcon
                                            },
                                            {
                                                id: 'multi_language_content',
                                                title: 'Content Only',
                                                description: 'Generate multi-language product descriptions',
                                                icon: LanguageIcon
                                            },
                                            {
                                                id: 'full_localization',
                                                title: 'Full Localization',
                                                description: 'Complete pricing and content localization',
                                                icon: GlobeAmericasIcon
                                            }
                                        ].map((type) => (
                                            <div
                                                key={type.id}
                                                onClick={() => setWorkflowType(type.id)}
                                                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                                                    workflowType === type.id
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                                                }`}
                                            >
                                                <div className="flex items-center mb-2">
                                                    <type.icon className="h-5 w-5 text-green-600 mr-2" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {type.title}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {type.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Template Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Workflow Template
                                    </label>
                                    <select
                                        value={selectedTemplate?.id || ''}
                                        onChange={(e) => {
                                            const template = workflowTemplates.find(t => t.id === e.target.value)
                                            setSelectedTemplate(template)
                                            if (template) applyTemplateConfig(template)
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">Select a template...</option>
                                        {workflowTemplates
                                            .filter(t => !workflowType || t.templateType === workflowType || t.templateType === 'full_localization')
                                            .map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.templateName} ({template.estimatedSecondsPerItem}s per item)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedTemplate && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {selectedTemplate.description}
                                        </p>
                                    )}
                                </div>

                                {/* Configuration Options */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Configuration Options
                                    </label>
                                    <div className="space-y-4">
                                        {(workflowType === 'locale_financials' || workflowType === 'full_localization') && (
                                            <>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="autoApprove"
                                                        checked={config.autoApprove}
                                                        onChange={(e) => setConfig(prev => ({ ...prev, autoApprove: e.target.checked }))}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="autoApprove" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        Auto-approve financial calculations
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="includeTaxCalculations"
                                                        checked={config.includeTaxCalculations}
                                                        onChange={(e) => setConfig(prev => ({ ...prev, includeTaxCalculations: e.target.checked }))}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="includeTaxCalculations" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        Include tax calculations
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {(workflowType === 'multi_language_content' || workflowType === 'full_localization') && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Translation Quality
                                                    </label>
                                                    <select
                                                        value={config.translationQuality}
                                                        onChange={(e) => setConfig(prev => ({ ...prev, translationQuality: e.target.value }))}
                                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                                                    >
                                                        <option value="standard">Standard</option>
                                                        <option value="high">High Quality</option>
                                                        <option value="premium">Premium</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="requireReview"
                                                        checked={config.requireReview}
                                                        onChange={(e) => setConfig(prev => ({ ...prev, requireReview: e.target.checked }))}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="requireReview" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                        Require manual review of translations
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Estimated Time and Cost */}
                                {selectedTemplate && selectedLocales.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="flex items-center mb-2">
                                            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                Workflow Estimate
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    {selectedLocales.length}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Estimated Time:</span>
                                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                    {Math.ceil(selectedLocales.length * selectedTemplate.estimatedSecondsPerItem / 60)} minutes
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 flex justify-between">
                        <div>
                            {step > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Back
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            {step === 1 && (
                                <button
                                    onClick={handleNext}
                                    disabled={selectedLocales.length === 0}
                                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            )}
                            {step === 2 && (
                                <button
                                    onClick={startWorkflow}
                                    disabled={loading || !selectedTemplate}
                                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <PlayIcon className="h-4 w-4 mr-2" />
                                            Start Workflow
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LocaleWorkflowModal