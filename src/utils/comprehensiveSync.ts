// Enhanced network synchronization with file support
// import { NetworkSyncManager } from './networkSync'

// Temporary type definition until NetworkSyncManager is implemented
interface NetworkSyncManager {
  syncData: (data: any) => Promise<any>
  syncFiles: (files: File[]) => Promise<any>
}

export interface ComprehensiveSyncConfig {
  primaryDomain: string
  backupDomains: string[]
  syncInterval: number
  enableFileSync: boolean
  enableAutoSync: boolean
  maxFileSize: number
  allowedFileTypes: string[]
}

export interface SyncStatus {
  lastSync: string
  isOnline: boolean
  syncInProgress: boolean
  dataTypes: {
    tenders: { count: number, lastSync: string }
    users: { count: number, lastSync: string }
    files: { count: number, totalSize: number, lastSync: string }
    settings: { lastSync: string }
  }
  errors: string[]
}

export class ComprehensiveSyncManager {
  private config: ComprehensiveSyncConfig
  private networkSync: NetworkSyncManager | null = null
  private syncTimer: NodeJS.Timeout | null = null
  private isInitialized: boolean = false

  constructor(config: ComprehensiveSyncConfig) {
    this.config = config
    // NetworkSyncManager not implemented yet
    // this.networkSync = new NetworkSyncManager({
    //   serverUrl: config.primaryDomain,
    //   syncInterval: config.syncInterval,
    //   enabled: config.enableAutoSync
    // })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Start automatic sync if enabled
      if (this.config.enableAutoSync) {
        this.startAutoSync()
      }

      // Perform initial sync
      await this.performFullSync()
      
      this.isInitialized = true
      console.log('ComprehensiveSyncManager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize sync manager:', error)
      throw error
    }
  }

  async performFullSync(): Promise<SyncStatus> {
    console.log('Starting comprehensive sync...')
    
    const status: SyncStatus = {
      lastSync: new Date().toISOString(),
      isOnline: await this.checkConnectivity(),
      syncInProgress: true,
      dataTypes: {
        tenders: { count: 0, lastSync: '' },
        users: { count: 0, lastSync: '' },
        files: { count: 0, totalSize: 0, lastSync: '' },
        settings: { lastSync: '' }
      },
      errors: []
    }

    try {
      // 1. Sync main data (tenders, users, settings)
      await this.syncMainData(status)

      // 2. Sync files if enabled
      if (this.config.enableFileSync) {
        await this.syncFiles(status)
      }

      status.syncInProgress = false
      console.log('Comprehensive sync completed successfully')
      
    } catch (error) {
      status.syncInProgress = false
      status.errors.push(error instanceof Error ? error.message : 'Unknown sync error')
      console.error('Sync failed:', error)
    }

    return status
  }

  private async syncMainData(status: SyncStatus): Promise<void> {
    try {
      // Get local data
      const localData = await this.getLocalData()
      
      // Sync with primary domain
      const response = await fetch(`${this.config.primaryDomain}/api/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          data: localData
        })
      })

      if (response.ok) {
        const syncResult = await response.json()
        
        // Update local storage with merged data
        await this.updateLocalData(syncResult.data)
        
        status.dataTypes.tenders.count = syncResult.data?.tenders?.length || 0
        status.dataTypes.users.count = syncResult.data?.users?.length || 0
        status.dataTypes.tenders.lastSync = new Date().toISOString()
        status.dataTypes.users.lastSync = new Date().toISOString()
        status.dataTypes.settings.lastSync = new Date().toISOString()
        
      } else {
        throw new Error(`Data sync failed: ${response.status}`)
      }
    } catch (error) {
      status.errors.push(`Data sync error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async syncFiles(status: SyncStatus): Promise<void> {
    try {
      // Get list of local files
      const localFilesResponse = await fetch('/api/files/sync')
      const localFiles = localFilesResponse.ok ? await localFilesResponse.json() : { files: [] }

      // Sync files with primary domain
      const syncResponse = await fetch('/api/files/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: this.config.primaryDomain,
          direction: 'both', // Bi-directional sync
          fileIds: [] // Sync all files
        })
      })

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json()
        
        status.dataTypes.files.count = localFiles.files?.length || 0
        status.dataTypes.files.totalSize = localFiles.totalSize || 0
        status.dataTypes.files.lastSync = new Date().toISOString()
        
        console.log(`File sync completed: ${syncResult.summary?.successful || 0} successful, ${syncResult.summary?.failed || 0} failed`)
      } else {
        throw new Error(`File sync failed: ${syncResponse.status}`)
      }
    } catch (error) {
      status.errors.push(`File sync error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getLocalData(): Promise<any> {
    if (typeof window !== 'undefined') {
      // Browser environment - get from localStorage
      return {
        tenders: JSON.parse(localStorage.getItem('mirage_central_tenders') || '[]'),
        users: JSON.parse(localStorage.getItem('mirage_central_users') || '[]'),
        settings: JSON.parse(localStorage.getItem('mirage_central_settings') || '{}')
      }
    } else {
      // Server environment - get from network storage
      const response = await fetch('/api/sync')
      return response.ok ? await response.json() : { tenders: [], users: [], settings: {} }
    }
  }

  private async updateLocalData(data: any): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment - update localStorage
      if (data.tenders) localStorage.setItem('mirage_central_tenders', JSON.stringify(data.tenders))
      if (data.users) localStorage.setItem('mirage_central_users', JSON.stringify(data.users))
      if (data.settings) localStorage.setItem('mirage_central_settings', JSON.stringify(data.settings))
    }
    // Server-side storage is automatically updated by the sync API
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.primaryDomain}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch (error) {
      // For local development with single server, consider it online if it's the same domain
      if (this.config.primaryDomain.includes('localhost:3000') && typeof window !== 'undefined') {
        return window.location.origin === this.config.primaryDomain
      }
      return false
    }
  }

  startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.performFullSync()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }, this.config.syncInterval)

    console.log(`Auto-sync started with ${this.config.syncInterval}ms interval`)
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('Auto-sync stopped')
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const isOnline = await this.checkConnectivity()
    const localData = await this.getLocalData()
    
    // For local development, consider online if we're on localhost
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const effectiveOnlineStatus = isOnline || isLocalhost
    
    return {
      lastSync: localStorage.getItem('mirage_last_sync') || 'Never',
      isOnline: effectiveOnlineStatus,
      syncInProgress: false,
      dataTypes: {
        tenders: { 
          count: localData.tenders?.length || 0, 
          lastSync: localStorage.getItem('mirage_tenders_last_sync') || 'Never' 
        },
        users: { 
          count: localData.users?.length || 0, 
          lastSync: localStorage.getItem('mirage_users_last_sync') || 'Never' 
        },
        files: { 
          count: 0, 
          totalSize: 0, 
          lastSync: localStorage.getItem('mirage_files_last_sync') || 'Never' 
        },
        settings: { 
          lastSync: localStorage.getItem('mirage_settings_last_sync') || 'Never' 
        }
      },
      errors: []
    }
  }

  async forceSyncNow(): Promise<SyncStatus> {
    console.log('Forcing immediate sync...')
    return await this.performFullSync()
  }

  async resetAndResync(): Promise<void> {
    console.log('Resetting local data and performing fresh sync...')
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mirage_central_')) {
          localStorage.removeItem(key)
        }
      })
    }

    // Perform fresh sync
    await this.performFullSync()
  }

  updateConfig(newConfig: Partial<ComprehensiveSyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart auto-sync with new interval if changed
    if (newConfig.syncInterval && this.syncTimer) {
      this.stopAutoSync()
      this.startAutoSync()
    }
  }

  destroy(): void {
    this.stopAutoSync()
    this.isInitialized = false
    console.log('ComprehensiveSyncManager destroyed')
  }
}

// Global sync manager instance
let globalSyncManager: ComprehensiveSyncManager | null = null

export function initializeGlobalSync(config: ComprehensiveSyncConfig): ComprehensiveSyncManager {
  if (globalSyncManager) {
    globalSyncManager.destroy()
  }

  globalSyncManager = new ComprehensiveSyncManager(config)
  return globalSyncManager
}

export function getGlobalSync(): ComprehensiveSyncManager | null {
  return globalSyncManager
}

// Default configuration for Mirage Business Solutions
export const defaultSyncConfig: ComprehensiveSyncConfig = {
  primaryDomain: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'http://localhost:3001',
  backupDomains: [],
  syncInterval: parseInt(process.env.NEXT_PUBLIC_SYNC_INTERVAL || '30000'), // 30 seconds
  enableFileSync: true,
  enableAutoSync: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'xlsx', 'xls']
}