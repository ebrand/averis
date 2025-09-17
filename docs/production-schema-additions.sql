-- Additional tables needed for production locale operations

-- Translation service providers and configurations
CREATE TABLE IF NOT EXISTS averis_pricing.translation_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_reference VARCHAR(200), -- Reference to secure key store
    supported_languages TEXT[],
    quality_score DECIMAL(3,2), -- 0.00 to 5.00 rating
    cost_per_character DECIMAL(8,6),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Translation jobs queue and status tracking
CREATE TABLE IF NOT EXISTS averis_pricing.translation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES averis_pricing.products(id),
    source_locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    target_locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    provider_id UUID REFERENCES averis_pricing.translation_providers(id),
    
    -- Content to translate
    source_content JSONB NOT NULL, -- {"name": "...", "description": "...", etc.}
    translated_content JSONB, -- Same structure with translated values
    
    -- Job management
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed, reviewing
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    assigned_to VARCHAR(200), -- Human reviewer if needed
    
    -- Quality and cost tracking
    translation_confidence DECIMAL(5,4), -- Provider confidence score
    human_review_required BOOLEAN DEFAULT false,
    estimated_cost DECIMAL(10,4),
    actual_cost DECIMAL(10,4),
    
    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- Currency exchange rate providers and historical rates
CREATE TABLE IF NOT EXISTS averis_pricing.currency_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_reference VARCHAR(200),
    supported_currencies TEXT[],
    update_frequency_minutes INTEGER DEFAULT 60,
    reliability_score DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS averis_pricing.exchange_rates_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES averis_pricing.currency_providers(id),
    from_currency_id UUID NOT NULL REFERENCES averis_pricing.currencies(id),
    to_currency_id UUID NOT NULL REFERENCES averis_pricing.currencies(id),
    
    exchange_rate DECIMAL(12,6) NOT NULL,
    rate_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    bid_rate DECIMAL(12,6), -- Buy rate
    ask_rate DECIMAL(12,6), -- Sell rate
    
    -- Rate metadata
    is_current BOOLEAN DEFAULT false,
    confidence_level VARCHAR(20), -- high, medium, low
    rate_source VARCHAR(100), -- official, market, estimated
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique current rates per currency pair per provider
    UNIQUE(provider_id, from_currency_id, to_currency_id, rate_timestamp)
);

-- Catalog-locale associations with automation settings
CREATE TABLE IF NOT EXISTS averis_pricing.catalog_locales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_id UUID NOT NULL REFERENCES averis_pricing.catalogs(id),
    locale_id UUID NOT NULL REFERENCES averis_pricing.locales(id),
    
    -- Automation settings
    auto_translate BOOLEAN DEFAULT true,
    auto_currency_convert BOOLEAN DEFAULT true,
    require_human_review BOOLEAN DEFAULT false,
    preferred_translation_provider_id UUID REFERENCES averis_pricing.translation_providers(id),
    
    -- Quality settings
    translation_quality_threshold DECIMAL(3,2) DEFAULT 0.80, -- Minimum acceptable quality
    content_approval_required BOOLEAN DEFAULT false,
    financial_approval_required BOOLEAN DEFAULT true,
    
    -- Status tracking
    localization_status VARCHAR(50) DEFAULT 'active', -- active, paused, disabled
    last_bulk_update TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(catalog_id, locale_id)
);

-- Localization workflow templates
CREATE TABLE IF NOT EXISTS averis_pricing.localization_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name VARCHAR(200) NOT NULL,
    region_id UUID REFERENCES averis_pricing.regions(id),
    
    -- Workflow steps configuration
    steps_config JSONB NOT NULL, -- Define the approval/review process
    
    -- Default settings for new products
    default_translation_provider_id UUID REFERENCES averis_pricing.translation_providers(id),
    default_currency_provider_id UUID REFERENCES averis_pricing.currency_providers(id),
    auto_activate BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON averis_pricing.translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_priority ON averis_pricing.translation_jobs(priority, requested_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_current ON averis_pricing.exchange_rates_history(from_currency_id, to_currency_id, is_current);
CREATE INDEX IF NOT EXISTS idx_catalog_locales_catalog ON averis_pricing.catalog_locales(catalog_id);
CREATE INDEX IF NOT EXISTS idx_catalog_locales_auto ON averis_pricing.catalog_locales(auto_translate, auto_currency_convert);