import { NextRequest, NextResponse } from 'next/server';
import { ChangeLogEntry } from '@/types';
import fs from 'fs';
import path from 'path';

// Change log storage path
const getChangeLogPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'changelog.json');
};

// Read change logs from file
const readChangeLogs = (): ChangeLogEntry[] => {
  try {
    const changeLogPath = getChangeLogPath();
    if (fs.existsSync(changeLogPath)) {
      const data = fs.readFileSync(changeLogPath, 'utf-8');
      const logs = JSON.parse(data);
      // Convert timestamp strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    }
  } catch (error) {
    console.error('Error reading change logs:', error);
  }
  return [];
};

// Write change logs to file
const writeChangeLogs = (logs: ChangeLogEntry[]): void => {
  try {
    const changeLogPath = getChangeLogPath();
    fs.writeFileSync(changeLogPath, JSON.stringify(logs, null, 2));
    console.log('✅ Change logs saved to file:', logs.length, 'entries');
  } catch (error) {
    console.error('❌ Error writing change logs:', error);
    throw error;
  }
};

// Add a new change log entry
const addChangeLogEntry = (entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>): ChangeLogEntry => {
  const logs = readChangeLogs();
  
  const newEntry: ChangeLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  };
  
  logs.push(newEntry);
  
  // Keep only the last 10,000 entries to prevent file from growing too large
  if (logs.length > 10000) {
    logs.splice(0, logs.length - 10000);
  }
  
  writeChangeLogs(logs);
  console.log('📝 New change log entry added:', newEntry.action, newEntry.entity, 'by', newEntry.username);
  
  return newEntry;
};

// GET: Retrieve change logs
export async function GET(request: NextRequest) {
  console.log('🔄 GET /api/changelog - Retrieving change logs');
  
  try {
    const logs = readChangeLogs();
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '1000');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const entity = url.searchParams.get('entity');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    let filteredLogs = [...logs];
    
    // Apply filters
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (entity) {
      filteredLogs = filteredLogs.filter(log => log.entity === entity);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end date
      filteredLogs = filteredLogs.filter(log => log.timestamp <= end);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    const response = {
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
      hasMore: offset + limit < filteredLogs.length
    };
    
    console.log('✅ GET /api/changelog - Success:', paginatedLogs.length, 'logs returned');
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ GET /api/changelog - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve change logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: Add new change log entry
export async function POST(request: NextRequest) {
  console.log('🔄 POST /api/changelog - Adding new change log entry');
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.username || !body.action || !body.entity) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['userId', 'username', 'action', 'entity'],
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Add IP address and user agent if available
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const entryData: Omit<ChangeLogEntry, 'id' | 'timestamp'> = {
      userId: body.userId,
      username: body.username,
      userRole: body.userRole || 'user',
      action: body.action,
      entity: body.entity,
      entityId: body.entityId,
      entityName: body.entityName,
      changes: body.changes,
      details: body.details,
      ipAddress,
      userAgent
    };
    
    const newEntry = addChangeLogEntry(entryData);
    
    console.log('✅ POST /api/changelog - Success: Entry added with ID', newEntry.id);
    return NextResponse.json({ 
      success: true,
      entry: newEntry,
      message: 'Change log entry added successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ POST /api/changelog - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to add change log entry',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE: Clear old change log entries (admin only)
export async function DELETE(request: NextRequest) {
  console.log('🔄 DELETE /api/changelog - Clearing old change log entries');
  
  try {
    const body = await request.json();
    
    // Basic admin check (in a real app, you'd verify the user's token)
    if (!body.isAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Only administrators can clear change logs',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }
    
    const logs = readChangeLogs();
    const daysToKeep = body.daysToKeep || 90; // Default to 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
    const removedCount = logs.length - filteredLogs.length;
    
    writeChangeLogs(filteredLogs);
    
    console.log('✅ DELETE /api/changelog - Success: Removed', removedCount, 'old entries');
    return NextResponse.json({ 
      success: true,
      removedCount,
      remainingCount: filteredLogs.length,
      message: `Removed ${removedCount} entries older than ${daysToKeep} days`
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ DELETE /api/changelog - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear change logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}