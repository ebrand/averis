using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.PricingMdm.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCustomNameAndLocalSkuFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "custom_name",
                schema: "averis_pricing",
                table: "catalog_products");

            migrationBuilder.DropColumn(
                name: "local_sku_code",
                schema: "averis_pricing",
                table: "catalog_products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "custom_name",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "local_sku_code",
                schema: "averis_pricing",
                table: "catalog_products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
