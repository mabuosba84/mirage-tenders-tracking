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
    console.log('🔄 Saving tenders to central storage - Count:', tenders.length)
    
    // 1. Save to server via API (primary persistence for Railway)
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
      // Try IndexedDB as fallback
    }
    
    // 2. Save to IndexedDB (fallback persistence)
    try {
      await centralStorage.saveTenders(tenders)
      console.log('✅ Saved to IndexedDB')
    } catch (indexedDBError) {
      console.error('⚠️ IndexedDB save failed:', indexedDBError)
      throw new Error('Complete storage failure - both server and IndexedDB failed')
    }
    
    console.log('✅ All storage operations completed')
    
  } catch (error) {
    console.error('❌ Error in saveTendersToStorage:', error)
    throw error
  }
}

export const loadTendersFromStorage = async (): Promise<Lead[]> => {
  try {
    console.log('🔄 Loading tenders from central storage sources...')
    
    // 1. First, try to load from server (primary source for Railway)
    try {
      const response = await fetch('/api/sync')
      if (response.ok) {
        const syncData = await response.json()
        if (syncData.tenders && Array.isArray(syncData.tenders) && syncData.tenders.length > 0) {
          console.log('✅ Loaded', syncData.tenders.length, 'tenders from server')
          return syncData.tenders
        }
      }
    } catch (serverError) {
      console.warn('⚠️ Server load failed, trying IndexedDB:', serverError)
    }
    
    // 2. Try IndexedDB (fallback)
    try {
      const centralTenders = await centralStorage.loadTenders()
      if (centralTenders.length > 0) {
        console.log('✅ Found', centralTenders.length, 'tenders in IndexedDB')
        return centralTenders
      }
    } catch (indexedDBError) {
      console.warn('⚠️ IndexedDB load failed:', indexedDBError)
    }
    
    console.log('ℹ️ No tender data found in any storage location')
    return []
    
  } catch (error) {
    console.error('❌ Error in loadTendersFromStorage:', error)
    return []
  }
}

export const saveUsersToStorage = async (users: User[]): Promise<void> => {
  try {
    // Save to IndexedDB (primary persistence for Railway)
    await centralStorage.saveUsers(users)
    console.log('✅ Saved users to IndexedDB')
  } catch (error) {
    console.error('Error saving users:', error)
    throw error
  }
}

export const loadUsersFromStorage = async (): Promise<User[]> => {
  try {
    // Load from IndexedDB (primary source for Railway)
    const centralUsers = await centralStorage.loadUsers()
    
    if (centralUsers.length > 0) {
      return centralUsers
    }
    
    return []
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Auto-sync function to run periodically
/**
 * Force network synchronization for cross-domain consistency
 * Railway production version - NO localStorage
 */
export const forceNetworkSync = async (): Promise<void> => {
  try {
    console.log('=== NETWORK SYNC STARTED (Railway) ===')
    
    // Load data from IndexedDB only
    const [centralTenders, centralUsers] = await Promise.all([
      centralStorage.loadTenders(),
      centralStorage.loadUsers()
    ])
    
    console.log('Central storage has:', centralTenders.length, 'tenders and', centralUsers.length, 'users')
    
    // Broadcast data to other domains/tabs via network
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage({
        type: 'RAILWAY_SYNC',
        tenders: centralTenders,
        users: centralUsers,
        timestamp: Date.now()
      }, '*')
    }
    
    console.log('=== NETWORK SYNC COMPLETED ===')
  } catch (error) {
    console.error('Error in network sync:', error)
  }
}

// Initialize central storage for Railway production
export const initializeCentralStorage = async (): Promise<void> => {
  try {
    console.log('=== INITIALIZING CENTRAL STORAGE (Railway Production) ===')
    
    // Initialize IndexedDB directly - NO localStorage migration
    await centralStorage.initDB()
    
    // Force network synchronization for cross-domain consistency  
    await forceNetworkSync()
    
    // Set up periodic sync (every 30 seconds)
    setInterval(forceNetworkSync, 30000)
    
    console.log('=== INITIALIZATION COMPLETED ===')
  } catch (error) {
    console.error('Error initializing central storage:', error)
  }
}




/**
 * Save current user to centralized storage with proper session management
 */
export const saveCurrentUserToStorage = async (user: User): Promise<void> => {
  try {
    // Save to server API with proper session handling - NO localStorage
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
  } catch (error) {
    console.error('❌ Failed to save current user to central storage:', error)
    throw error // No localStorage fallback
  }
}

/**
 * Load current user from centralized storage with proper session management
 */
export const loadCurrentUserFromStorage = async (): Promise<User | null> => {
  try {
    // Load from server with session credentials ONLY - NO localStorage
    const response = await fetch('/api/current-user', {
      credentials: 'include' // Include cookies for session management
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.user) {
        console.log('✅ Current user loaded from server session:', data.user.username, `(${data.sessionId?.substring(0, 8)}...)`)
        return data.user
      } else {
        console.log('ℹ️ No user session found on server')
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to load user from server session:', error)
  }
  
  console.log('ℹ️ No current user found in server session')
  return null
}

/**
 * Remove current user from centralized storage with proper session management
 */
export const removeCurrentUserFromStorage = async (): Promise<void> => {
  try {
    // Remove from server session ONLY - NO localStorage
    const response = await fetch('/api/current-user', {
      method: 'DELETE',
      credentials: 'include' // Include cookies for session management
    })
    
    if (response.ok) {
      console.log('✅ Current user session removed from server')
    } else {
      console.warn('⚠️ Failed to remove user session from server')
    }
  } catch (error) {
    console.error('❌ Failed to remove current user from central storage:', error)
  }
}

/**
 * Save company logo to centralized storage
 */
export const saveCompanyLogoToStorage = async (logoData: string): Promise<void> => {
  try {
    // Save to server ONLY - NO localStorage
    await fetch('/api/company-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logo: logoData })
    })
    
    console.log('✅ Company logo saved to server')
  } catch (error) {
    console.error('❌ Failed to save logo to server:', error)
    throw error
  }
}

/**
 * Load company logo from centralized storage
 */
export const loadCompanyLogoFromStorage = async (): Promise<string | null> => {
  try {
    // Get from server ONLY - NO localStorage
    const response = await fetch('/api/company-logo')
    if (response.ok) {
      const data = await response.json()
      if (data.logo) {
        return data.logo
      }
    }
  } catch (error) {
    console.error('❌ Failed to load logo from server:', error)
  }
  
  return null
}

/**
 * Remove company logo from centralized storage
 */
export const removeCompanyLogoFromStorage = async (): Promise<void> => {
  try {
    // Remove from server ONLY - NO localStorage
    await fetch('/api/company-logo', {
      method: 'DELETE'
    })
    
    console.log('✅ Company logo removed from server')
  } catch (error) {
    console.error('❌ Failed to remove logo from server:', error)
    throw error
  }
}
