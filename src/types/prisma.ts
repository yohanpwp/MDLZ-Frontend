// Generated types based on updated Prisma schema

export enum UserRole {
  HQ = 'HQ',
  DISTRIBUTOR = 'DIST',
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum InvoiceType {
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED'
}

export enum CreditNoteType {
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  DISCOUNT = 'DISCOUNT'
}

export enum CreditNoteStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED'
}

export interface User {
  id: number
  email?: string
  username?: string
  password: string
  firstname?: string
  lastname?: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt: Date
  updatedBy?: string
  distributorId?: number
  distributor?: Distributor
}

export interface Distributor {
  id: number
  code: string
  name: string
  prefix: string
  taxId?: string
  address?: string
  contactAdmin?: string
  email?: string
  contactName?: string
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt: Date
  updatedBy?: string
  users: User[]
  customers: Customer[]
  invoices: Invoice[]
  creditNotes: CreditNote[]
}

export interface Product {
  id: number
  code: string
  description?: string
  sizeCode?: string
  uomSmall?: string
  uomBig?: string
  convFactor?: number
  listPrice?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  invoices: Invoice[]
  creditNotes: CreditNote[]
}

export interface Customer {
  id: number
  code: string
  distCode?: string
  name: string
  status: CustomerStatus
  contactPerson?: string
  contactNo?: string
  mobileNo?: string
  addr1?: string
  addr2?: string
  addr3?: string
  addr4?: string
  addr5?: string
  postalCode?: string
  customerHier3?: string
  invTermCode?: string
  creditLimit?: number
  taxRegNo?: string
  nodeDesc?: string
  branchCode?: string
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt: Date
  updatedBy?: string
  distributorId?: number
  distributor?: Distributor
  invoices: Invoice[]
  creditNotes: CreditNote[]
}

export interface Invoice {
  id: number
  distCode?: string
  invNo: string
  createDate: Date
  invoiceDate: Date
  warehouseCode?: string
  customerCode?: string
  salesmanCode?: string
  productCode: string
  productType: InvoiceType
  uomConvFactor: number
  uomCode?: string
  quantity: number
  netAmount: number
  promoDiscount?: number
  vatTaxAmount?: number
  totalNetAmount: number
  newVatTaxAmount?: number
  newTotalNetAmount?: number
  status: InvoiceStatus
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt: Date
  updatedBy?: string
  distributorId?: number
  distributor?: Distributor
  customerId?: number
  customer?: Customer
  productId?: number
  product?: Product
}

export interface CreditNote {
  id: number
  distCode?: string
  invNo: string
  createDate: Date
  invoiceDate: Date
  warehouseCode?: string
  customerCode?: string
  salesmanCode?: string
  productCode: string
  productType: CreditNoteType
  uomConvFactor: number
  uomCode?: string
  quantity: number
  netAmount: number
  promoDiscount?: number
  vatTaxAmount?: number
  totalNetAmount: number
  newVatTaxAmount?: number
  newTotalNetAmount?: number
  status: CreditNoteStatus
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt: Date
  updatedBy?: string
  distributorId?: number
  distributor?: Distributor
  customerId?: number
  customer?: Customer
  productId?: number
  product?: Product
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form types for UI
export interface InvoiceFormData {
  invNo: string
  invoiceDate: string
  customerCode?: string
  productCode: string
  productType: InvoiceType
  quantity: number
  netAmount: number
  vatTaxAmount?: number
  totalNetAmount: number
  status: InvoiceStatus
}

export interface CreditNoteFormData {
  invNo: string
  invoiceDate: string
  customerCode?: string
  productCode: string
  productType: CreditNoteType
  quantity: number
  netAmount: number
  vatTaxAmount?: number
  totalNetAmount: number
  status: CreditNoteStatus
}

export interface CustomerFormData {
  code: string
  name: string
  status: CustomerStatus
  contactPerson?: string
  contactNo?: string
  mobileNo?: string
  addr1?: string
  creditLimit?: number
  taxRegNo?: string
}