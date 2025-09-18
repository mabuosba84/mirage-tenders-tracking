// CRITICAL FIX: Persistent file storage for Railway
// This replaces in-memory globalStorage with actual file persistence

import fs from 'fs/promises';
import path from 'path';

interface FileData {
  id: string;
  data: string; // base64 encoded
  meta: {
    filename: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
  };
}

interface StorageData {
  tenders: any[];
  users: any[];
  files: FileData[];
  settings: {
    companyName: string;
    lastUpdated: string;
  };
  lastUpdated: string;
}

// Default data structure
const defaultData: StorageData = {
  tenders: [],
  users: [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@miragebs.com',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: null,
      permissions: {
        canViewCostFromHP: true,
        canViewSellingPrice: true,
        canViewProfitMargin: true,
        canViewTenderItems: true,
        canEditTenders: true,
        canDeleteTenders: true,
        canViewFinancialReports: true,
        canManageUsers: true,
        canExportData: true,
        canViewOptionalFields: true
      }
    },
    {
      id: '2',
      username: 'user',
      password: 'user123',
      role: 'user',
      name: 'Regular User',
      email: 'user@miragebs.com',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastLogin: null,
      permissions: {
        canViewCostFromHP: false,
        canViewSellingPrice: true,
        canViewProfitMargin: false,
        canViewTenderItems: true,
        canEditTenders: true,
        canDeleteTenders: false,
        canViewFinancialReports: false,
        canManageUsers: false,
        canExportData: true,
        canViewOptionalFields: true
      }
    },
    {
      id: '3',
      username: 'Basil',
      password: 'password123',
      role: 'user',
      name: 'Basil Haddad',
      email: 'basil@miragebs.com',
      isActive: true,
      createdAt: '2025-09-18T00:00:00.000Z',
      lastLogin: null,
      permissions: {
        canViewCostFromHP: false,
        canViewSellingPrice: true,
        canViewProfitMargin: false,
        canViewTenderItems: true,
        canEditTenders: true,
        canDeleteTenders: false,
        canViewFinancialReports: false,
        canManageUsers: false,
        canExportData: true,
        canViewOptionalFields: true
      }
    },
    {
      id: '4',
      username: 'Dina',
      password: 'password123',
      role: 'user',
      name: 'Dina Tellawi',
      email: 'dina@miragebs.com',
      isActive: true,
      createdAt: '2025-09-18T00:00:00.000Z',
      lastLogin: null,
      permissions: {
        canViewCostFromHP: false,
        canViewSellingPrice: true,
        canViewProfitMargin: false,
        canViewTenderItems: true,
        canEditTenders: true,
        canDeleteTenders: false,
        canViewFinancialReports: false,
        canManageUsers: false,
        canExportData: true,
        canViewOptionalFields: true
      }
    }
  ],
  files: [],
  settings: {
    companyName: 'Mirage Business Solutions',
    lastUpdated: '2024-01-01T00:00:00.000Z'
  },
  lastUpdated: '2024-01-01T00:00:00.000Z'
};

// Persistent storage file path
const STORAGE_FILE = path.join(process.cwd(), 'data', 'persistent-storage.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(STORAGE_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('📁 Created data directory:', dataDir);
  }
}

// Read data from persistent file storage
export async function readPersistentData(): Promise<StorageData> {
  try {
    await ensureDataDirectory();
    
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf8');
      const parsedData = JSON.parse(data);
      console.log('📖 Read persistent data:', parsedData.tenders?.length || 0, 'tenders');
      return parsedData;
    } catch (readError) {
      // File doesn't exist or is corrupted, create with default data
      console.log('📄 Creating new persistent storage file with default data');
      await writePersistentData(defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('❌ Error reading persistent data:', error);
    return defaultData;
  }
}

// Write data to persistent file storage
export async function writePersistentData(data: StorageData): Promise<void> {
  try {
    await ensureDataDirectory();
    
    // Update timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Write to file with backup
    const tempFile = STORAGE_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    
    // Atomic move to replace old file
    await fs.rename(tempFile, STORAGE_FILE);
    
    console.log('💾 Saved persistent data:', data.tenders?.length || 0, 'tenders');
  } catch (error) {
    console.error('❌ Error writing persistent data:', error);
    throw error;
  }
}

// Update specific field in persistent storage
export async function updatePersistentField(field: keyof StorageData, value: any): Promise<void> {
  const data = await readPersistentData();
  (data as any)[field] = value;
  await writePersistentData(data);
}

export type { StorageData, FileData };