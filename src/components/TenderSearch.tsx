'use client'

import { useState, useEffect } from 'react'
import { Lead, User } from '@/types'
import { Search, Filter, Calendar, Users, Package, FileText, RefreshCw, X, Eye } from 'lucide-react'
import { formatNumberWithCommas, formatPercentage } from '@/utils/dateCalculations'

interface TenderSearchProps {
  tenders: Lead[]
  user: User
  onViewDetails: (tender: Lead) => void
}

interface SearchFilters {
  customerName: string
  leadType: string
  category: string
  status: string
  addedBy: string
  dateFrom: string
  dateTo: string
  itemDescription: string
}

export default function TenderSearch({ tenders, user, onViewDetails }: TenderSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    customerName: '',
    leadType: '',
    category: '',
    status: '',
    addedBy: '',
    dateFrom: '',
    dateTo: '',
    itemDescription: ''
  })
  
  const [filteredTenders, setFilteredTenders] = useState<Lead[]>(tenders)
  const [isSearching, setIsSearching] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Get unique values for dropdowns
  const uniqueCategories = Array.from(new Set(tenders.flatMap(t => t.category))).sort()
  const uniqueUsers = Array.from(new Set(tenders.map(t => t.addedBy))).sort()
  const statuses = ['Won', 'Lost', 'Under review', 'Global Agreement', 'Ignored Leads']

  // Apply filters whenever filters or tenders change
  useEffect(() => {
    applyFilters()
  }, [filters, tenders])

  const applyFilters = () => {
    setIsSearching(true)
    
    setTimeout(() => {
      let filtered = tenders.filter(tender => {
        // Customer Name filter
        if (filters.customerName && !tender.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) {
          return false
        }

        // Lead Type filter
        if (filters.leadType && tender.leadType !== filters.leadType) {
          return false
        }

        // Category filter
        if (filters.category && !tender.category.includes(filters.category as 'PSG' | 'IPG' | 'Software' | 'Poly')) {
          return false
        }

        // Status filter
        if (filters.status && tender.tenderStatus !== filters.status) {
          return false
        }

        // Added By filter
        if (filters.addedBy && tender.addedBy !== filters.addedBy) {
          return false
        }

        // Date range filter (using tender announcement date)
        if (filters.dateFrom || filters.dateTo) {
          const tenderDate = tender.tenderAnnouncementDate
          if (!tenderDate) return false

          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom)
            if (tenderDate < fromDate) return false
          }

          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo)
            toDate.setHours(23, 59, 59, 999) // Include the entire day
            if (tenderDate > toDate) return false
          }
        }

        // Item description filter (Search by Tender Items)
        if (filters.itemDescription) {
          const hasMatchingItem = tender.items && tender.items.some(item => 
            item.description.toLowerCase().includes(filters.itemDescription.toLowerCase())
          )
          if (!hasMatchingItem) return false
        }

        return true
      })

      setFilteredTenders(filtered)
      setIsSearching(false)
    }, 300) // Add slight delay for better UX
  }

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      customerName: '',
      leadType: '',
      category: '',
      status: '',
      addedBy: '',
      dateFrom: '',
      dateTo: '',
      itemDescription: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A'
    return `${formatNumberWithCommas(amount)} JD`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Won':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Lost':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Under review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Global Agreement':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tender Search</h2>
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                showAdvancedFilters 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </button>
          </div>
        </div>

        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={filters.customerName}
              onChange={(e) => handleFilterChange('customerName', e.target.value)}
              placeholder="Search by customer name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Type
            </label>
            <select
              value={filters.leadType}
              onChange={(e) => handleFilterChange('leadType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Tender">Tender</option>
              <option value="Quotation">Quotation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={`search-category-${category}`} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={`search-status-${status}`} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Added By User
                </label>
                <select
                  value={filters.addedBy}
                  onChange={(e) => handleFilterChange('addedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={`search-user-${user}`} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Description
                </label>
                <input
                  type="text"
                  value={filters.itemDescription}
                  onChange={(e) => handleFilterChange('itemDescription', e.target.value)}
                  placeholder="Search in tender items..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results
              {isSearching && (
                <RefreshCw className="inline-block ml-2 h-4 w-4 animate-spin text-blue-600" />
              )}
            </h3>
            <span className="text-sm text-gray-500">
              {filteredTenders.length} of {tenders.length} tenders
            </span>
          </div>
        </div>

        {filteredTenders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tenders found</h3>
            <p className="mt-2 text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or clear some filters.'
                : 'Start by entering search criteria above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Announcement Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tender.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tender.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(tender.tenderStatus)}`}>
                        {tender.tenderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(tender.tenderAnnouncementDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.permissions?.canViewSellingPrice && tender.sellingPrice && (
                          <div>Selling: {formatCurrency(tender.sellingPrice)}</div>
                        )}
                        {user.permissions?.canViewCostFromVendor && tender.costFromVendor && (
                          <div>Cost: {formatCurrency(tender.costFromVendor)}</div>
                        )}
                        {user.permissions?.canViewProfitMargin && tender.profitMargin !== null && (
                          <div className={tender.profitMargin < 0 ? 'text-red-600' : 'text-green-600'}>
                            Margin: {formatPercentage(tender.profitMargin)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tender.addedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tender.items && tender.items.length > 0 ? (
                          <div>
                            <div className="font-medium">{tender.items.length} items</div>
                            {filters.itemDescription && (
                              <div className="text-xs text-gray-500 truncate max-w-32">
                                {tender.items
                                  .filter(item => item.description.toLowerCase().includes(filters.itemDescription.toLowerCase()))
                                  .map(item => item.description)
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onViewDetails(tender)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
