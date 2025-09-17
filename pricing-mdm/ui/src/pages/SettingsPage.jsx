import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const SettingsPage = () => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme()
  const { userProfile } = useAuth()
  const [activeSection, setActiveSection] = useState('appearance')

  const sections = [
    {
      id: 'appearance',
      name: 'Appearance',
      icon: PaintBrushIcon,
      description: 'Customize the look and feel'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      description: 'Manage notification preferences'
    },
    {
      id: 'privacy',
      name: 'Privacy & Security',
      icon: ShieldCheckIcon,
      description: 'Control your privacy settings'
    },
    {
      id: 'language',
      name: 'Language & Region',
      icon: GlobeAltIcon,
      description: 'Set language and regional preferences'
    }
  ]

  const themeOptions = [
    {
      value: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: SunIcon,
      action: setLightTheme
    },
    {
      value: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: MoonIcon,
      action: setDarkTheme
    },
    {
      value: 'system',
      name: 'System',
      description: 'Matches your device settings',
      icon: ComputerDesktopIcon,
      action: () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        prefersDark ? setDarkTheme() : setLightTheme()
      }
    }
  ]

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={option.action}
              className={`relative rounded-lg border p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                (option.value === theme || (option.value === 'system' && theme === (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')))
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <option.icon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </div>
              {(option.value === theme || (option.value === 'system' && theme === (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))) && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Toggle</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {isDark ? (
                <MoonIcon className="h-6 w-6 text-green-500" />
              ) : (
                <SunIcon className="h-6 w-6 text-yellow-500" />
              )}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Currently active theme
              </div>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              isDark ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h3>
      <div className="space-y-4">
        {[
          { name: 'Email Notifications', description: 'Receive updates via email' },
          { name: 'Product Updates', description: 'Notifications about product changes' },
          { name: 'System Alerts', description: 'Important system notifications' }
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600 transition-colors">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearanceSection()
      case 'notifications':
        return renderNotificationsSection()
      default:
        return (
          <div className="text-center py-12">
            <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This section is under development</p>
          </div>
        )
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="xl:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left group rounded-lg px-3 py-2 flex items-center text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <section.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div>
                  <div>{section.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {section.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {sections.find(s => s.id === activeSection)?.name}
              </h2>
            </div>
            <div className="p-6">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage