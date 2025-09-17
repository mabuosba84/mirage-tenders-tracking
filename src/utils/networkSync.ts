// Network synchronization utilities
export interface NetworkSyncConfig {
  serverUrl: string
  syncInterval: number // milliseconds
  enabled: boolean
}

export interface SyncResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

export class NetworkSyncManager {
  private config: NetworkSyncConfig
  private syncTimer: NodeJS.Timeout | null = null
  private isOnline: boolean = true
  private isBrowser: boolean = false

  constructor(config: NetworkSyncConfig) {
    this.config = config
    this.isBrowser = typeof window !== 'undefined'
    this.initializeNetworkDetection()
  }

  private initializeNetworkDetection() {
    if (this.isBrowser) {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        console.log('Network sync: Back online, resuming sync')
        this.startAutoSync()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
        console.log('Network sync: Offline, pausing sync')
        this.stopAutoSync()
      })
    }
  }

  // Start automatic synchronization
  startAutoSync() {
    if (!this.config.enabled || !this.isOnline || !this.isBrowser) return
    
    this.stopAutoSync() // Clear any existing timer
    
    console.log(`Network sync: Starting auto-sync every ${this.config.syncInterval / 1000}s`)
    
    // Initial sync
    this.performSync()
    
    // Set up recurring sync
    this.syncTimer = setInterval(() => {
      this.performSync()
    }, this.config.syncInterval)
  }

  // Stop automatic synchronization
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('Network sync: Auto-sync stopped')
    }
  }

  // Manual synchronization
  async manualSync(): Promise<SyncResult> {
    return this.performSync()
  }

  // Core synchronization logic
  private async performSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        message: 'Cannot sync: offline',
        error: 'No network connection'
      }
    }

    try {
      // Get local data
      const localTenders = this.getLocalTenders()
      const localUsers = this.getLocalUsers()
      
      // Get server data
      const serverData = await this.fetchServerData()
      
      if (serverData.success) {
        // Compare and merge data
        const mergeResult = await this.mergeData(localTenders, localUsers, serverData.data)
        
        if (mergeResult.success) {
          // Update local storage with merged data
          this.updateLocalStorage(mergeResult.data)
          
          // Update server with latest data
          await this.updateServerData(mergeResult.data)
          
          console.log('Network sync: Sync completed successfully')
          return {
            success: true,
            message: 'Synchronization completed',
            data: mergeResult.data
          }
        }
      }
      
      // If server sync fails, try to upload local data
      const uploadResult = await this.uploadLocalData(localTenders, localUsers)
      return uploadResult
      
    } catch (error) {
      console.error('Network sync error:', error)
      return {
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Fetch data from server
  private async fetchServerData(): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/sync`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result }
      }
      
      return { success: false }
    } catch (error) {
      console.error('Failed to fetch server data:', error)
      return { success: false }
    }
  }

  // Upload data to server
  private async updateServerData(data: any): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenders: data.tenders,
          users: data.users,
          source: `${window.location.host}-${Date.now()}`
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          message: result.message
        }
      }
      
      throw new Error(`Server responded with status: ${response.status}`)
    } catch (error) {
      console.error('Failed to update server data:', error)
      return {
        success: false,
        message: 'Failed to update server',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Upload local data when server is empty
  private async uploadLocalData(tenders: any[], users: any[]): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.config.serverUrl}/api/sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'merge',
          data: { tenders, users }
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          message: `Local data uploaded: ${result.count?.tenders || 0} tenders, ${result.count?.users || 0} users`
        }
      }
      
      throw new Error(`Upload failed with status: ${response.status}`)
    } catch (error) {
      console.error('Failed to upload local data:', error)
      return {
        success: false,
        message: 'Failed to upload local data',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Merge local and server data intelligently
  private async mergeData(localTenders: any[], localUsers: any[], serverData: any): Promise<{ success: boolean; data?: any }> {
    try {
      // Ensure serverData exists and has the expected structure
      if (!serverData || typeof serverData !== 'object') {
        console.warn('Network sync: Invalid server data, using local data only')
        return {
          success: true,
          data: {
            tenders: localTenders || [],
            users: localUsers || []
          }
        }
      }

      const serverTenders = serverData.tenders || []
      const serverUsers = serverData.users || []
      
      // Merge tenders
      const mergedTenders = [...serverTenders]
      localTenders.forEach(localTender => {
        const existingIndex = mergedTenders.findIndex(t => t.id === localTender.id)
        if (existingIndex >= 0) {
          // Keep the newer version
          const existing = mergedTenders[existingIndex]
          if (new Date(localTender.updatedAt) > new Date(existing.updatedAt)) {
            mergedTenders[existingIndex] = localTender
          }
        } else {
          // Add new tender
          mergedTenders.push(localTender)
        }
      })
      
      // Merge users
      const mergedUsers = [...serverUsers]
      localUsers.forEach(localUser => {
        const exists = mergedUsers.find(u => u.id === localUser.id)
        if (!exists) {
          mergedUsers.push(localUser)
        }
      })
      
      return {
        success: true,
        data: {
          tenders: mergedTenders,
          users: mergedUsers,
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Data merge failed:', error)
      return { success: false }
    }
  }

  // Get local tender data
  private getLocalTenders(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      // Try multiple possible keys
      const keys = ['mirage_tenders', 'tenders']
      for (const key of keys) {
        const data = localStorage.getItem(key)
        if (data) {
          console.log(`NetworkSync: Found tenders in localStorage key: ${key}`)
          const parsed = JSON.parse(data)
          console.log(`NetworkSync: Found ${parsed.length} tenders in ${key}`)
          return parsed
        }
      }
      console.log('NetworkSync: No tenders found in localStorage')
      return []
    } catch (error) {
      console.error('Failed to get local tenders:', error)
      return []
    }
  }

  // Get local user data
  private getLocalUsers(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      // Try multiple possible keys
      const keys = ['mirage_users', 'users']
      for (const key of keys) {
        const data = localStorage.getItem(key)
        if (data) {
          console.log(`NetworkSync: Found users in localStorage key: ${key}`)
          const parsed = JSON.parse(data)
          console.log(`NetworkSync: Found ${parsed.length} users in ${key}`)
          return parsed
        }
      }
      console.log('NetworkSync: No users found in localStorage')
      return []
    } catch (error) {
      console.error('Failed to get local users:', error)
      return []
    }
  }

  // Update local storage with merged data
  private updateLocalStorage(data: any) {
    if (typeof window === 'undefined') return
    
    try {
      if (data.tenders) {
        // Update both possible keys to ensure compatibility
        localStorage.setItem('mirage_tenders', JSON.stringify(data.tenders))
        localStorage.setItem('tenders', JSON.stringify(data.tenders))
        console.log(`NetworkSync: Updated localStorage with ${data.tenders.length} tenders`)
      }
      if (data.users) {
        localStorage.setItem('mirage_users', JSON.stringify(data.users))
        localStorage.setItem('users', JSON.stringify(data.users))
        console.log(`NetworkSync: Updated localStorage with ${data.users.length} users`)
      }
      
      // Trigger storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'network-sync',
        newValue: JSON.stringify({ timestamp: Date.now() })
      }))
    } catch (error) {
      console.error('Failed to update local storage:', error)
    }
  }

  // Check sync status
  getStatus() {
    return {
      enabled: this.config.enabled,
      isOnline: this.isOnline,
      isRunning: this.syncTimer !== null,
      serverUrl: this.config.serverUrl
    }
  }
}

// Create singleton instance
let syncManager: NetworkSyncManager | null = null

export function createNetworkSync(config: NetworkSyncConfig): NetworkSyncManager {
  if (!syncManager) {
    syncManager = new NetworkSyncManager(config)
  }
  return syncManager
}

export function getNetworkSync(): NetworkSyncManager | null {
  return syncManager
}

// Default configuration
export const defaultSyncConfig: NetworkSyncConfig = {
  serverUrl: typeof window !== 'undefined' ? window.location.origin : '',
  syncInterval: 30000, // 30 seconds
  enabled: true
}
