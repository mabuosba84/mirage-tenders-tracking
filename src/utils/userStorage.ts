import { User } from '@/types'
import { saveUsersToStorage, loadUsersFromStorage } from './centralStorage'

// REMOVED localStorage key - using only central storage
// const USERS_STORAGE_KEY = 'mirage_users'

// Default users that are always available
export const getDefaultUsers = (): User[] => [
  {
    id: '1',
    username: 'admin',
    email: 'admin@miragebs.com',
    name: 'System Administrator',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2025-09-11T08:30:00'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-09-11'),
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
  },
  {
    id: '2',
    username: 'user',
    email: 'user@miragebs.com',
    name: 'Regular User',
    role: 'user',
    isActive: true,
    lastLogin: new Date('2025-09-10T14:20:00'),
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-09-10'),
    createdBy: 'admin',
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
    email: 'basil@miragebs.com',
    name: 'Basil Haddad',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2025-09-18T09:00:00'),
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
    createdBy: 'admin',
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
    email: 'dina@miragebs.com',
    name: 'Dina Tellawi',
    role: 'admin',
    isActive: true,
    lastLogin: new Date('2025-09-18T09:00:00'),
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
    createdBy: 'admin',
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
]

// User credentials storage (in production this would be handled by backend authentication)
export const getUserCredentials = (): Record<string, string> => {
  // DEPRECATED - Use central authority authentication instead
  console.warn('getUserCredentials() is deprecated - use central authority for authentication')
  const defaultCredentials = {
    'admin': 'admin123',
    'user': 'user123',
    'Basil': 'password123',
    'Dina': 'password123',
    'AbuOsba': 'AbuOsba123'
  }
  return defaultCredentials
}

export const setUserCredentials = (credentials: Record<string, string>) => {
  // DEPRECATED - Use central authority for user management instead
  console.warn('setUserCredentials() is deprecated - use central authority for user management')
}

export const getAllUsersAsync = async (): Promise<User[]> => {
  if (typeof window === 'undefined') return getDefaultUsers()
  
  try {
    // Load from central storage ONLY - no localStorage fallback
    const centralUsers = await loadUsersFromStorage()
    if (centralUsers && centralUsers.length > 0) {
      console.log('Loaded users from central storage:', centralUsers.length)
      return centralUsers.map((user: User) => ensureUserPermissions(user))
    }
  } catch (err) {
    console.log('Central storage not available:', err)
  }
  
  // Initialize with default users and save to central storage
  const defaultUsers = getDefaultUsers()
  
  // Save to central storage for future access
  try {
    await saveUsersToStorage(defaultUsers)
    console.log('Saved default users to central storage')
  } catch (err) {
    console.log('Could not save to central storage:', err)
  }
  
  return defaultUsers
}

export const getAllUsers = (): User[] => {
  if (typeof window === 'undefined') return getDefaultUsers()
  
  // This is now deprecated - use getAllUsersAsync() instead
  // Return default users since we can't use async here
  console.warn('getAllUsers() is deprecated - use getAllUsersAsync() for central storage access')
  return getDefaultUsers()
}

export const saveUsers = async (users: User[]) => {
  if (typeof window === 'undefined') return
  
  // Save to central storage ONLY - no localStorage
  try {
    await saveUsersToStorage(users)
    console.log('Saved users to central storage')
  } catch (err) {
    console.error('Could not save users to central storage:', err)
  }
}

export const addUser = (user: User, password: string) => {
  const users = getAllUsers()
  const updatedUsers = [...users, user]
  saveUsers(updatedUsers)
  
  // Save credentials
  const credentials = getUserCredentials()
  credentials[user.username] = password
  setUserCredentials(credentials)
}

export const updateUser = (updatedUser: User) => {
  const users = getAllUsers()
  const index = users.findIndex(u => u.id === updatedUser.id)
  if (index !== -1) {
    users[index] = updatedUser
    saveUsers(users)
  }
}

export const deleteUser = (userId: string) => {
  const users = getAllUsers()
  const userToDelete = users.find(u => u.id === userId)
  if (userToDelete) {
    const updatedUsers = users.filter(u => u.id !== userId)
    saveUsers(updatedUsers)
    
    // Remove credentials
    const credentials = getUserCredentials()
    delete credentials[userToDelete.username]
    setUserCredentials(credentials)
  }
}

// Ensure user has complete permissions structure
const ensureUserPermissions = (user: User): User => {
  const defaultPermissions = {
    canViewCostFromVendor: user.role === 'admin',
    canViewSellingPrice: true,
    canViewProfitMargin: user.role === 'admin',
    canViewTenderItems: true,
    canEditTenders: true,
    canDeleteTenders: user.role === 'admin',
    canViewFinancialReports: user.role === 'admin',
    canManageUsers: user.role === 'admin',
    canExportData: true,
    canViewOptionalFields: true
  }

  return {
    ...user,
    permissions: {
      ...defaultPermissions,
      ...user.permissions
    }
  }
}

export const authenticateUserAsync = async (username: string, password: string): Promise<User | null> => {
  // First try to sync users from central storage
  const users = await getAllUsersAsync()
  const credentials = getUserCredentials()
  
  // Check if user exists and is active
  const user = users.find(u => u.username === username && u.isActive)
  if (!user) return null
  
  // Check password in local credentials first
  if (credentials[username] === password) {
    // Update last login and ensure permissions
    const validatedUser = ensureUserPermissions({
      ...user,
      lastLogin: new Date()
    })
    updateUser(validatedUser)
    return validatedUser
  }
  
  // If not found in local credentials, check if user has server-stored password
  if ('password' in user && (user as any).password === password) {
    // Update last login and ensure permissions
    const validatedUser = ensureUserPermissions({
      ...user,
      lastLogin: new Date()
    })
    updateUser(validatedUser)
    return validatedUser
  }
  
  return null
}

export const authenticateUser = (username: string, password: string): User | null => {
  const users = getAllUsers()
  const credentials = getUserCredentials()
  
  // Check if user exists and is active
  const user = users.find(u => u.username === username && u.isActive)
  if (!user) return null
  
  // Check password in local credentials first
  if (credentials[username] === password) {
    // Update last login and ensure permissions
    const validatedUser = ensureUserPermissions({
      ...user,
      lastLogin: new Date()
    })
    updateUser(validatedUser)
    return validatedUser
  }
  
  // If not found in local credentials, check if user has server-stored password
  if ('password' in user && (user as any).password === password) {
    // Update last login and ensure permissions
    const validatedUser = ensureUserPermissions({
      ...user,
      lastLogin: new Date()
    })
    updateUser(validatedUser)
    return validatedUser
  }
  
  return null
}

export const resetUserPassword = (username: string, newPassword: string): boolean => {
  const users = getAllUsers()
  const user = users.find(u => u.username === username)
  if (!user) return false
  
  // Update credentials
  const credentials = getUserCredentials()
  credentials[username] = newPassword
  setUserCredentials(credentials)
  
  // Update user's updatedAt timestamp
  user.updatedAt = new Date()
  updateUser(user)
  
  return true
}
