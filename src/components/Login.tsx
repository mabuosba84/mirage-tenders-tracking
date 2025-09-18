'use client'

import { useState } from 'react'
import { User, LoginFormData } from '@/types'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { authenticateUser, authenticateUserAsync } from '@/utils/userStorage'

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
      // First try to sync users from server
      try {
        const response = await fetch('/api/sync')
        if (response.ok) {
          const data = await response.json()
          if (data.users && Array.isArray(data.users)) {
            // Store synced users locally
            localStorage.setItem('mirage_users', JSON.stringify(data.users))
            localStorage.setItem('mirage_user_credentials', JSON.stringify({
              'admin': 'admin123',
              'user': 'user123',
              'Basil': 'password123',
              'Dina': 'password123'
            }))
            console.log('Synced users from server:', data.users.length)
          }
        }
      } catch (syncError) {
        console.log('Could not sync from server, using local storage:', syncError)
      }
      
      // Add UX delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try async authentication first (for cross-device sync)
      let user = await authenticateUserAsync(formData.username, formData.password)
      
      // Fallback to regular authentication if async fails
      if (!user) {
        user = authenticateUser(formData.username, formData.password)
      }
      
      if (user) {
        onLogin(user)
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Company Logo */}
          <div className="mx-auto h-20 w-auto flex items-center justify-center bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="text-2xl font-bold text-blue-600">
              MIRAGE BUSINESS
              <div className="text-sm text-gray-600 font-normal">Solutions</div>
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            Mirage Offering Tracking System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your offering management dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>Mirage Business Solutions</p>
          <p>+962 6 569 13 33 | +962 78693 5565</p>
          <p>m.abuosba@miragebs.com</p>
          <p>Wadi Saqra, P.O.Box 268 Amman 11731 Jordan</p>
        </div>
      </div>
    </div>
  )
}
