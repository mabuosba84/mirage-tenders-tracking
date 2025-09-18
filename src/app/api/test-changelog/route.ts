import { NextRequest, NextResponse } from 'next/server';
import { logChange } from '@/utils/changeLogUtils';

// Test endpoint to manually trigger change logging
export async function POST(request: NextRequest) {
  console.log('🧪 TEST CHANGELOG: Starting test');
  
  try {
    // Create a test user object
    const testUser = {
      id: 'test-user-id',
      username: 'test-user',
      role: 'admin' as const,
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      permissions: {
        canViewCostFromVendor: true,
        canViewSellingPrice: true,
        canViewProfitMargin: true,
        canViewTenderItems: true,
        canEditTenders: true,
        canDeleteTenders: true,
        canViewFinancialReports: true,
        canManageUsers: true,
        canExportData: true,
        canViewOptionalFields: true
      }
    };

    console.log('🧪 TEST CHANGELOG: Calling logChange...');
    
    // Test the change logging
    await logChange(testUser, 'CREATE', 'TENDER', {
      entityId: 'test-tender-123',
      entityName: 'Test Tender for Logging',
      details: 'Manual test of change logging system'
    });

    console.log('🧪 TEST CHANGELOG: logChange call completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Change log test completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 TEST CHANGELOG: Error during test:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint to retrieve logs for testing
export async function GET() {
  try {
    console.log('🧪 TEST CHANGELOG: Fetching logs...');
    
    const response = await fetch('http://localhost:3000/api/changelog');
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        logs: data.logs,
        total: data.total,
        message: 'Logs retrieved successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch logs',
        status: response.status
      });
    }
  } catch (error) {
    console.error('🧪 TEST CHANGELOG: Error fetching logs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}