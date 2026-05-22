import React, { useState } from 'react';
import { PaymentRecord } from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  TrendingUp, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  Download,
  CreditCard,
  Building,
  Activity
} from 'lucide-react';

interface PaymentLedgerDashboardProps {
  paymentHistory: PaymentRecord[];
  onLoadDocument: (docNumber: string, docType: 'invoice' | 'voucher') => void;
  onDeleteRecord: (id: string) => void;
  onClearLedger: () => void;
}

export const PaymentLedgerDashboard: React.FC<PaymentLedgerDashboardProps> = ({
  paymentHistory,
  onLoadDocument,
  onDeleteRecord,
  onClearLedger
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'processing'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'invoice' | 'voucher'>('all');

  // Filter records
  const filteredRecords = paymentHistory.filter(record => {
    const matchesSearch = 
      record.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.paymentMode && record.paymentMode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const successPayments = paymentHistory.filter(r => r.status === 'success');
  const totalReceived = successPayments.reduce((sum, r) => sum + r.amount, 0);
  const invoiceReceived = successPayments.filter(r => r.documentType === 'invoice').reduce((sum, r) => sum + r.amount, 0);
  const voucherDisbursed = successPayments.filter(r => r.documentType === 'voucher').reduce((sum, r) => sum + r.amount, 0);

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;
    
    const headers = ['ID', 'Doc Number', 'Doc Type', 'Client/Payee', 'Amount', 'Payment Mode', 'Reference No', 'Date', 'Status'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.documentNumber,
      r.documentType.toUpperCase(),
      r.clientName,
      r.amount,
      r.paymentMode,
      r.referenceNumber,
      r.date,
      r.status.toUpperCase()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payment_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-50 min-h-full w-full p-6 md:p-8 space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-slate-800" />
            Financial Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time transaction log for generated invoices & training fee disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            title="Export to Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          {paymentHistory.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure you want to clear the entire financial audit log? This action is irreversible.')) {
                  onClearLedger();
                }
              }}
              className="px-4 py-2 border border-red-200 text-red-600 bg-red-50/50 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-700 transition-all shadow-sm"
            >
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      {/* Corporate Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ledger Inflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ledger Flow</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <IndianRupee className="w-5 h-5 text-slate-400 mr-0.5" />
              {Math.round(totalReceived).toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
              {successPayments.length} Completed Receipts
            </span>
          </div>
        </div>

        {/* Invoice Collections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Collections</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <IndianRupee className="w-5 h-5 text-slate-400 mr-0.5" />
              {Math.round(invoiceReceived).toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-2 inline-block">
              Inward Revenue stream
            </span>
          </div>
        </div>

        {/* Voucher Disbursements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voucher Payouts</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <IndianRupee className="w-5 h-5 text-slate-400 mr-0.5" />
              {Math.round(voucherDisbursed).toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-2 inline-block">
              Outward training payouts
            </span>
          </div>
        </div>

        {/* Active Ledger Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Log Length</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-slate-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {paymentHistory.length}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-2 inline-block">
              Total transaction logs
            </span>
          </div>
        </div>
      </div>

      {/* Control and Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search invoice, payee, tx ref..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs outline-none focus:border-slate-400 focus:bg-white transition-all font-sans"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full justify-end">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="p-2 border border-slate-200 bg-slate-50 hover:bg-white rounded-lg text-xs outline-none font-bold"
          >
            <option value="all">All Documents</option>
            <option value="invoice">Invoices Only</option>
            <option value="voucher">Vouchers Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 border border-slate-200 bg-slate-50 hover:bg-white rounded-lg text-xs outline-none font-bold"
          >
            <option value="all">All Statuses</option>
            <option value="success">Settled</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-4 px-5">Document</th>
                <th className="py-4 px-5">Client / Payee</th>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5 text-right">Amount</th>
                <th className="py-4 px-5">Payment Method</th>
                <th className="py-4 px-5">Reference No</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold bg-white">
                    No payment logs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Doc No & Type */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{record.documentNumber}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${record.documentType === 'invoice' ? 'text-indigo-600' : 'text-amber-600'}`}>
                          {record.documentType}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-5 text-slate-700 max-w-[150px] truncate">
                      {record.clientName || 'N/A'}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-slate-500 font-mono">
                      {record.date}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-5 text-right font-black text-slate-900 font-mono">
                      ₹{Math.round(record.amount).toLocaleString('en-IN')}
                    </td>

                    {/* Mode */}
                    <td className="py-4 px-5 text-slate-600">
                      {record.paymentMode || 'N/A'}
                    </td>

                    {/* Reference */}
                    <td className="py-4 px-5 text-slate-500 font-mono">
                      {record.referenceNumber || 'N/A'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        record.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                        record.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {record.status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {record.status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {record.status === 'processing' && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                        {record.status === 'success' ? 'Settled' : record.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onLoadDocument(record.documentNumber, record.documentType)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-all"
                          title="Review Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete audit record ${record.referenceNumber}?`)) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          title="Delete Receipt Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
