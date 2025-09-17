// Comprehensive Auto-Sync Manager for Mirage Tenders System
// Automatically syncs ALL data between localhost:3000 and network addresses

class AutoSyncManager {
  private syncInterval: number = 3000 // 3 seconds
  private intervalId: NodeJS.Timeout | null = null
  private isOnline: boolean = navigator.onLine
  private lastSyncTime: number = 0
  private syncInProgress: boolean = false
  
  constructor() {
    this.init()
  }

  private init() {
    console.log('🚀 AutoSyncManager: Initializing comprehensive auto-sync...')
    
    // Start automatic sync
    this.startAutoSync()
    
    // Monitor network status
    this.setupNetworkMonitoring()
    
    // Monitor localStorage changes
    this.setupStorageMonitoring()
    
    // Monitor visibility changes (tab focus)
    this.setupVisibilityMonitoring()
    
    // Initial sync on startup
    this.performComprehensiveSync()
  }

  private startAutoSync() {
    if (this.intervalId) clearInterval(this.intervalId)
    
    this.intervalId = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performComprehensiveSync()
      }
    }, this.syncInterval)
    
    console.log('✅ AutoSyncManager: Auto-sync started (every 3 seconds)')
  }

  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 AutoSyncManager: Network online - performing sync')
      this.performComprehensiveSync()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📴 AutoSyncManager: Network offline - sync paused')
    })
  }

  private setupStorageMonitoring() {
    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem.call(localStorage, key, value)
      
      // Trigger sync for important data changes
      if (key.includes('mirage_') || key === 'companyLogo') {
        console.log('📝 AutoSyncManager: Data changed -', key)
        setTimeout(() => this.performComprehensiveSync(), 500)
      }
    }
  }

  private setupVisibilityMonitoring() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        console.log('👁️ AutoSyncManager: Tab focused - performing sync')
        this.performComprehensiveSync()
      }
    })
  }

  private async performComprehensiveSync() {
    if (this.syncInProgress) return
    
    this.syncInProgress = true
    const startTime = Date.now()
    
    try {
      console.log('🔄 AutoSyncManager: Starting comprehensive sync...')
      
      // 1. Sync tenders data
      await this.syncTenders()
      
      // 2. Sync users data
      await this.syncUsers()
      
      // 3. Sync company logo and settings
      await this.syncLogoAndSettings()
      
      // 4. Sync file attachments
      await this.syncFiles()
      
      this.lastSyncTime = Date.now()
      const duration = this.lastSyncTime - startTime
      
      console.log(`✅ AutoSyncManager: Comprehensive sync completed in ${duration}ms`)
      this.updateSyncStatus('Synced', 'success')
      
    } catch (error) {
      console.error('❌ AutoSyncManager: Sync failed:', error)
      this.updateSyncStatus('Sync failed', 'error')
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncTenders() {
    try {
      // Get local tenders
      const localTenders = JSON.parse(localStorage.getItem('mirage_tenders') || '[]')
      
      // Get server tenders
      const response = await fetch('/api/sync')
      const serverData = await response.json()
      
      // Compare and merge
      const merged = this.mergeTendersData(localTenders, serverData.tenders || [])
      
      // Update both local and server if changes detected
      if (JSON.stringify(merged) !== JSON.stringify(localTenders)) {
        localStorage.setItem('mirage_tenders', JSON.stringify(merged))
        console.log('📊 AutoSyncManager: Tenders synced')
      }
      
      // Send to server
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenders: merged,
          source: window.location.origin,
          timestamp: Date.now()
        })
      })
      
    } catch (error) {
      console.error('❌ AutoSyncManager: Tenders sync failed:', error)
    }
  }

  private async syncUsers() {
    try {
      // Get local users
      const localUsers = JSON.parse(localStorage.getItem('mirage_users') || '[]')
      
      // Get server users
      const response = await fetch('/api/sync')
      const serverData = await response.json()
      
      // Compare and merge
      const merged = this.mergeUsersData(localUsers, serverData.users || [])
      
      // Update both local and server if changes detected
      if (JSON.stringify(merged) !== JSON.stringify(localUsers)) {
        localStorage.setItem('mirage_users', JSON.stringify(merged))
        console.log('👥 AutoSyncManager: Users synced')
      }
      
    } catch (error) {
      console.error('❌ AutoSyncManager: Users sync failed:', error)
    }
  }

  private async syncLogoAndSettings() {
    try {
      // Get local logo
      const localLogo = localStorage.getItem('companyLogo')
      
      // Get server logo
      const logoResponse = await fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getLogo' })
      })
      const logoResult = await logoResponse.json()
      
      // Sync logo bidirectionally
      if (localLogo && (!logoResult.logo || logoResult.logo !== localLogo)) {
        // Local has logo but server doesn't or different - sync to server
        await fetch('/api/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'syncLogo',
            logoData: localLogo
          })
        })
        console.log('🖼️ AutoSyncManager: Logo synced to server')
        
      } else if (logoResult.logo && logoResult.logo !== localLogo) {
        // Server has logo but local doesn't or different - sync to local
        localStorage.setItem('companyLogo', logoResult.logo)
        console.log('🖼️ AutoSyncManager: Logo synced from server')
        
        // Trigger UI update
        window.dispatchEvent(new CustomEvent('logoSynced', { detail: logoResult.logo }))
      }
      
    } catch (error) {
      console.error('❌ AutoSyncManager: Logo sync failed:', error)
    }
  }

  private async syncFiles() {
    try {
      // Basic file metadata sync (actual files are handled by upload API)
      const response = await fetch('/api/sync')
      const serverData = await response.json()
      
      if (serverData.files) {
        // Store file metadata for reference
        localStorage.setItem('mirage_files_metadata', JSON.stringify(serverData.files))
        console.log('📁 AutoSyncManager: File metadata synced')
      }
      
    } catch (error) {
      console.error('❌ AutoSyncManager: Files sync failed:', error)
    }
  }

  private mergeTendersData(local: any[], server: any[]): any[] {
    const merged = [...server]
    const serverIds = new Set(server.map(t => t.id))
    
    // Add local items that don't exist on server
    local.forEach(localItem => {
      if (!serverIds.has(localItem.id)) {
        merged.push(localItem)
      }
    })
    
    return merged.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
  }

  private mergeUsersData(local: any[], server: any[]): any[] {
    const merged = [...server]
    const serverIds = new Set(server.map(u => u.id))
    
    // Add local items that don't exist on server
    local.forEach(localItem => {
      if (!serverIds.has(localItem.id)) {
        merged.push(localItem)
      }
    })
    
    return merged
  }

  private updateSyncStatus(message: string, type: 'success' | 'error' | 'syncing') {
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('syncStatusUpdate', {
      detail: { message, type, timestamp: Date.now() }
    }))
  }

  public forceFFullSync() {
    console.log('🔄 AutoSyncManager: Force sync requested')
    this.performComprehensiveSync()
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('⏹️ AutoSyncManager: Auto-sync stopped')
    }
  }
}

// Global auto-sync manager instance
let autoSyncManager: AutoSyncManager | null = null

// Initialize auto-sync when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoSyncManager = new AutoSyncManager()
    })
  } else {
    autoSyncManager = new AutoSyncManager()
  }
}

// Export for manual control
if (typeof window !== 'undefined') {
  (window as any).autoSync = {
    forceSync: () => autoSyncManager?.forceFFullSync(),
    stop: () => autoSyncManager?.stop(),
    start: () => {
      if (!autoSyncManager) autoSyncManager = new AutoSyncManager()
    }
  }
}

export default AutoSyncManager