'use client'

import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'
import { User } from '@/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on component mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
      localStorage.removeItem('currentUser')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for changes to localStorage currentUser
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedUser = localStorage.getItem('currentUser')
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Error updating user from localStorage:', error)
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

  const handleLogin = (newUser: User) => {
    try {
      localStorage.setItem('currentUser', JSON.stringify(newUser))
      setUser(newUser)
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
      setUser(newUser) // Still set the user even if saving fails
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser')
    } catch (error) {
      console.error('Error removing user from localStorage:', error)
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
