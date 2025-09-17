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
    return NextResponse.json(storage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (data.tenders !== undefined) {
      storage.tenders = data.tenders;
    }
    if (data.users !== undefined) {
      storage.users = data.users;
    }
    if (data.files !== undefined) {
      storage.files = data.files;
    }
    if (data.settings !== undefined) {
      storage.settings = data.settings;
    }
    
    storage.lastUpdated = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      count: storage.tenders.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
