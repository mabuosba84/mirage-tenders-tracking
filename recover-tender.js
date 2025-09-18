// Recovery script to restore lost tender from uploaded files
// Run this in browser console if needed

async function recoverLostTender() {
  try {
    console.log('🔍 Starting tender recovery process...')
    
    // Get all file metadata
    const filesResponse = await fetch('/api/files/sync')
    if (!filesResponse.ok) {
      throw new Error('Failed to fetch files')
    }
    
    const filesData = await filesResponse.json()
    console.log('📁 Found', filesData.files?.length || 0, 'files')
    
    // Find recent orphaned files (tenderId: "new")
    const orphanedFiles = filesData.files?.filter(file => 
      file.tenderId === "new" && 
      new Date(file.uploadedAt) > new Date('2025-09-17T18:00:00Z')
    ) || []
    
    console.log('🔍 Found', orphanedFiles.length, 'orphaned files from today')
    
    if (orphanedFiles.length > 0) {
      console.log('📋 Orphaned files:', orphanedFiles.map(f => f.name))
      
      // Create a recovery tender with these files
      const recoveryTender = {
        id: `recovery-${Date.now()}`,
        customerName: `RECOVERED TENDER - ${new Date().toLocaleDateString()}`,
        category: ['PSG'],
        tenderAnnouncementDate: new Date(),
        requestDate: new Date(),
        submissionDate: null,
        dateOfPriceRequestToVendor: null,
        dateOfPriceReceivedFromVendor: null,
        responseTimeInDays: null,
        costFromVendor: null,
        sellingPrice: null,
        profitMargin: null,
        tenderStatus: 'Under Review',
        competitorWinningPrice: null,
        bidBondIssueDate: null,
        bankGuaranteeIssueDate: null,
        bankGuaranteeExpiryDate: null,
        opg: '',
        iq: '',
        notes: `RECOVERED TENDER: This tender was automatically recovered from orphaned file uploads. Original files were uploaded on ${orphanedFiles[0]?.uploadedAt}. Please review and update the tender details.`,
        items: [],
        attachments: orphanedFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          fileType: file.fileType,
          uploadedAt: file.uploadedAt
        })),
        addedBy: 'Dina',
        lastEditedBy: null,
        lastEditedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      console.log('💾 Creating recovery tender...')
      
      // Get current tenders
      const currentTenders = JSON.parse(localStorage.getItem('mirage_tenders') || '[]')
      
      // Add recovery tender
      const updatedTenders = [recoveryTender, ...currentTenders]
      
      // Save to all storage locations
      localStorage.setItem('mirage_tenders', JSON.stringify(updatedTenders))
      
      // Save to server
      const syncResponse = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenders: updatedTenders,
          source: 'recovery-script'
        })
      })
      
      if (syncResponse.ok) {
        console.log('✅ Recovery tender saved successfully!')
        console.log('🎉 Please refresh the page to see the recovered tender')
        return recoveryTender
      } else {
        throw new Error('Failed to save recovery tender to server')
      }
    } else {
      console.log('ℹ️ No orphaned files found - nothing to recover')
    }
    
  } catch (error) {
    console.error('❌ Recovery failed:', error)
    throw error
  }
}

// Auto-run recovery if this script is loaded
if (typeof window !== 'undefined') {
  recoverLostTender().catch(console.error)
}