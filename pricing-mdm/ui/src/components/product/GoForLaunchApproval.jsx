import React, { useState } from 'react'
import { useRole } from '../../contexts/RoleContext'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { LAUNCH_CRITERIA, isTabReadyForApproval, getTabCompletionStatus } from '../../config/launchCriteria'

const GoForLaunchApproval = ({ 
  tabId, 
  formData, 
  approvals = {}, 
  onApprove = null, 
  onScrub = null,
  readOnly = false 
}) => {
  const { canApproveTab, currentRole } = useRole()
  const [isApproving, setIsApproving] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)
  
  const criteria = LAUNCH_CRITERIA[tabId]
  const canApprove = canApproveTab(tabId)
  const isApproved = approvals[tabId]?.approved || false
  const approvedBy = approvals[tabId]?.approvedBy
  const approvedAt = approvals[tabId]?.approvedAt
  const isReady = isTabReadyForApproval(formData, tabId)
  const completionStatus = getTabCompletionStatus(formData, tabId)

  if (!criteria) return null

  const handleApprove = async () => {
    if (!canApprove || !isReady || isApproved || readOnly) return
    
    setIsApproving(true)
    try {
      if (onApprove) {
        await onApprove(tabId)
      }
    } finally {
      setIsApproving(false)
    }
  }

  const handleScrub = async () => {
    if (!canApprove || !isApproved || readOnly) return
    
    setIsScrubbing(true)
    try {
      if (onScrub) {
        await onScrub(tabId)
      }
    } finally {
      setIsScrubbing(false)
    }
  }

  const getStatusIcon = () => {
    if (isApproved) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />
    }
    if (isReady) {
      return <ClockIcon className="h-6 w-6 text-green-500" />
    }
    return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
  }

  const getStatusText = () => {
    if (isApproved) {
      return { 
        title: 'Go for Launch - Approved', 
        description: `Approved by ${approvedBy} on ${new Date(approvedAt).toLocaleDateString()}`,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-900 dark:text-green-100'
      }
    }
    if (isReady) {
      return { 
        title: 'Ready for Go for Launch', 
        description: 'All required fields are complete and ready for departmental Go for Launch approval',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-900 dark:text-green-100'
      }
    }
    return { 
      title: 'Incomplete', 
      description: `${completionStatus.completed}/${completionStatus.total} required fields completed (${completionStatus.percentage}%)`,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    }
  }

  const status = getStatusText()

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Go for Launch - {criteria.name}
          </h3>
        </div>
        {getStatusIcon()}
      </div>

      {/* Status Overview */}
      <div className={`p-4 rounded-lg border ${status.bgColor} ${status.borderColor} mb-6`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`font-medium ${status.textColor} mb-1`}>
              {status.title}
            </div>
            <div className={`text-sm ${status.textColor.replace('900', '700').replace('100', '300')}`}>
              {status.description}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {/* Go for Launch Button */}
            {canApprove && isReady && !isApproved && !readOnly && (
              <button
                onClick={handleApprove}
                disabled={isApproving || isScrubbing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Go for Launch
                  </>
                )}
              </button>
            )}
            
            {/* Scrub Launch Button */}
            {canApprove && isApproved && !readOnly && (
              <button
                onClick={handleScrub}
                disabled={isScrubbing || isApproving}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isScrubbing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scrubbing...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Scrub Launch
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Required Fields Checklist */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Required Fields ({completionStatus.completed}/{completionStatus.total})
        </h4>
        <div className="space-y-2">
          {criteria.requiredFields.map((fieldCriteria, index) => {
            const isComplete = formData[fieldCriteria.field] && 
              (typeof formData[fieldCriteria.field] === 'string' 
                ? formData[fieldCriteria.field].trim().length > 0
                : true)
            
            return (
              <div key={index} className="flex items-center">
                {isComplete ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                )}
                <div className="flex-1">
                  <span className={`text-sm font-medium ${isComplete ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {fieldCriteria.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {fieldCriteria.description}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Go for Launch Checklist
        </h4>
        <div className="space-y-2">
          {criteria.checklistItems.map((item, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
              </div>
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {item}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Note: This checklist is for reference. Approvers should verify these items before giving Go for Launch approval.
        </div>
      </div>

      {/* Permission Notice for Non-Approval Users */}
      {!canApprove && !isApproved && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Go for Launch Permission Required</p>
              <p>
                Only users with the {criteria.name} approval role can give Go for Launch approval for this section.
                Contact your {criteria.name.toLowerCase()} team lead for Go for Launch approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoForLaunchApproval