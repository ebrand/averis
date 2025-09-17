using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Commerce.Services.Localization.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTypeColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "averis_pricing");

            migrationBuilder.CreateTable(
                name: "localization_workflows",
                schema: "averis_pricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    JobName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    JobType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    WorkerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CatalogId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromLocale = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ToLocale = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProgressPercentage = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CurrentStep = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    JobData = table.Column<string>(type: "jsonb", nullable: true),
                    Results = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_localization_workflows", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_localization_workflows_CreatedAt",
                schema: "averis_pricing",
                table: "localization_workflows",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_localization_workflows_Status",
                schema: "averis_pricing",
                table: "localization_workflows",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_localization_workflows_Status_CreatedAt",
                schema: "averis_pricing",
                table: "localization_workflows",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_localization_workflows_WorkerId",
                schema: "averis_pricing",
                table: "localization_workflows",
                column: "WorkerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "localization_workflows",
                schema: "averis_pricing");
        }
    }
}
