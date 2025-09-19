'use client'

import { useState } from 'react'
import { User, LoginFormData } from '@/types'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { authenticateUserPermanent } from '@/utils/centralAuthority'
import { logChange } from '@/utils/changeLogUtils'

interface LoginProps {
  onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🔒 PERMANENT AUTH: Starting authentication for', formData.username);
      
      // Use the permanent authentication system
      const authResult = await authenticateUserPermanent(formData.username, formData.password);
      
      if (authResult.success && authResult.user) {
        const user = authResult.user;
        
        console.log('✅ PERMANENT AUTH SUCCESS:', {
          username: user.username,
          role: user.role,
          source: authResult.source,
          hasWarnings: (authResult.errors?.length || 0) > 0
        });

        // Show warning if there were consistency issues that were auto-fixed
        if (authResult.errors && authResult.errors.length > 0) {
          console.warn('⚠️ Authentication warnings (auto-fixed):', authResult.errors);
        }
        
        // Log the login for audit trail
        try {
          await logChange(user, 'LOGIN', 'USER', {
            entityId: user.id,
            entityName: user.username
          });
          console.log('✅ Login logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log login:', logError);
          // Continue with login even if logging fails
        }
        
        onLogin(user);
      } else {
        const errorMessage = authResult.errors?.[0] || 'Invalid username or password';
        setError(errorMessage);
        console.error('❌ PERMANENT AUTH FAILED:', errorMessage);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mirage Business Solutions
          </h1>
          <p className="text-gray-600">
            Tenders Tracking System
          </p>
          <div className="mt-2 text-sm text-gray-500">
            <div>📞 +962 6 569 13 33 | +962 78693 5565</div>
            <div>📧 m.abuosba@miragebs.com</div>
            <div>🌐 www.miragebs.com</div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </div>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>User:</strong> user / user123</div>
            <div><strong>Basil (Admin):</strong> Basil / password123</div>
            <div><strong>Dina (Admin):</strong> Dina / password123</div>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <div>🔒 Powered by Centralized Authentication Authority</div>
          <div>🔄 Auto-sync & Role Consistency Protection</div>
        </div>
      </div>
    </div>
  )
}