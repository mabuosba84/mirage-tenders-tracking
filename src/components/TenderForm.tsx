'use client'

import { useState, useEffect } from 'react'
import { User, Tender, TenderFormData, FormErrors, TenderItem, TenderAttachment } from '@/types'
import { Save, X, Calculator, Clock, Plus, Trash2, Upload, FileText, AlertTriangle, Shield } from 'lucide-react'
import { calculateResponseTime, formatResponseTime, getResponseTimeStatus, formatNumberWithCommas, formatPercentage } from '@/utils/dateCalculations'
import FormattedNumberInput from './FormattedNumberInput'

interface TenderFormProps {
  user: User
  tender?: Tender | null
  onSubmit: (tender: Tender) => void
  onCancel: () => void
}

export default function TenderForm({ user, tender, onSubmit, onCancel }: TenderFormProps) {
  const [formData, setFormData] = useState<TenderFormData>(() => {
    if (tender) {
      return {
        customerName: tender.customerName || '',
        category: tender.category || ['PSG'],
        tenderAnnouncementDate: tender.tenderAnnouncementDate ? tender.tenderAnnouncementDate.toISOString().split('T')[0] : '',
        requestDate: tender.requestDate ? tender.requestDate.toISOString().split('T')[0] : '',
        submissionDate: tender.submissionDate ? tender.submissionDate.toISOString().split('T')[0] : '',
        dateOfPriceRequestToHp: tender.dateOfPriceRequestToHp ? tender.dateOfPriceRequestToHp.toISOString().split('T')[0] : '',
        dateOfPriceReceivedFromHp: tender.dateOfPriceReceivedFromHp ? tender.dateOfPriceReceivedFromHp.toISOString().split('T')[0] : '',
        costFromHP: tender.costFromHP?.toString() || '',
        sellingPrice: tender.sellingPrice?.toString() || '',
        tenderStatus: tender.tenderStatus,
        competitorWinningPrice: tender.competitorWinningPrice || '',
        bankGuaranteeIssueDate: tender.bankGuaranteeIssueDate ? tender.bankGuaranteeIssueDate.toISOString().split('T')[0] : '',
        bankGuaranteeExpiryDate: tender.bankGuaranteeExpiryDate ? tender.bankGuaranteeExpiryDate.toISOString().split('T')[0] : '',
        opg: tender.opg || '',
        iq: tender.iq || '',
        notes: tender.notes || ''
      }
    }
    return {
      customerName: '',
      category: ['PSG'],
      tenderAnnouncementDate: '',
      requestDate: '',
      submissionDate: '',
      dateOfPriceRequestToHp: '',
      dateOfPriceReceivedFromHp: '',
      costFromHP: '',
      sellingPrice: '',
      tenderStatus: 'Under review',
      competitorWinningPrice: '',
      bankGuaranteeIssueDate: '',
      bankGuaranteeExpiryDate: '',
      opg: '',
      iq: '',
      notes: ''
    }
  })

  const [items, setItems] = useState<TenderItem[]>(() => tender?.items || [])
  const [attachments, setAttachments] = useState<TenderAttachment[]>(() => tender?.attachments || [])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Helper function to add a new item
  const addItem = () => {
    const newItem: TenderItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      costFromHP: 0,
      sellingPrice: 0,
      profitMargin: 0,
      totalPrice: 0
    }
    setItems(prev => [...prev, newItem])
  }

  // Helper function to update an item
  const updateItem = (id: string, field: keyof TenderItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        
        // Calculate profit margin when cost or selling price changes
        if (field === 'costFromHP' || field === 'sellingPrice') {
          if (updated.costFromHP > 0) {
            updated.profitMargin = ((updated.sellingPrice - updated.costFromHP) / updated.costFromHP) * 100
          } else {
            updated.profitMargin = 0
          }
        }
        
        // Calculate total price when quantity or selling price changes
        if (field === 'quantity' || field === 'sellingPrice' || field === 'costFromHP') {
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
          
          const newAttachment: TenderAttachment = {
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
          const newAttachment: TenderAttachment = {
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
        const newAttachment: TenderAttachment = {
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
    const cost = parseFloat(formData.costFromHP)
    const selling = parseFloat(formData.sellingPrice)
    
    if (cost && selling && selling > 0) {
      return formatPercentage(((selling - cost) / selling * 100))
    }
    return '0.00'
  }

  const getCurrentResponseTime = () => {
    if (!formData.dateOfPriceRequestToHp || !formData.dateOfPriceReceivedFromHp) {
      return null
    }
    
    const requestDate = new Date(formData.dateOfPriceRequestToHp)
    const receivedDate = new Date(formData.dateOfPriceReceivedFromHp)
    
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

    if (!formData.category || formData.category.length === 0) {
      newErrors.category = 'At least one category must be selected'
    }

    if (formData.costFromHP && isNaN(parseFloat(formData.costFromHP))) {
      newErrors.costFromHP = 'Cost must be a valid number'
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
      const requestDate = formData.dateOfPriceRequestToHp ? new Date(formData.dateOfPriceRequestToHp) : null
      const receivedDate = formData.dateOfPriceReceivedFromHp ? new Date(formData.dateOfPriceReceivedFromHp) : null
      
      const newTender: Tender = {
        id: tender?.id || Date.now().toString(),
        customerName: formData.customerName,
        category: formData.category,
        tenderAnnouncementDate: formData.tenderAnnouncementDate ? new Date(formData.tenderAnnouncementDate) : null,
        requestDate: formData.requestDate ? new Date(formData.requestDate) : null,
        submissionDate: formData.submissionDate ? new Date(formData.submissionDate) : null,
        dateOfPriceRequestToHp: requestDate,
        dateOfPriceReceivedFromHp: receivedDate,
        responseTimeInDays: calculateResponseTime(requestDate, receivedDate),
        costFromHP: formData.costFromHP ? parseFloat(formData.costFromHP) : null,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        profitMargin: formData.costFromHP && formData.sellingPrice ? parseFloat(calculateProfitMargin()) : null,
        tenderStatus: formData.tenderStatus,
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date
                </label>
                <input
                  type="date"
                  id="requestDate"
                  name="requestDate"
                  value={formData.requestDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!user.permissions?.canEditTenders || (!!formData.requestDate && user.role !== 'admin')}
                />
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
              <label htmlFor="dateOfPriceRequestToHp" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Price Request to HP
              </label>
              <input
                type="date"
                id="dateOfPriceRequestToHp"
                name="dateOfPriceRequestToHp"
                value={formData.dateOfPriceRequestToHp}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!user.permissions?.canEditTenders || (!!formData.dateOfPriceRequestToHp && user.role !== 'admin')}
              />
            </div>

            <div>
              <label htmlFor="dateOfPriceReceivedFromHp" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Price Received from HP
              </label>
              <input
                type="date"
                id="dateOfPriceReceivedFromHp"
                name="dateOfPriceReceivedFromHp"
                value={formData.dateOfPriceReceivedFromHp}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!user.permissions?.canEditTenders || (!!formData.dateOfPriceReceivedFromHp && user.role !== 'admin')}
              />
            </div>
          </div>
          </div>

          {/* Response Time Display */}
          {(formData.dateOfPriceRequestToHp || formData.dateOfPriceReceivedFromHp) && (
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
                ) : formData.dateOfPriceRequestToHp && !formData.dateOfPriceReceivedFromHp ? (
                  <p className="text-sm text-amber-600">
                    ⏳ Waiting for price response from HP (Request sent: {new Date(formData.dateOfPriceRequestToHp).toLocaleDateString()})
                  </p>
                ) : !formData.dateOfPriceRequestToHp && formData.dateOfPriceReceivedFromHp ? (
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
            
            {/* Hide cost from HP for users without permission */}
            {user.permissions?.canViewCostFromHP && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="costFromHP" className="block text-sm font-medium text-gray-700 mb-2">
                    Cost from HP (JD)
                  </label>
                  <FormattedNumberInput
                    value={formData.costFromHP}
                    onChange={(value) => setFormData(prev => ({ ...prev, costFromHP: value.toString() }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.costFromHP ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter cost"
                    id="costFromHP"
                    name="costFromHP"
                  />
                  {errors.costFromHP && (
                    <p className="mt-1 text-sm text-red-600">{errors.costFromHP}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (JD)
                  </label>
                  {user.permissions?.canViewSellingPrice ? (
                    <FormattedNumberInput
                      value={formData.sellingPrice}
                      onChange={(value) => setFormData(prev => ({ ...prev, sellingPrice: value.toString() }))}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sellingPrice ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter selling price"
                      disabled={!user.permissions?.canEditTenders}
                      id="sellingPrice"
                      name="sellingPrice"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500">
                      Selling price information is restricted
                    </div>
                  )}
                  {errors.sellingPrice && user.permissions?.canViewSellingPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Margin
                  </label>
                  {user.permissions?.canViewProfitMargin ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                        <span className={`text-lg font-semibold ${parseFloat(profitMargin) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {profitMargin}%
                        </span>
                      </div>
                      <Calculator className="h-5 w-5 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500">
                      Profit margin information is restricted
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {user.permissions?.canViewProfitMargin ? 'Automatically calculated' : 'Access restricted'}
                  </p>
                </div>
              </div>
            )}

            {/* For users without cost viewing permission, show only allowed fields */}
            {!user.permissions?.canViewCostFromHP && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.permissions?.canViewSellingPrice && (
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
                      disabled={!user.permissions?.canEditTenders}
                      id="sellingPrice"
                      name="sellingPrice"
                    />
                    {errors.sellingPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
                    )}
                  </div>
                )}

                {!user.permissions?.canViewSellingPrice && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Financial Information Restricted</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      You do not have permission to view financial information for this tender.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Section */}
          {user.permissions?.canViewTenderItems ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex-1">
                  Tender Items
                </h3>
                {user.permissions?.canEditTenders && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center space-x-2 px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                )}
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
                      {user.permissions?.canEditTenders && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter item description"
                          disabled={!user.permissions?.canEditTenders}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={!user.permissions?.canEditTenders}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost from HP (JD)
                        </label>
                        <FormattedNumberInput
                          value={item.costFromHP}
                          onChange={(value) => updateItem(item.id, 'costFromHP', value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={!user.permissions?.canEditTenders}
                          placeholder="Enter cost"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price (JD)
                        </label>
                        <FormattedNumberInput
                          value={item.sellingPrice}
                          onChange={(value) => updateItem(item.id, 'sellingPrice', value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          disabled={!user.permissions?.canEditTenders}
                          placeholder="Enter selling price"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profit Margin (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.profitMargin}
                          onChange={(e) => updateItem(item.id, 'profitMargin', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 ${item.profitMargin < 0 ? 'text-red-600 font-semibold' : ''}`}
                          disabled={true}
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
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Tender Items
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Tender Items Access Restricted</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  You do not have permission to view tender items for this tender.
                </p>
              </div>
            </div>
          )}

          {/* Optional Fields Section */}
          {user.permissions?.canViewOptionalFields && (
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
                    disabled={!user.permissions?.canEditTenders}
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
                    disabled={!user.permissions?.canEditTenders}
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
                disabled={!user.permissions?.canEditTenders}
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
                            Uploaded by {attachment.uploadedBy} on {attachment.uploadedAt.toLocaleDateString()}
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
              </select>
              {errors.tenderStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.tenderStatus}</p>
              )}
            </div>

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
              disabled={isLoading}
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
