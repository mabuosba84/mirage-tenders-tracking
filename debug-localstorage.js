// Debug script to check localStorage
console.log('=== localStorage Debug Info ===')

// Check if localStorage exists
if (typeof localStorage !== 'undefined') {
  console.log('localStorage is available')
  
  // Check mirage_tenders data
  const tendersData = localStorage.getItem('mirage_tenders')
  console.log('mirage_tenders key exists:', tendersData !== null)
  
  if (tendersData) {
    try {
      const parsed = JSON.parse(tendersData)
      console.log('Number of tenders stored:', Array.isArray(parsed) ? parsed.length : 'Not an array')
      console.log('Sample tender data:', parsed[0] || 'No tenders')
    } catch (e) {
      console.log('Error parsing tender data:', e.message)
    }
  }
  
  // Check all localStorage keys
  console.log('All localStorage keys:')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    console.log(`- ${key}`)
  }
} else {
  console.log('localStorage is not available')
}
