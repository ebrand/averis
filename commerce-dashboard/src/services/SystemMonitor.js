import axios from 'axios';
import pg from 'pg';
import amqp from 'amqplib';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SystemMonitor {
  constructor() {
    this.services = {
      
      // Product MDM System
      'product-mdm-ui': { url: 'http://localhost:3001', healthPath: '/' },
      'product-mdm-api': { url: 'http://localhost:6001', healthPath: '/health' },
      
      // Product Staging System (with ingest service)
      'product-staging-api': { url: 'http://localhost:6002', healthPath: '/health' },
      'product-staging-ingest': { url: 'http://localhost:9002', healthPath: '/health' },
      
      // Pricing MDM System (UI + API - no separate ingest)
      'pricing-mdm-ui': { url: 'http://localhost:3003', healthPath: '/' },
      'pricing-mdm-api': { url: 'http://localhost:6003', healthPath: '/health' },

      // E-commerce System (UI + API - no separate ingest)
      'ecommerce-ui': { url: 'http://localhost:3004', healthPath: '/' },
      'ecommerce-api': { url: 'http://localhost:6004', healthPath: '/health' }
    };
    
    this.databases = {
      'product_mdm': { schema: 'product_mdm', testTable: 'products' },
      'product_staging': { schema: 'product_cache', testTable: 'products' },
      'pricing_mdm': { schema: 'pricing_mdm', testTable: 'products' },
      'ecommerce': { schema: 'ecommerce', testTable: 'products' }
    };
  }

  async getSystemStatus() {
    const [apis, databases, rabbitmq, processes] = await Promise.all([
      this.checkAPIs(),
      this.checkDatabases(),
      this.checkRabbitMQ(),
      this.checkProcesses()
    ]);

    return {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallHealth(apis, databases, rabbitmq, processes),
      apis,
      databases,
      rabbitmq,
      processes
    };
  }

  async checkAPIs() {
    const results = {};
    
    for (const [name, config] of Object.entries(this.services)) {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${config.url}${config.healthPath}`, {
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });
        
        const responseTime = Date.now() - startTime;
        
        results[name] = {
          status: response.status >= 200 && response.status < 400 ? 'healthy' : 'unhealthy',
          httpStatus: response.status,
          responseTime: `${responseTime}ms`,
          url: `${config.url}${config.healthPath}`,
          lastChecked: new Date().toISOString(),
          error: response.status >= 400 ? `HTTP ${response.status}` : null
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          httpStatus: null,
          responseTime: null,
          url: `${config.url}${config.healthPath}`,
          lastChecked: new Date().toISOString(),
          error: error.code === 'ECONNREFUSED' ? 'Connection refused' : error.message
        };
      }
    }
    
    return results;
  }

  async checkDatabases() {
    const results = {};
    
    for (const [name, config] of Object.entries(this.databases)) {
      try {
        const client = new pg.Client({
          host: 'localhost',
          port: 5432,
          database: 'commerce_db',
          user: 'postgres',
          password: 'postgres'
        });
        
        await client.connect();
        
        // Test schema access and table count
        const schemaResult = await client.query(
          `SELECT count(*) as table_count FROM information_schema.tables WHERE table_schema = $1`,
          [config.schema]
        );
        
        const testResult = await client.query(
          `SELECT count(*) as record_count FROM ${config.schema}.${config.testTable}`
        );
        
        await client.end();
        
        results[name] = {
          status: 'healthy',
          schema: config.schema,
          tableCount: parseInt(schemaResult.rows[0].table_count),
          recordCount: parseInt(testResult.rows[0].record_count),
          lastChecked: new Date().toISOString(),
          error: null
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          schema: config.schema,
          tableCount: null,
          recordCount: null,
          lastChecked: new Date().toISOString(),
          error: error.message
        };
      }
    }
    
    return results;
  }

  async checkRabbitMQ() {
    try {
      // Check RabbitMQ connection
      const connection = await amqp.connect('amqp://admin:admin@localhost:5672/commerce');
      const channel = await connection.createChannel();
      
      await channel.close();
      await connection.close();
      
      // Check management API and get app-specific queue information
      try {
        const mgmtResponse = await axios.get('http://localhost:15672/api/overview', {
          auth: { username: 'admin', password: 'admin' },
          timeout: 5000
        });
        
        // Get queue details for each app
        const appQueues = await this.getRabbitMQAppSpecificData();
        
        return {
          status: 'healthy',
          connection: 'connected',
          managementApi: 'accessible',
          version: mgmtResponse.data.rabbitmq_version,
          erlangVersion: mgmtResponse.data.erlang_version,
          lastChecked: new Date().toISOString(),
          appSpecific: appQueues,
          error: null
        };
      } catch (mgmtError) {
        return {
          status: 'partial',
          connection: 'connected',
          managementApi: 'error',
          version: null,
          erlangVersion: null,
          lastChecked: new Date().toISOString(),
          appSpecific: {
            'product-mdm': { error: 'Management API error' },
            'product-staging': { error: 'Management API error' }
          },
          error: `Management API: ${mgmtError.message}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        connection: 'failed',
        managementApi: 'unknown',
        version: null,
        erlangVersion: null,
        lastChecked: new Date().toISOString(),
        appSpecific: {
          'product-mdm': { error: 'Connection failed' },
          'product-staging': { error: 'Connection failed' }
        },
        error: error.message
      };
    }
  }

  async getRabbitMQAppSpecificData() {
    try {
      // Get queue information from management API
      const queuesResponse = await axios.get('http://localhost:15672/api/queues/commerce', {
        auth: { username: 'admin', password: 'admin' },
        timeout: 5000
      });
      
      const queues = queuesResponse.data;
      const appData = {};
      
      // Product MDM - Publisher metrics
      const productEventQueue = queues.find(q => q.name === 'product.events');
      appData['product-mdm'] = {
        role: 'Publisher',
        queue: 'product.events',
        messages: productEventQueue ? productEventQueue.messages : 0,
        publishRate: productEventQueue ? (productEventQueue.message_stats?.publish_details?.rate || 0) : 0,
        totalPublished: productEventQueue ? (productEventQueue.message_stats?.publish || 0) : 0
      };
      
      // Product Staging - Consumer metrics
      const stagingQueue = queues.find(q => q.name === 'product_cache_updates');
      appData['product-staging'] = {
        role: 'Consumer',
        queue: 'product_cache_updates',
        messages: stagingQueue ? stagingQueue.messages : 0,
        consumeRate: stagingQueue ? (stagingQueue.message_stats?.deliver_details?.rate || 0) : 0,
        totalConsumed: stagingQueue ? (stagingQueue.message_stats?.deliver || 0) : 0
      };
      
      // Pricing MDM - No longer uses messaging
      // E-commerce - No longer uses messaging
      // Note: These apps now use direct API calls instead of messaging
      
      return appData;
    } catch (error) {
      // Return basic structure with error information
      return {
        'product-mdm': { role: 'Publisher', error: 'Queue data unavailable' },
        'product-staging': { role: 'Consumer', error: 'Queue data unavailable' },
        // Note: Pricing MDM and E-commerce no longer use messaging
      };
    }
  }

  async checkProcesses() {
    const results = {};
    const serviceConfig = {
      'product-mdm-ui': { port: 3001 },
      'product-mdm-api': { port: 6001 },
      'product-staging-api': { port: 6002 },
      'product-staging-ingest': { port: 9002 },
      'pricing-mdm-ui': { port: 3003 },
      'pricing-mdm-api': { port: 6003 },
      'ecommerce-ui': { port: 3004 },
      'ecommerce-api': { port: 6004 }
    };
    
    for (const [name, config] of Object.entries(serviceConfig)) {
      try {
        // Use lsof to find process listening on the port (server process only)
        const { stdout } = await execAsync(`lsof -t -i :${config.port} -s TCP:LISTEN`);
        const pids = stdout.trim().split('\n').filter(pid => pid && pid.match(/^\d+$/));
        
        if (pids.length > 0) {
          const pid = pids[0];
          // Get process info using ps (macOS compatible)
          try {
            const { stdout: psOutput } = await execAsync(`ps -p ${pid} -o pcpu,pmem,etime`);
            const lines = psOutput.trim().split('\n');
            const processInfo = lines.length > 1 ? lines[1].trim().split(/\s+/) : [];
            
            if (processInfo.length >= 3) {
              results[name] = {
                status: 'running',
                pid: pid,
                cpu: processInfo[0] + '%',
                memory: processInfo[1] + '%',
                uptime: processInfo[2] || 'unknown',
                port: config.port,
                lastChecked: new Date().toISOString(),
                error: null
              };
            } else {
              results[name] = {
                status: 'running',
                pid: pid,
                cpu: 'unknown',
                memory: 'unknown',
                uptime: 'unknown',
                port: config.port,
                lastChecked: new Date().toISOString(),
                error: null
              };
            }
          } catch (psError) {
            results[name] = {
              status: 'stopped',
              pid: pid,
              cpu: null,
              memory: null,
              uptime: null,
              port: config.port,
              lastChecked: new Date().toISOString(),
              error: 'Process no longer exists'
            };
          }
        } else {
          results[name] = {
            status: 'stopped',
            pid: null,
            cpu: null,
            memory: null,
            uptime: null,
            port: config.port,
            lastChecked: new Date().toISOString(),
            error: 'No process listening on port'
          };
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          pid: null,
          cpu: null,
          memory: null,
          uptime: null,
          port: config.port,
          lastChecked: new Date().toISOString(),
          error: error.message.includes('No such process') ? 'Process not found' : error.message
        };
      }
    }
    
    return results;
  }

  async getDatabaseSchemasStatus() {
    return await this.checkDatabases();
  }

  async getRabbitMQStatus() {
    return await this.checkRabbitMQ();
  }

  calculateOverallHealth(apis, databases, rabbitmq, processes) {
    const allStatuses = [
      ...Object.values(apis).map(s => s.status),
      ...Object.values(databases).map(s => s.status),
      rabbitmq.status,
      ...Object.values(processes).map(s => s.status)
    ];
    
    const healthyCount = allStatuses.filter(s => s === 'healthy' || s === 'running').length;
    const totalCount = allStatuses.length;
    const healthPercentage = Math.round((healthyCount / totalCount) * 100);
    
    if (healthPercentage === 100) return 'healthy';
    if (healthPercentage >= 75) return 'degraded';
    if (healthPercentage >= 50) return 'partial';
    return 'critical';
  }
}