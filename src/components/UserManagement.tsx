'use client'

import { useState, useEffect } from 'react'
import { User, UserFormData, PasswordResetData } from '@/types'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Search, 
  UserCheck, 
  UserX,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react'
import { 
  addUserToCentralAuthority, 
  updateUserInCentralAuthority,
  deleteUserFromCentralAuthority,
  getAllAuthoritativeUsers, 
  getAuthoritativeUser 
} from '@/utils/centralAuthority'
import { saveCurrentUserToStorage } from '@/utils/centralStorage'
import { logUserChange, logChange } from '@/utils/changeLogUtils'

interface UserManagementProps {
  currentUser: User
  onAutoSync?: () => Promise<void>
}

export default function UserManagement({ currentUser, onAutoSync }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Form states
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    isActive: true,
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
  })
  
  const [passwordReset, setPasswordReset] = useState<PasswordResetData>({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<any>({})
  
  // Success states for UI feedback
  const [userUpdateSuccess, setUserUpdateSuccess] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  // Load users from ONLY central authority - no other sources
  useEffect(() => {
    const loadUsers = () => {
      console.log('🔄 LOADING USERS: Using ONLY central authority');
      const authoritativeUsers = getAllAuthoritativeUsers();
      console.log('✅ CENTRAL AUTHORITY: Loaded', authoritativeUsers.length, 'users');
      setUsers(authoritativeUsers);
    };
    loadUsers();
  }, [])

  // Helper function to refresh users from central authority ONLY
  const refreshUsersFromCentralAuthority = () => {
    console.log('🔄 REFRESH: Loading fresh data from central authority');
    const freshUsers = getAllAuthoritativeUsers();
    setUsers(freshUsers);
    console.log('✅ REFRESH: Loaded', freshUsers.length, 'users from central authority');
  };

  const resetForm = () => {
    setUserForm({
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      isActive: true,
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
    })
    setErrors({})
  }

  const validateUserForm = (): boolean => {
    const newErrors: any = {}

    if (!userForm.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (users.some(u => u.username === userForm.username && u.id !== editingUser?.id)) {
      newErrors.username = 'Username already exists'
    }

    if (!userForm.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      newErrors.email = 'Invalid email format'
    } else if (users.some(u => u.email === userForm.email && u.id !== editingUser?.id)) {
      newErrors.email = 'Email already exists'
    }

    if (!userForm.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!editingUser) { // Only validate password for new users
      if (!userForm.password) {
        newErrors.password = 'Password is required'
      } else if (userForm.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }

      if (userForm.password !== userForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordReset = (): boolean => {
    const newErrors: any = {}

    if (!passwordReset.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordReset.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (passwordReset.newPassword !== passwordReset.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddUser = async () => {
    if (!validateUserForm()) return

    setIsLoading(true)
    try {
      // Add UX delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newUser: User = {
        id: Date.now().toString(),
        username: userForm.username,
        email: userForm.email,
        name: userForm.name,
        role: userForm.role,
        isActive: userForm.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser.username,
        permissions: userForm.permissions
      }

      // Add user to CENTRAL AUTHORITY ONLY
      addUserToCentralAuthority(newUser, userForm.password);
      console.log('✅ USER ADDED: Successfully added to central authority:', newUser.username);
      
      // Log the user creation for audit trail
      try {
        await logUserChange(
          currentUser,
          'CREATE',
          newUser
        );
        console.log('✅ User creation logged successfully');
      } catch (logError) {
        console.error('❌ Failed to log user creation:', logError);
        // Continue even if logging fails
      }
      
      // Refresh from central authority
      refreshUsersFromCentralAuthority();
      setShowAddUser(false)
      resetForm()
      
      // Trigger automatic sync after adding user
      if (onAutoSync) {
        setTimeout(async () => {
          try {
            console.log('🔄 Auto-sync triggered after adding user')
            await onAutoSync()
          } catch (error) {
            console.error('❌ Auto-sync failed after adding user:', error)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error adding user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!validateUserForm() || !editingUser) return

    setIsLoading(true)
    try {
      // Add UX delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))

      const updatedUser: User = {
        ...editingUser,
        username: userForm.username,
        email: userForm.email,
        name: userForm.name,
        role: userForm.role,
        isActive: userForm.isActive,
        permissions: userForm.permissions,
        updatedAt: new Date()
      }

      // Update user in CENTRAL AUTHORITY ONLY
      updateUserInCentralAuthority(updatedUser, userForm.password || undefined);
      console.log('✅ USER UPDATED: Successfully updated in central authority:', updatedUser.username);
      
      // Clear user sessions if role changed to ensure immediate role update
      if (editingUser.role !== updatedUser.role) {
        try {
          await fetch('/api/current-user', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: updatedUser.username })
          });
          console.log('✅ SESSIONS CLEARED: Role changed, cleared sessions for', updatedUser.username);
        } catch (error) {
          console.warn('⚠️ Failed to clear sessions after role change:', error);
        }
      }
      
      // Log the user update for audit trail
      try {
        await logUserChange(
          currentUser,
          'UPDATE',
          updatedUser,
          editingUser
        );
        console.log('✅ User update logged successfully');
      } catch (logError) {
        console.error('❌ Failed to log user update:', logError);
        // Continue even if logging fails
      }
      
      // If the updated user is the current user, update centralized storage
      if (updatedUser.id === currentUser.id) {
        await saveCurrentUserToStorage(updatedUser)
        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('userUpdated'))
      }
      
      // Refresh from central authority
      refreshUsersFromCentralAuthority();
      
      // Show success state for UI feedback
      setUserUpdateSuccess(true);
      
      // Auto-close the dialog after success (optional)
      setTimeout(() => {
        setEditingUser(null);
        resetForm();
        setUserUpdateSuccess(false);
      }, 2000); // Show success for 2 seconds then auto-close
      
      // Trigger automatic sync after editing user
      if (onAutoSync) {
        setTimeout(async () => {
          try {
            console.log('🔄 Auto-sync triggered after editing user')
            await onAutoSync()
          } catch (error) {
            console.error('❌ Auto-sync failed after editing user:', error)
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own account')
      return
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      // Add UX delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get user data before deletion for logging
      const userToDelete = users.find(u => u.id === userId)
      
      // Delete user from CENTRAL AUTHORITY ONLY
      const success = deleteUserFromCentralAuthority(userId);
      if (success) {
        console.log('✅ USER DELETED: Successfully removed from central authority');
        
        // Log the user deletion for audit trail
        if (userToDelete) {
          try {
            await logUserChange(
              currentUser,
              'DELETE',
              userToDelete
            );
            console.log('✅ User deletion logged successfully');
          } catch (logError) {
            console.error('❌ Failed to log user deletion:', logError);
            // Continue even if logging fails
          }
        }
        
        // Refresh from central authority
        refreshUsersFromCentralAuthority();
        
        // Trigger automatic sync after deleting user
        if (onAutoSync) {
          setTimeout(async () => {
            try {
              console.log('🔄 Auto-sync triggered after deleting user')
              await onAutoSync()
            } catch (error) {
              console.error('❌ Auto-sync failed after deleting user:', error)
            }
          }, 500)
        }
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot deactivate your own account')
      return
    }

    setIsLoading(true)
        try {
          // Add UX delay for better user feedback
          await new Promise(resolve => setTimeout(resolve, 500))
          const user = users.find(u => u.id === userId)
      if (user) {
        const updatedUser = { 
          ...user, 
          isActive: !user.isActive, 
          updatedAt: new Date() 
        }
        
        // Update user in CENTRAL AUTHORITY ONLY
        updateUserInCentralAuthority(updatedUser);
        console.log('✅ USER STATUS UPDATED: Successfully updated in central authority:', updatedUser.username);
        
        // Refresh from central authority
        refreshUsersFromCentralAuthority();
      }
    } catch (error) {
      console.error('Error updating user status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!validatePasswordReset()) return

    setIsLoading(true)
        try {
          // Add UX delay for better user feedback
          await new Promise(resolve => setTimeout(resolve, 1000))
          const user = users.find(u => u.id === passwordReset.userId)
      if (user) {
        // Reset password in CENTRAL AUTHORITY ONLY
        updateUserInCentralAuthority(user, passwordReset.newPassword);
        console.log('✅ PASSWORD RESET: Successfully updated in central authority:', user.username);
        
        alert('Password has been reset successfully!')
        // Show success and auto-close after delay
        setPasswordResetSuccess(true);
        setTimeout(() => {
          setShowPasswordReset(null);
          setPasswordReset({ userId: '', newPassword: '', confirmPassword: '' });
          setPasswordResetSuccess(false);
        }, 2000);
      } else {
        alert('User not found.')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startEditUser = (user: User) => {
    setEditingUser(user)
    
    // Ensure complete permissions object
    const safePermissions = {
      canViewCostFromVendor: user.permissions?.canViewCostFromVendor ?? false,
      canViewSellingPrice: user.permissions?.canViewSellingPrice ?? true,
      canViewProfitMargin: user.permissions?.canViewProfitMargin ?? false,
      canViewTenderItems: user.permissions?.canViewTenderItems ?? true,
      canEditTenders: user.permissions?.canEditTenders ?? true,
      canDeleteTenders: user.permissions?.canDeleteTenders ?? false,
      canViewFinancialReports: user.permissions?.canViewFinancialReports ?? false,
      canManageUsers: user.permissions?.canManageUsers ?? false,
      canExportData: user.permissions?.canExportData ?? false,
      canViewOptionalFields: user.permissions?.canViewOptionalFields ?? true
    }
    
    setUserForm({
      username: user.username,
      email: user.email,
      name: user.name,
      password: '',
      confirmPassword: '',
      role: user.role,
      isActive: user.isActive,
      permissions: safePermissions
    })
    setShowAddUser(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600">Manage users, roles, and permissions</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm()
              setEditingUser(null)
              setShowAddUser(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Users</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                      {user.createdBy && (
                        <div className="text-xs text-gray-500">by {user.createdBy}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPasswordReset({ userId: user.id, newPassword: '', confirmPassword: '' })
                          setShowPasswordReset(user.id)
                        }}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded-md hover:bg-yellow-50"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        disabled={user.id === currentUser.id}
                        className={`p-1 rounded-md ${
                          user.id === currentUser.id 
                            ? 'text-gray-400 cursor-not-allowed'
                            : user.isActive 
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={user.id === currentUser.id ? 'Cannot modify own status' : user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser.id}
                        className={`p-1 rounded-md ${
                          user.id === currentUser.id 
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                        }`}
                        title={user.id === currentUser.id ? 'Cannot delete own account' : 'Delete user'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by adding your first user.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={userForm.confirmPassword}
                        onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active User
                </label>
              </div>

              {/* Permissions Section */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600" />
                  Permissions
                </h4>
                
                <div className="space-y-3">
                  {/* Financial Permissions */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Financial Access</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewCostFromVendor"
                          checked={userForm.permissions.canViewCostFromVendor}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewCostFromVendor: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewCostFromVendor" className="text-sm text-gray-700">
                          Can view Cost from Vendor
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewSellingPrice"
                          checked={userForm.permissions.canViewSellingPrice}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewSellingPrice: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewSellingPrice" className="text-sm text-gray-700">
                          Can view Selling Price
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewProfitMargin"
                          checked={userForm.permissions.canViewProfitMargin}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewProfitMargin: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewProfitMargin" className="text-sm text-gray-700">
                          Can view Profit Margin
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Content Permissions */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Content Access</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewTenderItems"
                          checked={userForm.permissions.canViewTenderItems}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewTenderItems: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewTenderItems" className="text-sm text-gray-700">
                          Can view Tender Items
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Permissions */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Action Permissions</h5>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canEditTenders"
                          checked={userForm.permissions.canEditTenders}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canEditTenders: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canEditTenders" className="text-sm text-gray-700">
                          Can edit Tenders
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canDeleteTenders"
                          checked={userForm.permissions.canDeleteTenders}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canDeleteTenders: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canDeleteTenders" className="text-sm text-gray-700">
                          Can delete Tenders
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewFinancialReports"
                          checked={userForm.permissions.canViewFinancialReports}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewFinancialReports: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewFinancialReports" className="text-sm text-gray-700">
                          Can view Financial Reports
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canManageUsers"
                          checked={userForm.permissions.canManageUsers}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canManageUsers: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canManageUsers" className="text-sm text-gray-700">
                          Can manage Users
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canExportData"
                          checked={userForm.permissions.canExportData}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canExportData: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canExportData" className="text-sm text-gray-700">
                          Can export Data
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="canViewOptionalFields"
                          checked={userForm.permissions.canViewOptionalFields}
                          onChange={(e) => setUserForm(prev => ({ 
                            ...prev, 
                            permissions: { ...prev.permissions, canViewOptionalFields: e.target.checked }
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="canViewOptionalFields" className="text-sm text-gray-700">
                          Can view Optional Fields in Tenders
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Success Message */}
            {userUpdateSuccess && (
              <div className="px-6 py-3 bg-green-50 border-t border-green-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      User successfully updated! Changes will take effect immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddUser(false)
                  setEditingUser(null)
                  resetForm()
                  setUserUpdateSuccess(false)
                }}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                <span>{userUpdateSuccess ? 'Close' : 'Cancel'}</span>
              </button>
              <button
                onClick={editingUser ? handleEditUser : handleAddUser}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Password
              </h3>
              <p className="text-sm text-gray-600">
                Reset password for: {users.find(u => u.id === showPasswordReset)?.name}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordReset.newPassword}
                  onChange={(e) => setPasswordReset(prev => ({ ...prev, newPassword: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordReset.confirmPassword}
                  onChange={(e) => setPasswordReset(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordReset(null)
                  setPasswordReset({ userId: '', newPassword: '', confirmPassword: '' })
                  setErrors({})
                  setPasswordResetSuccess(false)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {passwordResetSuccess ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
