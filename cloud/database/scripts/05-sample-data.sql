-- ========================================
-- AVERIS DATABASE: SAMPLE DATA
-- ========================================
-- Loads comprehensive sample data for testing and development

-- ========================================
-- SYSTEM USERS
-- ========================================
INSERT INTO averis_system.users (
    stytch_user_id, first_name, last_name, email, status, roles, created_by
) VALUES 
    ('user_test_admin_001', 'Admin', 'User', 'admin@averis.com', 'active', 
     '["admin", "user_admin", "averis_product", "averis_pricing", "product_launch"]'::jsonb, 'system'),
    ('user_test_marketing_001', 'Marketing', 'Manager', 'marketing@averis.com', 'active', 
     '["averis_product", "product_marketing", "product_marketing_approve"]'::jsonb, 'system'),
    ('user_test_pricing_001', 'Pricing', 'Manager', 'pricing@averis.com', 'active', 
     '["averis_pricing", "catalog_amer", "catalog_emea"]'::jsonb, 'system'),
    ('user_test_legal_001', 'Legal', 'Manager', 'legal@averis.com', 'active', 
     '["averis_product", "product_legal", "product_legal_approve"]'::jsonb, 'system'),
    ('user_test_finance_001', 'Finance', 'Manager', 'finance@averis.com', 'active', 
     '["averis_product", "product_finance", "product_finance_approve"]'::jsonb, 'system')
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    stytch_user_id = EXCLUDED.stytch_user_id,
    status = EXCLUDED.status,
    roles = EXCLUDED.roles,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- SAMPLE CUSTOMERS
-- ========================================
INSERT INTO averis_customer.customers (
    id, customer_number, first_name, last_name, email, company_name, disclosure_level, status
) VALUES 
    ('bb0e8400-e29b-41d4-a716-446655440001'::uuid, 'CUST001', 'John', 'Smith', 'john.smith@enterprise.com', 'Enterprise Corp', 'hot', 'active'),
    ('bb0e8400-e29b-41d4-a716-446655440002'::uuid, 'CUST002', 'Jane', 'Doe', 'jane.doe@techstartup.com', 'Tech Startup Inc', 'warm', 'active'),
    ('bb0e8400-e29b-41d4-a716-446655440003'::uuid, 'CUST003', 'Bob', 'Johnson', 'bob.j@smallbiz.com', 'Small Business LLC', 'cold', 'active'),
    ('bb0e8400-e29b-41d4-a716-446655440004'::uuid, 'CUST004', 'Alice', 'Brown', 'alice.brown@retailco.com', 'Retail Co', 'warm', 'active'),
    ('bb0e8400-e29b-41d4-a716-446655440005'::uuid, 'CUST005', 'Charlie', 'Wilson', 'charlie.w@partner.com', 'Partner Solutions', 'hot', 'active')
ON CONFLICT (customer_number) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    company_name = EXCLUDED.company_name,
    disclosure_level = EXCLUDED.disclosure_level,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- SAMPLE PRODUCTS (Master Data)
