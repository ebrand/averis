# Commerce MDM System

A comprehensive Master Data Management system for e-commerce product and pricing data.

## Quick Start

### Prerequisites

- **Docker & Docker Compose**: For databases and RabbitMQ
- **Node.js 18+**: For running the APIs and UIs
- **npm**: For package management

### Configuration Management

🎯 **NEW**: This project now uses centralized configuration management to prevent integration issues.

**View the complete system configuration:**
```bash
cat config/environments/development.yml
```

**Validate your development environment:**
```bash
cd config/scripts
npm install js-yaml  # Required for validation script
node validate-dev-config.js
```

The configuration system documents:
- All service ports and dependencies
- Database schema constraints (including missing columns)
- API endpoint mappings
- Common integration issues and their prevention

See [`config/README.md`](./config/README.md) for complete documentation.

### Starting All Services

To start the entire Commerce MDM system:

```bash
./start.sh
```

This will:
1. Start RabbitMQ (port 5672, management UI on 15672)
2. Start Product MDM Database (PostgreSQL on port 5433)
3. Start Pricing MDM Database (PostgreSQL on port 5434)
4. Start Product MDM API (port 6000)
5. Start Pricing MDM API (port 8003)
6. Start Product MDM UI (port 3000)
7. Start Pricing MDM UI (port 3001)

### Stopping All Services

To stop all services:

```bash
./stop.sh
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Product MDM UI | http://localhost:3000 | Product management interface |
| Pricing MDM UI | http://localhost:3001 | Pricing management interface |
| Product MDM API | http://localhost:6000 | Product data API |
| Pricing MDM API | http://localhost:8003 | Pricing data API |
| RabbitMQ Management | http://localhost:15672 | Message queue management (guest/guest) |
| Product DB Admin | http://localhost:8080 | Product database admin (admin@productmdm.com/admin) |
| Pricing DB Admin | http://localhost:8081 | Pricing database admin (admin@pricingmdm.com/admin) |

## Database Connections

| Database | Host | Port | Username | Password | Database |
|----------|------|------|----------|----------|----------|
| Product MDM | localhost | 5433 | postgres | postgres | averis_product |
| Pricing MDM | localhost | 5434 | postgres | postgres | averis_pricing |

## Architecture

### Product MDM
- **UI**: React application for product catalog management
- **API**: Node.js/Express API for product data operations
- **Database**: PostgreSQL with product master data

### Pricing MDM
- **UI**: React application for pricing management and analysis
- **API**: Node.js/Express API for pricing operations
- **Database**: PostgreSQL with pricing and user data

### Infrastructure
- **RabbitMQ**: Message queue for inter-service communication
- **Docker**: Containerized databases and message queue

## Development

### Individual Service Management

If you need to start services individually:

#### Databases
```bash
# Start Product MDM Database
cd product-mdm/database && docker-compose up -d

# Start Pricing MDM Database  
cd pricing-mdm/database && docker-compose up -d

# Start RabbitMQ
cd cloud && docker-compose up -d
```

#### APIs
```bash
# Start Product MDM API
cd product-mdm/api && npm run dev

# Start Pricing MDM API
cd pricing-mdm/api && npm run dev
```

#### UIs
```bash
# Start Product MDM UI
cd product-mdm/ui && npm run dev

# Start Pricing MDM UI
cd pricing-mdm/ui && npm run dev
```

### Log Files

When using `./start.sh`, logs are written to:
- Product API: `/tmp/product-api.log`
- Pricing API: `/tmp/pricing-api.log`
- Product UI: `/tmp/product-ui.log`
- Pricing UI: `/tmp/pricing-ui.log`

### Environment Configuration

Each service has its own `.env` file:
- `product-mdm/api/.env`
- `pricing-mdm/api/.env`
- `pricing-mdm/ui/.env`

## Troubleshooting

### Port Conflicts
If you get port conflicts, check what's running:
```bash
lsof -i :3000  # Product UI
lsof -i :3001  # Pricing UI
lsof -i :6000  # Product API
lsof -i :8003  # Pricing API
lsof -i :5433  # Product DB
lsof -i :5434  # Pricing DB
lsof -i :5672  # RabbitMQ
```

### Service Not Starting
1. Check the log files in `/tmp/`
2. Ensure all dependencies are installed: `npm install` in each service directory
3. Verify Docker is running: `docker ps`
4. Check database connectivity

### Reset Everything
To completely reset the system:
```bash
./stop.sh
docker system prune -f
docker volume prune -f
./start.sh
```

## Project Structure

```
commerce-ctx/
├── start.sh              # Start all services
├── stop.sh               # Stop all services
├── cloud/                 # Infrastructure services
│   └── docker-compose.yml # RabbitMQ configuration
├── product-mdm/          # Product Master Data Management
│   ├── api/              # Product MDM API
│   ├── ui/               # Product MDM UI
│   └── database/         # Product database
└── pricing-mdm/          # Pricing Master Data Management
    ├── api/              # Pricing MDM API
    ├── ui/               # Pricing MDM UI
    └── database/         # Pricing database
```