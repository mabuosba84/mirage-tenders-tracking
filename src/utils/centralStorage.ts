import { Lead, User } from '@/types'

// Central storage keys
const CENTRAL_STORAGE_PREFIX = 'mirage_central_'
const TENDERS_KEY = `${CENTRAL_STORAGE_PREFIX}tenders`
const USERS_KEY = `${CENTRAL_STORAGE_PREFIX}users`
const SYNC_TIMESTAMP_KEY = `${CENTRAL_STORAGE_PREFIX}last_sync`

// Storage location identifiers
const STORAGE_LOCATIONS = [
  'mirage_tenders', // Original localStorage key
  'mirage_users',   // Original users key
]

// Network sync configuration
const NETWORK_SYNC_CONFIG = {
  enabled: true,
  interval: 5000, // 5 seconds
  forceSync: true, // Force sync on every load
}

// Cross-origin storage helper using IndexedDB for persistence
class CentralStorage {
  private dbName = 'MirageTenderSystem'
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('IndexedDB: Opening database', this.dbName)
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => {
        console.error('IndexedDB: Failed to open database', request.error)
        reject(request.error)
      }
      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB: Database opened successfully')
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        console.log('IndexedDB: Upgrading database schema')
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores
        if (!db.objectStoreNames.contains('tenders')) {
          console.log('IndexedDB: Creating tenders object store')
          db.createObjectStore('tenders', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('users')) {
          console.log('IndexedDB: Creating users object store')
          db.createObjectStore('users', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sync')) {
          console.log('IndexedDB: Creating sync object store')
          db.createObjectStore('sync', { keyPath: 'key' })
        }
        console.log('IndexedDB: Database schema upgrade completed')
      }
    })
  }

  async saveTenders(tenders: Lead[]): Promise<void> {
    if (!this.db) await this.initDB()
    
    return new Promise((resolve, reject) => {
      console.log('IndexedDB: Saving', tenders.length, 'tenders to central storage')
      const transaction = this.db!.transaction(['tenders', 'sync'], 'readwrite')
      const tendersStore = transaction.objectStore('tenders')
      const syncStore = transaction.objectStore('sync')
      
      // Clear existing tenders first
      const clearRequest = tendersStore.clear()
      clearRequest.onsuccess = () => {
        console.log('IndexedDB: Cleared existing tenders')
        
        // Add all tenders
        tenders.forEach((tender, index) => {
          const putRequest = tendersStore.put(tender)
          putRequest.onerror = () => {
            console.error('IndexedDB: Error saving tender', index, putRequest.error)
          }
        })
        
        // Update sync timestamp
        syncStore.put({ key: 'tenders_last_sync', timestamp: Date.now() })
        console.log('IndexedDB: Updated sync timestamp')
      }
      
      clearRequest.onerror = () => {
        console.error('IndexedDB: Error clearing tenders', clearRequest.error)
        reject(clearRequest.error)
      }
      
      transaction.oncomplete = () => {
        console.log('IndexedDB: Successfully saved', tenders.length, 'tenders')
        resolve()
      }
      transaction.onerror = () => {
        console.error('IndexedDB: Transaction error', transaction.error)
        reject(transaction.error)
      }
    })
  }

  async loadTenders(): Promise<Lead[]> {
    if (!this.db) await this.initDB()
    
    return new Promise((resolve, reject) => {
      console.log('IndexedDB: Loading tenders from central storage')
      const transaction = this.db!.transaction(['tenders'], 'readonly')
      const store = transaction.objectStore('tenders')
      const request = store.getAll()
      
      request.onsuccess = () => {
        const result = request.result || []
        console.log('IndexedDB: Loaded', result.length, 'tenders from central storage')
        if (result.length > 0) {
          console.log('IndexedDB: Sample tender:', result[0]?.customerName)
        }
        resolve(result)
      }
      request.onerror = () => {
        console.error('IndexedDB: Error loading tenders', request.error)
        reject(request.error)
      }
    })
  }

  async saveUsers(users: User[]): Promise<void> {
    if (!this.db) await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users', 'sync'], 'readwrite')
      const usersStore = transaction.objectStore('users')
      const syncStore = transaction.objectStore('sync')
      
      // Clear existing users
      usersStore.clear()
      
      // Add all users
      users.forEach(user => {
        usersStore.add(user)
      })
      
      // Update sync timestamp
      syncStore.put({ key: 'users_last_sync', timestamp: Date.now() })
      
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async loadUsers(): Promise<User[]> {
    if (!this.db) await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly')
      const store = transaction.objectStore('users')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }
}

// Global instance
const centralStorage = new CentralStorage()

// Enhanced storage functions that sync across domains
export const saveTendersToStorage = async (tenders: Lead[]): Promise<void> => {
  try {
    console.log('🔄 Saving tenders to storage - Count:', tenders.length)
    
    // 1. Save to localStorage (immediate local persistence)
    localStorage.setItem(TENDERS_KEY, JSON.stringify(tenders))
    console.log('✅ Saved to localStorage')
    
    // 2. Save to server via API (network persistence) - CRITICAL FOR CROSS-DOMAIN
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenders: tenders,
          source: 'client-save',
          timestamp: new Date().toISOString()
        }),
      })
      
      if (response.ok) {
        console.log('✅ Saved to server successfully')
      } else {
        console.error('❌ Server save failed:', response.status, response.statusText)
        throw new Error(`Server save failed: ${response.status}`)
      }
    } catch (serverError) {
      console.error('❌ Server save error:', serverError)
      // Don't throw here - we still have localStorage as fallback
    }
    
    // 3. Save to IndexedDB (cross-domain persistence)
    try {
      await centralStorage.saveTenders(tenders)
      console.log('✅ Saved to IndexedDB')
    } catch (indexedDBError) {
      console.error('⚠️ IndexedDB save failed:', indexedDBError)
      // Don't throw here - localStorage and server are primary
    }
    
    // 4. Update sync timestamp
    localStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString())
    console.log('✅ All storage operations completed')
    
  } catch (error) {
    console.error('❌ Error in saveTendersToStorage:', error)
    // Ultimate fallback - ensure localStorage at minimum
    try {
      localStorage.setItem('mirage_tenders', JSON.stringify(tenders))
      console.log('⚠️ Fallback: Saved to localStorage only')
    } catch (fallbackError) {
      console.error('💥 Critical: Even localStorage failed:', fallbackError)
      throw new Error('Complete storage failure - cannot save tender data')
    }
  }
}

export const loadTendersFromStorage = async (): Promise<Lead[]> => {
  try {
    console.log('🔄 Loading tenders from all storage sources...')
    
    // 1. First, try to load from server (most authoritative source)
    try {
      const response = await fetch('/api/sync')
      if (response.ok) {
        const syncData = await response.json()
        if (syncData.tenders && Array.isArray(syncData.tenders) && syncData.tenders.length > 0) {
          console.log('✅ Loaded', syncData.tenders.length, 'tenders from server')
          // Update localStorage with server data
          localStorage.setItem('mirage_tenders', JSON.stringify(syncData.tenders))
          return syncData.tenders
        }
      }
    } catch (serverError) {
      console.warn('⚠️ Server load failed, trying local sources:', serverError)
    }
    
    // 2. Try IndexedDB (cross-domain)
    try {
      const centralTenders = await centralStorage.loadTenders()
      if (centralTenders.length > 0) {
        console.log('✅ Found', centralTenders.length, 'tenders in IndexedDB')
        // Update localStorage with central data
        localStorage.setItem('mirage_tenders', JSON.stringify(centralTenders))
        return centralTenders
      }
    } catch (indexedDBError) {
      console.warn('⚠️ IndexedDB load failed:', indexedDBError)
    }
    
    // 3. Try localStorage (current domain)
    const localData = localStorage.getItem('mirage_tenders')
    if (localData) {
      const tenders = JSON.parse(localData)
      console.log('✅ Found', tenders.length, 'tenders in localStorage')
      // Try to save to central storage for future access
      try {
        await centralStorage.saveTenders(tenders)
        console.log('✅ Backed up localStorage data to IndexedDB')
      } catch (backupError) {
        console.warn('⚠️ Failed to backup to IndexedDB:', backupError)
      }
      return tenders
    }
    
    console.log('ℹ️ No tender data found in any storage location')
    return []
    
  } catch (error) {
    console.error('❌ Error in loadTendersFromStorage:', error)
    // Ultimate fallback
    try {
      const fallbackData = localStorage.getItem('mirage_tenders')
      return fallbackData ? JSON.parse(fallbackData) : []
    } catch (fallbackError) {
      console.error('💥 Critical: Even fallback failed:', fallbackError)
      return []
    }
  }
}

export const saveUsersToStorage = async (users: User[]): Promise<void> => {
  try {
    // Save to localStorage (current domain)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    
    // Save to IndexedDB (cross-domain)
    await centralStorage.saveUsers(users)
    
    // Update sync timestamp
    localStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('Error saving users:', error)
    // Fallback to localStorage only
    localStorage.setItem('mirage_users', JSON.stringify(users))
  }
}

export const loadUsersFromStorage = async (): Promise<User[]> => {
  try {
    // Try to load from IndexedDB first (most recent data)
    const centralUsers = await centralStorage.loadUsers()
    
    if (centralUsers.length > 0) {
      // Update localStorage with central data
      localStorage.setItem('mirage_users', JSON.stringify(centralUsers))
      return centralUsers
    }
    
    // Fallback to localStorage
    const localData = localStorage.getItem('mirage_users')
    if (localData) {
      const users = JSON.parse(localData)
      // Save to central storage for future access
      await centralStorage.saveUsers(users)
      return users
    }
    
    return []
  } catch (error) {
    console.error('Error loading users:', error)
    // Final fallback to localStorage only
    const localData = localStorage.getItem('mirage_users')
    return localData ? JSON.parse(localData) : []
  }
}

// Auto-sync function to run periodically
export const syncDataAcrossDomains = async (): Promise<void> => {
  try {
    console.log('=== SYNC STARTED ===')
    
    // Load data from central storage first
    const [centralTenders, centralUsers] = await Promise.all([
      centralStorage.loadTenders(),
      centralStorage.loadUsers()
    ])
    
    console.log('Central storage has:', centralTenders.length, 'tenders and', centralUsers.length, 'users')
    
    // Load data from localStorage
    const localTendersString = localStorage.getItem('mirage_tenders')
    const localUsersString = localStorage.getItem('mirage_users')
    
    const localTenders = localTendersString ? JSON.parse(localTendersString) : []
    const localUsers = localUsersString ? JSON.parse(localUsersString) : []
    
    console.log('Local storage has:', localTenders.length, 'tenders and', localUsers.length, 'users')
    
    // For tenders: if IndexedDB has data, use it; otherwise save local to IndexedDB
    if (centralTenders.length > 0) {
      // IndexedDB has data, update localStorage
      localStorage.setItem('mirage_tenders', JSON.stringify(centralTenders))
      console.log('Updated localStorage with', centralTenders.length, 'tenders from IndexedDB')
    } else if (localTenders.length > 0) {
      // localStorage has data but IndexedDB doesn't, save to IndexedDB
      await centralStorage.saveTenders(localTenders)
      console.log('Saved', localTenders.length, 'tenders from localStorage to IndexedDB')
    }
    
    // For users: same logic
    if (centralUsers.length > 0) {
      localStorage.setItem('mirage_users', JSON.stringify(centralUsers))
      console.log('Updated localStorage with', centralUsers.length, 'users from IndexedDB')
    } else if (localUsers.length > 0) {
      await centralStorage.saveUsers(localUsers)
      console.log('Saved', localUsers.length, 'users from localStorage to IndexedDB')
    }

    // Force network synchronization for cross-domain consistency
    await forceNetworkSync()
    
    console.log('=== SYNC COMPLETED ===')
  } catch (error) {
    console.error('Error syncing data:', error)
  }
}

// Initialize sync on page load
export const initializeCentralStorage = async (): Promise<void> => {
  try {
    await centralStorage.initDB()
    
    // First, migrate existing localStorage data to central storage
    await migrateLocalStorageToIndexedDB()
    
    // Then sync data across domains
    await syncDataAcrossDomains()
    
    // Set up periodic sync (every 30 seconds)
    setInterval(syncDataAcrossDomains, 30000)
  } catch (error) {
    console.error('Error initializing central storage:', error)
  }
}

// Migrate existing localStorage data to central IndexedDB storage
const migrateLocalStorageToIndexedDB = async (): Promise<void> => {
  try {
    console.log('=== MIGRATION STARTED ===')
    
    // Migrate tenders if they exist in localStorage but not in central storage
    const localTenders = localStorage.getItem('mirage_tenders')
    if (localTenders) {
      const tendersArray = JSON.parse(localTenders)
      console.log('Found', tendersArray.length, 'tenders in localStorage')
      
      if (tendersArray.length > 0) {
        // Always migrate to ensure data is in IndexedDB
        console.log('Migrating', tendersArray.length, 'tenders from localStorage to IndexedDB')
        await centralStorage.saveTenders(tendersArray)
        console.log('Migration completed successfully')
      }
    } else {
      console.log('No tenders found in localStorage to migrate')
    }
    
    // Migrate users if they exist in localStorage but not in central storage
    const localUsers = localStorage.getItem('mirage_users')
    if (localUsers) {
      const usersArray = JSON.parse(localUsers)
      console.log('Found', usersArray.length, 'users in localStorage')
      
      if (usersArray.length > 0) {
        console.log('Migrating', usersArray.length, 'users from localStorage to IndexedDB')
        await centralStorage.saveUsers(usersArray)
      }
    }
    
    // Force network synchronization to ensure consistency
    await forceNetworkSync()
    
    console.log('=== MIGRATION COMPLETED ===')
  } catch (error) {
    console.error('Error migrating localStorage to IndexedDB:', error)
  }
}

// Force network synchronization for cross-domain consistency
async function forceNetworkSync(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    console.log('🔄 Force syncing with server for cross-domain consistency...')
    
    // Get the current hostname to determine sync endpoint
    const isNetworkAccess = window.location.hostname === '172.18.0.1'
    const baseUrl = isNetworkAccess ? 'http://172.18.0.1:3001' : 'http://localhost:3001'
    
    // First, get server data
    const serverResponse = await fetch(`${baseUrl}/api/sync`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (serverResponse.ok) {
      const serverData = await serverResponse.json()
      console.log('📥 Retrieved server data:', serverData.data.tenders.length, 'tenders')
      
      // Update local storage with server data
      if (serverData.data.tenders.length > 0) {
        localStorage.setItem('mirage_tenders', JSON.stringify(serverData.data.tenders))
        await centralStorage.saveTenders(serverData.data.tenders)
        console.log('✅ Local storage updated with server data')
      }
      
      if (serverData.data.users.length > 0) {
        localStorage.setItem('mirage_users', JSON.stringify(serverData.data.users))
        await centralStorage.saveUsers(serverData.data.users)
        console.log('✅ Users updated with server data')
      }
    }
    
    // Then push any local data to server
    const localTenders = await centralStorage.loadTenders()
    const localUsers = await centralStorage.loadUsers()
    
    if (localTenders.length > 0 || localUsers.length > 0) {
      const syncResponse = await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenders: localTenders,
          users: localUsers,
          source: isNetworkAccess ? 'network' : 'localhost'
        })
      })
      
      if (syncResponse.ok) {
        console.log('📤 Local data synced to server successfully')
      }
    }
    
    console.log('🔄 Force sync completed')
  } catch (error) {
    console.error('❌ Force sync error:', error)
  }
}

/**
 * Save current user to centralized storage with proper session management
 */
