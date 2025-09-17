-- ========================================
-- COMPREHENSIVE DATA DICTIONARY FOR ROLE-BASED PRODUCT MANAGEMENT
-- ========================================
-- This script creates a complete Data Dictionary with proper role assignments
-- for the five-section approval workflow system

-- Clear existing product-related data dictionary entries
DELETE FROM averis_system.data_dictionary WHERE column_name IN (
    'id', 'sku', 'name', 'description', 'type', 'brand', 'manufacturer', 'category_id', 
    'categorization', 'base_price', 'cost_price', 'pricing', 'license_required_flag', 
    'seat_based_pricing_flag', 'web_display_flag', 'ava_tax_code', 'can_be_fulfilled_flag', 
    'contract_item_flag', 'slug', 'long_description', 'status', 'available_flag', 
    'is_active', 'attributes', 'metadata', 'approvals', 'source_version', 'synced_at',
    'created_at', 'updated_at', 'created_by', 'updated_by',
    'marketing_approved', 'marketing_approved_by', 'marketing_approved_at',
    'legal_approved', 'legal_approved_by', 'legal_approved_at',
    'finance_approved', 'finance_approved_by', 'finance_approved_at',
    'salesops_approved', 'salesops_approved_by', 'salesops_approved_at',
    'contracts_approved', 'contracts_approved_by', 'contracts_approved_at',
    'launched_by', 'launched_at'
);

-- Insert comprehensive Data Dictionary entries for Product MDM
INSERT INTO averis_system.data_dictionary (
    id, column_name, display_name, data_type, description, maintenance_role, category,
    required_for_active, in_product_mdm, in_pricing_mdm, in_ecommerce, 
    is_system_field, is_editable, sort_order, max_length, min_length,
    created_by, updated_by
) VALUES

-- ========================================
-- MARKETING SECTION (product_marketing)
-- ========================================
(gen_random_uuid(), 'sku', 'SKU Code', 'varchar', 'Stock Keeping Unit - unique product identifier', 'product_marketing', 'Marketing', true, true, true, true, false, true, 101, 100, 3, 'system', 'system'),
(gen_random_uuid(), 'name', 'Product Name', 'varchar', 'Product display name for customer-facing materials', 'product_marketing', 'Marketing', true, true, true, true, false, true, 102, 500, 3, 'system', 'system'),
(gen_random_uuid(), 'description', 'Short Description', 'text', 'Brief product description for marketing purposes', 'product_marketing', 'Marketing', true, true, true, true, false, true, 103, 2000, 10, 'system', 'system'),
(gen_random_uuid(), 'long_description', 'Long Description', 'text', 'Detailed product description for e-commerce and marketing materials', 'product_marketing', 'Marketing', false, true, false, true, false, true, 104, null, null, 'system', 'system'),
(gen_random_uuid(), 'type', 'Product Type', 'varchar', 'Product classification for marketing categorization', 'product_marketing', 'Marketing', false, true, true, true, false, true, 105, 100, null, 'system', 'system'),
(gen_random_uuid(), 'brand', 'Brand Name', 'varchar', 'Product brand for marketing and positioning', 'product_marketing', 'Marketing', false, true, true, true, false, true, 106, 200, null, 'system', 'system'),
(gen_random_uuid(), 'categorization', 'Product Categories', 'jsonb', 'Hierarchical product categorization for marketing taxonomy', 'product_marketing', 'Marketing', false, true, true, true, false, true, 107, null, null, 'system', 'system'),
(gen_random_uuid(), 'slug', 'URL Slug', 'varchar', 'URL-friendly identifier for e-commerce and SEO', 'product_marketing', 'Marketing', false, true, false, true, false, true, 108, 200, null, 'system', 'system'),
(gen_random_uuid(), 'web_display_flag', 'Web Display', 'boolean', 'Should this product be displayed on the website', 'product_marketing', 'Marketing', false, true, false, true, false, true, 109, null, null, 'system', 'system'),

-- ========================================
-- FINANCE SECTION (product_finance)
-- ========================================
(gen_random_uuid(), 'base_price', 'Base Price (USD)', 'decimal', 'Base selling price in USD for financial planning', 'product_finance', 'Finance', false, true, true, true, false, true, 201, null, null, 'system', 'system'),
(gen_random_uuid(), 'cost_price', 'Cost Price (USD)', 'decimal', 'Product cost basis for margin calculations', 'product_finance', 'Finance', false, true, true, false, false, true, 202, null, null, 'system', 'system'),
(gen_random_uuid(), 'pricing', 'Multi-Currency Pricing', 'jsonb', 'Pricing information for multiple currencies and markets', 'product_finance', 'Finance', false, true, true, true, false, true, 203, null, null, 'system', 'system'),
(gen_random_uuid(), 'seat_based_pricing_flag', 'Seat-Based Pricing', 'boolean', 'Does this product use per-seat/per-user pricing model', 'product_finance', 'Finance', false, true, true, true, false, true, 204, null, null, 'system', 'system'),

