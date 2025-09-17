-- ========================================
-- PRODUCT SAMPLE DATA - 100 Products
-- ========================================
-- Creates realistic product data for testing across different categories and scenarios

-- First, let's check current product count
SELECT 'Current product count: ' || COUNT(*) FROM averis_product.products;

-- Insert 100 sample products with varied attributes
INSERT INTO averis_product.products (
    id, sku, name, description, type, base_price, cost_price, 
    license_required_flag, seat_based_pricing_flag, web_display_flag,
    ava_tax_code, can_be_fulfilled_flag, contract_item_flag, 
    slug, long_description, status, available_flag,
    brand, manufacturer, 
    categorization, pricing, approvals,
    created_by, updated_by
) VALUES
-- Software Products (20 items)
(gen_random_uuid(), 'SW-OFFICE-365', 'Microsoft Office 365 Business', 'Complete office productivity suite with cloud collaboration', 'Software', 15.99, 8.50, true, true, true, 'TX_SOFTWARE', true, true, 'microsoft-office-365-business', 'Microsoft Office 365 Business includes Word, Excel, PowerPoint, Outlook, Teams, and 1TB OneDrive storage per user. Perfect for small to medium businesses.', 'active', true, 'Microsoft', 'Microsoft Corporation', '["productivity", "software", "subscription"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'SW-ADOBE-CC', 'Adobe Creative Cloud All Apps', 'Complete creative suite for designers and content creators', 'Software', 54.99, 35.00, true, true, true, 'TX_SOFTWARE', true, true, 'adobe-creative-cloud-all-apps', 'Adobe Creative Cloud includes Photoshop, Illustrator, InDesign, Premiere Pro, After Effects, and 20+ creative apps with cloud storage.', 'active', true, 'Adobe', 'Adobe Inc.', '["design", "software", "creative"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'SW-ZOOM-PRO', 'Zoom Pro Video Conferencing', 'Professional video conferencing solution', 'Software', 14.99, 8.00, true, true, true, 'TX_SOFTWARE', true, true, 'zoom-pro-video-conferencing', 'Zoom Pro supports up to 100 participants, cloud recording, and admin features for professional meetings.', 'active', true, 'Zoom', 'Zoom Video Communications', '["communication", "software", "video"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'SW-SLACK-PLUS', 'Slack Plus Team Communication', 'Advanced team collaboration platform', 'Software', 8.75, 4.50, true, true, true, 'TX_SOFTWARE', true, true, 'slack-plus-team-communication', 'Slack Plus includes unlimited message history, guest access, and advanced security features.', 'active', true, 'Slack', 'Slack Technologies', '["communication", "software", "collaboration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'SW-SALESFORCE', 'Salesforce CRM Professional', 'Customer relationship management platform', 'Software', 75.00, 45.00, true, true, true, 'TX_SOFTWARE', true, true, 'salesforce-crm-professional', 'Salesforce Professional includes lead management, opportunity tracking, and customizable dashboards.', 'active', true, 'Salesforce', 'Salesforce.com', '["crm", "software", "business"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Hardware Products (25 items)
(gen_random_uuid(), 'HW-DELL-LAP-001', 'Dell XPS 13 Laptop', 'Premium ultrabook for professionals', 'Hardware', 999.99, 650.00, false, false, true, 'TX_COMPUTER', true, false, 'dell-xps-13-laptop', 'Dell XPS 13 features Intel Core i7, 16GB RAM, 512GB SSD, and 13.4-inch InfinityEdge display.', 'active', true, 'Dell', 'Dell Technologies', '["laptop", "computer", "hardware"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'HW-MAC-PRO-001', 'MacBook Pro 14-inch M3', 'Apple professional laptop with M3 chip', 'Hardware', 1999.99, 1200.00, false, false, true, 'TX_COMPUTER', true, false, 'macbook-pro-14-inch-m3', 'MacBook Pro 14-inch with Apple M3 chip, 18GB unified memory, 512GB SSD, and Liquid Retina XDR display.', 'active', true, 'Apple', 'Apple Inc.', '["laptop", "computer", "apple"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'HW-MON-LG-001', 'LG 27-inch 4K Monitor', 'Ultra HD monitor for professionals', 'Hardware', 329.99, 200.00, false, false, true, 'TX_ELECTRONICS', true, false, 'lg-27-inch-4k-monitor', 'LG 27-inch 4K UHD monitor with HDR10 support, USB-C connectivity, and ergonomic stand.', 'active', true, 'LG', 'LG Electronics', '["monitor", "display", "hardware"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'HW-KEY-LOG-001', 'Logitech MX Master 3S Mouse', 'Wireless mouse for productivity', 'Hardware', 99.99, 55.00, false, false, true, 'TX_ELECTRONICS', true, false, 'logitech-mx-master-3s-mouse', 'Logitech MX Master 3S features precise tracking, customizable buttons, and 70-day battery life.', 'active', true, 'Logitech', 'Logitech International', '["mouse", "peripheral", "wireless"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'HW-KEY-MEC-001', 'Mechanical Keyboard RGB', 'Gaming mechanical keyboard with RGB lighting', 'Hardware', 149.99, 85.00, false, false, true, 'TX_ELECTRONICS', true, false, 'mechanical-keyboard-rgb', 'Mechanical keyboard with Cherry MX switches, per-key RGB lighting, and programmable macros.', 'active', true, 'Corsair', 'Corsair Gaming', '["keyboard", "gaming", "mechanical"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Cloud Services (15 items)
(gen_random_uuid(), 'CLD-AWS-EC2', 'AWS EC2 Instance t3.medium', 'Virtual server instance on Amazon Web Services', 'Cloud Service', 35.00, 25.00, true, false, true, 'TX_CLOUD', true, true, 'aws-ec2-instance-t3-medium', 'AWS EC2 t3.medium instance with 2 vCPUs, 4GB RAM, and burstable performance.', 'active', true, 'Amazon', 'Amazon Web Services', '["cloud", "compute", "aws"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'CLD-AZURE-VM', 'Azure Virtual Machine B2s', 'Virtual machine on Microsoft Azure', 'Cloud Service', 32.00, 23.00, true, false, true, 'TX_CLOUD', true, true, 'azure-virtual-machine-b2s', 'Azure B2s VM with 2 vCPUs, 4GB RAM, and 8GB temporary storage.', 'active', true, 'Microsoft', 'Microsoft Azure', '["cloud", "compute", "azure"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'CLD-GCP-COMP', 'Google Cloud Compute Engine', 'Virtual machine on Google Cloud Platform', 'Cloud Service', 30.00, 21.00, true, false, true, 'TX_CLOUD', true, true, 'google-cloud-compute-engine', 'Google Cloud Compute Engine n1-standard-2 instance with 2 vCPUs and 7.5GB memory.', 'active', true, 'Google', 'Google Cloud', '["cloud", "compute", "gcp"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Professional Services (10 items)
(gen_random_uuid(), 'SVC-CONS-DEV', 'Software Development Consulting', 'Expert software development consultation', 'Service', 150.00, 75.00, false, false, true, 'TX_SERVICE', true, true, 'software-development-consulting', 'Professional software development consulting for custom applications and system architecture.', 'active', true, 'TechConsult', 'TechConsult Pro', '["consulting", "development", "professional"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'SVC-TRAIN-TECH', 'Technical Training Workshop', 'Comprehensive technical training programs', 'Service', 500.00, 200.00, false, false, true, 'TX_SERVICE', true, true, 'technical-training-workshop', 'Hands-on technical training workshops covering modern development practices and tools.', 'active', true, 'TechEd', 'TechEducation Inc.', '["training", "education", "workshop"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Office Supplies (10 items)
(gen_random_uuid(), 'OFF-CHAIR-ERG', 'Ergonomic Office Chair', 'Comfortable ergonomic chair for long work sessions', 'Physical Product', 299.99, 150.00, false, false, true, 'TX_TANGIBLE', true, false, 'ergonomic-office-chair', 'Ergonomic office chair with lumbar support, adjustable height, and breathable mesh back.', 'active', true, 'Herman Miller', 'Herman Miller Inc.', '["furniture", "office", "ergonomic"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'OFF-DESK-SIT', 'Standing Desk Converter', 'Adjustable standing desk converter', 'Physical Product', 199.99, 100.00, false, false, true, 'TX_TANGIBLE', true, false, 'standing-desk-converter', 'Height-adjustable desk converter that transforms any desk into a standing workspace.', 'active', true, 'UPLIFT', 'UPLIFT Desk', '["furniture", "office", "health"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Mobile Devices (10 items)  
(gen_random_uuid(), 'MOB-IPHONE-15', 'iPhone 15 Pro 256GB', 'Latest Apple iPhone with Pro features', 'Hardware', 1199.99, 750.00, false, false, true, 'TX_ELECTRONICS', true, false, 'iphone-15-pro-256gb', 'iPhone 15 Pro with A17 Pro chip, 256GB storage, Pro camera system, and titanium design.', 'active', true, 'Apple', 'Apple Inc.', '["mobile", "smartphone", "apple"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),
(gen_random_uuid(), 'MOB-SAMSUNG-S24', 'Samsung Galaxy S24 Ultra', 'Premium Android smartphone with S Pen', 'Hardware', 1299.99, 800.00, false, false, true, 'TX_ELECTRONICS', true, false, 'samsung-galaxy-s24-ultra', 'Samsung Galaxy S24 Ultra with 200MP camera, S Pen, and 6.8-inch Dynamic AMOLED display.', 'active', true, 'Samsung', 'Samsung Electronics', '["mobile", "smartphone", "android"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system'),

-- Networking Equipment (10 items)
(gen_random_uuid(), 'NET-CISCO-SW', 'Cisco Catalyst 2960 Switch', '24-port managed Ethernet switch', 'Hardware', 899.99, 550.00, false, false, true, 'TX_ELECTRONICS', true, false, 'cisco-catalyst-2960-switch', 'Cisco Catalyst 2960 24-port managed switch with Layer 2 switching and PoE support.', 'active', true, 'Cisco', 'Cisco Systems', '["networking", "switch", "enterprise"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'system', 'system');

-- Continue with more products to reach 100 total
INSERT INTO averis_product.products (
    id, sku, name, description, type, base_price, cost_price, 
    license_required_flag, seat_based_pricing_flag, web_display_flag,
    ava_tax_code, can_be_fulfilled_flag, contract_item_flag, 
    slug, long_description, status, available_flag,
    brand, manufacturer, 
    categorization, pricing, approvals,
    created_by, updated_by
) SELECT 
    gen_random_uuid(),
    'BULK-' || LPAD(generate_series::text, 3, '0'),
    'Sample Product ' || generate_series,
    'This is sample product number ' || generate_series || ' for testing purposes.',
    CASE 
        WHEN generate_series % 4 = 0 THEN 'Software'
        WHEN generate_series % 4 = 1 THEN 'Hardware' 
        WHEN generate_series % 4 = 2 THEN 'Service'
        ELSE 'Cloud Service'
    END,
    ROUND((RANDOM() * 1000 + 10)::numeric, 2), -- Random price between $10-$1010
    ROUND((RANDOM() * 500 + 5)::numeric, 2),   -- Random cost between $5-$505
    (generate_series % 3 = 0), -- Every 3rd product requires license
    (generate_series % 5 = 0), -- Every 5th product is seat-based
    true, -- All web displayable
    CASE 
        WHEN generate_series % 4 = 0 THEN 'TX_SOFTWARE'
        WHEN generate_series % 4 = 1 THEN 'TX_ELECTRONICS'
        WHEN generate_series % 4 = 2 THEN 'TX_SERVICE'
        ELSE 'TX_CLOUD'
    END,
    true, -- All can be fulfilled
    (generate_series % 10 = 0), -- Every 10th is contract item
    'sample-product-' || generate_series,
    'Detailed description for sample product ' || generate_series || '. This product demonstrates various features and capabilities of the product management system.',
    CASE 
        WHEN generate_series % 20 = 0 THEN 'draft'
        WHEN generate_series % 15 = 0 THEN 'deprecated'
        ELSE 'active'
    END,
    (generate_series % 25 != 0), -- Most are available, some not
    'Brand' || (generate_series % 10), -- 10 different brands
    'Manufacturer' || (generate_series % 5), -- 5 different manufacturers
    ('["category' || (generate_series % 8) || '", "test", "sample"]')::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'system',
    'system'
FROM generate_series(1, 75); -- This will create 75 more products (total 100)

-- Update some products to have different statuses and approval states
UPDATE averis_product.products 
SET marketing_approved = true, 
    marketing_approved_by = 1,
    marketing_approved_at = CURRENT_TIMESTAMP
WHERE sku LIKE 'SW-%' OR sku LIKE 'BULK-0%';

UPDATE averis_product.products 
SET legal_approved = true,
    legal_approved_by = 2, 
    legal_approved_at = CURRENT_TIMESTAMP
WHERE base_price > 100;

UPDATE averis_product.products 
SET finance_approved = true,
    finance_approved_by = 3,
    finance_approved_at = CURRENT_TIMESTAMP  
WHERE cost_price < 100;

UPDATE averis_product.products
SET salesops_approved = true,
    salesops_approved_by = 4,
    salesops_approved_at = CURRENT_TIMESTAMP
WHERE web_display_flag = true;

UPDATE averis_product.products
SET contracts_approved = true,
    contracts_approved_by = 5,
    contracts_approved_at = CURRENT_TIMESTAMP
WHERE contract_item_flag = true;

-- Show final count
SELECT 'Total products created: ' || COUNT(*) FROM averis_product.products;
SELECT 'Products by status: ' as status_summary;
SELECT status, COUNT(*) as count FROM averis_product.products GROUP BY status ORDER BY status;
SELECT 'Products by type: ' as type_summary;  
SELECT type, COUNT(*) as count FROM averis_product.products GROUP BY type ORDER BY type;