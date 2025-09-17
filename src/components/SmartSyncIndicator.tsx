import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface SmartSyncIndicatorProps {
  onForceRefresh?: () => void
}

export default function SmartSyncIndicator({ onForceRefresh }: SmartSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing' | 'error'>('online')
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [isAutoSyncActive, setIsAutoSyncActive] = useState(true)
  const [syncDetails, setSyncDetails] = useState<string>('')

  useEffect(() => {
    // Listen for sync status updates from AutoSyncManager
    const handleSyncStatusUpdate = (event: CustomEvent) => {
      const { message, type, timestamp } = event.detail
      
      switch (type) {
        case 'success':
          setSyncStatus('online')
          setSyncDetails('All data synced')
          setLastSyncTime(new Date(timestamp).toLocaleTimeString())
          break
        case 'error':
          setSyncStatus('error')
          setSyncDetails(message || 'Sync failed')
          break
        case 'syncing':
          setSyncStatus('syncing')
          setSyncDetails('Syncing data...')
          break
      }
    }

    // Listen for network status
    const handleOnline = () => {
      setSyncStatus('online')
      setSyncDetails('Connection restored')
      setIsAutoSyncActive(true)
    }

    const handleOffline = () => {
      setSyncStatus('offline')
      setSyncDetails('No internet connection')
      setIsAutoSyncActive(false)
    }

    window.addEventListener('syncStatusUpdate', handleSyncStatusUpdate as EventListener)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial status check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('syncStatusUpdate', handleSyncStatusUpdate as EventListener)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleForceSync = () => {
    setSyncStatus('syncing')
    setSyncDetails('Force syncing...')
    
    // Call AutoSyncManager force sync if available
    if ((window as any).autoSync) {
      (window as any).autoSync.forceSync()
    }
    
    // Call parent force refresh if provided
    if (onForceRefresh) {
      onForceRefresh()
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-red-500'
      case 'syncing':
        return 'bg-blue-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case 'online':
        return 'Online'
      case 'offline':
        return 'Offline'
      case 'syncing':
        return 'Syncing'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Status indicator */}
      <div 
        className="group relative cursor-pointer"
        onClick={handleForceSync}
        title="Click to force sync"
      >
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-gray-200 hover:border-blue-300 transition-colors">
          {getStatusIcon()}
          <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Tooltip */}
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
          <div className="font-medium">Smart Auto-Sync Status</div>
          <div className="mt-1 text-gray-300">{syncDetails}</div>
          {lastSyncTime && (
            <div className="mt-1 text-gray-400">Last sync: {lastSyncTime}</div>
          )}
          <div className="mt-2 text-gray-400">
            • Auto-sync: {isAutoSyncActive ? 'Active' : 'Paused'}
          </div>
          <div className="text-gray-400">
            • Click to force sync all data
          </div>
        </div>
      </div>
    </div>
  )
}