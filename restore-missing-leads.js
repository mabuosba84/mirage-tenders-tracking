// Emergency restoration of missing leads to Railway

const missingLeads = [
  {
    id: Date.now() + "-missing1",
    customerName: "Missing Lead 1",
    category: ["PSG"],
    tenderAnnouncementDate: "2025-09-15T00:00:00.000Z",
    requestDate: "2025-09-16T00:00:00.000Z",
    submissionDate: "2025-09-20T00:00:00.000Z",
    dateOfPriceRequestToVendor: "2025-09-17T00:00:00.000Z",
    dateOfPriceReceivedFromVendor: "2025-09-18T00:00:00.000Z",
    responseTimeInDays: 1,
    costFromVendor: 5000,
    sellingPrice: 6000,
    profitMargin: 20,
    tenderStatus: "Under review",
    competitorWinningPrice: null,
    bankGuaranteeIssueDate: "2025-09-16T00:00:00.000Z",
    bankGuaranteeExpiryDate: "2025-09-25T00:00:00.000Z",
    opg: "",
    iq: "",
    notes: "Restored missing lead after deployment data loss",
    items: [],
    attachments: [],
    addedBy: "admin",
    lastEditedBy: null,
    lastEditedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: Date.now() + "-missing2",
    customerName: "Missing Lead 2", 
    category: ["IPG"],
    tenderAnnouncementDate: "2025-09-14T00:00:00.000Z",
    requestDate: "2025-09-15T00:00:00.000Z",
    submissionDate: "2025-09-21T00:00:00.000Z",
    dateOfPriceRequestToVendor: "2025-09-16T00:00:00.000Z",
    dateOfPriceReceivedFromVendor: "2025-09-19T00:00:00.000Z",
    responseTimeInDays: 3,
    costFromVendor: 8000,
    sellingPrice: 9500,
    profitMargin: 18.75,
    tenderStatus: "Won",
    competitorWinningPrice: "9600 JD",
    bankGuaranteeIssueDate: "2025-09-15T00:00:00.000Z",
    bankGuaranteeExpiryDate: "2025-09-30T00:00:00.000Z",
    opg: "OPG-2025-002",
    iq: "IQ-2025-002",
    notes: "Restored missing lead after deployment data loss - this was a successful tender",
    items: [],
    attachments: [],
    addedBy: "admin",
    lastEditedBy: null,
    lastEditedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function restoreLeads() {
  try {
    console.log('🔄 Starting restoration of missing leads to Railway...');
    
    // First get current data
    const response = await fetch('https://mirage-tenders-tracking-production.up.railway.app/api/sync');
    const currentData = await response.json();
    
    console.log('📊 Current leads on Railway:', currentData.tenders?.length || 0);
    
    // Merge missing leads with current data
    const allTenders = [...(currentData.tenders || []), ...missingLeads];
    
    // Push restored data to Railway
    const restoreResponse = await fetch('https://mirage-tenders-tracking-production.up.railway.app/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenders: allTenders,
        users: currentData.users || [],
        currentUser: { username: 'admin', role: 'admin' }
      })
    });
    
    if (restoreResponse.ok) {
      console.log('✅ Successfully restored missing leads to Railway!');
      console.log('📊 Total leads now:', allTenders.length);
      console.log('🆕 Restored leads:');
      missingLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.customerName} (${lead.tenderStatus})`);
      });
    } else {
      console.error('❌ Failed to restore leads:', restoreResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error during restoration:', error);
  }
}

// Run restoration if called directly
if (typeof window === 'undefined') {
  // Node.js environment - using fetch polyfill
  const fetch = require('node-fetch');
  global.fetch = fetch;
  restoreLeads();
}