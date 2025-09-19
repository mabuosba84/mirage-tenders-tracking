import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/types'

// In-memory storage for current user sessions (in production, use Redis or database)
let currentUserStorage: { [sessionId: string]: User } = {}

export async function GET(request: NextRequest) {
  try {
    // For now, return the first available user (in production, use proper session management)
    const users = Object.values(currentUserStorage)
    if (users.length > 0) {
      return NextResponse.json({
        success: true,
        user: users[0] // In production, match by session ID
      })
    }
    
    return NextResponse.json({
      success: false,
      user: null
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get current user' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: 'User data required' },
        { status: 400 }
      )
    }

    // Store user with session ID (simplified - in production use proper session management)
    const sessionId = user.id // Simplified
    currentUserStorage[sessionId] = user

    console.log(`✅ Current user stored: ${user.username}`)

    return NextResponse.json({
      success: true,
      message: 'Current user saved',
      user
    })
  } catch (error) {
    console.error('Error saving current user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save current user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all current user sessions (simplified - in production, clear specific session)
    currentUserStorage = {}
    
    console.log('✅ Current user sessions cleared')

    return NextResponse.json({
      success: true,
      message: 'Current user removed'
    })
  } catch (error) {
    console.error('Error removing current user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove current user' },
      { status: 500 }
    )
  }
}