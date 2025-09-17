-- ========================================
-- LOCALE WORKFLOW ENHANCEMENT MIGRATION
-- ========================================
-- Enhances catalog product management with locale-specific pricing and content workflows
-- Adds workflow states and management tables for locale-aware product addition

BEGIN;

-- ========================================
-- STEP 1: ENHANCE CATALOG PRODUCTS WITH WORKFLOW STATE
-- ========================================

-- Add workflow columns to catalog_products
ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS locale_workflow_status VARCHAR(50) DEFAULT 'pending' 
CHECK (locale_workflow_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));

ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS content_workflow_status VARCHAR(50) DEFAULT 'pending' 
CHECK (content_workflow_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped'));

ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS selected_locales TEXT[]; -- Store selected locale codes for this product

ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS workflow_initiated_by VARCHAR(255); -- User who initiated workflow

ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS workflow_initiated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE averis_pricing.catalog_products 
ADD COLUMN IF NOT EXISTS workflow_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_catalog_products_locale_workflow 
ON averis_pricing.catalog_products(locale_workflow_status);

CREATE INDEX IF NOT EXISTS idx_catalog_products_content_workflow 
ON averis_pricing.catalog_products(content_workflow_status);

-- ========================================
-- STEP 2: CREATE CATALOG PRODUCT WORKFLOW TRACKING
-- ========================================

-- Track locale-specific workflow progress for each catalog product
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_product_workflow_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_product_id UUID NOT NULL REFERENCES averis_pricing.catalog_products(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN ('locale_financials', 'multi_language_content')),
    
    -- Target locale information
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    locale_code VARCHAR(10) NOT NULL,
    
    -- Progress tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Results and metadata
    result_data JSONB DEFAULT '{}', -- Store calculation results or content
    error_message TEXT,
    processing_duration_ms INTEGER,
    
    -- Quality metrics
    quality_score DECIMAL(3,2), -- 0.00 to 1.00 score for generated content quality
    requires_review BOOLEAN DEFAULT false,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Ensure unique workflow per catalog product + locale + type
    CONSTRAINT unique_catalog_product_workflow UNIQUE(catalog_product_id, locale_id, workflow_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_workflow_progress_catalog_product 
ON averis_pricing.catalog_product_workflow_progress(catalog_product_id);

CREATE INDEX IF NOT EXISTS idx_workflow_progress_status 
ON averis_pricing.catalog_product_workflow_progress(status);

CREATE INDEX IF NOT EXISTS idx_workflow_progress_locale 
ON averis_pricing.catalog_product_workflow_progress(locale_id);

CREATE INDEX IF NOT EXISTS idx_workflow_progress_type 
ON averis_pricing.catalog_product_workflow_progress(workflow_type);

-- ========================================
-- STEP 3: CREATE WORKFLOW BATCH JOBS
-- ========================================

-- Track batch operations for multiple products/locales
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_workflow_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('locale_financials', 'multi_language_content', 'bulk_assignment', 'full_localization')),
    
    -- Job scope
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id),
    product_ids UUID[], -- Products to process
    locale_ids UUID[], -- Locales to process
    locale_codes TEXT[], -- Locale codes for quick reference
    
    -- Job configuration
    job_config JSONB DEFAULT '{}', -- Job-specific configuration
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest, 10 = lowest
    
    -- Progress tracking
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    
    -- Results
    result_summary JSONB DEFAULT '{}',
    error_log TEXT[],
    
    -- User context
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for job management
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_status ON averis_pricing.catalog_workflow_jobs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_catalog ON averis_pricing.catalog_workflow_jobs(catalog_id);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_type ON averis_pricing.catalog_workflow_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_priority ON averis_pricing.catalog_workflow_jobs(priority, queued_at);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_created_by ON averis_pricing.catalog_workflow_jobs(created_by);

-- ========================================
-- STEP 4: CREATE WORKFLOW TEMPLATES
-- ========================================

