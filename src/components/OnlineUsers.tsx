'use client'

import { useState, useEffect } from 'react'
import { Users, Circle } from 'lucide-react'
import { User } from '@/types'

interface OnlineUsersProps {
  currentUser: User
}

interface OnlineUser {
  id: string
  username: string
  name: string
  role: string
  lastActivity: Date | string  // Can be string when coming from JSON API
  isOnline: boolean
}

export default function OnlineUsers({ currentUser }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  // Track user activity and update online status via centralized API
  useEffect(() => {
    const updateActivity = async () => {
      try {
        const currentTime = new Date()
        
        // Update current user's activity via API
        const currentUserOnline: OnlineUser = {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
          lastActivity: currentTime,
          isOnline: true
        }

        // Send heartbeat to server API to update online status
        await fetch('/api/online-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'heartbeat',
            user: currentUserOnline
          })
        })

        // Fetch all online users from server
        const response = await fetch('/api/online-users', {
          method: 'GET'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.onlineUsers) {
            setOnlineUsers(data.onlineUsers)
          }
        }
      } catch (error) {
        console.error('Failed to update online users:', error)
        // Fallback to localStorage only for current user
        const currentUserOnline: OnlineUser = {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          role: currentUser.role,
          lastActivity: new Date(),
          isOnline: true
        }
        setOnlineUsers([currentUserOnline])
      }
    }

    // Update activity immediately
    updateActivity()

    // Update activity every 30 seconds
    const interval = setInterval(updateActivity, 30000)

    // Update activity on user interaction
    const handleActivity = () => updateActivity()
    window.addEventListener('click', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('scroll', handleActivity)

    // Cleanup on unmount - mark user as offline
    return () => {
      clearInterval(interval)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      
      // Send offline signal to server
      fetch('/api/online-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout',
          userId: currentUser.id
        })
      }).catch(console.error)
    }
  }, [currentUser])

  const formatLastSeen = (lastActivity: Date | string) => {
    const now = new Date()
    // Ensure lastActivity is a Date object
    const activityDate = typeof lastActivity === 'string' ? new Date(lastActivity) : lastActivity
    
    // Check if the date is valid
    if (isNaN(activityDate.getTime())) {
      return 'Unknown'
    }
    
    const diff = now.getTime() - activityDate.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    return `${minutes} minutes ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Users Online</h3>
        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {onlineUsers.length}
        </span>
      </div>

      <div className="space-y-3">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No users currently online</p>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Circle className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">@{user.username} • {user.role}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Circle className="w-2 h-2 text-green-500 fill-current" />
                  <span className="text-xs text-gray-500">Online</span>
                </div>
                <p className="text-xs text-gray-400">
                  {user.id === currentUser.id ? 'You' : formatLastSeen(user.lastActivity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {onlineUsers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Users automatically marked offline after 5 minutes of inactivity
          </p>
        </div>
      )}
    </div>
  )
}