import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'import { NextRequest, NextResponse } from 'next/server'



let storage = {

  tenders: [],

  users: [// Memory storage for serverless environment (resets on cold starts)

    { id: '1', username: 'admin', password: 'admin123', role: 'admin' },

    { id: '2', username: 'user', password: 'user123', role: 'user' }let memoryStorage = {

  ]

}  tenders: [],// Vercel-compatible storage using memory (resets on cold starts)// Vercel-compatible storage using environment variables and edge KV (fallback to memory)



export async function GET() {  users: [

  return NextResponse.json(storage)

}    {// In production, this should use a database like Vercel KV, Upstash Redis, or similar// In production, this would use a database like Vercel KV, Upstash, or similar



export async function POST(request: NextRequest) {      id: '1',

  try {

    const data = await request.json()      username: 'admin',

    if (data.tenders) storage.tenders = data.tenders

    if (data.users) storage.users = data.users      password: 'admin123',

    return NextResponse.json({ success: true })

  } catch (error) {      role: 'admin',interface SyncData {interface SyncData {

    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  }      name: 'System Administrator',

}
      email: 'admin@miragebs.com',  tenders: any[]  tenders: any[]

      isActive: true,

      createdAt: new Date().toISOString(),  users: any[]  users: any[]

      lastLogin: null

    },  files: any[]  files: FileMetadata[]

    {

      id: '2',   settings: any  settings: AppSettings

      username: 'user',

      password: 'user123',  lastUpdated: string  lastUpdated: string

      role: 'user',

      name: 'Regular User',  updateSource: string  updateSource: string

      email: 'user@miragebs.com',

      isActive: true,  version: string  version: string

      createdAt: new Date().toISOString(),

      lastLogin: null}}

    }

  ],

  files: [],

  settings: {// In-memory storage for serverless environmentinterface FileMetadata {

    companyName: "Mirage Business Solutions",

    companyLogo: "",let memoryStorage: SyncData = {  id: string

    contactInfo: {

      phone: "+962 6 569 13 33 | +962 78693 5565",  tenders: [],  name: string

      email: "m.abuosba@miragebs.com",

      website: "http://www.miragebs.com/",  users: [  type: string

      address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"

    },    {  size: number

    theme: {},

    lastUpdated: new Date().toISOString()      id: '1',  uploadedAt: string

  },

  lastUpdated: new Date().toISOString()      username: 'admin',  fileType: string

}

      password: 'admin123',  tenderId: string

export async function GET() {

  try {      role: 'admin',  checksum?: string

    console.log('Sync GET: Returning', memoryStorage.tenders.length, 'tenders')

    return NextResponse.json(memoryStorage)      name: 'System Administrator',}

  } catch (error) {

    console.error('Sync GET error:', error)      email: 'admin@miragebs.com',

    return NextResponse.json({ error: 'Failed to get data' }, { status: 500 })

  }      isActive: true,interface AppSettings {

}

      createdAt: new Date().toISOString(),  companyName: string

export async function POST(request: NextRequest) {

  try {      lastLogin: null  companyLogo: string

    const data = await request.json()

    console.log('Sync POST: Received', data.tenders?.length || 0, 'tenders')    },  contactInfo: {

    

    if (data.tenders) memoryStorage.tenders = data.tenders    {    phone: string

    if (data.users) memoryStorage.users = data.users

    if (data.files) memoryStorage.files = data.files      id: '2',     email: string

    if (data.settings) memoryStorage.settings = data.settings

          username: 'user',    website: string

    memoryStorage.lastUpdated = new Date().toISOString()

          password: 'user123',    address: string

    console.log('Sync POST: Saved', memoryStorage.tenders.length, 'tenders')

          role: 'user',  }

    return NextResponse.json({ 

      success: true,       name: 'Regular User',  theme: any

      message: 'Data saved successfully',

      count: memoryStorage.tenders.length      email: 'user@miragebs.com',  lastUpdated: string

    })

  } catch (error) {      isActive: true,}

    console.error('Sync POST error:', error)

    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })      createdAt: new Date().toISOString(),

  }

}      lastLogin: null// In-memory storage for serverless environment (resets on each cold start)



