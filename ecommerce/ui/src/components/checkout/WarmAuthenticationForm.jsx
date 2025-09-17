import React, { useState } from 'react'
import { useCustomerDisclosure } from '../../contexts/CustomerDisclosureContext'

/**
 * Warm Authentication Form
 * 
 * Handles the Cold → Warm upgrade during checkout process
 * Collects customer contact information and billing details
 */
const WarmAuthenticationForm = ({ onComplete, onExistingCustomer }) => {
  const { upgradeToWarm, customerData, loading } = useCustomerDisclosure()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    dataProcessingConsent: false,
    marketingConsent: false
  })
  
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('billingAddress.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
    
    if (!formData.billingAddress.street.trim()) newErrors['billingAddress.street'] = 'Street address is required'
    if (!formData.billingAddress.city.trim()) newErrors['billingAddress.city'] = 'City is required'
    if (!formData.billingAddress.state.trim()) newErrors['billingAddress.state'] = 'State is required'
    if (!formData.billingAddress.zipCode.trim()) newErrors['billingAddress.zipCode'] = 'ZIP code is required'
    
    if (!formData.dataProcessingConsent) newErrors.dataProcessingConsent = 'Data processing consent is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      const updatedCustomer = await upgradeToWarm(formData)
      onComplete?.(updatedCustomer)
      
    } catch (error) {
      if (error.message === 'EXISTING_CUSTOMER_FOUND') {
        // Handle existing customer scenario
        onExistingCustomer?.(formData.email)
      } else {
        console.error('Failed to upgrade to warm authentication:', error)
        setErrors({ submit: error.message || 'Failed to save customer information' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getErrorMessage = (field) => errors[field]
  const hasError = (field) => Boolean(errors[field])

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contact & Billing Information</h2>
        <p className="text-gray-600 mt-2">
          We need some basic information to process your order and keep you updated.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError('firstName') ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || submitting}
            />
            {hasError('firstName') && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage('firstName')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError('lastName') ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || submitting}
            />
            {hasError('lastName') && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage('lastName')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError('email') ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || submitting}
            />
            {hasError('email') && (
              <p className="text-red-600 text-sm mt-1">{getErrorMessage('email')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || submitting}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="billingAddress.street"
                value={formData.billingAddress.street}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasError('billingAddress.street') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading || submitting}
              />
              {hasError('billingAddress.street') && (
                <p className="text-red-600 text-sm mt-1">{getErrorMessage('billingAddress.street')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="billingAddress.city"
                  value={formData.billingAddress.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('billingAddress.city') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || submitting}
                />
                {hasError('billingAddress.city') && (
                  <p className="text-red-600 text-sm mt-1">{getErrorMessage('billingAddress.city')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="billingAddress.state"
                  value={formData.billingAddress.state}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('billingAddress.state') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || submitting}
                />
                {hasError('billingAddress.state') && (
                  <p className="text-red-600 text-sm mt-1">{getErrorMessage('billingAddress.state')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="billingAddress.zipCode"
                  value={formData.billingAddress.zipCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('billingAddress.zipCode') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || submitting}
                />
                {hasError('billingAddress.zipCode') && (
                  <p className="text-red-600 text-sm mt-1">{getErrorMessage('billingAddress.zipCode')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consent & Privacy */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Consent</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                name="dataProcessingConsent"
                checked={formData.dataProcessingConsent}
                onChange={handleInputChange}
                className={`mt-1 mr-3 ${hasError('dataProcessingConsent') ? 'text-red-500' : ''}`}
                disabled={loading || submitting}
              />
              <label className="text-sm text-gray-700">
                <span className="font-medium">I consent to data processing</span> - I agree to Averis processing my personal data for order fulfillment and customer service. *
              </label>
            </div>
            {hasError('dataProcessingConsent') && (
              <p className="text-red-600 text-sm ml-6">{getErrorMessage('dataProcessingConsent')}</p>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleInputChange}
                className="mt-1 mr-3"
                disabled={loading || submitting}
              />
              <label className="text-sm text-gray-700">
                I would like to receive marketing communications about new products and special offers. (Optional)
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="border-t pt-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current Status:</span> Anonymous Visitor → Contact Information
            </div>
            
            <button
              type="submit"
              disabled={loading || submitting}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </form>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h4 className="font-medium mb-2">Debug: Current Customer Data</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(customerData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default WarmAuthenticationForm