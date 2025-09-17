# Product Master Data Management (MDM) System

A comprehensive product data management system built with React 19, Node.js, and PostgreSQL.

## Architecture

- **UI**: React 19 with Tailwind CSS for the user interface
- **API**: Node.js with Express for the backend services
- **Database**: PostgreSQL with Docker for data persistence

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the database:**
   ```bash
   npm run start:db
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start:
- UI development server on http://localhost:5000
- API server on http://localhost:6000
- PostgreSQL database on localhost:7000
- PgAdmin on http://localhost:8080

## Project Structure

```
product-mdm/
├── ui/                 # React 19 frontend
├── api/                # Node.js API server
├── database/           # PostgreSQL database
├── package.json        # Root package.json with scripts
└── README.md          # This file
```

## Database Access

- **PostgreSQL**: `localhost:7000`
  - Database: `averis_product`
  - User: `postgres`
  - Password: `postgres`

- **PgAdmin**: http://localhost:8080
  - Email: `admin@productmdm.local`
  - Password: `admin`

## Available Scripts

- `npm run dev` - Start both UI and API in development mode
- `npm run dev:ui` - Start only the UI development server
- `npm run dev:api` - Start only the API development server
- `npm run start:db` - Start the PostgreSQL database
- `npm run stop:db` - Stop the PostgreSQL database
- `npm run build:ui` - Build the UI for production

## Features (Planned)

- ✅ Product catalog management
- ✅ Category hierarchies
- ✅ Product variants and attributes
- ✅ Audit logging
- 🔄 User authentication
- 🔄 Real-time notifications (Socket.IO)
- 🔄 Message queuing (RabbitMQ)
- 🔄 Pricing management
- 🔄 E-commerce integration
- 🔄 Consumer applications

## Getting Started

1. Clone the repository
2. Follow the Quick Start guide above
3. Access the UI at http://localhost:5000
4. Check the API health at http://localhost:6000/health

## Development

Each component (ui, api, database) has its own README with specific development instructions.