import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import cron from 'node-cron';
import { SystemMonitor } from './services/SystemMonitor.js';
import { ProcessManager } from './services/ProcessManager.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize services
const systemMonitor = new SystemMonitor();
const processManager = new ProcessManager();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store WebSocket connections
const wsConnections = new Set();

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected to system monitor');
  wsConnections.add(ws);
  
  // Send initial status
  systemMonitor.getSystemStatus().then(status => {
    ws.send(JSON.stringify({ type: 'system_status', data: status }));
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'restart_service') {
        const result = await processManager.restartService(data.service);
        ws.send(JSON.stringify({ type: 'restart_result', data: result }));
      }
      
      if (data.type === 'get_logs') {
        const logs = await processManager.getServiceLogs(data.service);
        ws.send(JSON.stringify({ type: 'service_logs', service: data.service, data: logs }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    wsConnections.delete(ws);
    console.log('Client disconnected from system monitor');
  });
});

// Broadcast to all connected clients
function broadcast(message) {
  wsConnections.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// REST API Routes
app.get('/api/status', async (req, res) => {
  try {
    const status = await systemMonitor.getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const services = await processManager.getServicesStatus();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services/:service/restart', async (req, res) => {
  try {
    const result = await processManager.restartService(req.params.service);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:service/logs', async (req, res) => {
  try {
    const logs = await processManager.getServiceLogs(req.params.service);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/database/schemas', async (req, res) => {
  try {
    const schemas = await systemMonitor.getDatabaseSchemasStatus();
    res.json(schemas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rabbitmq/status', async (req, res) => {
  try {
    const rabbitmq = await systemMonitor.getRabbitMQStatus();
    res.json(rabbitmq);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/lsof/:port', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const port = req.params.port;
    const { stdout } = await execAsync(`lsof -t -i :${port} -s TCP:LISTEN`);
    const pids = stdout.trim().split('\n').filter(pid => pid && pid.match(/^\d+$/));
    
    res.json({
      port,
      command: `lsof -t -i :${port} -s TCP:LISTEN`,
      raw_output: stdout,
      pids: pids,
      success: true
    });
  } catch (error) {
    res.json({
      port: req.params.port,
      command: `lsof -t -i :${req.params.port} -s TCP:LISTEN`,
      error: error.message,
      success: false
    });
  }
});

// Product data proxy endpoints
app.get('/api/products/product-mdm', async (req, res) => {
  try {
    const response = await fetch('http://localhost:6001/api/products');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Product MDM data:', error);
    res.status(500).json({ error: 'Failed to fetch Product MDM data', message: error.message });
  }
});

app.get('/api/products/product-cache', async (req, res) => {
  try {
    const response = await fetch('http://localhost:6002/api/products');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Product Cache data:', error);
    res.status(500).json({ error: 'Failed to fetch Product Cache data', message: error.message });
  }
});

app.get('/api/data-dictionary', async (req, res) => {
  try {
    const response = await fetch('http://localhost:6001/api/data-dictionary');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Data Dictionary:', error);
    res.status(500).json({ error: 'Failed to fetch Data Dictionary', message: error.message });
  }
});

// Removed obsolete Pricing MDM and E-commerce proxy endpoints
// These systems no longer store product data in the simplified architecture

// Periodic monitoring (every 30 seconds)
cron.schedule('*/30 * * * * *', async () => {
  try {
    const status = await systemMonitor.getSystemStatus();
    broadcast({ type: 'system_status', data: status });
  } catch (error) {
    console.error('Error in periodic monitoring:', error);
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3009;
server.listen(PORT, () => {
  console.log(`🔍 System Monitor running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});