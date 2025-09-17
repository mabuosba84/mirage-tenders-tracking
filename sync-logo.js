// Logo sync script for browser console
// Run this on localhost:3000 to sync logo to network storage

async function syncLogoToNetwork() {
  try {
    // Get logo from localStorage
    const logoData = localStorage.getItem('companyLogo');
    
    if (!logoData) {
      console.log('❌ No logo found in localStorage');
      console.log('💡 Upload a logo first through Settings > Company Logo Settings');
      return;
    }
    
    console.log('📤 Syncing logo to network storage...');
    console.log('Logo data length:', logoData.length);
    
    // Send to API using the force sync action
    const response = await fetch('/api/logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'forceSyncFromLocal',
        localLogo: logoData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Logo synced successfully!');
      console.log('💡 Now refresh the network page: http://172.18.0.1:3000');
      console.log('🔄 Or try refreshing this page to test sync');
    } else {
      console.log('❌ Failed to sync logo:', result.message);
    }
  } catch (error) {
    console.error('❌ Error syncing logo:', error);
  }
}

// Run the sync
console.log('🚀 Starting logo sync...');
syncLogoToNetwork();