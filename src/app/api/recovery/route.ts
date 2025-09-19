import { NextRequest, NextResponse } from 'next/server';
import { readPersistentData } from '../../../utils/persistentStorage';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  console.log('🔍 EMERGENCY DATA RECOVERY - Searching for missing leads');
  
  try {
    // Read current persistent data
    const currentData = await readPersistentData();
    console.log('📊 Current persistent data contains:', currentData.tenders?.length || 0, 'tenders');
    
    // Also check if there are any backup files
    const dataDir = path.join(process.cwd(), 'data');
    let backupFiles = [];
    
    try {
      const files = await fs.readdir(dataDir);
      backupFiles = files.filter(file => file.includes('backup') || file.includes('persistent'));
      console.log('📁 Found data files:', backupFiles);
    } catch (error) {
      console.log('📁 No data directory found or empty');
    }
    
    // Return all available data for recovery
    return NextResponse.json({
      success: true,
      currentTenders: currentData.tenders || [],
      currentUsers: currentData.users || [],
      tenderCount: currentData.tenders?.length || 0,
      userCount: currentData.users?.length || 0,
      backupFiles: backupFiles,
      lastUpdated: currentData.lastUpdated,
      message: 'Data recovery scan complete'
    });

  } catch (error) {
    console.error('❌ Error in data recovery:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to recover data',
      details: error instanceof Error ? error.message : 'Unknown error',
      currentTenders: [],
      currentUsers: [],
      tenderCount: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔧 EMERGENCY DATA RESTORE - Restoring provided data');
  
  try {
    const { tenders, users, source } = await request.json();
    
    const currentData = await readPersistentData();
    
    const dataToSave = {
      tenders: tenders || currentData.tenders || [],
      users: users || currentData.users || [],
      files: currentData.files || [],
      settings: {
        ...currentData.settings,
        lastUpdated: new Date().toISOString(),
        restoredFrom: source || 'manual'
      },
      lastUpdated: new Date().toISOString()
    };

    // Write the restored data
    const { writePersistentData } = await import('../../../utils/persistentStorage');
    await writePersistentData(dataToSave);
    
    console.log('✅ Data restored successfully');
    console.log('📊 Restored tenders:', dataToSave.tenders.length);
    console.log('👥 Restored users:', dataToSave.users.length);

    return NextResponse.json({ 
      success: true,
      message: 'Data restored successfully',
      tenderCount: dataToSave.tenders.length,
      userCount: dataToSave.users.length,
      restoredAt: dataToSave.lastUpdated
    });

  } catch (error) {
    console.error('❌ Error restoring data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to restore data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}