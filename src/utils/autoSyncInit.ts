// Auto-start script for Mirage Tenders System
// This script initializes comprehensive auto-sync on app startup

console.log('🚀 Mirage Tenders: Initializing smart auto-sync system...')

// Initialize auto-sync when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutoSync)
} else {
  initAutoSync()
}

function initAutoSync() {
  // Import and start auto-sync manager
  import('./autoSyncManager').then(() => {
    console.log('✅ Auto-sync system loaded and started')
    console.log('📊 All data (tenders, users, logo, files) will sync automatically')
    console.log('🔄 Sync interval: Every 3 seconds')
    console.log('🌐 Sync targets: localhost:3000 ↔ 172.18.0.1:3000')
  }).catch(error => {
    console.error('❌ Failed to load auto-sync system:', error)
  })
}

// Add global controls for debugging
if (typeof window !== 'undefined') {
  (window as any).mirageAutoSync = {
    status: () => console.log('Auto-sync is running in background'),
    forceSync: () => (window as any).autoSync?.forceSync(),
    stop: () => (window as any).autoSync?.stop(),
    start: () => (window as any).autoSync?.start()
  }
}