export async function PUT(request: NextRequest) {    }// In production, this should be replaced with a proper database

  try {

    const { action, data } = await request.json()  ],let memoryStorage: SyncData = {

    

    if (action === 'merge' && data.tenders) {  files: [],  tenders: [],

      data.tenders.forEach(tender => {

        const existingIndex = memoryStorage.tenders.findIndex(t => t.id === tender.id)  settings: {  users: [

        if (existingIndex >= 0) {

          memoryStorage.tenders[existingIndex] = tender    companyName: "Mirage Business Solutions",    {

        } else {

          memoryStorage.tenders.push(tender)    companyLogo: "",      id: '1',

        }

      })    contactInfo: {      username: 'admin',

      

      memoryStorage.lastUpdated = new Date().toISOString()      phone: "+962 6 569 13 33 | +962 78693 5565",      password: 'admin123',

      

      return NextResponse.json({       email: "m.abuosba@miragebs.com",      role: 'admin',

        success: true, 

        message: 'Data merged successfully',      website: "http://www.miragebs.com/",      name: 'System Administrator',

        count: memoryStorage.tenders.length

      })      address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"      email: 'admin@miragebs.com',

    }

        },      isActive: true,

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {    theme: {},      createdAt: new Date().toISOString(),

    console.error('Sync PUT error:', error)

    return NextResponse.json({ error: 'Failed to merge data' }, { status: 500 })    lastUpdated: new Date().toISOString()      lastLogin: null

  }

}  },    },

  lastUpdated: new Date().toISOString(),    {

  updateSource: 'initial',      id: '2', 

  version: '1.0.0'      username: 'user',

}      password: 'user123',

      role: 'user',

// GET: Retrieve synchronized data      name: 'Regular User',

export async function GET(request: NextRequest) {      email: 'user@miragebs.com',

  try {      isActive: true,

    console.log('Sync GET: Returning data with', memoryStorage.tenders.length, 'tenders')      createdAt: new Date().toISOString(),

          lastLogin: null

    return NextResponse.json({    }

      tenders: memoryStorage.tenders,  ],

      users: memoryStorage.users,  files: [],

      files: memoryStorage.files,  settings: {

      settings: memoryStorage.settings,        companyName: "Mirage Business Solutions",

      lastUpdated: memoryStorage.lastUpdated,        companyLogo: "",

      updateSource: memoryStorage.updateSource,        contactInfo: {

      version: memoryStorage.version          phone: "+962 6 569 13 33 | +962 78693 5565",

    })          email: "m.abuosba@miragebs.com",

  } catch (error) {          website: "http://www.miragebs.com/",

    console.error('Sync GET error:', error)          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"

    return NextResponse.json({        },

      tenders: [],        theme: {},

      users: memoryStorage.users, // Keep default users        lastUpdated: new Date().toISOString()

      files: [],      },

      settings: memoryStorage.settings,      lastUpdated: new Date().toISOString(),

      lastUpdated: new Date().toISOString(),      updateSource: 'initial',

      updateSource: 'error-fallback',      version: '1.0.0'

      version: '1.0.0'    }

    })    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initialData, null, 2))

  }  }

}  

  // Ensure uploads directory exists

// POST: Update synchronized data  if (!fs.existsSync(UPLOADS_DIR)) {

