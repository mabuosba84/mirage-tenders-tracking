// Shared global storage for Vercel serverless functions
// This ensures all API routes use the same storage instance

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

interface GlobalStorage {
  tenders: any[];
  users: any[];
  files: FileData[];
  settings: {
    companyName: string;
    lastUpdated: string;
  };
  lastUpdated: string;
}

// Global storage instance - shared across all serverless functions
const globalStorage: GlobalStorage = {
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
        canViewCostFromVendor: true,
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
        canViewCostFromVendor: false,
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
      role: 'admin',
      name: 'Basil Haddad',
      email: 'basil@miragebs.com',
      isActive: true,
      createdAt: '2025-09-18T00:00:00.000Z',
      lastLogin: null,
      permissions: {
        canViewCostFromVendor: true,
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
        canViewCostFromVendor: false,
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

export { globalStorage, type FileData, type GlobalStorage };
