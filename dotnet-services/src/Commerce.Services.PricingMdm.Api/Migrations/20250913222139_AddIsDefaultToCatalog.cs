using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.PricingMdm.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDefaultToCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_default",
                schema: "averis_pricing",
                table: "catalogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_default",
                schema: "averis_pricing",
                table: "catalogs");
        }
    }
}
