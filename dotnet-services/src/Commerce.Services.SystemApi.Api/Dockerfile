# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj files and restore dependencies
COPY ["src/Commerce.Services.SystemApi.Api/Commerce.Services.SystemApi.Api.csproj", "src/Commerce.Services.SystemApi.Api/"]
COPY ["src/Commerce.Services.Shared.Data/Commerce.Services.Shared.Data.csproj", "src/Commerce.Services.Shared.Data/"]
COPY ["src/Commerce.Services.Shared.Models/Commerce.Services.Shared.Models.csproj", "src/Commerce.Services.Shared.Models/"]
COPY ["src/Commerce.Services.Shared.Infrastructure/Commerce.Services.Shared.Infrastructure.csproj", "src/Commerce.Services.Shared.Infrastructure/"]
RUN dotnet restore "src/Commerce.Services.SystemApi.Api/Commerce.Services.SystemApi.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/app/src/Commerce.Services.SystemApi.Api"
RUN dotnet build "Commerce.Services.SystemApi.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Commerce.Services.SystemApi.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published output
COPY --from=publish /app/publish .

# Health check disabled for initial setup
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD curl -f http://localhost:6012/health || exit 1

# Change ownership and switch to non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 6012

ENTRYPOINT ["dotnet", "Commerce.Services.SystemApi.Api.dll"]