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

    // CRITICAL BUSINESS RULE: Validate date field permissions
    if (tenders && Array.isArray(tenders)) {
      const currentTenders = currentData.tenders || [];
      
      // Check each tender for unauthorized date modifications
      for (let i = 0; i < tenders.length; i++) {
        const newTender = tenders[i];
        const existingTender = currentTenders.find(t => t.id === newTender.id);
        
        // If this is an existing tender (edit operation)
        if (existingTender) {
          // Check if user is not admin and dates have been modified
          const userRole = clientUser?.role || 'user';
          
          if (userRole !== 'admin') {
            // Protect critical date fields from non-admin modifications
            const protectedFields = [
              'requestDate',
              'dateOfPriceRequestToVendor', 
              'dateOfPriceReceivedFromVendor'
            ];
            
            let hasUnauthorizedChanges = false;
            const changedFields = [];
            
            for (const field of protectedFields) {
              const existingValue = existingTender[field];
              const newValue = newTender[field];
              
              // Compare dates (handle null/undefined cases)
              const existingDate = existingValue ? new Date(existingValue).getTime() : null;
              const newDate = newValue ? new Date(newValue).getTime() : null;
              
              if (existingDate !== newDate) {
                hasUnauthorizedChanges = true;
                changedFields.push(field);
              }
            }
            
            if (hasUnauthorizedChanges) {
              console.warn(`🚫 SECURITY: Non-admin user attempted to modify protected date fields:`, changedFields);
              console.warn(`User: ${clientUser?.username || 'unknown'}, Role: ${userRole}`);
              
              return NextResponse.json({ 
                success: false,
                error: 'Access Denied: Only administrators can modify Request Date, Date of Price Request to Vendor, and Date of Price Received from Vendor after tender submission.',
                protectedFields: changedFields,
                userRole: userRole
              }, { status: 403 });
            }
          }
        }
      }
    }

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