-- ========================================
INSERT INTO averis_product.products (
    id, sku, name, description, brand, manufacturer, category_id, status, is_active, available_flag,
    marketing_approved, marketing_approved_by, marketing_approved_at,
    legal_approved, legal_approved_by, legal_approved_at,
    finance_approved, finance_approved_by, finance_approved_at,
    salesops_approved, salesops_approved_by, salesops_approved_at,
    contracts_approved, contracts_approved_by, contracts_approved_at,
    attributes, created_by, launched_by, launched_at
) VALUES 
    -- Hardware Products
    ('cc0e8400-e29b-41d4-a716-446655440001'::uuid, 'AVE-LAPTOP-001', 'Averis Professional Laptop 15"', 
     'High-performance laptop designed for business professionals with 15-inch display and premium build quality',
     'Averis', 'Averis Manufacturing', '990e8400-e29b-41d4-a716-446655440004'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '30 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '25 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '20 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '15 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '10 days',
     '{
        "technical_specs": {
            "processor": "Intel Core i7-12700H",
            "memory": "32GB DDR4",
            "storage": "1TB NVMe SSD",
            "display": "15.6 inch 4K IPS",
            "weight": "1.8kg",
            "battery_life": "12 hours"
        },
        "features": ["Thunderbolt 4", "WiFi 6E", "Backlit Keyboard", "Fingerprint Reader"],
        "warranty": "3 years premium support"
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '5 days'),

    ('cc0e8400-e29b-41d4-a716-446655440002'::uuid, 'AVE-SWITCH-001', 'Averis Enterprise Switch 48-Port', 
     'Managed Ethernet switch with 48 Gigabit ports and 4 SFP+ uplinks for enterprise networking',
     'Averis', 'Averis Networks', '990e8400-e29b-41d4-a716-446655440005'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '45 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '40 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '35 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '30 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '25 days',
     '{
        "technical_specs": {
            "ports": "48x 1GbE + 4x 10GbE SFP+",
            "switching_capacity": "176 Gbps",
            "forwarding_rate": "130.95 Mpps",
            "mac_addresses": "32,000",
            "power_consumption": "65W",
            "rack_units": "1U"
        },
        "features": ["VLAN Support", "QoS", "SNMP Management", "Redundant Power"],
        "certifications": ["FCC", "CE", "RoHS"]
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '20 days'),

    ('cc0e8400-e29b-41d4-a716-446655440003'::uuid, 'AVE-STORAGE-001', 'Averis NAS Pro 8-Bay', 
     'Network Attached Storage solution with 8 hot-swappable drive bays for small to medium businesses',
     'Averis', 'Averis Storage Systems', '990e8400-e29b-41d4-a716-446655440006'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '60 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '55 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '50 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '45 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '40 days',
     '{
        "technical_specs": {
            "drive_bays": "8x 3.5 inch SATA/SAS",
            "max_capacity": "128TB",
            "processor": "Intel Xeon D-1518",
            "memory": "16GB ECC DDR4",
            "network": "4x 1GbE + 2x 10GbE",
            "raid_levels": ["0", "1", "5", "6", "10", "50", "60"]
        },
        "features": ["Hot-Swap Drives", "Redundant PSU", "IPMI", "SSD Cache"],
        "protocols": ["SMB", "NFS", "iSCSI", "FTP"]
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '35 days'),

    -- Software Products
    ('cc0e8400-e29b-41d4-a716-446655440004'::uuid, 'AVE-OFFICE-PRO', 'Averis Office Professional Suite', 
     'Complete productivity software suite including word processing, spreadsheets, presentations, and collaboration tools',
     'Averis', 'Averis Software', '990e8400-e29b-41d4-a716-446655440007'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '90 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '85 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '80 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '75 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '70 days',
     '{
        "applications": ["Word Processor", "Spreadsheet", "Presentation", "Email Client", "Calendar"],
        "platforms": ["Windows", "macOS", "Linux"],
        "license_type": "Perpetual",
        "concurrent_users": "Unlimited",
        "cloud_integration": true,
        "file_formats": ["DOCX", "XLSX", "PPTX", "PDF", "ODT", "ODS", "ODP"]
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '65 days'),

    ('cc0e8400-e29b-41d4-a716-446655440005'::uuid, 'AVE-SECURITY-ENDPOINT', 'Averis Endpoint Security Pro', 
     'Advanced endpoint protection with real-time threat detection, behavioral analysis, and centralized management',
     'Averis', 'Averis Security', '990e8400-e29b-41d4-a716-446655440008'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '75 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '70 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '65 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '60 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '55 days',
     '{
        "protection_features": ["Anti-Virus", "Anti-Malware", "Firewall", "Web Protection", "Email Security"],
        "advanced_features": ["Behavioral Analysis", "Machine Learning", "Zero-Day Protection", "Ransomware Shield"],
        "platforms": ["Windows", "macOS", "Linux", "Mobile"],
        "management": "Centralized Console",
        "compliance": ["SOC 2", "GDPR", "HIPAA"],
        "deployment": ["On-Premise", "Cloud", "Hybrid"]
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '50 days'),

    -- Service Products
    ('cc0e8400-e29b-41d4-a716-446655440006'::uuid, 'AVE-CONSULT-IMPL', 'Averis Implementation Consulting', 
     'Professional consulting services for software implementation, system integration, and digital transformation',
     'Averis', 'Averis Professional Services', '990e8400-e29b-41d4-a716-446655440010'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '45 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '40 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '35 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '30 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '25 days',
     '{
        "service_areas": ["System Integration", "Data Migration", "Process Optimization", "Training"],
        "methodologies": ["Agile", "Waterfall", "DevOps", "ITIL"],
        "certifications": ["PMP", "CISSP", "ITIL", "AWS", "Azure", "GCP"],
        "engagement_models": ["Fixed Price", "Time & Materials", "Outcome Based"],
        "industries": ["Healthcare", "Financial Services", "Manufacturing", "Retail", "Government"]
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '20 days'),

    ('cc0e8400-e29b-41d4-a716-446655440007'::uuid, 'AVE-SUPPORT-PREMIUM', 'Averis Premium Support Services', 
     'Comprehensive 24/7 technical support with dedicated account management and priority response times',
     'Averis', 'Averis Support Services', '990e8400-e29b-41d4-a716-446655440011'::uuid, 'active', true, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '30 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '25 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440005'::uuid, CURRENT_TIMESTAMP - INTERVAL '20 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '15 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '10 days',
     '{
        "support_levels": ["Level 1", "Level 2", "Level 3", "Engineering Escalation"],
        "response_times": {"Critical": "1 hour", "High": "4 hours", "Medium": "8 hours", "Low": "24 hours"},
        "channels": ["Phone", "Email", "Chat", "Portal", "Remote Access"],
        "availability": "24/7/365",
        "services": ["Incident Resolution", "Problem Management", "Health Checks", "Performance Optimization"],
        "account_management": "Dedicated Account Manager"
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid,
     'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '5 days'),

    -- Draft Products (not yet launched)
    ('cc0e8400-e29b-41d4-a716-446655440008'::uuid, 'AVE-TABLET-001', 'Averis Business Tablet Pro', 
     'Professional tablet designed for business use with enhanced security and productivity features',
     'Averis', 'Averis Manufacturing', '990e8400-e29b-41d4-a716-446655440004'::uuid, 'draft', false, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '10 days',
     false, NULL, NULL,
     false, NULL, NULL,
     true, 'aa0e8400-e29b-41d4-a716-446655440001'::uuid, CURRENT_TIMESTAMP - INTERVAL '5 days',
     false, NULL, NULL,
     '{
        "technical_specs": {
            "display": "12.3 inch 2K OLED",
            "processor": "Qualcomm Snapdragon 8cx Gen 3",
            "memory": "16GB LPDDR5",
            "storage": "512GB UFS 3.1",
            "camera": "13MP rear, 8MP front",
            "connectivity": ["WiFi 6E", "5G", "Bluetooth 5.2"],
            "battery": "10,000 mAh"
        },
        "features": ["Stylus Support", "Detachable Keyboard", "Face Recognition", "Fingerprint Reader"],
        "target_launch": "Q2 2024"
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid, NULL, NULL),

    ('cc0e8400-e29b-41d4-a716-446655440009'::uuid, 'AVE-AI-PLATFORM', 'Averis AI Development Platform', 
     'Comprehensive AI/ML development platform with pre-trained models, development tools, and deployment services',
     'Averis', 'Averis AI Labs', '990e8400-e29b-41d4-a716-446655440009'::uuid, 'draft', false, true,
     true, 'aa0e8400-e29b-41d4-a716-446655440002'::uuid, CURRENT_TIMESTAMP - INTERVAL '15 days',
     true, 'aa0e8400-e29b-41d4-a716-446655440004'::uuid, CURRENT_TIMESTAMP - INTERVAL '10 days',
     false, NULL, NULL,
     false, NULL, NULL,
     false, NULL, NULL,
     '{
        "features": ["Pre-trained Models", "Model Training", "AutoML", "MLOps Pipeline", "API Gateway"],
        "supported_frameworks": ["TensorFlow", "PyTorch", "Scikit-learn", "XGBoost", "Keras"],
        "deployment_options": ["Cloud", "Edge", "On-Premise", "Hybrid"],
        "use_cases": ["Computer Vision", "NLP", "Predictive Analytics", "Recommendation Systems"],
        "pricing_model": "Usage-based",
        "target_launch": "Q3 2024"
     }'::jsonb,
     'aa0e8400-e29b-41d4-a716-446655440002'::uuid, NULL, NULL)
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    brand = EXCLUDED.brand,
    manufacturer = EXCLUDED.manufacturer,
    category_id = EXCLUDED.category_id,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    available_flag = EXCLUDED.available_flag,
    attributes = EXCLUDED.attributes,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- SYNC PRODUCTS TO STAGING
