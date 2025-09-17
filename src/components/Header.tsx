import React, { useState, useRef, useEffect } from 'react'
import { User } from '@/types'
import { LogOut, BarChart3, Plus, List, Home, FileText, Users, Search, Settings, Upload, X } from 'lucide-react'

interface HeaderProps {
  user: User
  onLogout: () => void
  activeTab: 'overview' | 'add' | 'list' | 'search' | 'reports' | 'users'
  onTabChange: (tab: 'overview' | 'add' | 'list' | 'search' | 'reports' | 'users') => void
}

export default function Header({ user, onLogout, activeTab, onTabChange }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('companyLogo')
    }
    return null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync logo from central storage on component mount
  useEffect(() => {
    const syncLogoFromCentral = async () => {
      try {
        const response = await fetch('/api/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getLogo' })
        })
        const result = await response.json()
        
        if (result.success && result.logo && result.logo.trim() !== '') {
          // Only update if we got a non-empty logo and it's different from current
          if (!logoUrl || logoUrl !== result.logo) {
            setLogoUrl(result.logo)
            localStorage.setItem('companyLogo', result.logo)
            console.log('✅ Logo synced from central storage')
          }
        }
      } catch (error) {
        console.error('❌ Failed to sync logo from central storage:', error)
      }
    }
    
    syncLogoFromCentral()
    
    // Listen for logo sync events from AutoSyncManager
    const handleLogoSynced = (event: CustomEvent) => {
      const newLogoUrl = event.detail
      if (newLogoUrl && newLogoUrl !== logoUrl) {
        setLogoUrl(newLogoUrl)
        console.log('✅ Header: Logo updated from sync event')
      }
    }
    
    window.addEventListener('logoSynced', handleLogoSynced as EventListener)
    
    return () => {
      window.removeEventListener('logoSynced', handleLogoSynced as EventListener)
    }
  }, []) // Only run once on mount

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: Home },
    { id: 'add' as const, label: 'Add Tender', icon: Plus },
    { id: 'list' as const, label: 'Tender List', icon: List },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
    ...(user.role === 'admin' ? [{ id: 'users' as const, label: 'Users', icon: Users }] : []),
  ]

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result as string
        setLogoUrl(result)
        localStorage.setItem('companyLogo', result)
        
        // Sync logo to central storage for cross-domain access
        try {
          await fetch('/api/logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'syncLogo',
              logoData: result
            })
          })
          console.log('✅ Logo synced to central storage')
        } catch (error) {
          console.error('❌ Failed to sync logo:', error)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = async () => {
    setLogoUrl(null)
    localStorage.removeItem('companyLogo')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Sync logo removal to central storage
    try {
      await fetch('/api/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncLogo',
          logoData: ''
        })
      })
      console.log('✅ Logo removal synced to central storage')
    } catch (error) {
      console.error('❌ Failed to sync logo removal:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            {logoUrl ? (
              <div className="h-12 w-auto flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="h-12 w-auto max-w-[200px] object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Mirage Business Solutions</h1>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
                aria-label="Open settings menu"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSettings(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900">Company Logo Settings</h3>
                      </div>
                      
                      <div className="p-4">
                        {logoUrl ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <img 
                                src={logoUrl} 
                                alt="Current Logo" 
                                className="h-16 w-auto max-w-[200px] object-contain"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Upload className="h-4 w-4" />
                                <span>Change Logo</span>
                              </button>
                              <button
                                onClick={handleRemoveLogo}
                                className="flex items-center justify-center space-x-2 px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <X className="h-4 w-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">No logo uploaded</p>
                              </div>
                            </div>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Upload className="h-4 w-4" />
                              <span>Upload Logo</span>
                            </button>
                          </div>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          title="Upload logo file"
                          aria-label="Upload logo file"
                        />
                        
                        <div className="mt-3 text-xs text-gray-500">
                          <p>• Supported formats: PNG, JPG, JPEG, GIF</p>
                          <p>• Maximum file size: 5MB</p>
                          <p>• Recommended dimensions: 200x50px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 bg-gray-50">
          <nav className="flex flex-wrap gap-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          
          {/* Mobile User Info */}
          <div className="px-4 pb-4 flex items-center justify-between bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