-- ========================================
-- LEGAL SECTION (product_legal)
-- ========================================
(gen_random_uuid(), 'license_required_flag', 'License Required', 'boolean', 'Does this product require a license for legal compliance', 'product_legal', 'Legal', false, true, true, true, false, true, 301, null, null, 'system', 'system'),
(gen_random_uuid(), 'ava_tax_code', 'Avalara Tax Code', 'varchar', 'Tax classification code for legal and accounting compliance', 'product_legal', 'Legal', false, true, true, true, false, true, 302, 50, null, 'system', 'system'),

-- ========================================
-- SALES OPS SECTION (product_salesops)
-- ========================================
(gen_random_uuid(), 'available_flag', 'Available for Sale', 'boolean', 'Is this product available for sales operations', 'product_salesops', 'Sales Operations', false, true, true, true, false, true, 401, null, null, 'system', 'system'),
(gen_random_uuid(), 'can_be_fulfilled_flag', 'Can Be Fulfilled', 'boolean', 'Can sales operations fulfill orders for this product', 'product_salesops', 'Sales Operations', false, true, true, true, false, true, 402, null, null, 'system', 'system'),
(gen_random_uuid(), 'manufacturer', 'Manufacturer', 'varchar', 'Product manufacturer for sales and support operations', 'product_salesops', 'Sales Operations', false, true, true, true, false, true, 403, 200, null, 'system', 'system'),
(gen_random_uuid(), 'category_id', 'Category ID', 'uuid', 'Product category reference for sales organization', 'product_salesops', 'Sales Operations', false, true, true, true, false, true, 404, null, null, 'system', 'system'),

-- ========================================
-- CONTRACTS SECTION (product_contracts)
-- ========================================
(gen_random_uuid(), 'contract_item_flag', 'Contract Item', 'boolean', 'Is this product sold through contracts rather than direct sales', 'product_contracts', 'Contracts', false, true, true, true, false, true, 501, null, null, 'system', 'system'),

-- ========================================
-- SYSTEM FIELDS (system) - Read-only audit fields
-- ========================================
(gen_random_uuid(), 'id', 'Product ID', 'uuid', 'Unique system identifier for the product', 'system', 'System', false, true, true, true, true, false, 901, null, null, 'system', 'system'),
(gen_random_uuid(), 'status', 'Lifecycle Status', 'varchar', 'Product lifecycle status (draft, active, deprecated, archived)', 'system', 'System', true, true, true, true, true, false, 902, 20, null, 'system', 'system'),
(gen_random_uuid(), 'is_active', 'Active Flag', 'boolean', 'Legacy active flag for backward compatibility', 'system', 'System', false, true, true, true, true, false, 903, null, null, 'system', 'system'),
(gen_random_uuid(), 'created_at', 'Created Date', 'timestamp', 'When this product record was created', 'system', 'System', false, true, true, true, true, false, 904, null, null, 'system', 'system'),
(gen_random_uuid(), 'updated_at', 'Updated Date', 'timestamp', 'When this product record was last modified', 'system', 'System', false, true, true, true, true, false, 905, null, null, 'system', 'system'),
(gen_random_uuid(), 'created_by', 'Created By', 'varchar', 'User who created this product record', 'system', 'System', false, true, true, true, true, false, 906, 500, null, 'system', 'system'),
(gen_random_uuid(), 'updated_by', 'Updated By', 'varchar', 'User who last modified this product record', 'system', 'System', false, true, true, true, true, false, 907, 500, null, 'system', 'system'),

