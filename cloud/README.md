# Commerce Cloud Infrastructure

This folder contains the cloud infrastructure components for the commerce context applications.

## RabbitMQ Message Broker

### Quick Start

1. **Start RabbitMQ:**
   ```bash
   cd cloud
   docker-compose up -d
   ```

2. **Access Management UI:**
   - URL: http://localhost:15672
   - Username: `admin`
   - Password: `password`

3. **Stop RabbitMQ:**
   ```bash
   docker-compose down
   ```

### Message Queues

| Queue | Purpose | TTL | Max Length |
|-------|---------|-----|------------|
| `product.events` | Product lifecycle events (create/update/delete) | 24h | 10,000 |
| `product.maintenance` | Product maintenance operations | 24h | 5,000 |
| `product.notifications` | Real-time notifications | 1h | 1,000 |

### Exchanges and Routing

- **Exchange:** `product.exchange` (topic)
- **Routing Keys:**
  - `product.created` → `product.events`
  - `product.updated` → `product.events`
  - `product.deleted` → `product.events`
  - `product.maintenance.*` → `product.maintenance`
  - `product.notification.*` → `product.notifications`

### Message Schema

```json
{
  "eventType": "product.maintenance.sync",
  "timestamp": "2025-08-20T21:45:00.000Z",
  "source": "product-mdm-api",
  "productId": "uuid",
  "data": {
    "operation": "update",
    "changes": {...},
    "reason": "price_update"
  },
  "metadata": {
    "userId": "uuid",
    "correlationId": "uuid",
    "version": "1.0"
  }
}
```

### Connection Details

- **Host:** `localhost`
- **Port:** `5672` (AMQP)
- **VHost:** `commerce`
- **Username:** `admin`
- **Password:** `password`