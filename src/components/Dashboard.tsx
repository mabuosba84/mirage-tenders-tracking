'use client'

import { useState, useEffect } from 'react'
import { User, Lead } from '@/types'
import { calculateResponseTime } from '@/utils/dateCalculations'
import { loadTendersFromStorage, saveTendersToStorage, loadCurrentUserFromStorage } from '@/utils/centralStorage'
import { getAllAuthoritativeUsers } from '@/utils/centralAuthority'
import Header from './Header'
import TenderForm from './TenderForm'
import TenderList from './TenderList'
import TenderSearch from './TenderSearch'
import Statistics from './Statistics'
import Reports from './Reports'
import UserManagement from './UserManagement'
import TenderPreview from './TenderPreview'
import ChangeLogDashboard from './ChangeLogDashboard'

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [tenders, setTenders] = useState<Lead[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'list' | 'search' | 'reports' | 'users' | 'changelog'>('overview')
  const [editingTender, setEditingTender] = useState<Lead | null>(null)
  const [viewingTender, setViewingTender] = useState<Lead | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    loadTenders()
    initializeUserSync()
  }, [])

  const initializeUserSync = async () => {
    try {
      // First get current leads from centralized storage to preserve them
      const currentTenders = await loadTendersFromStorage() || []
      
      // Sync current users to server on dashboard load from CENTRAL AUTHORITY ONLY
      const currentUsers = getAllAuthoritativeUsers()
      
      // Create server-compatible user objects with default passwords
      const serverUsers = currentUsers.map((user: User) => ({
        ...user,
        password: 'defaultPassword123', // Use default password for server sync
        permissions: {
          canViewCostFromVendor: user.permissions?.canViewCostFromVendor || false,
          canViewSellingPrice: user.permissions?.canViewSellingPrice || true,
          canViewProfitMargin: user.permissions?.canViewProfitMargin || false,
          canViewTenderItems: user.permissions?.canViewTenderItems || true,
          canEditTenders: user.permissions?.canEditTenders || true,
          canDeleteTenders: user.permissions?.canDeleteTenders || false,
          canViewFinancialReports: user.permissions?.canViewFinancialReports || false,
          canManageUsers: user.permissions?.canManageUsers || false,
          canExportData: user.permissions?.canExportData || false,
          canViewOptionalFields: user.permissions?.canViewOptionalFields || true
        }
      }))
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: serverUsers,
          tenders: currentTenders, // Send current tenders instead of empty array
          currentUser: user // Include current user for permission validation
        }),
      })
      
      if (response.ok) {
        console.log('✅ Initial sync to server completed (users + tenders)')
      }
    } catch (error) {
      console.log('⚠️ Initial sync failed:', error)
    }
  }

  const loadTenders = async () => {
    try {
      console.log('🔄 Loading tenders - 100% CENTRALIZED MODE');
      
      // ONLY load from server - NO localStorage fallback
      const response = await fetch('/api/sync');
      if (response.ok) {
        const serverData = await response.json();
        if (serverData.tenders && Array.isArray(serverData.tenders)) {
          console.log('📥 Loaded tenders from server (CENTRALIZED):', serverData.tenders.length);
          setTenders(serverData.tenders);
          return;
        }
      }
      
      // If server fails, show error - no local fallback
      console.error('❌ Server failed and no local fallback allowed in centralized mode');
      setTenders([]);
      
    } catch (error) {
      console.error('❌ Error loading tenders:', error);
      setTenders([]);
    }
  }

  const saveTendersLocal = async (tenderData: Lead[]) => {
    try {
      console.log('💾 Saving tenders - 100% CENTRALIZED MODE');
      
      // ONLY save to server - NO localStorage
      await syncTendersToServer(tenderData);
      
      // Immediately reload from server to ensure sync
      await loadTenders();
      
    } catch (error) {
      console.error('❌ Error saving to centralized storage:', error);
    }
  }

  const syncTendersToServer = async (tenderData: Lead[]) => {
    try {
      console.log('🔄 Syncing to server - 100% CENTRALIZED MODE');
      
      // Get current users from server (not localStorage)
      const usersResponse = await fetch('/api/sync');
      let serverUsers = [];
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        serverUsers = userData.users || [];
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          users: serverUsers,
          tenders: tenderData,
          source: 'centralized_update'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tenders synced to server (CENTRALIZED):', tenderData.length);
        setMessage('✅ Data synchronized successfully');
        return true;
      } else {
        console.error('❌ Failed to sync tenders to server');
        setMessage('❌ Failed to synchronize data');
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing tenders to server:', error);
      setMessage('❌ Sync error occurred');
      return false;
    }
  }

  const setMessage = (msg: string) => {
    setSaveMessage(msg)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleAddTender = (tenderData: Omit<Lead, 'id' | 'lastEditedAt' | 'responseTimeInDays'>) => {
    const newTender: Lead = {
      ...tenderData,
      id: Date.now().toString(),
      lastEditedAt: new Date(),
      responseTimeInDays: tenderData.submissionDate && tenderData.requestDate ? 
        Math.ceil((tenderData.submissionDate.getTime() - tenderData.requestDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
      lastEditedBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const updatedTenders = [newTender, ...tenders]
    setTenders(updatedTenders)
    saveTendersLocal(updatedTenders)
    setActiveTab('list')
    setMessage('Lead added successfully!')
  }

  const handleEditTender = (tenderData: Omit<Lead, 'id' | 'lastEditedAt' | 'responseTimeInDays'>) => {
    if (!editingTender) return
    
    // SECURITY: Check if user has permission to edit this tender
    const canEditThisTender = user.permissions?.canEditTenders && 
      (user.role === 'admin' || user.username === editingTender.addedBy)
    
    if (!canEditThisTender) {
      setMessage('❌ Access denied: You can only edit leads you created.')
      return
    }
    
    const updatedTender: Lead = {
      ...editingTender,
      ...tenderData,
      lastEditedAt: new Date(),
      responseTimeInDays: tenderData.submissionDate && tenderData.requestDate ? 
        Math.ceil((tenderData.submissionDate.getTime() - tenderData.requestDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
      lastEditedBy: user.username,
      updatedAt: new Date()
    }
    
    const updatedTenders = tenders.map(t => t.id === editingTender.id ? updatedTender : t)
    setTenders(updatedTenders)
    saveTendersLocal(updatedTenders)
    setEditingTender(null)
    setActiveTab('list')
    setMessage('✅ Lead updated successfully!')
  }

  const handleDeleteTender = (id: string) => {
    const tenderToDelete = tenders.find(t => t.id === id)
    if (!tenderToDelete) return
    
    // SECURITY: Check if user has permission to delete this tender
    const canDeleteThisTender = user.permissions?.canDeleteTenders && 
      (user.role === 'admin' || user.username === tenderToDelete.addedBy)
    
    if (!canDeleteThisTender) {
      setMessage('❌ Access denied: You can only delete leads you created.')
      return
    }
    
    if (confirm('Are you sure you want to delete this lead?')) {
      const updatedTenders = tenders.filter(t => t.id !== id)
      setTenders(updatedTenders)
      saveTendersLocal(updatedTenders)
      setMessage('Lead deleted successfully!')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Statistics tenders={tenders} user={user} />
      case 'add':
        return (
          <TenderForm 
            user={user} 
            onSubmit={editingTender ? handleEditTender : handleAddTender}
            tender={editingTender}
            onCancel={() => {
              setEditingTender(null)
              setActiveTab('list')
            }}
          />
        )
      case 'list':
        return (
          <TenderList 
            tenders={tenders}
            currentUser={user}
            onEdit={(tender: Lead) => {
              setEditingTender(tender)
              setActiveTab('add')
            }}
            onDelete={handleDeleteTender}
            onViewDetails={(tender: Lead) => setViewingTender(tender)}
          />
        )
      case 'search':
        return <TenderSearch tenders={tenders} user={user} onViewDetails={(tender: Lead) => setViewingTender(tender)} />
      case 'reports':
        return <Reports tenders={tenders} user={user} />
      case 'users':
        return user.permissions?.canManageUsers ? <UserManagement currentUser={user} /> : <Statistics tenders={tenders} user={user} />
      case 'changelog':
        return <ChangeLogDashboard currentUser={user} />
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
      
      <main className="container mx-auto px-4 py-8">
        {saveMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {saveMessage}
          </div>
        )}
        
        {renderContent()}
      </main>

      {viewingTender && (
        <TenderPreview
          tender={viewingTender}
          user={user}
          onClose={() => setViewingTender(null)}
        />
      )}
    </div>
  )
}
