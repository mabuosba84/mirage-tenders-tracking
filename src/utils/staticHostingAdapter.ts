// Client-side storage adapter for static hosting
interface TenderData {
  tenders: any[];
  users: any[];
  files: any[];
}

interface FileUploadData {
  name: string;
  size: number;
  type: string;
  data: string;
}

class StaticHostingStorage {
  private storageKey: string;

  constructor() {
    this.storageKey = 'mirage-tenders-data';
    this.init();
  }

  init(): void {
    // Initialize with default data if empty
    if (!localStorage.getItem(this.storageKey)) {
      const defaultData: TenderData = {
        tenders: [],
        users: [
          {
            id: 1,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Administrator',
            email: 'admin@miragebs.com'
          },
          {
            id: 2,
            username: 'user',
            password: 'user123',
            role: 'user',
            name: 'User',
            email: 'user@miragebs.com'
          }
        ],
        files: []
      };
      this.saveData(defaultData);
    }
  }

  getData(): any {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading data:', error);
      return {};
    }
  }

  saveData(data: any): boolean {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Simulate API responses
  async simulateAPI(endpoint: string, method: string = 'GET', data: any = null): Promise<any> {
    const storage = this.getData();
    
    switch (endpoint) {
      case '/api/sync':
        if (method === 'GET') {
          return {
            success: true,
            data: storage
          };
        } else if (method === 'POST') {
          Object.assign(storage, data);
          this.saveData(storage);
          return {
            success: true,
            message: 'Data saved successfully',
            count: storage.tenders?.length || 0
          };
        }
        break;
        
      case '/api/files/upload':
        // File upload simulation (base64 storage)
        if (method === 'POST' && data) {
          const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          const fileData = {
            id: fileId,
            name: data.name || 'unknown',
            size: data.size || 0,
            type: data.type || 'application/octet-stream',
            data: data.data, // base64 encoded
            uploadedAt: new Date().toISOString()
          };
          
          storage.files = storage.files || [];
          storage.files.push(fileData);
          this.saveData(storage);
          
          return {
            success: true,
            fileId: fileId,
            url: `/files/${fileId}`
          };
        }
        break;
        
      default:
        return { error: 'Endpoint not found' };
    }
  }
}

// Global instance for static hosting
declare global {
  interface Window {
    StaticStorage: StaticHostingStorage;
  }
}

if (typeof window !== 'undefined') {
  window.StaticStorage = new StaticHostingStorage();
}

export default StaticHostingStorage;