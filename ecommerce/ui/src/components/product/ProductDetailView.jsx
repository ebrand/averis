import React, { useState } from 'react';
import ProductAttributeSection from './ProductAttributeSection';
import CollapsibleSection from '../common/CollapsibleSection';

const ProductDetailView = ({ product }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', badge: null },
    { id: 'attributes', name: 'Attributes', badge: 'All Fields' },
    { id: 'pricing', name: 'Pricing', badge: product.basePrice ? '$' + product.basePrice : 'No Price' },
    { id: 'licensing', name: 'Licensing', badge: product.licenseRequiredFlag ? 'Licensed' : 'No License' },
    { id: 'operations', name: 'Operations', badge: product.status || 'Draft' }
  ];

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <CollapsibleSection
        title="Basic Information"
        defaultOpen={true}
        stats={[product.status || 'Draft', product.class || 'No Class']}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <div className="text-gray-900">{product.name || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code</label>
            <div className="text-gray-900 font-mono">{product.skuCode || '-'}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="text-gray-900">{product.description || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              product.status === 'active' ? 'bg-green-100 text-green-800' :
              product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {product.status || 'Draft'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <div className="text-gray-900">{product.class || '-'}</div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Quick Stats"
        defaultOpen={true}
        stats={['Key Metrics']}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${parseFloat(product.basePrice || 0).toFixed(2)}
            </div>
            <div className="text-sm text-blue-600">Base Price</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {product.licenseRequiredFlag ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-green-600">License Required</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {product.seatBasedPricingFlag ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-purple-600">Seat-Based</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {product.contractItemFlag ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-orange-600">Contract Item</div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Audit Information"
        defaultOpen={false}
        stats={['System Data']}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
            <div className="text-gray-900">{formatDate(product.createdAt)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <div className="text-gray-900">{formatDate(product.updatedAt)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <div className="text-gray-900">{product.createdBy || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
            <div className="text-gray-900">{product.updatedBy || '-'}</div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );

  const PricingTab = () => (
    <div className="space-y-6">
      <CollapsibleSection
        title="Base Pricing"
        defaultOpen={true}
        stats={[`$${parseFloat(product.basePrice || 0).toFixed(2)}`, 'Primary']}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
            <div className="text-2xl font-bold text-gray-900">
              ${parseFloat(product.basePrice || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">List Price</label>
            <div className="text-lg text-gray-900">
              ${parseFloat(product.listPrice || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
            <div className="text-lg text-gray-900">
              ${parseFloat(product.costPrice || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {product.seatBasedPricingFlag && (
        <CollapsibleSection
          title="Seat-Based Pricing"
          defaultOpen={true}
          stats={['Enabled', `${product.seatMinPriceBreakLevel} - ${product.seatMaxPriceBreakLevel}`]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price Break Level</label>
              <div className="text-gray-900">{product.seatMinPriceBreakLevel || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price Break Level</label>
              <div className="text-gray-900">{product.seatMaxPriceBreakLevel || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seat Adjustment</label>
              <div className="text-gray-900">{product.seatAdjustmentFlag ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Financial Categories"
        defaultOpen={false}
        stats={[product.revenueCategory || 'No Category']}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Category</label>
            <div className="text-gray-900">{product.revenueCategory || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Revenue Category</label>
            <div className="text-gray-900">{product.itemRevenueCategory || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
            <div className="text-gray-900">{product.avaTaxCode || '-'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Schedule</label>
            <div className="text-gray-900">{product.taxSchedule || '-'}</div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Product Header */}
      <div className="bg-white shadow-sm border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name || 'Unnamed Product'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>SKU: {product.skuCode || 'No SKU'}</span>
              <span>•</span>
              <span>Class: {product.class || 'No Class'}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.status === 'active' ? 'bg-green-100 text-green-800' :
                product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {product.status || 'Draft'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              ${parseFloat(product.basePrice || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Base Price</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'attributes' && <ProductAttributeSection product={product} />}
          {activeTab === 'pricing' && <PricingTab />}
          {activeTab === 'licensing' && (
            <div className="text-center py-8 text-gray-500">
              Licensing details coming soon...
            </div>
          )}
          {activeTab === 'operations' && (
            <div className="text-center py-8 text-gray-500">
              Operations details coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;