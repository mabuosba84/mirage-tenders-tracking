import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')

export async function POST(request: NextRequest) {
  try {
    const { action, username, password } = await request.json()
    
    if (action === 'setPassword') {
      // Read current storage
      let data = { users: [], tenders: [], lastUpdated: new Date().toISOString() }
      if (fs.existsSync(STORAGE_FILE)) {
        data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
      }
      
      // Find user and set password field
      const userIndex = data.users.findIndex((u: any) => u.username === username)
      if (userIndex !== -1) {
        (data.users[userIndex] as any).password = password
        data.lastUpdated = new Date().toISOString()
        
        // Save back to storage
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
        
        return NextResponse.json({
          success: true,
          message: `Password set for user ${username}`
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `User ${username} not found`
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Password API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error'
    }, { status: 500 })
  }
}