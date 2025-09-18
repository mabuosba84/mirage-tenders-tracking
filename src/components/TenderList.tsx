'use client'

import { useState } from 'react'
import { User, Tender } from '@/types'
import { Edit, Trash2, Search, Filter, Calendar, DollarSign, Clock } from 'lucide-react'
import { formatResponseTime, getResponseTimeStatus, formatNumber, formatPercentage } from '@/utils/dateCalculations'

interface TenderListProps {
  tenders: Tender[]
  currentUser: User
  onEdit: (tender: Tender) => void
  onDelete: (tenderId: string) => void
  onViewDetails: (tender: Tender) => void
}

export default function TenderList({ tenders, currentUser, onEdit, onDelete, onViewDetails }: TenderListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'price' | 'responseTime'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedTenders = tenders
    .filter(tender => {
      const matchesSearch = 
        tender.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tender.addedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tender.leadType && tender.leadType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tender.competitorWinningPrice && tender.competitorWinningPrice.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tender.opg && tender.opg.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tender.iq && tender.iq.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tender.notes && tender.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || tender.tenderStatus === statusFilter
      const matchesCategory = categoryFilter === 'all' || tender.category.includes(categoryFilter as 'PSG' | 'IPG' | 'Software' | 'Poly')
      
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'status':
          comparison = a.tenderStatus.localeCompare(b.tenderStatus)
          break
        case 'price':
          comparison = (a.sellingPrice || 0) - (b.sellingPrice || 0)
          break
        case 'responseTime':
          comparison = (a.responseTimeInDays || 999) - (b.responseTimeInDays || 999)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (field: 'date' | 'status' | 'price' | 'responseTime') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
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
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PSG':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IPG':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'Software':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Poly':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return `${amount.toLocaleString()} JD`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tender List</h2>
            <p className="text-gray-600 mt-1">
              Manage and track all tenders ({filteredAndSortedTenders.length} of {tenders.length})
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, user, or competitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Under review">Under Review</option>
              <option value="Global Agreement">Global Agreement</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="PSG">PSG</option>
              <option value="IPG">IPG</option>
              <option value="Software">Software</option>
              <option value="Poly">Poly</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleSort('date')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium border ${
                sortBy === 'date' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Date</span>
            </button>
            <button
              onClick={() => handleSort('price')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium border ${
                sortBy === 'price' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Price</span>
            </button>
            <button
              onClick={() => handleSort('responseTime')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium border ${
                sortBy === 'responseTime' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Response</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tender List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {filteredAndSortedTenders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tender ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  {currentUser.permissions?.canViewCostFromHP && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost from HP
                    </th>
                  )}
                  {currentUser.permissions?.canViewSellingPrice && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selling Price
                    </th>
                  )}
                  {currentUser.permissions?.canViewProfitMargin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Margin
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTenders.map((tender) => (
                  <tr key={tender.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <button
                          onClick={() => onViewDetails(tender)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          #{tender.id}
                        </button>
                        {tender.lastEditedBy && (
                          <div className="text-xs text-gray-500">
                            Last edited by {tender.lastEditedBy}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tender.customerName}</div>
                      <div className="text-xs text-gray-500">Customer</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        tender.leadType === 'Tender' 
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        {tender.leadType || 'Tender'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {tender.category.map((cat, index) => (
                          <span key={`${tender.id}-${cat}-${index}`} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(cat)}`}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(tender.submissionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          {tender.responseTimeInDays !== null ? (
                            <div>
                              <span className={`text-sm font-medium ${getResponseTimeStatus(tender.responseTimeInDays).color}`}>
                                {formatResponseTime(tender.responseTimeInDays)}
                              </span>
                              <div className="text-xs text-gray-500">
                                {getResponseTimeStatus(tender.responseTimeInDays).status}
                              </div>
                            </div>
                          ) : tender.dateOfPriceRequestToHp && !tender.dateOfPriceReceivedFromHp ? (
                            <div>
                              <span className="text-sm text-amber-600">Pending</span>
                              <div className="text-xs text-gray-500">Awaiting response</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {currentUser.permissions?.canViewCostFromHP && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(tender.costFromHP)}
                      </td>
                    )}
                    {currentUser.permissions?.canViewSellingPrice && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(tender.sellingPrice)}
                      </td>
                    )}
                    {currentUser.permissions?.canViewProfitMargin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tender.profitMargin !== null ? (
                          <span className={`text-sm font-medium ${
                            tender.profitMargin > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(tender.profitMargin)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(tender.tenderStatus)}`}>
                        {tender.tenderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{tender.addedBy}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(tender.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {currentUser.permissions?.canEditTenders && (
                          <button
                            onClick={() => onEdit(tender)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                            title="Edit tender"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {(currentUser.role === 'admin' || currentUser.username === tender.addedBy) && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this tender?')) {
                                onDelete(tender.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Delete tender"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tenders found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by adding your first tender.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Details Section */}
      {filteredAndSortedTenders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredAndSortedTenders.length}
              </div>
              <div className="text-sm text-gray-600">Total Shown</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredAndSortedTenders.filter(t => t.tenderStatus === 'Won').length}
              </div>
              <div className="text-sm text-gray-600">Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredAndSortedTenders.filter(t => t.tenderStatus === 'Under review').length}
              </div>
              <div className="text-sm text-gray-600">Under Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredAndSortedTenders
                  .filter(t => t.tenderStatus === 'Won' && t.sellingPrice)
                  .reduce((sum, t) => sum + (t.sellingPrice || 0), 0)
                  .toLocaleString()} JD
              </div>
              <div className="text-sm text-gray-600">Total Revenue (Won)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
