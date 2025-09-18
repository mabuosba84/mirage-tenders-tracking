'use client'

import { useState, useEffect } from 'react'
import { User, Lead } from '@/types'
import { calculateResponseTime } from '@/utils/dateCalculations'
import { loadTendersFromStorage, saveTendersToStorage } from '@/utils/centralStorage'
import { syncDataAcrossDomains } from '@/utils/centralStorage'
import { createNetworkSync, getNetworkSync, defaultSyncConfig, NetworkSyncManager } from '@/utils/networkSync'
import AutoSyncManager from '@/utils/autoSyncManager'
import Header from './Header'
import TenderForm from './TenderForm'
import TenderList from './TenderList'
import TenderSearch from './TenderSearch'
import Statistics from './Statistics'
import Reports from './Reports'
import UserManagement from './UserManagement'
import TenderPreview from './TenderPreview'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [tenders, setTenders] = useState<Lead[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'list' | 'search' | 'reports' | 'users'>('overview')
  const [editingTender, setEditingTender] = useState<Lead | null>(null)
  const [viewingTender, setViewingTender] = useState<Lead | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [networkSync, setNetworkSync] = useState<NetworkSyncManager | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('Initializing...')

  // Initialize network synchronization and auto-sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const sync = createNetworkSync(defaultSyncConfig)
    setNetworkSync(sync)
    
    // Start automatic synchronization
    sync.startAutoSync()
    
    // Initialize comprehensive auto-sync manager
    console.log('🚀 Dashboard: Starting comprehensive auto-sync system...')
    
    // Trigger automatic sync on page load/refresh (silent background sync)
    const performInitialSync = async () => {
      try {
        console.log('🔄 Performing automatic sync on page load...')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second for components to initialize
        await triggerAutoSync()
      } catch (error) {
        console.error('❌ Initial auto-sync failed:', error)
      }
    }
    
    performInitialSync()
    
    // Listen for network sync events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'network-sync') {
        console.log('Network sync detected, reloading data...')
        loadTenders() // Reload data when sync occurs
        setSyncStatus('Synchronized')
        setTimeout(() => setSyncStatus('Auto-sync active'), 2000)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Update sync status
    const updateStatus = () => {
      const status = sync.getStatus()
      if (!status.isOnline) {
        setSyncStatus('Offline')
      } else if (status.isRunning) {
        setSyncStatus('Auto-sync active')
      } else {
        setSyncStatus('Sync paused')
      }
    }
    
    updateStatus()
    const statusInterval = setInterval(updateStatus, 5000)
    
    return () => {
      sync.stopAutoSync()
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(statusInterval)
    }
  }, [])

  // Manual network sync
  const handleManualNetworkSync = async () => {
    if (!networkSync) return
    
    setSyncStatus('Syncing...')
    setSaveMessage('Uploading local data to network...')
    
    try {
      console.log('=== Manual Network Sync Started ===')
      const result = await networkSync.manualSync()
      
      if (result.success) {
        setSyncStatus('Sync completed!')
        setSaveMessage('Network synchronization completed successfully!')
        await loadTenders() // Reload data
        setTimeout(() => {
          setSyncStatus('Auto-sync active')
          setSaveMessage(null)
        }, 3000)
      } else {
        setSyncStatus('Sync failed')
        setSaveMessage(`Sync failed: ${result.error || result.message}`)
        setTimeout(() => {
          setSyncStatus('Auto-sync active')
          setSaveMessage(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Manual network sync error:', error)
      setSyncStatus('Sync failed')
      setSaveMessage(`Sync error: ${error}`)
      setTimeout(() => {
        setSyncStatus('Auto-sync active')
        setSaveMessage(null)
      }, 5000)
    }
  }

  // Manual network sync
  const handleManualNetworkSyncOld = async () => {
    if (!networkSync) return
    
    setSyncStatus('Syncing...')
    const result = await networkSync.manualSync()
    
    if (result.success) {
      setSyncStatus('Sync completed!')
      setSaveMessage('Network synchronization completed successfully!')
      loadTenders() // Reload data
      setTimeout(() => {
        setSyncStatus('Auto-sync active')
        setSaveMessage(null)
      }, 3000)
    } else {
      setSyncStatus('Sync failed')
      setSaveMessage(`Sync failed: ${result.error || result.message}`)
      setTimeout(() => {
        setSyncStatus('Auto-sync active')
        setSaveMessage(null)
      }, 5000)
    }
  }

  // Debug: Log tenders state changes
  useEffect(() => {
    console.log('Tenders state updated:', tenders.length, 'tenders')
    if (tenders.length > 0) {
      console.log('Sample tender:', tenders[0].customerName)
    }
  }, [tenders])

  // Load tenders from centralized storage
  const loadTenders = async () => {
    try {
      console.log('Loading tenders from centralized storage...')
      const savedTenders = await loadTendersFromStorage()
      console.log('Loaded tenders from central storage:', savedTenders ? savedTenders.length : 0)
      
      if (savedTenders && savedTenders.length > 0) {
        // Convert date strings back to Date objects and migrate category format
        const tendersWithDates = savedTenders.map((tender: any, index: number) => {
          try {
            console.log(`Processing tender ${index + 1}:`, tender.customerName)
            
            // Migrate category from string to array if needed
            let categories = tender.category
            if (typeof categories === 'string') {
              categories = [categories]
              console.log(`Migrated category for tender ${index + 1} from string to array:`, categories)
            } else if (!Array.isArray(categories)) {
              categories = ['PSG'] // Default fallback
              console.log(`Invalid category format for tender ${index + 1}, defaulting to PSG`)
            }
            
            return {
              ...tender,
              category: categories,
              items: tender.items || [], // Ensure items is always an array
              tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
              requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
              submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
              dateOfPriceRequestToVendor: tender.dateOfPriceRequestToVendor ? new Date(tender.dateOfPriceRequestToVendor) : null,
              dateOfPriceReceivedFromVendor: tender.dateOfPriceReceivedFromVendor ? new Date(tender.dateOfPriceReceivedFromVendor) : null,
              bankGuaranteeIssueDate: tender.bankGuaranteeIssueDate ? new Date(tender.bankGuaranteeIssueDate) : null,
              bankGuaranteeExpiryDate: tender.bankGuaranteeExpiryDate ? new Date(tender.bankGuaranteeExpiryDate) : null,
              createdAt: new Date(tender.createdAt),
              updatedAt: new Date(tender.updatedAt),
              lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null,
              attachments: tender.attachments?.map((att: any) => ({
                ...att,
                uploadedAt: new Date(att.uploadedAt)
              })) || []
            }
          } catch (dateError) {
            console.error(`Error processing dates for tender ${index + 1}:`, dateError)
            // Return tender with original date strings if date parsing fails
            return tender
          }
        })
        console.log('Setting tenders with dates:', tendersWithDates.length)
        console.log('First tender after processing:', tendersWithDates[0])
        setTenders(tendersWithDates)
      } else {
        console.log('No saved tenders found, starting with empty array')
        setTenders([])
      }
    } catch (error) {
      console.error('Error loading tenders from centralized storage:', error)
      // Fallback to empty array if there's an error
      setTenders([])
    }
  }

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await loadTenders()
      
      // Force network sync after initial load to upload local data
      if (networkSync) {
        console.log('=== Forcing initial network sync after data load ===')
        try {
          await networkSync.manualSync()
          console.log('=== Initial network sync completed ===')
        } catch (error) {
          console.error('Initial network sync failed:', error)
        }
      }
    }
    
    initializeData()
  }, [networkSync])

  // Helper function to save tenders to centralized storage
  const saveTendersLocal = async (tendersToSave: Lead[]) => {
    try {
      console.log('Saving tenders to centralized storage:', tendersToSave.length)
      await saveTendersToStorage(tendersToSave)
      console.log('Tenders saved successfully to central storage')
      // Show save confirmation
      setSaveMessage('Data saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving tenders to centralized storage:', error)
      setSaveMessage('Error saving data!')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // Debug function to manually trigger sync
  const handleManualSync = async () => {
    try {
      console.log('=== MANUAL SYNC STARTED ===')
      
      // First, check what's in localStorage before sync
      const currentLocalData = localStorage.getItem('mirage_tenders')
      console.log('Current localStorage tenders:', currentLocalData ? JSON.parse(currentLocalData).length : 0)
      
      if (currentLocalData) {
        console.log('Sample localStorage tender:', JSON.parse(currentLocalData)[0]?.customerName)
      }
      
      // Check URL parameters for shared data first
      const urlParams = new URLSearchParams(window.location.search)
      const sharedData = urlParams.get('syncData')
      
      if (sharedData) {
        try {
          console.log('Found shared data in URL, importing...')
          const decodedJsonString = base64ToUtf8(sharedData)
          const decodedData = JSON.parse(decodedJsonString)
          if (decodedData.tenders && Array.isArray(decodedData.tenders)) {
            // Import the shared data
            const tendersWithDates = decodedData.tenders.map((tender: any) => ({
              ...tender,
              tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
              requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
              submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
              dateOfPriceRequestToVendor: tender.dateOfPriceRequestToVendor ? new Date(tender.dateOfPriceRequestToVendor) : null,
              dateOfPriceReceivedFromVendor: tender.dateOfPriceReceivedFromVendor ? new Date(tender.dateOfPriceReceivedFromVendor) : null,
              bankGuaranteeIssueDate: tender.bankGuaranteeIssueDate ? new Date(tender.bankGuaranteeIssueDate) : null,
              bankGuaranteeExpiryDate: tender.bankGuaranteeExpiryDate ? new Date(tender.bankGuaranteeExpiryDate) : null,
              createdAt: new Date(tender.createdAt),
              updatedAt: new Date(tender.updatedAt),
              lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null,
              attachments: tender.attachments?.map((att: any) => ({
                ...att,
                uploadedAt: new Date(att.uploadedAt)
              })) || []
            }))
            
            // Save to both localStorage and IndexedDB
            localStorage.setItem('mirage_tenders', JSON.stringify(tendersWithDates))
            await saveTendersToStorage(tendersWithDates)
            
            setTenders(tendersWithDates)
            setSaveMessage(`Imported ${tendersWithDates.length} tenders from URL!`)
            
            // Clean up URL
            const cleanUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
            
            setTimeout(() => setSaveMessage(null), 5000)
            return
          }
        } catch (urlError) {
          console.error('Error importing from URL:', urlError)
        }
      }
      
      // If no URL data, proceed with normal sync
      await syncDataAcrossDomains()
      
      // Check what's in localStorage after sync
      const afterSyncLocalData = localStorage.getItem('mirage_tenders')
      console.log('After sync localStorage tenders:', afterSyncLocalData ? JSON.parse(afterSyncLocalData).length : 0)
      
      // Reload data from central storage
      const syncedTenders = await loadTendersFromStorage()
      console.log('Loaded from central storage:', syncedTenders ? syncedTenders.length : 0)
      
      if (syncedTenders && syncedTenders.length > 0) {
        console.log('Sample central storage tender:', syncedTenders[0]?.customerName)
        
        // Convert dates properly
        const tendersWithDates = syncedTenders.map((tender: any) => ({
          ...tender,
          tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
          requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
          submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
          dateOfPriceRequestToVendor: tender.dateOfPriceRequestToVendor ? new Date(tender.dateOfPriceRequestToVendor) : null,
          dateOfPriceReceivedFromVendor: tender.dateOfPriceReceivedFromVendor ? new Date(tender.dateOfPriceReceivedFromVendor) : null,
          bankGuaranteeIssueDate: tender.bankGuaranteeIssueDate ? new Date(tender.bankGuaranteeIssueDate) : null,
          bankGuaranteeExpiryDate: tender.bankGuaranteeExpiryDate ? new Date(tender.bankGuaranteeExpiryDate) : null,
          createdAt: new Date(tender.createdAt),
          updatedAt: new Date(tender.updatedAt),
          lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null,
          attachments: tender.attachments?.map((att: any) => ({
            ...att,
            uploadedAt: new Date(att.uploadedAt)
          })) || []
        }))
        
        console.log('Setting tenders in state:', tendersWithDates.length)
        setTenders(tendersWithDates)
        setSaveMessage(`Sync completed! Loaded ${tendersWithDates.length} tenders.`)
      } else {
        console.log('No tenders found in central storage')
        setSaveMessage('Sync completed but no data found!')
      }
      
      setTimeout(() => setSaveMessage(null), 5000)
      console.log('=== MANUAL SYNC COMPLETED ===')
    } catch (error) {
      console.error('Manual sync failed:', error)
      setSaveMessage('Sync failed! Check console for details.')
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  // Trigger automatic sync (runs in background without user interaction)
  const triggerAutoSync = async () => {
    setSyncStatus('Refreshing...')
    setSaveMessage('Fetching latest data from server...')
    
    try {
      console.log('🔄 Force refreshing data from server...')
      
      // Get fresh data from server
      const response = await fetch('/api/sync', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const serverData = await response.json()
        
        // Check if serverData has tenders (API returns tenders directly, not nested under data)
        if (serverData?.tenders) {
          console.log('📥 Retrieved fresh server data:', serverData.tenders.length, 'tenders')
          
          // Update local storage with fresh server data
          if (serverData.tenders.length > 0) {
            localStorage.setItem('mirage_tenders', JSON.stringify(serverData.tenders))
            await saveTendersToStorage(serverData.tenders)
            console.log('✅ Local storage updated with fresh data')
            
            // Reload the tenders in the UI
            await loadTenders()
          }
        } else {
          console.log('⚠️ No tenders data received from server')
        }
        
        setSyncStatus('Refreshed!')
        setSaveMessage('Data refreshed successfully!')
        
        setTimeout(() => {
          setSyncStatus('Auto-sync active')
          setSaveMessage(null)
        }, 3000)
      } else {
        throw new Error(`Server responded with ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error)
      setSyncStatus('Refresh failed')
      setSaveMessage('Failed to refresh data from server')
      
      setTimeout(() => {
        setSyncStatus('Auto-sync active')
        setSaveMessage(null)
      }, 5000)
    }
  }

  // UTF-8 safe base64 encoding
  const utf8ToBase64 = (str: string) => {
    try {
      // First encode to UTF-8 bytes, then to base64
      const utf8Bytes = new TextEncoder().encode(str)
      const binaryString = Array.from(utf8Bytes).map(byte => String.fromCharCode(byte)).join('')
      return btoa(binaryString)
    } catch (error) {
      // Fallback: use encodeURIComponent for URL encoding
      return encodeURIComponent(str)
    }
  }

  // UTF-8 safe base64 decoding
  const base64ToUtf8 = (str: string) => {
    try {
      // First check if it's URL encoded (fallback method)
      if (str.includes('%')) {
        return decodeURIComponent(str)
      }
      // Decode from base64 to binary string, then to UTF-8
      const binaryString = atob(str)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    } catch (error) {
      // Final fallback: try direct atob
      return atob(str)
    }
  }

  // Generate share URL for cross-domain sync
  const generateShareUrl = () => {
    try {
      const dataToShare = {
        tenders: tenders,
        exportDate: new Date().toISOString()
      }
      const jsonString = JSON.stringify(dataToShare)
      const encodedData = utf8ToBase64(jsonString)
      const currentUrl = window.location.origin + window.location.pathname
      const shareUrl = `${currentUrl}?syncData=${encodedData}`
      
      // Try clipboard first, fallback to prompt
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setSaveMessage('Share URL copied to clipboard! Open this URL on the other domain.')
          setTimeout(() => setSaveMessage(null), 5000)
        }).catch(() => {
          // Fallback to prompt
          showUrlPrompt(shareUrl)
        })
      } else {
        // Direct fallback to prompt
        showUrlPrompt(shareUrl)
      }
    } catch (error) {
      console.error('Error generating share URL:', error)
      setSaveMessage('Error generating share URL!')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // Helper function to show URL in prompt
  const showUrlPrompt = (shareUrl: string) => {
    const userAction = prompt(
      'Copy this URL and open it on the other domain (172.18.0.1:3001 or localhost:3001):', 
      shareUrl
    )
    if (userAction !== null) {
      setSaveMessage('Share URL ready! Open the copied URL on the other domain.')
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  const handleAddTender = async (newTender: Lead) => {
    console.log('Adding new tender:', newTender.customerName)
    const updatedTenders = [newTender, ...tenders]
    console.log('Updated tenders count:', updatedTenders.length)
    setTenders(updatedTenders)
    await saveTendersLocal(updatedTenders)
    setActiveTab('list')
    
    // Trigger automatic sync after adding tender
    setTimeout(async () => {
      try {
        console.log('🔄 Auto-sync triggered after adding tender')
        await triggerAutoSync()
      } catch (error) {
        console.error('❌ Auto-sync failed after adding tender:', error)
      }
    }, 500)
  }

  const handleEditTender = (tender: Lead) => {
    setEditingTender(tender)
    setActiveTab('add')
  }

  const handleUpdateTender = async (updatedTender: Lead) => {
    const updatedTenders = tenders.map(t => t.id === updatedTender.id ? updatedTender : t)
    setTenders(updatedTenders)
    await saveTendersLocal(updatedTenders)
    setEditingTender(null)
    setActiveTab('list')
    
    // Trigger automatic sync after updating tender
    setTimeout(async () => {
      try {
        console.log('🔄 Auto-sync triggered after updating tender')
        await triggerAutoSync()
      } catch (error) {
        console.error('❌ Auto-sync failed after updating tender:', error)
      }
    }, 500)
  }

  const handleDeleteTender = async (tenderId: string) => {
    const updatedTenders = tenders.filter(t => t.id !== tenderId)
    setTenders(updatedTenders)
    await saveTendersLocal(updatedTenders)
    
    // Trigger automatic sync after deleting tender
    setTimeout(async () => {
      try {
        console.log('🔄 Auto-sync triggered after deleting tender')
        await triggerAutoSync()
      } catch (error) {
        console.error('❌ Auto-sync failed after deleting tender:', error)
      }
    }, 500)
  }

  const handleViewTenderDetails = (tender: Lead) => {
    setViewingTender(tender)
  }

  const handleCloseTenderPreview = () => {
    setViewingTender(null)
  }

  // Backup and restore functions for data management
  const exportData = () => {
    try {
      const dataToExport = {
        tenders: tenders,
        exportDate: new Date().toISOString(),
        exportedBy: user.name,
        version: '1.0'
      }
      const dataStr = JSON.stringify(dataToExport, null, 2)
      
      // Use data URI instead of blob URL for better security
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const link = document.createElement('a')
      link.href = dataUri
      link.download = `mirage_tenders_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data. Please try again.')
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)
        
        if (importedData.tenders && Array.isArray(importedData.tenders)) {
          // Convert date strings back to Date objects
          const tendersWithDates = importedData.tenders.map((tender: any) => ({
            ...tender,
            tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
            requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
            submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
            dateOfPriceRequestToVendor: tender.dateOfPriceRequestToVendor ? new Date(tender.dateOfPriceRequestToVendor) : null,
            dateOfPriceReceivedFromVendor: tender.dateOfPriceReceivedFromVendor ? new Date(tender.dateOfPriceReceivedFromVendor) : null,
            createdAt: new Date(tender.createdAt),
            updatedAt: new Date(tender.updatedAt),
            lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null
          }))
          
          setTenders(tendersWithDates)
          saveTendersLocal(tendersWithDates)
          alert(`Successfully imported ${tendersWithDates.length} tenders!`)
        } else {
          alert('Invalid file format. Please select a valid backup file.')
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Error importing data. Please check the file format and try again.')
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Statistics tenders={tenders} user={user} />
            {/* Data Management Panel */}
            <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
                <div className="text-sm text-gray-600 flex items-center">
                  <div className={`h-2 w-2 rounded-full mr-2 ${
                    syncStatus === 'Auto-sync active' ? 'bg-green-500' :
                    syncStatus === 'Syncing...' ? 'bg-yellow-500 animate-pulse' :
                    syncStatus === 'Sync completed!' ? 'bg-green-500' :
                    syncStatus === 'Sync failed' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span>Network: {syncStatus}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Data</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer focus-within:ring-2 focus-within:ring-green-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Import Data</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={handleManualSync}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Data</span>
                </button>
                
                <button
                  onClick={handleManualNetworkSync}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <span>Force Network Sync</span>
                </button>
                
                <button
                  onClick={generateShareUrl}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Share to Other Domain</span>
                </button>
                
                <div className="text-sm text-gray-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export your data for backup or import from a previous backup file
                </div>
              </div>
            </div>
          </>
        )
      case 'add':
        return (
          <TenderForm
            user={user}
            tender={editingTender}
            onSubmit={editingTender ? handleUpdateTender : handleAddTender}
            onCancel={() => {
              setEditingTender(null)
              setActiveTab('overview')
            }}
          />
        )
      case 'list':
        return (
          <TenderList
            tenders={tenders}
            currentUser={user}
            onEdit={handleEditTender}
            onDelete={handleDeleteTender}
            onViewDetails={handleViewTenderDetails}
          />
        )
      case 'search':
        return (
          <TenderSearch
            tenders={tenders}
            user={user}
            onViewDetails={handleViewTenderDetails}
          />
        )
      case 'reports':
        return <Reports tenders={tenders} user={user} />
      case 'users':
        return user.role === 'admin' ? <UserManagement currentUser={user} onAutoSync={triggerAutoSync} /> : <Statistics tenders={tenders} user={user} />
      default:
        return <Statistics tenders={tenders} user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Save Message Notification */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          {saveMessage}
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Tender Preview Modal */}
      {viewingTender && (
        <TenderPreview
          tender={viewingTender}
          user={user}
          onClose={handleCloseTenderPreview}
        />
      )}
    </div>
  )
}
