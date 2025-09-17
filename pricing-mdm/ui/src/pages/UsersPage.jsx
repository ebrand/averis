import React, { useState, useEffect } from 'react'
import { useRole } from '../contexts/RoleContext'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import { userUtils } from '../services/apiClient'
import { 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const UsersPage = () => {
  const { isAdmin, isUserAdmin, canAccessAdminFeatures } = useRole()
  const { userProfile, dbUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // For triggering re-renders when profile pics change
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roles: [],
    status: 'active'
  })

  useEffect(() => {
    loadUsers()
  }, [searchQuery, selectedRole, showInactive])

  // Refresh users list when window regains focus (to pick up profile picture changes)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Check if user has permission to access this page (after all hooks)
  if (!isAdmin() && !isUserAdmin()) {
    return <Navigate to="/" replace />
  }

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const filters = {}
      if (selectedRole) {
        filters.role = selectedRole
      }
      if (showInactive) {
        filters.include_inactive = 'true'
      }
      
      const result = await userUtils.getFilteredUsers(searchQuery, filters, pagination.page, pagination.limit)
      
      if (result.error) {
        setError(result.error)
        setUsers([])
      } else {
        setUsers(result.users)
        setPagination(result.pagination)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users. Please try again.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Users are already filtered by the API

  const getRoleBadgeColor = (role) => {
    const colors = {
      'product_marketing': 'bg-purple-100 text-purple-800',
      'product_legal': 'bg-green-100 text-green-800',
      'product_finance': 'bg-green-100 text-green-800',
      'product_salesops': 'bg-orange-100 text-orange-800',
      'product_contracts': 'bg-indigo-100 text-indigo-800',
      'product_admin': 'bg-red-100 text-red-800',
      'product_launch': 'bg-purple-100 text-purple-800',
      'product_view': 'bg-gray-100 text-gray-800',
      'admin': 'bg-gray-900 text-white',
      'user_admin': 'bg-green-900 text-white'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleDisplayName = (role) => {
    const names = {
      'product_marketing': 'Marketing',
      'product_legal': 'Legal',
      'product_finance': 'Finance',
      'product_salesops': 'Sales Ops',
      'product_contracts': 'Contracts',
      'product_admin': 'Product Admin',
      'product_launch': 'Product Launch',
      'product_view': 'Viewer',
      'admin': 'System Admin',
      'user_admin': 'User Admin'
    }
    return names[role] || role
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  const getUserProfilePicture = (user) => {
    // Check for custom uploaded profile picture using the user's Stytch ID
    // refreshKey is included to trigger re-renders when profile pictures change
    const customPicture = localStorage.getItem(`profile_picture_${user.stytchUserId}`)
    if (customPicture) {
      return customPicture
    }
    
    // Could potentially fetch from Google profile if we had that data
    // For now, return null to show initials
    return null
  }

  // Handler functions for edit and delete operations
  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      roles: user.roles || [],
      status: user.status || 'active'
    })
    setActionError(null)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setActionError(null)
    setShowDeleteModal(true)
  }

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setActionError(null)

    try {
      const updateData = {
        ...selectedUser, // Preserve existing user data
        ...editForm, // Override with form data
        roles: Array.isArray(editForm.roles) ? editForm.roles : [editForm.roles].filter(Boolean)
      }

      const result = await userUtils.updateUser(selectedUser.id, updateData)

      if (result.error) {
        setActionError(result.error)
        return
      }

      // Refresh the users list
      await loadUsers()
      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Edit user error:', error)
      setActionError('Failed to update user. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setActionError(null)

    try {
      const result = await userUtils.deleteUser(selectedUser.id, dbUser?.id)

      if (result.error) {
        setActionError(result.error)
        return
      }

      // Refresh the users list
      await loadUsers()
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Delete user error:', error)
      setActionError('Failed to delete user. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowEditModal(false)
    setShowDeleteModal(false)
    setSelectedUser(null)
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      roles: [],
      status: 'active'
    })
    setActionError(null)
  }

  const handleUserDoubleClick = (user) => {
    // If it's the current user, go to their own profile page
    if (user.stytchUserId === userProfile?.id) {
      navigate('/profile')
    } else {
      // For other users, show their details in a modal or navigate to an admin user view
      // For now, we'll set them as the selected user and open the edit modal to view their info
      setSelectedUser(user)
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        roles: user.roles || [],
        status: user.status || 'active'
      })
      setActionError(null)
      setShowEditModal(true)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage system users and their roles. {isAdmin() ? 'System Administrator access.' : 'User Administrator access.'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Roles</option>
            <option value="product_marketing">Marketing</option>
            <option value="product_legal">Legal</option>
            <option value="product_finance">Finance</option>
            <option value="product_salesops">Sales Ops</option>
            <option value="product_contracts">Contracts</option>
            <option value="product_admin">Product Admin</option>
            <option value="product_launch">Product Launch</option>
            <option value="product_view">Viewer</option>
            {isAdmin() && (
              <>
                <option value="admin">System Admin</option>
                <option value="user_admin">User Admin</option>
              </>
            )}
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="sr-only"
            />
            <div className="relative">
              <div className={`block w-14 h-8 rounded-full transition-colors ${showInactive ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showInactive ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Inactive
            </span>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="animate-pulse flex items-center">
                            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            <div className="ml-4">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {error ? 'Unable to load users' : 'No users found matching your criteria'}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr 
                        key={`${user.id}-${refreshKey}`} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onDoubleClick={() => handleUserDoubleClick(user)}
                        title="Double-click to view/edit user details"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {getUserProfilePicture(user) ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={getUserProfilePicture(user)}
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                  {user.firstName && user.lastName ? (
                                    <span className="text-sm font-medium text-white">
                                      {user.firstName[0]}{user.lastName[0]}
                                    </span>
                                  ) : (
                                    <UserIcon className="h-6 w-6 text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.filter(role => role !== 'pricing_pdm' && role !== 'averis_pricing').map((role, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                              >
                                {getRoleDisplayName(role)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatLastLogin(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditUser(user)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Edit user"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {(isAdmin() || isUserAdmin()) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete user"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {pagination.total} users ({users.filter(u => u.status === 'active').length} active)
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                Add New User
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User management functionality would be implemented here with proper form validation and API integration.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Edit User
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {actionError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{actionError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Roles
                  </label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {['product_marketing', 'product_legal', 'product_finance', 'product_salesops', 'product_contracts', 'product_admin', 'product_launch', 'product_view', ...(isAdmin() ? ['admin', 'user_admin'] : [])].map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes(role)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...editForm.roles, role]
                              : editForm.roles.filter(r => r !== role)
                            handleEditFormChange('roles', newRoles)
                          }}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {getRoleDisplayName(role)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleModalClose}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2 text-center">
                Delete User
              </h3>

              {actionError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{actionError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  This will deactivate the user account. This action can be reversed later.
                </p>
              </div>

              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={handleModalClose}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage