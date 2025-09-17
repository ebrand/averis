import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  ShieldCheckIcon,
  Cog6ToothIcon,
  KeyIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const ProfilePage = () => {
  const { user, dbUser, userProfile, logout, updateProfile, refreshUserProfile } = useAuth()
  const { availableRoles, currentRole, getRoleConfig, allRoles, activeRoles, roleGroups } = useRole()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: dbUser?.firstName || userProfile?.firstName || '',
    lastName: dbUser?.lastName || userProfile?.lastName || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false)
  const [profilePictureKey, setProfilePictureKey] = useState(0) // For forcing re-render

  // Update form when dbUser changes
  React.useEffect(() => {
    if (dbUser) {
      setEditForm({
        firstName: dbUser.firstName || userProfile?.firstName || '',
        lastName: dbUser.lastName || userProfile?.lastName || ''
      })
    }
  }, [dbUser, userProfile])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const checkIfHasApprovalRole = (roleName) => {
    // Check if user has any approval roles in activeRoles first
    if (activeRoles && activeRoles.some(activeRole => 
      activeRole.includes('Approval') || activeRole.includes('approve')
    )) {
      return true
    }
    
    // Check user's actual Stytch roles for approval permissions
    if (dbUser?.roles) {
      const userStytchRoles = Array.isArray(dbUser.roles) ? dbUser.roles : []
      
      // For role groups, check if user has approval roles in their Stytch roles
      if (roleGroups[roleName]) {
        return userStytchRoles.some(stytchRole => stytchRole.includes('_approve'))
      }
      
      // For individual roles, check if it's an approval role
      const roleConfig = getRoleConfig(roleName)
      if (roleConfig?.stytchRole) {
        return roleConfig.stytchRole.includes('_approve') || roleName.includes('Approval')
      }
    }
    
    // Fallback: check role name patterns
    return roleName.includes('Approval') || roleName.includes('approve')
  }

  const getGranularRoles = () => {
    // Get all individual roles that the user actually has (not just role groups)
    const userStytchRoles = user?.roles || []
    
    // Map to display names
    const roleDisplayNames = {
      'product_marketing': 'Product Marketing',
      'product_marketing_approve': 'Marketing Approver',
      'product_legal': 'Product Legal',
      'product_legal_approve': 'Legal Approver',
      'product_finance': 'Product Finance', 
      'product_finance_approve': 'Finance Approver',
      'product_salesops': 'Sales Operations',
      'product_salesops_approve': 'Sales Ops Approver',
      'product_contracts': 'Product Contracts',
      'product_contracts_approve': 'Contracts Approver',
      'product_launch': 'Product Launch',
      'product_admin': 'Product Administrator',
      'admin': 'System Administrator',
      'user_admin': 'User Administrator'
    }
    
    return userStytchRoles.map(role => ({
      stytchRole: role,
      displayName: roleDisplayNames[role] || role,
      isApproval: role.includes('_approve')
    }))
  }

  const getProviderInfo = () => {
    // Check different possible structures for Stytch user object
    const provider = user?.providers?.[0] || user?.oauth_registrations?.[0] || user?.third_party_oauth?.[0]
    
    // If no provider found, assume Google since that's what we're using
    if (!provider) {
      // Check if user has Google-like email structure or other indicators
      const email = user?.emails?.[0]?.email || userProfile?.email
      if (email && email.includes('@gmail.com')) {
        return { name: 'Google', icon: 'G' }
      }
      return { name: 'Google', icon: 'G' } // Default assumption for this app
    }
    
    const providerType = provider.type || provider.provider_type || provider.provider
    switch (providerType) {
      case 'google':
        return { name: 'Google', icon: 'G' }
      default:
        return { name: providerType || 'Google', icon: 'G' }
    }
  }

  const getProfilePicture = () => {
    // First check for custom uploaded profile picture
    // Use user.user_id to be consistent with AuthContext
    const userId = user?.user_id || userProfile?.id
    const customPicture = localStorage.getItem(`profile_picture_${userId}`)
    if (customPicture) {
      return customPicture
    }
    
    // Fallback to Google profile picture
    const googleProvider = user?.providers?.find(p => p.type === 'google')
    return googleProvider?.profile_picture_url || null
  }

  const providerInfo = getProviderInfo()
  const profilePicture = getProfilePicture()

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form when canceling
      setEditForm({
        firstName: dbUser?.firstName || userProfile?.firstName || '',
        lastName: dbUser?.lastName || userProfile?.lastName || ''
      })
      setErrors({})
      setSaveMessage('')
    }
    setIsEditing(!isEditing)
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!editForm.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (editForm.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }
    
    if (!editForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (editForm.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    // Check if there are any actual changes to save
    const currentFirstName = dbUser?.firstName || userProfile?.firstName || ''
    const currentLastName = dbUser?.lastName || userProfile?.lastName || ''
    const hasChanges = 
      editForm.firstName.trim() !== currentFirstName ||
      editForm.lastName.trim() !== currentLastName
    
    if (!hasChanges) {
      // No changes to save, just exit edit mode silently
      setIsEditing(false)
      return
    }
    
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      const result = await updateProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim()
      })
      
      if (result.success) {
        setIsEditing(false)
        setSaveMessage('Profile updated successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        console.error('Profile update failed:', result.error)
        const errorMessage = result.error || 'Failed to update profile. Please try again.'
        setSaveMessage(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveMessage(`Error: ${error.message || 'An unexpected error occurred. Please try again.'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setSaveMessage('Please select a valid image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 storage
      setSaveMessage('Image size must be less than 2MB.')
      return
    }

    setUploadingProfilePic(true)
    setSaveMessage('')

    // Convert image to base64 for simple storage
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const base64Image = e.target.result
        
        // For now, we'll store the base64 image in localStorage as a simple solution
        // In production, this would be uploaded to a cloud storage service
        // Use user.user_id to be consistent with AuthContext
        const userId = user?.user_id || userProfile?.id
        localStorage.setItem(`profile_picture_${userId}`, base64Image)
        
        // Check if there are pending text changes that need to be saved
        const currentFirstName = dbUser?.firstName || userProfile?.firstName || ''
        const currentLastName = dbUser?.lastName || userProfile?.lastName || ''
        const hasTextChanges = 
          editForm.firstName.trim() !== currentFirstName ||
          editForm.lastName.trim() !== currentLastName
        
        // If there are text changes, save them along with the profile picture
        if (hasTextChanges && isEditing) {
          try {
            // Validate the form first
            const newErrors = {}
            
            if (!editForm.firstName.trim()) {
              newErrors.firstName = 'First name is required'
            } else if (editForm.firstName.trim().length < 2) {
              newErrors.firstName = 'First name must be at least 2 characters'
            }
            
            if (!editForm.lastName.trim()) {
              newErrors.lastName = 'Last name is required'
            } else if (editForm.lastName.trim().length < 2) {
              newErrors.lastName = 'Last name must be at least 2 characters'
            }
            
            if (Object.keys(newErrors).length === 0) {
              // Save text changes
              const result = await updateProfile({
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim()
              })
              
              if (result.success) {
                setSaveMessage('Profile picture and name updated successfully!')
                setIsEditing(false)
                setTimeout(() => setSaveMessage(''), 3000)
              } else {
                setSaveMessage('Profile picture updated, but failed to save name changes.')
                setTimeout(() => setSaveMessage(''), 5000)
              }
            } else {
              // Show validation errors but still confirm picture was saved
              setErrors(newErrors)
              setSaveMessage('Profile picture updated, but please fix name validation errors.')
              setTimeout(() => setSaveMessage(''), 5000)
            }
          } catch (error) {
            console.error('Error saving profile text changes:', error)
            setSaveMessage('Profile picture updated, but failed to save name changes.')
            setTimeout(() => setSaveMessage(''), 5000)
          }
        } else {
          // No text changes, just profile picture update
          setSaveMessage('Profile picture updated successfully!')
          setTimeout(() => setSaveMessage(''), 3000)
        }
        
        // Force re-render by updating the key and refreshing user profile
        setProfilePictureKey(prev => prev + 1)
        refreshUserProfile()
        
      } catch (error) {
        console.error('Failed to save profile picture:', error)
        setSaveMessage('Failed to save profile picture. Please try again.')
      } finally {
        setUploadingProfilePic(false)
      }
    }
    
    reader.onerror = (error) => {
      console.error('Failed to read image file:', error)
      setSaveMessage('Failed to read the image file.')
      setUploadingProfilePic(false)
    }
    
    // Start reading the file
    try {
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      setSaveMessage('Failed to upload profile picture. Please try again.')
      setUploadingProfilePic(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account information and view your system permissions
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Profile Information */}
        <div className="xl:col-span-7 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
                <div className="flex items-center space-x-2">
                  {saveMessage && (
                    <div className={`text-sm px-2 py-1 rounded ${
                      saveMessage.includes('successfully') 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {saveMessage}
                    </div>
                  )}
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        className="flex items-center px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Picture and Name */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    {profilePicture ? (
                      <img
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                        src={profilePicture}
                        alt={userProfile?.name || 'User'}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center ring-4 ring-white shadow-lg">
                        <UserIcon className="h-10 w-10 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    
                    {/* Upload overlay - only show when editing */}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingProfilePic}
                        />
                        <div className="text-white text-xs text-center">
                          {uploadingProfilePic ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <PencilIcon className="h-5 w-5 mx-auto mb-1" />
                              <span>Upload</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Provider badge */}
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border-2 border-gray-200 dark:border-gray-600">
                      <span className="text-lg" title={`Signed in with ${providerInfo.name}`}>
                        {providerInfo.icon}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {userProfile?.name || 'User'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userProfile?.email}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Signed in with {providerInfo.name}</span>
                    {user?.emails?.[0]?.verified && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" title="Email Verified" />
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Account created: {formatDate(userProfile?.createdAt)}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    {isEditing ? (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                            errors.firstName 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <div className="mt-1 flex items-center text-sm text-red-600">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors.firstName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {dbUser?.firstName || userProfile?.firstName || 'Not provided'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <div className="mt-1 flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {userProfile?.email}
                      </span>
                      {user?.emails?.[0]?.verified && (
                        <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" title="Verified" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    {isEditing ? (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 ${
                            errors.lastName 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && (
                          <div className="mt-1 flex items-center text-sm text-red-600">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors.lastName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {dbUser?.lastName || userProfile?.lastName || 'Not provided'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                    <div className="mt-1 flex items-center">
                      <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {userProfile?.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database User Information */}
          {dbUser && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product MDM Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your profile in the Product MDM system</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Database ID</label>
                    <div className="mt-1 flex items-center">
                      <KeyIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">#{dbUser.id}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dbUser.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dbUser.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Roles</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getGranularRoles().map((roleInfo, index) => (
                        <span 
                          key={index} 
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            roleInfo.isApproval 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}
                        >
                          {roleInfo.isApproval && '✓ '}
                          {roleInfo.displayName}
                        </span>
                      ))}
                      {getGranularRoles().length === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">No roles assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                    <div className="mt-1 flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(dbUser.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Activity */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Activity</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">OAuth Account Created</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">When you first signed up with Google</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(userProfile?.createdAt)}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Last System Login</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Most recent Product MDM session</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(dbUser?.lastLoginAt || userProfile?.lastLoginAt)}
                </div>
              </div>
              
              {dbUser && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Profile Synced</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Connected to Product MDM database</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(dbUser.updatedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-5 xl:space-y-6">
          {/* Current Role */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Role</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getRoleConfig(currentRole).icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getRoleConfig(currentRole).name}
                  </div>
                  <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {getRoleConfig(currentRole).stytchRole}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Roles */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Permissions</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Roles assigned to your account</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {availableRoles.map((roleName) => {
                  const roleConfig = getRoleConfig(roleName)
                  const isActive = roleName === currentRole
                  const hasApprovalRole = checkIfHasApprovalRole(roleName)
                  
                  return (
                    <div
                      key={roleName}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isActive 
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{roleConfig.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {roleConfig.name}
                            </div>
                            {hasApprovalRole && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500 text-white">
                                Approve
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {roleConfig.stytchRole || 'Role Group'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {availableRoles.length === 0 && (
                <div className="text-center py-4">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No roles assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Role Capabilities */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Role Capabilities</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">What you can do with your current role</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(getRoleConfig(currentRole).tabs).map(([tabId, tabConfig]) => (
                  <div key={tabId} className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{tabConfig.label}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      tabConfig.access === 'write' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tabConfig.access === 'write' ? 'Edit' : 'View'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Actions</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Account Settings
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage