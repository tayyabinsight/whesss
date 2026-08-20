'use client';
import { useState, useEffect, useRef } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type PaymentEntry = {
    mode: 'Cash' | 'Cheque' | 'Bank Transfer' | 'DD';
    amount: number;
    reference: string;
    bankName?: string;
    chequeNo?: string;
    chequeDate?: string;
    isPDC?: boolean;
};

export default function CollectFee() {
    const [isMounted, setIsMounted] = useState(false);
    
    // Selection State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
    
    // Collection Form State
    const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeEntry, setActiveEntry] = useState<PaymentEntry>({ 
        mode: 'Cash', 
        amount: 0, 
        reference: '' 
    });
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Registry & Reports State
    const [allPayments, setAllPayments] = useState<any[]>([]);
    const [registrySearch, setRegistrySearch] = useState('');
    const [viewingPayment, setViewingPayment] = useState<any | null>(null);
    const [viewingPaymentItems, setViewingPaymentItems] = useState<any[]>([]);
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
    const [reportData, setReportData] = useState<any[]>([]);
    const [selectedVoucherItems, setSelectedVoucherItems] = useState<any[]>([]);

    // Daily Closing State
    const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
    const [closingSummary, setClosingSummary] = useState<any>(null);
    const [isSavingClosing, setIsSavingClosing] = useState(false);

    const PAYMENT_MODES: PaymentEntry['mode'][] = ['Cash', 'Cheque', 'Bank Transfer', 'DD'];

    useEffect(() => {
        setIsMounted(true);
        fetchRecentPayments();
    }, []);

    const fetchRecentPayments = async () => {
        try {
            // 1. Fetch Raw Payments
            const { data: rawPayments } = await supabase
                .from('fee_payments')
                .select('*')
                .order('created_at', { ascending: false });

            if (rawPayments && rawPayments.length > 0) {
                // 2. Fetch related data manually to avoid join issues
                const studentIds = Array.from(new Set(rawPayments.map(p => p.student_id).filter(Boolean)));
                const voucherIds = Array.from(new Set(rawPayments.map(p => p.voucher_id).filter(Boolean)));

                const { data: students } = await supabase.from('students').select('id, full_name, guardian_name, grade, student_id').in('id', studentIds);
                const { data: vouchers } = await supabase.from('fee_vouchers').select('id, voucher_number, total_amount, paid_amount').in('id', voucherIds);

                // 3. Map enriched data
                const enriched = rawPayments.map(p => ({
                    ...p,
                    students: students?.find(s => s.id === p.student_id) || null,
                    fee_vouchers: vouchers?.find(v => v.id === p.voucher_id) || null
                }));
                setAllPayments(enriched);
            } else {
                setAllPayments([]);
            }
        } catch (err) {
            console.error('Audit Fetch Error:', err);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        const { data: students } = await supabase
            .from('students')
            .select('*')
            .or(`full_name.ilike.%${val}%,student_id.ilike.%${val}%,guardian_name.ilike.%${val}%`)
            .limit(5);

        const { data: vouchers } = await supabase
            .from('fee_vouchers')
            .select('*, students(*)')
            .ilike('voucher_number', `%${val}%`)
            .limit(5);

        setSearchResults([...(students || []), ...(vouchers || [])]);
    };

    const handleSelectStudent = async (student: any) => {
        setSelectedStudent(student);
        setSearchQuery('');
        setSearchResults([]);
        
        // Fetch all unpaid/partial vouchers
        const { data } = await supabase
            .from('fee_vouchers')
            .select('*')
            .eq('student_id', student.id)
            .neq('status', 'paid')
            .order('created_at', { ascending: false });
        
        setVouchers(data || []);
        setSelectedVoucher(null);
        setSelectedVoucherItems([]);
    };

    const handleSelectVoucher = async (v: any) => {
        setSelectedVoucher(v);
        const remaining = Number(v.total_amount) - Number(v.paid_amount || 0);
        setActiveEntry({ ...activeEntry, amount: remaining });

        // Fetch Voucher Items for Detail View
        try {
            const { data: rawItems } = await supabase.from('fee_voucher_items').select('*').eq('voucher_id', v.id);
            if (rawItems && rawItems.length > 0) {
                const catIds = Array.from(new Set(rawItems.map(i => i.fee_category_id).filter(Boolean)));
                const feeIds = Array.from(new Set(rawItems.map(i => i.student_fee_id).filter(Boolean)));
                const { data: cats } = await supabase.from('fee_categories').select('id, name').in('id', catIds);
                const { data: fees } = await supabase.from('student_fees').select('id, month').in('id', feeIds);
                const enriched = rawItems.map(item => ({
                    ...item,
                    fee_categories: cats?.find(c => c.id === item.fee_category_id) || null,
                    student_fees: fees?.find(f => f.id === item.student_fee_id) || null
                }));
                setSelectedVoucherItems(enriched);
            } else {
                setSelectedVoucherItems([]);
            }
        } catch (err) {
            console.error('Error fetching voucher items:', err);
            setSelectedVoucherItems([]);
        }
    };

    const handlePostPayment = async () => {
        if (!selectedVoucher || activeEntry.amount <= 0) {
            setStatus({ type: 'error', message: 'Please select a voucher and enter a valid amount.' });
            return;
        }

        setIsSaving(true);
        setStatus({ type: 'info', message: 'Processing transaction...' });

        try {
            // 1. Insert Payment Log (using existing DB columns)
            const paymentLog = {
                voucher_id: selectedVoucher.id,
                student_id: selectedStudent.id,
                amount_paid: activeEntry.amount,
                payment_mode: activeEntry.mode,
                reference_number: activeEntry.reference || activeEntry.chequeNo || '',
                payment_date: collectionDate,
                bank_name: activeEntry.bankName || null,
                cheque_date: activeEntry.chequeDate || null,
                cheque_status: activeEntry.isPDC ? 'PDC' : null
            };

            const { error: pError } = await supabase.from('fee_payments').insert(paymentLog);
            if (pError) throw pError;

            // 2. Update Voucher Status
            const newPaid = Number(selectedVoucher.paid_amount || 0) + activeEntry.amount + adjustmentAmount;
            const remaining = Number(selectedVoucher.total_amount) - newPaid;
            let newStatus = 'partial';
            if (remaining <= 0) newStatus = 'paid';

            const { error: vError } = await supabase
                .from('fee_vouchers')
                .update({ 
                    paid_amount: newPaid, 
                    status: newStatus 
                })
                .eq('id', selectedVoucher.id);

            if (vError) throw vError;

            setStatus({ type: 'success', message: 'Fee collected successfully!' });
            
            // Reset & Refresh
            setSelectedStudent(null);
            setSelectedVoucher(null);
            fetchRecentPayments();
            
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePayment = async (p: any) => {
        if (!confirm('Revert this payment? This will update the voucher balance back.')) return;
        
        const { error } = await supabase.from('fee_payments').delete().eq('id', p.id);
        if (!error) {
            const currentPaid = Number(p.fee_vouchers?.paid_amount || 0);
            const revertedPaid = currentPaid - Number(p.amount_paid);
            await supabase.from('fee_vouchers').update({ 
                paid_amount: revertedPaid,
                status: revertedPaid > 0 ? 'partial' : 'unpaid'
            }).eq('id', p.voucher_id);
            fetchRecentPayments();
        }
    };

    const generateReport = async (type: 'daily' | 'weekly' | 'monthly') => {
        setReportType(type);
        const now = new Date();
        let startDate = new Date();

        if (type === 'daily') {
            startDate.setHours(0, 0, 0, 0);
        } else if (type === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else if (type === 'monthly') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }

        try {
            const { data: rawPayments } = await supabase
                .from('fee_payments')
                .select('*')
                .gte('payment_date', startDate.toISOString().split('T')[0])
                .lte('payment_date', now.toISOString().split('T')[0])
                .order('payment_date', { ascending: false });

            if (rawPayments && rawPayments.length > 0) {
                const studentIds = Array.from(new Set(rawPayments.map(p => p.student_id).filter(Boolean)));
                const voucherIds = Array.from(new Set(rawPayments.map(p => p.voucher_id).filter(Boolean)));
                const { data: students } = await supabase.from('students').select('id, full_name, grade').in('id', studentIds);
                const { data: vouchers } = await supabase.from('fee_vouchers').select('id, voucher_number').in('id', voucherIds);

                const enriched = rawPayments.map(p => ({
                    ...p,
                    students: students?.find(s => s.id === p.student_id) || null,
                    fee_vouchers: vouchers?.find(v => v.id === p.voucher_id) || null
                }));

                setReportData(enriched);
                
                // Trigger print after state update
                setTimeout(() => {
                    const p = window.open('', '', 'height=800,width=1100');
                    p?.document.write(`
                        <html>
                            <head>
                                <title>Collection Report - ${type.toUpperCase()}</title>
                                <style>
                                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                                    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1a1c1e; padding-bottom: 20px; }
                                    h1 { margin: 0; color: #1a1c1e; letter-spacing: 2px; }
                                    h2 { margin: 10px 0; color: #666; font-size: 1.2rem; text-transform: uppercase; }
                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                    th { background: #f8fafc; color: #475569; padding: 12px; text-align: left; border: 1px solid #e2e8f0; font-size: 0.8rem; text-transform: uppercase; }
                                    td { padding: 12px; border: 1px solid #e2e8f0; font-size: 0.9rem; }
                                    .total-row { margin-top: 30px; text-align: right; font-size: 1.4rem; font-weight: bold; border-top: 2px solid #1a1c1e; padding-top: 15px; }
                                    .footer { margin-top: 60px; display: flex; justify-content: space-between; }
                                    .signature { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; font-weight: bold; font-size: 0.8rem; }
                                </style>
                            </head>
                            <body>
                                ${document.getElementById('report-print-template')?.innerHTML}
                            </body>
                        </html>
                    `);
                    p?.document.close();
                    p?.focus();
                    setTimeout(() => { p?.print(); p?.close(); }, 500);
                }, 300);
            } else {
                alert('No payment records found for this period.');
            }
        } catch (err) {
            console.error('Report Error:', err);
        }
    };

    const PaymentReceipt = ({ payment, items }: { payment: any, items: any[] }) => {
        const student = payment.students || {};
        const voucher = payment.fee_vouchers || {};
        const remaining = Number(voucher.total_amount || 0) - Number(voucher.paid_amount || 0);

        return (
            <div id="receipt-print-area" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '30px', border: '2.5px solid #1a1c1e', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontWeight: 950, letterSpacing: '-1px' }}>WISDOM HOUSE</h2>
                    <p style={{ margin: '5px 0', fontSize: '0.8rem', fontWeight: 800 }}>EDUCATION SYSTEM</p>
                    <div style={{ height: '2px', background: '#1a1c1e', width: '60px', margin: '10px auto' }}></div>
                    <h4 style={{ margin: '10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Payment Receipt</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.85rem' }}>
                    <div>
                        <div style={{ color: '#888', fontWeight: 800, fontSize: '0.7rem' }}>STUDENT NAME</div>
                        <div style={{ fontWeight: 950 }}>{student.full_name}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontWeight: 800, fontSize: '0.7rem' }}>FATHER NAME</div>
                        <div style={{ fontWeight: 950 }}>{student.guardian_name}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontWeight: 800, fontSize: '0.7rem' }}>CLASS / ID</div>
                        <div style={{ fontWeight: 950 }}>{student.grade} / {student.student_id}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontWeight: 800, fontSize: '0.7rem' }}>DATE / MODE</div>
                        <div style={{ fontWeight: 950 }}>{new Date(payment.payment_date).toLocaleDateString()} / {payment.payment_mode}</div>
                    </div>
                </div>

                <div style={{ border: '1.5px solid #1a1c1e', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.75rem', marginBottom: '10px', color: '#1a1c1e', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>FEE DESCRIPTION</div>
                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '6px 0', fontWeight: 700 }}>
                                        {item.fee_categories?.name || 'Institutional Fee'} 
                                        {item.student_fees?.month ? ` (${item.student_fees.month})` : ''}
                                    </td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 900 }}>Rs {Number(item.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            {voucher.fine > 0 && (
                                <tr style={{ color: '#cf1322' }}>
                                    <td style={{ padding: '6px 0', fontWeight: 700 }}>Late Fee / Fine (+)</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 900 }}>Rs {Number(voucher.fine).toLocaleString()}</td>
                                </tr>
                            )}
                            {voucher.discount > 0 && (
                                <tr style={{ color: '#2e7d32' }}>
                                    <td style={{ padding: '6px 0', fontWeight: 700 }}>Discount (-)</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 900 }}>Rs {Number(voucher.discount).toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1c1e', paddingTop: '10px', marginTop: '10px' }}>
                        <span style={{ fontWeight: 950, fontSize: '1.1rem' }}>TOTAL PAID</span>
                        <span style={{ fontWeight: 950, fontSize: '1.2rem', color: '#2e7d32' }}>Rs {payment.amount_paid.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#555', fontStyle: 'italic', marginBottom: '20px' }}>
                    <strong>Note:</strong> This payment has been successfully posted to the student's ledger.
                    {remaining > 0 && <p style={{ color: '#cf1322', margin: '5px 0 0 0' }}>Current Outstanding Arrears: Rs {remaining.toLocaleString()}</p>}
                    {remaining <= 0 && <p style={{ color: '#2e7d32', margin: '5px 0 0 0' }}>Outstanding Cleared. Thank you!</p>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#888' }}>Ref: {payment.id.slice(0,8).toUpperCase()}</div>
                    <div style={{ textAlign: 'center', borderTop: '1px solid #1a1c1e', width: '120px', paddingTop: '5px', fontSize: '0.7rem', fontWeight: 900 }}>Cashier Stamp</div>
                </div>
            </div>
        );
    };

    const handleCalculateClosing = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayPayments = allPayments.filter(p => p.payment_date === todayStr);
        
        const summary = {
            date: todayStr,
            cash: todayPayments.filter(p => p.payment_mode === 'Cash').reduce((a, b) => a + b.amount_paid, 0),
            cheque: todayPayments.filter(p => p.payment_mode === 'Cheque').reduce((a, b) => a + b.amount_paid, 0),
            bank: todayPayments.filter(p => p.payment_mode === 'Bank Transfer').reduce((a, b) => a + b.amount_paid, 0),
            dd: todayPayments.filter(p => p.payment_mode === 'DD').reduce((a, b) => a + b.amount_paid, 0),
            total: todayPayments.reduce((a, b) => a + b.amount_paid, 0),
            count: todayPayments.length
        };
        
        setClosingSummary(summary);
        setIsClosingModalOpen(true);
    };

    const handleSaveClosing = async () => {
        if (!closingSummary) return;
        setIsSavingClosing(true);
        try {
            const { error } = await supabase.from('fee_closings').insert({
                closing_date: closingSummary.date,
                total_cash: closingSummary.cash,
                total_cheque: closingSummary.cheque,
                total_bank: closingSummary.bank,
                total_dd: closingSummary.dd,
                grand_total: closingSummary.total,
                transaction_count: closingSummary.count
            });

            if (error) throw error;
            alert('Daily Closing saved successfully!');
            setIsClosingModalOpen(false);
        } catch (err: any) {
            console.error('Closing Save Error:', err);
            // Fallback for missing table
            if (err.code === '42P01') {
                alert('Table "fee_closings" not found. Printing summary instead.');
                window.print();
            } else {
                alert('Error saving closing: ' + err.message);
            }
        } finally {
            setIsSavingClosing(false);
        }
    };

    if (!isMounted) return null;

    return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: '#1a1c1e' }}>
                
                {/* Header & Main Form Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)', gap: '28px' }}>
                    
                    {/* Left: Search & Student Context */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Search & Select</h3>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    placeholder="Search Student..." 
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, fontSize: '0.85rem', background: '#f8fafc' }}
                                />
                                {searchResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, border: '1px solid #eee', overflow: 'hidden' }}>
                                        {searchResults.map((item, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSelectStudent(item.students || item)}
                                                style={{ padding: '12px 16px', borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.full_name || item.voucher_number}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.full_name ? `S/O: ${item.guardian_name || 'N/A'} • ${item.grade || 'N/A'}` : (item.students?.student_id ? `S/O: ${item.students?.guardian_name || 'N/A'} • ${item.students?.grade || 'N/A'}` : 'Voucher Identity')}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedStudent && (
                            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '24px', color: '#fff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudent.full_name}</h2>
                                        <p style={{ margin: '2px 0', opacity: 0.7, fontWeight: 600, fontSize: '0.75rem' }}>{selectedStudent.student_id} • {selectedStudent.grade}</p>
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                                    </button>
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid Vouchers</h4>
                                    {vouchers.length === 0 ? (
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>No unpaid vouchers found.</p>
                                    ) : (
                                        vouchers.map(v => (
                                            <div 
                                                key={v.id} 
                                                onClick={() => handleSelectVoucher(v)}
                                                style={{ 
                                                    padding: '10px 14px', 
                                                    background: selectedVoucher?.id === v.id ? '#fff' : 'rgba(255,255,255,0.05)', 
                                                    color: selectedVoucher?.id === v.id ? '#0f172a' : '#fff',
                                                    borderRadius: '12px', 
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    border: '1px solid',
                                                    borderColor: selectedVoucher?.id === v.id ? '#fff' : 'rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{v.voucher_number}</span>
                                                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>Rs {v.total_amount - (v.paid_amount || 0)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Active Collection Form */}
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Collect Payment</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <span className="material-icons" style={{ fontSize: '16px', color: '#64748b' }}>calendar_today</span>
                                <input type="date" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: 700, outline: 'none', fontSize: '0.8rem', color: '#0f172a' }} />
                            </div>
                        </div>

                        {!selectedVoucher ? (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', textAlign: 'center' }}>
                                <span className="material-icons" style={{ fontSize: '64px', marginBottom: '16px' }}>payments</span>
                                <p style={{ fontWeight: 700, maxWidth: '250px' }}>Select a student and a voucher to begin collection</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Voucher Details (Assigned Fees, Dates) */}
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Assigning</div>
                                            <div style={{ fontWeight: 800, color: '#334155' }}>{selectedVoucher.issue_date ? new Date(selectedVoucher.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}</div>
                                        </div>
                                        <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #edf2f7' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>Due Date</div>
                                            <div style={{ fontWeight: 800, color: '#b91c1c' }}>{selectedVoucher.due_date ? new Date(selectedVoucher.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="material-icons" style={{ fontSize: '14px' }}>list_alt</span>
                                            Assigned Fees Description
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {selectedVoucherItems.length > 0 ? (
                                                selectedVoucherItems.map((item, idx) => (
                                                    <div key={idx} style={{ background: '#fff', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                                                        <span>{item.fee_categories?.name || 'Fee'}</span>
                                                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', color: '#64748b' }}>{item.student_fees?.month || '---'}</span>
                                                        <span style={{ fontWeight: 900, color: '#0f172a' }}>Rs {Number(item.amount).toLocaleString()}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Loading fee details...</div>
                                            )}
                                            {selectedVoucher.fine > 0 && (
                                                <div style={{ background: '#fef2f2', padding: '8px 14px', borderRadius: '12px', border: '1px solid #fee2e2', fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c' }}>
                                                    Fine: Rs {Number(selectedVoucher.fine).toLocaleString()}
                                                </div>
                                            )}
                                            {selectedVoucher.discount > 0 && (
                                                <div style={{ background: '#f0fdf4', padding: '8px 14px', borderRadius: '12px', border: '1px solid #dcfce7', fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
                                                    Discount: -Rs {Number(selectedVoucher.discount).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mode Selection Tabs */}
                                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                                    {PAYMENT_MODES.map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setActiveEntry({ ...activeEntry, mode: m })}
                                            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', background: activeEntry.mode === m ? '#0f172a' : 'transparent', color: activeEntry.mode === m ? '#fff' : '#64748b', boxShadow: activeEntry.mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Amount</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '1rem', color: '#94a3b8' }}>Rs</span>
                                            <input 
                                                type="number" 
                                                value={activeEntry.amount}
                                                onChange={e => setActiveEntry({ ...activeEntry, amount: Number(e.target.value) })}
                                                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '14px', border: '2px solid #0f172a', fontSize: '1.25rem', fontWeight: 800, outline: 'none', color: '#0f172a' }} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Reference</label>
                                        <input 
                                            placeholder="Txn ID..."
                                            value={activeEntry.reference}
                                            onChange={e => setActiveEntry({ ...activeEntry, reference: e.target.value })}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Fields based on Mode */}
                                {activeEntry.mode === 'Cheque' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#fff7ed', padding: '16px', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px', textTransform: 'uppercase' }}>Cheque No</label>
                                            <input type="text" onChange={e => setActiveEntry({...activeEntry, chequeNo: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '0.8rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px', textTransform: 'uppercase' }}>Bank</label>
                                            <input type="text" onChange={e => setActiveEntry({...activeEntry, bankName: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '0.8rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#9a3412', marginBottom: '4px', textTransform: 'uppercase' }}>Date (PDC)</label>
                                            <input type="date" onChange={e => setActiveEntry({...activeEntry, chequeDate: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fed7aa', fontSize: '0.8rem' }} />
                                        </div>
                                    </div>
                                )}

                                {/* Adjustments Section */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
                                            <span className="material-icons" style={{ fontSize: '16px', color: '#f59e0b' }}>tune</span>
                                            Adjustments
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input 
                                                type="number" 
                                                placeholder="Amount" 
                                                value={adjustmentAmount}
                                                onChange={e => setAdjustmentAmount(Number(e.target.value))}
                                                style={{ padding: '8px 12px', width: '80px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.8rem', background: '#f8fafc' }} 
                                            />
                                            <input 
                                                placeholder="Reason..." 
                                                value={adjustmentReason}
                                                onChange={e => setAdjustmentReason(e.target.value)}
                                                style={{ padding: '8px 12px', width: '140px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.8rem', background: '#f8fafc' }} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginTop: '10px' }}>
                                    <button 
                                        disabled={isSaving}
                                        onClick={handlePostPayment}
                                        style={{ background: '#1a1c1e', color: '#fff', padding: '24px', borderRadius: '24px', border: 'none', fontWeight: 950, fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: isSaving ? 0.7 : 1 }}
                                    >
                                        {isSaving ? (
                                            <span className="material-icons spinning">refresh</span>
                                        ) : (
                                            <span className="material-icons">task_alt</span>
                                        )}
                                        POST PAYMENT ENTRY
                                    </button>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 800 }}>Voucher Balance After</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 950 }}>Rs {(Number(selectedVoucher.total_amount) - (Number(selectedVoucher.paid_amount || 0) + activeEntry.amount + adjustmentAmount)).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {status.message && (
                            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '16px', background: status.type === 'error' ? '#fff1f0' : '#e6fffa', color: status.type === 'error' ? '#cf1322' : '#047481', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons" style={{ fontSize: '20px' }}>{status.type === 'error' ? 'error_outline' : 'check_circle'}</span>
                                {status.message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit & Registry Section */}
                <div style={{ background: '#fff', padding: '32px', borderRadius: '40px', border: '1.5px solid #eee', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 950 }}>Collection Posting Audit</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#666', fontWeight: 600, fontSize: '0.9rem' }}>Comprehensive history of all processed fee transactions.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleCalculateClosing} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 950, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ fontSize: '18px' }}>lock_clock</span>
                                DAY CLOSING
                            </button>
                            <div style={{ width: '1.5px', background: '#eee', margin: '0 8px' }}></div>
                            <button onClick={() => generateReport('daily')} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #eee', background: '#fff', fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer' }}>Daily Report</button>
                            <button onClick={() => generateReport('weekly')} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #eee', background: '#fff', fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer' }}>Weekly Audit</button>
                            <button onClick={() => generateReport('monthly')} style={{ padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #eee', background: '#fff', fontWeight: 850, fontSize: '0.8rem', cursor: 'pointer' }}>Monthly Summary</button>
                            <div style={{ width: '1.5px', background: '#eee', margin: '0 8px' }}></div>
                            <div style={{ position: 'relative' }}>
                                <span className="material-icons" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 20 }}>search</span>
                                <input 
                                    placeholder="Search student, class, voucher..." 
                                    value={registrySearch}
                                    onChange={e => setRegistrySearch(e.target.value)}
                                    style={{ padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1.5px solid #eee', fontWeight: 700, outline: 'none', width: '300px' }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa', textAlign: 'left', borderBottom: '1.5px solid #f0f0f0' }}>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Posting Date</th>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Student / Father Name</th>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Class / Voucher</th>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Mode / Amount</th>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Arrears</th>
                                    <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allPayments.filter(p => {
                                    const s = registrySearch.toLowerCase();
                                    const studentMatch = p.students?.full_name?.toLowerCase().includes(s) || 
                                                       p.students?.student_id?.toLowerCase().includes(s);
                                    const voucherMatch = p.fee_vouchers?.voucher_number?.toLowerCase().includes(s);
                                    return s === '' || studentMatch || voucherMatch;
                                }).map(p => {
                                    const voucher = p.fee_vouchers || {};
                                    const remaining = Number(voucher.total_amount || 0) - Number(voucher.paid_amount || 0);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f8f8f8', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '18px 20px', fontSize: '0.85rem', color: '#666', fontWeight: 700 }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.students?.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>S/O: {p.students?.guardian_name}</div>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{p.students?.grade}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1a1c1e' }}>{voucher.voucher_number || '---'}</div>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888' }}>{p.payment_mode.toUpperCase()}</div>
                                                <div style={{ fontWeight: 950, color: '#2e7d32', fontSize: '1.05rem' }}>Rs {p.amount_paid.toLocaleString()}</div>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 950, background: remaining <= 0 ? '#e6fffa' : '#fff1f0', color: remaining <= 0 ? '#047481' : '#cf1322', display: 'inline-block' }}>
                                                    {remaining <= 0 ? 'CLEARED' : `Rs ${remaining.toLocaleString()}`}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={async () => {
                                                        setViewingPayment(p);
                                                        // Fetch Voucher Items for Receipt
                                                        const { data: rawItems } = await supabase.from('fee_voucher_items').select('*').eq('voucher_id', p.voucher_id);
                                                        if (rawItems) {
                                                            const catIds = Array.from(new Set(rawItems.map(i => i.fee_category_id).filter(Boolean)));
                                                            const feeIds = Array.from(new Set(rawItems.map(i => i.student_fee_id).filter(Boolean)));
                                                            const { data: cats } = await supabase.from('fee_categories').select('id, name').in('id', catIds);
                                                            const { data: fees } = await supabase.from('student_fees').select('id, month').in('id', feeIds);
                                                            const enriched = rawItems.map(item => ({
                                                                ...item,
                                                                fee_categories: cats?.find(c => c.id === item.fee_category_id) || null,
                                                                student_fees: fees?.find(f => f.id === item.student_fee_id) || null
                                                            }));
                                                            setViewingPaymentItems(enriched);
                                                        }
                                                    }} style={{ padding: '8px', background: '#e3f2fd', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#1976d2' }} title="Preview Receipt"><span className="material-icons" style={{ fontSize: '20px' }}>receipt_long</span></button>
                                                    <button onClick={() => { setViewingPayment(p); setIsEditingPayment(true); }} style={{ padding: '8px', background: '#f5f5f5', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#666' }} title="Edit"><span className="material-icons" style={{ fontSize: '20px' }}>edit</span></button>
                                                    <button onClick={() => handleDeletePayment(p)} style={{ padding: '8px', background: '#fff1f0', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#cf1322' }} title="Revert Payment"><span className="material-icons" style={{ fontSize: '20px' }}>delete_forever</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {viewingPayment && !isEditingPayment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '550px', borderRadius: '32px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 950 }}>Payment Receipt Preview</h3>
                            <button onClick={() => setViewingPayment(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                        </div>
                        <div style={{ padding: '40px 20px', background: '#f8f8f8', overflowY: 'auto', maxHeight: '70vh' }}>
                            <PaymentReceipt payment={viewingPayment} items={viewingPaymentItems} />
                        </div>
                        <div style={{ padding: '24px 32px', background: '#fff', display: 'flex', gap: '12px', borderTop: '1px solid #eee' }}>
                            <button onClick={() => setViewingPayment(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#eee', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                            <button onClick={() => {
                                const p = window.open('', '', 'height=800,width=800');
                                p?.document.write('<html><head><title>Receipt</title><style>body{margin:0;padding:20px;}</style></head><body>' + document.getElementById('receipt-print-area')?.outerHTML + '</body></html>');
                                p?.document.close(); p?.focus(); setTimeout(() => { p?.print(); p?.close(); }, 500);
                            }} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#1a1c1e', color: '#fff', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <span className="material-icons">print</span> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal (Basic Amount Adjustment) */}
            {viewingPayment && isEditingPayment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '450px', borderRadius: '32px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 950 }}>Edit Payment Amount</h3>
                            <button onClick={() => { setViewingPayment(null); setIsEditingPayment(false); }} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                        </div>
                        <div style={{ padding: '32px' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>Adjust the collection amount for this record.</p>
                            <input 
                                type="number" 
                                defaultValue={viewingPayment.amount_paid}
                                id="edit-amount-input"
                                style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '2px solid #1a1c1e', fontSize: '1.5rem', fontWeight: 950, outline: 'none' }}
                            />
                        </div>
                        <div style={{ padding: '24px 32px', background: '#f9f9f9', display: 'flex', gap: '12px' }}>
                            <button onClick={async () => {
                                const newVal = Number((document.getElementById('edit-amount-input') as HTMLInputElement).value);
                                const diff = newVal - viewingPayment.amount_paid;
                                if (confirm(`Change amount from ${viewingPayment.amount_paid} to ${newVal}?`)) {
                                    const { error } = await supabase.from('fee_payments').update({ amount_paid: newVal }).eq('id', viewingPayment.id);
                                    if (!error) {
                                        const currentVoucherPaid = Number(viewingPayment.fee_vouchers?.paid_amount || 0);
                                        await supabase.from('fee_vouchers').update({ paid_amount: currentVoucherPaid + diff }).eq('id', viewingPayment.voucher_id);
                                        fetchRecentPayments();
                                        setViewingPayment(null);
                                        setIsEditingPayment(false);
                                    }
                                }
                            }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#1a1c1e', color: '#fff', fontWeight: 950, cursor: 'pointer' }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Report Template for Printing */}
            <div id="report-print-template" style={{ display: 'none' }}>
                <div className="header">
                    <h1>WISDOM HOUSE EDUCATION SYSTEM</h1>
                    <h2>Fee Collection {reportType?.toUpperCase()} Report</h2>
                    <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Voucher</th>
                            <th>Mode</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map(r => (
                            <tr key={r.id}>
                                <td>{r.payment_date}</td>
                                <td>{r.students?.full_name}</td>
                                <td>{r.students?.grade}</td>
                                <td>{r.fee_vouchers?.voucher_number}</td>
                                <td>{r.payment_mode}</td>
                                <td>{r.amount_paid}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
                    Total Collected: Rs {reportData.reduce((acc, curr) => acc + curr.amount_paid, 0).toLocaleString()}
                </div>
                <div className="footer">
                    <div>___________________<br/>Finance Officer</div>
                    <div>___________________<br/>Admin Approval</div>
                </div>
            </div>

            {/* Daily Closing Modal */}
            {isClosingModalOpen && closingSummary && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '500px', borderRadius: '32px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #eee', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 950 }}>Final Daily Closing</h3>
                            <button onClick={() => setIsClosingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><span className="material-icons">close</span></button>
                        </div>
                        <div style={{ padding: '32px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Closing Date</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0f172a' }}>{new Date(closingSummary.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f1f5f9', borderRadius: '16px' }}>
                                    <span style={{ fontWeight: 700, color: '#475569' }}>Total Transactions</span>
                                    <span style={{ fontWeight: 950 }}>{closingSummary.count}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #d1fae5' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Cash Total</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#065f46' }}>Rs {closingSummary.cash.toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '16px', border: '1px solid #dbeafe' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Cheque Total</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#1e40af' }}>Rs {closingSummary.cheque.toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Bank/DD Total</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#9a3412' }}>Rs {(closingSummary.bank + closingSummary.dd).toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#0f172a', borderRadius: '16px', color: '#fff' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Grand Total</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950 }}>Rs {closingSummary.total.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #eee', display: 'flex', gap: '12px' }}>
                            <button onClick={() => window.print()} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ fontSize: '20px' }}>print</span>
                                Print Statement
                            </button>
                            <button 
                                onClick={handleSaveClosing} 
                                disabled={isSavingClosing}
                                style={{ flex: 1.5, padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {isSavingClosing ? <span className="material-icons spinning">refresh</span> : <span className="material-icons">check_circle</span>}
                                {isSavingClosing ? 'Finalizing...' : 'Finalize & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spin 1s linear infinite; }
            `}</style>
        </FeeLayout>
    );
}
