'use client'

import { useState, useEffect } from 'react'
import { User, ChangeLogEntry, ChangeLogFilter, ChangeLogAction, ChangeLogEntity } from '@/types'
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  Activity, 
  Eye, 
  Download,
  FileText,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Upload,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react'

interface ChangeLogDashboardProps {
  currentUser: User
}

export default function ChangeLogDashboard({ currentUser }: ChangeLogDashboardProps) {
  const [logs, setLogs] = useState<ChangeLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ChangeLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

  // Filter states
  const [filters, setFilters] = useState<ChangeLogFilter>({
    startDate: undefined,
    endDate: undefined,
    userId: '',
    action: undefined,
    entity: undefined,
    searchTerm: ''
  })

  useEffect(() => {
    // Only load if user is admin
    if (currentUser.role === 'admin') {
      loadChangeLogs()
    }
  }, [currentUser.role])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  // Security check - only admins can access this dashboard
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <Shield className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
        </div>
        <p className="text-gray-600">
          Only administrators can access the Change Log Dashboard.
        </p>
      </div>
    )
  }

  const loadChangeLogs = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from server
      try {
        const response = await fetch('/api/changelog')
        if (response.ok) {
          const data = await response.json()
          if (data.logs && Array.isArray(data.logs)) {
            setLogs(data.logs)
            console.log('✅ Loaded change logs from server:', data.logs.length)
            return
          }
        }
      } catch (serverError) {
        console.warn('⚠️ Server changelog failed, using local storage:', serverError)
      }

      // Fallback to localStorage
      const storedLogs = localStorage.getItem('mirage_changelog')
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }))
        setLogs(parsedLogs)
        console.log('✅ Loaded change logs from localStorage:', parsedLogs.length)
      } else {
        // Initialize with some sample data if none exists
        const sampleLogs: ChangeLogEntry[] = [
          {
            id: '1',
            timestamp: new Date(),
            userId: currentUser.id,
            username: currentUser.username,
            userRole: currentUser.role,
            action: 'LOGIN',
            entity: 'SYSTEM',
            details: 'User logged into the system'
          }
        ]
        setLogs(sampleLogs)
        localStorage.setItem('mirage_changelog', JSON.stringify(sampleLogs))
      }
    } catch (error) {
      console.error('Error loading change logs:', error)
      setError('Failed to load change logs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(log => {
        const logTimestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
        return logTimestamp >= filters.startDate!;
      });
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // Include full end date
      filtered = filtered.filter(log => {
        const logTimestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
        return logTimestamp <= endDate;
      });
    }

    // User filter
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    // Entity filter
    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity)
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(log => 
        log.username.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.entity.toLowerCase().includes(searchLower) ||
        (log.entityName && log.entityName.toLowerCase().includes(searchLower)) ||
        (log.details && log.details.toLowerCase().includes(searchLower))
      )
    }

    // Sort by timestamp (newest first) - handle both Date objects and strings
    filtered.sort((a, b) => {
      const timestampA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timestampB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timestampB.getTime() - timestampA.getTime();
    });

    setFilteredLogs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      userId: '',
      action: undefined,
      entity: undefined,
      searchTerm: ''
    })
  }

  const getActionIcon = (action: ChangeLogAction) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-600" />
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />
      case 'VIEW': return <Eye className="h-4 w-4 text-gray-600" />
      case 'LOGIN': return <LogIn className="h-4 w-4 text-green-600" />
      case 'LOGOUT': return <LogOut className="h-4 w-4 text-orange-600" />
      case 'EXPORT': return <Download className="h-4 w-4 text-purple-600" />
      case 'UPLOAD': return <Upload className="h-4 w-4 text-indigo-600" />
      case 'DOWNLOAD': return <FileText className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: ChangeLogAction) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'VIEW': return 'bg-gray-100 text-gray-800'
      case 'LOGIN': return 'bg-green-100 text-green-800'
      case 'LOGOUT': return 'bg-orange-100 text-orange-800'
      case 'EXPORT': return 'bg-purple-100 text-purple-800'
      case 'UPLOAD': return 'bg-indigo-100 text-indigo-800'
      case 'DOWNLOAD': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp)
  }

  const getAllUsers = () => {
    const users = JSON.parse(localStorage.getItem('mirage_users') || '[]')
    return users
  }

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-lg text-gray-600">Loading change logs...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadChangeLogs}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <History className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Change Log Dashboard</h2>
            <p className="text-gray-600">Complete audit trail of all system activities</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Activities</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{logs.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {new Set(logs.map(log => log.userId)).size}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Today's Activities</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {logs.filter(log => {
                const today = new Date()
                const logDate = new Date(log.timestamp)
                return logDate.toDateString() === today.toDateString()
              }).length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Filtered Results</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-1">{filteredLogs.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                placeholder="Search users, actions, entities..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({...filters, startDate: e.target.value ? new Date(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilters({...filters, endDate: e.target.value ? new Date(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action || ''}
              onChange={(e) => setFilters({...filters, action: e.target.value as ChangeLogAction || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="EXPORT">Export</option>
              <option value="UPLOAD">Upload</option>
              <option value="DOWNLOAD">Download</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
            <select
              value={filters.entity || ''}
              onChange={(e) => setFilters({...filters, entity: e.target.value as ChangeLogEntity || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="TENDER">Tender</option>
              <option value="USER">User</option>
              <option value="REPORT">Report</option>
              <option value="FILE">File</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Clear All Filters
          </button>
          <button
            onClick={loadChangeLogs}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Change Log Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.username}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.entity}</div>
                    {log.entityName && (
                      <div className="text-sm text-gray-500">{log.entityName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {log.details || 'No additional details'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastLog, filteredLogs.length)}</span> of{' '}
                  <span className="font-medium">{filteredLogs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredLogs.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-center">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
          <p className="text-gray-600">
            {logs.length === 0 
              ? "No activity has been logged yet." 
              : "No activity matches your current filters."
            }
          </p>
        </div>
      )}
    </div>
  )
}