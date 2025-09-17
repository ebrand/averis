import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductDetailView from '../components/product/ProductDetailView';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if this is the demo route
  const isDemoRoute = location.pathname === '/product-detail-demo';

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // If demo route, skip API call and use demo data
        if (isDemoRoute) {
          // Simulate loading delay for realism
          await new Promise(resolve => setTimeout(resolve, 300));
          setProduct(demoProduct);
          setLoading(false);
          return;
        }

        // For real products, make API call
        if (id) {
          const response = await fetch(`/api/products/${id}`);
          if (!response.ok) {
            throw new Error('Product not found');
          }
          const productData = await response.json();
          setProduct(productData);
        } else {
          throw new Error('No product ID provided');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(err.message);
        // Fall back to demo product on error for now
        setProduct(demoProduct);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isDemoRoute]);

  // Demo product for testing with comprehensive attributes
  const demoProduct = {
    // Core Information
    id: 'demo-product',
    skuCode: 'ENTERPRISE-SW-2024',
    name: 'Enterprise Software Suite',
    displayName: 'Enterprise Software License Suite',
    description: 'Comprehensive enterprise software solution with advanced features and licensing',
    status: 'active',
    class: 'Software',
    type: 'License',
    subType: 'Enterprise',

    // Pricing & Financial
    basePrice: 299.99,
    listPrice: 399.99,
    costPrice: 150.00,
    revenueCategory: 'Software',
    itemRevenueCategory: 'Licensing',
    avaTaxCode: 'SW054000',
    taxSchedule: 'Software Tax Schedule',
    incomeAccount: '4000-Software Revenue',

    // License & Permissions
    licenseRequiredFlag: true,
    licenseKeyType: 'enterprise',
    licenseCount: 25,
    licenseDescription: 'Enterprise multi-user license with advanced features',
    appId: 12345,
    appKey: 67890,
    renewalRequiredFlag: true,
    portalRenewalFlag: true,
    groupedLicenseFlag: false,

    // Seat-Based Pricing
    seatBasedPricingFlag: true,
    seatAdjustmentFlag: true,
    seatMinPriceBreakLevel: '1-10',
    seatMaxPriceBreakLevel: '500+',

    // Sales & Marketing
    webDisplayFlag: true,
    salesQuotableFlag: true,
    channelQuotableFlag: true,
    webQuotableFlag: false,
    teamApprovalNeededFlag: true,
    availableFlag: true,

    // Contract & Billing
    contractItemFlag: true,
    contractItemType: 'subscription',
    contractBillingFrequency: 'monthly',
    contractTermMonths: 24,
    contractEndOfTermAction: 'auto-renew',
    initialContractLineStatusCode: 'ACTIVE',

    // Operations & Fulfillment
    canBeFulfilledFlag: true,
    excludeFromAutoprocessFlag: false,
    createRevenuePlansOn: 'activation',
    changeCode: 'UPGRADE',
    upgradeType: 'tier-upgrade',
    allocationType: 'percentage',

    // Audit fields
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'System Admin',
    updatedBy: 'Product Manager'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">Showing demo product instead:</p>
          <div className="max-w-4xl">
            <ProductDetailView product={demoProduct} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetailView product={product || demoProduct} />
      </div>
    </div>
  );
};

export default ProductDetailPage;