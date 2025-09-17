import React, { useState } from 'react'
import { useRole } from '../../contexts/RoleContext'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const RoleSwitcher = () => {
  const { currentRole, availableRoles, activeRoles, currentRoleGroup, switchRole, getRoleConfig, roleGroups, allRoles } = useRole()
  const { dbUser, staticRoleGroups } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const roleConfig = getRoleConfig()


  // Helper function to check if a role should show approval label using static role groups from AuthContext
  const hasApproveRole = (role) => {
    if (!staticRoleGroups) {
      return false
    }
    
    // Check if it's a role group in our static role groups
    if (staticRoleGroups[role]) {
      const staticGroup = staticRoleGroups[role]
      return staticGroup.hasApprove()
    }
    
    // If it's an individual approval role, always show
    if (role.includes('Approval')) {
      return true
    }
    
    return false
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-700 border border-green-600 hover:border-green-500 transition-colors w-[250px]"
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
        <ChevronDownIcon className="h-4 w-4 text-green-300 mr-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[250px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    switchRole(role)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left text-sm transition-colors flex items-center relative ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {/* Main content area */}
                  <div className="flex items-center space-x-3 px-3 py-2 flex-1">
                    <span className="text-base">{config.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{config.name}</div>
                      {isActive && (
                        <div className="text-xs text-green-800">
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
                  : 'Role determines pricing and catalog access by region'
                }
              </div>
              <div className="font-mono">Stytch: {getRoleConfig(currentRole).stytchRole}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default RoleSwitcher