-- ========================================
-- APPROVAL WORKFLOW FIELDS (system) - Read-only status fields
-- ========================================
(gen_random_uuid(), 'marketing_approved', 'Marketing Approved', 'boolean', 'Has the marketing section been approved for launch', 'system', 'Approval Status', false, true, false, false, true, false, 801, null, null, 'system', 'system'),
(gen_random_uuid(), 'marketing_approved_by', 'Marketing Approved By', 'integer', 'User ID who approved the marketing section', 'system', 'Approval Status', false, true, false, false, true, false, 802, null, null, 'system', 'system'),
(gen_random_uuid(), 'marketing_approved_at', 'Marketing Approved Date', 'timestamp', 'When the marketing section was approved', 'system', 'Approval Status', false, true, false, false, true, false, 803, null, null, 'system', 'system'),
(gen_random_uuid(), 'legal_approved', 'Legal Approved', 'boolean', 'Has the legal section been approved for launch', 'system', 'Approval Status', false, true, false, false, true, false, 804, null, null, 'system', 'system'),
(gen_random_uuid(), 'legal_approved_by', 'Legal Approved By', 'integer', 'User ID who approved the legal section', 'system', 'Approval Status', false, true, false, false, true, false, 805, null, null, 'system', 'system'),
(gen_random_uuid(), 'legal_approved_at', 'Legal Approved Date', 'timestamp', 'When the legal section was approved', 'system', 'Approval Status', false, true, false, false, true, false, 806, null, null, 'system', 'system'),
(gen_random_uuid(), 'finance_approved', 'Finance Approved', 'boolean', 'Has the finance section been approved for launch', 'system', 'Approval Status', false, true, false, false, true, false, 807, null, null, 'system', 'system'),
(gen_random_uuid(), 'finance_approved_by', 'Finance Approved By', 'integer', 'User ID who approved the finance section', 'system', 'Approval Status', false, true, false, false, true, false, 808, null, null, 'system', 'system'),
(gen_random_uuid(), 'finance_approved_at', 'Finance Approved Date', 'timestamp', 'When the finance section was approved', 'system', 'Approval Status', false, true, false, false, true, false, 809, null, null, 'system', 'system'),
(gen_random_uuid(), 'salesops_approved', 'Sales Ops Approved', 'boolean', 'Has the sales operations section been approved for launch', 'system', 'Approval Status', false, true, false, false, true, false, 810, null, null, 'system', 'system'),
(gen_random_uuid(), 'salesops_approved_by', 'Sales Ops Approved By', 'integer', 'User ID who approved the sales operations section', 'system', 'Approval Status', false, true, false, false, true, false, 811, null, null, 'system', 'system'),
(gen_random_uuid(), 'salesops_approved_at', 'Sales Ops Approved Date', 'timestamp', 'When the sales operations section was approved', 'system', 'Approval Status', false, true, false, false, true, false, 812, null, null, 'system', 'system'),
(gen_random_uuid(), 'contracts_approved', 'Contracts Approved', 'boolean', 'Has the contracts section been approved for launch', 'system', 'Approval Status', false, true, false, false, true, false, 813, null, null, 'system', 'system'),
(gen_random_uuid(), 'contracts_approved_by', 'Contracts Approved By', 'integer', 'User ID who approved the contracts section', 'system', 'Approval Status', false, true, false, false, true, false, 814, null, null, 'system', 'system'),
(gen_random_uuid(), 'contracts_approved_at', 'Contracts Approved Date', 'timestamp', 'When the contracts section was approved', 'system', 'Approval Status', false, true, false, false, true, false, 815, null, null, 'system', 'system'),

-- ========================================
-- PRODUCT LAUNCH FIELDS (system) - Read-only launch tracking
-- ========================================
(gen_random_uuid(), 'launched_by', 'Launched By', 'integer', 'User ID who launched this product', 'system', 'Launch Status', false, true, false, false, true, false, 816, null, null, 'system', 'system'),
(gen_random_uuid(), 'launched_at', 'Launched Date', 'timestamp', 'When this product was launched (set to active)', 'system', 'Launch Status', false, true, false, false, true, false, 817, null, null, 'system', 'system'),

-- ========================================
-- LEGACY/METADATA FIELDS (system) - Read-only technical fields
-- ========================================
(gen_random_uuid(), 'attributes', 'Product Attributes', 'jsonb', 'Flexible attributes in JSON format', 'system', 'System', false, true, true, true, true, false, 918, null, null, 'system', 'system'),
(gen_random_uuid(), 'metadata', 'Product Metadata', 'jsonb', 'System metadata in JSON format', 'system', 'System', false, true, true, true, true, false, 919, null, null, 'system', 'system'),
(gen_random_uuid(), 'approvals', 'Legacy Approvals', 'jsonb', 'Legacy approval data in JSON format', 'system', 'System', false, true, false, false, true, false, 920, null, null, 'system', 'system'),
(gen_random_uuid(), 'source_version', 'Source Version', 'varchar', 'Version identifier for cache synchronization', 'system', 'System', false, true, false, false, true, false, 921, 50, null, 'system', 'system'),
(gen_random_uuid(), 'synced_at', 'Last Sync Date', 'timestamp', 'When this record was last synchronized to staging', 'system', 'System', false, true, false, false, true, false, 922, null, null, 'system', 'system');

-- Update timestamps
UPDATE averis_system.data_dictionary 
SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Add some allowed values for specific fields
UPDATE averis_system.data_dictionary 
SET allowed_values = '["draft", "active", "deprecated", "archived"]'::jsonb
WHERE column_name = 'status';

UPDATE averis_system.data_dictionary 
SET allowed_values = '["Software", "Hardware", "Service", "Cloud Service", "Physical Product"]'::jsonb
WHERE column_name = 'type';

-- Verify the data dictionary
SELECT 
    category,
    maintenance_role,
    COUNT(*) as field_count,
    STRING_AGG(column_name, ', ' ORDER BY sort_order) as fields
FROM averis_system.data_dictionary 
WHERE column_name IN (
    'id', 'sku', 'name', 'description', 'type', 'brand', 'manufacturer', 'category_id', 
    'categorization', 'base_price', 'cost_price', 'pricing', 'license_required_flag', 
    'seat_based_pricing_flag', 'web_display_flag', 'ava_tax_code', 'can_be_fulfilled_flag', 
    'contract_item_flag', 'slug', 'long_description', 'status', 'available_flag', 
    'marketing_approved', 'legal_approved', 'finance_approved', 'salesops_approved', 'contracts_approved'
)
GROUP BY category, maintenance_role 
ORDER BY category, maintenance_role;

SELECT 'Data Dictionary Migration Complete - ' || COUNT(*) || ' product-related entries created' as result
FROM averis_system.data_dictionary 
WHERE maintenance_role IN ('product_marketing', 'product_finance', 'product_legal', 'product_salesops', 'product_contracts', 'system');