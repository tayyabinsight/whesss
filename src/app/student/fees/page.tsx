'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export default function StudentFees() {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    
    const [voucherModal, setVoucherModal] = useState<any>(null);

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // Simulate login by grabbing the first active student
            const { data: studentsData, error: sErr } = await supabase
                .from('students')
                .select('*')
                .eq('status', 'active')
                .limit(1);

            if (sErr) throw sErr;
            
            const currentStudent = studentsData && studentsData.length > 0 ? studentsData[0] : null;
            setStudent(currentStudent);

            if (currentStudent) {
                // Fetch invoices for this student
                const { data: invData, error: iErr } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('student_id', currentStudent.id)
                    .order('issue_date', { ascending: false });
                
                if (iErr) throw iErr;
                setInvoices(invData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');

    const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0) + (Number(inv.fine_amount) || 0), 0);
    const lastPaidInvoice = paidInvoices[0]; // ordered by date descending
    const lastPaidAmount = lastPaidInvoice ? (Number(lastPaidInvoice.total_amount) + Number(lastPaidInvoice.fine_amount || 0)) : 0;
    const lastPaidDate = lastPaidInvoice ? new Date(lastPaidInvoice.issue_date).toLocaleDateString() : 'N/A';

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[var(--surface-container-low)]">
            <Sidebar 
                role="student" 
                userName={student ? student.full_name : 'Loading...'} 
                userSubtitle={student ? `Grade: ${student.grade} | ID: ${student.student_id.split('@')[0]}` : ''} 
            />

            <main className="flex-1 p-4 md:p-8 overflow-auto w-full relative">
                <div className="mb-8">
                    <h1 className="font-['Manrope'] text-2xl md:text-3xl font-bold tracking-tight mb-2">Fee Portal</h1>
                    <p className="text-[var(--on-surface-variant)] text-sm md:text-base">View your fee history, pending dues, and generate payment vouchers online.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !student ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <span className="material-icons text-5xl text-[var(--outline)] mb-4">person_off</span>
                        <h2 className="font-['Manrope'] text-xl font-bold mb-2">No Student Found</h2>
                        <p className="text-[var(--on-surface-variant)]">Could not retrieve student profile to show fees.</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                            {/* Total Due */}
                            <div className="bg-[var(--error-container)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(25,28,29,0.05)] border border-[#ffb4ab]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-sm text-[#93000a] uppercase tracking-wider">Total Due</div>
                                    <span className="material-icons text-[#93000a]">account_balance_wallet</span>
                                </div>
                                <div className="font-['Manrope'] text-3xl font-black text-[#93000a]">Rs {totalDue.toLocaleString()}</div>
                                {unpaidInvoices.length > 0 && (
                                    <div className="text-xs font-semibold text-[#93000a] mt-2 bg-[#ffdad6] inline-block px-2 py-1 rounded">
                                        {unpaidInvoices.length} pending invoice{unpaidInvoices.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Last Paid */}
                            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(25,28,29,0.05)] border border-[var(--outline-variant)]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-sm text-[var(--on-surface-variant)] uppercase tracking-wider">Last Paid Fee</div>
                                    <span className="material-icons text-[var(--secondary)]">check_circle</span>
                                </div>
                                <div className="font-['Manrope'] text-3xl font-black text-[var(--on-surface)]">Rs {lastPaidAmount.toLocaleString()}</div>
                                <div className="text-xs font-semibold text-[var(--on-surface-variant)] mt-2">
                                    Collected on: {lastPaidDate}
                                </div>
                            </div>

                            {/* Account Info Hint */}
                            <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] rounded-2xl p-6 text-white shadow-[0_4px_20px_rgba(25,28,29,0.05)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-icons text-[var(--secondary-container)]">account_balance</span>
                                    <div className="font-bold text-sm uppercase tracking-wider text-[var(--primary-fixed)]">Official Bank</div>
                                </div>
                                <div className="font-['Manrope'] text-lg font-bold mb-1">Wisdom House Education System</div>
                                <div className="text-xs text-white/70 tracking-wider font-mono">A/C: 0912-3482-9901-22</div>
                                <div className="text-xs text-[var(--secondary-container)] mt-3 font-semibold flex items-center gap-1">
                                    <span className="material-icons text-[14px]">info</span>
                                    Use vouchers below to pay online.
                                </div>
                            </div>
                        </div>

                        {/* Invoices Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Pending Invoices */}
                            <div>
                                <h2 className="font-['Manrope'] text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="material-icons text-[var(--error)]">pending_actions</span>
                                    Pending Dues
                                </h2>
                                
                                {unpaidInvoices.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[var(--outline-variant)]">
                                        <span className="material-icons text-4xl text-[var(--outline)] mb-2">task_alt</span>
                                        <div className="font-bold text-[var(--on-surface)]">All clear!</div>
                                        <div className="text-sm text-[var(--on-surface-variant)]">You have no pending dues.</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {unpaidInvoices.map(inv => {
                                            const amount = Number(inv.total_amount) || 0;
                                            const fine = Number(inv.fine_amount) || 0;
                                            const total = amount + fine;
                                            const feeMonths = inv.fee_months ? inv.fee_months.join(', ') : 'N/A';

                                            return (
                                                <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--outline-variant)] hover:border-[var(--primary)] transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="font-bold text-[var(--on-surface)] text-sm mb-1">{inv.invoice_no}</div>
                                                            <div className="text-xs text-[var(--on-surface-variant)] font-semibold">Months: {feeMonths}</div>
                                                        </div>
                                                        <div className="bg-[var(--error-container)] text-[#93000a] text-xs font-bold px-2 py-1 rounded">UNPAID</div>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-4">
                                                        <div>
                                                            <div className="text-xs text-[var(--on-surface-variant)] uppercase tracking-wide">Amount Due</div>
                                                            <div className="font-['Manrope'] font-bold text-xl text-[var(--error)]">Rs {total.toLocaleString()}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setVoucherModal(inv)}
                                                            className="bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="material-icons text-[16px]">receipt_long</span>
                                                            View Voucher
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Paid History */}
                            <div>
                                <h2 className="font-['Manrope'] text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="material-icons text-[var(--secondary)]">history</span>
                                    Payment History
                                </h2>

                                {paidInvoices.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-[var(--outline-variant)]">
                                        <div className="font-bold text-[var(--on-surface-variant)]">No history found.</div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl shadow-sm border border-[var(--outline-variant)] overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
                                                    <tr>
                                                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Invoice</th>
                                                        <th className="p-4 font-bold text-xs uppercase tracking-wider">Date</th>
                                                        <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Paid</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--outline-variant)]">
                                                    {paidInvoices.map(inv => {
                                                        const total = (Number(inv.total_amount) || 0) + (Number(inv.fine_amount) || 0);
                                                        return (
                                                            <tr key={inv.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                                                                <td className="p-4">
                                                                    <div className="font-bold text-[var(--on-surface)]">{inv.invoice_no}</div>
                                                                    <div className="text-[10px] text-[var(--on-surface-variant)]">{inv.fee_months?.join(', ')}</div>
                                                                </td>
                                                                <td className="p-4 text-[var(--on-surface-variant)] font-semibold">
                                                                    {new Date(inv.issue_date).toLocaleDateString()}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <div className="font-bold text-[var(--primary)]">Rs {total.toLocaleString()}</div>
                                                                    <div className="text-[10px] text-[#2e7d32] font-bold flex items-center justify-end gap-1">
                                                                        <span className="material-icons text-[12px]">check</span> PAID
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Voucher Modal */}
                {voucherModal && (
                    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && setVoucherModal(null)}>
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                            {/* Watermark */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-[0.03]">
                                <div className="font-['Manrope'] font-black text-6xl md:text-8xl -rotate-45 whitespace-nowrap tracking-widest text-black">ONLINE VOUCHER</div>
                            </div>

                            {/* Header */}
                            <div className="bg-[var(--primary)] text-white p-6 relative z-10 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="font-['Manrope'] text-2xl font-black tracking-tight">FEE VOUCHER</h2>
                                    <div className="text-white/70 text-sm tracking-widest uppercase font-semibold mt-1">Wisdom House Education System</div>
                                </div>
                                <button onClick={() => setVoucherModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto relative z-10 flex-1">
                                <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-[var(--outline-variant)] pb-6">
                                    <div>
                                        <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider mb-1">Student Details</div>
                                        <div className="font-bold text-lg">{voucherModal.student_name || student?.full_name}</div>
                                        <div className="text-sm font-semibold text-[var(--on-surface-variant)]">Grade: {voucherModal.class || student?.grade}</div>
                                        <div className="text-sm font-semibold text-[var(--on-surface-variant)]">Parent: {voucherModal.parent_name || student?.guardian_name}</div>
                                    </div>
                                    <div className="md:text-right">
                                        <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider mb-1">Voucher Info</div>
                                        <div className="font-bold text-lg text-[var(--primary)]">{voucherModal.invoice_no}</div>
                                        <div className="text-sm font-semibold text-[var(--on-surface-variant)]">Issue: {new Date(voucherModal.issue_date).toLocaleDateString()}</div>
                                        <div className="text-sm font-semibold text-[var(--error)]">Due: {voucherModal.due_date ? new Date(voucherModal.due_date).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>

                                <table className="w-full text-sm mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-black">
                                            <th className="text-left py-2 font-bold uppercase tracking-wider text-xs">Description</th>
                                            <th className="text-right py-2 font-bold uppercase tracking-wider text-xs">Amount (Rs)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--outline-variant)]">
                                        {voucherModal.fee_items && Array.isArray(voucherModal.fee_items) ? voucherModal.fee_items.map((item: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="py-3 font-semibold text-[var(--on-surface-variant)]">{item.description}</td>
                                                <td className="py-3 text-right font-bold">{Number(item.amount).toLocaleString()}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td className="py-3 font-semibold text-[var(--on-surface-variant)]">Tuition Fee ({voucherModal.fee_months?.join(', ')})</td>
                                                <td className="py-3 text-right font-bold">{Number(voucherModal.total_amount).toLocaleString()}</td>
                                            </tr>
                                        )}
                                        {Number(voucherModal.fine_amount) > 0 && (
                                            <tr>
                                                <td className="py-3 font-bold text-[var(--error)]">Late Fee Fine</td>
                                                <td className="py-3 text-right font-bold text-[var(--error)]">{Number(voucherModal.fine_amount).toLocaleString()}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-black text-lg">
                                            <td className="py-4 font-black text-right pr-4 uppercase">Total Payable</td>
                                            <td className="py-4 font-black text-right text-[var(--primary)]">Rs {(Number(voucherModal.total_amount) + Number(voucherModal.fine_amount || 0)).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Payment Instructions */}
                                <div className="bg-[var(--surface-container-low)] rounded-xl p-5 border border-[var(--outline-variant)] text-center">
                                    <div className="font-bold text-sm uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">Deposit At</div>
                                    <div className="font-['Manrope'] font-black text-xl mb-1">Wisdom House Education System</div>
                                    <div className="font-mono text-lg font-semibold tracking-wider text-[var(--primary)] mb-1">
                                        A/C: {voucherModal.bank_account_no || '0912-3482-9901-22'}
                                    </div>
                                    <div className="text-xs text-[var(--on-surface-variant)] font-semibold uppercase">Bank: {voucherModal.bank_iban || 'Standard Chartered Bank'}</div>
                                </div>
                            </div>

                            {/* Footer actions */}
                            <div className="bg-[var(--surface-container-low)] border-t border-[var(--outline-variant)] p-4 relative z-10 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
                                <button onClick={() => setVoucherModal(null)} className="px-6 py-2 rounded-xl font-bold text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-colors">
                                    Close
                                </button>
                                <button onClick={() => {
                                    alert('Printing functionality will be connected to browser print API.');
                                    window.print();
                                }} className="px-6 py-2 rounded-xl font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-container)] transition-colors shadow-md flex justify-center items-center gap-2">
                                    <span className="material-icons text-[18px]">print</span>
                                    Print Voucher
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
