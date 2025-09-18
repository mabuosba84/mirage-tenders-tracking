export interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'user'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  permissions: UserPermissions
}

export interface UserPermissions {
  canViewCostFromVendor: boolean
  canViewSellingPrice: boolean
  canViewProfitMargin: boolean
  canViewTenderItems: boolean
  canEditTenders: boolean
  canDeleteTenders: boolean
  canViewFinancialReports: boolean
  canManageUsers: boolean
  canExportData: boolean
  canViewOptionalFields: boolean
}

export interface UserFormData {
  username: string
  email: string
  name: string
  password: string
  confirmPassword: string
  role: 'admin' | 'user'
  isActive: boolean
  permissions: UserPermissions
}

export interface PasswordResetData {
  userId: string
  newPassword: string
  confirmPassword: string
}

export interface LeadItem {
  id: string
  description: string
  partNumber: string
  quantity: number
  costFromVendor: number
  sellingPrice: number
  profitMargin: number
  totalPrice: number
}

export interface LeadAttachment {
  id: string
  name: string
  type: 'tender_document' | 'bank_guarantee' | 'proposal_offer'
  url: string
  uploadedBy: string
  uploadedAt: Date
  crossDomainCompatible?: boolean // Optional flag for cross-domain file access
}

export interface Lead {
  id: string
  leadType: 'Tender' | 'Quotation' // New field to distinguish between tender and quotation
  customerName: string
  category: ('PSG' | 'IPG' | 'Software' | 'Poly')[]
  tenderAnnouncementDate: Date | null
  requestDate: Date | null
  submissionDate: Date | null
  dateOfPriceRequestToVendor: Date | null
  dateOfPriceReceivedFromVendor: Date | null
  responseTimeInDays: number | null
  costFromVendor: number | null
  sellingPrice: number | null
  profitMargin: number | null
  tenderStatus: 'Won' | 'Lost' | 'Under review' | 'Global Agreement' | 'Ignored Leads'
  lostReason: string | null
  ignoredReason: string | null
  competitorWinningPrice: string | null
  bankGuaranteeIssueDate: Date | null
  bankGuaranteeExpiryDate: Date | null
  opg: string | null
  iq: string | null
  notes: string | null
  items: LeadItem[]
  attachments: LeadAttachment[]
  addedBy: string
  lastEditedBy: string | null
  lastEditedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface LeadFormData {
  leadType: 'Tender' | 'Quotation'
  customerName: string
  category: ('PSG' | 'IPG' | 'Software' | 'Poly')[]
  tenderAnnouncementDate: string
  requestDate: string
  submissionDate: string
  dateOfPriceRequestToVendor: string
  dateOfPriceReceivedFromVendor: string
  costFromVendor: string
  sellingPrice: string
  tenderStatus: 'Won' | 'Lost' | 'Under review' | 'Global Agreement' | 'Ignored Leads'
  lostReason: string
  ignoredReason: string
  competitorWinningPrice: string
  bankGuaranteeIssueDate: string
  bankGuaranteeExpiryDate: string
  opg: string
  iq: string
  notes: string
}

export interface FormErrors {
  customerName?: string
  category?: string
  tenderAnnouncementDate?: string
  requestDate?: string
  submissionDate?: string
  dateOfPriceRequestToVendor?: string
  dateOfPriceReceivedFromVendor?: string
  costFromVendor?: string
  sellingPrice?: string
  tenderStatus?: string
  lostReason?: string
  ignoredReason?: string
  competitorWinningPrice?: string
  bankGuaranteeIssueDate?: string
  bankGuaranteeExpiryDate?: string
  opg?: string
  iq?: string
  notes?: string
}

export interface LoginFormData {
  username: string
  password: string
}

// Change Log System Types
export interface ChangeLogEntry {
  id: string
  timestamp: Date
  userId: string
  username: string
  userRole: 'admin' | 'user'
  action: ChangeLogAction
  entity: ChangeLogEntity
  entityId?: string
  entityName?: string
  changes?: ChangeLogChanges
  ipAddress?: string
  userAgent?: string
  details?: string
}

export type ChangeLogAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'UPLOAD'
  | 'DOWNLOAD'

export type ChangeLogEntity = 
  | 'TENDER' 
  | 'USER' 
  | 'REPORT' 
  | 'FILE' 
  | 'SYSTEM'

export interface ChangeLogChanges {
  before?: Record<string, any>
  after?: Record<string, any>
  fields?: string[]
}

export interface ChangeLogFilter {
  startDate?: Date
  endDate?: Date
  userId?: string
  action?: ChangeLogAction
  entity?: ChangeLogEntity
  searchTerm?: string
}
