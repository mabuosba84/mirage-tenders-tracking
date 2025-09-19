import { NextRequest, NextResponse } from 'next/server';
import { readPersistentData, writePersistentData } from '../../../utils/persistentStorage';
import { getCurrentUserFromRequest, validateUserPermission, createUnauthorizedResponse, canUserModifyTender } from '../../../utils/serverAuth';

export async function GET(request: NextRequest) {
  console.log('GET /api/sync - Starting with PERSISTENT STORAGE');
  
  try {
    // TEMPORARY: Allow access without authentication to prevent data loss
    console.log('Loading all data without authentication filtering');

    // Read from persistent file storage
    const persistentData = await readPersistentData();
    
    // Return all data temporarily (will add proper auth later)
    const response = {
      ...persistentData,
      requestTime: new Date().toISOString(),
      message: 'Data loaded successfully (authentication temporarily disabled)'
    };

    console.log('Sync data prepared - Total tenders:', persistentData.tenders?.length || 0);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/sync:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      tenders: [],
      users: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/sync - Receiving data (authentication temporarily disabled)');
  
  try {
    console.log('Processing POST request without authentication checks');

    const requestData = await request.json();
    const { users, tenders, currentUser: clientUser } = requestData;

    // TEMPORARY: Skip authentication validation to prevent data loss
    console.log('Saving data without authentication validation');

    // Read current persistent data
    const currentData = await readPersistentData();

    // Prepare data to save
    const dataToSave = {
      tenders: tenders || currentData.tenders,
      users: users || currentData.users,
      files: currentData.files,
      settings: {
        ...currentData.settings,
        lastUpdated: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    await writePersistentData(dataToSave);
    
    console.log('Persistent data updated successfully');
    console.log('Tenders:', dataToSave.tenders?.length || 0);
    console.log('Users:', dataToSave.users?.length || 0);

    return NextResponse.json({ 
      success: true,
      message: 'Data synchronized successfully (authentication temporarily disabled)',
      syncTime: dataToSave.lastUpdated
    });

  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}