-- ========================================
-- Copy active products to staging schema
INSERT INTO averis_product_staging.products (
    id, sku, name, description, brand, manufacturer, category_id, status, 
    is_active, available_flag, attributes, metadata, launched_at, synced_at
)
SELECT 
    p.id, p.sku, p.name, p.description, p.brand, p.manufacturer, p.category_id, p.status,
    p.is_active, p.available_flag, p.attributes, p.metadata, p.launched_at, CURRENT_TIMESTAMP
FROM averis_product.products p
WHERE p.status = 'active' AND p.is_active = true
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    brand = EXCLUDED.brand,
    manufacturer = EXCLUDED.manufacturer,
    category_id = EXCLUDED.category_id,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    available_flag = EXCLUDED.available_flag,
    attributes = EXCLUDED.attributes,
    metadata = EXCLUDED.metadata,
    launched_at = EXCLUDED.launched_at,
    synced_at = CURRENT_TIMESTAMP;

-- Copy categories to staging
INSERT INTO averis_product_staging.categories (
    id, parent_id, code, name, description, level, path, is_active, synced_at
)
SELECT 
    id, parent_id, code, name, description, level, path, is_active, CURRENT_TIMESTAMP
FROM averis_product.categories
WHERE is_active = true
ON CONFLICT (id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    path = EXCLUDED.path,
    is_active = EXCLUDED.is_active,
    synced_at = CURRENT_TIMESTAMP;

-- ========================================
-- PRICING MDM SAMPLE DATA
-- ========================================
-- Copy active products to pricing schema (simplified view)
INSERT INTO averis_pricing.products (
    id, sku, name, description, brand, manufacturer, category_path, status, is_active, attributes
)
SELECT 
    p.id, p.sku, p.name, p.description, p.brand, p.manufacturer,
    COALESCE(c.path, 'Unknown'),
    p.status, p.is_active, p.attributes
FROM averis_product_staging.products p
LEFT JOIN averis_product_staging.categories c ON p.category_id = c.id
WHERE p.status = 'active' AND p.is_active = true
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    brand = EXCLUDED.brand,
    manufacturer = EXCLUDED.manufacturer,
    category_path = EXCLUDED.category_path,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    attributes = EXCLUDED.attributes,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- SAMPLE CATALOGS
-- ========================================
INSERT INTO averis_pricing.catalogs (
    id, code, name, region_id, market_segment_id, currency_id, 
    effective_from, effective_to, priority, status, is_active, is_default, created_by
) VALUES 
    -- Americas Catalogs
    ('dd0e8400-e29b-41d4-a716-446655440001'::uuid, 'AMER-ENT-2024', 'Americas Enterprise Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 1, 'active', true, true, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440002'::uuid, 'AMER-SMB-2024', 'Americas SMB Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 2, 'active', true, false, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440003'::uuid, 'AMER-RETAIL-2024', 'Americas Retail Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440001'::uuid, '660e8400-e29b-41d4-a716-446655440003'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 3, 'active', true, false, 'pricing-system'),

    -- EMEA Catalogs
    ('dd0e8400-e29b-41d4-a716-446655440004'::uuid, 'EMEA-ENT-2024', 'EMEA Enterprise Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 1, 'active', true, true, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440005'::uuid, 'EMEA-SMB-2024', 'EMEA SMB Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 2, 'active', true, false, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440006'::uuid, 'EMEA-PARTNER-2024', 'EMEA Partner Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440002'::uuid, '660e8400-e29b-41d4-a716-446655440004'::uuid, '770e8400-e29b-41d4-a716-446655440002'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 3, 'active', true, false, 'pricing-system'),

    -- APAC Catalogs
    ('dd0e8400-e29b-41d4-a716-446655440007'::uuid, 'APAC-ENT-2024', 'APAC Enterprise Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440001'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 1, 'active', true, true, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440008'::uuid, 'APAC-SMB-2024', 'APAC SMB Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440002'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 2, 'active', true, false, 'pricing-system'),
     
    ('dd0e8400-e29b-41d4-a716-446655440009'::uuid, 'APAC-DIRECT-2024', 'APAC Direct Sales Catalog 2024',
     '550e8400-e29b-41d4-a716-446655440003'::uuid, '660e8400-e29b-41d4-a716-446655440005'::uuid, '770e8400-e29b-41d4-a716-446655440001'::uuid,
     '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 3, 'active', true, false, 'pricing-system')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    region_id = EXCLUDED.region_id,
    market_segment_id = EXCLUDED.market_segment_id,
    currency_id = EXCLUDED.currency_id,
    effective_from = EXCLUDED.effective_from,
    effective_to = EXCLUDED.effective_to,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- CATALOG PRODUCTS WITH PRICING
-- ========================================
-- Add all active products to enterprise catalogs with premium pricing
INSERT INTO averis_pricing.catalog_products (
    catalog_id, product_id, sku, base_price, list_price, currency_id, 
    effective_from, effective_to, is_active, pricing_metadata
)
SELECT 
    c.id as catalog_id,
    p.id as product_id,
    p.sku,
    CASE p.sku
        WHEN 'AVE-LAPTOP-001' THEN 2499.99
        WHEN 'AVE-SWITCH-001' THEN 899.99
        WHEN 'AVE-STORAGE-001' THEN 3499.99
        WHEN 'AVE-OFFICE-PRO' THEN 299.99
        WHEN 'AVE-SECURITY-ENDPOINT' THEN 79.99
        WHEN 'AVE-CONSULT-IMPL' THEN 1500.00
        WHEN 'AVE-SUPPORT-PREMIUM' THEN 500.00
        ELSE 99.99
    END as base_price,
    CASE p.sku
        WHEN 'AVE-LAPTOP-001' THEN 2899.99
        WHEN 'AVE-SWITCH-001' THEN 1099.99
        WHEN 'AVE-STORAGE-001' THEN 3999.99
        WHEN 'AVE-OFFICE-PRO' THEN 349.99
        WHEN 'AVE-SECURITY-ENDPOINT' THEN 99.99
        WHEN 'AVE-CONSULT-IMPL' THEN 1750.00
        WHEN 'AVE-SUPPORT-PREMIUM' THEN 600.00
        ELSE 119.99
    END as list_price,
    c.currency_id,
    c.effective_from,
    c.effective_to,
    true,
    ('{"pricing_tier": "enterprise", "discount_eligible": true, "volume_pricing": true}')::jsonb
FROM averis_pricing.catalogs c
CROSS JOIN averis_pricing.products p
WHERE c.market_segment_id = '660e8400-e29b-41d4-a716-446655440001'::uuid -- Enterprise
  AND p.is_active = true
ON CONFLICT (catalog_id, product_id) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    list_price = EXCLUDED.list_price,
    currency_id = EXCLUDED.currency_id,
    effective_from = EXCLUDED.effective_from,
    effective_to = EXCLUDED.effective_to,
    is_active = EXCLUDED.is_active,
    pricing_metadata = EXCLUDED.pricing_metadata,
    updated_at = CURRENT_TIMESTAMP;

-- Add selected products to SMB catalogs with competitive pricing
INSERT INTO averis_pricing.catalog_products (
    catalog_id, product_id, sku, base_price, list_price, currency_id, 
    effective_from, effective_to, is_active, pricing_metadata
)
SELECT 
    c.id as catalog_id,
    p.id as product_id,
    p.sku,
    CASE p.sku
        WHEN 'AVE-LAPTOP-001' THEN 2299.99
        WHEN 'AVE-SWITCH-001' THEN 799.99
        WHEN 'AVE-OFFICE-PRO' THEN 249.99
        WHEN 'AVE-SECURITY-ENDPOINT' THEN 69.99
        WHEN 'AVE-SUPPORT-PREMIUM' THEN 400.00
        ELSE 89.99
    END as base_price,
    CASE p.sku
        WHEN 'AVE-LAPTOP-001' THEN 2599.99
        WHEN 'AVE-SWITCH-001' THEN 949.99
        WHEN 'AVE-OFFICE-PRO' THEN 289.99
        WHEN 'AVE-SECURITY-ENDPOINT' THEN 84.99
        WHEN 'AVE-SUPPORT-PREMIUM' THEN 480.00
        ELSE 109.99
    END as list_price,
    c.currency_id,
    c.effective_from,
    c.effective_to,
    true,
    ('{"pricing_tier": "smb", "discount_eligible": true, "volume_pricing": false}')::jsonb
FROM averis_pricing.catalogs c
CROSS JOIN averis_pricing.products p
WHERE c.market_segment_id = '660e8400-e29b-41d4-a716-446655440002'::uuid -- SMB
  AND p.sku IN ('AVE-LAPTOP-001', 'AVE-SWITCH-001', 'AVE-OFFICE-PRO', 'AVE-SECURITY-ENDPOINT', 'AVE-SUPPORT-PREMIUM')
  AND p.is_active = true
ON CONFLICT (catalog_id, product_id) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    list_price = EXCLUDED.list_price,
    currency_id = EXCLUDED.currency_id,
    effective_from = EXCLUDED.effective_from,
    effective_to = EXCLUDED.effective_to,
    is_active = EXCLUDED.is_active,
    pricing_metadata = EXCLUDED.pricing_metadata,
    updated_at = CURRENT_TIMESTAMP;