-- Predefined workflow templates for common operations
CREATE TABLE IF NOT EXISTS averis_pricing.workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('locale_financials', 'multi_language_content', 'full_localization')),
    description TEXT,
    
    -- Template configuration
    default_config JSONB NOT NULL DEFAULT '{}',
    supported_locales TEXT[], -- Locale codes this template supports
    required_permissions TEXT[], -- Required user permissions
    
    -- Template metadata
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false, -- System vs user-created templates
    usage_count INTEGER DEFAULT 0,
    
    -- Template settings
    auto_execute BOOLEAN DEFAULT false, -- Automatically execute when conditions are met
    batch_size INTEGER DEFAULT 50, -- Items to process per batch
    estimated_duration_per_item_ms INTEGER DEFAULT 5000, -- For progress estimation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Insert default workflow templates
INSERT INTO averis_pricing.workflow_templates (
    template_name, 
    template_type, 
    description, 
    default_config, 
    supported_locales,
    is_system_template,
    estimated_duration_per_item_ms
) VALUES 
(
    'Quick Localization - Major Markets',
    'full_localization',
    'Generates locale-specific financials and content for major markets (US, EU, UK, Canada)',
    '{"include_tax_calculations": true, "include_regulatory_fees": true, "translation_quality": "standard", "auto_approve_calculations": true}',
    ARRAY['en_US', 'en_GB', 'en_CA', 'fr_FR', 'de_DE', 'es_ES', 'it_IT'],
    true,
    8000
),
(
    'Pricing Only - All Markets',
    'locale_financials',
    'Calculates locale-specific pricing for all available markets without content translation',
    '{"include_tax_calculations": true, "include_regulatory_fees": true, "currency_conversion": true, "price_rounding": true}',
    NULL, -- All locales
    true,
    3000
),
(
    'Content Translation - European Markets',
    'multi_language_content',
    'Generates multi-language content for European markets with quality review',
    '{"translation_quality": "high", "require_review": true, "include_seo_optimization": true, "preserve_brand_terms": true}',
    ARRAY['fr_FR', 'de_DE', 'es_ES', 'it_IT', 'nl_NL', 'pt_PT'],
    true,
    12000
),
(
    'Express Setup - Single Locale',
    'full_localization',
    'Quick setup for adding a product to a single new locale with automatic approval',
    '{"auto_approve_calculations": true, "auto_approve_content": false, "priority": "high"}',
    NULL, -- Any single locale
    true,
    5000
);

-- ========================================
-- STEP 5: CREATE WORKFLOW HELPER FUNCTIONS
-- ========================================

