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

// Default users that are always available as fallback
const getDefaultUserAuthority = (): AuthUser[] => [
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
    createdAt: new Date('2025-02-15T00:00:00.000Z'),
    updatedAt: new Date('2025-09-10T00:00:00.000Z'),
    lastLogin: undefined,
    permissions: {
      canViewCostFromVendor: false,
      canViewSellingPrice: false,
      canViewProfitMargin: false,
      canViewTenderItems: false,
      canEditTenders: false,
      canDeleteTenders: false,
      canViewFinancialReports: false,
      canManageUsers: false,
      canExportData: false,
      canViewOptionalFields: false
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
  },
  {
    id: '5',
    username: 'AbuOsba',
    password: 'password123',
    role: 'admin',
    name: 'Mohammad AbuOsba',
    email: 'm.abuosba@miragebs.com',
    isActive: true,
    createdAt: new Date('2025-09-19T00:00:00.000Z'),
    updatedAt: new Date('2025-09-19T00:00:00.000Z'),
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
 * Initialize central authority from localStorage or use defaults
 * This ensures role changes persist across page refreshes
 */
const initializeCentralAuthority = (): AuthUser[] => {
  if (typeof window === 'undefined') {
    return getDefaultUserAuthority(); // Server-side fallback
  }

  try {
    // Try to load from stored central authority data first
    const storedAuthority = localStorage.getItem('mirage_central_authority');
    if (storedAuthority) {
      const parsed = JSON.parse(storedAuthority);
      console.log('🔄 CENTRAL AUTHORITY: Loaded from localStorage:', parsed.length, 'users');
      return parsed;
    }

    // If no central authority data, try to load from regular user storage
    const storedUsers = localStorage.getItem('mirage_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      console.log('🔄 CENTRAL AUTHORITY: Migrating from user storage:', users.length, 'users');
      
      // Convert users to AuthUser format (need to add passwords)
      const defaults = getDefaultUserAuthority();
      const authUsers = users.map((user: User) => {
        const defaultUser = defaults.find(d => d.username === user.username);
        return {
          ...user,
          password: defaultUser?.password || 'password123' // Use default or fallback password
        };
      });
      
      // Save to central authority storage
      localStorage.setItem('mirage_central_authority', JSON.stringify(authUsers));
      return authUsers;
    }

    console.log('🔄 CENTRAL AUTHORITY: Using default users');
    const defaults = getDefaultUserAuthority();
    localStorage.setItem('mirage_central_authority', JSON.stringify(defaults));
    return defaults;
  } catch (error) {
    console.error('❌ CENTRAL AUTHORITY: Error initializing, using defaults:', error);
    return getDefaultUserAuthority();
  }
};

// SINGLE SOURCE OF TRUTH - now loads from localStorage if available
let CENTRAL_USER_AUTHORITY: AuthUser[] = initializeCentralAuthority();

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
 * Clear any existing sessions for a user to ensure fresh login data
 */
export const clearUserSessions = async (username: string): Promise<void> => {
  try {
    console.log('🧹 CLEARING SESSIONS: Removing cached sessions for', username);
    const response = await fetch('/api/current-user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    if (response.ok) {
      console.log('✅ SESSIONS CLEARED: Successfully cleared sessions for', username);
    } else {
      console.warn('⚠️ SESSIONS CLEAR: Failed to clear sessions for', username);
    }
  } catch (error) {
    console.warn('⚠️ SESSIONS CLEAR: Error clearing sessions:', error);
  }
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

  // Step 4: Clear any existing sessions for this user to ensure fresh data
  await clearUserSessions(username);

  // Step 5: Return the authoritative user with updated last login (removing password)
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
  const authUser: AuthUser = { ...user, password, updatedAt: new Date() };
  const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.username === user.username);
  if (existingIndex >= 0) {
    CENTRAL_USER_AUTHORITY[existingIndex] = authUser;
    console.log('✅ CENTRAL AUTHORITY: Updated existing user:', user.username);
  } else {
    CENTRAL_USER_AUTHORITY.push(authUser);
    console.log('✅ CENTRAL AUTHORITY: Added new user:', user.username);
  }
  
  // IMMEDIATELY sync to localStorage for persistence
  const allUsers = CENTRAL_USER_AUTHORITY.map(u => {
    const { password: _, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
  localStorage.setItem('mirage_users', JSON.stringify(allUsers));
  
  // Auto-sync to server
  synchronizeUserToAllSources(user);
};

/**
 * Update user in central authority
 */
export const updateUserInCentralAuthority = (user: User, password?: string): void => {
  const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.id === user.id || u.username === user.username);
  if (existingIndex >= 0) {
    const existingUser = CENTRAL_USER_AUTHORITY[existingIndex];
    const authUser: AuthUser = { 
      ...user, 
      password: password || existingUser.password,
      updatedAt: new Date()
    };
    CENTRAL_USER_AUTHORITY[existingIndex] = authUser;
    console.log('✅ CENTRAL AUTHORITY: Updated user permissions:', user.username, user.permissions);
    
    // IMMEDIATELY sync to BOTH localStorage keys for persistence
    // 1. Save to central authority storage (with passwords)
    localStorage.setItem('mirage_central_authority', JSON.stringify(CENTRAL_USER_AUTHORITY));
    
    // 2. Save to user storage (without passwords for compatibility)
    const allUsers = CENTRAL_USER_AUTHORITY.map(u => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    localStorage.setItem('mirage_users', JSON.stringify(allUsers));
    
    // Auto-sync to server
    synchronizeUserToAllSources(user);
  } else {
    console.error('❌ CENTRAL AUTHORITY: User not found for update:', user.username);
  }
};

/**
 * Delete user from central authority
 */
export const deleteUserFromCentralAuthority = (userId: string): boolean => {
  const userIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.id === userId);
  if (userIndex >= 0) {
    const removedUser = CENTRAL_USER_AUTHORITY.splice(userIndex, 1)[0];
    console.log('✅ CENTRAL AUTHORITY: Deleted user:', removedUser.username);
    
    // IMMEDIATELY sync to localStorage
    const allUsers = CENTRAL_USER_AUTHORITY.map(u => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    localStorage.setItem('mirage_users', JSON.stringify(allUsers));
    
    return true;
  }
  return false;
};
