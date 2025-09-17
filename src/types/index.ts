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
  canViewCostFromHP: boolean
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

export interface TenderItem {
  id: string
  description: string
  quantity: number
  costFromHP: number
  sellingPrice: number
  profitMargin: number
  totalPrice: number
}

export interface TenderAttachment {
  id: string
  name: string
  type: 'tender_document' | 'bank_guarantee' | 'proposal_offer'
  url: string
  uploadedBy: string
  uploadedAt: Date
  crossDomainCompatible?: boolean // Optional flag for cross-domain file access
}

export interface Tender {
  id: string
  customerName: string
  category: ('PSG' | 'IPG' | 'Software' | 'Poly')[]
  tenderAnnouncementDate: Date | null
  requestDate: Date | null
  submissionDate: Date | null
  dateOfPriceRequestToHp: Date | null
  dateOfPriceReceivedFromHp: Date | null
  responseTimeInDays: number | null
  costFromHP: number | null
  sellingPrice: number | null
  profitMargin: number | null
  tenderStatus: 'Won' | 'Lost' | 'Under review' | 'Global Agreement'
  competitorWinningPrice: string | null
  bankGuaranteeIssueDate: Date | null
  bankGuaranteeExpiryDate: Date | null
  opg: string | null
  iq: string | null
  notes: string | null
  items: TenderItem[]
  attachments: TenderAttachment[]
  addedBy: string
  lastEditedBy: string | null
  lastEditedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface TenderFormData {
  customerName: string
  category: ('PSG' | 'IPG' | 'Software' | 'Poly')[]
  tenderAnnouncementDate: string
  requestDate: string
  submissionDate: string
  dateOfPriceRequestToHp: string
  dateOfPriceReceivedFromHp: string
  costFromHP: string
  sellingPrice: string
  tenderStatus: 'Won' | 'Lost' | 'Under review' | 'Global Agreement'
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
  dateOfPriceRequestToHp?: string
  dateOfPriceReceivedFromHp?: string
  costFromHP?: string
  sellingPrice?: string
  tenderStatus?: string
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
