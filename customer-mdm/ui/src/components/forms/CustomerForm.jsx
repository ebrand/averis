import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const CustomerForm = ({ 
  customer = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  isEdit = false 
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerSegment: '',
    disclosureLevel: 'cold',
    status: 'active',
    lifetimeValue: 0,
    acquisitionChannel: '',
    emailVerified: false,
    marketingConsent: false,
    dataProcessingConsent: false,
    visitorFlag: false
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Initialize form with customer data for edit mode
  useEffect(() => {
    if (customer && isEdit) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        customerSegment: customer.customerSegment || '',
        disclosureLevel: customer.disclosureLevel || 'cold',
        status: customer.status || 'active',
        lifetimeValue: customer.lifetimeValue || 0,
        acquisitionChannel: customer.acquisitionChannel || '',
        emailVerified: customer.emailVerified || false,
        marketingConsent: customer.marketingConsent || false,
        dataProcessingConsent: customer.dataProcessingConsent || false,
        visitorFlag: customer.visitorFlag || false
      })
    }
  }, [customer, isEdit])

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return ''
      case 'firstName':
        if (!value.trim()) return 'First name is required'
        if (value.length < 2) return 'First name must be at least 2 characters'
        return ''
      case 'lastName':
        if (!value.trim()) return 'Last name is required'
        if (value.length < 2) return 'Last name must be at least 2 characters'
        return ''
      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number'
        }
        return ''
      case 'lifetimeValue':
        if (value < 0) return 'Lifetime value cannot be negative'
        return ''
      default:
        return ''
    }
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allTouched = {}
    Object.keys(formData).forEach(key => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    if (!validateForm()) {
      return
    }

    // Prepare submit data
    const submitData = {
      ...formData,
      lifetimeValue: parseFloat(formData.lifetimeValue) || 0
    }

    // Add ID for edit mode
    if (isEdit && customer?.id) {
      submitData.id = customer.id
    }

    await onSubmit(submitData)
  }

  const inputClasses = (fieldName) => `
    mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm
    ${errors[fieldName] && touched[fieldName] 
      ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
      : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
    }
  `

  return (
    <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-red-700 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEdit ? 'Edit Customer' : 'Create New Customer'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isEdit ? 'Update customer information' : 'Add a new customer to the system'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`${inputClasses('firstName')} pl-10`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.firstName && touched.firstName && (
                    <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`${inputClasses('lastName')} pl-10`}
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.lastName && touched.lastName && (
                    <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`${inputClasses('email')} pl-10`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`${inputClasses('phone')} pl-10`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerSegment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Segment
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="customerSegment"
                      id="customerSegment"
                      value={formData.customerSegment}
                      onChange={handleInputChange}
                      className={`${inputClasses('customerSegment')} pl-10`}
                      placeholder="e.g., Enterprise, SMB, Individual"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="acquisitionChannel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Acquisition Channel
                  </label>
                  <select
                    name="acquisitionChannel"
                    id="acquisitionChannel"
                    value={formData.acquisitionChannel}
                    onChange={handleInputChange}
                    className={inputClasses('acquisitionChannel')}
                  >
                    <option value="">Select channel</option>
                    <option value="organic_search">Organic Search</option>
                    <option value="paid_search">Paid Search</option>
                    <option value="social_media">Social Media</option>
                    <option value="email_marketing">Email Marketing</option>
                    <option value="referral">Referral</option>
                    <option value="direct">Direct</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="disclosureLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disclosure Level
                  </label>
                  <select
                    name="disclosureLevel"
                    id="disclosureLevel"
                    value={formData.disclosureLevel}
                    onChange={handleInputChange}
                    className={inputClasses('disclosureLevel')}
                  >
                    <option value="cold">Cold (Visitor)</option>
                    <option value="warm">Warm (Registered)</option>
                    <option value="hot">Hot (Authenticated)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={inputClasses('status')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="lifetimeValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lifetime Value
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="lifetimeValue"
                      id="lifetimeValue"
                      value={formData.lifetimeValue}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`${inputClasses('lifetimeValue')} pl-10`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.lifetimeValue && touched.lifetimeValue && (
                    <p className="mt-2 text-sm text-red-600">{errors.lifetimeValue}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Consent & Verification */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Consent & Verification
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="emailVerified"
                    name="emailVerified"
                    type="checkbox"
                    checked={formData.emailVerified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailVerified" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Email Verified
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="marketingConsent"
                    name="marketingConsent"
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketingConsent" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Marketing Communications Consent
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="dataProcessingConsent"
                    name="dataProcessingConsent"
                    type="checkbox"
                    checked={formData.dataProcessingConsent}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="dataProcessingConsent" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Data Processing Consent (GDPR)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    id="visitorFlag"
                    name="visitorFlag"
                    type="checkbox"
                    checked={formData.visitorFlag}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="visitorFlag" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Visitor Flag (Unregistered User)
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {isEdit ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CustomerForm