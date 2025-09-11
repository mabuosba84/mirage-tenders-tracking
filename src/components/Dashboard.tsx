'use client'

import { useState, useEffect } from 'react'
import { User, Tender } from '@/types'
import { calculateResponseTime } from '@/utils/dateCalculations'
import Header from './Header'
import TenderForm from './TenderForm'
import TenderList from './TenderList'
import TenderSearch from './TenderSearch'
import Statistics from './Statistics'
import Reports from './Reports'
import UserManagement from './UserManagement'
import TenderPreview from './TenderPreview'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [tenders, setTenders] = useState<Tender[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'list' | 'search' | 'reports' | 'users'>('overview')
  const [editingTender, setEditingTender] = useState<Tender | null>(null)
  const [viewingTender, setViewingTender] = useState<Tender | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Debug: Log tenders state changes
  useEffect(() => {
    console.log('Tenders state updated:', tenders.length, 'tenders')
    if (tenders.length > 0) {
      console.log('Sample tender:', tenders[0].customerName)
    }
  }, [tenders])

  // Load tenders from localStorage or start with empty array for real data
  useEffect(() => {
    const loadTenders = () => {
      try {
        const savedTenders = localStorage.getItem('mirage_tenders')
        console.log('Loading tenders from localStorage:', savedTenders ? 'Data found' : 'No data found')
        
        if (savedTenders) {
          const parsedTenders = JSON.parse(savedTenders)
          console.log('Parsed tenders count:', Array.isArray(parsedTenders) ? parsedTenders.length : 'Not an array')
          
          // Convert date strings back to Date objects and migrate category format
          const tendersWithDates = parsedTenders.map((tender: any, index: number) => {
            try {
              console.log(`Processing tender ${index + 1}:`, tender.customerName)
              
              // Migrate category from string to array if needed
              let categories = tender.category
              if (typeof categories === 'string') {
                categories = [categories]
                console.log(`Migrated category for tender ${index + 1} from string to array:`, categories)
              } else if (!Array.isArray(categories)) {
                categories = ['PSG'] // Default fallback
                console.log(`Invalid category format for tender ${index + 1}, defaulting to PSG`)
              }
              
              return {
                ...tender,
                category: categories,
                items: tender.items || [], // Ensure items is always an array
                tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
                requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
                submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
                dateOfPriceRequestToHp: tender.dateOfPriceRequestToHp ? new Date(tender.dateOfPriceRequestToHp) : null,
                dateOfPriceReceivedFromHp: tender.dateOfPriceReceivedFromHp ? new Date(tender.dateOfPriceReceivedFromHp) : null,
                bidBondIssueDate: tender.bidBondIssueDate ? new Date(tender.bidBondIssueDate) : null,
                bankGuaranteeIssueDate: tender.bankGuaranteeIssueDate ? new Date(tender.bankGuaranteeIssueDate) : null,
                bankGuaranteeExpiryDate: tender.bankGuaranteeExpiryDate ? new Date(tender.bankGuaranteeExpiryDate) : null,
                createdAt: new Date(tender.createdAt),
                updatedAt: new Date(tender.updatedAt),
                lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null,
                attachments: tender.attachments?.map((att: any) => ({
                  ...att,
                  uploadedAt: new Date(att.uploadedAt)
                })) || []
              }
            } catch (dateError) {
              console.error(`Error processing dates for tender ${index + 1}:`, dateError)
              // Return tender with original date strings if date parsing fails
              return tender
            }
          })
          console.log('Setting tenders with dates:', tendersWithDates.length)
          console.log('First tender after processing:', tendersWithDates[0])
          setTenders(tendersWithDates)
        } else {
          console.log('No saved tenders found, starting with empty array')
          // Start with empty array - users will add real data
          setTenders([])
        }
      } catch (error) {
        console.error('Error loading tenders from localStorage:', error)
        // Fallback to empty array if there's an error
        setTenders([])
      }
    }

    loadTenders()
  }, [])

  // Helper function to save tenders to localStorage
  const saveTendersToStorage = (tendersToSave: Tender[]) => {
    try {
      console.log('Saving tenders to localStorage:', tendersToSave.length)
      localStorage.setItem('mirage_tenders', JSON.stringify(tendersToSave))
      console.log('Tenders saved successfully')
      // Show save confirmation
      setSaveMessage('Data saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving tenders to localStorage:', error)
      setSaveMessage('Error saving data!')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleAddTender = (newTender: Tender) => {
    console.log('Adding new tender:', newTender.customerName)
    const updatedTenders = [newTender, ...tenders]
    console.log('Updated tenders count:', updatedTenders.length)
    setTenders(updatedTenders)
    saveTendersToStorage(updatedTenders)
    setActiveTab('list')
  }

  const handleEditTender = (tender: Tender) => {
    setEditingTender(tender)
    setActiveTab('add')
  }

  const handleUpdateTender = (updatedTender: Tender) => {
    const updatedTenders = tenders.map(t => t.id === updatedTender.id ? updatedTender : t)
    setTenders(updatedTenders)
    saveTendersToStorage(updatedTenders)
    setEditingTender(null)
    setActiveTab('list')
  }

  const handleDeleteTender = (tenderId: string) => {
    const updatedTenders = tenders.filter(t => t.id !== tenderId)
    setTenders(updatedTenders)
    saveTendersToStorage(updatedTenders)
  }

  const handleViewTenderDetails = (tender: Tender) => {
    setViewingTender(tender)
  }

  const handleCloseTenderPreview = () => {
    setViewingTender(null)
  }

  // Backup and restore functions for data management
  const exportData = () => {
    try {
      const dataToExport = {
        tenders: tenders,
        exportDate: new Date().toISOString(),
        exportedBy: user.name,
        version: '1.0'
      }
      const dataStr = JSON.stringify(dataToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mirage_tenders_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data. Please try again.')
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)
        
        if (importedData.tenders && Array.isArray(importedData.tenders)) {
          // Convert date strings back to Date objects
          const tendersWithDates = importedData.tenders.map((tender: any) => ({
            ...tender,
            tenderAnnouncementDate: tender.tenderAnnouncementDate ? new Date(tender.tenderAnnouncementDate) : null,
            requestDate: tender.requestDate ? new Date(tender.requestDate) : null,
            submissionDate: tender.submissionDate ? new Date(tender.submissionDate) : null,
            dateOfPriceRequestToHp: tender.dateOfPriceRequestToHp ? new Date(tender.dateOfPriceRequestToHp) : null,
            dateOfPriceReceivedFromHp: tender.dateOfPriceReceivedFromHp ? new Date(tender.dateOfPriceReceivedFromHp) : null,
            bidBondIssueDate: tender.bidBondIssueDate ? new Date(tender.bidBondIssueDate) : null,
            createdAt: new Date(tender.createdAt),
            updatedAt: new Date(tender.updatedAt),
            lastEditedAt: tender.lastEditedAt ? new Date(tender.lastEditedAt) : null
          }))
          
          setTenders(tendersWithDates)
          saveTendersToStorage(tendersWithDates)
          alert(`Successfully imported ${tendersWithDates.length} tenders!`)
        } else {
          alert('Invalid file format. Please select a valid backup file.')
        }
      } catch (error) {
        console.error('Error importing data:', error)
        alert('Error importing data. Please check the file format and try again.')
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Statistics tenders={tenders} user={user} />
            {/* Data Management Panel */}
            <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Data</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer focus-within:ring-2 focus-within:ring-green-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Import Data</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
                
                <div className="text-sm text-gray-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export your data for backup or import from a previous backup file
                </div>
              </div>
            </div>
          </>
        )
      case 'add':
        return (
          <TenderForm
            user={user}
            tender={editingTender}
            onSubmit={editingTender ? handleUpdateTender : handleAddTender}
            onCancel={() => {
              setEditingTender(null)
              setActiveTab('overview')
            }}
          />
        )
      case 'list':
        return (
          <TenderList
            tenders={tenders}
            currentUser={user}
            onEdit={handleEditTender}
            onDelete={handleDeleteTender}
            onViewDetails={handleViewTenderDetails}
          />
        )
      case 'search':
        return (
          <TenderSearch
            tenders={tenders}
            user={user}
            onViewDetails={handleViewTenderDetails}
          />
        )
      case 'reports':
        return <Reports tenders={tenders} user={user} />
      case 'users':
        return user.role === 'admin' ? <UserManagement currentUser={user} /> : <Statistics tenders={tenders} user={user} />
      default:
        return <Statistics tenders={tenders} user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Save Message Notification */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          {saveMessage}
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Tender Preview Modal */}
      {viewingTender && (
        <TenderPreview
          tender={viewingTender}
          user={user}
          onClose={handleCloseTenderPreview}
        />
      )}
    </div>
  )
}
