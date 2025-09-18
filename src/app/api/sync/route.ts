import { NextRequest, NextResponse } from 'next/server';
import { readPersistentData } from '../../../utils/persistentStorage';

export async function GET() {
  console.log('🔄 GET /api/sync - Starting with PERSISTENT STORAGE');
  
  try {
    // Read from persistent file storage instead of memory
    const persistentData = await readPersistentData();
    
    const response = {
      ...persistentData,
      requestTime: new Date().toISOString(),
      message: 'Data retrieved successfully from persistent storage'
    };
    
    console.log('✅ GET /api/sync - Success:', response.tenders.length, 'tenders from persistent file');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ GET /api/sync - Error:', error);
    return NextResponse.json({ 
      error: 'GET failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/sync - Starting with PERSISTENT STORAGE');
  
  try {
    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('📥 POST /api/sync - Received data keys:', Object.keys(requestData || {}));
    } catch (parseError) {
      console.error('❌ POST /api/sync - JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON',
        message: 'Request body is not valid JSON',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Read current data from persistent storage
    const { readPersistentData, writePersistentData } = await import('../../../utils/persistentStorage');
    const currentData = await readPersistentData();

    // Update storage with received data
    if (requestData) {
      if (Array.isArray(requestData.tenders)) {
        currentData.tenders = requestData.tenders;
        console.log('💾 POST /api/sync - Updated tenders in persistent storage:', currentData.tenders.length);
      }
      
      if (Array.isArray(requestData.users)) {
        currentData.users = requestData.users;
        console.log('💾 POST /api/sync - Updated users in persistent storage:', currentData.users.length);
      }
      
      if (Array.isArray(requestData.files)) {
        currentData.files = requestData.files;
        console.log('💾 POST /api/sync - Updated files in persistent storage:', currentData.files.length);
      }
      
      if (requestData.settings && typeof requestData.settings === 'object') {
        currentData.settings = { ...currentData.settings, ...requestData.settings };
        console.log('💾 POST /api/sync - Updated settings in persistent storage');
      }
    }
    
    // Write updated data to persistent file storage
    await writePersistentData(currentData);
    
    const response = {
      success: true,
      message: 'Data saved successfully to persistent storage',
      count: currentData.tenders.length,
      timestamp: currentData.lastUpdated,
      storageType: 'persistent-file'
    };
    
    console.log('✅ POST /api/sync - Success with persistent storage:', response);
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ POST /api/sync - Error:', error);
    return NextResponse.json({ 
      error: 'POST failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
