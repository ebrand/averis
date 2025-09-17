# Commerce Services - .NET Migration

This directory contains the C# .NET implementation of all Commerce Context APIs and Ingest Services, migrated from the original Node.js/Express implementation.

## Solution Structure

```
dotnet-services/
├── Commerce.Services.sln               # Main solution file
├── src/                               # Source code
│   ├── Commerce.Services.ProductMdm.Api/      # Product MDM API (port 6001)
│   ├── Commerce.Services.PricingMdm.Api/      # Pricing MDM API (port 6002)
│   ├── Commerce.Services.Ecommerce.Api/       # E-commerce API (port 6003)
│   ├── Commerce.Services.InventoryMdm.Api/    # Inventory MDM API (port 6004)
│   ├── Commerce.Services.Erp.Api/             # ERP API (port 6005)
│   ├── Commerce.Services.PricingMdm.Ingest/   # Pricing MDM Ingest (port 9002)
│   ├── Commerce.Services.Ecommerce.Ingest/    # E-commerce Ingest (port 9003)
│   ├── Commerce.Services.InventoryMdm.Ingest/ # Inventory MDM Ingest (port 9004)
│   ├── Commerce.Services.Erp.Ingest/          # ERP Ingest (port 9005)
│   └── Commerce.Services.Shared/              # Shared libraries
│       ├── Commerce.Services.Shared.Models/        # DTOs and models
│       ├── Commerce.Services.Shared.Data/          # Entity Framework contexts
│       ├── Commerce.Services.Shared.Messaging/     # RabbitMQ abstractions
│       └── Commerce.Services.Shared.Infrastructure/ # Common services
└── tests/                             # Test projects
    ├── Commerce.Services.ProductMdm.Api.Tests/
    └── Commerce.Services.Integration.Tests/
```

## Technology Stack

- **Framework**: .NET 8.0 LTS
- **API**: ASP.NET Core Web API
- **Background Services**: .NET Worker Services
- **Database**: PostgreSQL with Entity Framework Core
- **Messaging**: RabbitMQ with MassTransit
- **Logging**: Serilog
- **Testing**: xUnit

## Key Dependencies

### Shared Libraries
- **Models**: System.ComponentModel.Annotations for validation
- **Data**: Entity Framework Core 8.0.11, Npgsql.EntityFrameworkCore.PostgreSQL 8.0.10
- **Messaging**: MassTransit 8.5.2, MassTransit.RabbitMQ 8.5.2
- **Infrastructure**: Serilog 8.0.0, Microsoft.Extensions.Hosting 8.0.11

## Architecture Principles

### 1. Domain-Driven Design
Each service follows domain-specific patterns optimized for their requirements:
- **Product MDM**: Flexible content management with JSONB support
- **Pricing MDM**: Financial precision with temporal pricing
- **E-commerce**: Optimized for display and shopping cart operations

### 2. Dependency Injection
All services use ASP.NET Core's built-in DI container with proper service lifetimes.

### 3. Event-Driven Architecture
Services communicate via RabbitMQ using MassTransit's publish/subscribe patterns.

### 4. Health Monitoring
Built-in health checks for database connections, message queues, and system status.

## Port Mapping (Maintains Original Architecture)

| Service | Type | Port | Framework |
|---------|------|------|-----------|
| Product MDM | API | 6001 | ASP.NET Core |
| Pricing MDM | API | 6002 | ASP.NET Core |
| E-commerce | API | 6003 | ASP.NET Core |
| Inventory MDM | API | 6004 | ASP.NET Core |
| ERP | API | 6005 | ASP.NET Core |
| Pricing MDM | Ingest | 9002 | Worker Service |
| E-commerce | Ingest | 9003 | Worker Service |
| Inventory MDM | Ingest | 9004 | Worker Service |
| ERP | Ingest | 9005 | Worker Service |

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- PostgreSQL 13+
- RabbitMQ 3.8+

### Build and Run
```bash
# Build entire solution
dotnet build

# Run specific API (example: Product MDM)
cd src/Commerce.Services.ProductMdm.Api
dotnet run

# Run specific Ingest Service (example: Pricing MDM)
cd src/Commerce.Services.PricingMdm.Ingest
dotnet run

# Run tests
dotnet test
```

## Migration Benefits

### Performance Improvements
- **Faster startup times**: Compiled C# vs interpreted JavaScript
- **Lower memory usage**: More efficient memory management
- **Better throughput**: Optimized for high-concurrency scenarios

### Developer Experience
- **Strong typing**: Compile-time error detection
- **Rich tooling**: IntelliSense, debugging, profiling
- **Mature ecosystem**: Enterprise-grade libraries and patterns

### Enterprise Readiness
- **Built-in health checks**: ASP.NET Core health monitoring
- **Structured logging**: Serilog with multiple sinks
- **Configuration management**: Strongly-typed configuration
- **Dependency injection**: Built-in IoC container

## Implementation Status

✅ **Completed:**
- Solution structure setup
- Shared library foundation
- NuGet package configuration
- Build system verification

🔄 **In Progress:**
- Product MDM API implementation
- Shared model definitions
- Database context setup

📋 **Planned:**
- All API implementations
- Ingest service implementations
- Integration testing
- Performance benchmarking