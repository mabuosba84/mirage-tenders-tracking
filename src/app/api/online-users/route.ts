import { NextRequest, NextResponse } from 'next/server'

interface OnlineUser {
  id: string
  username: string
  name: string
  role: string
  lastActivity: Date | string  // Can be string when coming from JSON
  isOnline: boolean
}

// In-memory storage for online users (in production, use Redis or database)
let onlineUsersStorage: OnlineUser[] = []

// Clean up inactive users (older than 5 minutes)
const cleanupInactiveUsers = () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  onlineUsersStorage = onlineUsersStorage.filter(user => {
    // Ensure lastActivity is a Date object for comparison
    const lastActivity = typeof user.lastActivity === 'string' 
      ? new Date(user.lastActivity) 
      : user.lastActivity
    
    // Check if date is valid and not too old
    return !isNaN(lastActivity.getTime()) && lastActivity > fiveMinutesAgo
  })
}

export async function GET() {
  try {
    // Clean up inactive users before returning
    cleanupInactiveUsers()
    
    return NextResponse.json({
      success: true,
      onlineUsers: onlineUsersStorage,
      count: onlineUsersStorage.length
    })
  } catch (error) {
    console.error('Error getting online users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get online users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, user, userId } = body

    if (action === 'heartbeat' && user) {
      // Update or add user's online status
      const existingUserIndex = onlineUsersStorage.findIndex(u => u.id === user.id)
      
      const updatedUser: OnlineUser = {
        ...user,
        lastActivity: new Date(),
        isOnline: true
      }

      if (existingUserIndex >= 0) {
        // Update existing user
        onlineUsersStorage[existingUserIndex] = updatedUser
      } else {
        // Add new user
        onlineUsersStorage.push(updatedUser)
      }

      // Clean up inactive users
      cleanupInactiveUsers()

      console.log(`✅ User heartbeat: ${user.username} - Total online: ${onlineUsersStorage.length}`)

      return NextResponse.json({
        success: true,
        message: 'Heartbeat received',
        onlineUsers: onlineUsersStorage,
        count: onlineUsersStorage.length
      })
    }

    if (action === 'logout' && userId) {
      // Remove user from online list
      const initialCount = onlineUsersStorage.length
      onlineUsersStorage = onlineUsersStorage.filter(u => u.id !== userId)
      
      console.log(`✅ User logout: ${userId} - Removed from online users (${initialCount} → ${onlineUsersStorage.length})`)

      return NextResponse.json({
        success: true,
        message: 'User logged out',
        onlineUsers: onlineUsersStorage,
        count: onlineUsersStorage.length
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating online users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update online users' },
      { status: 500 }
    )
  }
}