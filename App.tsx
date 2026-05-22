import React, { useState, useEffect } from 'react';
import { InvoicePaper } from './components/InvoicePaper';
import { PaymentModal } from './components/PaymentModal';
import { Dashboard } from './components/Dashboard';
import { PaymentVoucherPaper } from './components/PaymentVoucherPaper';
import { VoucherDashboard } from './components/VoucherDashboard';
import { PaymentLedgerDashboard } from './components/PaymentLedgerDashboard';
import { EmailModal } from './components/EmailModal';
import { geminiService } from './services/geminiService';
import { InvoiceData, LineItem, VoucherData, PaymentRecord } from './types';
import {
  Sparkles,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  LayoutTemplate,
  Wand2,
  RefreshCw,
  ChevronRight,
  Download,
  History,
  PenLine,
  FileText,
  ReceiptText,
  Mail,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Generator for persistent unique IDs
const getNextInvoiceNumber = () => {
  if (typeof window === 'undefined') return 'INDY0187';

  const lastKey = 'smartinvoice_last_id';
  const lastVal = localStorage.getItem(lastKey);

  let nextNum = 187; // Start from screenshot default

  if (lastVal) {
    // Extract number from INDYxxxx
    const match = lastVal.match(/\d+/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }

  const newId = `INDY${nextNum.toString().padStart(4, '0')}`;
  localStorage.setItem(lastKey, newId);
  return newId;
};

const INITIAL_DATA: InvoiceData = {
  invoiceNumber: '', // Will be set on mount
  date: new Date().toISOString().split('T')[0],
  dueDate: '',

  senderName: 'Incanto Dynamics Pvt. Ltd.',
  senderAddress: 'No.373, 2nd Stage, 2nd Phase,\nWOC Road Rajajinagar\nBengaluru - 560 086.',
  senderEmail: 'enquiry@digitalmaven.co.in',
  senderGstin: '29AAHCI4821K1Z9',
  senderPan: 'AAHCI4821K',
  senderCin: 'U62099KA2024PTC183531',

  bankName: '',
  accountNumber: '',
  branchIfsc: '',

  clientName: 'Bhoomika',
  clientAddress: 'Bengaluru, Karnataka',
  clientEmail: '',
  clientPhone: '91- 98867 68322',
  clientGstin: 'NA',
  clientPan: '',
  clientStateCode: '29',

  deliveryPlace: 'NA',

  items: [
    {
      id: '1',
      description: 'Advanced Certification in AI Powered Data Analytics',
      hsnCode: '9992',
      quantity: 1,
      unit: 'No',
      price: 21186.4407
    }
  ],
  taxRate: 18, // 9% CGST + 9% SGST
  gstType: 'exclusive',
  notes: '',
  isPaid: false,
};

const INITIAL_VOUCHER_DATA: VoucherData = {
  voucherNumber: 'PV-2025-001',
  date: new Date().toISOString().split('T')[0],
  paymentMode: 'NEFT',
  financialYear: '2025-26',
  
  payeeName: '',
  payeeRole: 'Guest Faculty - AI Data Analytics',
  payeePan: '',
  trainingDates: '',
  invoiceRef: '',

  description: 'Advanced Certification in AI Powered Data Analytics',
  grossAmount: 0,
  tdsRate: 10,
};

type ViewMode = 'editor' | 'dashboard' | 'ledger';
type DocumentType = 'invoice' | 'voucher';

function App() {
  const [data, setData] = useState<InvoiceData>(INITIAL_DATA);
  const [voucherData, setVoucherData] = useState<VoucherData>(INITIAL_VOUCHER_DATA);
  const [history, setHistory] = useState<InvoiceData[]>([]);
  const [voucherHistory, setVoucherHistory] = useState<VoucherData[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [smartFillText, setSmartFillText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // AI Diagnostics State
  const [diagnosticStatus, setDiagnosticStatus] = useState<{
    testing: boolean;
    message: string;
    results?: {
      step1: boolean; // API Key Syntax
      step2: boolean; // Host Access
      step3: boolean; // Geographical permissions / Region Check
      rawError?: string;
    };
  } | null>(null);

  const [customApiKey, setCustomApiKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '';
  });

  // Load history & set initial invoice number
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem('smartinvoice_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    const savedVoucherHistory = localStorage.getItem('smartinvoice_voucher_history');
    if (savedVoucherHistory) {
      try {
        setVoucherHistory(JSON.parse(savedVoucherHistory));
      } catch (e) {
        console.error("Failed to parse voucher history");
      }
    }

    const savedPaymentHistory = localStorage.getItem('smartinvoice_payment_history');
    if (savedPaymentHistory) {
      try {
        setPaymentHistory(JSON.parse(savedPaymentHistory));
      } catch (e) {
        console.error("Failed to parse payment history");
      }
    }

    // Clear old invalid cached API key if present to allow the new default to take over
    const cachedKey = localStorage.getItem('user_gemini_api_key');
    if (cachedKey === 'AIzaSyCCrhSjpyr3c2dBynBewkitwZGxLAiMg18' || cachedKey === '') {
      localStorage.removeItem('user_gemini_api_key');
      setCustomApiKey('');
    }

    // Set Initial ID
    setData(prev => ({ ...prev, invoiceNumber: getNextInvoiceNumber() }));
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('smartinvoice_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('smartinvoice_voucher_history', JSON.stringify(voucherHistory));
  }, [voucherHistory]);

  useEffect(() => {
    localStorage.setItem('smartinvoice_payment_history', JSON.stringify(paymentHistory));
  }, [paymentHistory]);

  // Update document title for download filename fallback
  useEffect(() => {
    if (data.invoiceNumber) {
      document.title = `Invoice-${data.invoiceNumber}`;
    }
  }, [data.invoiceNumber]);

  const updateField = (field: keyof InvoiceData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateVoucherField = (field: keyof VoucherData, value: any) => {
    setVoucherData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      hsnCode: '',
      quantity: 1,
      unit: 'No',
      price: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsThinking(true);
    const result = await geminiService.parseInvoiceItems(smartFillText);

    if (result) {
      if (documentType === 'invoice') {
        setData(prev => {
          let newData = { ...prev };

          // 1. Handle Actions (Clear/Reset)
          if (result.actions?.clearClient) {
            newData.clientName = '';
            newData.clientAddress = '';
            newData.clientEmail = '';
            newData.clientPhone = '';
            newData.clientGstin = 'NA';
            newData.clientStateCode = '';
          }

          if (result.actions?.clearItems) {
            newData.items = [];
          }

          if (result.actions?.markAsUnpaid) {
            newData.isPaid = false;
          }

          if (result.actions?.markAsPaid) {
            newData.isPaid = true;
          }

          // 2. Apply extracted data (overwriting if necessary)
          if (result.clientDetails) {
            newData.clientName = result.clientDetails.name || newData.clientName;
            newData.clientAddress = result.clientDetails.address || newData.clientAddress;
            newData.clientGstin = result.clientDetails.gstin || newData.clientGstin;
            newData.clientPhone = result.clientDetails.phone || newData.clientPhone;
          }

          if (result.items && result.items.length > 0) {
            const currentTaxRate = newData.taxRate || 18;
            const taxMultiplier = 1 + (currentTaxRate / 100);
            const isInclusive = newData.gstType === 'inclusive';

            const newItems = result.items.map(item => {
              const derivedRate = isInclusive ? item.price / taxMultiplier : item.price;

              return {
                id: Math.random().toString(36).substr(2, 9),
                description: item.description,
                hsnCode: '',
                quantity: item.quantity,
                unit: 'No',
                price: derivedRate
              };
            });

            // Append new items to existing ones (unless cleared)
            newData.items = [...newData.items, ...newItems];
          }

          return newData;
        });
      } else {
        // documentType === 'voucher'
        setVoucherData(prev => {
          let newVoucher = { ...prev };

          // 1. Handle Actions (Clear/Reset)
          if (result.actions?.clearClient) {
            newVoucher.payeeName = '';
            newVoucher.payeeRole = '';
            newVoucher.payeePan = '';
            newVoucher.trainingDates = '';
            newVoucher.invoiceRef = '';
          }

          if (result.actions?.clearItems) {
            newVoucher.description = '';
            newVoucher.grossAmount = 0;
          }

          // 2. Apply extracted data
          if (result.clientDetails) {
            newVoucher.payeeName = result.clientDetails.name || newVoucher.payeeName;
          }

          if (result.items && result.items.length > 0) {
            newVoucher.description = result.items[0]?.description || newVoucher.description;
            const totalAmt = result.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            newVoucher.grossAmount = totalAmt || newVoucher.grossAmount;
          }

          // 3. Heuristic matching for specific Voucher fields in smartFillText
          const textLower = smartFillText.toLowerCase();

          // TDS Rate
          const tdsMatch = textLower.match(/tds\s*(?:rate)?\s*[:=]?\s*(\d+)/);
          if (tdsMatch) {
            newVoucher.tdsRate = parseFloat(tdsMatch[1]);
          }

          // PAN
          const panMatch = smartFillText.match(/pan\s*[:=]?\s*([a-z0-9]+)/i);
          if (panMatch) {
            newVoucher.payeePan = panMatch[1].toUpperCase();
          }

          // Role
          const roleMatch = smartFillText.match(/role\s*[:=]?\s*([a-z0-9\s\-]+?)(?=(?:,|\.|gross|amount|tds|pan|dates|ref|pv|$))/i);
          if (roleMatch) {
            newVoucher.payeeRole = roleMatch[1].trim();
          }

          // Training Dates
          const datesMatch = smartFillText.match(/(?:training\s+)?dates?\s*[:=]?\s*([\d\/\-\s]+to[\d\/\-\s]+|[\d\/\-\s]+)/i);
          if (datesMatch) {
            newVoucher.trainingDates = datesMatch[1].trim();
          }

          // Invoice Ref
          const refMatch = smartFillText.match(/(?:invoice\s+)?ref\s*[:=]?\s*([a-z0-9\-]+)/i);
          if (refMatch) {
            newVoucher.invoiceRef = refMatch[1].trim().toUpperCase();
          }

          // Payment Mode
          const modeMatch = smartFillText.match(/(?:payment\s+)?mode\s*[:=]?\s*([a-z0-9]+)/i);
          if (modeMatch) {
            newVoucher.paymentMode = modeMatch[1].trim().toUpperCase();
          } else {
            if (textLower.includes('neft')) newVoucher.paymentMode = 'NEFT';
            else if (textLower.includes('upi')) newVoucher.paymentMode = 'UPI';
            else if (textLower.includes('cheque')) newVoucher.paymentMode = 'CHEQUE';
            else if (textLower.includes('cash')) newVoucher.paymentMode = 'CASH';
          }

          // Financial Year
          const fyMatch = smartFillText.match(/(?:fy|financial\s+year)\s*[:=]?\s*(\d{4}-\d{2,4})/i);
          if (fyMatch) {
            newVoucher.financialYear = fyMatch[1].trim();
          }

          // Voucher Number
          const vnMatch = smartFillText.match(/(?:voucher\s*(?:no|number)?)\s*[:=]?\s*([a-z0-9\-]+)/i);
          if (vnMatch) {
            newVoucher.voucherNumber = vnMatch[1].trim().toUpperCase();
          }

          return newVoucher;
        });
      }

      setSmartFillText('');
    }
    setIsThinking(false);
  };

  const getTotal = () => {
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * (data.taxRate / 100);
    return subtotal + tax;
  };

  const saveToHistory = (currentData: InvoiceData) => {
    setHistory(prev => {
      // Check if invoice number already exists, if so update it
      const existingIndex = prev.findIndex(i => i.invoiceNumber === currentData.invoiceNumber);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = currentData;
        return newHistory;
      }
      return [...prev, currentData];
    });
  };

  const handlePaymentSuccess = (details: { paymentMode: string; referenceNumber: string }) => {
    const updatedData = { ...data, isPaid: true };
    setData(updatedData);
    setIsPaymentModalOpen(false);
    setActiveTab('preview');
    // Auto-save on payment success
    saveToHistory(updatedData);

    // Create payment ledger record
    const newRecord: PaymentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      documentNumber: data.invoiceNumber,
      documentType: 'invoice',
      clientName: data.clientName || 'Unnamed Entity',
      amount: getTotal(),
      paymentMode: details.paymentMode,
      referenceNumber: details.referenceNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'success'
    };
    setPaymentHistory(prev => [...prev, newRecord]);
  };

  const handleVoucherPayout = () => {
    const ref = prompt("Enter NEFT / UPI Transaction Reference Number (Leave blank to auto-generate):");
    if (ref === null) return; // User cancelled
    
    const finalRef = ref.trim() || 'REF-' + Math.floor(100000 + Math.random() * 900000);
    const voucherAmt = voucherData.grossAmount - (voucherData.grossAmount * (voucherData.tdsRate / 100));

    // Save voucher to history
    saveVoucherToHistory(voucherData);

    // Create payment ledger record for payout
    const newRecord: PaymentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      documentNumber: voucherData.voucherNumber,
      documentType: 'voucher',
      clientName: voucherData.payeeName || 'Unnamed Payee',
      amount: voucherAmt,
      paymentMode: voucherData.paymentMode || 'NEFT',
      referenceNumber: finalRef,
      date: new Date().toISOString().split('T')[0],
      status: 'success'
    };

    setPaymentHistory(prev => [...prev, newRecord]);
    alert(`Payout of ₹${Math.round(voucherAmt).toLocaleString('en-IN')} for ${voucherData.payeeName} has been successfully recorded in the audit ledger under Ref: ${finalRef}`);
  };

  const generatePDF = (docNumber: string, isVoucher: boolean = false) => {
    console.log('Generating PDF for:', docNumber);
    const elementId = isVoucher ? 'voucher-paper' : 'invoice-paper';
    const element = document.getElementById(elementId);

    if (!element) {
      console.error('Invoice element not found');
      alert('Error: Invoice element not found');
      return;
    }

    const A4_W = 794;
    const A4_H = 1120;

    const html2pdfOpts = {
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: A4_W,
        height: A4_H,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('invoice-paper');
          if (!el) return;

          el.style.width = A4_W + 'px';
          el.style.height = A4_H + 'px';
          el.style.minHeight = A4_H + 'px';
          el.style.maxHeight = A4_H + 'px';
          el.style.overflow = 'hidden';
          el.style.boxShadow = 'none';
          el.style.margin = '0';
          el.style.padding = '0';

          // Neutralize all parent transforms, overflow, min-height
          let parent = el.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.transform = 'none';
            parent.style.webkitTransform = 'none';
            parent.style.overflow = 'visible';
            parent.style.padding = '0';
            parent.style.margin = '0';
            parent.style.maxWidth = 'none';
            parent.style.maxHeight = 'none';
            parent.style.minHeight = '0';
            parent.style.width = 'auto';
            parent.style.height = 'auto';
            parent.style.border = 'none';
            parent.style.boxShadow = 'none';
            parent = parent.parentElement;
          }

          // Also fix body/html in the clone
          clonedDoc.body.style.margin = '0';
          clonedDoc.body.style.padding = '0';
          clonedDoc.body.style.overflow = 'hidden';
          clonedDoc.documentElement.style.margin = '0';
          clonedDoc.documentElement.style.padding = '0';
          clonedDoc.documentElement.style.overflow = 'hidden';
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const
      }
    };

    if (!(window as any).html2pdf) {
      console.warn('html2pdf library not found, falling back to print');
      window.print();
      return;
    }

    // Let html2pdf generate the PDF normally, then delete any extra blank pages
    // before saving. This is simpler and more reliable than intercepting the canvas.
    (window as any).html2pdf().set({
      ...html2pdfOpts,
      filename: isVoucher ? `PaymentVoucher-${docNumber}.pdf` : `Invoice-${docNumber}.pdf`,
      pagebreak: { mode: ['avoid-all'] }
    }).from(element).toPdf().get('pdf').then((pdf: any) => {
      // Delete all pages after page 1
      const totalPages = pdf.internal.getNumberOfPages();
      console.log(`PDF generated with ${totalPages} page(s)`);
      while (pdf.internal.getNumberOfPages() > 1) {
        pdf.deletePage(pdf.internal.getNumberOfPages());
      }
      console.log('Extra pages removed, saving single-page PDF');
    }).save()
      .then(() => {
        console.log('PDF saved successfully — single page');
      })
      .catch((err: any) => {
        console.error('PDF generation failed:', err);
        window.print();
      });
  };

  const compilePDFBase64 = async (): Promise<string | null> => {
    const isVoucher = documentType === 'voucher';
    const elementId = isVoucher ? 'voucher-paper' : 'invoice-paper';
    const element = document.getElementById(elementId);

    if (!element) {
      console.error('Document element not found');
      return null;
    }

    const A4_W = 794;
    const A4_H = 1120;

    const html2pdfOpts = {
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: A4_W,
        height: A4_H,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById(elementId);
          if (!el) return;

          el.style.width = A4_W + 'px';
          el.style.height = A4_H + 'px';
          el.style.minHeight = A4_H + 'px';
          el.style.maxHeight = A4_H + 'px';
          el.style.overflow = 'hidden';
          el.style.boxShadow = 'none';
          el.style.margin = '0';
          el.style.padding = '0';

          // Neutralize parent templates
          let parent = el.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.transform = 'none';
            parent.style.webkitTransform = 'none';
            parent.style.overflow = 'visible';
            parent.style.padding = '0';
            parent.style.margin = '0';
            parent.style.maxWidth = 'none';
            parent.style.maxHeight = 'none';
            parent.style.minHeight = '0';
            parent.style.width = 'auto';
            parent.style.height = 'auto';
            parent.style.border = 'none';
            parent.style.boxShadow = 'none';
            parent = parent.parentElement;
          }

          clonedDoc.body.style.margin = '0';
          clonedDoc.body.style.padding = '0';
          clonedDoc.body.style.overflow = 'hidden';
          clonedDoc.documentElement.style.margin = '0';
          clonedDoc.documentElement.style.padding = '0';
          clonedDoc.documentElement.style.overflow = 'hidden';
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const
      }
    };

    if (!(window as any).html2pdf) {
      console.warn('html2pdf library not found');
      return null;
    }

    try {
      const pdfBase64 = await (window as any).html2pdf()
        .set({
          ...html2pdfOpts,
          pagebreak: { mode: ['avoid-all'] }
        })
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          // Delete all pages after page 1
          while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages());
          }
          return pdf.output('datauristring');
        });
      
      if (pdfBase64) {
        const prefix = 'data:application/pdf;base64,';
        if (pdfBase64.startsWith(prefix)) {
          return pdfBase64.substring(prefix.length);
        }
        return pdfBase64;
      }
      return null;
    } catch (err) {
      console.error('PDF compile failed:', err);
      return null;
    }
  };

  const runAIDiagnostics = async () => {
    const keyToTest = customApiKey || "AIzaSyDBH3M0o5T7nBi3gdcGLSqYaRKkydmbI-0";
    setDiagnosticStatus({
      testing: true,
      message: "Initializing diagnostic checklist..."
    });

    // Step 1: Syntax Validation
    await new Promise(r => setTimeout(r, 600));
    const cleanKey = keyToTest.trim();
    if (!cleanKey.startsWith("AIzaSy")) {
      setDiagnosticStatus({
        testing: false,
        message: "Failed: Invalid API Key Prefix",
        results: { step1: false, step2: false, step3: false, rawError: "The API key must start with 'AIzaSy'. Please verify your key from Google AI Studio." }
      });
      return;
    }

    // Step 2: Google Host Access
    setDiagnosticStatus({
      testing: true,
      message: "Pinging Google GenAI endpoint (generativelanguage.googleapis.com)..."
    });
    await new Promise(r => setTimeout(r, 600));
    try {
      // Simple head fetch or dummy fetch to test resolution
      await fetch("https://generativelanguage.googleapis.com/", { method: "HEAD", mode: "no-cors" });
    } catch (e) {
      setDiagnosticStatus({
        testing: false,
        message: "Failed: Host Unreachable",
        results: { step1: true, step2: false, step3: false, rawError: "Could not establish connection to generativelanguage.googleapis.com. Please check your firewall, DNS, or proxy settings." }
      });
      return;
    }

    // Step 3: Run trial query & Geographical check
    setDiagnosticStatus({
      testing: true,
      message: "Sending trial payload & evaluating regional permissions..."
    });
    
    const diagResult = await geminiService.testConnection(cleanKey);
    if (diagResult.success) {
      setDiagnosticStatus({
        testing: false,
        message: "Success: AI service is fully functional and reachable!",
        results: { step1: true, step2: true, step3: true }
      });
    } else {
      setDiagnosticStatus({
        testing: false,
        message: "Failed: Handshake Refused",
        results: { step1: true, step2: true, step3: false, rawError: diagResult.errorDetails }
      });
    }
  };

  const saveVoucherToHistory = (currentData: VoucherData) => {
    setVoucherHistory(prev => {
      const existingIndex = prev.findIndex(i => i.voucherNumber === currentData.voucherNumber);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = currentData;
        return newHistory;
      }
      return [...prev, currentData];
    });
  };

  const handleDownload = () => {
    if (documentType === 'invoice') {
      saveToHistory(data);
      generatePDF(data.invoiceNumber, false);
    } else {
      saveVoucherToHistory(voucherData);
      generatePDF(voucherData.voucherNumber, true);
    }
  };

  const handleLoadInvoice = (invoice: InvoiceData) => {
    setData(invoice);
    setViewMode('editor');
    if (window.innerWidth < 768) {
      setActiveTab('preview');
    }
  };

  const handleDownloadHistoryItem = (invoice: InvoiceData) => {
    setData(invoice);
    // Allow React to render the new data into the InvoicePaper view
    setTimeout(() => {
      generatePDF(invoice.invoiceNumber);
    }, 100);
  };

  const handleDeleteInvoice = (invoiceNumber: string) => {
    if (confirm('Are you sure you want to delete this invoice history?')) {
      setHistory(prev => prev.filter(i => i.invoiceNumber !== invoiceNumber));
    }
  };

  const handleLoadVoucher = (voucher: VoucherData) => {
    setVoucherData(voucher);
    setViewMode('editor');
    if (window.innerWidth < 768) {
      setActiveTab('preview');
    }
  };

  const handleDownloadVoucherHistoryItem = (voucher: VoucherData) => {
    setVoucherData(voucher);
    setTimeout(() => {
      generatePDF(voucher.voucherNumber, true);
    }, 100);
  };

  const handleDeleteVoucher = (voucherNumber: string) => {
    if (confirm('Are you sure you want to delete this voucher history?')) {
      setVoucherHistory(prev => prev.filter(i => i.voucherNumber !== voucherNumber));
    }
  };

  const handleLoadDocument = (docNumber: string, docType: 'invoice' | 'voucher') => {
    if (docType === 'invoice') {
      const match = history.find(i => i.invoiceNumber === docNumber);
      if (match) {
        setData(match);
        setDocumentType('invoice');
        setViewMode('editor');
        setActiveTab('preview');
      } else {
        // Try searching inside active document since it may not be in history yet
        if (data.invoiceNumber === docNumber) {
          setDocumentType('invoice');
          setViewMode('editor');
          setActiveTab('preview');
        } else {
          alert(`Document ${docNumber} not found in history.`);
        }
      }
    } else {
      const match = voucherHistory.find(v => v.voucherNumber === docNumber);
      if (match) {
        setVoucherData(match);
        setDocumentType('voucher');
        setViewMode('editor');
        setActiveTab('preview');
      } else {
        if (voucherData.voucherNumber === docNumber) {
          setDocumentType('voucher');
          setViewMode('editor');
          setActiveTab('preview');
        } else {
          alert(`Voucher ${docNumber} not found in history.`);
        }
      }
    }
  };

  const handleDeleteRecord = (id: string) => {
    setPaymentHistory(prev => prev.filter(r => r.id !== id));
  };

  const handleClearLedger = () => {
    setPaymentHistory([]);
  };

  const getItemTotal = (item: LineItem) => {
    const sub = item.quantity * item.price;
    const tax = sub * (data.taxRate / 100);
    const val = sub + tax;
    return Math.round(val * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:bg-white overflow-hidden text-slate-900 font-sans">

      {/* --- Professional Sidebar / Editor --- */}
      <aside className={`no-print w-full md:w-[420px] lg:w-[460px] bg-white border-r border-slate-200 h-screen flex-shrink-0 flex flex-col z-30 transition-all duration-300 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header: Corporate Branding */}
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">SmartInvoice</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Edition</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setData({ ...INITIAL_DATA, invoiceNumber: getNextInvoiceNumber() });
                  setActiveTab('edit');
                }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all"
                title="Create New"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Document Type Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => setDocumentType('invoice')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${documentType === 'invoice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> Invoice
            </button>
            <button
              onClick={() => setDocumentType('voucher')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${documentType === 'voucher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ReceiptText size={14} /> Voucher
            </button>
          </div>

          {/* Navigation Tabs: Standard UI */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <PenLine size={14} /> Editor
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History size={14} /> History
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Activity size={14} /> Ledger
            </button>
          </div>
        </div>

        {/* Sidebar Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {viewMode === 'ledger' ? (
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Activity size={18} className="text-indigo-600 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Audit Ledger Active</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You are now viewing the unified Financial Audit Ledger in the main workspace. Here you can find a comprehensive registry of all completed payments and payouts.
                </p>
                <div className="border-t border-slate-200 pt-3">
                  <button
                    onClick={() => setViewMode('editor')}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                  >
                    Go Back to Editor
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'dashboard' ? (
            documentType === 'invoice' ? (
              <Dashboard
                history={history}
                onLoad={handleLoadInvoice}
                onDelete={handleDeleteInvoice}
                onDownload={handleDownloadHistoryItem}
              />
            ) : (
              <VoucherDashboard
                history={voucherHistory}
                onLoad={handleLoadVoucher}
                onDelete={handleDeleteVoucher}
                onDownload={handleDownloadVoucherHistoryItem}
              />
            )
          ) : (
            <div className="p-6 space-y-8 pb-32">

              {/* AI Utility Section: Clean & Professional */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-slate-700">
                    <Wand2 size={16} className="text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Smart Assist</span>
                  </div>

                  <textarea
                    className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:border-slate-400 outline-none resize-none bg-white placeholder:text-slate-400 h-20 transition-all mb-3"
                    placeholder="Type updates... e.g. 'Set client to Acme Corp', 'Change tax to 18%'"
                    value={smartFillText}
                    onChange={(e) => setSmartFillText(e.target.value)}
                  />

                  <button
                    onClick={handleSmartFill}
                    disabled={isThinking || !smartFillText}
                    className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {isThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isThinking ? 'Processing...' : 'Apply Changes'}
                  </button>
                </div>

                {/* API Key Configurator */}
                <div className="border-t border-slate-200 pt-3">
                  <details className="group">
                    <summary className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer list-none flex items-center gap-1.5">
                      <span className="transition-transform group-open:rotate-90 text-[8px]">▶</span>
                      AI Service Settings (Custom API Key)
                    </summary>
                    <div className="mt-2 space-y-2">
                      <p className="text-[10px] text-slate-500 leading-snug">
                        If the default AI service fails, enter your own free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">Google AI Studio</a>:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Paste AIzaSy... API key here"
                          value={customApiKey}
                          onChange={(e) => {
                            setCustomApiKey(e.target.value);
                            localStorage.setItem('user_gemini_api_key', e.target.value);
                          }}
                          className="flex-1 p-2 text-xs border border-slate-200 rounded bg-white outline-none focus:border-slate-400"
                        />
                        {customApiKey && (
                          <button
                            onClick={() => {
                              setCustomApiKey('');
                              localStorage.removeItem('user_gemini_api_key');
                            }}
                            className="px-2 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 rounded transition-all"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Run Diagnostics Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={runAIDiagnostics}
                          disabled={diagnosticStatus?.testing}
                          className="w-full py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 border border-transparent rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                        >
                          {diagnosticStatus?.testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                          Run AI Diagnostics
                        </button>
                      </div>

                      {/* Diagnostics Results Checklist */}
                      {diagnosticStatus && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-[11px] animate-fadeIn">
                          <div className="font-bold text-slate-800 flex items-center gap-1 border-b border-slate-200 pb-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            Diagnostics Log
                          </div>
                          
                          <div className="space-y-2">
                            {/* Step 1: Syntax */}
                            <div className="flex items-start gap-2">
                              {diagnosticStatus.testing && !diagnosticStatus.results ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin mt-0.5" />
                              ) : diagnosticStatus.results?.step1 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                              ) : diagnosticStatus.results && !diagnosticStatus.results.step1 ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 animate-bounce" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 mt-0.5" />
                              )}
                              <div>
                                <div className="font-bold text-slate-700">1. API Prefix Check</div>
                                <div className="text-[9px] text-slate-500">Requires 'AIzaSy' google key sequence.</div>
                              </div>
                            </div>

                            {/* Step 2: Host access */}
                            <div className="flex items-start gap-2">
                              {diagnosticStatus.testing && (!diagnosticStatus.results || (diagnosticStatus.results?.step1 && !diagnosticStatus.results?.step2 && !diagnosticStatus.results?.rawError)) ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin mt-0.5" />
                              ) : diagnosticStatus.results?.step2 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                              ) : diagnosticStatus.results && !diagnosticStatus.results.step2 ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 animate-bounce" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 mt-0.5" />
                              )}
                              <div>
                                <div className="font-bold text-slate-700">2. Host Availability Check</div>
                                <div className="text-[9px] text-slate-500">Ping generativelanguage.googleapis.com.</div>
                              </div>
                            </div>

                            {/* Step 3: Geographical & Model Test */}
                            <div className="flex items-start gap-2">
                              {diagnosticStatus.testing && (!diagnosticStatus.results || (diagnosticStatus.results?.step2 && !diagnosticStatus.results?.step3 && !diagnosticStatus.results?.rawError)) ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin mt-0.5" />
                              ) : diagnosticStatus.results?.step3 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                              ) : diagnosticStatus.results && !diagnosticStatus.results.step3 ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 animate-bounce" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 mt-0.5" />
                              )}
                              <div>
                                <div className="font-bold text-slate-700">3. Region & Trial Handshake</div>
                                <div className="text-[9px] text-slate-500">Run trial content model response generation.</div>
                              </div>
                            </div>
                          </div>

                          {/* Status Message */}
                          <div className={`mt-2 p-2 rounded text-[10px] font-bold leading-relaxed ${
                            diagnosticStatus.results?.step3 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            diagnosticStatus.results?.rawError ? 'bg-rose-50 text-rose-800 border border-rose-100 animate-pulse' :
                            'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}>
                            <span className="font-black uppercase tracking-wide">Status:</span> {diagnosticStatus.message}
                          </div>

                          {/* Raw error diagnostic logs printout */}
                          {diagnosticStatus.results?.rawError && (
                            <div className="mt-2 space-y-1">
                              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Raw Network Error Details:</span>
                              <pre className="p-2 bg-slate-900 text-rose-400 rounded text-[9px] leading-relaxed font-mono whitespace-pre-wrap max-h-32 overflow-y-auto border border-slate-800 select-all">
                                {diagnosticStatus.results.rawError}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>

              {/* Structured Editor Form */}
              <div className="space-y-10">
                {documentType === 'invoice' ? (
                  <>
                    {/* Invoice Metadata */}

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500">Invoice Number</label>
                      <input type="text" value={data.invoiceNumber} onChange={(e) => updateField('invoiceNumber', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500">Issue Date</label>
                      <input type="date" value={data.date} onChange={(e) => updateField('date', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500">Tax Rate (GST) %</label>
                      <input type="number" value={data.taxRate} onChange={(e) => updateField('taxRate', parseFloat(e.target.value))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500">Tax Calculation</label>
                      <select
                        value={data.gstType || 'exclusive'}
                        onChange={(e) => updateField('gstType', e.target.value)}
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none bg-white"
                      >
                        <option value="exclusive">Exclusive (+ Tax)</option>
                        <option value="inclusive">Inclusive (Inc. Tax)</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Sender Details */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Sender (From)</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Legal Company Name" value={data.senderName} onChange={(e) => updateField('senderName', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg font-bold outline-none focus:border-slate-400" />
                    <textarea placeholder="Business Address" value={data.senderAddress} onChange={(e) => updateField('senderAddress', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg h-24 resize-none outline-none focus:border-slate-400" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="GSTIN" value={data.senderGstin} onChange={(e) => updateField('senderGstin', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none" />
                      <input type="text" placeholder="PAN" value={data.senderPan} onChange={(e) => updateField('senderPan', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none" />
                    </div>
                  </div>
                </section>

                {/* Client Info */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Recipient (Bill To)</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Customer Name" value={data.clientName} onChange={(e) => updateField('clientName', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg font-bold outline-none focus:border-slate-400" />
                    <textarea placeholder="Billing Address" value={data.clientAddress} onChange={(e) => updateField('clientAddress', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg h-24 resize-none outline-none" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="GSTIN" value={data.clientGstin} onChange={(e) => updateField('clientGstin', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-xs" />
                      <input type="text" placeholder="State" value={data.clientStateCode} onChange={(e) => updateField('clientStateCode', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-xs" />
                      <input type="text" placeholder="Phone" value={data.clientPhone} onChange={(e) => updateField('clientPhone', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg text-xs" />
                    </div>
                  </div>
                </section>

                {/* Items Section */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Items</h3>
                    <button onClick={addItem} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all">
                      <Plus size={12} /> Add New Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.items.map((item) => (
                      <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                        <div className="flex gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Item Description"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="flex-1 text-sm font-bold border-b border-transparent focus:border-slate-400 outline-none"
                          />
                          <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-1 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-3">
                            <label className="text-[9px] font-bold text-slate-400 block mb-0.5">HSN</label>
                            <input type="text" value={item.hsnCode} onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)} className="w-full text-xs p-1.5 border border-slate-100 rounded bg-slate-50 focus:bg-white" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 block mb-0.5">QTY</label>
                            <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-xs p-1.5 border border-slate-100 rounded bg-slate-50 focus:bg-white" />
                          </div>
                          <div className="col-span-7 text-right">
                            <label className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-tighter">
                              Rate ({data.gstType === 'inclusive' ? 'Inc.' : 'Exc.'} GST)
                            </label>
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={data.gstType === 'inclusive' ? parseFloat((item.price * (1 + data.taxRate / 100)).toFixed(4)) : item.price}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  if (data.gstType === 'inclusive') {
                                    updateItem(item.id, 'price', val / (1 + data.taxRate / 100));
                                  } else {
                                    updateItem(item.id, 'price', val);
                                  }
                                }}
                                className="w-full text-sm p-1.5 border border-slate-100 rounded text-right font-bold bg-slate-50 focus:bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                  </>
                ) : (
                  <>
                    {/* Voucher Details */}
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Voucher Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Voucher No.</label>
                          <input type="text" value={voucherData.voucherNumber} onChange={(e) => updateVoucherField('voucherNumber', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Date</label>
                          <input type="date" value={voucherData.date} onChange={(e) => updateVoucherField('date', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Payment Mode</label>
                          <input type="text" placeholder="NEFT / UPI / Cheque" value={voucherData.paymentMode} onChange={(e) => updateVoucherField('paymentMode', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Financial Year</label>
                          <input type="text" placeholder="2025-26" value={voucherData.financialYear} onChange={(e) => updateVoucherField('financialYear', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                        </div>
                      </div>
                    </section>

                    {/* Payee Details */}
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payee Details</h3>
                      <div className="space-y-3">
                        <input type="text" placeholder="Faculty Full Name" value={voucherData.payeeName} onChange={(e) => updateVoucherField('payeeName', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg font-bold outline-none focus:border-slate-400" />
                        <input type="text" placeholder="Role" value={voucherData.payeeRole} onChange={(e) => updateVoucherField('payeeRole', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="PAN" value={voucherData.payeePan} onChange={(e) => updateVoucherField('payeePan', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none" />
                          <input type="text" placeholder="Invoice Ref." value={voucherData.invoiceRef} onChange={(e) => updateVoucherField('invoiceRef', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none" />
                        </div>
                        <input type="text" placeholder="Training Dates (DD/MM/YYYY - DD/MM/YYYY)" value={voucherData.trainingDates} onChange={(e) => updateVoucherField('trainingDates', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400" />
                      </div>
                    </section>

                    {/* Calculation Details */}
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Payment & TDS</h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Description of Programme</label>
                          <textarea value={voucherData.description} onChange={(e) => updateVoucherField('description', e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-400 h-20 resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500">Gross Amount (₹)</label>
                            <input type="number" value={voucherData.grossAmount} onChange={(e) => updateVoucherField('grossAmount', parseFloat(e.target.value) || 0)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500">TDS Rate (%)</label>
                            <input type="number" value={voucherData.tdsRate} onChange={(e) => updateVoucherField('tdsRate', parseFloat(e.target.value) || 0)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:border-slate-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Action */}
        <div className="md:hidden p-4 border-t border-slate-200 bg-white z-40">
          <button
            onClick={() => setActiveTab('preview')}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            Preview Document <ChevronRight size={18} />
          </button>
        </div>
      </aside>

      {/* --- Main Document Preview --- */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${activeTab === 'edit' ? 'hidden md:flex' : 'flex fixed inset-0 z-50 md:static'}`}>

        {viewMode === 'ledger' ? (
          <div className="flex-grow overflow-y-auto bg-slate-50">
            <PaymentLedgerDashboard
              paymentHistory={paymentHistory}
              onLoadDocument={handleLoadDocument}
              onDeleteRecord={handleDeleteRecord}
              onClearLedger={handleClearLedger}
            />
          </div>
        ) : (
          <>
            {/* Top bar: Actions */}
            <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 z-20 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document View</span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {/* Pay to Finalize button for unpaid invoices */}
                {documentType === 'invoice' && !data.isPaid && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Open Secure Card Payment Gateway"
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span className="hidden sm:inline">Pay to Finalize</span>
                  </button>
                )}

                {/* Record Payout button for vouchers */}
                {documentType === 'voucher' && (
                  <button
                    onClick={handleVoucherPayout}
                    className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    title="Log Outward Payout Reference"
                  >
                    <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span className="hidden sm:inline">Record Payout</span>
                  </button>
                )}

                {/* Send Email button */}
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Compose custom message with A4 Base64 PDF attachment"
                >
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Send Email</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-4 md:px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <Download size={16} /> <span>Download PDF</span>
                </button>
              </div>
            </header>

            {/* Preview Workspace */}
            <div className="flex-grow overflow-y-auto p-6 md:p-12 lg:p-16 flex justify-center items-start print:p-0 print:overflow-visible print:block bg-slate-100">
              <div className="scale-[0.8] md:scale-[0.9] lg:scale-100 origin-top print:transform-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200">
                {documentType === 'invoice' ? <InvoicePaper data={data} /> : <PaymentVoucherPaper data={voucherData} />}
              </div>
            </div>
          </>
        )}

      </main>

      {/* Payment Confirmation Modal */}
      <PaymentModal
        amount={documentType === 'invoice' ? getTotal() : (voucherData.grossAmount - (voucherData.grossAmount * (voucherData.tdsRate / 100)))}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Email Dispatcher Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        documentNumber={documentType === 'invoice' ? data.invoiceNumber : voucherData.voucherNumber}
        recipientEmail={documentType === 'invoice' ? data.clientEmail : ''}
        pdfBase64Provider={compilePDFBase64}
      />

    </div>
  );
}

export default App;