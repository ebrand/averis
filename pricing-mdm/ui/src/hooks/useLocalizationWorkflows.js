import { useState, useEffect, useCallback } from 'react'
import { localizationApiService } from '../services/localizationApiService'
import { signalRService } from '../services/signalRService'

export const useLocalizationWorkflows = (catalogId, productId) => {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Join worker groups for workflows that have assigned workers
  const joinWorkerGroups = useCallback(async (workflowsData) => {
    if (signalRService.isConnected() && workflowsData.length > 0) {
      for (const workflow of workflowsData) {
        if (workflow.workerId) {
          console.log(`🔗 SignalR: Joining worker group for workflow ${workflow.id}, worker ${workflow.workerId}`)
          await signalRService.joinWorkerGroup(workflow.workerId)
        } else {
          console.log(`⏳ SignalR: Workflow ${workflow.id} has no workerId yet, cannot join worker group`)
        }
      }
    } else if (!signalRService.isConnected()) {
      console.log(`❌ SignalR: Not connected, cannot join worker groups`)
    }
  }, [])

  // Load workflows for a specific product
  const loadWorkflows = useCallback(async () => {
    if (!catalogId || !productId) {
      console.log(`🔍 useLocalizationWorkflows: Missing catalogId (${catalogId}) or productId (${productId})`)
      return
    }

    try {
      console.log(`🔍 useLocalizationWorkflows: Loading workflows for catalog ${catalogId}, product ${productId}`)
      console.log(`🔍 QUERY IDs USED:`, { catalogId, productId })
      setLoading(true)
      setError(null)
      
      // Try specific catalog/product query first
      let data = await localizationApiService.getWorkflowsForProduct(catalogId, productId)
      console.log(`🔍 useLocalizationWorkflows: Received ${data.length} specific workflows:`, data)
      
      // If no workflows found with specific query, try recent workflows as fallback
      if (data.length === 0) {
        console.log(`🔍 useLocalizationWorkflows: No specific workflows found, trying recent workflows fallback`)
        try {
          const recentWorkflows = await localizationApiService.getRecentWorkflows(100)
          console.log(`🔍 useLocalizationWorkflows: Retrieved ${recentWorkflows.length} recent workflows for fallback analysis`)
        
        // Filter recent workflows to find ones related to this product
        // Look for workflows that match the product ID in their JobData
        data = recentWorkflows.filter(workflow => {
          try {
            // Check if this workflow relates to our product
            const jobData = workflow.jobData || {}
            const relatedProductId = jobData.productId
            const relatedCatalogProductId = jobData.catalogProductId
            
            console.log(`🔍 Checking workflow ${workflow.id}: productId=${relatedProductId}, catalogProductId=${relatedCatalogProductId}, catalogId=${workflow.catalogId}`)
            
            // Enhanced matching logic - check workflow.catalogId against our query catalogId
            // and productId/catalogProductId against our query productId
            const catalogMatch = workflow.catalogId === catalogId
            const productMatch = relatedProductId === productId || relatedCatalogProductId === productId
            
            console.log(`🔍 Match check: catalogMatch=${catalogMatch}, productMatch=${productMatch}`)
            
            return catalogMatch && productMatch
          } catch (e) {
            console.log(`🔍 Error checking workflow ${workflow.id}:`, e)
            return false
          }
        })
        
        console.log(`🔍 useLocalizationWorkflows: Found ${data.length} related workflows from recent fallback:`, data)
        } catch (fallbackError) {
          console.error(`🔍 useLocalizationWorkflows: Fallback failed:`, fallbackError)
        }
      }
      
      setWorkflows(data)
      
      // Join worker groups if SignalR is connected
      await joinWorkerGroups(data)
    } catch (err) {
      console.error('🔍 useLocalizationWorkflows: Failed to load workflows:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [catalogId, productId, joinWorkerGroups])

  // Handle real-time updates
  const handleProgressUpdate = useCallback((data) => {
    console.log(`📈 SignalR Progress Update Received:`, data)
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(workflow => 
        workflow.id === data.jobId 
          ? { 
              ...workflow, 
              progressPercentage: data.progressPercentage || workflow.progressPercentage,
              currentStep: data.currentStep || workflow.currentStep,
              status: data.status || workflow.status
            }
          : workflow
      )
    )
  }, [])

  const handleJobCompleted = useCallback((data) => {
    console.log(`✅ SignalR Job Completed:`, data)
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(workflow => 
        workflow.id === data.jobId 
          ? { 
              ...workflow, 
              status: 'completed',
              progressPercentage: 100,
              currentStep: 'Completed',
              completedAt: new Date().toISOString()
            }
          : workflow
      )
    )
  }, [])

  const handleJobFailed = useCallback((data) => {
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(workflow => 
        workflow.id === data.jobId 
          ? { 
              ...workflow, 
              status: 'failed',
              currentStep: 'Failed',
              errorMessage: data.errorMessage || 'Job failed'
            }
          : workflow
      )
    )
  }, [])

  const handleWorkerAssigned = useCallback((data) => {
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(workflow => 
        workflow.id === data.jobId 
          ? { 
              ...workflow, 
              status: 'running',
              workerId: data.workerId,
              startedAt: new Date().toISOString()
            }
          : workflow
      )
    )
  }, [])

  // Add handler for new job creation events
  const handleJobCreated = useCallback((data) => {
    console.log(`🆕 SignalR Job Created:`, data)
    // Immediately refresh workflows when a new job is created
    setTimeout(() => {
      console.log(`🆕 SignalR: Refreshing workflows after job creation`)
      loadWorkflows()
    }, 500) // Small delay to ensure the job is saved to database
  }, [loadWorkflows])

  // Connect to SignalR on mount
  useEffect(() => {
    let unsubscribeFunctions = []

    const connectAndSubscribe = async () => {
      try {
        const connected = await signalRService.connect()
        if (connected) {
          setIsConnected(true)
          
          // Subscribe to all relevant events
          unsubscribeFunctions.push(
            signalRService.subscribe('ProgressUpdate', handleProgressUpdate),
            signalRService.subscribe('JobComplete', handleJobCompleted),
            signalRService.subscribe('JobFailed', handleJobFailed),
            signalRService.subscribe('WorkerAssigned', handleWorkerAssigned),
            signalRService.subscribe('JobCreated', handleJobCreated)
          )
          
          // Join worker groups for existing workflows if any
          await joinWorkerGroups(workflows)
        }
      } catch (error) {
        console.error('Failed to connect to SignalR:', error)
        setIsConnected(false)
      }
    }

    connectAndSubscribe()

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
      setIsConnected(false)
    }
  }, [handleProgressUpdate, handleJobCompleted, handleJobFailed, handleWorkerAssigned, handleJobCreated, workflows, joinWorkerGroups])

  // Load workflows when catalogId or productId changes
  useEffect(() => {
    if (catalogId && productId) {
      loadWorkflows()
    }
  }, [catalogId, productId, loadWorkflows])

  // Refresh workflows manually
  const refreshWorkflows = useCallback(() => {
    loadWorkflows()
  }, [loadWorkflows])

  // Watch for pending workflows and refresh periodically to catch worker assignments
  useEffect(() => {
    const pendingWorkflows = workflows.filter(w => w.status === 'pending' && !w.workerId)
    
    if (pendingWorkflows.length > 0) {
      console.log(`🔄 SignalR: Found ${pendingWorkflows.length} pending workflows without workerIds, setting up refresh interval`)
      
      const interval = setInterval(() => {
        console.log(`🔄 SignalR: Refreshing workflows to check for worker assignments`)
        loadWorkflows()
      }, 2000) // Check every 2 seconds
      
      // Stop checking after 30 seconds
      const timeout = setTimeout(() => {
        console.log(`⏰ SignalR: Stopping worker assignment check after 30 seconds`)
        clearInterval(interval)
      }, 30000)
      
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [workflows, loadWorkflows])

  // Optional: Light polling for active workflows only (when there are running jobs)
  useEffect(() => {
    if (!catalogId || !productId) return

    const hasActiveWorkflows = workflows.some(w => w.status === 'running' || w.status === 'pending')
    
    if (hasActiveWorkflows) {
      console.log(`🔄 Active Workflow Polling: Setting up polling for ${workflows.filter(w => w.status === 'running' || w.status === 'pending').length} active workflows`)
      
      const pollInterval = setInterval(() => {
        console.log(`🔄 Active Workflow Polling: Checking progress for active workflows`)
        loadWorkflows()
      }, 3000) // Poll every 3 seconds only when there are active workflows

      return () => {
        console.log(`🔄 Active Workflow Polling: Cleaning up polling interval`)
        clearInterval(pollInterval)
      }
    }
  }, [catalogId, productId, loadWorkflows, workflows])

  return {
    workflows,
    loading,
    error,
    isConnected,
    refreshWorkflows
  }
}