export const saveCurrentUserToStorage = async (user: User): Promise<void> => {
  try {
    // Save to server API with proper session handling
    const response = await fetch('/api/current-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
      credentials: 'include' // Include cookies for session management
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Current user saved with session:', user.username, `(${data.sessionId?.substring(0, 8)}...)`)
    } else {
      throw new Error('Server response not OK')
    }
    
    // Also save to localStorage for immediate access (session-specific)
    localStorage.setItem('currentUser', JSON.stringify(user))
    console.log('✅ Current user saved to localStorage:', user.username)
  } catch (error) {
    console.error('❌ Failed to save current user to central storage:', error)
    // Fallback to localStorage only
    localStorage.setItem('currentUser', JSON.stringify(user))
    console.log('⚠️ Fallback: Using localStorage only for user:', user.username)
  }
}

/**
 * Load current user from centralized storage with proper session management
 */
export const loadCurrentUserFromStorage = async (): Promise<User | null> => {
  try {
    // Try to load from server with session credentials first
    const response = await fetch('/api/current-user', {
      credentials: 'include' // Include cookies for session management
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.user) {
        console.log('✅ Current user loaded from server session:', data.user.username, `(${data.sessionId?.substring(0, 8)}...)`)
        // Update localStorage with fresh session data
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        return data.user
      } else {
        console.log('ℹ️ No user session found on server')
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load user from server session, using localStorage:', error)
  }
  
  // Fallback to localStorage
  try {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      console.log('✅ Current user loaded from localStorage:', user.username)
      return user
    }
  } catch (error) {
    console.error('❌ Failed to parse current user from localStorage:', error)
  }
  
  console.log('ℹ️ No current user found in any storage')
  return null
}

/**
 * Remove current user from centralized storage with proper session management
 */
export const removeCurrentUserFromStorage = async (): Promise<void> => {
  try {
    // Remove from server session
    const response = await fetch('/api/current-user', {
      method: 'DELETE',
      credentials: 'include' // Include cookies for session management
    })
    
    if (response.ok) {
      console.log('✅ Current user session removed from server')
    } else {
      console.warn('⚠️ Failed to remove user session from server')
    }
    
    // Remove from localStorage
    localStorage.removeItem('currentUser')
    console.log('✅ Current user removed from localStorage')
  } catch (error) {
    console.error('❌ Failed to remove current user from central storage:', error)
    // Still remove from localStorage
    localStorage.removeItem('currentUser')
    console.log('⚠️ Fallback: Removed user from localStorage only')
  }
}

/**
 * Save company logo to centralized storage
 */
export const saveCompanyLogoToStorage = async (logoData: string): Promise<void> => {
  try {
    // Save to server
    await fetch('/api/company-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logo: logoData })
    })
    
    // Save to localStorage as fallback
    localStorage.setItem('companyLogo', logoData)
    console.log('✅ Company logo saved to centralized storage')
  } catch (error) {
    console.error('❌ Failed to save logo to central storage:', error)
    // Fallback to localStorage only
    localStorage.setItem('companyLogo', logoData)
  }
}

/**
 * Load company logo from centralized storage
 */
export const loadCompanyLogoFromStorage = async (): Promise<string | null> => {
  try {
    // Try to get from server first
    const response = await fetch('/api/company-logo')
    if (response.ok) {
      const data = await response.json()
      if (data.logo) {
        // Sync to localStorage
        localStorage.setItem('companyLogo', data.logo)
        return data.logo
      }
    }
  } catch (error) {
    console.error('❌ Failed to load logo from server:', error)
  }
  
  // Fallback to localStorage
  const localLogo = localStorage.getItem('companyLogo')
  return localLogo
}

/**
 * Remove company logo from centralized storage
 */
export const removeCompanyLogoFromStorage = async (): Promise<void> => {
  try {
    // Remove from server
    await fetch('/api/company-logo', {
      method: 'DELETE'
    })
    
    // Remove from localStorage
    localStorage.removeItem('companyLogo')
    console.log('✅ Company logo removed from centralized storage')
  } catch (error) {
    console.error('❌ Failed to remove logo from central storage:', error)
    // Fallback to localStorage only
    localStorage.removeItem('companyLogo')
  }
}
