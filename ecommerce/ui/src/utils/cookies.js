import Cookies from 'js-cookie'

// Cookie names
export const COOKIE_NAMES = {
  REGION: 'ecommerce_region',
  CHANNEL: 'ecommerce_channel', 
  CATALOG: 'ecommerce_catalog',
  PREFERENCES: 'ecommerce_preferences'
}

// Default values
export const DEFAULTS = {
  REGION: 'AMER',
  CHANNEL: 'DIRECT',
  LANGUAGE: 'en',
  CURRENCY: 'USD'
}

// Cookie options
const COOKIE_OPTIONS = {
  expires: 365, // 1 year
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}

// Region and channel utilities
export const getUserRegion = () => {
  return Cookies.get(COOKIE_NAMES.REGION) || DEFAULTS.REGION
}

export const setUserRegion = (region) => {
  Cookies.set(COOKIE_NAMES.REGION, region, COOKIE_OPTIONS)
}

export const getUserChannel = () => {
  return Cookies.get(COOKIE_NAMES.CHANNEL) || DEFAULTS.CHANNEL
}

export const setUserChannel = (channel) => {
  Cookies.set(COOKIE_NAMES.CHANNEL, channel, COOKIE_OPTIONS)
}

export const getUserCatalog = () => {
  return Cookies.get(COOKIE_NAMES.CATALOG)
}

export const setUserCatalog = (catalogId) => {
  Cookies.set(COOKIE_NAMES.CATALOG, catalogId, COOKIE_OPTIONS)
}

// Preferences utilities
export const getUserPreferences = () => {
  try {
    const prefs = Cookies.get(COOKIE_NAMES.PREFERENCES)
    return prefs ? JSON.parse(prefs) : {
      language: DEFAULTS.LANGUAGE,
      currency: DEFAULTS.CURRENCY,
      region: getUserRegion(),
      channel: getUserChannel()
    }
  } catch (error) {
    console.warn('Failed to parse user preferences:', error)
    return {
      language: DEFAULTS.LANGUAGE,
      currency: DEFAULTS.CURRENCY,
      region: getUserRegion(),
      channel: getUserChannel()
    }
  }
}

export const setUserPreferences = (preferences) => {
  try {
    Cookies.set(COOKIE_NAMES.PREFERENCES, JSON.stringify(preferences), COOKIE_OPTIONS)
  } catch (error) {
    console.error('Failed to save user preferences:', error)
  }
}

// Clear all averis_ecomm cookies
export const clearUserData = () => {
  Object.values(COOKIE_NAMES).forEach(cookieName => {
    Cookies.remove(cookieName)
  })
}

// Initialize user with defaults if not set
export const initializeUser = () => {
  const region = getUserRegion()
  const channel = getUserChannel()
  const preferences = getUserPreferences()
  
  // Ensure preferences are in sync with region/channel cookies
  if (preferences.region !== region || preferences.channel !== channel) {
    setUserPreferences({
      ...preferences,
      region,
      channel
    })
  }
  
  return {
    region,
    channel,
    preferences
  }
}