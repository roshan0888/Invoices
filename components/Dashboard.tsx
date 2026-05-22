import React from 'react';
import { InvoiceData } from '../types';
import { FileText, Download, Trash2, ArrowRight, User, Calendar, IndianRupee } from 'lucide-react';

interface DashboardProps {
  history: InvoiceData[];
  onLoad: (invoice: InvoiceData) => void;
  onDelete: (invoiceNumber: string) => void;
  onDownload: (invoice: InvoiceData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onLoad, onDelete, onDownload }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400">
        <div className="bg-slate-50 w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border border-slate-100">
          <FileText size={32} className="text-slate-200" />
        </div>
        <h3 className="text-base font-bold text-slate-600 tracking-tight">Empty Repository</h3>
        <p className="text-xs text-center mt-2 max-w-[200px] leading-relaxed text-slate-400">
            No generated invoices found. Your document history will appear here.
        </p>
      </div>
    );
  }

  // Sort by latest first
  const sortedHistory = [...history].reverse();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Archived Invoices
        </h2>
        <span className="text-[10px] font-bold text-slate-500 tabular-nums">
            {history.length} RECORDS
        </span>
      </div>
      
      <div className="grid gap-3">
        {sortedHistory.map((invoice) => {
          const totalAmount = invoice.items.reduce((acc, item) => {
            const sub = item.price * item.quantity;
            return acc + sub + (sub * (invoice.taxRate / 100));
          }, 0);

          return (
            <div 
              key={invoice.invoiceNumber} 
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tracking-tight">
                            {invoice.invoiceNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${invoice.isPaid ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-50'}`}>
                            {invoice.isPaid ? 'Settled' : 'Pending'}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-slate-900 transition-colors">
                        {invoice.clientName || 'Unnamed Entity'}
                    </h3>
                </div>
                <div className="text-right">
                    <div className="text-sm font-black text-slate-900 flex items-center justify-end">
                        <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                        {Math.round(totalAmount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {invoice.date}
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1">
                    <User size={10} />
                    {invoice.items.length} Position{invoice.items.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    Standard Terms
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => onLoad(invoice)}
                    className="flex-1 py-2 bg-white border border-slate-900 text-slate-900 text-[10px] font-bold rounded-lg hover:bg-slate-900 hover:text-white transition-all active:scale-[0.98]"
                >
                    Review Document
                </button>
                <div className="flex gap-1">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload(invoice);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                        title="Export PDF"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(invoice.invoiceNumber);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};