'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DataDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isExpanded, setIsExpanded] = useState(false)

  const checkLocalStorage = () => {
    try {
      const info: any = {
        timestamp: new Date().toLocaleString(),
        localStorageAvailable: typeof localStorage !== 'undefined',
        keys: [],
        tenderData: null,
        tenderCount: 0,
        userData: null
      }

      if (typeof localStorage !== 'undefined') {
        // Get all keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) info.keys.push(key)
        }

        // Check tender data
        const tendersData = localStorage.getItem('mirage_tenders')
        if (tendersData) {
          try {
            const parsed = JSON.parse(tendersData)
            info.tenderData = 'Valid JSON'
            info.tenderCount = Array.isArray(parsed) ? parsed.length : 'Not an array'
            info.sampleTender = parsed[0] ? {
              id: parsed[0].id,
              customerName: parsed[0].customerName,
              createdAt: parsed[0].createdAt
            } : null
          } catch (e) {
            info.tenderData = `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`
          }
        } else {
          info.tenderData = 'No data found'
        }

        // Check user data
        const userData = localStorage.getItem('currentUser')
        if (userData) {
          try {
            const user = JSON.parse(userData)
            info.userData = {
              username: user.username,
              role: user.role
            }
          } catch (e) {
            info.userData = 'Parse error'
          }
        }
      }

      setDebugInfo(info)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  useEffect(() => {
    checkLocalStorage()
  }, [])

  const clearTenderData = () => {
    if (confirm('Are you sure you want to clear all tender data? This action cannot be undone.')) {
      localStorage.removeItem('mirage_tenders')
      checkLocalStorage()
      window.location.reload()
    }
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data including users? This will log you out.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow-lg"
          title="Data Debug Panel"
        >
          <Database className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Data Debug Panel
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <button
            onClick={checkLocalStorage}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="border-t pt-2">
          <div className="flex items-center space-x-2">
            {debugInfo.localStorageAvailable ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span>localStorage: {debugInfo.localStorageAvailable ? 'Available' : 'Not Available'}</span>
          </div>
        </div>

        <div>
          <strong>Keys:</strong> {debugInfo.keys?.length || 0}
          <div className="text-xs text-gray-600">
            {debugInfo.keys?.join(', ') || 'None'}
          </div>
        </div>

        <div>
          <strong>Tender Data:</strong> {debugInfo.tenderData}
          <div className="text-xs text-gray-600">
            Count: {debugInfo.tenderCount}
          </div>
          {debugInfo.sampleTender && (
            <div className="text-xs text-gray-600">
              Latest: {debugInfo.sampleTender.customerName} (ID: {debugInfo.sampleTender.id?.substring(0, 8)}...)
            </div>
          )}
        </div>

        <div>
          <strong>Current User:</strong> {debugInfo.userData?.username || 'None'}
          {debugInfo.userData && (
            <div className="text-xs text-gray-600">
              Role: {debugInfo.userData.role}
            </div>
          )}
        </div>

        <div className="border-t pt-2 space-y-2">
          <button
            onClick={clearTenderData}
            className="w-full px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
          >
            Clear Tender Data
          </button>
          <button
            onClick={clearAllData}
            className="w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Clear All Data
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Last checked: {debugInfo.timestamp}
        </div>
      </div>
    </div>
  )
}
