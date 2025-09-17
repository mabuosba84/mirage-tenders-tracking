// Cross-domain data sync using URL parameters and local server
export const crossDomainSync = {
  // Check if we can detect data from another domain
  async checkForDataOnOtherDomain(): Promise<any> {
    try {
      // Try to fetch data from localhost if we're on network IP
      const currentHost = window.location.hostname;
      const otherUrl = currentHost === 'localhost' ? 
        'http://172.18.0.1:3001' : 
        'http://localhost:3001';
      
      // We can't directly access localStorage from another domain due to CORS
      // But we can create a sync mechanism using the server
      console.log('Current domain:', currentHost);
      console.log('Would check for data on:', otherUrl);
      
      return null;
    } catch (error) {
      console.error('Cross-domain check failed:', error);
      return null;
    }
  },

  // Set up data sharing via URL parameters
  async shareDataViaUrl(data: any): Promise<string> {
    try {
      const compressed = JSON.stringify(data);
      // For demo purposes, just return the data as base64
      return btoa(compressed);
    } catch (error) {
      console.error('Failed to share data via URL:', error);
      return '';
    }
  },

  // Load data from URL parameters
  async loadDataFromUrl(): Promise<any> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('syncData');
      
      if (dataParam) {
        const decompressed = atob(dataParam);
        return JSON.parse(decompressed);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load data from URL:', error);
      return null;
    }
  }
};
