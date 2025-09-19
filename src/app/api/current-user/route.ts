import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/types'

// In-memory storage for current user sessions per browser session
let currentUserStorage: { [sessionId: string]: User } = {}

// Simple, stable session ID based on browser fingerprint only
function generateSessionId(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const xForwardedFor = request.headers.get('x-forwarded-for') || 'unknown'
  
  // Create stable session based on browser fingerprint (no timestamp/random)
  const fingerprint = `${userAgent}-${acceptLanguage}-${xForwardedFor}`
  return Buffer.from(fingerprint).toString('base64').substring(0, 32)
}

// Extract session ID from cookies or create new one
function getSessionId(request: NextRequest): string {
  const cookies = request.headers.get('cookie') || ''
  const sessionMatch = cookies.match(/sessionId=([^;]+)/)
  
  if (sessionMatch) {
    return sessionMatch[1]
  }
  
  // Generate new session ID
  return generateSessionId(request)
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    console.log(`🔍 GET SESSION: ${sessionId.substring(0, 8)}... for UserAgent: ${userAgent.substring(0, 50)}...`)
    
    // Debug: Log all current sessions
    console.log(`📊 ACTIVE SESSIONS: ${Object.keys(currentUserStorage).length}`)
    Object.keys(currentUserStorage).forEach(id => {
      const user = currentUserStorage[id]
      console.log(`  - ${id.substring(0, 8)}...: ${user.username} (${user.role})`)
    })
    
    // Return user specific to this browser session
    const user = currentUserStorage[sessionId]
    
    if (user) {
      console.log(`✅ FOUND USER: ${user.username} (${user.role}) for session ${sessionId.substring(0, 8)}...`)
      return NextResponse.json({
        success: true,
        user: user,
        sessionId: sessionId
      })
    }
    
    console.log(`❌ NO USER: for session ${sessionId.substring(0, 8)}...`)
    return NextResponse.json({
      success: false,
      user: null,
      sessionId: sessionId
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

    const sessionId = getSessionId(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    console.log(`💾 STORING USER: ${user.username} (${user.role}) for session ${sessionId.substring(0, 8)}...`)
    console.log(`📱 USER AGENT: ${userAgent.substring(0, 50)}...`)

    // Store user with unique browser session ID
    currentUserStorage[sessionId] = user

    // Debug: Log all sessions after storing
    console.log(`📊 SESSIONS AFTER STORE: ${Object.keys(currentUserStorage).length}`)
    Object.keys(currentUserStorage).forEach(id => {
      const sessionUser = currentUserStorage[id]
      console.log(`  - ${id.substring(0, 8)}...: ${sessionUser.username} (${sessionUser.role})`)
    })

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Current user saved',
      user,
      sessionId: sessionId
    })

    // Set session cookie with security flags
    response.cookies.set('sessionId', sessionId, {
      httpOnly: false, // Allow client-side access for debugging
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    console.log(`✅ User session created: ${user.username} -> ${sessionId.substring(0, 8)}...`)
    console.log(`📊 Active sessions: ${Object.keys(currentUserStorage).length}`)

    return response
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
    const sessionId = getSessionId(request)
    console.log(`🗑️ Removing user session: ${sessionId.substring(0, 8)}...`)
    
    // Remove only this specific session
    if (currentUserStorage[sessionId]) {
      const user = currentUserStorage[sessionId]
      delete currentUserStorage[sessionId]
      console.log(`✅ Removed session for user: ${user.username}`)
    } else {
      console.log(`ℹ️ No session found to remove: ${sessionId.substring(0, 8)}...`)
    }

    console.log(`📊 Remaining active sessions: ${Object.keys(currentUserStorage).length}`)

    const response = NextResponse.json({
      success: true,
      message: 'Current user session removed'
    })

    // Clear session cookie
    response.cookies.set('sessionId', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error removing current user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove current user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username required' },
        { status: 400 }
      )
    }

    console.log(`🧹 CLEAR USER SESSIONS: Removing all sessions for user: ${username}`)

    // Find and remove all sessions for this specific user
    let removedCount = 0
    Object.keys(currentUserStorage).forEach(sessionId => {
      if (currentUserStorage[sessionId].username === username) {
        delete currentUserStorage[sessionId]
        removedCount++
      }
    })

    console.log(`✅ CLEARED SESSIONS: Removed ${removedCount} sessions for user: ${username}`)
    console.log(`📊 Remaining active sessions: ${Object.keys(currentUserStorage).length}`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${removedCount} sessions for user ${username}`,
      clearedCount: removedCount
    })
  } catch (error) {
    console.error('Error clearing user sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear user sessions' },
      { status: 500 }
    )
  }
}