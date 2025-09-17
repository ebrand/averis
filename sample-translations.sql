-- Insert sample translated content to demonstrate Google Translate API integration
-- These translations were generated using the Google Translate API with key from Claude.md

-- Spanish (Spain) translation
INSERT INTO averis_pricing.product_locale_content 
(id, product_id, locale_id, name, description, short_description, marketing_copy, features, benefits, 
 meta_title, meta_description, keywords, translation_status, created_at, updated_at, created_by)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'b94594ce-df3b-42a9-9f01-5af977217422',
  'Plataforma de Análisis Empresarial',
  'Una plataforma de análisis integral diseñada para el procesamiento de datos a nivel empresarial, información en tiempo real y soluciones de inteligencia empresarial escalables',
  'Plataforma de análisis de nivel empresarial con información en tiempo real',
  'Transforme los datos de su negocio en información práctica con nuestra plataforma de análisis de vanguardia',
  ARRAY['Procesamiento de datos en tiempo real','Visualización avanzada','Paneles de control personalizados','Integración de API'],
  ARRAY['Mejora de la toma de decisiones','Tiempo más rápido para obtener información','Arquitectura escalable','Solución rentable'],
  'Plataforma de Análisis Empresarial',
  'Plataforma de análisis de nivel empresarial con información en tiempo real',
  ARRAY['análisis', 'empresarial', 'plataforma'],
  'completed',
  NOW(),
  NOW(),
  'google-translate-api'
);

-- French (France) translation  
INSERT INTO averis_pricing.product_locale_content 
(id, product_id, locale_id, name, description, short_description, marketing_copy, features, benefits, 
 meta_title, meta_description, keywords, translation_status, created_at, updated_at, created_by)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  'd1f55d51-fe45-4ada-9a89-97b3337efd42',
  'Plateforme d''Analyse d''Entreprise',
  'Une plateforme d''analyse complète conçue pour le traitement des données au niveau de l''entreprise, des informations en temps réel et des solutions de veille économique évolutives',
  'Plateforme d''analyse de niveau entreprise avec des informations en temps réel',
  'Transformez vos données commerciales en informations exploitables grâce à notre plateforme d''analyse de pointe',
  ARRAY['Traitement des données en temps réel','Visualisation avancée','Tableaux de bord personnalisés','Intégration d''API'],
  ARRAY['Amélioration de la prise de décision','Des informations plus rapides','Architecture évolutive','Solution rentable'],
  'Plateforme d''Analyse d''Entreprise',
  'Plateforme d''analyse de niveau entreprise avec des informations en temps réel',
  ARRAY['analyse', 'entreprise', 'plateforme'],
  'completed',
  NOW(),
  NOW(),
  'google-translate-api'
);

-- German (Germany) translation
INSERT INTO averis_pricing.product_locale_content 
(id, product_id, locale_id, name, description, short_description, marketing_copy, features, benefits, 
 meta_title, meta_description, keywords, translation_status, created_at, updated_at, created_by)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  '250b882f-32a0-4c92-98d8-bd0ad40a9a5e',
  'Enterprise Analytics-Plattform',
  'Eine umfassende Analyseplattform für die Datenverarbeitung auf Unternehmensebene, Echtzeit-Einblicke und skalierbare Business-Intelligence-Lösungen',
  'Analyseplattform der Enterprise-Klasse mit Echtzeit-Einblicken',
  'Verwandeln Sie Ihre Geschäftsdaten mit unserer hochmodernen Analyseplattform in umsetzbare Erkenntnisse',
  ARRAY['Echtzeit-Datenverarbeitung','Erweiterte Visualisierung','Benutzerdefinierte Dashboards','API-Integration'],
  ARRAY['Verbesserte Entscheidungsfindung','Schnellere Erkenntnisse','Skalierbare Architektur','Kostengünstige Lösung'],
  'Enterprise Analytics-Plattform',
  'Analyseplattform der Enterprise-Klasse mit Echtzeit-Einblicken',
  ARRAY['Analytik', 'Unternehmen', 'Plattform'],
  'completed',
  NOW(),
  NOW(),
  'google-translate-api'
);

-- English source content for reference
INSERT INTO averis_pricing.product_locale_content 
(id, product_id, locale_id, name, description, short_description, marketing_copy, features, benefits, 
 meta_title, meta_description, keywords, translation_status, created_at, updated_at, created_by)
VALUES (
  gen_random_uuid(),
  '2cd4e3f8-2ea5-427e-841f-7b395b0de590',
  '433cba86-e2c3-4b54-89d6-04118f4a9073',
  'Enterprise Analytics Platform',
  'A comprehensive analytics platform designed for enterprise-level data processing, real-time insights, and scalable business intelligence solutions',
  'Enterprise-grade analytics platform with real-time insights',
  'Transform your business data into actionable insights with our cutting-edge analytics platform',
  ARRAY['Real-time data processing','Advanced visualization','Custom dashboards','API integration'],
  ARRAY['Improved decision making','Faster time to insights','Scalable architecture','Cost-effective solution'],
  'Enterprise Analytics Platform',
  'Enterprise-grade analytics platform with real-time insights',
  ARRAY['analytics', 'enterprise', 'platform'],
  'completed',
  NOW(),
  NOW(),
  'source-content'
);