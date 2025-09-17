import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')

export async function GET(request: NextRequest) {
  try {
    // Read current server storage
    let serverData = { tenders: [], users: [], lastUpdated: 'never', updateSource: 'none' }
    if (fs.existsSync(STORAGE_FILE)) {
      serverData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    }

    // Get request info
    const url = new URL(request.url)
    const host = request.headers.get('host')
    const userAgent = request.headers.get('user-agent')
    const referer = request.headers.get('referer')

    return NextResponse.json({
      success: true,
      debug: {
        request: {
          host,
          url: url.toString(),
          userAgent,
          referer,
          timestamp: new Date().toISOString()
        },
        storage: {
          filePath: STORAGE_FILE,
          exists: fs.existsSync(STORAGE_FILE),
          tenderCount: serverData.tenders?.length || 0,
          userCount: serverData.users?.length || 0,
          lastUpdated: serverData.lastUpdated,
          updateSource: serverData.updateSource
        },
        sampleTenders: (serverData.tenders as any[])?.slice(0, 3).map((t: any) => ({
          id: t.id,
          customerName: t.customerName,
          status: t.tenderStatus,
          addedBy: t.addedBy
        })) || []
      }
    })
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
