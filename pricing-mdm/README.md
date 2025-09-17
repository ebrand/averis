# Pricing MDM (Master Data Management)

A comprehensive pricing management system built with React, Node.js, and PostgreSQL.

## Features

- **Pricing Management**: Create, update, and manage pricing strategies
- **Price Lists**: Organize prices by customer segments, regions, or products
- **Discount Management**: Handle complex discount structures and promotions
- **Currency Support**: Multi-currency pricing capabilities
- **Price History**: Track price changes over time
- **Approval Workflows**: Multi-level approval process for pricing changes
- **Role-based Access**: Different access levels for pricing teams

## Project Structure

```
pricing-mdm/
├── api/          # Node.js backend API
├── database/     # PostgreSQL database setup
├── ui/           # React frontend application
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose
- PostgreSQL

### Installation

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Start the database:
   ```bash
   npm run start:db
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- API server on `http://localhost:7000`
- UI development server on `http://localhost:3001`
- PostgreSQL database on `localhost:5433`

## Available Scripts

- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both API and UI in development mode
- `npm run dev:api` - Start only the API server
- `npm run dev:ui` - Start only the UI development server
- `npm run start:db` - Start PostgreSQL database using Docker
- `npm run stop:db` - Stop the database containers
- `npm run build:ui` - Build the UI for production
- `npm run preview:ui` - Preview the production build

## API Endpoints

- `GET /api/prices` - Get all prices
- `POST /api/prices` - Create new price
- `PUT /api/prices/:id` - Update price
- `DELETE /api/prices/:id` - Delete price
- `GET /api/price-lists` - Get price lists
- `GET /api/discounts` - Get discount rules

## Development

### Database Schema

The pricing system includes:
- Prices table
- Price lists table
- Discount rules table
- Currency table
- Price history table

### Environment Variables

Create `.env` files in the API directory with:
```
DATABASE_URL=postgresql://pricing_user:pricing_pass@localhost:5433/averis_pricing
PORT=7000
NODE_ENV=development
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC