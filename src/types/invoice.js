/**
 * Invoice record interface and related types
 */

/**
 * @typedef {Object} InvoiceRecord
 * @property {string} id - Unique identifier for the record
 * @property {string} invoiceNumber - Invoice number
 * @property {string} customerName - Customer name
 * @property {string} customerCode - Customer code/ID
 * @property {number} amount - Base amount before tax
 * @property {number} taxRate - Tax rate as percentage (e.g., 10 for 10%)
 * @property {number} taxAmount - Calculated tax amount
 * @property {number} discountAmount - Discount amount if any
 * @property {number} totalAmount - Final total amount
 * @property {string} date - Invoice date in ISO format
 * @property {string} dueDate - Due date in ISO format
 * @property {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @property {string} status - Record validation status
 * @property {InvoiceLineItem[]} lineItems - Array of line items
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} InvoiceLineItem
 * @property {string} id - Line item ID
 * @property {string} productCode - Product/service code
 * @property {string} description - Item description
 * @property {number} quantity - Quantity
 * @property {number} unitPrice - Price per unit
 * @property {number} lineTotal - Total for this line item
 * @property {number} taxRate - Tax rate for this item
 * @property {number} taxAmount - Tax amount for this item
 */

/**
 * @typedef {'valid' | 'invalid' | 'pending' | 'processing'} ValidationStatus
 */

/**
 * @typedef {Object} FileProcessingResult
 * @property {boolean} success - Whether processing was successful
 * @property {InvoiceRecord[]} records - Parsed invoice records
 * @property {number} totalRecords - Total number of records processed
 * @property {number} validRecords - Number of valid records
 * @property {number} invalidRecords - Number of invalid records
 * @property {ProcessingError[]} errors - Array of processing errors
 * @property {Object} metadata - Processing metadata
 */

/**
 * @typedef {Object} ProcessingError
 * @property {number} row - Row number where error occurred
 * @property {string} field - Field name with error
 * @property {string} message - Error message
 * @property {string} value - Original value that caused error
 * @property {'validation' | 'parsing' | 'format'} type - Error type
 */

/**
 * @typedef {Object} ParsedFileData
 * @property {string} fileName - Original file name
 * @property {string} fileType - File type ('csv' or 'txt')
 * @property {number} fileSize - File size in bytes
 * @property {Date} processedAt - When the file was processed
 * @property {FileProcessingResult} result - Processing result
 */

// Default invoice record structure
export const createEmptyInvoiceRecord = () => ({
  id: "",
  invoiceNumber: "",
  customerName: "",
  customerCode: "",
  amount: 0,
  taxRate: 0,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 0,
  date: "",
  dueDate: "",
  currency: "USD",
  status: "pending",
  lineItems: [],
  metadata: {},
});

// CSV column mapping for different file formats
export const CSV_COLUMN_MAPPINGS = {
  standard: {
    invoiceNumber: ["invoice_number", "invoice_no", "invoice", "number"],
    customerName: ["customer_name", "customer", "client_name", "client"],
    customerCode: ["customer_code", "customer_id", "client_code", "client_id"],
    amount: ["amount", "base_amount", "subtotal", "net_amount"],
    taxRate: ["tax_rate", "vat_rate", "tax_percent", "vat_percent"],
    taxAmount: ["tax_amount", "vat_amount", "tax", "vat"],
    discountAmount: ["discount_amount", "discount", "discount_value"],
    totalAmount: ["total_amount", "total", "gross_amount", "final_amount"],
    date: ["date", "invoice_date", "created_date", "issue_date"],
    dueDate: ["due_date", "payment_date", "expiry_date"],
    currency: ["currency", "currency_code", "curr"],
  },
};

// Validation rules for invoice records
export const VALIDATION_RULES = {
  invoiceNumber: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[A-Za-z0-9\-_]+$/,
  },
  customerName: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  amount: {
    required: true,
    min: 0,
    type: "number",
  },
  taxRate: {
    required: false,
    min: 0,
    max: 100,
    type: "number",
  },
  taxAmount: {
    required: false,
    min: 0,
    type: "number",
  },
  totalAmount: {
    required: true,
    min: 0,
    type: "number",
  },
  date: {
    required: true,
    type: "date",
  },
  currency: {
    required: false,
    pattern: /^[A-Z]{3}$/,
    default: "USD",
  },
};
