'use client'

import { useEffect, useState } from 'react'
import { initializeGlobalSync, getGlobalSync, defaultSyncConfig, SyncStatus } from '../utils/comprehensiveSync'

interface SyncInitializerProps {
  children: React.ReactNode
}

export default function SyncInitializer({ children }: SyncInitializerProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeSync = async () => {
      try {
        // Initialize the global sync manager
        const syncManager = initializeGlobalSync(defaultSyncConfig)
        
        // Initialize and perform first sync
        await syncManager.initialize()
        
        if (mounted) {
          setIsInitialized(true)
          
          // Get initial status
          const status = await syncManager.getSyncStatus()
          setSyncStatus(status)
        }
      } catch (error) {
        console.error('Failed to initialize sync:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Sync initialization failed')
        }
      }
    }

    initializeSync()

    // Cleanup on unmount
    return () => {
      mounted = false
      const syncManager = getGlobalSync()
      if (syncManager) {
        syncManager.destroy()
      }
    }
  }, [])

  // Update sync status periodically
  useEffect(() => {
    if (!isInitialized) return

    const updateStatus = async () => {
      const syncManager = getGlobalSync()
      if (syncManager) {
        try {
          const status = await syncManager.getSyncStatus()
          setSyncStatus(status)
        } catch (error) {
          console.error('Failed to get sync status:', error)
        }
      }
    }

    // Update status every 10 seconds
    const interval = setInterval(updateStatus, 10000)
    
    return () => clearInterval(interval)
  }, [isInitialized])

  return (
    <>
      {children}
      
      {/* Sync Status Indicator */}
      {isInitialized && syncStatus && (
        <div className="fixed top-4 right-4 z-50">
          <SyncStatusIndicator status={syncStatus} />
        </div>
      )}
      
      {/* Sync Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
          <span>Sync Error: {error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

interface SyncStatusIndicatorProps {
  status: SyncStatus
}

function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = () => {
    if (status.syncInProgress) return 'bg-yellow-500'
    // For local development, treat as online if primary domain is localhost
    const isLocalDev = status.isOnline || (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    if (!isLocalDev || status.errors.length > 0) return 'bg-red-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (status.syncInProgress) return 'Syncing...'
    // For local development, treat as online if primary domain is localhost
    const isLocalDev = status.isOnline || (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    if (!isLocalDev) return 'Offline'
    if (status.errors.length > 0) return 'Sync Error'
    return 'Online'
  }

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${getStatusColor()} text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2`}
      >
        <div className={`w-2 h-2 rounded-full bg-white ${status.syncInProgress ? 'animate-pulse' : ''}`} />
        <span>{getStatusText()}</span>
      </button>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border p-4 min-w-80 z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Sync Status</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700">
                {status.isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last sync: {new Date(status.lastSync).toLocaleString()}
            </div>
          </div>

          {/* Data Types Status */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tenders:</span>
              <span className="font-medium">{status.dataTypes.tenders.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Users:</span>
              <span className="font-medium">{status.dataTypes.users.count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Files:</span>
              <span className="font-medium">
                {status.dataTypes.files.count} ({(status.dataTypes.files.totalSize / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
          </div>

          {/* Errors */}
          {status.errors.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-red-600 mb-1">Errors:</div>
              <div className="space-y-1">
                {status.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <SyncActionButton action="sync" />
            <SyncActionButton action="reset" />
          </div>
        </div>
      )}
    </div>
  )
}

interface SyncActionButtonProps {
  action: 'sync' | 'reset'
}

function SyncActionButton({ action }: SyncActionButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    const syncManager = getGlobalSync()
    
    if (syncManager) {
      try {
        if (action === 'sync') {
          await syncManager.forceSyncNow()
        } else {
          await syncManager.resetAndResync()
        }
      } catch (error) {
        console.error(`Failed to ${action}:`, error)
      }
    }
    
    setLoading(false)
  }

  const buttonText = action === 'sync' ? 'Sync Now' : 'Reset & Sync'
  const buttonColor = action === 'sync' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={`${buttonColor} text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200 disabled:opacity-50`}
    >
      {loading ? 'Working...' : buttonText}
    </button>
  )
}