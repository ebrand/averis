# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution file and project files for better layer caching
COPY ["src/Commerce.Services.Localization.Api/Commerce.Services.Localization.Api.csproj", "src/Commerce.Services.Localization.Api/"]

# Restore dependencies
RUN dotnet restore "src/Commerce.Services.Localization.Api/Commerce.Services.Localization.Api.csproj"

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/src/Commerce.Services.Localization.Api"
RUN dotnet build "Commerce.Services.Localization.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "Commerce.Services.Localization.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install curl for health checks (optional)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=publish /app/publish .

# Create non-root user for security
RUN groupadd -g 1001 appuser && useradd -r -u 1001 -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 6010

# Configure ASP.NET Core
ENV ASPNETCORE_URLS=http://+:6010
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6010/api/localization/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "Commerce.Services.Localization.Api.dll"]