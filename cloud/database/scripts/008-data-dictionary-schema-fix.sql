-- ========================================
-- DATA DICTIONARY SCHEMA ALIGNMENT FIX
-- ========================================
-- Adds missing columns to match Entity Framework model

-- Add missing columns to averis_system.data_dictionary
ALTER TABLE averis_system.data_dictionary 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS required_for_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_length INTEGER,
ADD COLUMN IF NOT EXISTS min_length INTEGER,
ADD COLUMN IF NOT EXISTS validation_pattern VARCHAR(500),
ADD COLUMN IF NOT EXISTS allowed_values JSONB,
ADD COLUMN IF NOT EXISTS in_product_mdm BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS in_pricing_mdm BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS in_ecommerce BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_system_field BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT 'system';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_dictionary_category ON averis_system.data_dictionary(category);
CREATE INDEX IF NOT EXISTS idx_data_dictionary_maintenance_role ON averis_system.data_dictionary(maintenance_role);
CREATE INDEX IF NOT EXISTS idx_data_dictionary_sort_order ON averis_system.data_dictionary(sort_order);

-- Drop the old unique constraint if it exists and recreate with proper name
ALTER TABLE averis_system.data_dictionary DROP CONSTRAINT IF EXISTS data_dictionary_table_schema_table_name_column_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS ix_data_dictionary_column_name_unique ON averis_system.data_dictionary(column_name);

COMMENT ON TABLE averis_system.data_dictionary IS 'Data dictionary for system-wide metadata definitions and form field control';