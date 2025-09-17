import React from 'react'
import { ShieldCheckIcon, KeyIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'
import GoForLaunchApproval from '../GoForLaunchApproval'

const LegalTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  const licenseKeyTypes = [
    'Hardware Lock',
    'Software Key',
    'Online Activation',
    'Subscription Token',
    'Digital Certificate',
    'No License Required'
  ]

  const seatPricingLevels = [
    '1-5 seats',
    '6-25 seats', 
    '26-100 seats',
    '101-500 seats',
    '501-1000 seats',
    '1000+ seats'
  ]

  return (
    <div className="space-y-8">
      {/* License Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <KeyIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">License Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure licensing terms and requirements</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Required */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.license_required_flag || false}
                onChange={(e) => onChange('license_required_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">License Required</span>
            </label>

            {/* License Count */}
            <div>
              <label htmlFor="license_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                License Count
              </label>
              <input
                type="number"
                id="license_count"
                min="0"
                value={formData.license_count || 0}
                onChange={(e) => onChange('license_count', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* License Key Type */}
            <div>
              <label htmlFor="license_key_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                License Key Type
              </label>
              <select
                id="license_key_type"
                value={formData.license_key_type || ''}
                onChange={(e) => onChange('license_key_type', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select License Type</option>
                {licenseKeyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* App ID */}
            <div>
              <label htmlFor="app_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Application ID
              </label>
              <input
                type="number"
                id="app_id"
                value={formData.app_id || 0}
                onChange={(e) => onChange('app_id', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                placeholder="0"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* App Key */}
            <div>
              <label htmlFor="app_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Application Key
              </label>
              <input
                type="number"
                id="app_key"
                value={formData.app_key || 0}
                onChange={(e) => onChange('app_key', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                placeholder="0"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Additional Licenses to Provision */}
          <div>
            <label htmlFor="additional_licenses_to_provision" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Licenses to Provision
            </label>
            <textarea
              id="additional_licenses_to_provision"
              rows={3}
              value={formData.additional_licenses_to_provision || ''}
              onChange={(e) => onChange('additional_licenses_to_provision', e.target.value)}
              disabled={readOnly}
              placeholder="Specify any additional licenses that should be automatically provisioned"
              className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Seat-Based Licensing */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Seat-Based Licensing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure user-based licensing and pricing tiers</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Seat-based flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.seat_based_pricing_flag || false}
                onChange={(e) => onChange('seat_based_pricing_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Seat-Based Pricing</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.seat_adjustment_flag || false}
                onChange={(e) => onChange('seat_adjustment_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow Seat Adjustments</span>
            </label>
          </div>

          {/* Seat pricing levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="seat_min_price_break_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Minimum Seat Price Break Level
              </label>
              <select
                id="seat_min_price_break_level"
                value={formData.seat_min_price_break_level || ''}
                onChange={(e) => onChange('seat_min_price_break_level', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Min Level</option>
                {seatPricingLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seat_max_price_break_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maximum Seat Price Break Level
              </label>
              <select
                id="seat_max_price_break_level"
                value={formData.seat_max_price_break_level || ''}
                onChange={(e) => onChange('seat_max_price_break_level', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Max Level</option>
                {seatPricingLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* License Types & Renewals */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">License Types & Renewals</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure renewal requirements and license groupings</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* First row of checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.renewal_required_flag || false}
                onChange={(e) => onChange('renewal_required_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Renewal Required</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.portal_renewal_flag || false}
                onChange={(e) => onChange('portal_renewal_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Portal Renewal</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.term_license_flag || false}
                onChange={(e) => onChange('term_license_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Term License</span>
            </label>
          </div>

          {/* Second row of checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.grouped_license_flag || false}
                onChange={(e) => onChange('grouped_license_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Grouped License</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.additional_license_flag || false}
                onChange={(e) => onChange('additional_license_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Additional License</span>
            </label>
          </div>

          {/* Help text */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">License Configuration Guidelines</h4>
                <div className="mt-2 text-sm text-green-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Renewal Required:</strong> Customer must renew to continue using the product</li>
                    <li><strong>Portal Renewal:</strong> Renewal can be done through customer portal</li>
                    <li><strong>Term License:</strong> License has a specific term period</li>
                    <li><strong>Grouped License:</strong> Multiple licenses managed as a group</li>
                    <li><strong>Additional License:</strong> Can be added to existing license bundles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="legal"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default LegalTab