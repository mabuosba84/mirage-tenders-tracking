import { User } from '@/types'
import { saveUsersToStorage, loadUsersFromStorage } from './centralStorage'

const USERS_STORAGE_KEY = 'mirage_users'

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
    role: 'user',
    isActive: true,
    lastLogin: new Date('2025-09-18T09:00:00'),
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
    createdBy: 'admin',
    permissions: {
      canViewCostFromVendor: false,
      canViewSellingPrice: true,
      canViewProfitMargin: false,
      canViewTenderItems: true,
      canEditTenders: true,
      canDeleteTenders: false,
      canViewFinancialReports: false,
      canManageUsers: false,
      canExportData: false,
      canViewOptionalFields: true
    }
  }
]

// User credentials storage (in production this would be handled by backend authentication)
export const getUserCredentials = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  
  const stored = localStorage.getItem('mirage_user_credentials')
  const defaultCredentials = {
    'admin': 'admin123',
    'user': 'user123',
    'Basil': 'password123',
    'Dina': 'password123'
  }
  
  if (stored) {
    return { ...defaultCredentials, ...JSON.parse(stored) }
  }
  
  return defaultCredentials
}

export const setUserCredentials = (credentials: Record<string, string>) => {
  if (typeof window === 'undefined') return
  
  const current = getUserCredentials()
  const updated = { ...current, ...credentials }
  localStorage.setItem('mirage_user_credentials', JSON.stringify(updated))
}

export const getAllUsersAsync = async (): Promise<User[]> => {
  if (typeof window === 'undefined') return getDefaultUsers()
  
  try {
    // Try to load from central storage first (for cross-device sync)
    const centralUsers = await loadUsersFromStorage()
    if (centralUsers && centralUsers.length > 0) {
      console.log('Loaded users from central storage:', centralUsers.length)
      // Store in localStorage for immediate access
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(centralUsers))
      return centralUsers.map((user: User) => ensureUserPermissions(user))
    }
  } catch (err) {
    console.log('Central storage not available, using localStorage:', err)
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(USERS_STORAGE_KEY)
  if (stored) {
    const users = JSON.parse(stored)
    return users.map((user: User) => ensureUserPermissions(user))
  }
  
  // Initialize with default users
  const defaultUsers = getDefaultUsers()
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
  
  // Save to central storage for future cross-device access
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
  
  // Try to load from central storage first (for cross-device sync)
  loadUsersFromStorage().then(centralUsers => {
    if (centralUsers && centralUsers.length > 0) {
      // Store in localStorage for immediate access
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(centralUsers))
    }
  }).catch(err => {
    console.log('Central storage not available, using localStorage:', err)
  })
  
  const stored = localStorage.getItem(USERS_STORAGE_KEY)
  if (stored) {
    const users = JSON.parse(stored)
    // Ensure all users have complete permissions
    return users.map((user: User) => ensureUserPermissions(user))
  }
  
  // Initialize with default users
  const defaultUsers = getDefaultUsers()
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
  
  // Also save to central storage for cross-device access
  saveUsersToStorage(defaultUsers).catch(err => {
    console.log('Could not save to central storage:', err)
  })
  
  return defaultUsers
}

export const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return
  
  // Save to localStorage for immediate access
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  
  // Also save to central storage for cross-device sync
  saveUsersToStorage(users).catch(err => {
    console.log('Could not save users to central storage:', err)
  })
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
