import React from 'react';
import { VoucherData } from '../types';

interface PaymentVoucherPaperProps {
    data: VoucherData;
    className?: string;
}

// Simple Number to Words converter for the footer
const numberToWords = (num: number): string => {
    const rounded = Math.round(num);
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = ('000000000' + rounded.toFixed(0)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

    return str.trim() + ' Only';
};

export const PaymentVoucherPaper: React.FC<PaymentVoucherPaperProps> = ({ data, className = '' }) => {
    const tdsAmount = data.grossAmount * (data.tdsRate / 100);
    const netAmount = data.grossAmount - tdsAmount;

    return (
        <div id="voucher-paper" className={`bg-white text-black text-[11px] leading-tight font-sans shadow-xl print:shadow-none h-[29.7cm] min-h-[29.7cm] max-h-[29.7cm] w-[21cm] mx-auto flex flex-col relative overflow-hidden ${className}`}>

            {/* Main Container with Border */}
            <div className="border-2 border-black flex-grow flex flex-col m-8 print:m-0" style={{ height: 'calc(100% - 64px)' }}>

                {/* Top Header Row with Peach Background */}
                <div className="flex border-b border-black bg-[#ffe4e1]">
                    <div className="w-1/2 p-2 font-bold text-center border-r border-black text-base uppercase">Payment Voucher</div>
                    <div className="w-1/2 p-2 text-center text-sm font-bold">with TDS Deduction u/s 194J</div>
                </div>

                {/* Company & Voucher Details Info Grid */}
                <div className="flex border-b border-black">
                    {/* Left: Issued By (Company Details) */}
                    <div className="w-1/2 border-r border-black flex flex-col">
                        <div className="p-2 flex-grow">
                            <div className="font-bold text-base mb-1">INCANTO DYNAMICS PVT. LTD.</div>
                            <div className="whitespace-pre-line mb-2 text-gray-700">No. 373, 2nd Stage, 2nd Phase, WOC Road, Rajajinagar, Bengaluru – 560086</div>
                            <div className="font-semibold text-xs">GSTIN: 29AAHCI4821K1Z9</div>
                        </div>
                        {/* Reference Row */}
                        <div className="border-t border-black p-2 bg-slate-50 flex text-[10px]">
                            <span className="font-bold">Reference Email:</span> <span className="ml-1">enquiry@digitalmaven.co.in</span>
                        </div>
                    </div>

                    {/* Right: Voucher Details */}
                    <div className="w-1/2 flex flex-col justify-between">
                        <div className="p-2 flex-grow flex flex-col justify-center gap-1.5 text-[11px]">
                            <div><span className="font-bold text-gray-700 w-[110px] inline-block">Voucher No. :</span> <span className="font-bold">{data.voucherNumber}</span></div>
                            <div><span className="font-bold text-gray-700 w-[110px] inline-block">Date :</span> <span className="font-semibold">{data.date}</span></div>
                            <div><span className="font-bold text-gray-700 w-[110px] inline-block">Payment Mode :</span> <span className="font-semibold">{data.paymentMode}</span></div>
                            <div><span className="font-bold text-gray-700 w-[110px] inline-block">Financial Year :</span> <span className="font-semibold">{data.financialYear}</span></div>
                        </div>
                    </div>
                </div>

                {/* Payee Details Grid - Styled EXACTLY like user screenshot */}
                <div className="flex border-b border-black flex-col">
                    <div className="bg-[#ffe4e1] border-b border-black p-1.5 font-bold text-[11px] pl-3 text-slate-800">
                        Payee Details
                    </div>
                    <div className="grid grid-cols-[150px_1fr] border-b border-black text-[11px]">
                        <div className="border-r border-black p-1.5 font-bold bg-slate-50 pl-3">Name</div>
                        <div className="p-1.5 pl-3 font-semibold text-gray-800">{data.payeeName || ' '}</div>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] border-b border-black text-[11px]">
                        <div className="border-r border-black p-1.5 font-bold bg-slate-50 pl-3">Role</div>
                        <div className="p-1.5 pl-3 text-gray-800">{data.payeeRole || ' '}</div>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] border-b border-black text-[11px]">
                        <div className="border-r border-black p-1.5 font-bold bg-slate-50 pl-3">PAN</div>
                        <div className="p-1.5 pl-3 uppercase font-semibold text-gray-800">{data.payeePan || ' '}</div>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] border-b border-black text-[11px]">
                        <div className="border-r border-black p-1.5 font-bold bg-slate-50 pl-3">Training Dates</div>
                        <div className="p-1.5 pl-3 text-gray-800">{data.trainingDates || ' '}</div>
                    </div>
                    <div className="grid grid-cols-[150px_1fr] text-[11px]">
                        <div className="border-r border-black p-1.5 font-bold bg-slate-50 pl-3">Invoice Ref.</div>
                        <div className="p-1.5 pl-3 uppercase font-semibold text-gray-800">{data.invoiceRef || ' '}</div>
                    </div>
                </div>

                {/* Payment & TDS Calculation Table */}
                <div className="flex-grow flex flex-col">
                    <div className="grid grid-cols-[1.5fr_2fr_80px_150px] border-b border-black text-center font-bold bg-slate-50">
                        <div className="border-r border-black p-2 flex items-center justify-center">Particulars</div>
                        <div className="border-r border-black p-2 flex items-center justify-center">Description of Programme</div>
                        <div className="border-r border-black p-2 flex items-center justify-center">Rate</div>
                        <div className="p-2 flex items-center justify-center">Amount (₹)</div>
                    </div>

                    {/* Gross Professional Fees Row */}
                    <div className="grid grid-cols-[1.5fr_2fr_80px_150px] border-b border-black text-center relative min-h-[40px] bg-white">
                        <div className="border-r border-black p-2 text-left font-bold flex items-center">Gross Professional Fees (A)</div>
                        <div className="border-r border-black p-2 text-left flex items-center font-semibold">{data.description || ' '}</div>
                        <div className="border-r border-black p-2 flex items-center justify-center">—</div>
                        <div className="p-2 font-bold flex items-center justify-end pr-4 text-sm">{Math.round(data.grossAmount).toLocaleString('en-IN')}</div>
                    </div>

                    {/* Less: TDS Row */}
                    <div className="grid grid-cols-[1.5fr_2fr_80px_150px] border-b border-black text-center relative min-h-[40px] bg-[#fff9e6]">
                        <div className="border-r border-black p-2 text-left flex items-center">Less: TDS u/s 194J (B)</div>
                        <div className="border-r border-black p-2 text-left flex items-center text-gray-500">Professional Services</div>
                        <div className="border-r border-black p-2 flex items-center justify-center font-bold">{data.tdsRate}%</div>
                        <div className="p-2 font-bold flex items-center justify-end pr-4 text-sm text-red-600">({Math.round(tdsAmount).toLocaleString('en-IN')})</div>
                    </div>

                    {/* Net Amount Row */}
                    <div className="grid grid-cols-[1.5fr_2fr_80px_150px] border-b border-black text-center relative min-h-[40px] bg-[#e6f2eb] font-bold">
                        <div className="border-r border-black p-2 text-left flex items-center text-emerald-800">Net Amount Payable (A – B)</div>
                        <div className="border-r border-black p-2 text-left flex items-center"></div>
                        <div className="border-r border-black p-2 flex items-center justify-center">—</div>
                        <div className="p-2 font-bold flex items-center justify-end pr-4 text-emerald-800 text-sm">{Math.round(netAmount).toLocaleString('en-IN')}</div>
                    </div>

                    {/* Filler rows to push footer down */}
                    <div className="flex-grow border-b border-black min-h-[60px] bg-white grid grid-cols-[1.5fr_2fr_80px_150px]">
                        <div className="border-r border-black"></div>
                        <div className="border-r border-black"></div>
                        <div className="border-r border-black"></div>
                        <div></div>
                    </div>
                </div>

                {/* Net Amount in Words - Separate Row */}
                <div className="border-b border-black p-2 text-[10px] font-bold">
                    Net Amount Payable in words: <span className="font-normal uppercase">{numberToWords(netAmount)}</span>
                </div>

                {/* Declaration - Separate Row */}
                <div className="border-b border-black p-2 text-[10px] leading-tight text-gray-700">
                    Certified that particulars given above are true and correct and the amount indicated above represents the payment actually due/made and no additional consideration has been/will be flowed directly or indirectly.
                </div>

                {/* Signature - Separate Row */}
                <div className="flex justify-end p-4 min-h-[100px]">
                    <div className="flex flex-col items-end gap-1">
                        <div className="font-bold text-sm">For INCANTO DYNAMICS PVT. LTD.</div>

                        <div className="h-16 w-40 relative flex justify-end">
                            <img
                                src="https://i.ibb.co/JjS5yV8k/image.png"
                                alt=""
                                className="h-full object-contain mix-blend-multiply"
                                crossOrigin="anonymous"
                            />
                        </div>

                        <div className="font-bold text-sm">
                            Authorised Signatory
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