-- Function to get available locales for a catalog based on region and market segment
CREATE OR REPLACE FUNCTION get_available_locales_for_catalog(catalog_id_param UUID)
RETURNS TABLE(
    locale_id UUID,
    locale_code VARCHAR(10),
    locale_name VARCHAR(255),
    country_code CHAR(2),
    country_name VARCHAR(100),
    currency_code VARCHAR(3),
    is_default BOOLEAN,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.code,
        l.name,
        c.code,
        c.name,
        cur.code,
        (c.default_locale_id = l.id),
        l.priority_in_country
    FROM averis_pricing.catalogs cat
    JOIN averis_pricing.regions r ON r.id = cat.region_id
    JOIN averis_pricing.countries c ON c.region_id = r.id
    JOIN averis_pricing.locales l ON l.country_id = c.id
    JOIN averis_pricing.currencies cur ON cur.id = l.currency_id
    WHERE cat.id = catalog_id_param
        AND cat.is_active = true
        AND c.is_active = true
        AND l.is_active = true
        AND cur.is_active = true
    ORDER BY c.name, l.priority_in_country, l.name;
END;
$$ LANGUAGE plpgsql;

-- Function to estimate workflow completion time
CREATE OR REPLACE FUNCTION estimate_workflow_duration(
    workflow_type_param VARCHAR(50),
    item_count INTEGER,
    locale_count INTEGER,
    template_id UUID DEFAULT NULL
) RETURNS INTERVAL AS $$
DECLARE
    base_duration_ms INTEGER;
    total_items INTEGER;
    estimated_ms INTEGER;
BEGIN
    -- Get base duration from template or use defaults
    IF template_id IS NOT NULL THEN
        SELECT estimated_duration_per_item_ms INTO base_duration_ms
        FROM averis_pricing.workflow_templates
        WHERE id = template_id;
    END IF;
    
    -- Use default durations if no template specified
    IF base_duration_ms IS NULL THEN
        base_duration_ms := CASE workflow_type_param
            WHEN 'locale_financials' THEN 3000
            WHEN 'multi_language_content' THEN 12000
            WHEN 'full_localization' THEN 15000
            ELSE 5000
        END;
    END IF;
    
    -- Calculate total items to process
    total_items := item_count * locale_count;
    
    -- Estimate with some overhead for batch processing
    estimated_ms := (total_items * base_duration_ms) + (total_items * 500); -- 500ms overhead per item
    
    RETURN make_interval(secs => estimated_ms / 1000.0);
END;
$$ LANGUAGE plpgsql;

-- Function to create a workflow job
CREATE OR REPLACE FUNCTION create_workflow_job(
    job_name_param VARCHAR(255),
    job_type_param VARCHAR(50),
    catalog_id_param UUID,
    product_ids_param UUID[],
    locale_ids_param UUID[],
    created_by_param VARCHAR(255),
    template_id_param UUID DEFAULT NULL,
    job_config_param JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    job_id UUID;
    locale_codes_array TEXT[];
    estimated_duration INTERVAL;
    total_items INTEGER;
BEGIN
    -- Generate job ID
    job_id := uuid_generate_v4();
    
    -- Get locale codes for quick reference
    SELECT array_agg(code) INTO locale_codes_array
    FROM averis_pricing.locales
    WHERE id = ANY(locale_ids_param);
    
    -- Calculate total items and estimated duration
    total_items := array_length(product_ids_param, 1) * array_length(locale_ids_param, 1);
    estimated_duration := estimate_workflow_duration(
        job_type_param, 
        array_length(product_ids_param, 1), 
        array_length(locale_ids_param, 1), 
        template_id_param
    );
    
    -- Insert job record
    INSERT INTO averis_pricing.catalog_workflow_jobs (
        id,
        job_name,
        job_type,
        catalog_id,
        product_ids,
        locale_ids,
        locale_codes,
        job_config,
        total_items,
        estimated_completion_at,
        created_by
    ) VALUES (
        job_id,
        job_name_param,
        job_type_param,
        catalog_id_param,
        product_ids_param,
        locale_ids_param,
        locale_codes_array,
        job_config_param,
        total_items,
        CURRENT_TIMESTAMP + estimated_duration,
        created_by_param
    );
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 6: CREATE WORKFLOW STATUS VIEWS
-- ========================================

-- View for catalog product workflow summary
CREATE OR REPLACE VIEW averis_pricing.catalog_product_workflow_summary AS
SELECT 
    cp.id as catalog_product_id,
    cp.catalog_id,
    cp.product_id,
    p.name as product_name,
    p.sku_code as product_sku,
    c.name as catalog_name,
    c.code as catalog_code,
    
    -- Workflow status
    cp.locale_workflow_status,
    cp.content_workflow_status,
    cp.selected_locales,
    cp.workflow_initiated_by,
    cp.workflow_initiated_at,
    cp.workflow_completed_at,
    
    -- Progress summary
    COUNT(CASE WHEN wf.workflow_type = 'locale_financials' THEN 1 END) as locale_workflows_total,
    COUNT(CASE WHEN wf.workflow_type = 'locale_financials' AND wf.status = 'completed' THEN 1 END) as locale_workflows_completed,
    COUNT(CASE WHEN wf.workflow_type = 'multi_language_content' THEN 1 END) as content_workflows_total,
    COUNT(CASE WHEN wf.workflow_type = 'multi_language_content' AND wf.status = 'completed' THEN 1 END) as content_workflows_completed,
    
    -- Quality metrics
    AVG(CASE WHEN wf.workflow_type = 'locale_financials' AND wf.status = 'completed' THEN wf.quality_score END) as avg_locale_quality,
    AVG(CASE WHEN wf.workflow_type = 'multi_language_content' AND wf.status = 'completed' THEN wf.quality_score END) as avg_content_quality,
    
    -- Timing
    cp.created_at,
    cp.updated_at
    
FROM averis_pricing.catalog_products cp
JOIN averis_pricing.products p ON p.id = cp.product_id
JOIN averis_pricing.catalogs c ON c.id = cp.catalog_id
LEFT JOIN averis_pricing.catalog_product_workflow_progress wf ON wf.catalog_product_id = cp.id
GROUP BY cp.id, cp.catalog_id, cp.product_id, p.name, p.sku_code, c.name, c.code,
         cp.locale_workflow_status, cp.content_workflow_status, cp.selected_locales,
         cp.workflow_initiated_by, cp.workflow_initiated_at, cp.workflow_completed_at,
         cp.created_at, cp.updated_at;

-- View for active workflow jobs dashboard
CREATE OR REPLACE VIEW averis_pricing.active_workflow_jobs AS
SELECT 
    j.id,
    j.job_name,
    j.job_type,
    j.status,
    j.progress_percentage,
    j.total_items,
    j.completed_items,
    j.failed_items,
    
    -- Catalog info
    c.name as catalog_name,
    c.code as catalog_code,
    r.name as region_name,
    
    -- Timing
    j.queued_at,
    j.started_at,
    j.estimated_completion_at,
    CASE 
        WHEN j.started_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - j.started_at)) * 1000
        ELSE NULL 
    END as runtime_ms,
    
    -- User info
    j.created_by,
    
    -- Locale info
    array_length(j.locale_codes, 1) as locale_count,
    j.locale_codes
    
