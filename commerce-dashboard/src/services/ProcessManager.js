import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class ProcessManager {
  constructor() {
    this.baseDir = '/Users/eric.brand/Documents/source/github/Eric-Brand_swi/eb/commerce-ctx';
    this.services = {
      'product-mdm-ui': {
        name: 'Product MDM UI',
        dir: 'product-mdm/ui',
        command: 'npm run dev',
        port: 3001,
        logFile: '/tmp/product-ui.log'
      },
      'product-mdm-api': {
        name: 'Product MDM API',
        dir: 'product-mdm/api',
        command: 'PORT=6001 npm run dev',
        port: 6001,
        logFile: '/tmp/product-api.log'
      },
      
      'product-staging-api': {
        name: 'Product Staging API',
        dir: 'product-staging/api',
        command: 'PORT=6002 npm run dev',
        port: 6002,
        logFile: '/tmp/product-api.log'
      },
      'product-staging-ingest': {
        name: 'Product Staging Ingest',
        dir: 'product-staging/ingest',
        command: 'PORT=9002 npm run dev',
        port: 9002,
        logFile: '/tmp/product-api.log'
      },

      'pricing-mdm-ui': {
        name: 'Pricing MDM UI',
        dir: 'pricing-mdm/ui',
        command: 'npm run dev',
        port: 3003,
        logFile: '/tmp/pricing-ui.log'
      },
      'pricing-mdm-api': {
        name: 'Pricing MDM API',
        dir: 'pricing-mdm/api',
        command: 'PORT=6003 npm run dev',
        port: 6003,
        logFile: '/tmp/pricing-api.log'
      },
      
      'ecommerce-ui': {
        name: 'E-commerce UI',
        dir: 'ecommerce/ui',
        command: 'npm run dev',
        port: 3004,
        logFile: '/tmp/ecommerce-ui.log'
      },
      'ecommerce-api': {
        name: 'E-commerce API',
        dir: 'ecommerce/api',
        command: 'PORT=6004 npm run dev',
        port: 6004,
        logFile: '/tmp/ecommerce-api.log'
      },
    };
    
    this.runningProcesses = new Map();
  }

  async getServicesStatus() {
    const status = {};
    
    for (const [serviceId, config] of Object.entries(this.services)) {
      try {
        const isRunning = await this.isServiceRunning(config.port);
        const pid = await this.getServicePID(config.port);
        const logs = await this.getServiceLogs(serviceId, 5);
        
        status[serviceId] = {
          name: config.name,
          status: isRunning ? 'running' : 'stopped',
          port: config.port,
          pid: pid,
          directory: config.dir,
          logFile: config.logFile,
          recentLogs: logs,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        status[serviceId] = {
          name: config.name,
          status: 'error',
          port: config.port,
          pid: null,
          directory: config.dir,
          logFile: config.logFile,
          recentLogs: [],
          lastChecked: new Date().toISOString(),
          error: error.message
        };
      }
    }
    
    return status;
  }

  async isServiceRunning(port) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port} | grep LISTEN`);
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async getServicePID(port) {
    try {
      const { stdout } = await execAsync(`lsof -t -i :${port}`);
      const pids = stdout.trim().split('\\n').filter(pid => pid);
      return pids.length > 0 ? pids[0] : null;
    } catch (error) {
      return null;
    }
  }

  async restartService(serviceId) {
    const config = this.services[serviceId];
    if (!config) {
      throw new Error(`Unknown service: ${serviceId}`);
    }

    try {
      console.log(`Restarting ${config.name}...`);
      
      // Stop the service first
      await this.stopService(serviceId);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Start the service
      await this.startService(serviceId);
      
      return {
        success: true,
        message: `${config.name} restarted successfully`,
        serviceId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to restart ${config.name}:`, error);
      return {
        success: false,
        message: `Failed to restart ${config.name}: ${error.message}`,
        serviceId,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async stopService(serviceId) {
    const config = this.services[serviceId];
    const pid = await this.getServicePID(config.port);
    
    if (pid) {
      try {
        await execAsync(`kill -TERM ${pid}`);
        console.log(`Stopped ${config.name} (PID: ${pid})`);
        
        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force kill if still running
        const stillRunning = await this.isServiceRunning(config.port);
        if (stillRunning) {
          await execAsync(`kill -KILL ${pid}`);
          console.log(`Force killed ${config.name} (PID: ${pid})`);
        }
      } catch (error) {
        console.log(`Service ${config.name} may have already stopped`);
      }
    }
  }

  async startService(serviceId) {
    const config = this.services[serviceId];
    const serviceDir = path.join(this.baseDir, config.dir);
    
    return new Promise((resolve, reject) => {
      // Parse command to extract environment variables and actual command
      const commandParts = config.command.split(' ');
      const env = { ...process.env };
      
      // Remove PORT from inherited environment to prevent conflicts
      // Each service should use its own port configuration
      delete env.PORT;
      
      const actualCommand = [];
      
      // Separate environment variables from the command
      for (const part of commandParts) {
        if (part.includes('=') && !actualCommand.length) {
          // Environment variable (e.g., "PORT=9004")
          const [key, value] = part.split('=');
          env[key] = value;
        } else {
          actualCommand.push(part);
        }
      }
      
      // If no actual command was found, fallback to the original command
      const [command, ...args] = actualCommand.length ? actualCommand : commandParts;
      
      // For API services, capture logs to help debug startup issues
      const isApiService = serviceId.includes('api');
      const stdio = isApiService ? 
        ['ignore', 'pipe', 'pipe'] : 
        ['ignore', 'ignore', 'ignore'];
        
      const child = spawn(command, args, {
        cwd: serviceDir,
        detached: true,
        stdio: stdio,
        env: env
      });
      
      // For API services, log output to help debug
      if (isApiService) {
        child.stdout?.on('data', (data) => {
          console.log(`${config.name} stdout:`, data.toString().trim());
        });
        child.stderr?.on('data', (data) => {
          console.log(`${config.name} stderr:`, data.toString().trim());
        });
      }
      
      child.unref();
      
      console.log(`Started ${config.name} (PID: ${child.pid}) with command: ${command} ${args.join(' ')}`);
      
      // Give it time to start - API services need longer to initialize DB and RabbitMQ connections
      const timeout = serviceId.includes('api') ? 10000 : 5000;
      setTimeout(async () => {
        const isRunning = await this.isServiceRunning(config.port);
        if (isRunning) {
          resolve({ pid: child.pid, port: config.port });
        } else {
          reject(new Error(`Failed to start ${config.name} on port ${config.port}`));
        }
      }, timeout);
    });
  }

  async getServiceLogs(serviceId, lines = 50) {
    const config = this.services[serviceId];
    if (!config || !config.logFile) {
      return [];
    }

    try {
      const { stdout } = await execAsync(`tail -n ${lines} ${config.logFile}`);
      return stdout.split('\\n').filter(line => line.trim().length > 0);
    } catch (error) {
      // Log file might not exist yet
      return [];
    }
  }

  async killAllServices() {
    const results = [];
    
    for (const serviceId of Object.keys(this.services)) {
      try {
        await this.stopService(serviceId);
        results.push({ serviceId, success: true });
      } catch (error) {
        results.push({ serviceId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async startAllServices() {
    const results = [];
    
    for (const serviceId of Object.keys(this.services)) {
      try {
        await this.startService(serviceId);
        results.push({ serviceId, success: true });
      } catch (error) {
        results.push({ serviceId, success: false, error: error.message });
      }
    }
    
    return results;
  }
}