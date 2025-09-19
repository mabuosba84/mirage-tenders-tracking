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

  // Load user from localStorage on component mount with data sync
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First, load the current user from centralized storage (PRIORITY)
        const savedUser = await loadCurrentUserFromStorage()
        if (savedUser) {
          setUser(savedUser)
          console.log('✅ Loaded user from storage:', savedUser.username, savedUser.role)
        }

        // Then, try to sync data from server for cross-domain consistency
        try {
          const response = await fetch('/api/sync')
          if (response.ok) {
            const syncData = await response.json()
            if (syncData.tenders && syncData.tenders.length > 0) {
              // Save to both central storage and localStorage for immediate access
              await saveTendersToStorage(syncData.tenders)
              console.log('✅ Synced tenders from server:', syncData.tenders.length, 'items')
            }
            if (syncData.users && syncData.users.length > 0) {
              // Save to both central storage and localStorage for immediate access  
              await saveUsersToStorage(syncData.users)
              console.log('✅ Synced users from server:', syncData.users.length, 'items')
            }
          }
        } catch (error) {
          console.warn('⚠️ Server sync failed, using central storage:', error)
        }

      } catch (error) {
        console.error('Error loading user from centralized storage:', error)
        await removeCurrentUserFromStorage() // Clean up invalid data
      } finally {
        setIsLoading(false)
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