FROM averis_pricing.catalog_workflow_jobs j
JOIN averis_pricing.catalogs c ON c.id = j.catalog_id
JOIN averis_pricing.regions r ON r.id = c.region_id
WHERE j.status IN ('queued', 'running')
ORDER BY j.priority, j.queued_at;

-- Create update triggers
CREATE TRIGGER update_catalog_products_updated_at 
    BEFORE UPDATE ON averis_pricing.catalog_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_progress_updated_at 
    BEFORE UPDATE ON averis_pricing.catalog_product_workflow_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_jobs_updated_at 
    BEFORE UPDATE ON averis_pricing.catalog_workflow_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at 
    BEFORE UPDATE ON averis_pricing.workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show workflow templates
SELECT 
    template_name,
    template_type,
    array_length(supported_locales, 1) as supported_locale_count,
    is_system_template,
    estimated_duration_per_item_ms / 1000.0 as estimated_seconds_per_item
FROM averis_pricing.workflow_templates
ORDER BY template_type, template_name;

-- Show available locales for a sample catalog
SELECT 
    'Available Locales for Catalogs' as info,
    COUNT(*) as total_locale_mappings
FROM averis_pricing.catalogs c
CROSS JOIN LATERAL get_available_locales_for_catalog(c.id) l
WHERE c.is_active = true;

-- Show enhanced catalog products structure
SELECT 
    'Enhanced Catalog Products' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN locale_workflow_status = 'pending' THEN 1 END) as pending_locale_workflows,
    COUNT(CASE WHEN content_workflow_status = 'pending' THEN 1 END) as pending_content_workflows
FROM averis_pricing.catalog_products;