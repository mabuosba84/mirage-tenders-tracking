import { NextRequest, NextResponse } from 'next/server';
import { readPersistentData } from '../../../utils/persistentStorage';

export async function GET(request: NextRequest) {
  console.log('🔄 GET /api/sync - Starting with PERSISTENT STORAGE');
  
  try {
    // SECURITY: This endpoint should require authentication in production
    // For now, we'll return all data but in production this should be authenticated
    console.warn('⚠️ WARNING: GET /api/sync endpoint has no authentication - should be secured in production');
    
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
        // Server-side permission validation for tender updates
        const currentUser = requestData.currentUser;
        if (!currentUser) {
          console.warn('⚠️ No user provided in sync request - allowing without auth for change log sync');
          // Allow sync without authentication for change log system
          currentData.tenders = requestData.tenders;
          console.log('💾 POST /api/sync - Updated tenders without auth validation:', currentData.tenders.length);
        } else {
          // Validate each tender edit permission
          const validatedTenders = [];
          const originalTenders = currentData.tenders;
          
          for (const incomingTender of requestData.tenders) {
            const existingTender = originalTenders.find(t => t.id === incomingTender.id);
            
            // If it's a new tender, allow creation
            if (!existingTender) {
              validatedTenders.push(incomingTender);
              continue;
            }
            
            // For existing tenders, check permissions
            const canEdit = currentUser.role === 'admin' || currentUser.username === existingTender.addedBy;
            
            if (canEdit) {
              // Preserve the original addedBy and createdAt when editing
              validatedTenders.push({
                ...incomingTender,
                addedBy: existingTender.addedBy,
                createdAt: existingTender.createdAt,
                lastEditedBy: currentUser.username,
                lastEditedAt: new Date().toISOString()
              });
            } else {
              // Keep the original tender unchanged if user lacks permission
              validatedTenders.push(existingTender);
              console.warn(`⚠️ User ${currentUser.username} attempted to edit tender ${incomingTender.id} owned by ${existingTender.addedBy}`);
            }
          }
          
          currentData.tenders = validatedTenders;
          console.log('💾 POST /api/sync - Updated tenders with permission validation:', currentData.tenders.length);
        }
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
