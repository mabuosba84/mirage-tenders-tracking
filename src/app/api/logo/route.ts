import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'network-storage.json')

export async function POST(request: NextRequest) {
  try {
    const { action, logoData } = await request.json()
    
    if (action === 'syncLogo') {
      // Read current storage
      let data = { 
        tenders: [], 
        users: [], 
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
        lastUpdated: new Date().toISOString() 
      }
      
      if (fs.existsSync(STORAGE_FILE)) {
        data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
      }
      
      // Update logo in settings
      if (!data.settings) {
        data.settings = {
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
        }
      }
      data.settings.companyLogo = logoData || ""
      data.settings.lastUpdated = new Date().toISOString()
      data.lastUpdated = new Date().toISOString()
      
      // Save back to storage
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
      
      return NextResponse.json({
        success: true,
        message: 'Logo synced successfully'
      })
    }
    
    if (action === 'forceSyncFromLocal') {
      // This action will be called from the client to sync localStorage logo to central storage
      const { localLogo } = await request.json()
      
      if (localLogo) {
        // Read current storage
        let data = { 
          tenders: [], 
          users: [], 
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
          lastUpdated: new Date().toISOString() 
        }
        
        if (fs.existsSync(STORAGE_FILE)) {
          data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
        }
        
        // Update logo in settings
        if (!data.settings) {
          data.settings = {
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
          }
        }
        
        data.settings.companyLogo = localLogo
        data.settings.lastUpdated = new Date().toISOString()
        data.lastUpdated = new Date().toISOString()
        
        // Save back to storage
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
        
        return NextResponse.json({
          success: true,
          message: 'Logo force synced from local storage'
        })
      }
      
      return NextResponse.json({
        success: false,
        message: 'No local logo provided'
      }, { status: 400 })
    }
    
    if (action === 'getLogo') {
      // Read current storage
      if (fs.existsSync(STORAGE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'))
        return NextResponse.json({
          success: true,
          logo: data.settings?.companyLogo || ""
        })
      }
      
      return NextResponse.json({
        success: true,
        logo: ""
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Logo sync API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error'
    }, { status: 500 })
  }
}