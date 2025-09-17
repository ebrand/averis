import { StytchUIClient } from '@stytch/vanilla-js'

// Initialize Stytch client
export const stytch = new StytchUIClient('public-token-test-1e2daeb6-0b54-44af-a8bb-da500548f60c')

// Check what session methods are available
console.log('Session methods:', stytch.session ? Object.keys(stytch.session) : 'No session object')

// Stytch UI configuration for OAuth
export const stytchUIConfig = {
  products: ['oauth'],
  oauthOptions: {
    providers: [
      {
        type: 'google',
        one_tap: false
      },
      {
        type: 'amazon',
        one_tap: false
      }
    ],
    loginRedirectURL: window.location.origin + '/authenticate',
    signupRedirectURL: window.location.origin + '/authenticate'
  },
  styles: {
    container: {
      width: '400px'
    },
    buttons: {
      primary: {
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        borderColor: '#1f2937'
      }
    }
  }
}

// Helper functions for token management
export const tokenManager = {
  getToken: () => {
    return localStorage.getItem('stytch_session_token')
  },
  
  setToken: (token) => {
    localStorage.setItem('stytch_session_token', token)
  },
  
  removeToken: () => {
    localStorage.removeItem('stytch_session_token')
    localStorage.removeItem('stytch_session')
    localStorage.removeItem('stytch_last_auth_time')
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('stytch_session_token')
  }
}

export default stytch