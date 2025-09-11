'use client'

import { useState } from 'react'
import { Tender, User } from '@/types'
import { X, Download, Printer, Calendar, Clock, DollarSign, TrendingUp, User as UserIcon, FileText, Package, Paperclip, Shield, AlertTriangle, Eye, ExternalLink } from 'lucide-react'
import { formatResponseTime, getResponseTimeStatus } from '@/utils/dateCalculations'

interface TenderPreviewProps {
  tender: Tender
  user: User
  onClose: () => void
}

export default function TenderPreview({ tender, user, onClose }: TenderPreviewProps) {
  const [isExporting, setIsExporting] = useState(false)

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'Not specified'
    return `${amount.toLocaleString()} JD`
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

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const { generateTenderPreviewPDF } = await import('../utils/pdfGenerator')
      const doc = await generateTenderPreviewPDF(tender, user)
      
      if (doc) {
        const fileName = `Mirage_Tender_${tender.id}_Preview_${new Date().toISOString().split('T')[0]}.pdf`
        doc.save(fileName)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = async () => {
    setIsExporting(true)
    try {
      const { generateTenderPreviewPDF } = await import('../utils/pdfGenerator')
      const doc = await generateTenderPreviewPDF(tender, user)
      
      if (doc) {
        const pdfBlob = doc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const printWindow = window.open(pdfUrl, '_blank')
        
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print()
            URL.revokeObjectURL(pdfUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error printing:', error)
      alert('Error printing. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getFileTypeDescription = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return 'PDF Document'
      case 'doc':
        return 'Word Document'
      case 'docx':
        return 'Word Document'
      case 'xls':
        return 'Excel Spreadsheet'
      case 'xlsx':
        return 'Excel Spreadsheet'
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image'
      case 'png':
        return 'PNG Image'
      case 'gif':
        return 'GIF Image'
      default:
        return 'Document'
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const handleViewAttachment = (attachment: any) => {
    if (attachment.url) {
      // If the attachment has a URL, open it in a new window
      window.open(attachment.url, '_blank')
    } else {
      // Handle different file types appropriately
      const fileExtension = attachment.name.split('.').pop()?.toLowerCase()
      
      switch (fileExtension) {
        case 'pdf':
          alert(`Opening PDF: ${attachment.name}\n\nThis would open the PDF in a new browser tab or PDF viewer.`)
          break
        case 'doc':
        case 'docx':
          alert(`Opening Word Document: ${attachment.name}\n\nThis would either:\n- Open in browser if supported\n- Download and open with default application\n- Use an online viewer like Office 365`)
          break
        case 'xls':
        case 'xlsx':
          alert(`Opening Excel Document: ${attachment.name}\n\nThis would either:\n- Open in browser if supported\n- Download and open with default application\n- Use an online viewer like Office 365`)
          break
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          alert(`Opening Image: ${attachment.name}\n\nThis would display the image in a modal or new tab.`)
          break
        default:
          alert(`Opening File: ${attachment.name}\n\nThis would open the file with the appropriate application.`)
      }
    }
  }

  const handleDownloadAttachment = (attachment: any) => {
    if (attachment.url) {
      // Create a download link
      const link = document.createElement('a')
      link.href = attachment.url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Handle file download
      alert(`Downloading: ${attachment.name}\n\nThis would:\n1. Fetch the file from the server\n2. Create a download link\n3. Automatically start the download\n\nFile would be saved to your Downloads folder.`)
      
      // Log download action
      console.log(`Starting download of ${attachment.name}...`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Tender Preview</h2>
              <p className="text-blue-100 mt-1">Tender ID: #{tender.id}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors disabled:opacity-50"
                title="Export to PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
              <button
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors disabled:opacity-50"
                title="Print"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(tender.tenderStatus)}`}>
            {tender.tenderStatus}
          </div>

          {/* Customer Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Customer Information</h3>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-blue-800">{tender.customerName}</p>
              <div className="flex flex-wrap gap-2">
                {tender.category.map((cat, index) => (
                  <span key={`${tender.id}-category-${cat}-${index}`} className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getCategoryColor(cat)}`}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tender Announcement Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Tender Announcement</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.tenderAnnouncementDate)}</p>
            </div>

            {/* Request Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Request Date</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.requestDate)}</p>
            </div>

            {/* Submission Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Submission Date</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.submissionDate)}</p>
            </div>

            {/* Price Request Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Price Request Date</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.dateOfPriceRequestToHp)}</p>
            </div>

            {/* Price Received Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Price Received Date</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.dateOfPriceReceivedFromHp)}</p>
            </div>

            {/* Bid Bond Issue Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Bid Bond Issue Date</h3>
              </div>
              <p className="text-gray-700">{formatDate(tender.bidBondIssueDate)}</p>
            </div>
          </div>

          {/* Response Time Analysis */}
          {(tender.dateOfPriceRequestToHp || tender.dateOfPriceReceivedFromHp) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Response Time Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className={`font-semibold ${tender.responseTimeInDays !== null ? getResponseTimeStatus(tender.responseTimeInDays).color : 'text-gray-500'}`}>
                    {tender.responseTimeInDays !== null ? formatResponseTime(tender.responseTimeInDays) : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tender.responseTimeInDays !== null 
                      ? getResponseTimeStatus(tender.responseTimeInDays).status === 'Excellent' ? 'bg-green-100 text-green-800' :
                        getResponseTimeStatus(tender.responseTimeInDays).status === 'Good' ? 'bg-blue-100 text-blue-800' :
                        getResponseTimeStatus(tender.responseTimeInDays).status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tender.responseTimeInDays !== null ? getResponseTimeStatus(tender.responseTimeInDays).status : 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days Elapsed</p>
                  <p className="font-semibold text-gray-900">
                    {tender.responseTimeInDays !== null ? `${tender.responseTimeInDays} days` : 
                      tender.dateOfPriceRequestToHp ? `${Math.ceil((new Date().getTime() - new Date(tender.dateOfPriceRequestToHp).getTime()) / (1000 * 3600 * 24))} days pending` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${user.permissions?.canViewCostFromHP ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
            {user.permissions?.canViewCostFromHP && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Cost from HP</h3>
                </div>
                <p className="text-lg font-bold text-green-700">{formatCurrency(tender.costFromHP)}</p>
              </div>
            )}

            {user.permissions?.canViewSellingPrice && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Selling Price</h3>
                </div>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(tender.sellingPrice)}</p>
              </div>
            )}

            {user.permissions?.canViewProfitMargin && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Profit Margin</h3>
                </div>
                <p className={`text-lg font-bold ${
                  tender.profitMargin !== null 
                    ? tender.profitMargin > 0 ? 'text-green-700' : 'text-red-700'
                    : 'text-gray-500'
                }`}>
                  {tender.profitMargin !== null ? `${tender.profitMargin.toFixed(1)}%` : 'Not calculated'}
                </p>
              </div>
            )}

            {user.permissions?.canViewCostFromHP && user.permissions?.canViewSellingPrice && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Estimated Profit</h3>
                </div>
                <p className="text-lg font-bold text-yellow-700">
                  {tender.costFromHP && tender.sellingPrice 
                    ? formatCurrency(tender.sellingPrice - tender.costFromHP)
                    : 'Not calculated'}
                </p>
              </div>
            )}

            {(!user.permissions?.canViewCostFromHP && !user.permissions?.canViewSellingPrice && !user.permissions?.canViewProfitMargin) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Financial Information</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Financial details are restricted based on your permissions.
                </p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Competitor Information</h3>
              <p className="text-gray-700">
                {tender.competitorWinningPrice || 'No competitor information available'}
              </p>
            </div>
          </div>

          {/* Items Section */}
          {user.permissions?.canViewTenderItems ? (
            tender.items && tender.items.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  <span>Items</span>
                </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost from HP (JD)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price (JD)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin (%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tender.items.map((item, index) => (
                      <tr key={item.id || `${tender.id}-item-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.permissions?.canViewCostFromHP ? (item.costFromHP ? `${item.costFromHP.toLocaleString()} JOD` : 'N/A') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.permissions?.canViewSellingPrice ? (item.sellingPrice ? `${item.sellingPrice.toLocaleString()} JOD` : 'N/A') : 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${user.permissions?.canViewProfitMargin && item.profitMargin < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {user.permissions?.canViewProfitMargin ? (item.profitMargin !== undefined ? `${item.profitMargin.toFixed(2)}%` : 'N/A') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.totalPrice.toLocaleString()} JOD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        Total Items Value:
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        {tender.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()} JOD
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            ) : null
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                <span>Items</span>
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Items Access Restricted</h4>
                </div>
                <p className="text-sm text-gray-600">
                  You do not have permission to view tender items.
                </p>
              </div>
            </div>
          )}

          {/* Optional Fields */}
          {(tender.opg || tender.iq) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                <span>Additional Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tender.opg && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OPG Number</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">{tender.opg}</p>
                  </div>
                )}
                {tender.iq && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IQ Number</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">{tender.iq}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {tender.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                <span>Notes</span>
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{tender.notes}</p>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          {tender.attachments && tender.attachments.filter(att => att.type === 'tender_document').length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Paperclip className="h-5 w-5 mr-2 text-blue-600" />
                <span>Tender Documents</span>
              </h3>
              <div className="space-y-3">
                {tender.attachments
                  .filter(att => att.type === 'tender_document')
                  .map((attachment, index) => (
                    <div key={attachment.id || `${tender.id}-attachment-${index}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(attachment.name)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {getFileTypeDescription(attachment.name)} • Uploaded on {formatDate(attachment.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAttachment(attachment)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200 border border-transparent hover:border-blue-200"
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-all duration-200 border border-transparent hover:border-green-200"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Bank Guarantee Section */}
          {(tender.bankGuaranteeIssueDate || tender.bankGuaranteeExpiryDate) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                <span>Bank Guarantee</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tender.bankGuaranteeIssueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                        {formatDate(tender.bankGuaranteeIssueDate)}
                      </p>
                    </div>
                  )}
                  {tender.bankGuaranteeExpiryDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                        {formatDate(tender.bankGuaranteeExpiryDate)}
                      </p>
                      {(() => {
                        const today = new Date();
                        const expiryDate = new Date(tender.bankGuaranteeExpiryDate);
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntilExpiry <= 0) {
                          return (
                            <div className="mt-2 flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-xs font-medium">EXPIRED</span>
                            </div>
                          );
                        } else if (daysUntilExpiry <= 30) {
                          return (
                            <div className="mt-2 flex items-center text-orange-600">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              <span className="text-xs font-medium">Expires in {daysUntilExpiry} days</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Show bank guarantee documents from attachments */}
                {tender.attachments && tender.attachments.filter(att => att.type === 'bank_guarantee').length > 0 && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Guarantee Documents</label>
                    <div className="space-y-2">
                      {tender.attachments
                        .filter(att => att.type === 'bank_guarantee')
                        .map((attachment, index) => (
                          <div key={attachment.id || `${tender.id}-bank-guarantee-${index}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(attachment.name)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                <p className="text-xs text-gray-500">
                                  {getFileTypeDescription(attachment.name)} • Uploaded on {formatDate(attachment.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewAttachment(attachment)}
                                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200 border border-transparent hover:border-blue-200"
                                title="View bank guarantee document"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-all duration-200 border border-transparent hover:border-green-200"
                                title="Download bank guarantee document"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}          {/* Audit Trail */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Audit Trail</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                <p className="text-sm text-gray-600">
                  By: <span className="font-medium">{tender.addedBy}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Date: {formatDate(tender.createdAt)}
                </p>
              </div>
              
              {tender.lastEditedBy && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Last Modified</h4>
                  <p className="text-sm text-gray-600">
                    By: <span className="font-medium">{tender.lastEditedBy}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {tender.lastEditedAt ? formatDate(tender.lastEditedAt) : 'Unknown'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Mirage Business Solutions - Tender Tracking System</span>
            </div>
            <div className="text-sm text-gray-500">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
