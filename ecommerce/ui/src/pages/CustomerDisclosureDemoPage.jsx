import React, { useState } from 'react'
import { CustomerDisclosureProvider } from '../contexts/CustomerDisclosureContext'
import CustomerDisclosureStatus from '../components/customer/CustomerDisclosureStatus'
import WarmAuthenticationForm from '../components/checkout/WarmAuthenticationForm'

/**
 * Customer Disclosure Demo Page
 * 
 * Interactive demonstration of the Cold → Warm → Hot customer authentication journey
 * Shows how customer data evolves through each disclosure level
 */
const CustomerDisclosureDemoPage = () => {
  const [currentStep, setCurrentStep] = useState('overview')
  const [mockExistingCustomer, setMockExistingCustomer] = useState(null)

  const handleWarmComplete = (updatedCustomer) => {
    console.log('Warm authentication completed:', updatedCustomer)
    setCurrentStep('warm-complete')
  }

  const handleExistingCustomer = (email) => {
    console.log('Existing customer found:', email)
    setMockExistingCustomer(email)
    setCurrentStep('existing-customer')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                🎯 Averis Customer Disclosure System Demo
              </h2>
              <p className="text-blue-800 mb-4">
                This demonstrates the graduated disclosure model for customer authentication, 
                implementing the psychological security boundaries we discussed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl mb-2">🥶 Cold</div>
                  <h4 className="font-semibold mb-2">Anonymous Visitor</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Visitor cookie tracking</li>
                    <li>• Session data collection</li>
                    <li>• Cart & telemetry</li>
                    <li>• No personal info</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl mb-2">🔥 Warm</div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Name & email provided</li>
                    <li>• Billing address</li>
                    <li>• Consent preferences</li>
                    <li>• Email verification option</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl mb-2">🚀 Hot</div>
                  <h4 className="font-semibold mb-2">Authenticated User</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Stytch SSO integration</li>
                    <li>• Full account access</li>
                    <li>• Purchase history</li>
                    <li>• Personalized experience</li>
                  </ul>
                </div>
              </div>
            </div>

            <CustomerDisclosureStatus showActions={true} />

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep('warm-form')}
                className="px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700"
              >
                Demo: Upgrade to Warm
              </button>
              <button
                onClick={() => setCurrentStep('hot-form')}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Demo: Upgrade to Hot
              </button>
            </div>
          </div>
        )

      case 'warm-form':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentStep('overview')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Overview
              </button>
              <h2 className="text-xl font-semibold">Cold → Warm Authentication Demo</h2>
            </div>
            
            <WarmAuthenticationForm
              onComplete={handleWarmComplete}
              onExistingCustomer={handleExistingCustomer}
            />
          </div>
        )

      case 'warm-complete':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentStep('overview')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Overview
              </button>
              <h2 className="text-xl font-semibold">Warm Authentication Complete!</h2>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">✅</span>
                <h3 className="text-lg font-semibold text-green-900">
                  Successfully upgraded to Warm disclosure level
                </h3>
              </div>
              <p className="text-green-800 mb-4">
                Customer contact information has been collected and stored in the 
                <code className="bg-green-100 px-2 py-1 rounded">averis_customer.customers</code> table 
                with <code>disclosure_level = 'warm'</code>.
              </p>
            </div>

            <CustomerDisclosureStatus showActions={true} />

            <div className="bg-white p-6 border rounded-lg">
              <h4 className="font-semibold mb-3">What happens next?</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Customer can complete their purchase with the provided information
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Optional: Offer Stytch authentication for full account creation (Hot level)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Email verification can be sent for account security
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Customer preferences and consent are recorded for compliance
                </li>
              </ul>
            </div>
          </div>
        )

      case 'existing-customer':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentStep('warm-form')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Form
              </button>
              <h2 className="text-xl font-semibold">Existing Customer Detected</h2>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">⚠️</span>
                <h3 className="text-lg font-semibold text-amber-900">
                  Account Already Exists
                </h3>
              </div>
              <p className="text-amber-800 mb-4">
                An account with email <strong>{mockExistingCustomer}</strong> already exists in our system.
                This is the conflict resolution step in the graduated disclosure model.
              </p>
            </div>

            <div className="bg-white p-6 border rounded-lg">
              <h4 className="font-semibold mb-4">Resolution Options:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Option 1: Authenticate</h5>
                  <p className="text-sm text-blue-700 mb-3">
                    Log in to your existing account to link your current session and cart.
                  </p>
                  <button
                    onClick={() => setCurrentStep('hot-form')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Sign In to Account
                  </button>
                </div>
                
                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Option 2: Different Email</h5>
                  <p className="text-sm text-gray-700 mb-3">
                    Use a different email address for this purchase.
                  </p>
                  <button
                    onClick={() => setCurrentStep('warm-form')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Use Different Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'hot-form':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCurrentStep('overview')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Overview
              </button>
              <h2 className="text-xl font-semibold">Hot Authentication Demo</h2>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🚀</span>
                <h3 className="text-lg font-semibold text-green-900">
                  Stytch Authentication Integration
                </h3>
              </div>
              <p className="text-green-800 mb-4">
                In a real implementation, this would integrate with Stytch for SSO authentication,
                supporting Google, Apple, Facebook, Meta, and magic link authentication.
              </p>
            </div>

            <div className="bg-white p-6 border rounded-lg">
              <h4 className="font-semibold mb-4">Hot Authentication Features:</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>OAuth integration (Google, Apple, Facebook, Meta)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Magic link email authentication</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Secure session management with Stytch tokens</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Cross-service user correlation</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span>Complete customer profile access</span>
                </div>
              </div>
            </div>

            <CustomerDisclosureStatus showActions={false} />
          </div>
        )

      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <CustomerDisclosureProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {renderStep()}
          </div>
        </div>
      </div>
    </CustomerDisclosureProvider>
  )
}

export default CustomerDisclosureDemoPage