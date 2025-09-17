import React, { createContext, useContext, useEffect, useState } from 'react'
import { stytch, tokenManager } from '../lib/stytch'
import { userUtils, apiClient } from '../services/apiClient'
import { performCentralizedLogout, isRecentLogout, clearLogoutTimestamp, isForcedLogout, clearForcedLogout, hasPermanentLogoutFlag, clearPermanentLogoutFlag } from '../utils/centralizedLogout'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dbUser, setDbUser] = useState(null) // User record from our database
  const [isSyncing, setIsSyncing] = useState(false) // Prevent multiple sync calls
  const [staticRoleGroups, setStaticRoleGroups] = useState(null) // Static role groups built from user permissions

  // Initialize authentication state
  useEffect(() => {
    initializeAuth()
  }, [])

  // Build static role groups based on user's actual permissions
  const buildStaticRoleGroups = (userRoles) => {
    console.log('Building static role groups from user roles:', userRoles)
    
    // Role group definitions with their mappings
    const roleGroupDefinitions = {
      MarketingGroup: {
        name: 'Marketing',
        icon: '📱',
        color: 'bg-purple-100 text-purple-800',
        description: 'Marketing and approval permissions',
        baseRole: 'product_marketing',
        approveRole: 'product_marketing_approve'
      },
      LegalGroup: {
        name: 'Legal',
        icon: '⚖️',
        color: 'bg-blue-100 text-blue-800',
        description: 'Legal and approval permissions',
        baseRole: 'product_legal',
        approveRole: 'product_legal_approve'
      },
      FinanceGroup: {
        name: 'Finance',
        icon: '💰',
        color: 'bg-green-100 text-green-800',
        description: 'Finance and approval permissions',
        baseRole: 'product_finance',
        approveRole: 'product_finance_approve'
      },
      SalesOpsGroup: {
        name: 'Sales Operations',
        icon: '📊',
        color: 'bg-orange-100 text-orange-800',
        description: 'Sales operations and approval permissions',
        baseRole: 'product_salesops',
        approveRole: 'product_salesops_approve'
      },
      ContractsGroup: {
        name: 'Contracts',
        icon: '📋',
        color: 'bg-indigo-100 text-indigo-800',
        description: 'Contracts and approval permissions',
        baseRole: 'product_contracts',
        approveRole: 'product_contracts_approve'
      }
    }
    
    const staticGroups = {}
    
    // Build each role group based on what the user has
    Object.entries(roleGroupDefinitions).forEach(([groupKey, groupDef]) => {
      const hasBaseRole = userRoles.includes(groupDef.baseRole)
      const hasApproveRole = userRoles.includes(groupDef.approveRole)
      
      if (hasBaseRole || hasApproveRole) {
        const constituentRoles = []
        if (hasBaseRole) constituentRoles.push(groupDef.baseRole)
        if (hasApproveRole) constituentRoles.push(groupDef.approveRole)
        
        staticGroups[groupKey] = {
          ...groupDef,
          constituentRoles,
          hasApprove() {
            return this.constituentRoles.some(role => role.endsWith('_approve'))
          }
        }
        
        console.log(`Built static group ${groupKey}:`, {
          constituentRoles,
          hasApprove: staticGroups[groupKey].hasApprove()
        })
      }
    })
    
    console.log('Final static role groups:', staticGroups)
    return staticGroups
  }

  // Sync user with our database - create if doesn't exist
  const syncUserWithDatabase = async (stytchUser) => {
    if (isSyncing) {
      console.log('Sync already in progress, skipping')
      return dbUser
    }

    setIsSyncing(true)
    try {
      console.log('Syncing user with database:', stytchUser.user_id)
      
      // Check if user exists in our database by Stytch user ID
      const searchResult = await userUtils.getFilteredUsers('', { stytch_user_id: stytchUser.user_id }, 1, 1)
      
      let dbUserRecord = null
      
      if (searchResult.users && searchResult.users.length > 0) {
        // User exists, update their last login
        dbUserRecord = searchResult.users[0]
        console.log('User found in database:', dbUserRecord.email)
        
        // Update last login timestamp
        try {
          await userUtils.updateUser(dbUserRecord.id, {
            ...dbUserRecord,
            lastLoginAt: new Date().toISOString()
          })
        } catch (error) {
          console.warn('Failed to update last login:', error)
        }
      } else {
        // User doesn't exist, check if they have valid roles to create them
        const userRoles = stytchUser.roles || []
        const validRoles = userRoles.filter(role => 
          role.startsWith('product_') || ['admin', 'user_admin'].includes(role)
        )
        
        if (validRoles.length > 0) {
          console.log('Creating new user in database with roles:', validRoles)
          
          // Create new user record
          const newUserData = {
            firstName: stytchUser.name?.first_name || '',
            lastName: stytchUser.name?.last_name || '',
            email: stytchUser.emails?.[0]?.email || '',
            stytchUserId: stytchUser.user_id,
            roles: validRoles,
            status: 'active',
            lastLoginAt: new Date().toISOString()
          }
          
          const createResult = await userUtils.createUser(newUserData)
          
          if (createResult.error) {
            console.error('Failed to create user in database:', createResult.error)
          } else {
            dbUserRecord = createResult.user
            console.log('Successfully created user in database:', dbUserRecord.email)
          }
        } else {
          console.warn('User has no valid roles for Product MDM:', userRoles)
          throw new Error('User does not have the required roles to access Product MDM')
        }
      }
      
      setDbUser(dbUserRecord)
      
      // Build static role groups based on user's roles
      if (dbUserRecord?.roles) {
        const staticGroups = buildStaticRoleGroups(dbUserRecord.roles)
        setStaticRoleGroups(staticGroups)
      }
      
      return dbUserRecord
    } catch (error) {
      console.error('Error syncing user with database:', error)
      throw error
    } finally {
      setIsSyncing(false)
    }
  }

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Check for logout URL parameter FIRST and IMMEDIATELY
      const urlParams = new URLSearchParams(window.location.search)
      const logoutParam = urlParams.get('logout')
      
      console.log('Product MDM AuthContext: initializeAuth starting')
      console.log('Product MDM AuthContext: Logout URL parameter:', logoutParam)
      
      // If logout parameter exists, FORCE logout immediately regardless of other state
      if (logoutParam) {
        console.log('Product MDM AuthContext: FORCED LOGOUT - Logout parameter detected, clearing all session data')
        
        // Clear ALL session data immediately
        tokenManager.removeToken()
        localStorage.removeItem('stytch_session')
        localStorage.removeItem('stytch_last_auth_time')
        sessionStorage.clear()
        apiClient.setAuthToken(null)
        setUser(null)
        setDbUser(null)
        setIsAuthenticated(false)
        setStaticRoleGroups(null)
        
        // Clear all logout detection flags
        localStorage.removeItem('commerce_logout_timestamp')
        localStorage.removeItem('force_logout')
        localStorage.removeItem('commerce_logout_session')
        
        // Clean up the URL
        console.log('Product MDM AuthContext: Cleaning logout parameter from URL')
        const cleanUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
        
        setIsLoading(false)
        console.log('Product MDM AuthContext: FORCED LOGOUT COMPLETE - staying logged out')
        return
      }
      
      // ENHANCED LOGOUT DETECTION - Check ALL logout indicators with priority order
      const recentLogout = isRecentLogout()
      const forcedLogout = isForcedLogout()
      const permanentLogout = hasPermanentLogoutFlag()
      
      console.log('Product MDM AuthContext: Comprehensive logout detection:', { 
        recentLogout, 
        forcedLogout, 
        permanentLogout,
        logoutTimestamp: localStorage.getItem('commerce_logout_timestamp'),
        forceFlag: localStorage.getItem('force_logout'),
        permanentSession: localStorage.getItem('commerce_logout_session')
      })
      
      // If ANY logout indicator is present, prevent authentication restoration
      if (recentLogout || forcedLogout || permanentLogout) {
        console.log('Product MDM AuthContext: LOGOUT DETECTED - preventing authentication restoration')
        
        // Clear local session data COMPLETELY
        tokenManager.removeToken()
        localStorage.removeItem('stytch_session')
        localStorage.removeItem('stytch_last_auth_time')
        sessionStorage.clear() // Clear ALL session storage
        apiClient.setAuthToken(null)
        setUser(null)
        setDbUser(null)
        setIsAuthenticated(false)
        setStaticRoleGroups(null)
        
        // Clear logout detection flags only after ensuring state is cleared
        clearLogoutTimestamp()
        clearForcedLogout()
        clearPermanentLogoutFlag()
        
        setIsLoading(false)
        console.log('Product MDM AuthContext: LOGOUT PREVENTION COMPLETE - staying logged out')
        return
      }
      
      // Check if we have a stored session token and user data
      const token = tokenManager.getToken()
      const storedSession = localStorage.getItem('stytch_session')
      
      console.log('Initializing auth with stored token:', token ? 'Token found' : 'No token')
      console.log('Stored session data:', storedSession ? 'Found' : 'Not found')
      
      if (token && storedSession) {
        try {
          const sessionData = JSON.parse(storedSession)
          const user = sessionData.user
          const dbUser = sessionData.dbUser
          
          if (user) {
            console.log('Restoring user session from localStorage')
            setUser(user)
            setDbUser(dbUser)
            setIsAuthenticated(true)
            
            // Set the authentication token on the API client
            if (token) {
              apiClient.setAuthToken(token)
            }
            
            // Build static role groups if we have dbUser with roles
            if (dbUser?.roles) {
              const staticGroups = buildStaticRoleGroups(dbUser.roles)
              setStaticRoleGroups(staticGroups)
            }
            
            // Optionally sync with database on session restore
            try {
              await syncUserWithDatabase(user)
            } catch (error) {
              console.warn('Failed to sync user on session restore:', error)
              // Don't redirect during initialization - user may still have valid session
              // Only redirect during active login attempts
              
              // If dbUser is null due to database issues, create fallback user
              if (!dbUser) {
                console.log('Creating fallback user due to database sync failure on restore')
                const fallbackDbUser = {
                  id: 'test-user-1',
                  firstName: user.name?.first_name || 'Test',
                  lastName: user.name?.last_name || 'User',
                  email: user.emails?.[0]?.email || 'test@example.com',
                  roles: [
                    'admin', 
                    'product_marketing', 
                    'product_marketing_approve',
                    'product_legal', 
                    'product_finance', 
                    'product_salesops', 
                    'product_contracts'
                  ],
                  status: 'active'
                }
                setDbUser(fallbackDbUser)
                
                // Build static role groups for fallback user
                if (fallbackDbUser?.roles) {
                  const staticGroups = buildStaticRoleGroups(fallbackDbUser.roles)
                  setStaticRoleGroups(staticGroups)
                }
              }
            }
          } else {
            console.log('No user data in stored session, clearing')
            handleLogout()
          }
        } catch (error) {
          console.error('Error parsing stored session:', error)
          handleLogout()
        }
      } else if (token || storedSession) {
        // Partial data, clear everything
        console.log('Incomplete session data, clearing')
        handleLogout()
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      handleLogout()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = async (data) => {
    console.log('Login success data:', data)
    
    // Extract the correct session token and user data
    const sessionToken = data.session_token || data.session?.session_token
    const user = data.user || data.session?.user
    
    if (!sessionToken) {
      console.error('No session token found in login data:', data)
      return
    }
    
    try {
      // Sync user with our database
      const dbUserRecord = await syncUserWithDatabase(user)
      
      setUser(user)
      setDbUser(dbUserRecord)
      setIsAuthenticated(true)
      
      // Build static role groups based on user's roles
      if (dbUserRecord?.roles) {
        const staticGroups = buildStaticRoleGroups(dbUserRecord.roles)
        setStaticRoleGroups(staticGroups)
      }
      tokenManager.setToken(sessionToken)
      
      // Set the authentication token on the API client
      apiClient.setAuthToken(sessionToken)
      
      // Store additional user session data including database user
      localStorage.setItem('stytch_session', JSON.stringify({
        user: user,
        dbUser: dbUserRecord,
        session: data.session,
        timestamp: new Date().toISOString()
      }))
      
      // Store authentication time for OAuth token expiration detection
      localStorage.setItem('stytch_last_auth_time', Date.now().toString())
      
      console.log('Stored session token and synced with database:', sessionToken)
    } catch (error) {
      console.error('Login failed - user sync error:', error)
      
      // If user doesn't have required roles, prevent login
      if (error.message.includes('required roles')) {
        console.log('User lacks required roles, redirecting to get-access page')
        // Clear any stored auth data
        localStorage.removeItem('stytch_session')
        localStorage.removeItem('stytch_last_auth_time')
        tokenManager.removeToken()
        // Redirect to get-access page
        window.location.href = '/get-access'
        return
      }
      
      // For other errors, still allow login but warn
      console.warn('Database sync failed, proceeding with authentication:', error)
      
      // Create a fallback test user with approval roles for demo purposes
      const fallbackDbUser = {
        id: 'test-user-1',
        firstName: user.name?.first_name || 'Test',
        lastName: user.name?.last_name || 'User',
        email: user.emails?.[0]?.email || 'test@example.com',
        roles: [
          'admin', 
          'product_marketing', 
          'product_marketing_approve',
          'product_legal', 
          'product_legal_approve',
          'product_finance', 
          'product_finance_approve',
          'product_salesops', 
          'product_salesops_approve',
          'product_contracts', 
          'product_contracts_approve'
        ],
        status: 'active'
      }
      
      setUser(user)
      setDbUser(fallbackDbUser)
      setIsAuthenticated(true)
      
      // Build static role groups based on fallback user's roles
      if (fallbackDbUser?.roles) {
        const staticGroups = buildStaticRoleGroups(fallbackDbUser.roles)
        setStaticRoleGroups(staticGroups)
      }
      tokenManager.setToken(sessionToken)
      
      // Set the authentication token on the API client
      apiClient.setAuthToken(sessionToken)
      
      localStorage.setItem('stytch_session', JSON.stringify({
        user: user,
        dbUser: fallbackDbUser,
        session: data.session,
        timestamp: new Date().toISOString()
      }))
    }
  }

  const handleLogout = async () => {
    console.log('Product MDM AuthContext: handleLogout started - using centralized logout')
    try {
      // Clear local state first
      setUser(null)
      setDbUser(null)
      setIsAuthenticated(false)
      setStaticRoleGroups(null)
      tokenManager.removeToken()
      
      // Clear authentication token from API client
      apiClient.setAuthToken(null)
      
      console.log('Product MDM AuthContext: Local state cleared, initiating centralized logout')
      
      // Perform centralized logout across all applications
      // This will handle the redirect to Dashboard login
      await performCentralizedLogout()
      
      console.log('Product MDM AuthContext: performCentralizedLogout completed!')
      
      // Note: performCentralizedLogout handles the redirect, so we don't need additional redirects here
      
    } catch (error) {
      console.error('Product MDM AuthContext: Centralized logout error:', error)
      // Only redirect on error
      window.location.href = 'http://localhost:3012/login'
    }
  }

  const getProfilePictureUrl = (user) => {
    if (!user) return null
    
    // First check for custom uploaded profile picture
    const customPicture = localStorage.getItem(`profile_picture_${user.user_id}`)
    if (customPicture) {
      return customPicture
    }
    
    // Check for Google profile picture first
    const googleProvider = user.providers?.find(p => p.type === 'google')
    if (googleProvider?.profile_picture_url) {
      return googleProvider.profile_picture_url
    }
    
    // Check for Amazon profile picture
    const amazonProvider = user.providers?.find(p => p.type === 'amazon')
    if (amazonProvider?.profile_picture_url) {
      return amazonProvider.profile_picture_url
    }
    
    return null
  }

  const getUserProfile = () => {
    if (!user) return null
    
    // Prioritize database user info over Stytch user info for names
    const firstName = dbUser?.firstName || user.name?.first_name || ''
    const lastName = dbUser?.lastName || user.name?.last_name || ''
    
    return {
      id: user.user_id,
      email: user.emails?.[0]?.email || 'No email',
      name: firstName && lastName 
        ? `${firstName} ${lastName}`
        : user.emails?.[0]?.email || 'User',
      firstName,
      lastName,
      avatar: getProfilePictureUrl(user),
      provider: user.providers?.[0]?.type || 'unknown',
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    }
  }

  const refreshSession = async () => {
    const token = tokenManager.getToken()
    const storedSession = localStorage.getItem('stytch_session')
    
    if (!token || !storedSession) return false

    try {
      const sessionData = JSON.parse(storedSession)
      const user = sessionData.user
      
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
        return true
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
      handleLogout()
    }
    
    return false
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      console.log('Updating profile with:', updates)

      // Update database user if exists
      let updatedDbUser = dbUser
      if (dbUser) {
        const dbUpdates = {
          ...dbUser, // Include all existing user data
          firstName: updates.firstName !== undefined ? updates.firstName : dbUser.firstName,
          lastName: updates.lastName !== undefined ? updates.lastName : dbUser.lastName,
          // Note: updatedBy column doesn't exist in current database schema
          // Can add more fields here as needed
        }
        
        console.log('Sending database update:', dbUpdates)
        const updateResult = await userUtils.updateUser(dbUser.id, dbUpdates)
        
        if (updateResult.error) {
          console.error('Database update failed:', updateResult.error)
          throw new Error(`Failed to update database: ${updateResult.error}`)
        } else {
          updatedDbUser = updateResult.user
          console.log('Database updated successfully:', updatedDbUser)
          setDbUser(updatedDbUser)
        }
      }

      // Update the Stytch user object with new information
      const updatedUser = {
        ...user,
        name: {
          ...user.name,
          first_name: updates.firstName !== undefined ? updates.firstName : user.name?.first_name,
          last_name: updates.lastName !== undefined ? updates.lastName : user.name?.last_name
        }
      }

      // Update local state
      setUser(updatedUser)

      // Update stored session data with the updated information
      const storedSession = localStorage.getItem('stytch_session')
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession)
          sessionData.user = updatedUser
          sessionData.dbUser = updatedDbUser
          sessionData.timestamp = new Date().toISOString() // Update timestamp
          localStorage.setItem('stytch_session', JSON.stringify(sessionData))
          console.log('Session data updated in localStorage')
        } catch (sessionError) {
          console.error('Failed to update session data:', sessionError)
          // Don't throw here as the database update was successful
        }
      }

      console.log('Profile updated successfully')
      return { success: true, user: updatedDbUser }
    } catch (error) {
      console.error('Profile update error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    dbUser,
    staticRoleGroups,
    isLoading,
    isAuthenticated,
    userProfile: getUserProfile(),
    login: handleLoginSuccess,
    logout: handleLogout,
    refreshSession,
    initializeAuth,
    updateProfile,
    syncUserWithDatabase,
    refreshUserProfile: () => setUser({...user}) // Force re-render of userProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext