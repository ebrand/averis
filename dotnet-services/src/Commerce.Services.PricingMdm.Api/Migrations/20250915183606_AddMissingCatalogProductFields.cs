using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.PricingMdm.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingCatalogProductFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "averis_product");

            migrationBuilder.AddColumn<decimal>(
                name: "base_price",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "content_workflow_status",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "locale_workflow_status",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string[]>(
                name: "selected_locales",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sku",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "workflow_completed_at",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "workflow_initiated_at",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "workflow_initiated_by",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "products",
                schema: "averis_product",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sku = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "countries",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    native_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    region_id = table.Column<Guid>(type: "uuid", nullable: false),
                    default_locale_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    continent = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    phone_prefix = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    supports_shipping = table.Column<bool>(type: "boolean", nullable: false),
                    supports_billing = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_countries", x => x.id);
                    table.UniqueConstraint("AK_countries_code", x => x.code);
                    table.ForeignKey(
                        name: "FK_countries_regions_region_id",
                        column: x => x.region_id,
                        principalSchema: "averis_pricing",
                        principalTable: "regions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "country_compliance",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    has_trade_sanctions = table.Column<bool>(type: "boolean", nullable: false),
                    has_export_restrictions = table.Column<bool>(type: "boolean", nullable: false),
                    requires_export_license = table.Column<bool>(type: "boolean", nullable: false),
                    requires_denied_party_screening = table.Column<bool>(type: "boolean", nullable: false),
                    screening_threshold_amount = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    restricted_categories = table.Column<List<string>>(type: "text[]", nullable: false),
                    compliance_risk_level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    last_risk_assessment = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    regulatory_notes = table.Column<string>(type: "text", nullable: true),
                    special_requirements = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_compliance", x => x.id);
                    table.ForeignKey(
                        name: "FK_country_compliance_countries_country_code",
                        column: x => x.country_code,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ip_country_ranges",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    ip_start = table.Column<string>(type: "text", nullable: false),
                    ip_end = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    last_updated = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ip_country_ranges", x => x.id);
                    table.ForeignKey(
                        name: "FK_ip_country_ranges_countries_country_code",
                        column: x => x.country_code,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "locales",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    language_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    country_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    region_id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    priority_in_country = table.Column<int>(type: "integer", nullable: false),
                    currency_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    native_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_rtl = table.Column<bool>(type: "boolean", nullable: false),
                    date_format = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    number_format = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_locales", x => x.id);
                    table.ForeignKey(
                        name: "FK_locales_countries_country_id",
                        column: x => x.country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_locales_currencies_currency_id",
                        column: x => x.currency_id,
                        principalSchema: "averis_pricing",
                        principalTable: "currencies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_locales_regions_region_id",
                        column: x => x.region_id,
                        principalSchema: "averis_pricing",
                        principalTable: "regions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_locale_content",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    locale_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    short_description = table.Column<string>(type: "text", nullable: true),
                    marketing_copy = table.Column<string>(type: "text", nullable: true),
                    technical_specs = table.Column<string>(type: "text", nullable: true),
                    features = table.Column<string[]>(type: "text[]", nullable: true),
                    benefits = table.Column<string[]>(type: "text[]", nullable: true),
                    meta_title = table.Column<string>(type: "text", nullable: true),
                    meta_description = table.Column<string>(type: "text", nullable: true),
                    keywords = table.Column<string[]>(type: "text[]", nullable: true),
                    content_version = table.Column<int>(type: "integer", nullable: false),
                    reviewed_by = table.Column<string>(type: "text", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    translation_status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_locale_content", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_locale_content_locales_locale_id",
                        column: x => x.locale_id,
                        principalSchema: "averis_pricing",
                        principalTable: "locales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_locale_content_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "averis_product",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductLocaleFinancials",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    locale_id = table.Column<Guid>(type: "uuid", nullable: false),
                    catalog_id = table.Column<Guid>(type: "uuid", nullable: false),
                    base_price = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: false),
                    base_cost = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    currency_conversion_rate = table.Column<decimal>(type: "numeric(15,6)", precision: 15, scale: 6, nullable: true),
                    conversion_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    local_price = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    local_cost = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    tax_rate = table.Column<decimal>(type: "numeric(8,4)", precision: 8, scale: 4, nullable: true),
                    tax_amount = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    tax_included_price = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    regulatory_fees = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    environmental_fees = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    price_rounding_rules = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    display_format = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    promotional_price = table.Column<decimal>(type: "numeric(15,4)", precision: 15, scale: 4, nullable: true),
                    promotion_start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    promotion_end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    effective_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    effective_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductLocaleFinancials", x => x.id);
                    table.ForeignKey(
                        name: "FK_ProductLocaleFinancials_catalogs_catalog_id",
                        column: x => x.catalog_id,
                        principalSchema: "averis_pricing",
                        principalTable: "catalogs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductLocaleFinancials_locales_locale_id",
                        column: x => x.locale_id,
                        principalSchema: "averis_pricing",
                        principalTable: "locales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductLocaleFinancials_products_product_id",
                        column: x => x.product_id,
                        principalSchema: "averis_product",
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_locale_preferences",
                schema: "averis_pricing",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    session_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    detected_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    detected_ip_address = table.Column<string>(type: "text", nullable: true),
                    chosen_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    chosen_locale_id = table.Column<Guid>(type: "uuid", nullable: true),
                    country_overridden = table.Column<bool>(type: "boolean", nullable: false),
                    locale_overridden = table.Column<bool>(type: "boolean", nullable: false),
                    shopping_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    shipping_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    billing_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    compliance_screening_required = table.Column<bool>(type: "boolean", nullable: false),
                    last_screening_id = table.Column<Guid>(type: "uuid", nullable: true),
                    compliance_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    referrer = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_locale_preferences", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_countries_billing_country_id",
                        column: x => x.billing_country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_countries_chosen_country_id",
                        column: x => x.chosen_country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_countries_detected_country_id",
                        column: x => x.detected_country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_countries_shipping_country_id",
                        column: x => x.shipping_country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_countries_shopping_country_id",
                        column: x => x.shopping_country_id,
                        principalSchema: "averis_pricing",
                        principalTable: "countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_locale_preferences_locales_chosen_locale_id",
                        column: x => x.chosen_locale_id,
                        principalSchema: "averis_pricing",
                        principalTable: "locales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_regions_default_currency_id",
                schema: "averis_pricing",
                table: "regions",
                column: "default_currency_id");

            migrationBuilder.CreateIndex(
                name: "IX_base_prices_product_id",
                schema: "averis_pricing",
                table: "base_prices",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_countries_code",
                schema: "averis_pricing",
                table: "countries",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_countries_default_locale_id",
                schema: "averis_pricing",
                table: "countries",
                column: "default_locale_id");

            migrationBuilder.CreateIndex(
                name: "IX_countries_region_id",
                schema: "averis_pricing",
                table: "countries",
                column: "region_id");

            migrationBuilder.CreateIndex(
                name: "IX_country_compliance_country_code",
                schema: "averis_pricing",
                table: "country_compliance",
                column: "country_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ip_country_ranges_country_code_ip_start_ip_end",
                schema: "averis_pricing",
                table: "ip_country_ranges",
                columns: new[] { "country_code", "ip_start", "ip_end" });

            migrationBuilder.CreateIndex(
                name: "IX_locales_code",
                schema: "averis_pricing",
                table: "locales",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_locales_country_id",
                schema: "averis_pricing",
                table: "locales",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_locales_currency_id",
                schema: "averis_pricing",
                table: "locales",
                column: "currency_id");

            migrationBuilder.CreateIndex(
                name: "IX_locales_region_id_code",
                schema: "averis_pricing",
                table: "locales",
                columns: new[] { "region_id", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_locale_content_locale_id",
                schema: "averis_pricing",
                table: "product_locale_content",
                column: "locale_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_locale_content_product_id",
                schema: "averis_pricing",
                table: "product_locale_content",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_locale_content_product_id_locale_id",
                schema: "averis_pricing",
                table: "product_locale_content",
                columns: new[] { "product_id", "locale_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocaleFinancials_catalog_id",
                table: "ProductLocaleFinancials",
                column: "catalog_id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocaleFinancials_effective_from_effective_to",
                table: "ProductLocaleFinancials",
                columns: new[] { "effective_from", "effective_to" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocaleFinancials_locale_id",
                table: "ProductLocaleFinancials",
                column: "locale_id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocaleFinancials_product_id",
                table: "ProductLocaleFinancials",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLocaleFinancials_product_id_locale_id_catalog_id",
                table: "ProductLocaleFinancials",
                columns: new[] { "product_id", "locale_id", "catalog_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_sku",
                schema: "averis_product",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_status",
                schema: "averis_product",
                table: "products",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_billing_country_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "billing_country_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_chosen_country_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "chosen_country_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_chosen_locale_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "chosen_locale_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_detected_country_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "detected_country_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_session_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_shipping_country_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "shipping_country_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_shopping_country_id",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                column: "shopping_country_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_locale_preferences_user_id_is_active",
                schema: "averis_pricing",
                table: "user_locale_preferences",
                columns: new[] { "user_id", "is_active" });

            migrationBuilder.AddForeignKey(
                name: "FK_base_prices_products_product_id",
                schema: "averis_pricing",
                table: "base_prices",
                column: "product_id",
                principalSchema: "averis_product",
                principalTable: "products",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_catalog_products_products_product_id",
                schema: "averis_pricing",
                table: "catalog_products",
                column: "product_id",
                principalSchema: "averis_product",
                principalTable: "products",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_regions_currencies_default_currency_id",
                schema: "averis_pricing",
                table: "regions",
                column: "default_currency_id",
                principalSchema: "averis_pricing",
                principalTable: "currencies",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_countries_locales_default_locale_id",
                schema: "averis_pricing",
                table: "countries",
                column: "default_locale_id",
                principalSchema: "averis_pricing",
                principalTable: "locales",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_base_prices_products_product_id",
                schema: "averis_pricing",
                table: "base_prices");

            migrationBuilder.DropForeignKey(
                name: "FK_catalog_products_products_product_id",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropForeignKey(
                name: "FK_regions_currencies_default_currency_id",
                schema: "averis_pricing",
                table: "regions");

            migrationBuilder.DropForeignKey(
                name: "FK_countries_locales_default_locale_id",
                schema: "averis_pricing",
                table: "countries");

            migrationBuilder.DropTable(
                name: "country_compliance",
                schema: "averis_pricing");

            migrationBuilder.DropTable(
                name: "ip_country_ranges",
                schema: "averis_pricing");

            migrationBuilder.DropTable(
                name: "product_locale_content",
                schema: "averis_pricing");

            migrationBuilder.DropTable(
                name: "ProductLocaleFinancials");

            migrationBuilder.DropTable(
                name: "user_locale_preferences",
                schema: "averis_pricing");

            migrationBuilder.DropTable(
                name: "products",
                schema: "averis_product");

            migrationBuilder.DropTable(
                name: "locales",
                schema: "averis_pricing");

            migrationBuilder.DropTable(
                name: "countries",
                schema: "averis_pricing");

            migrationBuilder.DropIndex(
                name: "IX_regions_default_currency_id",
                schema: "averis_pricing",
                table: "regions");

            migrationBuilder.DropIndex(
                name: "IX_base_prices_product_id",
                schema: "averis_pricing",
                table: "base_prices");

            migrationBuilder.DropColumn(
                name: "base_price",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "content_workflow_status",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "locale_workflow_status",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "selected_locales",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "sku",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "workflow_completed_at",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "workflow_initiated_at",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "workflow_initiated_by",
                schema: "averis_pricing",
                table: "catalog_products");
        }
    }
}
