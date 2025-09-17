import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRole } from '../../contexts/RoleContext'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const RoleSwitcher = ({ forceClose = false, onStateChange = null }) => {
  const { currentRole, availableRoles, activeRoles, currentRoleGroup, switchRole, getRoleConfig, roleGroups, allRoles } = useRole()
  const { dbUser, staticRoleGroups } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const roleConfig = getRoleConfig()

  // Handle external forceClose prop
  useEffect(() => {
    if (forceClose && isOpen) {
      console.log('RoleSwitcher: Force closing due to external request')
      setIsOpen(false)
    }
  }, [forceClose, isOpen])

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isOpen)
    }
  }, [isOpen, onStateChange])

  // Debug logging (temporarily disabled to reduce console noise)
  // console.log('🔍 RoleSwitcher Debug - product-mdm:')
  // console.log('currentRole:', currentRole)
  // console.log('activeRoles:', activeRoles)
  // console.log('availableRoles:', availableRoles)
  // console.log('dbUser:', dbUser)
  // console.log('dbUser?.roles:', dbUser?.roles)
  // console.log('staticRoleGroups:', staticRoleGroups)

  // Helper function to check if a role should show approval label using static role groups from AuthContext
  const hasApproveRole = (role) => {
    // console.log(`🔍 hasApproveRole called for role: ${role}`)
    
    if (!staticRoleGroups) {
      // console.log(`  -> no staticRoleGroups available: false`)
      return false
    }
    
    // Check if it's a role group in our static role groups
    if (staticRoleGroups[role]) {
      const staticGroup = staticRoleGroups[role]
      const hasApproval = staticGroup.hasApprove()
      // console.log(`  -> static role group ${role} hasApprove():`, hasApproval)
      // console.log(`  -> constituent roles:`, staticGroup.constituentRoles)
      return hasApproval
    }
    
    // If it's an individual approval role, always show
    if (role.includes('Approval')) {
      // console.log(`  -> individual approval role: true`)
      return true
    }
    
    // console.log(`  -> not found in static role groups: false`)
    return false
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-800 border border-red-700 hover:border-red-600 transition-colors w-[250px]"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{roleConfig.icon}</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-white">{roleConfig.name}</span>
            {hasApproveRole(currentRole) && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500 text-white">
                Approve
              </span>
            )}
          </div>
        </div>
        <ChevronDownIcon className="h-4 w-4 text-red-300 mr-1" />
      </button>

      {/* Role dropdown menu - rendered via React Portal to bypass stacking context issues */}
      {isOpen && createPortal(
        <div className="fixed top-16 right-[270px] w-[250px] bg-white border border-gray-200 rounded-lg shadow-lg z-[10000]">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Switch Role
            </div>
            
            {availableRoles.map((role) => {
              const config = getRoleConfig(role)
              const isActive = role === currentRole
              
              return (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left text-sm transition-colors flex items-center relative ${
                    isActive
                      ? 'bg-red-100 text-red-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Main content area */}
                  <div className="flex items-center space-x-3 px-3 py-2 flex-1">
                    <span className="text-base">{config.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{config.name}</div>
                      {isActive && (
                        <div className="text-xs text-red-700">
                          Current Role
                        </div>
                      )}
                      {!isActive && (
                        <div className="text-xs text-gray-500">
                          {config.name} Permissions
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Red approve sidebar */}
                  {hasApproveRole(role) && (
                    <div className="w-6 bg-red-500 flex items-center justify-center absolute right-0 top-0 bottom-0 border-l border-red-600">
                      <span className="text-white text-[8px] font-bold uppercase tracking-wider transform -rotate-90 whitespace-nowrap">
                        Approve
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="border-t border-gray-100 px-3 py-2">
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                {['SystemAdmin', 'UserAdmin'].includes(currentRole) 
                  ? 'Admin role with system-wide permissions'
                  : 'Role determines which product fields you can edit'
                }
              </div>
              <div className="font-mono">Stytch: {getRoleConfig(currentRole).stytchRole}</div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Click outside to close - also rendered via Portal - DISABLED when force closed */}
      {isOpen && !forceClose && createPortal(
        <div 
          className="fixed inset-0 z-[9999]" 
          onClick={(e) => {
            console.log('RoleSwitcher: Backdrop clicked - closing RoleSwitcher, target:', e.target.className)
            console.log('RoleSwitcher: forceClose is:', forceClose, 'isOpen is:', isOpen)
            setIsOpen(false)
          }}
        />,
        document.body
      )}
    </div>
  )
}

export default RoleSwitcher