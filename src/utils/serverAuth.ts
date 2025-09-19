/**
 * Server-side authentication and authorization utilities
 * Provides secure user validation for API endpoints
 */

import { NextRequest } from 'next/server'
import { User } from '@/types'

/**
 * Extract user information from request headers
 * In production, this should validate JWT tokens or session cookies
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    // Get user from Authorization header or session
    const authHeader = request.headers.get('Authorization')
    const userHeader = request.headers.get('X-Current-User')
    
    if (userHeader) {
      try {
        const user = JSON.parse(userHeader)
        // Basic validation
        if (user.id && user.username && user.role) {
          return user as User
        }
      } catch (error) {
        console.error('Failed to parse user header:', error)
      }
    }
    
    // In production, implement proper JWT/session validation here
    // For now, we'll require the client to send user info in headers
    
    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Check if user can edit/delete a specific tender
 */
export function canUserModifyTender(user: User, tenderUserId: string): boolean {
  // Admin can modify any tender
  if (user.role === 'admin') {
    return true
  }
  
  // Users can only modify their own tenders
  return user.username === tenderUserId
}

/**
 * Check if user can view specific fields based on permissions
 */
export function canUserViewField(user: User, fieldType: 'cost' | 'price' | 'margin' | 'items' | 'optional'): boolean {
  switch (fieldType) {
    case 'cost':
      return user.permissions?.canViewCostFromVendor || false
    case 'price':
      return user.permissions?.canViewSellingPrice || false
    case 'margin':
      return user.permissions?.canViewProfitMargin || false
    case 'items':
      return user.permissions?.canViewTenderItems || false
    case 'optional':
      return user.permissions?.canViewOptionalFields || false
    default:
      return false
  }
}

/**
 * Validate user permissions for specific actions
 */
export function validateUserPermission(user: User, action: 'edit' | 'delete' | 'view' | 'manage_users' | 'export'): boolean {
  switch (action) {
    case 'edit':
      return user.permissions?.canEditTenders || false
    case 'delete':
      return user.permissions?.canDeleteTenders || false
    case 'view':
      return true // All authenticated users can view
    case 'manage_users':
      return user.permissions?.canManageUsers || false
    case 'export':
      return user.permissions?.canExportData || false
    default:
      return false
  }
}

/**
 * Create authentication response for unauthorized access
 */
export function createUnauthorizedResponse(message: string = 'Authentication required') {
  return Response.json(
    { 
      error: 'Unauthorized', 
      message,
      timestamp: new Date().toISOString()
    }, 
    { status: 401 }
  )
}

/**
 * Create forbidden response for insufficient permissions
 */
export function createForbiddenResponse(message: string = 'Insufficient permissions') {
  return Response.json(
    { 
      error: 'Forbidden', 
      message,
      timestamp: new Date().toISOString()
    }, 
    { status: 403 }
  )
}