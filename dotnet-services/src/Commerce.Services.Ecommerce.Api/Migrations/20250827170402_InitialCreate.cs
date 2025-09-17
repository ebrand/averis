using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.Ecommerce.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "averis_ecomm");

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "averis_ecomm",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    slug = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    meta_title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    meta_description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_categories_categories_parent_id",
                        column: x => x.parent_id,
                        principalSchema: "averis_ecomm",
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "products",
                schema: "averis_ecomm",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sku = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    display_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    short_description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    long_description = table.Column<string>(type: "text", nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    slug = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    brand = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    tags = table.Column<string[]>(type: "text[]", nullable: true),
                    specifications = table.Column<string>(type: "jsonb", nullable: true, defaultValue: "{}"),
                    features = table.Column<string[]>(type: "text[]", nullable: true),
                    primary_image_url = table.Column<string>(type: "text", nullable: true),
                    image_urls = table.Column<string[]>(type: "text[]", nullable: true),
                    video_url = table.Column<string>(type: "text", nullable: true),
                    document_urls = table.Column<string>(type: "jsonb", nullable: true, defaultValue: "{}"),
                    stock_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "in_stock"),
                    stock_quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    low_stock_threshold = table.Column<int>(type: "integer", nullable: false, defaultValue: 10),
                    backorder_allowed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    expected_restock_date = table.Column<DateOnly>(type: "date", nullable: true),
                    weight = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    length = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    width = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    height = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    dimension_unit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "cm"),
                    weight_unit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "kg"),
                    search_keywords = table.Column<string[]>(type: "text[]", nullable: true),
                    meta_title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    meta_description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "active"),
                    launch_date = table.Column<DateOnly>(type: "date", nullable: true),
                    end_of_life_date = table.Column<DateOnly>(type: "date", nullable: true),
                    rating_average = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0.00m),
                    rating_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    review_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    view_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    source_system = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "product-mdm"),
                    last_sync_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    sync_version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false, defaultValue: "system"),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false, defaultValue: "system")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                    table.ForeignKey(
                        name: "FK_products_categories_category_id",
                        column: x => x.category_id,
                        principalSchema: "averis_ecomm",
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_categories_parent",
                schema: "averis_ecomm",
                table: "categories",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_categories_slug",
                schema: "averis_ecomm",
                table: "categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_products_brand",
                schema: "averis_ecomm",
                table: "products",
                column: "brand");

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_products_category",
                schema: "averis_ecomm",
                table: "products",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_products_rating",
                schema: "averis_ecomm",
                table: "products",
                column: "rating_average");

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_products_status",
                schema: "averis_ecomm",
                table: "products",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "idx_ecommerce_products_stock_status",
                schema: "averis_ecomm",
                table: "products",
                column: "stock_status");

            migrationBuilder.CreateIndex(
                name: "products_sku_key",
                schema: "averis_ecomm",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "products_slug_key",
                schema: "averis_ecomm",
                table: "products",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "products",
                schema: "averis_ecomm");

            migrationBuilder.DropTable(
                name: "categories",
                schema: "averis_ecomm");
        }
    }
}
