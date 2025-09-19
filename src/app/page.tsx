'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import { User } from '@/types'
import { 
  saveTendersToStorage, 
  saveUsersToStorage, 
  saveCurrentUserToStorage,
  loadCurrentUserFromStorage,
  removeCurrentUserFromStorage 
} from '@/utils/centralStorage'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // PERMANENTLY DISABLED central storage initialization to prevent crashes
  // This ensures server stability by avoiding complex cross-domain sync
  useEffect(() => {
    console.log('Central storage initialization permanently disabled for server stability')
    // Future enhancement: Re-implement with proper server-side handling
  }, [])

  // Load user from server only - 100% CENTRALIZED MODE
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔄 Initializing app - 100% CENTRALIZED MODE');
        
        // Check if user is stored locally (temporary until login)
        const savedUser = await loadCurrentUserFromStorage();
        if (savedUser) {
          setUser(savedUser);
          console.log('✅ Loaded user from storage:', savedUser.username, savedUser.role);
        }

        // Always sync from server - this is the source of truth
        try {
          const response = await fetch('/api/sync');
          if (response.ok) {
            const syncData = await response.json();
            console.log('✅ Server sync successful - centralized data loaded');
            
            // The server data is now loaded, components will use it directly
            if (syncData.tenders && syncData.tenders.length > 0) {
              console.log('📊 Server tenders available:', syncData.tenders.length);
            }
            if (syncData.users && syncData.users.length > 0) {
              console.log('👥 Server users available:', syncData.users.length);
            }
          } else {
            console.error('❌ Server sync failed - check Railway deployment');
          }
        } catch (error) {
          console.error('❌ Critical: Server unreachable:', error);
        }

      } catch (error) {
        console.error('Error in centralized initialization:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeApp()
  }, [])

  // Listen for changes to current user in centralized storage
  useEffect(() => {
    const handleStorageChange = async () => {
      try {
        const savedUser = await loadCurrentUserFromStorage()
        if (savedUser) {
          setUser(savedUser)
        }
      } catch (error) {
        console.error('Error updating user from centralized storage:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for same-window updates
    window.addEventListener('userUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userUpdated', handleStorageChange)
    }
  }, [])

  const handleLogin = async (newUser: User) => {
    try {
      await saveCurrentUserToStorage(newUser)
      setUser(newUser)
    } catch (error) {
      console.error('Error saving user to centralized storage:', error)
      setUser(newUser) // Still set the user even if saving fails
    }
  }

  const handleLogout = async () => {
    try {
      await removeCurrentUserFromStorage()
    } catch (error) {
      console.error('Error removing user from centralized storage:', error)
    }
    setUser(null)
  }

  // Show loading screen while checking for saved user
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </main>
  )
}
