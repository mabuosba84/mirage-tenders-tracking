import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'refresh') {
      // Read current server data
      let serverData = { tenders: [], users: [], lastUpdated: 'never', updateSource: 'none' }
      if (fs.existsSync(STORAGE_FILE)) {
        serverData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
      }

      return NextResponse.json({
        success: true,
        message: 'Data refreshed',
        data: serverData,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Refresh API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
