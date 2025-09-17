import React from 'react';
import CollapsibleSection from '../common/CollapsibleSection';

const ProductAttributeSection = ({ product }) => {
  // Helper function to get filled attribute count for a section
  const getFilledAttributeCount = (attributes) => {
    return attributes.filter(attr => {
      const value = product[attr.key];
      return value !== null && value !== undefined && value !== '' && value !== false;
    }).length;
  };

  // Helper function to format attribute value for display
  const formatValue = (value, type = 'text') => {
    if (value === null || value === undefined || value === '') return '-';
    
    switch (type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'currency':
        return `$${parseFloat(value).toFixed(2)}`;
      case 'number':
        return parseFloat(value).toString();
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value.toString();
    }
  };

  // Define attribute groups with their respective fields
  const attributeGroups = [
    {
      title: 'Core Information',
      key: 'core',
      attributes: [
        { key: 'skuCode', label: 'SKU Code', type: 'text' },
        { key: 'name', label: 'Product Name', type: 'text' },
        { key: 'displayName', label: 'Display Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
        { key: 'class', label: 'Class', type: 'text' },
        { key: 'type', label: 'Type', type: 'text' },
        { key: 'subType', label: 'Sub Type', type: 'text' }
      ]
    },
    {
      title: 'Pricing & Financial',
      key: 'pricing',
      attributes: [
        { key: 'basePrice', label: 'Base Price', type: 'currency' },
        { key: 'listPrice', label: 'List Price', type: 'currency' },
        { key: 'costPrice', label: 'Cost Price', type: 'currency' },
        { key: 'revenueCategory', label: 'Revenue Category', type: 'text' },
        { key: 'itemRevenueCategory', label: 'Item Revenue Category', type: 'text' },
        { key: 'avaTaxCode', label: 'Avalara Tax Code', type: 'text' },
        { key: 'taxSchedule', label: 'Tax Schedule', type: 'text' },
        { key: 'incomeAccount', label: 'Income Account', type: 'text' }
      ]
    },
    {
      title: 'License & Permissions',
      key: 'licensing',
      attributes: [
        { key: 'licenseRequiredFlag', label: 'License Required', type: 'boolean' },
        { key: 'licenseKeyType', label: 'License Key Type', type: 'text' },
        { key: 'licenseCount', label: 'License Count', type: 'number' },
        { key: 'licenseDescription', label: 'License Description', type: 'text' },
        { key: 'appId', label: 'Application ID', type: 'number' },
        { key: 'appKey', label: 'Application Key', type: 'number' },
        { key: 'renewalRequiredFlag', label: 'Renewal Required', type: 'boolean' },
        { key: 'portalRenewalFlag', label: 'Portal Renewal', type: 'boolean' },
        { key: 'groupedLicenseFlag', label: 'Grouped License', type: 'boolean' }
      ]
    },
    {
      title: 'Seat-Based Pricing',
      key: 'seating',
      attributes: [
        { key: 'seatBasedPricingFlag', label: 'Seat-Based Pricing', type: 'boolean' },
        { key: 'seatAdjustmentFlag', label: 'Seat Adjustment', type: 'boolean' },
        { key: 'seatMinPriceBreakLevel', label: 'Min Seat Price Break', type: 'text' },
        { key: 'seatMaxPriceBreakLevel', label: 'Max Seat Price Break', type: 'text' }
      ]
    },
    {
      title: 'Sales & Marketing',
      key: 'sales',
      attributes: [
        { key: 'webDisplayFlag', label: 'Web Display', type: 'boolean' },
        { key: 'salesQuotableFlag', label: 'Sales Quotable', type: 'boolean' },
        { key: 'channelQuotableFlag', label: 'Channel Quotable', type: 'boolean' },
        { key: 'webQuotableFlag', label: 'Web Quotable', type: 'boolean' },
        { key: 'teamApprovalNeededFlag', label: 'Team Approval Needed', type: 'boolean' },
        { key: 'availableFlag', label: 'Available', type: 'boolean' }
      ]
    },
    {
      title: 'Contract & Billing',
      key: 'contracts',
      attributes: [
        { key: 'contractItemFlag', label: 'Contract Item', type: 'boolean' },
        { key: 'contractItemType', label: 'Contract Type', type: 'text' },
        { key: 'contractBillingFrequency', label: 'Billing Frequency', type: 'text' },
        { key: 'contractTermMonths', label: 'Term (Months)', type: 'number' },
        { key: 'contractEndOfTermAction', label: 'End of Term Action', type: 'text' },
        { key: 'initialContractLineStatusCode', label: 'Initial Status Code', type: 'text' }
      ]
    },
    {
      title: 'Operations & Fulfillment',
      key: 'operations',
      attributes: [
        { key: 'canBeFulfilledFlag', label: 'Can Be Fulfilled', type: 'boolean' },
        { key: 'excludeFromAutoprocessFlag', label: 'Exclude from Autoprocess', type: 'boolean' },
        { key: 'createRevenuePlansOn', label: 'Create Revenue Plans On', type: 'text' },
        { key: 'changeCode', label: 'Change Code', type: 'text' },
        { key: 'upgradeType', label: 'Upgrade Type', type: 'text' },
        { key: 'allocationType', label: 'Allocation Type', type: 'text' }
      ]
    }
  ];

  // Get important values for stats display
  const getImportantStats = (group) => {
    const filledCount = getFilledAttributeCount(group.attributes);
    const totalCount = group.attributes.length;
    
    switch (group.key) {
      case 'core':
        return [`${filledCount}/${totalCount} fields`, product.status || 'Draft'];
      case 'pricing':
        return [`${filledCount}/${totalCount} fields`, product.basePrice ? `$${product.basePrice}` : 'No price'];
      case 'licensing':
        return [`${filledCount}/${totalCount} fields`, product.licenseRequiredFlag ? 'Licensed' : 'No license'];
      case 'seating':
        return [`${filledCount}/${totalCount} fields`, product.seatBasedPricingFlag ? 'Seat-based' : 'Fixed'];
      case 'sales':
        return [`${filledCount}/${totalCount} fields`, product.webDisplayFlag ? 'Web visible' : 'Internal'];
      case 'contracts':
        return [`${filledCount}/${totalCount} fields`, product.contractItemFlag ? 'Contract' : 'One-time'];
      case 'operations':
        return [`${filledCount}/${totalCount} fields`, product.canBeFulfilledFlag ? 'Fulfillable' : 'Manual'];
      default:
        return [`${filledCount}/${totalCount} fields`];
    }
  };

  return (
    <div className="space-y-4">
      {attributeGroups.map((group) => (
        <CollapsibleSection
          key={group.key}
          title={group.title}
          defaultOpen={false}
          stats={getImportantStats(group)}
          className="shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.attributes.map((attr) => {
              const value = product[attr.key];
              const hasValue = value !== null && value !== undefined && value !== '' && value !== false;
              
              return (
                <div
                  key={attr.key}
                  className={`p-3 rounded border ${
                    hasValue ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {attr.label}
                  </div>
                  <div className={`text-sm ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formatValue(value, attr.type)}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default ProductAttributeSection;