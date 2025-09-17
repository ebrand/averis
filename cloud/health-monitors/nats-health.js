const express = require('express');
const cors = require('cors');
const { connect } = require('nats');

const app = express();
const PORT = process.env.NATS_HEALTH_PORT || 8090;
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

// Enable CORS for dashboard access
app.use(cors());
app.use(express.json());

// Health check state
let healthState = {
  status: 'unknown',
  lastChecked: null,
  uptime: null,
  startTime: new Date(),
  version: 'v2.10.0',
  connectionErrors: 0,
  lastError: null,
  serverInfo: null
};

// NATS connection monitoring
let natsConnection = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

async function checkNatsHealth() {
  try {
    // Try to connect to NATS
    if (!natsConnection) {
      natsConnection = await connect({
        servers: [NATS_URL],
        name: 'nats-health-monitor',
        maxReconnectAttempts: 3,
        reconnectTimeWait: 1000,
        timeout: 5000
      });

      // Listen for connection events
      natsConnection.closed().then(() => {
        console.log('NATS connection closed');
        natsConnection = null;
        healthState.status = 'unhealthy';
        healthState.lastError = 'Connection closed';
      });

      console.log('✅ Connected to NATS server');
    }

    // Test basic functionality by publishing a ping message
    const testSubject = 'health.ping';
    const testData = JSON.stringify({ timestamp: new Date().toISOString(), from: 'health-monitor' });
    
    natsConnection.publish(testSubject, testData);
    
    // Get server info if available
    const info = natsConnection.info;
    
    healthState = {
      ...healthState,
      status: 'healthy',
      lastChecked: new Date(),
      uptime: Math.floor((new Date() - healthState.startTime) / 1000),
      connectionErrors: 0,
      lastError: null,
      serverInfo: info ? {
        server_id: info.server_id,
        server_name: info.server_name,
        version: info.version,
        max_payload: info.max_payload,
        client_id: info.client_id
      } : null
    };

    reconnectAttempts = 0;
    
  } catch (error) {
    console.error('❌ NATS health check failed:', error.message);
    
    healthState = {
      ...healthState,
      status: 'unhealthy',
      lastChecked: new Date(),
      uptime: Math.floor((new Date() - healthState.startTime) / 1000),
      connectionErrors: healthState.connectionErrors + 1,
      lastError: error.message,
      serverInfo: null
    };

    // Clean up connection on error
    if (natsConnection) {
      try {
        await natsConnection.close();
      } catch (closeError) {
        console.error('Error closing NATS connection:', closeError.message);
      }
      natsConnection = null;
    }

    reconnectAttempts++;
    if (reconnectAttempts < maxReconnectAttempts) {
      console.log(`Attempting to reconnect to NATS (${reconnectAttempts}/${maxReconnectAttempts})...`);
      setTimeout(checkNatsHealth, 2000 * reconnectAttempts); // Exponential backoff
    }
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  const response = {
    service: 'NATS Message Streaming',
    status: healthState.status,
    timestamp: new Date().toISOString(),
    uptime: healthState.uptime,
    version: healthState.version,
    lastChecked: healthState.lastChecked,
    details: {
      natsUrl: NATS_URL,
      connectionErrors: healthState.connectionErrors,
      lastError: healthState.lastError,
      reconnectAttempts: reconnectAttempts,
      maxReconnectAttempts: maxReconnectAttempts,
      serverInfo: healthState.serverInfo
    }
  };

  const statusCode = healthState.status === 'healthy' ? 200 : 
                    healthState.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(response);
});

// Simple status endpoint for quick checks
app.get('/status', (req, res) => {
  res.status(healthState.status === 'healthy' ? 200 : 503).json({ 
    status: healthState.status,
    uptime: healthState.uptime
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'NATS Health Monitor',
    version: '1.0.0',
    description: 'Health monitoring service for NATS message streaming',
    port: PORT,
    natsUrl: NATS_URL,
    endpoints: {
      health: '/health',
      status: '/status',
      info: '/info'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down NATS health monitor...');
  if (natsConnection) {
    await natsConnection.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down NATS health monitor...');
  if (natsConnection) {
    await natsConnection.close();
  }
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🔍 NATS Health Monitor running on port ${PORT}`);
  console.log(`📡 Monitoring NATS server at ${NATS_URL}`);
  
  // Initial health check
  checkNatsHealth();
  
  // Schedule periodic health checks every 30 seconds
  setInterval(checkNatsHealth, 30000);
});