export async function POST(request: NextRequest) {    fs.mkdirSync(UPLOADS_DIR, { recursive: true })

  try {  }

    const { tenders, users, files, settings, source, timestamp } = await request.json()}

    

    console.log('Sync POST: Received data', {// GET: Retrieve synchronized data

      tenders: tenders?.length || 0,export async function GET(request: NextRequest) {

      users: users?.length || 0,  try {

      source    ensureStorageFile()

    })    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))

        

    // Update memory storage    // Return data in the format expected by the frontend

    if (tenders !== undefined) {    return NextResponse.json({

      memoryStorage.tenders = tenders      tenders: data.tenders || [],

      console.log('Updated tenders in memory:', memoryStorage.tenders.length)      users: data.users || [],

    }      files: data.files || [],

          settings: data.settings || {

    if (users !== undefined) {        companyName: "Mirage Business Solutions",

      memoryStorage.users = users        companyLogo: "",

    }        contactInfo: {

              phone: "+962 6 569 13 33",

    if (files !== undefined) {          email: "m.abuosba@miragebs.com",

      memoryStorage.files = files          website: "http://www.miragebs.com/",

    }          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"

            },

    if (settings !== undefined) {        theme: {},

      memoryStorage.settings = settings        lastUpdated: new Date().toISOString()

    }      },

          lastUpdated: data.lastUpdated,

    memoryStorage.lastUpdated = new Date().toISOString()      updateSource: data.updateSource,

    memoryStorage.updateSource = source || 'unknown'      version: data.version || '1.0.0'

        })

    console.log('Sync POST: Data saved successfully')  } catch (error) {

        console.error('Sync GET error:', error)

    return NextResponse.json({    // Return empty data structure if there's an error

      success: true,    return NextResponse.json({

      message: 'Data synchronized successfully',      tenders: [],

      timestamp: memoryStorage.lastUpdated,      users: [],

      count: {      files: [],

        tenders: memoryStorage.tenders.length,      settings: {

        users: memoryStorage.users.length,        companyName: "Mirage Business Solutions",

        files: memoryStorage.files.length        companyLogo: "",

      }        contactInfo: {

    })          phone: "+962 6 569 13 33",

  } catch (error) {          email: "m.abuosba@miragebs.com",

    console.error('Sync POST error:', error)          website: "http://www.miragebs.com/",

    return NextResponse.json(          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"

      { success: false, error: 'Failed to sync data', details: error.message },        },

      { status: 500 }        theme: {},

    )        lastUpdated: new Date().toISOString()

  }      },

}      lastUpdated: new Date().toISOString(),

      updateSource: 'error-fallback',

// PUT: Force update from client      version: '1.0.0'

export async function PUT(request: NextRequest) {    })

  try {  }

    const { action, data } = await request.json()}

    

    console.log('Sync PUT: Received action', action)// POST: Update synchronized data

    export async function POST(request: NextRequest) {

    if (action === 'merge') {  try {

      // Merge data intelligently    const { tenders, users, files, settings, source } = await request.json()

      const mergedTenders = [...memoryStorage.tenders]    

      const mergedUsers = [...memoryStorage.users]    ensureStorageFile()

          

      // Add new tenders that don't exist    // Read existing data to merge

      if (data.tenders) {    const existingData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))

        data.tenders.forEach((tender: any) => {    

          const exists = mergedTenders.find(t => t.id === tender.id)    const syncData: SyncData = {

          if (!exists) {      tenders: tenders || existingData.tenders || [],

            mergedTenders.push(tender)      users: users || existingData.users || [],

          } else {      files: files || existingData.files || [],

            // Update if newer      settings: settings || existingData.settings || {

            const existingIndex = mergedTenders.findIndex(t => t.id === tender.id)        companyName: "Mirage Business Solutions",

            if (new Date(tender.updatedAt) > new Date(exists.updatedAt)) {        companyLogo: "",

              mergedTenders[existingIndex] = tender        contactInfo: {

            }          phone: "+962 6 569 13 33",

          }          email: "m.abuosba@miragebs.com",

        })          website: "http://www.miragebs.com/",

      }          address: "Wadi Saqra, P.O.Box 268 Amman 11731 Jordan"

              },

      // Add new users that don't exist        theme: {},

      if (data.users) {        lastUpdated: new Date().toISOString()

        data.users.forEach((user: any) => {      },

          const exists = mergedUsers.find(u => u.id === user.id)      lastUpdated: new Date().toISOString(),

          if (!exists) {      updateSource: source || 'unknown',

            mergedUsers.push(user)      version: existingData.version || '1.0.0'

          }    }

        })    

      }    fs.writeFileSync(STORAGE_FILE, JSON.stringify(syncData, null, 2))

          

      memoryStorage.tenders = mergedTenders    return NextResponse.json({

      memoryStorage.users = mergedUsers      success: true,

      memoryStorage.lastUpdated = new Date().toISOString()      message: 'Data synchronized successfully',

      memoryStorage.updateSource = 'merge'      timestamp: syncData.lastUpdated

          })

      return NextResponse.json({  } catch (error) {

        success: true,    console.error('Sync POST error:', error)

        message: 'Data merged successfully',    return NextResponse.json(

        count: {      { success: false, error: 'Failed to sync data' },

          tenders: memoryStorage.tenders.length,      { status: 500 }

          users: memoryStorage.users.length    )

        }  }

      })}

    }

    // PUT: Force update from client

    return NextResponse.json({export async function PUT(request: NextRequest) {

      success: false,  try {

      error: 'Unknown action'    const { action, data } = await request.json()

    }, { status: 400 })    

        ensureStorageFile()

  } catch (error) {    const currentData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))

    console.error('Sync PUT error:', error)    

    return NextResponse.json(    if (action === 'merge') {

      { success: false, error: 'Failed to process request' },      // Merge data intelligently

      { status: 500 }      const mergedTenders = [...currentData.tenders]

    )      const mergedUsers = [...currentData.users]

  }      

}      // Add new tenders that don't exist
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
