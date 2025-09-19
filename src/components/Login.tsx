'use client'

import { useState } from 'react'
import { User, LoginFormData } from '@/types'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { authenticateUserPermanent } from '@/utils/centralAuthority'
import { logChange } from '@/utils/changeLogUtils'
import Image from 'next/image'

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
      // Use the permanent authentication system
      const authResult = await authenticateUserPermanent(formData.username, formData.password);
      
      if (authResult.success && authResult.user) {
        const user = authResult.user;
        
        // Log the login for audit trail
        try {
          await logChange(user, 'LOGIN', 'USER', {
            entityId: user.id,
            entityName: user.username
          });
        } catch (logError) {
          console.error('Failed to log login:', logError);
        }
        
        onLogin(user);
      } else {
        const errorMessage = authResult.errors?.[0] || 'Invalid username or password';
        setError(errorMessage);
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Main Container */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          {/* Mirage Logo */}
          <div className="mx-auto w-32 h-24 mb-6 relative">
            <Image
              src="/mirage-logo.png"
              alt="Mirage Business Solutions"
              width={128}
              height={96}
              className="shadow-lg object-contain"
              priority
            />
          </div>
          
          {/* Company Name */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Mirage
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">
            Business Solutions
          </h2>
          
          {/* System Name */}
          <p className="text-blue-600 font-medium text-lg">
            Tenders Tracking System
          </p>
          
          {/* Contact Info */}
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <span>📞</span>
              <span>+962 6 569 13 33</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>📧</span>
              <span>m.abuosba@miragebs.com</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>🌐</span>
              <span>www.miragebs.com</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 font-medium"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 font-medium"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-xs text-gray-400">
            © 2025 Mirage Business Solutions. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}