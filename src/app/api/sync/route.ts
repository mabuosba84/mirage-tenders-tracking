import { NextRequest, NextResponse } from 'next/server';

let storage = {
  tenders: [],
  users: [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@miragebs.com',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    },
    {
      id: '2',
      username: 'user',
      password: 'user123',
      role: 'user',
      name: 'Regular User',
      email: 'user@miragebs.com',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
  ],
  files: [],
  settings: {
    companyName: 'Mirage Business Solutions',
    lastUpdated: new Date().toISOString()
  },
  lastUpdated: new Date().toISOString()
};

export async function GET() {
  try {
    console.log('Sync GET: Returning data');
    return NextResponse.json(storage);
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to get data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Sync POST: Starting');
    
    // Check if request has body
    if (!request.body) {
      console.log('Sync POST: No body provided');
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }
    
    const data = await request.json();
    console.log('Sync POST: Received data', Object.keys(data));
    
    if (data.tenders !== undefined) {
      storage.tenders = Array.isArray(data.tenders) ? data.tenders : [];
      console.log('Sync POST: Updated tenders, count:', storage.tenders.length);
    }
    if (data.users !== undefined) {
      storage.users = Array.isArray(data.users) ? data.users : [];
      console.log('Sync POST: Updated users, count:', storage.users.length);
    }
    if (data.files !== undefined) {
      storage.files = Array.isArray(data.files) ? data.files : [];
      console.log('Sync POST: Updated files, count:', storage.files.length);
    }
    if (data.settings !== undefined) {
      storage.settings = { ...storage.settings, ...data.settings };
      console.log('Sync POST: Updated settings');
    }
    
    storage.lastUpdated = new Date().toISOString();
    
    const response = {
      success: true,
      message: 'Data saved successfully',
      count: storage.tenders.length,
      timestamp: storage.lastUpdated
    };
    
    console.log('Sync POST: Success', response);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Sync POST error:', error);
    return NextResponse.json({ 
      error: 'Failed to save data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
