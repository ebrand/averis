using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.PricingMdm.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogProductPricingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "custom_name",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "discount_percentage",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "local_sku_code",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "override_price",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "custom_name",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "discount_percentage",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "local_sku_code",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "override_price",
                schema: "averis_pricing",
                table: "catalog_products");
        }
    }
}
