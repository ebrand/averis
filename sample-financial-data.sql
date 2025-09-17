-- Insert sample locale-specific financial data to demonstrate localization
-- Product: 2cd4e3f8-2ea5-427e-841f-7b395b0de590 in Catalog: dd0e8400-e29b-41d4-a716-446655440001

-- Spanish (Spain) financial data
INSERT INTO averis_pricing.product_locale_financials 
(id, product_id, catalog_id, locale_id, base_price, local_price, currency_conversion_rate, 
 tax_rate, tax_amount, tax_included_price, regulatory_fees, environmental_fees, 
 conversion_date, effective_from, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'dd0e8400-e29b-41d4-a716-446655440001',
  'b94594ce-df3b-42a9-9f01-5af977217422',
  999.99,
  849.99,
  0.85,
  0.21,
  178.50,
  1028.49,
  15.00,
  8.50,
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
);

-- French (France) financial data
INSERT INTO averis_pricing.product_locale_financials 
(id, product_id, catalog_id, locale_id, base_price, local_price, currency_conversion_rate, 
 tax_rate, tax_amount, tax_included_price, regulatory_fees, environmental_fees, 
 conversion_date, effective_from, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'dd0e8400-e29b-41d4-a716-446655440001',
  'd1f55d51-fe45-4ada-9a89-97b3337efd42',
  999.99,
  849.99,
  0.85,
  0.20,
  170.00,
  1019.99,
  12.00,
  9.00,
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
);

-- German (Germany) financial data
INSERT INTO averis_pricing.product_locale_financials 
(id, product_id, catalog_id, locale_id, base_price, local_price, currency_conversion_rate, 
 tax_rate, tax_amount, tax_included_price, regulatory_fees, environmental_fees, 
 conversion_date, effective_from, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'dd0e8400-e29b-41d4-a716-446655440001',
  '250b882f-32a0-4c92-98d8-bd0ad40a9a5e',
  999.99,
  849.99,
  0.85,
  0.19,
  161.50,
  1011.49,
  18.00,
  12.50,
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
);

-- English (US) financial data
INSERT INTO averis_pricing.product_locale_financials 
(id, product_id, catalog_id, locale_id, base_price, local_price, currency_conversion_rate, 
 tax_rate, tax_amount, tax_included_price, regulatory_fees, environmental_fees, 
 conversion_date, effective_from, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'dd0e8400-e29b-41d4-a716-446655440001',
  '433cba86-e2c3-4b54-89d6-04118f4a9073',
  999.99,
  999.99,
  1.0,
  0.0875,
  87.50,
  1087.49,
  10.00,
  5.00,
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
);