import { NextRequest, NextResponse } from 'next/server';
import { readPersistentData, writePersistentData } from '../../../utils/persistentStorage';
import { getAllAuthoritativeUsers } from '../../../utils/centralAuthority';
import { User } from '../../../types';

/**
 * SIMPLE USER MANAGEMENT API
 * Uses central authority as single source of truth
 */

export async function GET(request: NextRequest) {
  console.log('🔍 GET /api/users - Loading users from CENTRAL AUTHORITY');
  
  try {
    // Get users from central authority (single source of truth)
    const users = getAllAuthoritativeUsers();
    
    console.log('✅ CENTRAL AUTHORITY: Loaded', users.length, 'users -', users.map(u => u.username).join(', '));
    return NextResponse.json({
      success: true,
      users: users,
      source: 'central-authority',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error loading users from central authority:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to load users',
      users: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('💾 POST /api/users - Saving users to persistent storage');
  
  try {
    const { users } = await request.json();
    
    if (!Array.isArray(users)) {
      return NextResponse.json({
        success: false,
        error: 'Users must be an array'
      }, { status: 400 });
    }

    // Read current data
    const currentData = await readPersistentData();
    
    // Update users in persistent storage
    const updatedData = {
      ...currentData,
      users: users,
      lastUpdated: new Date().toISOString()
    };
    
    // Write to persistent storage
    await writePersistentData(updatedData);
    
    console.log('✅ Successfully saved users to persistent storage:', users.length);
    
    return NextResponse.json({
      success: true,
      message: 'Users saved successfully',
      userCount: users.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error saving users:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to save users'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('🔄 PUT /api/users - Updating specific user');
  
  try {
    const { user } = await request.json();
    
    if (!user || !user.id) {
      return NextResponse.json({
        success: false,
        error: 'User object with ID required'
      }, { status: 400 });
    }

    // Read current data
    const currentData = await readPersistentData();
    const users = currentData.users || [];
    
    // Find and update the user
    const userIndex = users.findIndex((u: User) => u.id === user.id);
    
    if (userIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Update the user
    users[userIndex] = {
      ...user,
      updatedAt: new Date()
    };
    
    // Save updated data
    const updatedData = {
      ...currentData,
      users: users,
      lastUpdated: new Date().toISOString()
    };
    
    await writePersistentData(updatedData);
    
    console.log('✅ Successfully updated user:', user.username, 'Role:', user.role);
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: users[userIndex],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update user'
    }, { status: 500 });
  }
}