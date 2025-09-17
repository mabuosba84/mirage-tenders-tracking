import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Simple file-based storage for network synchronization
const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

interface SyncData {
  tenders: any[]
  users: any[]
  files: FileMetadata[]
  settings: AppSettings
  lastUpdated: string
  updateSource: string
  version: string
}

interface FileMetadata {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  fileType: string
  tenderId: string
  checksum?: string
}

interface AppSettings {
  companyName: string
  companyLogo: string
  contactInfo: {
    phone: string
    email: string
    website: string
    address: string
  }
  theme: any
  lastUpdated: string
}

// Ensure storage file exists
function ensureStorageFile() {
  if (!fs.existsSync(STORAGE_FILE)) {
    const initialData: SyncData = {
      tenders: [],
      users: [],
      files: [],
      settings: {
        companyName: "Mirage Business Solutions",
        companyLogo: "",
        contactInfo: {
          phone: "+962 6 569 13 33 | +962 78693 5565",
          email: "m.abuosba@miragebs.com",
          website: "http://www.miragebs.com/",
          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"
        },
        theme: {},
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString(),
      updateSource: 'initial',
      version: '1.0.0'
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2))
  }
  
  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

// GET: Retrieve synchronized data
export async function GET(request: NextRequest) {
  try {
    ensureStorageFile()
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    
    // Return data in the format expected by the frontend
    return NextResponse.json({
      tenders: data.tenders || [],
      users: data.users || [],
      files: data.files || [],
      settings: data.settings || {
        companyName: "Mirage Business Solutions",
        companyLogo: "",
        contactInfo: {
          phone: "+962 6 569 13 33",
          email: "m.abuosba@miragebs.com",
          website: "http://www.miragebs.com/",
          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"
        },
        theme: {},
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: data.lastUpdated,
      updateSource: data.updateSource,
      version: data.version || '1.0.0'
    })
  } catch (error) {
    console.error('Sync GET error:', error)
    // Return empty data structure if there's an error
    return NextResponse.json({
      tenders: [],
      users: [],
      files: [],
      settings: {
        companyName: "Mirage Business Solutions",
        companyLogo: "",
        contactInfo: {
          phone: "+962 6 569 13 33",
          email: "m.abuosba@miragebs.com",
          website: "http://www.miragebs.com/",
          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"
        },
        theme: {},
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString(),
      updateSource: 'error-fallback',
      version: '1.0.0'
    })
  }
}

// POST: Update synchronized data
export async function POST(request: NextRequest) {
  try {
    const { tenders, users, files, settings, source } = await request.json()
    
    ensureStorageFile()
    
    // Read existing data to merge
    const existingData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    
    const syncData: SyncData = {
      tenders: tenders || existingData.tenders || [],
      users: users || existingData.users || [],
      files: files || existingData.files || [],
      settings: settings || existingData.settings || {
        companyName: "Mirage Business Solutions",
        companyLogo: "",
        contactInfo: {
          phone: "+962 6 569 13 33",
          email: "m.abuosba@miragebs.com",
          website: "http://www.miragebs.com/",
          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"
        },
        theme: {},
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString(),
      updateSource: source || 'unknown',
      version: existingData.version || '1.0.0'
    }
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(syncData, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'Data synchronized successfully',
      timestamp: syncData.lastUpdated
    })
  } catch (error) {
    console.error('Sync POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync data' },
      { status: 500 }
    )
  }
}

// PUT: Force update from client
export async function PUT(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    ensureStorageFile()
    const currentData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
    
    if (action === 'merge') {
      // Merge data intelligently
      const mergedTenders = [...currentData.tenders]
      const mergedUsers = [...currentData.users]
      
      // Add new tenders that don't exist
      if (data.tenders) {
        data.tenders.forEach((tender: any) => {
          const exists = mergedTenders.find(t => t.id === tender.id)
          if (!exists) {
            mergedTenders.push(tender)
          } else {
            // Update if newer
            const existingIndex = mergedTenders.findIndex(t => t.id === tender.id)
            if (new Date(tender.updatedAt) > new Date(exists.updatedAt)) {
              mergedTenders[existingIndex] = tender
            }
          }
        })
      }
      
      // Add new users that don't exist
      if (data.users) {
        data.users.forEach((user: any) => {
          const exists = mergedUsers.find(u => u.id === user.id)
          if (!exists) {
            mergedUsers.push(user)
          }
        })
      }
      
      const syncData: SyncData = {
        tenders: mergedTenders,
        users: mergedUsers,
        files: currentData.files || [],
        settings: currentData.settings || {
          companyName: "Mirage Business Solutions",
          companyLogo: "",
          contactInfo: {
            phone: "+962 6 569 13 33",
            email: "m.abuosba@miragebs.com",
            website: "http://www.miragebs.com/",
            address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"
          },
          theme: {},
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        updateSource: 'merge',
        version: currentData.version || '1.0.0'
      }
      
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(syncData, null, 2))
      
      return NextResponse.json({
        success: true,
        message: 'Data merged successfully',
        count: {
          tenders: mergedTenders.length,
          users: mergedUsers.length
        }
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Sync PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
