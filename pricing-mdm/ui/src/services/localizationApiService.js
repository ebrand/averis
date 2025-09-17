const LOCALIZATION_API_BASE_URL = 'http://api.localhost/localization/api/localization'

class LocalizationApiService {
  constructor() {
    this.baseUrl = LOCALIZATION_API_BASE_URL
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  // Get all workflows
  async getWorkflows() {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching workflows:', error)
      throw error
    }
  }

  // Get workflows for a specific catalog product
  async getWorkflowsForProduct(catalogId, productId) {
    try {
      const url = `${this.baseUrl}/workflows/catalog/${catalogId}/product/${productId}`
      console.log(`🌐 LocalizationApiService: Fetching workflows from: ${url}`)
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      console.log(`🌐 LocalizationApiService: Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`🌐 LocalizationApiService: Error response: ${errorText}`)
        throw new Error(`Failed to fetch workflows for product: ${response.status}`)
      }

      const data = await response.json()
      console.log(`🌐 LocalizationApiService: Retrieved ${data.length} workflows:`, data)
      return data
    } catch (error) {
      console.error('🌐 LocalizationApiService: Error fetching workflows for product:', error)
      throw error
    }
  }

  // Get recent workflows (fallback method to find workflows regardless of exact catalog/product mapping)
  async getRecentWorkflows(limit = 50) {
    try {
      const url = `${this.baseUrl}/workflows?limit=${limit}&orderBy=createdAt&orderDirection=desc`
      console.log(`🌐 LocalizationApiService: Fetching recent workflows from: ${url}`)
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      console.log(`🌐 LocalizationApiService: Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`🌐 LocalizationApiService: Error response: ${errorText}`)
        throw new Error(`Failed to fetch recent workflows: ${response.status}`)
      }

      const data = await response.json()
      console.log(`🌐 LocalizationApiService: Retrieved ${data.length} recent workflows`)
      return data
    } catch (error) {
      console.error('🌐 LocalizationApiService: Error fetching recent workflows:', error)
      throw error
    }
  }

  // Get a specific workflow by ID
  async getWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching workflow:', error)
      throw error
    }
  }

  // Create a new workflow
  async createWorkflow(workflowData) {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(workflowData)
      })

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  // Get worker pool status
  async getWorkerStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/workers/status`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch worker status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching worker status:', error)
      throw error
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error checking health:', error)
      throw error
    }
  }
}

export const localizationApiService = new LocalizationApiService()
export default localizationApiService