'use client'

import { useState } from 'react'
import { Tender, User } from '@/types'
import { FileText, Download, Printer, Filter, Calendar } from 'lucide-react'

interface ReportsProps {
  tenders: Tender[]
  user: User
}

export default function Reports({ tenders, user }: ReportsProps) {
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'financial' | 'responseTime'>('summary')
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Won' | 'Lost' | 'Under review' | 'Global Agreement'>('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const filterTenders = () => {
    let filtered = tenders

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tender => tender.tenderStatus === statusFilter)
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (dateRange) {
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(tender => new Date(tender.createdAt) >= cutoffDate)
    }

    return filtered
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const filteredTenders = filterTenders()
      let doc
      
      switch (reportType) {
        case 'summary': {
          const { generateSummaryReport } = await import('../utils/pdfGenerator')
          doc = await generateSummaryReport(filteredTenders, user)
          break
        }
        case 'detailed': {
          const { generateDetailedReport } = await import('../utils/pdfGenerator')
          doc = await generateDetailedReport(filteredTenders, user)
          break
        }
        case 'financial': {
          const { generateFinancialReport } = await import('../utils/pdfGenerator')
          doc = await generateFinancialReport(filteredTenders, user)
          break
        }
        case 'responseTime': {
          const { generateResponseTimeReport } = await import('../utils/pdfGenerator')
          doc = await generateResponseTimeReport(filteredTenders, user)
          break
        }
        default: {
          const { generateSummaryReport } = await import('../utils/pdfGenerator')
          doc = await generateSummaryReport(filteredTenders, user)
        }
      }
      
      if (doc) {
        const fileName = `Mirage_Tenders_${reportType}_Report_${new Date().toISOString().split('T')[0]}.pdf`
        doc.save(fileName)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const filteredTenders = filterTenders()
      let doc
      
      switch (reportType) {
        case 'summary': {
          const { generateSummaryReport } = await import('../utils/pdfGenerator')
          doc = await generateSummaryReport(filteredTenders, user)
          break
        }
        case 'detailed': {
          const { generateDetailedReport } = await import('../utils/pdfGenerator')
          doc = await generateDetailedReport(filteredTenders, user)
          break
        }
        case 'financial': {
          const { generateFinancialReport } = await import('../utils/pdfGenerator')
          doc = await generateFinancialReport(filteredTenders, user)
          break
        }
        case 'responseTime': {
          const { generateResponseTimeReport } = await import('../utils/pdfGenerator')
          doc = await generateResponseTimeReport(filteredTenders, user)
          break
        }
        default: {
          const { generateSummaryReport } = await import('../utils/pdfGenerator')
          doc = await generateSummaryReport(filteredTenders, user)
        }
      }
      
      if (doc) {
        // Open print dialog
        const pdfBlob = doc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const printWindow = window.open(pdfUrl)
        if (printWindow) {
          printWindow.focus()
          printWindow.print()
        }
      }
    } catch (error) {
      console.error('Error printing report:', error)
      alert('Error printing report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredTenders = filterTenders()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-gray-600">Generate comprehensive reports and analytics</p>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="financial">Financial Report</option>
              <option value="responseTime">Response Time Analysis</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {reportType === 'summary' && 'Overview statistics and key metrics'}
              {reportType === 'detailed' && 'Complete tender details and information'}
              {reportType === 'financial' && 'Revenue, costs, and profit analysis'}
              {reportType === 'responseTime' && 'HP response time analysis and trends'}
            </p>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Under review">Under Review</option>
              <option value="Global Agreement">Global Agreement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredTenders.length}</div>
            <div className="text-sm text-gray-600">Total Tenders</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredTenders.filter(t => t.tenderStatus === 'Won').length}
            </div>
            <div className="text-sm text-gray-600">Won Tenders</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredTenders.filter(t => t.tenderStatus === 'Under review').length}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredTenders.length > 0 
                ? ((filteredTenders.filter(t => t.tenderStatus === 'Won').length / filteredTenders.length) * 100).toFixed(1)
                : '0'}%
            </div>
            <div className="text-sm text-gray-600">Win Rate</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
          
          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="h-5 w-5" />
            <span>{isGenerating ? 'Preparing Print...' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Types Info */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary Report</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Key statistics overview</li>
              <li>• Win/loss rates</li>
              <li>• Status distribution</li>
              <li>• Total revenue summary</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Detailed Report</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete tender listing</li>
              <li>• All tender details</li>
              <li>• Submission dates</li>
              <li>• User audit information</li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Financial Report</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Revenue and cost analysis</li>
              <li>• Profit calculations</li>
              <li>• Margin analysis</li>
              <li>• Won tenders breakdown</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
