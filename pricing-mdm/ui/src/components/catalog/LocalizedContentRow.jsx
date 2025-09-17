import React, { useState, useEffect, useCallback } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeAmericasIcon,
  LanguageIcon,
  CurrencyDollarIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import LocalizationWorkflowStatus from './LocalizationWorkflowStatus'
import { signalRService } from '../../services/signalRService'

/**
 * LocalizedContentRow - Displays localized content for a catalog product
 * Shows an expandable row with locale-specific pricing, content, and status
 */
const LocalizedContentRow = ({ catalogProduct, onToggle, isExpanded = false }) => {
  const [localizedContent, setLocalizedContent] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Define loadLocalizedContent first before using it in useEffect
  const loadLocalizedContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 LocalizedContentRow: Loading localized content for catalogProduct ${catalogProduct.id}`)
      
      // Try direct API call first (this should work in development)
      const response = await fetch(`/api/catalogproduct/${catalogProduct.id}/localized-content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log(`🔄 LocalizedContentRow: Response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`🔄 LocalizedContentRow: Retrieved ${data.length} localized content items:`, data)
        setLocalizedContent(data)
      } else {
        const errorText = await response.text()
        console.log(`🔄 LocalizedContentRow: Error response: ${errorText}`)
        throw new Error(`Failed to load localized content: ${response.status}`)
      }
    } catch (error) {
      console.error('🔄 LocalizedContentRow: Error loading localized content:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [catalogProduct?.id])

  useEffect(() => {
    if (isExpanded && catalogProduct?.id) {
      loadLocalizedContent()
    }
  }, [isExpanded, catalogProduct?.id, loadLocalizedContent])

  // Listen for job completion events to refresh localized content
  useEffect(() => {
    if (!isExpanded || !catalogProduct?.id) return

    const handleJobCompleted = (data) => {
      console.log(`🔄 LocalizedContentRow: Job completed event received, refreshing localized content:`, data)
      // Refresh the localized content when any job completes
      setTimeout(() => {
        console.log(`🔄 LocalizedContentRow: Executing delayed refresh after job completion`)
        loadLocalizedContent()
      }, 1000) // Give the backend time to save the data
    }

    const handleJobComplete = (data) => {
      console.log(`🔄 LocalizedContentRow: JobComplete event received, refreshing localized content:`, data)
      // Also listen for 'JobComplete' event variant
      setTimeout(() => {
        console.log(`🔄 LocalizedContentRow: Executing delayed refresh after JobComplete`)
        loadLocalizedContent()
      }, 1000)
    }

    // Subscribe to job completion events (try both event names)
    const unsubscribe1 = signalRService.subscribe('JobCompleted', handleJobCompleted)
    const unsubscribe2 = signalRService.subscribe('JobComplete', handleJobComplete)

    console.log(`🔄 LocalizedContentRow: Subscribed to job completion events for catalogProduct ${catalogProduct.id}`)

    // Cleanup subscription
    return () => {
      unsubscribe1 && unsubscribe1()
      unsubscribe2 && unsubscribe2()
      console.log(`🔄 LocalizedContentRow: Unsubscribed from job completion events`)
    }
  }, [isExpanded, catalogProduct?.id, loadLocalizedContent])

  const formatPrice = (price, currencyCode = 'USD') => {
    if (!price || price === 'N/A') {
      // Show example pricing based on currency
      const examplePrices = {
        'USD': 899.99,
        'CAD': 1199.99,
        'EUR': 759.99,
        'GBP': 649.99,
        'MXN': 18500.00
      }
      const examplePrice = examplePrices[currencyCode] || 899.99
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(examplePrice)
      return `${formatted} (example)`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price)
  }

  const getTranslationStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckIcon },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckIcon },
      failed: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getExampleLocalizedText = (field, localeCode, originalText) => {
    // If we have actual localized content, use it
    if (originalText && originalText !== 'Not localized') {
      return originalText
    }
    
    // Otherwise show example of what localized content would look like
    const examples = {
      name: {
        'en_CA': 'Cisco Catalyst 2960 Switch (CA)',
        'fr_CA': 'Commutateur Cisco Catalyst 2960',
        'en_US': 'Cisco Catalyst 2960 Switch',
        'es_MX': 'Switch Cisco Catalyst 2960',
        'de_DE': 'Cisco Catalyst 2960 Schalter',
        'fr_FR': 'Commutateur Cisco Catalyst 2960',
        'default': 'Cisco Catalyst 2960 Switch'
      },
      description: {
        'en_CA': 'Enterprise-grade network switch for Canadian businesses',
        'fr_CA': 'Commutateur réseau de qualité entreprise',
        'en_US': 'Enterprise-grade network switching solution',
        'es_MX': 'Solución de conmutación de red empresarial',
        'de_DE': 'Unternehmens-Netzwerk-Switch-Lösung',
        'fr_FR': 'Solution de commutation réseau d\'entreprise',
        'default': 'Enterprise-grade network switching solution'
      }
    }
    
    const localeExamples = examples[field]
    const exampleText = localeExamples?.[localeCode] || localeExamples?.['default'] || 'Example localized content'
    
    return `${exampleText} (example)`
  }

  const truncateText = (text, maxLength = 100, field = 'name', localeCode = 'en_US') => {
    // If we have actual localized content, use it directly without adding "(example)"
    if (text && text !== 'Not localized') {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
    
    // Otherwise show example content
    const displayText = getExampleLocalizedText(field, localeCode, text)
    return displayText.length > maxLength ? displayText.substring(0, maxLength) + '...' : displayText
  }

  // Only render the content when expanded, no trigger row
  return (
    <>
      {/* Expandable content */}
      {isExpanded && (
        <tr className="bg-blue-50 dark:bg-gray-900/10">
          <td colSpan="9" className="px-4 py-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <GlobeAmericasIcon className="h-5 w-5 text-gray-600 mr-2" />
                    Localized Content & Pricing
                  </h4>
                  {localizedContent.length > 0 && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {localizedContent.filter(lc => lc.translationStatus === 'completed' || lc.translationStatus === 'approved').length} of {localizedContent.length} locales have content
                    </span>
                  )}
                </div>

                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-400 mb-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {!loading && !error && localizedContent.length === 0 && (
                  <div className="text-center py-8">
                    <InformationCircleIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No localized content available. Use the Localize button to generate content for different markets.
                    </p>
                  </div>
                )}

                {!loading && !error && localizedContent.length > 0 && (
                  <div className="space-y-2">
                    {localizedContent.map((locale) => {
                      // Determine completion status for colors and badges
                      const hasTranslation = locale.name && locale.name !== 'Not localized' && locale.description && locale.description !== 'Not localized'
                      const hasFinancials = locale.localPrice && locale.localPrice !== 'N/A' && locale.localPrice !== null
                      
                      // Calculate completion percentage (translation + financials)
                      const completionItems = [hasTranslation, hasFinancials]
                      const completedCount = completionItems.filter(Boolean).length
                      const completionPercentage = (completedCount / completionItems.length) * 100
                      
                      // Determine overall status and colors
                      const isFullyComplete = hasTranslation && hasFinancials
                      const isPartiallyComplete = hasTranslation || hasFinancials
                      
                      // Use gray background for all localized content items
                      let bgColor, borderColor, textColor, progressColor
                      if (isFullyComplete) {
                        bgColor = 'bg-gray-100'
                        borderColor = 'border-gray-300'
                        textColor = 'text-gray-800'
                        progressColor = 'bg-green-500'
                      } else if (isPartiallyComplete) {
                        bgColor = 'bg-gray-100'
                        borderColor = 'border-gray-200'
                        textColor = 'text-gray-700'
                        progressColor = 'bg-blue-500'
                      } else {
                        bgColor = 'bg-gray-100'
                        borderColor = 'border-gray-200'
                        textColor = 'text-gray-600'
                        progressColor = 'bg-gray-400'
                      }
                      
                      return (
                        <div 
                          key={locale.localeId} 
                          className={`relative rounded-xl ${bgColor} ${borderColor} border-2 p-2 hover:shadow-sm transition-all duration-200`}
                        >
                          <div className="flex items-center">
                            {/* Locale Icon */}
                            <div className="flex-shrink-0 mr-3">
                              <GlobeAmericasIcon className={`h-4 w-4 ${textColor}`} />
                            </div>
                            
                            {/* Locale Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center text-sm font-medium">
                                <span className={textColor}>
                                  {locale.localeName}
                                </span>
                                {locale.isDefault && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Status Badges - Always show both language and currency with completion status */}
                            <div className="flex-shrink-0 ml-2 flex space-x-1">
                              {/* Language Translation Badge */}
                              <span className={`inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium ${
                                hasTranslation 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}>
                                <LanguageIcon className="h-3 w-3 mr-1" />
                                {hasTranslation ? 'Translated' : 'Pending'}
                              </span>
                              
                              {/* Currency Conversion Badge */}
                              <span className={`inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium ${
                                hasFinancials 
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}>
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                {hasFinancials ? locale.currencyCode : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Localization Workflow Status */}
                <LocalizationWorkflowStatus 
                  catalogProduct={catalogProduct} 
                  isExpanded={isExpanded}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default LocalizedContentRow