import { User } from '@/types';
import { 
  addUserToCentralAuthority, 
  updateUserInCentralAuthority, 
  getAuthoritativeUser,
  synchronizeUserToAllSources 
} from './centralAuthority';

/**
 * SECURE USER MANAGEMENT - Updates Central Authority
 * These functions ensure the Central User Authority is always updated
 */

export const addUserSecure = async (user: User, password: string): Promise<boolean> => {
  try {
    console.log('🔒 SECURE ADD USER: Adding to central authority:', user.username);
    
    // Add to central authority (single source of truth)
    addUserToCentralAuthority(user, password);
    
    // Sync to all storage sources
    await synchronizeUserToAllSources(user);
    
    console.log('✅ SECURE ADD USER: Successfully added to central authority');
    return true;
  } catch (error) {
    console.error('❌ SECURE ADD USER: Failed to add user:', error);
    return false;
  }
};

export const updateUserSecure = async (user: User, password?: string): Promise<boolean> => {
  try {
    console.log('🔒 SECURE UPDATE USER: Updating in central authority:', user.username);
    
    // Update in central authority (single source of truth)
    updateUserInCentralAuthority(user, password);
    
    // Sync to all storage sources
    await synchronizeUserToAllSources(user);
    
    console.log('✅ SECURE UPDATE USER: Successfully updated in central authority');
    return true;
  } catch (error) {
    console.error('❌ SECURE UPDATE USER: Failed to update user:', error);
    return false;
  }
};

export const resetPasswordSecure = async (username: string, newPassword: string): Promise<boolean> => {
  try {
    console.log('🔒 SECURE PASSWORD RESET: Resetting in central authority for:', username);
    
    // Get user from central authority
    const authUser = getAuthoritativeUser(username);
    if (!authUser) {
      console.error('❌ SECURE PASSWORD RESET: User not found in central authority:', username);
      return false;
    }
    
    // Update password in central authority
    const userWithoutPassword = { ...authUser };
    delete (userWithoutPassword as any).password;
    
    updateUserInCentralAuthority(userWithoutPassword, newPassword);
    
    // Sync to all storage sources
    await synchronizeUserToAllSources(userWithoutPassword);
    
    console.log('✅ SECURE PASSWORD RESET: Successfully reset password in central authority');
    return true;
  } catch (error) {
    console.error('❌ SECURE PASSWORD RESET: Failed to reset password:', error);
    return false;
  }
};

export const deleteUserSecure = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔒 SECURE DELETE USER: Removing from central authority:', userId);
    
    // Note: We would need to implement deleteUserFromCentralAuthority
    // For now, marking as inactive is safer
    const users = JSON.parse(localStorage.getItem('mirage_users') || '[]');
    const user = users.find((u: User) => u.id === userId);
    
    if (user) {
      const inactiveUser = { ...user, isActive: false, updatedAt: new Date() };
      await updateUserSecure(inactiveUser);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ SECURE DELETE USER: Failed to delete user:', error);
    return false;
  }
};