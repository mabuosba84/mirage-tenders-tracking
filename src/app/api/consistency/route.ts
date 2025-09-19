import { NextRequest, NextResponse } from 'next/server';
import { validateUserConsistency, getAllAuthoritativeUsers, synchronizeUserToAllSources } from '../../../utils/centralAuthority';

export async function GET(request: NextRequest) {
  console.log('🔍 CONSISTENCY CHECK: Starting validation of all users');
  
  try {
    const authoritativeUsers = await getAllAuthoritativeUsers();
    const validationResults = [];
    let totalInconsistencies = 0;
    
    // Validate each user for consistency
    for (const user of authoritativeUsers) {
      const validation = await validateUserConsistency(user.username);
      validationResults.push({
        username: user.username,
        role: user.role,
        isConsistent: validation.isConsistent,
        conflicts: validation.conflicts
      });
      
      if (!validation.isConsistent) {
        totalInconsistencies++;
      }
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      totalUsers: authoritativeUsers.length,
      consistentUsers: authoritativeUsers.length - totalInconsistencies,
      inconsistentUsers: totalInconsistencies,
      validationResults,
      status: totalInconsistencies === 0 ? 'ALL_CONSISTENT' : 'INCONSISTENCIES_DETECTED'
    };
    
    console.log('✅ CONSISTENCY CHECK: Completed validation', response);
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ CONSISTENCY CHECK: Error during validation:', error);
    return NextResponse.json({ 
      error: 'Consistency check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 CONSISTENCY FIX: Starting auto-fix of all users');
  
  try {
    const { autoFix } = await request.json();
    
    if (!autoFix) {
      return NextResponse.json({ 
        error: 'Missing autoFix parameter',
        message: 'Set autoFix: true to enable automatic consistency fixes',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const authoritativeUsers = await getAllAuthoritativeUsers();
    const fixResults = [];
    let totalFixed = 0;
    
    // Fix inconsistencies for each user
    for (const user of authoritativeUsers) {
      try {
        const validation = await validateUserConsistency(user.username);
        
        if (!validation.isConsistent) {
          await synchronizeUserToAllSources(user);
          fixResults.push({
            username: user.username,
            role: user.role,
            fixed: true,
            conflicts: validation.conflicts
          });
          totalFixed++;
        } else {
          fixResults.push({
            username: user.username,
            role: user.role,
            fixed: false,
            conflicts: []
          });
        }
      } catch (userError) {
        fixResults.push({
          username: user.username,
          role: user.role,
          fixed: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      totalUsers: authoritativeUsers.length,
      usersFixed: totalFixed,
      fixResults,
      status: totalFixed > 0 ? 'INCONSISTENCIES_FIXED' : 'NO_FIXES_NEEDED'
    };
    
    console.log('✅ CONSISTENCY FIX: Completed auto-fix', response);
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ CONSISTENCY FIX: Error during auto-fix:', error);
    return NextResponse.json({ 
      error: 'Auto-fix failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}