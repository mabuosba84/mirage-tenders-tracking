'use client'

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Server, Database, CheckCircle, XCircle } from 'lucide-react'
import { loadTendersFromStorage, loadUsersFromStorage } from '@/utils/centralStorage'

interface SimpleSyncStatus {
  online: boolean
  lastSync: string
  syncInProgress: boolean
  tenderCount: number
  userCount: number
}

export default function SimpleSyncIndicator() {
  const [status, setStatus] = useState<SimpleSyncStatus>({
    online: true, // Always show online for localhost
    lastSync: 'Never',
    syncInProgress: false,
    tenderCount: 0,
    userCount: 0
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Simple status check
    const updateStatus = async () => {
      try {
        const tenders = await loadTendersFromStorage() || []
        const users = await loadUsersFromStorage() || []
        
        setStatus(prev => ({
          ...prev,
          online: true, // Always online for localhost
          tenderCount: tenders.length,
          userCount: users.length,
          lastSync: new Date().toLocaleTimeString()
        }))
      } catch (error) {
        console.error('Status update error:', error)
      }
    }

    // Update immediately
    updateStatus()

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleManualSync = async () => {
    setStatus(prev => ({ ...prev, syncInProgress: true }))
    
    try {
      // Test API connectivity
      const response = await fetch('/api/sync')
      if (response.ok) {
        setStatus(prev => ({ 
          ...prev, 
          syncInProgress: false, 
          lastSync: new Date().toLocaleTimeString(),
          online: true 
        }))
      }
    } catch (error) {
      console.error('Sync error:', error)
      setStatus(prev => ({ ...prev, syncInProgress: false }))
    }
  }

  const getStatusColor = () => {
    if (status.syncInProgress) return 'bg-yellow-500'
    if (!status.online) return 'bg-red-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (status.syncInProgress) return 'Syncing...'
    if (!status.online) return 'Offline'
    return 'Online'
  }

  return (
    <div className="fixed top-4 right-4 z-50">
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
                <div className={`w-3 h-3 rounded-full ${status.online ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">
                  {status.online ? 'Connected (localhost)' : 'Disconnected'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last sync: {status.lastSync}
              </div>
            </div>

            {/* Data Summary */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tenders:</span>
                <span className="font-medium">{status.tenderCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Users:</span>
                <span className="font-medium">{status.userCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Files:</span>
                <span className="font-medium">Available</span>
              </div>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={status.syncInProgress}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200 disabled:opacity-50"
            >
              {status.syncInProgress ? 'Syncing...' : 'Sync Now'}
            </button>

            <div className="mt-2 text-xs text-gray-500 text-center">
              Ready for team deployment
            </div>
          </div>
        )}
      </div>
    </div>
  )
}