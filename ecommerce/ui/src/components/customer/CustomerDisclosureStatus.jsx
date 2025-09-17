import React from 'react'
import { useCustomerDisclosure } from '../../contexts/CustomerDisclosureContext'

/**
 * Customer Disclosure Status Component
 * 
 * Visual indicator of current customer disclosure level and progression
 * Shows Cold → Warm → Hot journey with appropriate styling and actions
 */
const CustomerDisclosureStatus = ({ showActions = false, compact = false }) => {
  const { 
    customerData, 
    disclosureLevel, 
    isAnonymous, 
    hasContactInfo, 
    isAuthenticated,
    loading,
    DISCLOSURE_LEVELS 
  } = useCustomerDisclosure()

  const getStatusConfig = (level) => {
    switch (level) {
      case DISCLOSURE_LEVELS.COLD:
        return {
          label: 'Anonymous Visitor',
          description: 'Browsing without personal information',
          color: 'blue',
          icon: '👤',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        }
      case DISCLOSURE_LEVELS.WARM:
        return {
          label: 'Contact Provided',
          description: 'Basic contact information collected',
          color: 'amber',
          icon: '📧',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200'
        }
      case DISCLOSURE_LEVELS.HOT:
        return {
          label: 'Authenticated User',
          description: 'Fully authenticated with account access',
          color: 'green',
          icon: '✅',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        }
      default:
        return {
          label: 'Unknown',
          description: 'Status unknown',
          color: 'gray',
          icon: '❓',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        }
    }
  }

  const currentStatus = getStatusConfig(disclosureLevel)
  const coldStatus = getStatusConfig(DISCLOSURE_LEVELS.COLD)
  const warmStatus = getStatusConfig(DISCLOSURE_LEVELS.WARM)
  const hotStatus = getStatusConfig(DISCLOSURE_LEVELS.HOT)

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        <span className="text-sm">Loading customer status...</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus.bgColor} ${currentStatus.textColor} ${currentStatus.borderColor} border`}>
        <span className="mr-1">{currentStatus.icon}</span>
        <span>{currentStatus.label}</span>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Status</h3>
        
        {/* Current Status */}
        <div className={`flex items-center p-4 rounded-lg ${currentStatus.bgColor} ${currentStatus.borderColor} border`}>
          <span className="text-2xl mr-3">{currentStatus.icon}</span>
          <div>
            <h4 className={`font-medium ${currentStatus.textColor}`}>
              {currentStatus.label}
            </h4>
            <p className={`text-sm ${currentStatus.textColor} opacity-80`}>
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Authentication Journey</h4>
        <div className="flex items-center justify-between">
          {/* Cold */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              disclosureLevel === DISCLOSURE_LEVELS.COLD ? 
                `${coldStatus.bgColor} ${coldStatus.borderColor}` : 
                disclosureLevel === DISCLOSURE_LEVELS.WARM || disclosureLevel === DISCLOSURE_LEVELS.HOT ?
                  'bg-green-100 border-green-300' : 
                  'bg-gray-100 border-gray-300'
            }`}>
              <span className="text-sm">{coldStatus.icon}</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">Cold</span>
          </div>

          {/* Progress Line 1 */}
          <div className={`flex-1 h-0.5 mx-2 ${
            disclosureLevel === DISCLOSURE_LEVELS.WARM || disclosureLevel === DISCLOSURE_LEVELS.HOT ?
              'bg-green-300' : 'bg-gray-200'
          }`}></div>

          {/* Warm */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              disclosureLevel === DISCLOSURE_LEVELS.WARM ? 
                `${warmStatus.bgColor} ${warmStatus.borderColor}` : 
                disclosureLevel === DISCLOSURE_LEVELS.HOT ?
                  'bg-green-100 border-green-300' : 
                  'bg-gray-100 border-gray-300'
            }`}>
              <span className="text-sm">{warmStatus.icon}</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">Warm</span>
          </div>

          {/* Progress Line 2 */}
          <div className={`flex-1 h-0.5 mx-2 ${
            disclosureLevel === DISCLOSURE_LEVELS.HOT ?
              'bg-green-300' : 'bg-gray-200'
          }`}></div>

          {/* Hot */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              disclosureLevel === DISCLOSURE_LEVELS.HOT ? 
                `${hotStatus.bgColor} ${hotStatus.borderColor}` : 
                'bg-gray-100 border-gray-300'
            }`}>
              <span className="text-sm">{hotStatus.icon}</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">Hot</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Visitor ID:</span>
          <span className="font-mono text-xs">{customerData.visitorCookie?.slice(-8) || 'N/A'}</span>
        </div>
        
        {hasContactInfo && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span>{customerData.firstName} {customerData.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span>{customerData.email}</span>
            </div>
          </>
        )}
        
        {isAuthenticated && customerData.stytchUserId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Account ID:</span>
            <span className="font-mono text-xs">{customerData.stytchUserId.slice(-8)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Page Views:</span>
          <span>{customerData.telemetry?.pageViews || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Cart Items:</span>
          <span>{customerData.telemetry?.cartItems?.length || 0}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Last Activity:</span>
          <span className="text-xs">
            {new Date(customerData.lastActivity).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            {isAnonymous && (
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                Create Account
              </button>
            )}
            
            {hasContactInfo && !isAuthenticated && (
              <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                Complete Authentication
              </button>
            )}
            
            {isAuthenticated && (
              <button className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                View Account
              </button>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 pt-4 border-t border-gray-200">
          <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
          <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded overflow-auto">
            {JSON.stringify({
              disclosureLevel,
              isAnonymous,
              hasContactInfo,
              isAuthenticated,
              visitorCookie: customerData.visitorCookie,
              customerSegment: customerData.customerSegment,
              acquisitionChannel: customerData.acquisitionChannel
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default CustomerDisclosureStatus