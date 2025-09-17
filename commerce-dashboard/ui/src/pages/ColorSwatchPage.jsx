import React from 'react'
import {
  ComputerDesktopIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'

const ColorSwatchPage = () => {
  const platformColors = [
    {
      name: 'Dashboard',
      icon: ComputerDesktopIcon,
      description: 'System Monitoring & Mgmt',
      colors: {
        primary: 'bg-teal-600',
        primaryHex: '#0D9488',
        secondary: 'bg-teal-500',
        secondaryHex: '#14B8A6',
        light: 'bg-teal-100',
        lightHex: '#CCFBF1'
      }
    },
    {
      name: 'Product',
      icon: CubeIcon,
      description: 'Product Master Data Mgmt',
      colors: {
        primary: 'bg-blue-800',
        primaryHex: '#1E40AF',
        secondary: 'bg-blue-600',
        secondaryHex: '#2563EB',
        light: 'bg-blue-100',
        lightHex: '#DBEAFE'
      }
    },
    {
      name: 'Pricing',
      icon: CurrencyDollarIcon,
      description: 'Pricing & Catalog Mgmt',
      colors: {
        primary: 'bg-green-800',
        primaryHex: '#166534',
        secondary: 'bg-green-600',
        secondaryHex: '#16A34A',
        light: 'bg-green-100',
        lightHex: '#DCFCE7'
      }
    },
    {
      name: 'Customer',
      icon: UserGroupIcon,
      description: 'Customer Relationship Mgmt',
      colors: {
        primary: 'bg-red-700',
        primaryHex: '#B91C1C',
        secondary: 'bg-red-500',
        secondaryHex: '#EF4444',
        light: 'bg-red-100',
        lightHex: '#FEE2E2'
      }
    },
    {
      name: 'Order Mgmt',
      icon: ClipboardDocumentListIcon,
      description: 'Order Management System',
      colors: {
        primary: 'bg-purple-800',
        primaryHex: '#6B21A8',
        secondary: 'bg-purple-600',
        secondaryHex: '#9333EA',
        light: 'bg-purple-100',
        lightHex: '#F3E8FF'
      }
    },
    {
      name: 'ERP',
      icon: BuildingOffice2Icon,
      description: 'Enterprise Resource Planning',
      colors: {
        primary: 'bg-orange-800',
        primaryHex: '#C2410C',
        secondary: 'bg-orange-600',
        secondaryHex: '#EA580C',
        light: 'bg-orange-100',
        lightHex: '#FED7AA'
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Color Palette
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Visual identity and color schemes for the Averis platform applications
          </p>
        </div>

        {/* Platform Grid - Icons with Color Palettes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {platformColors.map((platform) => (
            <div key={platform.name} className="flex flex-col items-center">
              {/* Icon Section */}
              <div className="mb-6">
                <div className={`${platform.colors.primary} p-8 rounded-2xl w-[200px] h-[200px] shadow-lg mb-4 transition-transform hover:scale-105 flex items-center justify-center`}>
                  <platform.icon className="h-24 w-24 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                  {platform.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  {platform.description}
                </p>
              </div>

              {/* Color Palette Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden w-[300px]  max-w-sm">
                {/* Color Swatches */}
                <div className="space-y-0">
                  {/* Primary Color */}
                  <div className={`${platform.colors.primary} px-6 py-4 text-white`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Primary</span>
                      <span className="text-sm opacity-90">{platform.colors.primaryHex}</span>
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className={`${platform.colors.secondary} px-6 py-4 text-white`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Secondary</span>
                      <span className="text-sm opacity-90">{platform.colors.secondaryHex}</span>
                    </div>
                  </div>

                  {/* Light Color */}
                  <div className={`${platform.colors.light} px-6 py-4 text-gray-800`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Light</span>
                      <span className="text-sm opacity-75">{platform.colors.lightHex}</span>
                    </div>
                  </div>

                  {/* White Bottom Band */}
                  <div className="bg-white px-6 py-3">
                    <div className="h-2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage Guidelines */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Color Usage Guidelines
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Primary Colors
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Used for main navigation headers and primary buttons</li>
                <li>• Application identity and branding elements</li>
                <li>• Focus states and active navigation items</li>
                <li>• Critical call-to-action elements</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Secondary Colors
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Hover states and interactive elements</li>
                <li>• Secondary buttons and links</li>
                <li>• Supporting UI elements</li>
                <li>• Progress indicators and highlights</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Light Colors
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Background colors for content areas</li>
                <li>• Subtle highlights and separators</li>
                <li>• Success states and notifications</li>
                <li>• Badge backgrounds and tags</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Platform Identity
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• <span className="font-medium text-teal-600">Dashboard</span>: Teal - System oversight & monitoring</li>
                <li>• <span className="font-medium text-blue-600">Product</span>: Blue - Data management & structure</li>
                <li>• <span className="font-medium text-green-600">Pricing</span>: Green - Financial & commercial</li>
                <li>• <span className="font-medium text-red-600">Customer</span>: Red - Relationships & engagement</li>
                <li>• <span className="font-medium text-purple-600">Order Mgmt</span>: Purple - Order processing & fulfillment</li>
                <li>• <span className="font-medium text-orange-600">ERP</span>: Orange - Enterprise resource planning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Color Accessibility Notes */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Accessibility Notes
          </h3>
          <div className="text-blue-800 dark:text-blue-400 space-y-2">
            <p>• All color combinations meet WCAG 2.1 AA contrast requirements</p>
            <p>• Colors are supported by icons and text labels for color-blind accessibility</p>
            <p>• Dark mode variants maintain consistent visual hierarchy</p>
            <p>• Focus indicators use sufficient contrast ratios for keyboard navigation</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorSwatchPage