const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.POSTGRES_HEALTH_PORT || 8091;
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'commerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 2, // Minimal connection pool for health checks
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Enable CORS for dashboard access
app.use(cors());
app.use(express.json());

// Create connection pool
const pool = new Pool(DB_CONFIG);

// Health check state
let healthState = {
  status: 'unknown',
  lastChecked: null,
  uptime: null,
  startTime: new Date(),
  version: null,
  connectionErrors: 0,
  lastError: null,
  databaseInfo: null,
  schemas: []
};

async function checkPostgresHealth() {
  const client = await pool.connect();
  
  try {
    const startTime = Date.now();
    
    // Basic connectivity test
    const pingResult = await client.query('SELECT 1 as ping');
    const responseTime = Date.now() - startTime;

    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;

    // Get database size and statistics
    const dbStatsResult = await client.query(`
      SELECT 
        pg_database_size(current_database()) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
        current_database() as database_name
    `);
    const dbStats = dbStatsResult.rows[0];

    // Get schema information for Averis schemas
    const schemasResult = await client.query(`
      SELECT 
        schema_name,
        (SELECT count(*) FROM information_schema.tables 
         WHERE table_schema = schema_name AND table_type = 'BASE TABLE') as table_count
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'averis_%' OR schema_name = 'public'
      ORDER BY schema_name
    `);
    const schemas = schemasResult.rows;

    // Get connection pool information
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    healthState = {
      ...healthState,
      status: 'healthy',
      lastChecked: new Date(),
      uptime: Math.floor((new Date() - healthState.startTime) / 1000),
      version: version.split(' ')[1], // Extract just version number
      connectionErrors: 0,
      lastError: null,
      databaseInfo: {
        name: dbStats.database_name,
        size: formatBytes(parseInt(dbStats.database_size)),
        activeConnections: parseInt(dbStats.active_connections),
        responseTime: `${responseTime}ms`,
        poolStats: poolStats
      },
      schemas: schemas.map(schema => ({
        name: schema.schema_name,
        tableCount: parseInt(schema.table_count)
      }))
    };

    console.log(`✅ PostgreSQL health check successful (${responseTime}ms)`);
    
  } catch (error) {
    console.error('❌ PostgreSQL health check failed:', error.message);
    
    healthState = {
      ...healthState,
      status: 'unhealthy',
      lastChecked: new Date(),
      uptime: Math.floor((new Date() - healthState.startTime) / 1000),
      connectionErrors: healthState.connectionErrors + 1,
      lastError: error.message,
      databaseInfo: null
    };
  } finally {
    client.release();
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Health endpoint
app.get('/health', async (req, res) => {
  // Perform real-time health check
  await checkPostgresHealth();
  
  const response = {
    service: 'PostgreSQL Database',
    status: healthState.status,
    timestamp: new Date().toISOString(),
    uptime: healthState.uptime,
    version: healthState.version,
    lastChecked: healthState.lastChecked,
    details: {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      database: DB_CONFIG.database,
      connectionErrors: healthState.connectionErrors,
      lastError: healthState.lastError,
      databaseInfo: healthState.databaseInfo,
      schemas: healthState.schemas
    }
  };

  const statusCode = healthState.status === 'healthy' ? 200 : 
                    healthState.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(response);
});

// Schema-specific health check
app.get('/health/schemas', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get detailed schema information
    const schemaDetailsResult = await client.query(`
      SELECT 
        s.schema_name,
        COALESCE(t.table_count, 0) as table_count,
        COALESCE(r.row_count, 0) as estimated_rows
      FROM information_schema.schemata s
      LEFT JOIN (
        SELECT 
          table_schema,
          count(*) as table_count
        FROM information_schema.tables 
        WHERE table_type = 'BASE TABLE'
        GROUP BY table_schema
      ) t ON s.schema_name = t.table_schema
      LEFT JOIN (
        SELECT 
          schemaname,
          sum(n_tup_ins + n_tup_upd + n_tup_del) as row_count
        FROM pg_stat_user_tables
        GROUP BY schemaname
      ) r ON s.schema_name = r.schemaname
      WHERE s.schema_name LIKE 'averis_%' OR s.schema_name = 'public'
      ORDER BY s.schema_name
    `);
    
    client.release();
    
    res.json({
      service: 'PostgreSQL Database - Schemas',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      schemas: schemaDetailsResult.rows
    });
    
  } catch (error) {
    console.error('Schema health check failed:', error.message);
    res.status(503).json({
      service: 'PostgreSQL Database - Schemas',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple status endpoint for quick checks
app.get('/status', (req, res) => {
  res.status(healthState.status === 'healthy' ? 200 : 503).json({ 
    status: healthState.status,
    uptime: healthState.uptime,
    database: DB_CONFIG.database
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'PostgreSQL Health Monitor',
    version: '1.0.0',
    description: 'Health monitoring service for PostgreSQL database',
    port: PORT,
    database: {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      database: DB_CONFIG.database
    },
    endpoints: {
      health: '/health',
      schemas: '/health/schemas',
      status: '/status',
      info: '/info'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down PostgreSQL health monitor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down PostgreSQL health monitor...');
  await pool.end();
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🔍 PostgreSQL Health Monitor running on port ${PORT}`);
  console.log(`🗄️  Monitoring database ${DB_CONFIG.database} at ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  
  // Initial health check
  checkPostgresHealth();
  
  // Schedule periodic health checks every 60 seconds (less frequent than NATS)
  setInterval(checkPostgresHealth, 60000);
});