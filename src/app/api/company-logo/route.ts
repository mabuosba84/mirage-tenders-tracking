import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for company logo (in production, use a database)
let companyLogo: string | null = null

export async function GET() {
  try {
    return NextResponse.json({ 
      logo: companyLogo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting company logo:', error)
    return NextResponse.json({ error: 'Failed to get company logo' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { logo } = await request.json()
    
    if (!logo || typeof logo !== 'string') {
      return NextResponse.json({ error: 'Invalid logo data' }, { status: 400 })
    }
    
    companyLogo = logo
    
    return NextResponse.json({ 
      success: true,
      message: 'Company logo saved successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving company logo:', error)
    return NextResponse.json({ error: 'Failed to save company logo' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    companyLogo = null
    
    return NextResponse.json({ 
      success: true,
      message: 'Company logo removed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error removing company logo:', error)
    return NextResponse.json({ error: 'Failed to remove company logo' }, { status: 500 })
  }
}