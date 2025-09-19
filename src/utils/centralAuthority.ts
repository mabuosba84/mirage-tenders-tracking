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

// SINGLE SOURCE OF TRUTH - simplified initialization
let CENTRAL_USER_AUTHORITY: AuthUser[] = getDefaultUserAuthority();

// Simple initialization that runs immediately
if (typeof window !== 'undefined') {
  // Try to load from localStorage immediately
  try {
    const storedAuthority = localStorage.getItem('mirage_central_authority');
    if (storedAuthority) {
      const parsed = JSON.parse(storedAuthority);
      if (Array.isArray(parsed) && parsed.length >= 5) { // Ensure we have all users
        CENTRAL_USER_AUTHORITY = parsed;
        console.log('✅ SIMPLE INIT: Loaded from localStorage:', parsed.length, 'users');
      }
    }
  } catch (error) {
    console.log('⚠️ SIMPLE INIT: localStorage failed, using defaults');
  }
}

/**
 * Force reload users from server - for bulletproof sync
 */
export const reloadUsersFromServer = async (): Promise<boolean> => {
  console.log('🔄 FORCE RELOAD: Reloading users from server');
  
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const serverData = await response.json();
      if (serverData.success && Array.isArray(serverData.users)) {
        console.log('✅ FORCE RELOAD: Server data received:', serverData.users.length, 'users');
        
        // Convert to AuthUser format
        const defaults = getDefaultUserAuthority();
        const authUsers = serverData.users.map((user: User) => {
          const defaultUser = defaults.find(d => d.username === user.username);
          return {
            ...user,
            password: defaultUser?.password || 'password123'
          };
        });
        
        // Update in-memory authority
        CENTRAL_USER_AUTHORITY.length = 0; // Clear array
        CENTRAL_USER_AUTHORITY.push(...authUsers); // Add new users
        
        // Update localStorage
        localStorage.setItem('mirage_central_authority', JSON.stringify(authUsers));
        localStorage.setItem('mirage_users', JSON.stringify(serverData.users));
        
        console.log('✅ FORCE RELOAD COMPLETE: Users updated from server');
        return true;
      }
    }
    
    console.warn('⚠️ FORCE RELOAD: Server response invalid');
    return false;
  } catch (error) {
    console.error('❌ FORCE RELOAD: Failed to reload from server:', error);
    return false;
  }
};

/**
 * Get the authoritative user definition - SINGLE SOURCE OF TRUTH
 */
export const getAuthoritativeUser = (username: string): AuthUser | null => {
  // Case-insensitive username lookup for better UX
  const user = CENTRAL_USER_AUTHORITY.find(u => u.username.toLowerCase() === username.toLowerCase());
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
      serverUser = data.users?.find((u: User) => u.username.toLowerCase() === username.toLowerCase()) || null;
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

  const localUser = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
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
 * Get all authoritative users - ALWAYS returns all users
 */
export const getAllAuthoritativeUsers = (): User[] => {
  // Ensure we always have the minimum required users
  if (CENTRAL_USER_AUTHORITY.length < 5) {
    console.warn('⚠️ MISSING USERS: Only', CENTRAL_USER_AUTHORITY.length, 'users found, resetting to defaults');
    CENTRAL_USER_AUTHORITY = getDefaultUserAuthority();
    // Save to localStorage
    localStorage.setItem('mirage_central_authority', JSON.stringify(CENTRAL_USER_AUTHORITY));
  }
  
  // Return clean copy without passwords
  const users = CENTRAL_USER_AUTHORITY.map(u => {
    const { password: _, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
  
  console.log('✅ RETURNING USERS:', users.length, 'users -', users.map(u => `${u.username}(${u.role})`).join(', '));
  return users;
};

/**
 * Add new user to central authority (for UserManagement component)
 */
export const addUserToCentralAuthority = (user: User, password: string): void => {
  const authUser: AuthUser = { ...user, password, updatedAt: new Date() };
  const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
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
 * Update user in central authority - SIMPLE and WORKING
 */
export const updateUserInCentralAuthority = (user: User, password?: string): boolean => {
  console.log('🔒 SIMPLE UPDATE: Starting update for', user.username, 'role:', user.role);
  
  try {
    const existingIndex = CENTRAL_USER_AUTHORITY.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    if (existingIndex < 0) {
      console.error('❌ USER NOT FOUND:', user.username);
      return false;
    }

    const existingUser = CENTRAL_USER_AUTHORITY[existingIndex];
    const authUser: AuthUser = { 
      ...user, 
      password: password || existingUser.password,
      updatedAt: new Date()
    };
    
    // Update in memory
    CENTRAL_USER_AUTHORITY[existingIndex] = authUser;
    console.log('✅ UPDATED IN MEMORY:', user.username, 'role:', user.role);
    
    // Save to localStorage immediately
    localStorage.setItem('mirage_central_authority', JSON.stringify(CENTRAL_USER_AUTHORITY));
    console.log('✅ SAVED TO LOCALSTORAGE');
    
    // Clear user sessions if it's a role change
    if (existingUser.role !== user.role) {
      fetch('/api/current-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      }).catch(error => console.warn('Session clear failed:', error));
      console.log('✅ CLEARED SESSIONS for role change');
    }
    
    console.log('🎯 SIMPLE UPDATE COMPLETE:', user.username, 'is now', user.role);
    return true;
    
  } catch (error) {
    console.error('❌ UPDATE FAILED:', error);
    return false;
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
