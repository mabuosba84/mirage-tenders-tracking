'use client'

import { useState, useEffect } from 'react'
import { User, Lead, LeadFormData, LeadItem, LeadAttachment, FormErrors } from '@/types'
import { Save, X, Calculator, Clock, Plus, Trash2, Upload, FileText, AlertTriangle, Shield } from 'lucide-react'
import { calculateResponseTime, formatResponseTime, getResponseTimeStatus, formatNumberWithCommas, formatPercentage } from '@/utils/dateCalculations'
import { logTenderChange } from '@/utils/changeLogUtils'
import FormattedNumberInput from './FormattedNumberInput'

interface TenderFormProps {
  user: User
  tender?: Lead | null
  onSubmit: (tender: Lead) => void
  onCancel: () => void
}

export default function TenderForm({ user, tender, onSubmit, onCancel }: TenderFormProps) {
  // Security check: Users can only edit their own tenders (unless admin)
  const canEditThisTender = !tender || user.role === 'admin' || user.username === tender.addedBy
  
  // If user doesn't have permission to edit this tender, show access denied
  if (tender && !canEditThisTender) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <Shield className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
        </div>
        <p className="text-gray-600 mb-4">
          You can only edit tenders that you created. This tender was created by <strong>{tender.addedBy}</strong>.
        </p>
        <button
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Helper function to safely convert dates to ISO string
  const safeToISOString = (dateValue: any): string => {
    if (!dateValue) return ''
    
    // If it's already a string, check if it's a valid date string
    if (typeof dateValue === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue
      }
      // Try to parse as date
      const parsed = new Date(dateValue)
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0]
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? '' : dateValue.toISOString().split('T')[0]
    }
    
    // Try to convert to Date
    try {
      const parsed = new Date(dateValue)
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Use actual user permissions - SECURITY CRITICAL
  const safeUser = {
    ...user,
    permissions: {
      canViewCostFromVendor: user.permissions?.canViewCostFromVendor || false,
      canViewSellingPrice: user.permissions?.canViewSellingPrice || false,
      canViewProfitMargin: user.permissions?.canViewProfitMargin || false,
      canViewTenderItems: user.permissions?.canViewTenderItems || false,
      canEditTenders: user.permissions?.canEditTenders || false,
      canDeleteTenders: user.permissions?.canDeleteTenders || false,
      canViewFinancialReports: user.permissions?.canViewFinancialReports || false,
      canManageUsers: user.permissions?.canManageUsers || false,
      canExportData: user.permissions?.canExportData || false,
      canViewOptionalFields: user.permissions?.canViewOptionalFields || false
    }
  }

  const [formData, setFormData] = useState<LeadFormData>(() => {
    if (tender) {
      return {
        leadType: tender.leadType || 'Tender',
        customerName: tender.customerName || '',
        category: tender.category || ['PSG'],
        tenderAnnouncementDate: safeToISOString(tender.tenderAnnouncementDate),
        requestDate: safeToISOString(tender.requestDate),
        submissionDate: safeToISOString(tender.submissionDate),
        dateOfPriceRequestToVendor: safeToISOString(tender.dateOfPriceRequestToVendor),
        dateOfPriceReceivedFromVendor: safeToISOString(tender.dateOfPriceReceivedFromVendor),
        costFromVendor: tender.costFromVendor?.toString() || '',
        sellingPrice: tender.sellingPrice?.toString() || '',
        tenderStatus: tender.tenderStatus,
        lostReason: tender.lostReason || '',
        ignoredReason: tender.ignoredReason || '',
        competitorWinningPrice: tender.competitorWinningPrice || '',
        bankGuaranteeIssueDate: safeToISOString(tender.bankGuaranteeIssueDate),
        bankGuaranteeExpiryDate: safeToISOString(tender.bankGuaranteeExpiryDate),
        opg: tender.opg || '',
        iq: tender.iq || '',
        notes: tender.notes || ''
      }
    }
    return {
      leadType: 'Tender',
      customerName: '',
      category: ['PSG'],
      tenderAnnouncementDate: '',
      requestDate: '',
      submissionDate: '',
      dateOfPriceRequestToVendor: '',
      dateOfPriceReceivedFromVendor: '',
      costFromVendor: '',
      sellingPrice: '',
      tenderStatus: 'Under review',
      lostReason: '',
      ignoredReason: '',
      competitorWinningPrice: '',
      bankGuaranteeIssueDate: '',
      bankGuaranteeExpiryDate: '',
      opg: '',
      iq: '',
      notes: ''
    }
  })

  const [items, setItems] = useState<LeadItem[]>(() => tender?.items || [])
  const [attachments, setAttachments] = useState<LeadAttachment[]>(() => tender?.attachments || [])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Helper function to add a new item
  const addItem = () => {
    const newItem: LeadItem = {
      id: Date.now().toString(),
      description: '',
      partNumber: '',
      quantity: 1,
      costFromVendor: 0,
      sellingPrice: 0,
      profitMargin: 0,
      totalPrice: 0
    }
    setItems(prev => [...prev, newItem])
  }

  // Helper function to update an item
  const updateItem = (id: string, field: keyof LeadItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        
        // Calculate profit margin when cost or selling price changes
        if (field === 'costFromVendor' || field === 'sellingPrice') {
          if (updated.costFromVendor > 0) {
            updated.profitMargin = ((updated.sellingPrice - updated.costFromVendor) / updated.costFromVendor) * 100
          } else {
            updated.profitMargin = 0
          }
        }
        
        // Calculate total price when quantity or selling price changes
        if (field === 'quantity' || field === 'sellingPrice' || field === 'costFromVendor') {
          updated.totalPrice = updated.quantity * updated.sellingPrice
        }
        
        return updated
      }
      return item
    }))
  }

  // Helper function to remove an item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Helper function to handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'tender_document' | 'bank_guarantee' | 'proposal_offer') => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)
        formData.append('tenderId', tender?.id || 'new')
        
        // Upload to server
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const uploadResult = await response.json()
          
          const newAttachment: LeadAttachment = {
            id: uploadResult.id,
            name: uploadResult.name,
            type: type,
            url: uploadResult.url, // Server-side URL instead of blob URL
            uploadedBy: user.username,
            uploadedAt: new Date(),
            crossDomainCompatible: true // Mark as cross-domain compatible
          }
          setAttachments(prev => [...prev, newAttachment])
          
          // Show success message
          console.log('File uploaded successfully:', uploadResult.name)
        } else {
          // Fallback to blob URL if server upload fails
          console.warn('Server upload failed, using blob URL fallback')
          const newAttachment: LeadAttachment = {
            id: Date.now().toString(),
            name: file.name,
            type: type,
            url: URL.createObjectURL(file),
            uploadedBy: user.username,
            uploadedAt: new Date(),
            crossDomainCompatible: false // Mark as domain-specific
          }
          setAttachments(prev => [...prev, newAttachment])
        }
      } catch (error) {
        console.error('File upload error:', error)
        // Fallback to blob URL
        const newAttachment: LeadAttachment = {
          id: Date.now().toString(),
          name: file.name,
          type: type,
          url: URL.createObjectURL(file),
          uploadedBy: user.username,
          uploadedAt: new Date(),
          crossDomainCompatible: false // Mark as domain-specific
        }
        setAttachments(prev => [...prev, newAttachment])
      }
    }
  }

  // Helper function to remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  // Helper function to check if bank guarantee is expiring soon
  const isBankGuaranteeExpiringSoon = () => {
    if (!formData.bankGuaranteeExpiryDate) return false
    const expiryDate = new Date(formData.bankGuaranteeExpiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.costFromVendor)
    const selling = parseFloat(formData.sellingPrice)
    
    if (cost && selling && selling > 0) {
      return formatPercentage(((selling - cost) / selling * 100))
    }
    return '0.00'
  }

  const getCurrentResponseTime = () => {
    if (!formData.dateOfPriceRequestToVendor || !formData.dateOfPriceReceivedFromVendor) {
      return null
    }
    
    const requestDate = new Date(formData.dateOfPriceRequestToVendor)
    const receivedDate = new Date(formData.dateOfPriceReceivedFromVendor)
    
    return calculateResponseTime(requestDate, receivedDate)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }

    if (!formData.tenderStatus) {
      newErrors.tenderStatus = 'Tender status is required'
    }

    // Validate reason fields for Lost and Ignored statuses
    if (formData.tenderStatus === 'Lost' && !formData.lostReason.trim()) {
      newErrors.lostReason = 'Reason for losing the lead is required'
    }

    if (formData.tenderStatus === 'Ignored Leads' && !formData.ignoredReason.trim()) {
      newErrors.ignoredReason = 'Reason for ignoring the lead is required'
    }

    if (!formData.category || formData.category.length === 0) {
      newErrors.category = 'At least one category must be selected'
    }

    if (formData.costFromVendor && isNaN(parseFloat(formData.costFromVendor))) {
      newErrors.costFromVendor = 'Cost must be a valid number'
    }

    if (formData.sellingPrice && isNaN(parseFloat(formData.sellingPrice))) {
      newErrors.sellingPrice = 'Selling price must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const now = new Date()
      const requestDate = formData.dateOfPriceRequestToVendor ? new Date(formData.dateOfPriceRequestToVendor) : null
      const receivedDate = formData.dateOfPriceReceivedFromVendor ? new Date(formData.dateOfPriceReceivedFromVendor) : null
      
      const newTender: Lead = {
        id: tender?.id || Date.now().toString(),
        leadType: formData.leadType,
        customerName: formData.customerName,
        category: formData.category,
        tenderAnnouncementDate: formData.tenderAnnouncementDate ? new Date(formData.tenderAnnouncementDate) : null,
        requestDate: formData.requestDate ? new Date(formData.requestDate) : null,
        submissionDate: formData.submissionDate ? new Date(formData.submissionDate) : null,
        dateOfPriceRequestToVendor: requestDate,
        dateOfPriceReceivedFromVendor: receivedDate,
        responseTimeInDays: calculateResponseTime(requestDate, receivedDate),
        costFromVendor: formData.costFromVendor ? parseFloat(formData.costFromVendor) : null,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        profitMargin: formData.costFromVendor && formData.sellingPrice ? parseFloat(calculateProfitMargin()) : null,
        tenderStatus: formData.tenderStatus,
        lostReason: formData.lostReason || null,
        ignoredReason: formData.ignoredReason || null,
        competitorWinningPrice: formData.competitorWinningPrice || null,
        bankGuaranteeIssueDate: formData.bankGuaranteeIssueDate ? new Date(formData.bankGuaranteeIssueDate) : null,
        bankGuaranteeExpiryDate: formData.bankGuaranteeExpiryDate ? new Date(formData.bankGuaranteeExpiryDate) : null,
        opg: formData.opg || '',
        iq: formData.iq || '',
        notes: formData.notes || '',
        items: items,
        attachments: attachments,
        addedBy: tender?.addedBy || user.username,
        lastEditedBy: tender ? user.username : null,
        lastEditedAt: tender ? now : null,
        createdAt: tender?.createdAt || now,
        updatedAt: now
      }

      // Add UX delay for better user feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Log the change for audit trail
      try {
        await logTenderChange(
          user,
          tender ? 'UPDATE' : 'CREATE',
          newTender,
          tender || undefined
        );
        console.log('✅ Change logged successfully');
      } catch (logError) {
        console.error('❌ Failed to log change:', logError);
        // Don't fail the submission if logging fails
      }
      
      onSubmit(newTender)
    } catch (error) {
      console.error('Error saving tender:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleCategoryChange = (categoryValue: 'PSG' | 'IPG' | 'Software' | 'Poly') => {
    setFormData(prev => {
      const currentCategories = prev.category
      const isSelected = currentCategories.includes(categoryValue)
      
      let newCategories: ('PSG' | 'IPG' | 'Software' | 'Poly')[]
      
      if (isSelected) {
        // Remove category if already selected (but ensure at least one remains)
        newCategories = currentCategories.filter(cat => cat !== categoryValue)
        if (newCategories.length === 0) {
          newCategories = [categoryValue] // Keep at least one category
        }
      } else {
        // Add category if not selected
        newCategories = [...currentCategories, categoryValue]
      }
      
      return {
        ...prev,
        category: newCategories
      }
    })
    
    // Clear category error when user makes selection
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: undefined
      }))
    }
  }

  const profitMargin = calculateProfitMargin()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {tender ? 'Edit Tender' : 'Add New Tender'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {tender ? 'Update tender information and track changes' : 'Enter tender details to track its progress'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lead Type Selection */}
              <div>
                <label htmlFor="leadType" className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leadType"
                      value="Tender"
                      checked={formData.leadType === 'Tender'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Tender</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="leadType"
                      value="Quotation"
                      checked={formData.leadType === 'Quotation'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Quotation</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer/client name"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PSG', 'IPG', 'Software', 'Poly'] as const).map((categoryOption) => (
                    <label key={`tenderform-category-${categoryOption}`} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.category.includes(categoryOption)}
                        onChange={() => handleCategoryChange(categoryOption)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">{categoryOption}</span>
                    </label>
                  ))}
                </div>
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="tenderAnnouncementDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Announcement Date
                </label>
                <input
                  type="date"
                  id="tenderAnnouncementDate"
                  name="tenderAnnouncementDate"
                  value={formData.tenderAnnouncementDate}
                  onChange={handleInputChange}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date
                  {tender && user.role !== 'admin' && (
                    <span className="text-xs text-orange-600 ml-2">(Admin only after submission)</span>
                  )}
                </label>
                <input
                  type="date"
                  id="requestDate"
                  name="requestDate"
                  value={formData.requestDate}
                  onChange={handleInputChange}
                  disabled={!!(tender && user.role !== 'admin')} // Disable for non-admins when editing
                  placeholder=""
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    tender && user.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                  }`}
                />
                {tender && user.role !== 'admin' && (
                  <p className="text-xs text-orange-600 mt-1">
                    🔒 This date can only be modified by administrators after tender submission
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Timeline Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="submissionDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Date
                </label>
                <input
                  type="date"
                  id="submissionDate"
                  name="submissionDate"
                  value={formData.submissionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

            <div>
              <label htmlFor="dateOfPriceRequestToVendor" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Price Request to Vendor
                {tender && user.role !== 'admin' && (
                  <span className="text-xs text-orange-600 ml-2">(Admin only after submission)</span>
                )}
              </label>
              <input
                type="date"
                id="dateOfPriceRequestToVendor"
                name="dateOfPriceRequestToVendor"
                value={formData.dateOfPriceRequestToVendor}
                onChange={handleInputChange}
                disabled={!!(tender && user.role !== 'admin')} // Disable for non-admins when editing
                placeholder=""
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  tender && user.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
              {tender && user.role !== 'admin' && (
                <p className="text-xs text-orange-600 mt-1">
                  🔒 This date can only be modified by administrators after tender submission
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfPriceReceivedFromVendor" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Price Received from Vendor
                {tender && user.role !== 'admin' && (
                  <span className="text-xs text-orange-600 ml-2">(Admin only after submission)</span>
                )}
              </label>
              <input
                type="date"
                id="dateOfPriceReceivedFromVendor"
                name="dateOfPriceReceivedFromVendor"
                value={formData.dateOfPriceReceivedFromVendor}
                onChange={handleInputChange}
                disabled={!!(tender && user.role !== 'admin')} // Disable for non-admins when editing
                placeholder=""
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  tender && user.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
              {tender && user.role !== 'admin' && (
                <p className="text-xs text-orange-600 mt-1">
                  🔒 This date can only be modified by administrators after tender submission
                </p>
              )}
            </div>
          </div>
          </div>

          {/* Response Time Display */}
          {(formData.dateOfPriceRequestToVendor || formData.dateOfPriceReceivedFromVendor) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-900">Response Time Analysis</h3>
              </div>
              <div className="mt-2">
                {getCurrentResponseTime() !== null ? (
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm text-gray-600">Response Time: </span>
                      <span className={`font-semibold ${getResponseTimeStatus(getCurrentResponseTime()).color}`}>
                        {formatResponseTime(getCurrentResponseTime())}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getResponseTimeStatus(getCurrentResponseTime()).status === 'Excellent' ? 'bg-green-100 text-green-800' :
                        getResponseTimeStatus(getCurrentResponseTime()).status === 'Good' ? 'bg-blue-100 text-blue-800' :
                        getResponseTimeStatus(getCurrentResponseTime()).status === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getResponseTimeStatus(getCurrentResponseTime()).status}
                      </span>
                    </div>
                  </div>
                ) : formData.dateOfPriceRequestToVendor && !formData.dateOfPriceReceivedFromVendor ? (
                  <p className="text-sm text-amber-600">
                    ⏳ Waiting for price response from Vendor (Request sent: {new Date(formData.dateOfPriceRequestToVendor).toLocaleDateString()})
                  </p>
                ) : !formData.dateOfPriceRequestToVendor && formData.dateOfPriceReceivedFromVendor ? (
                  <p className="text-sm text-orange-600">
                    ⚠️ Price received but no request date recorded
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Enter both request and received dates to calculate response time
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Financial Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Financial Information
            </h3>
            
            {/* Financial fields - visible based on permissions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {safeUser.permissions?.canViewCostFromVendor && (
                <div>
                  <label htmlFor="costFromVendor" className="block text-sm font-medium text-gray-700 mb-2">
                    Cost from Vendor (JD)
                  </label>
                  <FormattedNumberInput
                    value={formData.costFromVendor}
                    onChange={(value) => setFormData(prev => ({ ...prev, costFromVendor: value.toString() }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.costFromVendor ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter cost"
                    id="costFromVendor"
                    name="costFromVendor"
                  />
                  {errors.costFromVendor && (
                    <p className="mt-1 text-sm text-red-600">{errors.costFromVendor}</p>
                  )}
                </div>
              )}

              {safeUser.permissions?.canViewSellingPrice && (
                <div>
                  <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (JD)
                  </label>
                  <FormattedNumberInput
                    value={formData.sellingPrice}
                    onChange={(value) => setFormData(prev => ({ ...prev, sellingPrice: value.toString() }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sellingPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter selling price"
                    id="sellingPrice"
                    name="sellingPrice"
                  />
                  {errors.sellingPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
                  )}
                </div>
              )}

              {safeUser.permissions?.canViewProfitMargin && (
                <div>
                  <label htmlFor="profitMargin" className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Margin
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="profitMargin"
                      value={`${profitMargin}%`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900 cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                    <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically calculated: (Selling Price - Cost) / Cost × 100
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Section - Conditional based on permissions */}
          {safeUser.permissions?.canViewTenderItems && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex-1">
                  Tender Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center space-x-2 px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-700">Item #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-4">
                      <div className="md:col-span-4 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter item description"
                          
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Part Number
                        </label>
                        <input
                          type="text"
                          value={item.partNumber}
                          onChange={(e) => updateItem(item.id, 'partNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter part number"
                        />
                      </div>
                      <div className="md:col-span-1 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost from Vendor (JD)
                        </label>
                        <FormattedNumberInput
                          value={item.costFromVendor}
                          onChange={(value) => updateItem(item.id, 'costFromVendor', value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          
                          placeholder="Enter cost"
                        />
                      </div>
                      <div className="md:col-span-3 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price (JD)
                        </label>
                        <FormattedNumberInput
                          value={item.sellingPrice}
                          onChange={(value) => updateItem(item.id, 'sellingPrice', value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          
                          placeholder="Enter selling price"
                        />
                      </div>
                    </div>
                    
                    {/* Profit Margin in separate row for better organization */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profit Margin (%)
                        </label>
                        <input
                          type="text"
                          value={item.profitMargin.toFixed(2)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 ${item.profitMargin < 0 ? 'text-red-600 font-semibold' : ''}`}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="text-lg font-semibold text-green-600">
                          {formatNumberWithCommas(item.totalPrice.toFixed(2))} JD
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Grand Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatNumberWithCommas(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2))} JD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Optional Fields Section - Conditional based on permissions */}
          {safeUser.permissions?.canViewOptionalFields && (
            <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Optional Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="opg" className="block text-sm font-medium text-gray-700 mb-2">
                      OPG#
                    </label>
                    <input
                      type="text"
                      id="opg"
                      name="opg"
                      value={formData.opg}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter OPG number"
                      
                    />
                  </div>

                  <div>
                    <label htmlFor="iq" className="block text-sm font-medium text-gray-700 mb-2">
                      IQ#
                    </label>
                    <input
                      type="text"
                      id="iq"
                      name="iq"
                      value={formData.iq}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter IQ number"
                      
                    />
                  </div>
                </div>
              </div>
          )}

          {/* Notes Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Notes
            </h3>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes or comments..."
                
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Attachments
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'tender_document')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Guarantee Copy
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'bank_guarantee')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, JPG, PNG
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Proposal Offer
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'proposal_offer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-xs text-gray-500">
                            {attachment.type === 'tender_document' ? 'Tender Document' : 
                             attachment.type === 'bank_guarantee' ? 'Bank Guarantee' : 'Tender Proposal Offer'} • 
                            Uploaded by {attachment.uploadedBy} on {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bank Guarantee Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Bank Guarantee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bankGuaranteeIssueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Guarantee Issue Date
                </label>
                <input
                  type="date"
                  id="bankGuaranteeIssueDate"
                  name="bankGuaranteeIssueDate"
                  value={formData.bankGuaranteeIssueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="bankGuaranteeExpiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Guarantee Expiry Date
                </label>
                <input
                  type="date"
                  id="bankGuaranteeExpiryDate"
                  name="bankGuaranteeExpiryDate"
                  value={formData.bankGuaranteeExpiryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bank Guarantee Warning */}
            {isBankGuaranteeExpiringSoon() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h4 className="text-sm font-medium text-amber-900">Bank Guarantee Expiring Soon</h4>
                </div>
                <p className="mt-1 text-sm text-amber-700">
                  The bank guarantee for this tender will expire on {formData.bankGuaranteeExpiryDate ? new Date(formData.bankGuaranteeExpiryDate).toLocaleDateString() : 'N/A'}. 
                  Please renew it before the expiry date.
                </p>
              </div>
            )}
          </div>

          {/* Status and Additional Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Status & Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tenderStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Tender Status *
              </label>
              <select
                id="tenderStatus"
                name="tenderStatus"
                value={formData.tenderStatus}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tenderStatus ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Under review">Under review</option>
                <option value="Global Agreement">Global Agreement</option>
                <option value="Ignored Leads">Ignored Leads</option>
              </select>
              {errors.tenderStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.tenderStatus}</p>
              )}
            </div>

            {/* Conditional Reason Field for Lost Status */}
            {formData.tenderStatus === 'Lost' && (
              <div>
                <label htmlFor="lostReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Losing the Lead *
                </label>
                <textarea
                  id="lostReason"
                  name="lostReason"
                  value={formData.lostReason}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Please provide the reason why this lead was lost..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lostReason ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.lostReason && (
                  <p className="mt-1 text-sm text-red-600">{errors.lostReason}</p>
                )}
              </div>
            )}

            {/* Conditional Reason Field for Ignored Leads Status */}
            {formData.tenderStatus === 'Ignored Leads' && (
              <div>
                <label htmlFor="ignoredReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Ignoring the Lead *
                </label>
                <textarea
                  id="ignoredReason"
                  name="ignoredReason"
                  value={formData.ignoredReason}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Please provide the reason why this lead is being ignored..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ignoredReason ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.ignoredReason && (
                  <p className="mt-1 text-sm text-red-600">{errors.ignoredReason}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="competitorWinningPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Competitor's Winning Price
              </label>
              <input
                type="text"
                id="competitorWinningPrice"
                name="competitorWinningPrice"
                value={formData.competitorWinningPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter competitor name or price"
              />
            </div>
          </div>
          </div>

          {/* Audit Information */}
          {tender && (
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Audit Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Added by:</span> {tender.addedBy}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(tender.createdAt).toLocaleString()}
                </div>
                {tender.lastEditedBy && (
                  <>
                    <div>
                      <span className="font-medium">Last edited by:</span> {tender.lastEditedBy}
                    </div>
                    <div>
                      <span className="font-medium">Last edited:</span> {tender.lastEditedAt ? new Date(tender.lastEditedAt).toLocaleString() : 'Never'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              
              className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : tender ? 'Update Tender' : 'Save Tender'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
