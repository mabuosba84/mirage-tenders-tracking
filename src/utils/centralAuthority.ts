// PERMANENT SOLUTION: Centralized Authentication Authority
// Single source of truth for all user authentication and role management
// Prevents role inconsistencies across multiple storage sources

import { User } from '@/types';

interface AuthUser extends User {
  password: string;
  updatedAt: Date;
}

interface AuthenticationResult {
  success: boolean;
  user?: User;
  source: 'server' | 'local' | 'fallback';
  errors?: string[];
}

interface UserValidation {
  isConsistent: boolean;
  conflicts: string[];
  resolvedUser?: User;
}

/**
 * CENTRALIZED USER AUTHORITY - Single source of truth
 * This is the ONLY place where user roles and permissions should be defined
 */
const CENTRAL_USER_AUTHORITY: AuthUser[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'System Administrator',
    email: 'admin@miragebs.com',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastLogin: undefined,
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
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    role: 'user',
    name: 'Regular User',
    email: 'user@miragebs.com',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastLogin: undefined,
    permissions: {
      canViewCostFromVendor: false,
      canViewSellingPrice: true,
      canViewProfitMargin: false,
      canViewTenderItems: true,
      canEditTenders: true,
      canDeleteTenders: false,
      canViewFinancialReports: false,
      canManageUsers: false,
      canExportData: true,
      canViewOptionalFields: true
    }
  },
  {
    id: '3',
    username: 'Basil',
    password: 'password123',
    role: 'admin',
    name: 'Basil Haddad',
    email: 'basil@miragebs.com',
    isActive: true,
    createdAt: new Date('2025-09-18T00:00:00.000Z'),
    updatedAt: new Date('2025-09-18T00:00:00.000Z'),
    lastLogin: undefined,
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
  },
  {
    id: '4',
    username: 'Dina',
    password: 'password123',
    role: 'admin',
    name: 'Dina Tellawi',
    email: 'dina@miragebs.com',
    isActive: true,
    createdAt: new Date('2025-09-18T00:00:00.000Z'),
    updatedAt: new Date('2025-09-18T00:00:00.000Z'),
    lastLogin: undefined,
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
  }
];

/**
 * Get the authoritative user definition - SINGLE SOURCE OF TRUTH
 */
export const getAuthoritativeUser = (username: string): AuthUser | null => {
  const user = CENTRAL_USER_AUTHORITY.find(u => u.username === username);
  if (!user) return null;

  // Return a deep copy to prevent mutations
  return JSON.parse(JSON.stringify(user));
};

/**
 * Validate user across multiple storage sources and resolve conflicts
 */
export const validateUserConsistency = async (username: string): Promise<UserValidation> => {
  const authoritativeUser = getAuthoritativeUser(username);
  if (!authoritativeUser) {
    return {
      isConsistent: false,
      conflicts: [`User ${username} not found in central authority`],
    };
  }

  const conflicts: string[] = [];
  let serverUser: User | null = null;
  let localUsers: User[] = [];

  // Check server storage
  try {
    const response = await fetch('/api/sync');
    if (response.ok) {
      const data = await response.json();
      serverUser = data.users?.find((u: User) => u.username === username) || null;
    }
  } catch (error) {
    console.warn('Could not validate server user consistency:', error);
  }

  // Check local storage
  try {
    const localData = localStorage.getItem('mirage_users');
    if (localData) {
      localUsers = JSON.parse(localData);
    }
  } catch (error) {
    console.warn('Could not validate local user consistency:', error);
  }

  // Compare roles and permissions
  if (serverUser && serverUser.role !== authoritativeUser.role) {
    conflicts.push(`Server role mismatch: ${serverUser.role} vs ${authoritativeUser.role}`);
  }

  const localUser = localUsers.find(u => u.username === username);
  if (localUser && localUser.role !== authoritativeUser.role) {
    conflicts.push(`Local role mismatch: ${localUser.role} vs ${authoritativeUser.role}`);
  }

  return {
    isConsistent: conflicts.length === 0,
    conflicts,
    resolvedUser: authoritativeUser
  };
};

/**
 * PERMANENT AUTHENTICATION - Always returns consistent user data
 */
export const authenticateUserPermanent = async (username: string, password: string): Promise<AuthenticationResult> => {
  console.log('🔒 PERMANENT AUTH: Starting authentication for', username);

  // Step 1: Get authoritative user definition
  const authoritativeUser = getAuthoritativeUser(username);
  if (!authoritativeUser) {
    return {
      success: false,
      source: 'fallback',
      errors: ['User not found in central authority']
    };
  }

  // Step 2: Validate password
  if (authoritativeUser.password !== password) {
    return {
      success: false,
      source: 'fallback',
      errors: ['Invalid password']
    };
  }

  // Step 3: Validate consistency across storage sources
  const validation = await validateUserConsistency(username);
  if (!validation.isConsistent) {
    console.warn('⚠️ User consistency issues detected:', validation.conflicts);
    
    // Auto-sync to fix inconsistencies
    await synchronizeUserToAllSources(authoritativeUser);
  }

  // Step 4: Return the authoritative user with updated last login (removing password)
  const { password: _, ...userWithoutPassword } = authoritativeUser;
  const authenticatedUser: User = {
    ...userWithoutPassword,
    lastLogin: new Date()
  };

  console.log('✅ PERMANENT AUTH SUCCESS:', {
    username: authenticatedUser.username,
    role: authenticatedUser.role,
    source: 'central-authority',
    consistencyCheck: validation.isConsistent ? 'PASSED' : 'FIXED'
  });

  return {
    success: true,
    user: authenticatedUser,
    source: 'server',
    errors: validation.conflicts.length > 0 ? ['Inconsistencies detected and auto-fixed'] : undefined
  };
};

/**
 * Synchronize authoritative user data to all storage sources
 */
export const synchronizeUserToAllSources = async (user: User): Promise<void> => {
  console.log('🔄 SYNC: Synchronizing user to all sources:', user.username);

  // Sync to localStorage
  try {
    const localUsers: User[] = JSON.parse(localStorage.getItem('mirage_users') || '[]');
    const userIndex = localUsers.findIndex(u => u.username === user.username);
    
    if (userIndex >= 0) {
      localUsers[userIndex] = { ...user };
    } else {
      localUsers.push({ ...user });
    }
    
    localStorage.setItem('mirage_users', JSON.stringify(localUsers));
    console.log('✅ SYNC: Local storage updated');
  } catch (error) {
    console.error('❌ SYNC: Failed to update local storage:', error);
  }

  // Sync to server
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: [user],
        syncType: 'user-consistency-fix'
      })
    });

    if (response.ok) {
      console.log('✅ SYNC: Server storage updated');
    } else {
      console.warn('⚠️ SYNC: Server update failed');
    }
  } catch (error) {
    console.error('❌ SYNC: Failed to update server storage:', error);
  }
};

/**
 * Get all authoritative users
 */
export const getAllAuthoritativeUsers = (): User[] => {
  return JSON.parse(JSON.stringify(CENTRAL_USER_AUTHORITY));
};

/**
 * Add new user to central authority (for UserManagement component)
 */
export const addUserToCentralAuthority = (user: User, password: string): void => {
  const authUser: AuthUser = { ...user, password };
  const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.username === user.username);
  if (existingIndex >= 0) {
    CENTRAL_USER_AUTHORITY[existingIndex] = authUser;
  } else {
    CENTRAL_USER_AUTHORITY.push(authUser);
  }
  
  // Auto-sync to all sources
  synchronizeUserToAllSources(user);
};

/**
 * Update user in central authority
 */
export const updateUserInCentralAuthority = (user: User, password?: string): void => {
  const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    const existingUser = CENTRAL_USER_AUTHORITY[existingIndex];
    const authUser: AuthUser = { 
      ...user, 
      password: password || existingUser.password // Keep existing password if not provided
    };
    CENTRAL_USER_AUTHORITY[existingIndex] = authUser;
    
    // Auto-sync to all sources
    synchronizeUserToAllSources(user);
  }
};
