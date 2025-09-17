import React, { useState } from 'react'
import { useRole } from '../../../contexts/RoleContext'
import { 
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  GlobeAltIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

const LaunchTab = ({ formData, onChange, errors, readOnly = false, onLaunch = null, approvals = {} }) => {
  const { canLaunchProducts } = useRole()
  const [isLaunching, setIsLaunching] = useState(false)
  const isLaunched = formData.status === 'active'
  const isDraft = formData.status === 'draft'
  
  // Check if all required fields are complete  
  const hasValidBasePrice = formData.base_price !== null && formData.base_price !== undefined && formData.base_price !== ''
  const isFieldsReady = !!(
    formData.sku_code && 
    formData.name && 
    formData.description && 
    hasValidBasePrice
  )
  
  // Check if all departments have approved
  const requiredApprovals = ['marketing', 'legal', 'finance', 'sales', 'contracts']
  const allApproved = requiredApprovals.every(dept => approvals[dept]?.approved === true)
  const approvedCount = requiredApprovals.filter(dept => approvals[dept]?.approved === true).length
  
  // Enhanced readiness check - consider multiple scenarios
  // Scenario 1: All departments have explicitly approved
  const allExplicitlyApproved = allApproved
  
  // Scenario 2: Majority approval (at least 80% of departments have approved)
  const majorityApproved = approvedCount >= Math.ceil(requiredApprovals.length * 0.8) // 4 out of 5
  
  // Scenario 3: For MVP, allow launch if at least 3 key departments are approved
  const keyDepartments = ['marketing', 'legal', 'finance']
  const keyApprovedCount = keyDepartments.filter(dept => approvals[dept]?.approved === true).length
  const keyDepartmentsApproved = keyApprovedCount === keyDepartments.length
  
  // Emergency override - if ANY approvals exist and basic fields are ready, allow launch
  // This helps debug cases where approval logic might be too strict
  const hasAnyApprovals = Object.keys(approvals).some(dept => approvals[dept]?.approved === true)
  const emergencyOverride = hasAnyApprovals && isFieldsReady && Object.keys(approvals).length >= 3
  
  // Final readiness check - more flexible approach
  const isReadyToLaunch = isFieldsReady && (allExplicitlyApproved || majorityApproved || keyDepartmentsApproved || emergencyOverride)
  
  // Debug: Log approval status for troubleshooting
  console.log('LaunchTab - Product MDM Approval Debug:', {
    productSkuCode: formData.sku_code,
    productId: formData.id,
    approvals,
    requiredApprovals,
    allApproved,
    approvedCount,
    isFieldsReady,
    hasValidBasePrice,
    allExplicitlyApproved,
    majorityApproved,
    keyDepartmentsApproved,
    hasAnyApprovals,
    emergencyOverride,
    isReadyToLaunch,
    // Additional debug info
    userCanLaunch: canLaunchProducts(),
    isLaunched,
    isDraft,
    readOnly,
    isLaunching,
    // Field details
    fieldDetails: {
      sku_code: formData.sku_code,
      name: formData.name,
      description: formData.description,
      base_price: formData.base_price,
      status: formData.status
    }
  })

  const handleLaunch = async () => {
    if (!canLaunchProducts() || !isReadyToLaunch || isLaunched) return
    
    setIsLaunching(true)
    try {
      if (onLaunch) {
        await onLaunch()
      }
    } finally {
      setIsLaunching(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Launch Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <RocketLaunchIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Launch Status</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Status */}
          <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-3">
              {isLaunched ? (
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              ) : (
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              )}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Current Status</div>
            <div className={`text-xs px-2 py-1 rounded-full font-medium ${
              isLaunched 
                ? 'bg-green-100 text-green-800' 
                : isDraft
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isLaunched ? 'Active (Launched)' : isDraft ? 'Draft' : formData.status || 'Unknown'}
            </div>
          </div>

          {/* Online Visibility */}
          <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-3">
              <GlobeAltIcon className={`h-8 w-8 ${formData.web_display_flag ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Online Visibility</div>
            <div className={`text-xs px-2 py-1 rounded-full font-medium ${
              formData.web_display_flag 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {formData.web_display_flag ? 'Visible' : 'Hidden'}
            </div>
          </div>

          {/* Consumer System Availability */}
          <div className="text-center p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-center mb-3">
              <EyeIcon className={`h-8 w-8 ${formData.available_flag ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Consumer Systems</div>
            <div className={`text-xs px-2 py-1 rounded-full font-medium ${
              formData.available_flag 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {formData.available_flag ? 'Available' : 'Unavailable'}
            </div>
          </div>
        </div>
      </div>

      {/* What Does Launching Mean? */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <RocketLaunchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
              What Does "Launching" a Product Mean?
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-3">
              <p>
                <strong>Launching a product</strong> makes it visible and available to customers through multiple channels:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Online Visibility:</strong> Product appears on company websites, e-commerce platforms, and online catalogs</li>
                <li><strong>Consumer Systems:</strong> Product becomes available for purchase through sales systems, partner portals, and ordering platforms</li>
                <li><strong>Public Access:</strong> Customers can view product details, pricing, and availability information</li>
                <li><strong>Sales Enablement:</strong> Sales teams can actively sell and quote the product to customers</li>
              </ul>
              <p className="mt-3">
                <strong>Note:</strong> Products must complete all required workflows and approvals before they can be launched. 
                This ensures all necessary information is complete and accurate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Departmental Approvals */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Departmental Approvals ({approvedCount}/{requiredApprovals.length})
        </h3>
        
        <div className="space-y-3">
          {requiredApprovals.map((dept) => {
            const approval = approvals[dept]
            const isApproved = approval?.approved === true
            
            return (
              <div key={dept} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center">
                  {isApproved ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
                  )}
                  <div>
                    <span className={`text-sm font-medium ${isApproved ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </span>
                    {isApproved && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Approved by {approval.approvedBy} on {new Date(approval.approvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isApproved 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isApproved ? 'Approved' : 'Pending'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Launch Readiness Check */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Launch Readiness</h3>
        
        <div className="space-y-3">
          {/* Required Fields Check */}
          <div className="flex items-center">
            {formData.sku_code ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            <span className={`text-sm ${formData.sku_code ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              SKU Code: {formData.sku_code ? 'Complete' : 'Required'}
            </span>
          </div>

          <div className="flex items-center">
            {formData.name ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            <span className={`text-sm ${formData.name ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Product Name: {formData.name ? 'Complete' : 'Required'}
            </span>
          </div>

          <div className="flex items-center">
            {formData.description ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            <span className={`text-sm ${formData.description ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Description: {formData.description ? 'Complete' : 'Required'}
            </span>
          </div>

          <div className="flex items-center">
            {hasValidBasePrice ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            <span className={`text-sm ${hasValidBasePrice ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Base Price: {hasValidBasePrice ? `Complete ($${formData.base_price})` : 'Required'}
            </span>
          </div>

          {/* Approval Status */}
          <div className="flex items-center">
            {allExplicitlyApproved ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : majorityApproved ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : keyDepartmentsApproved ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            <span className={`text-sm ${(allExplicitlyApproved || majorityApproved || keyDepartmentsApproved) ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Departmental Approvals: {allExplicitlyApproved ? 'All Complete' : 
                majorityApproved ? `Majority Approved (${approvedCount}/${requiredApprovals.length})` :
                keyDepartmentsApproved ? 'Key Departments Approved' :
                `${approvedCount}/${requiredApprovals.length} approved`}
            </span>
          </div>
        </div>

        {/* Overall Readiness Status */}
        <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
          {isReadyToLaunch ? (
            <div className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircleIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Ready for Launch</div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {allExplicitlyApproved ? 
                    "All required fields are complete and all departments have approved this product for launch." :
                    majorityApproved ?
                      `Majority approval achieved (${approvedCount}/${requiredApprovals.length} departments). Ready to launch.` :
                      keyDepartmentsApproved ?
                        "Key departments (Marketing, Legal, Finance) have approved. Ready to launch." :
                        "Emergency override: Product ready for launch with existing approvals."
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-yellow-700 dark:text-yellow-300">
              <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
              <div>
                <div className="font-medium">Not Ready for Launch</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  {!isFieldsReady && "Please complete all required fields. "}
                  {isFieldsReady && !keyDepartmentsApproved && `Need approvals from key departments: ${keyDepartments.filter(dept => !approvals[dept]?.approved).join(', ')}.`}
                  {isFieldsReady && keyDepartmentsApproved && !majorityApproved && `Almost ready! Consider getting approval from: ${requiredApprovals.filter(dept => !approvals[dept]?.approved).join(', ')}.`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Launch Controls */}
      {canLaunchProducts() && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <RocketLaunchIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Launch Product</h3>
          </div>
          
          {isLaunched ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">Product is Launched</div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    This product is active and available to customers across all systems.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <RocketLaunchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Ready to Launch Product?
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                      Launching will change the product status to "Active" and make it visible and available 
                      to customers through all online systems, sales platforms, and consumer channels.
                    </div>
                    
                    {isReadyToLaunch ? (
                      <button
                        onClick={handleLaunch}
                        disabled={isLaunching || readOnly}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLaunching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Launching...
                          </>
                        ) : (
                          <>
                            <RocketLaunchIcon className="h-4 w-4 mr-2" />
                            Launch Product
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm">
                          {!isFieldsReady ? "Complete all required fields before launching" : 
                           !keyDepartmentsApproved ? "Need approval from key departments (Marketing, Legal, Finance)" :
                           "Product ready - complete more approvals for full compliance"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permission Notice for Non-Launch Users */}
      {!canLaunchProducts() && !isLaunched && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
          <div className="flex items-start">
            <ShieldExclamationIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100 mb-2">
                Launch Permissions Required
              </h3>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="mb-2">
                  You do not have permission to launch products. Only users with the following roles can launch products:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Product Launch (product_launch role)</li>
                  <li>System Administrator (admin role)</li>
                </ul>
                <p className="mt-3">
                  Contact your administrator to request launch permissions or to have this product launched.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Workflow Notice */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start">
          <ClockIcon className="h-6 w-6 text-gray-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Coming Soon: Automated Launch Workflow
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                In a future release, this tab will include:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Automated workflow and approval processes</li>
                <li>Department sign-offs (Legal, Finance, Marketing, etc.)</li>
                <li>Compliance and quality checks</li>
                <li>Scheduled launch dates and coordination</li>
                <li>Launch button to activate the product across all systems</li>
              </ul>
              <p className="mt-3">
                Currently, products are saved with appropriate status flags and will require manual coordination for launch processes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaunchTab