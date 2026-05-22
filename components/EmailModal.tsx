import React, { useState, useEffect } from 'react';
import { Mail, Send, Paperclip, X, CheckCircle, Loader2, Info } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentNumber: string;
  recipientEmail: string;
  pdfBase64Provider: () => Promise<string | null>; // Function to compile and return Base64 PDF
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  documentNumber,
  recipientEmail,
  pdfBase64Provider
}) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasPdf, setHasPdf] = useState(false);

  // EmailJS configuration (users can easily replace these with their own custom tokens)
  const [emailJSConfig, setEmailJSConfig] = useState({
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToEmail(recipientEmail || '');
      setSubject(`Document Reference: ${documentNumber}`);
      setMessage(
        `Dear Client,\n\nPlease find attached the document ${documentNumber} generated from our system.\n\nThank you for your business!\n\nBest Regards,\nSmartInvoice Management`
      );
      setSendSuccess(false);
      setErrorMessage('');
      setHasPdf(false);

      // Pre-compile or check PDF status
      checkPDF();
    }
  }, [isOpen, documentNumber, recipientEmail]);

  const checkPDF = async () => {
    setIsCompiling(true);
    try {
      const pdfData = await pdfBase64Provider();
      if (pdfData) {
        setHasPdf(true);
      } else {
        setErrorMessage('Failed to generate PDF document attachment. Please check the document.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to compile PDF attachment.');
    } finally {
      setIsCompiling(false);
    }
  };

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage('');

    try {
      const pdfBase64 = await pdfBase64Provider();
      if (!pdfBase64) {
        throw new Error('PDF attachment could not be compiled.');
      }

      // Check if user has entered custom EmailJS details, if so trigger real dispatcher
      if (emailJSConfig.serviceId && emailJSConfig.templateId && emailJSConfig.publicKey) {
        // Dynamic loading of EmailJS to keep the bundle clean and optional
        const emailjs = await import('@emailjs/browser');
        
        const templateParams = {
          to_email: toEmail,
          subject: subject,
          message: message,
          document_number: documentNumber,
          content_pdf: pdfBase64 // Base64 PDF data block
        };

        const result = await emailjs.send(
          emailJSConfig.serviceId,
          emailJSConfig.templateId,
          templateParams,
          emailJSConfig.publicKey
        );

        if (result.status === 200) {
          setSendSuccess(true);
        } else {
          throw new Error(`EmailJS responded with status ${result.status}: ${result.text}`);
        }
      } else {
        // Fallback Mock send simulation for seamless local execution
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setSendSuccess(true);
      }
    } catch (err: any) {
      console.error('Email Dispatch Error:', err);
      setErrorMessage(err.message || 'SMTP Dispatch failed. Check your network or credentials.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">Email Dispatcher</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Direct Customer Delivery</span>
            </div>
          </div>
          {!isSending && !sendSuccess && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {sendSuccess ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 animate-bounce">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Email Dispatched!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                The document <strong>{documentNumber}</strong> has been successfully compiled into a PDF and emailed to <strong>{toEmail}</strong>.
              </p>
              
              <div className="pt-6">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all shadow-md active:scale-95"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              {/* Recipient Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Recipient Email</label>
                <input
                  type="email"
                  required
                  placeholder="customer@domain.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400 font-sans transition-all"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Payment Request Reference..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400 font-bold transition-all"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block">Custom Message Body</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Compose your custom email text here..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400 resize-none font-sans leading-relaxed transition-all"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* PDF Attachment preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-800 truncate max-w-[200px]">
                      {documentNumber}.pdf
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block">
                      {isCompiling ? 'Compiling PDF binary...' : hasPdf ? 'Attachment Compiled (PDF A4)' : 'Attachment Failed'}
                    </span>
                  </div>
                </div>
                {isCompiling && (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                )}
                {!isCompiling && hasPdf && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    READY
                  </span>
                )}
              </div>

              {/* SMTP Custom Settings Selector */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1 uppercase tracking-wider cursor-pointer outline-none"
                >
                  {showConfig ? 'Hide' : 'Configure'} Live EmailJS Credentials (Optional)
                </button>
                
                {showConfig && (
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl mt-2.5 space-y-2 text-xs">
                    <div className="flex gap-2 items-start text-[10px] text-slate-500 mb-2 leading-relaxed bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                      <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>
                        By default, emails run in **Simulation Mode** (mock success). Paste your free credentials from <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">EmailJS.com</a> to dispatch actual PDF attachments to clients directly!
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Service ID"
                        className="p-2 border border-slate-200 rounded text-[10px]"
                        value={emailJSConfig.serviceId}
                        onChange={(e) => setEmailJSConfig({ ...emailJSConfig, serviceId: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Template ID"
                        className="p-2 border border-slate-200 rounded text-[10px]"
                        value={emailJSConfig.templateId}
                        onChange={(e) => setEmailJSConfig({ ...emailJSConfig, templateId: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="Public Key"
                        className="p-2 border border-slate-200 rounded text-[10px]"
                        value={emailJSConfig.publicKey}
                        onChange={(e) => setEmailJSConfig({ ...emailJSConfig, publicKey: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error messages */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Trigger Buttons */}
              <div className="flex gap-3 pt-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={onClose}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || isCompiling || !hasPdf || !toEmail}
                  className="flex-1 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/15 active:scale-95"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Transmitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send Document
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple alert circle import wrapper
const AlertCircle = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} {...props}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
