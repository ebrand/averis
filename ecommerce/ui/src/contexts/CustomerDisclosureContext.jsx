import React, { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

/**
 * Customer Disclosure Context
 * 
 * Manages the graduated disclosure model for customer authentication:
 * - COLD: Anonymous visitor with cookie tracking
 * - WARM: Contact information provided during checkout/interaction
 * - HOT: Fully authenticated user with Stytch integration
 */

const CustomerDisclosureContext = createContext()

export const DISCLOSURE_LEVELS = {
  COLD: 'cold',
  WARM: 'warm', 
  HOT: 'hot'
}

export const CustomerDisclosureProvider = ({ children }) => {
  const [customerData, setCustomerData] = useState({
    id: null,
    disclosureLevel: DISCLOSURE_LEVELS.COLD,
    visitorCookie: null,
    sessionData: {},
    
    // Cold level data
    telemetry: {
      pageViews: 0,
      timeSpent: 0,
      interactions: [],
      cartItems: []
    },
    
    // Warm level data (checkout/contact)
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    billingAddress: null,
    
    // Hot level data (authenticated)
    stytchUserId: null,
    emailVerified: false,
    shippingAddresses: [],
    purchaseHistory: [],
    preferences: {},
    
    // Business intelligence
    customerSegment: null,
    acquisitionChannel: 'direct',
    lifetimeValue: 0.00,
    
    // Privacy & consent
    marketingConsent: false,
    dataProcessingConsent: false,
    consentDate: null,
    
    // Status tracking
    status: 'active',
    firstPurchaseDate: null,
    lastActivity: new Date().toISOString()
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize customer on component mount
  useEffect(() => {
    initializeCustomer()
  }, [])

  /**
   * Initialize customer - handles cold authentication
   * Creates visitor cookie if none exists, loads existing customer data
   */
  const initializeCustomer = async () => {
    setLoading(true)
    try {
      // Check for existing visitor cookie
      let visitorCookie = getVisitorCookie()
      
      if (!visitorCookie) {
        // Cold authentication: Create new visitor
        visitorCookie = generateVisitorCookie()
        setVisitorCookie(visitorCookie)
        
        await createVisitorCustomer(visitorCookie)
      } else {
        // Returning visitor: Load existing data
        await loadExistingCustomer(visitorCookie)
      }
      
      // Update last activity
      updateLastActivity()
      
    } catch (err) {
      console.error('Failed to initialize customer:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create new visitor customer (Cold → system)
   */
  const createVisitorCustomer = async (visitorCookie) => {
    const newCustomer = {
      disclosureLevel: DISCLOSURE_LEVELS.COLD,
      visitorFlag: true,
      visitorCookie: visitorCookie,
      sessionData: {
        cart: [],
        wishlist: [],
        recentlyViewed: [],
        preferences: {}
      },
      acquisitionChannel: detectAcquisitionChannel(),
      status: 'active',
      createdAt: new Date().toISOString()
    }

    // TODO: Call API to create customer in averis_customer.customers
    // For now, store locally
    setCustomerData(prev => ({
      ...prev,
      ...newCustomer,
      id: uuidv4() // Temporary ID
    }))

    console.log('🆕 Created new visitor customer:', visitorCookie)
  }

  /**
   * Load existing customer data
   */
  const loadExistingCustomer = async (visitorCookie) => {
    try {
      // TODO: Call API to load customer by visitor cookie
      // For now, load from localStorage as fallback
      const stored = localStorage.getItem(`customer_${visitorCookie}`)
      if (stored) {
        const parsedData = JSON.parse(stored)
        setCustomerData(prev => ({
          ...prev,
          ...parsedData,
          visitorCookie: visitorCookie,
          lastActivity: new Date().toISOString()
        }))
        console.log('📂 Loaded existing customer:', parsedData.disclosureLevel)
      }
    } catch (err) {
      console.error('Failed to load existing customer:', err)
      // Fallback to creating new visitor
      await createVisitorCustomer(visitorCookie)
    }
  }

  /**
   * Upgrade to warm authentication
   * Called during checkout when user provides contact information
   */
  const upgradeToWarm = async (contactInfo) => {
    setLoading(true)
    try {
      // Check if customer already exists with this email
      const existingCustomer = await checkExistingCustomerByEmail(contactInfo.email)
      
      if (existingCustomer) {
        // Existing customer found - prompt for authentication
        throw new Error('EXISTING_CUSTOMER_FOUND')
      }

      // Upgrade current visitor to warm level
      const updatedCustomer = {
        ...customerData,
        disclosureLevel: DISCLOSURE_LEVELS.WARM,
        visitorFlag: false,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        billingAddress: contactInfo.billingAddress,
        dataProcessingConsent: contactInfo.dataProcessingConsent || false,
        marketingConsent: contactInfo.marketingConsent || false,
        consentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setCustomerData(updatedCustomer)
      
      // Persist to storage
      persistCustomerData(updatedCustomer)
      
      console.log('🔥 Upgraded customer to WARM level')
      return updatedCustomer

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Upgrade to hot authentication
   * Called when user completes Stytch authentication
   */
  const upgradeToHot = async (authData) => {
    setLoading(true)
    try {
      const updatedCustomer = {
        ...customerData,
        disclosureLevel: DISCLOSURE_LEVELS.HOT,
        stytchUserId: authData.stytchUserId,
        emailVerified: authData.emailVerified || true,
        preferences: { ...customerData.preferences, ...authData.preferences },
        updatedAt: new Date().toISOString()
      }

      setCustomerData(updatedCustomer)
      
      // Persist to storage and sync with backend
      persistCustomerData(updatedCustomer)
      
      console.log('🚀 Upgraded customer to HOT level')
      return updatedCustomer

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add telemetry/tracking data
   */
  const addTelemetry = (eventType, data) => {
    const updatedCustomer = {
      ...customerData,
      telemetry: {
        ...customerData.telemetry,
        interactions: [
          ...customerData.telemetry.interactions,
          {
            type: eventType,
            data: data,
            timestamp: new Date().toISOString()
          }
        ].slice(-50), // Keep last 50 interactions
        pageViews: eventType === 'page_view' ? customerData.telemetry.pageViews + 1 : customerData.telemetry.pageViews
      },
      lastActivity: new Date().toISOString()
    }

    setCustomerData(updatedCustomer)
    
    // Debounced persistence for telemetry
    debouncedPersist(updatedCustomer)
  }

  /**
   * Check if customer exists by email (for warm upgrade conflict resolution)
   */
  const checkExistingCustomerByEmail = async (email) => {
    // TODO: Call API to check existing customer
    // Return null if no customer found, customer object if found
    return null
  }

  // Utility functions
  const generateVisitorCookie = () => `averis_visitor_${uuidv4()}`
  
  const getVisitorCookie = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('averis_visitor='))
      ?.split('=')[1]
  }
  
  const setVisitorCookie = (value) => {
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1) // 1 year expiry
    
    document.cookie = `averis_visitor=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`
  }

  const detectAcquisitionChannel = () => {
    const referrer = document.referrer
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('utm_source')) return `${urlParams.get('utm_source')}_${urlParams.get('utm_medium') || 'unknown'}`
    if (referrer.includes('google')) return 'google_search'
    if (referrer.includes('facebook')) return 'facebook'
    if (referrer) return 'referral'
    return 'direct'
  }

  const updateLastActivity = () => {
    setCustomerData(prev => ({
      ...prev,
      lastActivity: new Date().toISOString()
    }))
  }

  const persistCustomerData = (data) => {
    if (data.visitorCookie) {
      localStorage.setItem(`customer_${data.visitorCookie}`, JSON.stringify(data))
    }
  }

  // Debounced persistence for frequent updates like telemetry
  let persistTimeout
  const debouncedPersist = (data) => {
    clearTimeout(persistTimeout)
    persistTimeout = setTimeout(() => persistCustomerData(data), 1000)
  }

  const contextValue = {
    customerData,
    loading,
    error,
    disclosureLevel: customerData.disclosureLevel,
    isAnonymous: customerData.disclosureLevel === DISCLOSURE_LEVELS.COLD,
    hasContactInfo: customerData.disclosureLevel !== DISCLOSURE_LEVELS.COLD,
    isAuthenticated: customerData.disclosureLevel === DISCLOSURE_LEVELS.HOT,
    
    // Actions
    initializeCustomer,
    upgradeToWarm,
    upgradeToHot,
    addTelemetry,
    updateLastActivity,
    
    // Utilities
    DISCLOSURE_LEVELS
  }

  return (
    <CustomerDisclosureContext.Provider value={contextValue}>
      {children}
    </CustomerDisclosureContext.Provider>
  )
}

export const useCustomerDisclosure = () => {
  const context = useContext(CustomerDisclosureContext)
  if (!context) {
    throw new Error('useCustomerDisclosure must be used within a CustomerDisclosureProvider')
  }
  return context
}