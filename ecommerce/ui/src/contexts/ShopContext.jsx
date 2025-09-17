import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { initializeUser, setUserRegion, setUserChannel, setUserCatalog, setUserPreferences } from '../utils/cookies'
import catalogService from '../services/catalogService'

// Create context
const ShopContext = createContext()

// Initial state
const initialState = {
  // User location and preferences
  region: 'AMER',
  channel: 'DIRECT',
  language: 'en',
  currency: 'USD',
  
  // Catalog data
  currentCatalog: null,
  catalogs: [],
  regions: [],
  channels: [],
  
  // Product data
  products: [],
  pagination: { page: 1, limit: 50, total: 0, pages: 0 },
  
  // UI state
  loading: true,
  error: null,
  searchQuery: ''
}

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_CURRENT_CATALOG: 'SET_CURRENT_CATALOG',
  SET_CATALOGS: 'SET_CATALOGS',
  SET_REGIONS: 'SET_REGIONS',
  SET_CHANNELS: 'SET_CHANNELS',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  INITIALIZE_SUCCESS: 'INITIALIZE_SUCCESS'
}

// Reducer
function shopReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
      
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
      
    case ACTIONS.SET_USER_LOCATION:
      return { 
        ...state, 
        region: action.payload.region,
        channel: action.payload.channel,
        language: action.payload.language || state.language,
        currency: action.payload.currency || state.currency
      }
      
    case ACTIONS.SET_CURRENT_CATALOG:
      return { ...state, currentCatalog: action.payload }
      
    case ACTIONS.SET_CATALOGS:
      return { ...state, catalogs: action.payload }
      
    case ACTIONS.SET_REGIONS:
      return { ...state, regions: action.payload }
      
    case ACTIONS.SET_CHANNELS:
      return { ...state, channels: action.payload }
      
    case ACTIONS.SET_PRODUCTS:
      return { 
        ...state, 
        products: action.payload.products,
        pagination: action.payload.pagination 
      }
      
    case ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload }
      
    case ACTIONS.INITIALIZE_SUCCESS:
      return { 
        ...state, 
        ...action.payload,
        loading: false,
        error: null 
      }
      
    default:
      return state
  }
}

// Provider component
export function ShopProvider({ children }) {
  const [state, dispatch] = useReducer(shopReducer, initialState)

  // Initialize the shop context on mount
  useEffect(() => {
    initializeShop()
  }, [])

  // Load products when catalog changes
  useEffect(() => {
    if (state.currentCatalog) {
      loadProducts()
    }
  }, [state.currentCatalog, state.searchQuery])

  const initializeShop = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      // Initialize user preferences from cookies
      const userState = initializeUser()
      
      // Load reference data
      const [regions, channels] = await Promise.all([
        catalogService.getRegions(),
        catalogService.getChannels()
      ])
      
      dispatch({ type: ACTIONS.SET_REGIONS, payload: regions })
      dispatch({ type: ACTIONS.SET_CHANNELS, payload: channels })
      
      // Get default catalog for user's region and channel
      const defaultCatalog = await catalogService.getDefaultCatalog(
        userState.region, 
        userState.channel
      )
      
      // Update state with initialized data
      dispatch({
        type: ACTIONS.INITIALIZE_SUCCESS,
        payload: {
          region: userState.region,
          channel: userState.channel,
          language: userState.preferences.language,
          currency: userState.preferences.currency,
          currentCatalog: defaultCatalog
        }
      })
      
      // Save catalog to cookies
      if (defaultCatalog) {
        setUserCatalog(defaultCatalog.id)
      }
      
    } catch (error) {
      console.error('Failed to initialize shop:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadProducts = async (page = 1) => {
    if (!state.currentCatalog) return
    
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      const result = await catalogService.getCatalogProducts(state.currentCatalog.id, {
        page,
        limit: state.pagination.limit,
        search: state.searchQuery
      })
      
      dispatch({ 
        type: ACTIONS.SET_PRODUCTS, 
        payload: result 
      })
      
    } catch (error) {
      console.error('Failed to load products:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    }
  }

  const changeRegionAndChannel = async (region, channel) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      // Update cookies
      setUserRegion(region)
      setUserChannel(channel)
      
      // Get new default catalog
      const newCatalog = await catalogService.getDefaultCatalog(region, channel)
      
      // Update state
      dispatch({
        type: ACTIONS.SET_USER_LOCATION,
        payload: { region, channel }
      })
      
      dispatch({
        type: ACTIONS.SET_CURRENT_CATALOG,
        payload: newCatalog
      })
      
      // Save new catalog
      setUserCatalog(newCatalog.id)
      
      // Update preferences
      const newPreferences = {
        language: state.language,
        currency: state.currency,
        region,
        channel
      }
      setUserPreferences(newPreferences)
      
    } catch (error) {
      console.error('Failed to change region/channel:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const searchProducts = (query) => {
    dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query })
  }

  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
  }

  // Calculate price for a product
  const calculatePrice = (product) => {
    return catalogService.calculateProductPrice(product, state.currentCatalog)
  }

  // Format price for display
  const formatPrice = (price) => {
    const locale = state.language === 'fr' ? 'fr-FR' : 'en-US'
    return catalogService.formatPrice(price, state.currency, locale)
  }

  const value = {
    // State
    ...state,
    
    // Actions
    changeRegionAndChannel,
    searchProducts,
    loadProducts,
    clearError,
    calculatePrice,
    formatPrice
  }

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  )
}

// Hook to use the context
export function useShop() {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}

export default ShopContext