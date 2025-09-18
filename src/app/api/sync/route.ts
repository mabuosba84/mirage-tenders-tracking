import { NextRequest, NextResponse } from 'next/server';
import { globalStorage } from '../../../utils/globalStorage';

export async function GET() {
  console.log('GET /api/sync - Starting');
  
  try {
    const response = {
      ...globalStorage,
      requestTime: new Date().toISOString(),
      message: 'Data retrieved successfully'
    };
    
    console.log('GET /api/sync - Success:', response.tenders.length, 'tenders');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('GET /api/sync - Error:', error);
    return NextResponse.json({ 
      error: 'GET failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/sync - Starting');
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('POST /api/sync - Received data keys:', Object.keys(requestData || {}));
    } catch (parseError) {
      console.error('POST /api/sync - JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON',
        message: 'Request body is not valid JSON',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update storage with received data
    if (requestData) {
      if (Array.isArray(requestData.tenders)) {
        globalStorage.tenders = requestData.tenders;
        console.log('POST /api/sync - Updated tenders:', globalStorage.tenders.length);
      }
      
      if (Array.isArray(requestData.users)) {
        globalStorage.users = requestData.users;
        console.log('POST /api/sync - Updated users:', globalStorage.users.length);
      }
      
      if (Array.isArray(requestData.files)) {
        globalStorage.files = requestData.files;
        console.log('POST /api/sync - Updated files:', globalStorage.files.length);
      }
      
      if (requestData.settings && typeof requestData.settings === 'object') {
        globalStorage.settings = { ...globalStorage.settings, ...requestData.settings };
        console.log('POST /api/sync - Updated settings');
      }
    }
    
    globalStorage.lastUpdated = new Date().toISOString();
    
    const response = {
      success: true,
      message: 'Data saved successfully',
      count: globalStorage.tenders.length,
      timestamp: globalStorage.lastUpdated
    };
    
    console.log('POST /api/sync - Success:', response);
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('POST /api/sync - Error:', error);
    return NextResponse.json({ 
      error: 'POST failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
