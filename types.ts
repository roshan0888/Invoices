export interface LineItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  
  // Sender Details
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderGstin: string;
  senderPan: string;
  senderCin: string;
  
  bankName: string;
  accountNumber: string;
  branchIfsc: string;

  // Client Details
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientGstin: string;
  clientPan: string;
  clientStateCode: string;
  clientPhone: string;

  deliveryPlace: string;
  
  items: LineItem[];
  taxRate: number; // Integrated Tax Rate (e.g., 18%)
  gstType: 'inclusive' | 'exclusive';
  notes: string;
  isPaid: boolean;
}

export interface SmartFillResponse {
  actions?: {
    clearClient?: boolean;
    clearItems?: boolean;
    markAsUnpaid?: boolean;
    markAsPaid?: boolean;
  };
  clientDetails?: {
    name?: string;
    address?: string;
    gstin?: string;
    phone?: string;
  };
  items?: {
    description: string;
    quantity: number;
    price: number;
  }[];
}

export enum PaymentStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface VoucherData {
  voucherNumber: string;
  date: string;
  paymentMode: string;
  financialYear: string;
  
  payeeName: string;
  payeeRole: string;
  payeePan: string;
  trainingDates: string;
  invoiceRef: string;

  description: string;
  grossAmount: number;
  tdsRate: number; // e.g. 10
}

export interface PaymentRecord {
  id: string;
  documentNumber: string;
  documentType: 'invoice' | 'voucher';
  clientName: string;
  amount: number;
  paymentMode: string;
  referenceNumber: string;
  date: string;
  status: 'success' | 'failed' | 'processing';
}