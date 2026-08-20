'use client';
import { useState, useEffect } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type StudentRecord = {
    id: string;
    student_id: string;
    full_name: string;
    father_name: string;
    grade: string;
    contact_number: string;
    total_assigned: number;
    total_paid: number;
    total_dues: number;
    status: 'CLEARED' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
    sort_order: number;
    raw: any;
};

const ACADEMIC_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
];

const getClassOrder = (className: string) => {
    const order = [
        'mont', 'nursery', 'prep i', 'prep ii',
        'class 1', 'class 2', 'class 3', 'class 4', 'class 5',
        'class 6', 'class 7', 'class 8', 'class 9', 'class matric', 'class 10'
    ];
    const index = order.indexOf(className.toLowerCase().trim());
    return index === -1 ? 999 : index;
};

export default function StudentsFeeDirectories() {
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [classes, setClasses] = useState<string[]>([]);
    
    // Detailed View State
    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
    const [ledgerFees, setLedgerFees] = useState<any[]>([]);
    const [ledgerPayments, setLedgerPayments] = useState<any[]>([]);
    const [showMatrix, setShowMatrix] = useState(false);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAlignMode, setIsAlignMode] = useState(false);
    const [orders, setOrders] = useState<Record<string, number>>({});
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Report Generation State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportConfig, setReportConfig] = useState({
        fromMonth: '2025-09',
        toMonth: '2026-08',
        selectedClasses: [] as string[]
    });
    const [reportData, setReportData] = useState<any>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Timeline Adjustment States
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ categoryId: '', amount: 0, month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }) });
    const [categories, setCategories] = useState<any[]>([]); // To populate adjustment dropdown
    const [selectedFeeIds, setSelectedFeeIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        setLoading(true);
        try {
            const { data: stdData } = await supabase.from('students').select('*').order('grade').order('full_name');
            
            // FETCH ALL FEES (BYPASSING LIMIT)
            let feeData: any[] = [];
            let lastFeeId = null;
            let hasMoreFees = true;
            while (hasMoreFees && feeData.length < 50000) {
                let query = supabase.from('student_fees').select('*').order('id').limit(1000);
                if (lastFeeId) query = query.gt('id', lastFeeId);
                const { data } = await query;
                if (data && data.length > 0) {
                    feeData = [...feeData, ...data];
                    lastFeeId = data[data.length - 1].id;
                } else {
                    hasMoreFees = false;
                }
            }

            // FETCH ALL VOUCHERS (BYPASSING LIMIT)
            let voucherData: any[] = [];
            let lastVoucherId = null;
            let hasMoreVouchers = true;
            while (hasMoreVouchers && voucherData.length < 50000) {
                let query = supabase.from('fee_vouchers').select('*').order('id').limit(1000);
                if (lastVoucherId) query = query.gt('id', lastVoucherId);
                const { data } = await query;
                if (data && data.length > 0) {
                    voucherData = [...voucherData, ...data];
                    lastVoucherId = data[data.length - 1].id;
                } else {
                    hasMoreVouchers = false;
                }
            }

            const { data: catData } = await supabase.from('fee_categories').select('*').eq('is_active', true);
            if (catData) setCategories(catData);

            if (stdData) {
                const uniqueClasses = Array.from(new Set(stdData.map(s => s.grade))).filter(Boolean) as string[];
                uniqueClasses.sort((a, b) => getClassOrder(a) - getClassOrder(b));
                setClasses(uniqueClasses);

                const mapped: StudentRecord[] = stdData.map(s => {
                    const studentFees = feeData?.filter(f => f.student_id === s.id) || [];
                    const studentVouchers = voucherData?.filter(v => v.student_id === s.id) || [];

                    const totalAssigned = studentFees.reduce((acc, curr) => acc + Number(curr.amount), 0);
                    const totalPaid = studentVouchers.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
                    const totalDues = Math.max(0, totalAssigned - totalPaid);

                    let status: StudentRecord['status'] = 'CLEARED';
                    if (totalDues > 0) {
                        const hasOverdue = studentVouchers.some(v => v.status === 'overdue');
                        status = hasOverdue ? 'OVERDUE' : (totalPaid > 0 ? 'PARTIAL' : 'PENDING');
                    }

                    return {
                        id: s.id,
                        student_id: s.student_id,
                        full_name: s.full_name,
                        father_name: s.guardian_name || 'N/A',
                        grade: s.grade,
                        contact_number: s.contact_number,
                        total_assigned: totalAssigned,
                        total_paid: totalPaid,
                        total_dues: totalDues,
                        status,
                        sort_order: s.sort_order || 0,
                        raw: s
                    };
                });
                
                // Alignment Sorting Logic: Priority 1 = Academic Class Order, Priority 2 = Manual Sort Order
                const sortedMapped = [...mapped].sort((a, b) => {
                    // 1. Grade Order (The core requirement)
                    const gradeDiff = getClassOrder(a.grade) - getClassOrder(b.grade);
                    if (gradeDiff !== 0) return gradeDiff;

                    // 2. Manual Alignment Order
                    const orderA = a.sort_order === 0 ? 999999 : a.sort_order;
                    const orderB = b.sort_order === 0 ? 999999 : b.sort_order;
                    if (orderA !== orderB) return orderA - orderB;
                    
                    // 3. Name fallback
                    return a.full_name.localeCompare(b.full_name);
                });

                setStudents(sortedMapped);
                
                const orderMap: Record<string, number> = {};
                mapped.forEach(s => orderMap[s.id] = s.sort_order);
                setOrders(orderMap);
            }
        } catch (err) {
            console.error('Directory Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetails = async (student: StudentRecord) => {
        setSelectedStudent(student);
        setSelectedFeeIds(new Set());
        // Fetch fees and join with categories
        const { data: fees } = await supabase.from('student_fees').select('*, fee_categories(name)').eq('student_id', student.id).order('created_at', { ascending: false });
        // Fetch voucher items to check paid status
        const { data: vItems } = await supabase.from('fee_voucher_items').select('*, fee_vouchers(*)').in('student_fee_id', fees?.map(f => f.id) || []);
        
        if (fees) {
            const feesWithStatus = fees.map(f => {
                const vItem = vItems?.find(vi => vi.student_fee_id === f.id);
                return {
                    ...f,
                    voucher: vItem?.fee_vouchers || null,
                    isPaid: vItem?.fee_vouchers?.status === 'paid'
                };
            });
            setLedgerFees(feesWithStatus);

            // RECALCULATE SUMMARY FOR SIDEBAR (Fixes the 0 issue)
            const totalAssigned = fees.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const totalPaid = vItems?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
            const totalDues = Math.max(0, totalAssigned - totalPaid);

            setSelectedStudent(prev => prev ? {
                ...prev,
                total_assigned: totalAssigned,
                total_paid: totalPaid,
                total_dues: totalDues
            } : null);
        }
    };

    const handleAddAdjustment = async () => {
        if (!adjustmentData.categoryId || !adjustmentData.amount) return alert('Please select category and enter amount.');
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('student_fees').insert({
                student_id: selectedStudent?.id,
                fee_category_id: adjustmentData.categoryId,
                amount: adjustmentData.amount,
                month: adjustmentData.month,
                class_name: selectedStudent?.grade,
                is_assigned: true,
                issue_date: new Date().toISOString()
            });
            if (!error) {
                setShowAdjustmentModal(false);
                if (selectedStudent) fetchStudentDetails(selectedStudent);
                fetchDirectory();
            }
        } catch (e) {} finally { setIsProcessing(false); }
    };

    const handleEditFee = async (fee: any) => {
        const newAmt = prompt('Enter new amount:', fee.amount.toString());
        if (!newAmt || isNaN(Number(newAmt))) return;
        
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('student_fees').update({ amount: Number(newAmt) }).eq('id', fee.id);
            if (!error) {
                if (selectedStudent) fetchStudentDetails(selectedStudent);
                fetchDirectory();
            }
        } catch (e) {} finally { setIsProcessing(false); }
    };

    const handleDeleteFee = async (feeId: string) => {
        if (!confirm('Are you sure you want to delete this fee assignment?')) return;
        setIsProcessing(true);
        const { error } = await supabase.from('student_fees').delete().eq('id', feeId);
        if (!error) {
            if (selectedStudent) fetchStudentDetails(selectedStudent);
            fetchDirectory();
        }
        setIsProcessing(false);
    };

    const handleSetAsPaid = async (fee: any) => {
        if (!confirm(`Mark "${fee.fee_categories?.name}" as paid?`)) return;
        setIsProcessing(true);
        try {
            const { data: sData } = await supabase.from('fee_settings').select('id, manual_prefix, manual_current_increment').single();
            const prefix = sData?.manual_prefix || 'MANUAL-';
            const currentInc = sData?.manual_current_increment || 1;

            const { data: voucherItem } = await supabase.from('fee_voucher_items').select('voucher_id').eq('student_fee_id', fee.id).single();
            if (voucherItem) {
                const { data: v } = await supabase.from('fee_vouchers').select('*').eq('id', voucherItem.voucher_id).single();
                if (v) {
                    await supabase.from('fee_vouchers').update({ paid_amount: v.total_amount, status: 'paid' }).eq('id', v.id);
                    await supabase.from('fee_payments').insert({ voucher_id: v.id, student_id: fee.student_id, amount_paid: v.total_amount - (v.paid_amount || 0), payment_mode: 'Cash', payment_date: new Date().toISOString().split('T')[0], reference_number: 'MANUAL_OVERRIDE' });
                }
            } else {
                const vNum = `${prefix}${String(currentInc).padStart(5, '0')}`;
                const { data: newV } = await supabase.from('fee_vouchers').insert({ student_id: fee.student_id, voucher_number: vNum, total_amount: fee.amount, paid_amount: fee.amount, status: 'paid', issue_date: new Date().toISOString(), due_date: new Date().toISOString(), class_name: selectedStudent?.grade }).select().single();
                if (newV) {
                    await supabase.from('fee_voucher_items').insert({ voucher_id: newV.id, student_fee_id: fee.id, amount: fee.amount, fee_category_id: fee.fee_category_id });
                    await supabase.from('fee_payments').insert({ voucher_id: newV.id, student_id: fee.student_id, amount_paid: fee.amount, payment_mode: 'Cash', payment_date: new Date().toISOString().split('T')[0], reference_number: 'MANUAL_OVERRIDE' });
                    // Increment manual serial in settings
                    if (sData) {
                        await supabase.from('fee_settings').update({ manual_current_increment: currentInc + 1 }).eq('id', sData.id);
                    }
                }
            }
            if (selectedStudent) fetchStudentDetails(selectedStudent);
            fetchDirectory();
        } catch (e) {} finally { setIsProcessing(false); }
    };

    const handleBulkPay = async () => {
        if (selectedFeeIds.size === 0) return;
        const feesToPay = ledgerFees.filter(f => selectedFeeIds.has(f.id) && !f.isPaid);
        if (feesToPay.length === 0) return alert('No unpaid fees selected.');
        
        if (!confirm(`Mark ${feesToPay.length} selected fees as paid? (Direct Payment)`)) return;
        
        setIsProcessing(true);
        try {
            const { data: sData } = await supabase.from('fee_settings').select('id, manual_prefix, manual_current_increment').single();
            const prefix = sData?.manual_prefix || 'MANUAL-';
            const currentInc = sData?.manual_current_increment || 1;
            const vNum = `${prefix}${String(currentInc).padStart(5, '0')}`;
            
            const totalAmount = feesToPay.reduce((acc, curr) => acc + Number(curr.amount), 0);
            
            const { data: newV, error: vError } = await supabase.from('fee_vouchers').insert({
                student_id: selectedStudent?.id,
                voucher_number: vNum,
                total_amount: totalAmount,
                paid_amount: totalAmount,
                status: 'paid',
                issue_date: new Date().toISOString(),
                due_date: new Date().toISOString(),
                class_name: selectedStudent?.grade
            }).select().single();
            
            if (vError) throw vError;
            
            const itemInserts = feesToPay.map(f => ({
                voucher_id: newV.id,
                student_fee_id: f.id,
                amount: f.amount,
                fee_category_id: f.fee_category_id
            }));
            await supabase.from('fee_voucher_items').insert(itemInserts);
            
            await supabase.from('fee_payments').insert({
                voucher_id: newV.id,
                student_id: selectedStudent?.id,
                amount_paid: totalAmount,
                payment_mode: 'Cash',
                payment_date: new Date().toISOString().split('T')[0],
                reference_number: 'BULK_DIRECT_PAY'
            });
            
            if (sData) {
                await supabase.from('fee_settings').update({ manual_current_increment: currentInc + 1 }).eq('id', sData.id);
            }
            
            setSelectedFeeIds(new Set());
            if (selectedStudent) fetchStudentDetails(selectedStudent);
            fetchDirectory();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const { fromMonth, toMonth, selectedClasses } = reportConfig;
            
            // 1. Get all months in range
            const start = new Date(fromMonth + '-01');
            const end = new Date(toMonth + '-01');
            const months: string[] = [];
            let curr = new Date(start);
            while (curr <= end) {
                months.push(curr.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
                curr.setMonth(curr.getMonth() + 1);
            }

            // 2. Fetch Students for selected classes
            const { data: students } = await supabase
                .from('students')
                .select('*')
                .in('grade', selectedClasses)
                .order('full_name');

            if (!students) return;

            const studentIds = students.map(s => s.id);

            // 3. Fetch all fees for these students in these months
            const { data: fees } = await supabase
                .from('student_fees')
                .select('*, fee_categories(name)')
                .in('student_id', studentIds)
                .in('month', months);

            // 4. Fetch all vouchers to link payments
            const { data: voucherItems } = await supabase
                .from('fee_voucher_items')
                .select('*, fee_vouchers(*)')
                .in('student_fee_id', fees?.map(f => f.id) || []);

            // 5. Organize data by Class -> Student -> Month
            const organized: any = {};
            selectedClasses.forEach(c => {
                const classStudents = students.filter(s => s.grade === c);
                if (classStudents.length === 0) return;

                organized[c] = classStudents.map(s => {
                    const studentMonths = months.map(m => {
                        // STRICT FILTER: Only find fees for this student in this month that are "Monthly Tuition" or "Monthly" fees
                        const monthlyTuitionFees = fees?.filter(f => 
                            f.student_id === s.id && 
                            f.month === m && 
                            (f.fee_categories?.name?.toLowerCase().includes('tuition') || f.fee_categories?.name?.toLowerCase().includes('monthly'))
                        ) || [];

                        // Find voucher items linked specifically to these tuition fees
                        const tuitionVItems = voucherItems?.filter(vi => 
                            monthlyTuitionFees.some(mf => mf.id === vi.student_fee_id)
                        ) || [];

                        // Extract the primary voucher info (Voucher No is same for all items in the same voucher)
                        const primaryVoucher = tuitionVItems[0]?.fee_vouchers;
                        
                        // Calculate the specific paid amount for these tuition items
                        const tuitionPaidAmount = tuitionVItems.reduce((sum, vi) => {
                            const v = vi.fee_vouchers;
                            if (v?.status === 'paid') return sum + vi.amount;
                            if (v?.status === 'partial') return sum + (vi.amount * (v.paid_amount / v.total_amount));
                            return sum;
                        }, 0);

                        return {
                            month: m,
                            paidAmount: tuitionPaidAmount > 0 ? tuitionPaidAmount : null,
                            voucherNumber: primaryVoucher?.voucher_number || null,
                            isPaid: primaryVoucher?.status === 'paid'
                        };
                    });

                    // Calculate Annual Fee Collection (including Admission, Annual, etc.)
                    const annualFeesForStudent = fees?.filter(f => 
                        f.student_id === s.id && 
                        (f.fee_categories?.name?.toLowerCase().includes('annual') || f.fee_categories?.name?.toLowerCase().includes('admission') || f.fee_categories?.name?.toLowerCase().includes('fund'))
                    );
                    const annualCollected = voucherItems
                        ?.filter(vi => annualFeesForStudent?.some(af => af.id === vi.student_fee_id))
                        ?.reduce((sum, vi) => {
                            const v = vi.fee_vouchers;
                            if (v?.status === 'paid') return sum + vi.amount;
                            if (v?.status === 'partial') return sum + (vi.amount * (v.paid_amount / v.total_amount));
                            return sum;
                        }, 0);

                    return {
                        id: s.id,
                        name: s.full_name,
                        fatherName: s.guardian_name || 'N/A',
                        contact: s.contact_number || 'N/A',
                        months: studentMonths,
                        annualCollected: annualCollected || 0
                    };
                });
            });

            setReportData({ classes: organized, months });
            setShowReportModal(false);
        } catch (err) {
            console.error('Report Error:', err);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const filtered = students.filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.student_id.toLowerCase().includes(search.toLowerCase()) || s.father_name.toLowerCase().includes(search.toLowerCase());
        const matchesClass = selectedClass === 'all' || s.grade === selectedClass;
        return matchesSearch && matchesClass;
    });

    return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
                {/* Unified Filter Header */}
                <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} className="no-print">
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>Fee Directories</h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Institutional financial audit & ledger management.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap', maxWidth: '500px' }}>
                            {['all', ...classes].map(c => (
                                <button key={c} onClick={() => setSelectedClass(c)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: selectedClass === c ? '#fff' : 'transparent', color: selectedClass === c ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', transition: '0.2s', boxShadow: selectedClass === c ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}>
                                    {c === 'all' ? 'All' : c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => {
                                setReportConfig(prev => ({ ...prev, selectedClasses: classes }));
                                setShowReportModal(true);
                            }}
                            style={{ 
                                padding: '10px 18px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                                color: '#fff', 
                                fontWeight: 800, 
                                fontSize: '0.75rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>analytics</span>
                            Generate Detail Sheet
                        </button>
                        <button 
                            onClick={async () => {
                                if (isAlignMode) {
                                    setIsProcessing(true);
                                    try {
                                        const updates = students.map((s, idx) => ({ 
                                            ...s.raw, 
                                            sort_order: idx + 1 
                                        }));
                                        const { error } = await supabase.from('students').upsert(updates);
                                        if (error) throw error;

                                        alert('✅ Registry alignment saved successfully!');
                                        setIsAlignMode(false);
                                        fetchDirectory();
                                    } catch (err: any) {
                                        console.error('Save Order Error:', err);
                                        alert('❌ Failed to save order. Please ensure the sort_order column exists in your students table.');
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                } else {
                                    setIsAlignMode(true);
                                }
                            }}
                            style={{ 
                                padding: '10px 18px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: isAlignMode ? '#10b981' : '#f1f5f9', 
                                color: isAlignMode ? '#fff' : '#0f172a', 
                                fontWeight: 800, 
                                fontSize: '0.75rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '18px' }}>{isAlignMode ? 'save' : 'sort'}</span>
                            {isAlignMode ? 'Save Order' : 'Align Registry'}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <span className="material-icons" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
                            <input placeholder="Search Registry..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '10px 14px 10px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, width: '220px', fontSize: '0.85rem', background: '#f8fafc' }} />
                        </div>
                    </div>
                </div>

                {/* Premium Table Registry */}
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                {isAlignMode && <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '80px' }}>Order</th>}
                                <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student Identity</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Worth</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Dues Balance</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={isAlignMode ? 6 : 5} style={{ padding: '60px', textAlign: 'center' }}><span className="material-icons spinning" style={{ fontSize: '24px', color: '#0f172a' }}>refresh</span></td></tr>
                            ) : filtered.map((s, idx) => (
                                <tr 
                                    key={s.id} 
                                    draggable={isAlignMode}
                                    onDragStart={() => isAlignMode && setDraggedIndex(idx)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (!isAlignMode || draggedIndex === null || draggedIndex === idx) return;
                                        
                                        // Fix: Map filtered index to actual global students index
                                        const sourceStudent = filtered[draggedIndex];
                                        const targetStudent = filtered[idx];
                                        
                                        const newStudents = [...students];
                                        const sourceGlobalIdx = newStudents.findIndex(s => s.id === sourceStudent.id);
                                        const targetGlobalIdx = newStudents.findIndex(s => s.id === targetStudent.id);
                                        
                                        if (sourceGlobalIdx !== -1 && targetGlobalIdx !== -1) {
                                            const [moved] = newStudents.splice(sourceGlobalIdx, 1);
                                            newStudents.splice(targetGlobalIdx, 0, moved);
                                            setStudents(newStudents);
                                            setDraggedIndex(idx);
                                        }
                                    }}
                                    onDragEnd={() => setDraggedIndex(null)}
                                    style={{ 
                                        borderBottom: '1px solid #f1f5f9', 
                                        transition: '0.2s',
                                        cursor: isAlignMode ? 'grab' : 'pointer',
                                        background: draggedIndex === idx ? '#f1f5f9' : 'transparent',
                                        opacity: draggedIndex === idx ? 0.5 : 1
                                    }} 
                                    onClick={() => !isAlignMode && setSelectedStudent(s)} 
                                    onMouseEnter={e => !isAlignMode && (e.currentTarget.style.background = '#f8fafc')} 
                                    onMouseLeave={e => !isAlignMode && (e.currentTarget.style.background = 'transparent')}
                                >
                                    {isAlignMode && (
                                        <td style={{ padding: '14px 24px', color: '#94a3b8' }}>
                                            <span className="material-icons" style={{ fontSize: '18px' }}>drag_indicator</span>
                                        </td>
                                    )}
                                    <td style={{ padding: '14px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{s.full_name.charAt(0)}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{s.full_name}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>S/O: {s.father_name} &bull; {s.grade}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 24px', fontWeight: 700, fontSize: '0.85rem' }}>Rs {s.total_assigned.toLocaleString()}</td>
                                    <td style={{ padding: '14px 24px', fontWeight: 800, fontSize: '0.85rem', color: s.total_dues > 0 ? '#0f172a' : '#cbd5e1' }}>Rs {s.total_dues.toLocaleString()}</td>
                                    <td style={{ padding: '14px 24px' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: s.status === 'CLEARED' ? '#dcfce7' : '#fee2e2', color: s.status === 'CLEARED' ? '#15803d' : '#b91c1c', textTransform: 'uppercase' }}>{s.status}</span>
                                    </td>
                                    <td style={{ padding: '14px 24px' }}>
                                        <button onClick={() => fetchStudentDetails(s)} disabled={isAlignMode} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: isAlignMode ? '#f1f5f9' : '#fff', fontWeight: 700, fontSize: '0.7rem', cursor: isAlignMode ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: isAlignMode ? '#94a3b8' : '#0f172a' }}>
                                            <span className="material-icons" style={{ fontSize: '16px' }}>manage_accounts</span> Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Unified Ledger Modal */}
            {selectedStudent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '950px', height: '90vh', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>{selectedStudent.full_name.charAt(0)}</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{selectedStudent.full_name}</h3>
                                    <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>{selectedStudent.student_id} &bull; {selectedStudent.grade}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setShowMatrix(!showMatrix)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: showMatrix ? '#0f172a' : '#fff', color: showMatrix ? '#fff' : '#0f172a', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
                                    <span className="material-icons" style={{ fontSize: '18px' }}>{showMatrix ? 'list_alt' : 'grid_on'}</span> {showMatrix ? 'Show Ledger' : 'Yearly View'}
                                </button>
                                <button onClick={() => setSelectedStudent(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}><span className="material-icons" style={{ fontSize: '20px' }}>close</span></button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            {!showMatrix ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {/* Summary Stats Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Assigned</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Rs {selectedStudent.total_assigned.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '24px', border: '1px solid #dcfce7' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>Total Paid</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14532d' }}>Rs {selectedStudent.total_paid.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '24px', border: '1px solid #fee2e2' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '8px' }}>Outstanding</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7f1d1d' }}>Rs {selectedStudent.total_dues.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Portal Authentication Section */}
                                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span className="material-icons" style={{ color: '#0f172a', fontSize: '20px' }}>vpn_key</span>
                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Portal Authentication</h4>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Manage student portal access credentials.</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Login ID</div>
                                                <input 
                                                    defaultValue={`${selectedStudent.full_name.toLowerCase().replace(/ /g, '.')}.${selectedStudent.student_id.toLowerCase()}@wisdom.edu`}
                                                    style={{ border: 'none', width: '100%', fontWeight: 700, fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1, background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Access Key</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{selectedStudent.student_id.toUpperCase()}#2026</div>
                                                </div>
                                                <button style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 16px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}>SYNC</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unified Transaction Timeline */}
                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden' }}>
                                        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Financial Timeline</h4>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {selectedFeeIds.size > 0 && (
                                                    <button onClick={handleBulkPay} disabled={isProcessing} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span className="material-icons" style={{ fontSize: '14px' }}>payments</span> PAY SELECTED ({selectedFeeIds.size})
                                                    </button>
                                                )}
                                                <button onClick={() => setShowAdjustmentModal(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>ADD ADJUSTMENT</button>
                                            </div>
                                        </div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                                    <th style={{ padding: '12px 24px', width: '40px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedFeeIds(new Set(ledgerFees.filter(f => !f.isPaid).map(f => f.id)));
                                                                else setSelectedFeeIds(new Set());
                                                            }}
                                                            checked={selectedFeeIds.size > 0 && selectedFeeIds.size === ledgerFees.filter(f => !f.isPaid).length}
                                                        />
                                                    </th>
                                                    <th style={{ padding: '12px 24px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                                                    <th style={{ padding: '12px 24px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Cycle</th>
                                                    <th style={{ padding: '12px 24px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                                                    <th style={{ padding: '12px 24px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                                    <th style={{ padding: '12px 24px', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledgerFees.map(f => (
                                                    <tr key={f.id} style={{ borderBottom: '1px solid #f8fafc', background: f.isPaid ? '#f0fdf4' : (selectedFeeIds.has(f.id) ? '#f0f9ff' : 'transparent'), transition: '0.2s' }}>
                                                        <td style={{ padding: '12px 24px' }}>
                                                            {!f.isPaid && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedFeeIds.has(f.id)}
                                                                    onChange={() => {
                                                                        const next = new Set(selectedFeeIds);
                                                                        if (next.has(f.id)) next.delete(f.id);
                                                                        else next.add(f.id);
                                                                        setSelectedFeeIds(next);
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px 24px' }}>
                                                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{f.fee_categories?.name || 'Academic Charge'}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Ref: {f.voucher?.voucher_number || f.id.slice(0,8).toUpperCase()}</div>
                                                        </td>
                                                        <td style={{ padding: '12px 24px', fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>{f.month}</td>
                                                        <td style={{ padding: '12px 24px', fontWeight: 800, fontSize: '0.8rem', color: f.isPaid ? '#166534' : '#0f172a' }}>Rs {f.amount.toLocaleString()}</td>
                                                        <td style={{ padding: '12px 24px' }}>
                                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: f.isPaid ? '#dcfce7' : '#f1f5f9', color: f.isPaid ? '#15803d' : '#64748b' }}>{f.isPaid ? 'PAID' : 'PENDING'}</span>
                                                        </td>
                                                        <td style={{ padding: '12px 24px' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {!f.isPaid ? (
                                                                    <>
                                                                        <button disabled={isProcessing} onClick={() => handleSetAsPaid(f)} style={{ border: 'none', background: '#0f172a', color: '#fff', borderRadius: '6px', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>SET PAID</button>
                                                                        <button disabled={isProcessing} onClick={() => handleEditFee(f)} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '16px' }}>edit</span></button>
                                                                        <button disabled={isProcessing} onClick={() => handleDeleteFee(f.id)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', width: 28, height: 28, cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '16px' }}>delete</span></button>
                                                                    </>
                                                                ) : (
                                                                    <button disabled={isProcessing} style={{ border: 'none', background: '#f8fafc', color: '#64748b', borderRadius: '6px', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'not-allowed' }}>LOCKED</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Academic Year Matrix</h4>
                                            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>Assignments across the year {reportYear}.</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                            <button onClick={() => setReportYear(y => y-1)} style={{ background: '#fff', border: 'none', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-icons" style={{ fontSize: '18px' }}>chevron_left</span></button>
                                            <span style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>{reportYear}</span>
                                            <button onClick={() => setReportYear(y => y+1)} style={{ background: '#fff', border: 'none', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {ACADEMIC_MONTHS.map(month => {
                                            const monthKey = `${month} ${reportYear}`;
                                            const assignments = ledgerFees.filter(f => f.month === monthKey);
                                            const total = assignments.reduce((a, b) => a + Number(b.amount), 0);
                                            return (
                                                <div key={month} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: total > 0 ? '#fff' : '#f8fafc', transition: '0.2s' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '12px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</div>
                                                    {total > 0 ? (
                                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Rs {total.toLocaleString()}</div>
                                                    ) : (
                                                        <div style={{ color: '#cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>VACANT</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Configuration Modal */}
            {showReportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '32px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Generate Detail Sheet</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Select duration and target classes.</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '12px', width: 40, height: 40, cursor: 'pointer', color: '#64748b' }}><span className="material-icons">close</span></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>From Month</label>
                                    <input type="month" value={reportConfig.fromMonth} onChange={e => setReportConfig(p => ({ ...p, fromMonth: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>To Month</label>
                                    <input type="month" value={reportConfig.toMonth} onChange={e => setReportConfig(p => ({ ...p, toMonth: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Select Classes</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '4px' }}>
                                    {classes.map(c => (
                                        <button 
                                            key={c} 
                                            onClick={() => {
                                                const next = reportConfig.selectedClasses.includes(c) 
                                                    ? reportConfig.selectedClasses.filter(x => x !== c)
                                                    : [...reportConfig.selectedClasses, c];
                                                setReportConfig(p => ({ ...p, selectedClasses: next }));
                                            }}
                                            style={{ 
                                                padding: '8px 14px', 
                                                borderRadius: '10px', 
                                                border: '1px solid',
                                                borderColor: reportConfig.selectedClasses.includes(c) ? '#0f172a' : '#e2e8f0',
                                                background: reportConfig.selectedClasses.includes(c) ? '#0f172a' : '#fff',
                                                color: reportConfig.selectedClasses.includes(c) ? '#fff' : '#64748b',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                transition: '0.2s'
                                            }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport || reportConfig.selectedClasses.length === 0}
                                style={{ 
                                    marginTop: '12px',
                                    padding: '16px', 
                                    borderRadius: '16px', 
                                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                                    color: '#fff', 
                                    fontWeight: 800, 
                                    fontSize: '0.9rem', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {isGeneratingReport ? <span className="material-icons spinning">refresh</span> : <span className="material-icons">task_alt</span>}
                                {isGeneratingReport ? 'Processing Data...' : 'Generate Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Report Preview */}
            {reportData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', zIndex: 1200 }}>
                    <div style={{ padding: '20px 40px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '14px' }}><span className="material-icons" style={{ color: '#0f172a' }}>print</span></div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Print Ready Detail Sheet</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>A4 Landscape Layout &bull; {Object.keys(reportData.classes).length} Classes</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setReportData(null)} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => window.print()} style={{ padding: '10px 32px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ fontSize: '18px' }}>local_printshop</span> Print All Sheets
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#334155' }}>
                        <div id="report-printable-area" style={{ margin: '0 auto', width: '297mm' }}>
                            {Object.entries(reportData.classes as any).map(([className, students]: [string, any], classIdx) => {
                                // Split students into groups of 10 for readability on A4 landscape
                                const studentGroups = [];
                                for (let i = 0; i < students.length; i += 10) {
                                    studentGroups.push(students.slice(i, i + 10));
                                }

                                return (
                                    <div key={className} style={{ pageBreakAfter: 'always', marginBottom: '30px', background: '#fff', padding: '8mm', minHeight: '210mm', boxSizing: 'border-box' }}>
                                        {/* Institutional Header - More Compact */}
                                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                            <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 950, color: '#0f172a', letterSpacing: '1px' }}>WISDOM HOUSE EDUCATION SYSTEM</h1>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', marginTop: '4px' }}>
                                                <div style={{ background: '#0f172a', color: '#fff', padding: '3pt 15pt', borderRadius: '4pt', fontWeight: 900, fontSize: '9pt', textTransform: 'uppercase' }}>FEE DETAIL SHEET</div>
                                                <div style={{ fontSize: '11pt', fontWeight: 800, color: '#1e293b' }}>CLASS: <span style={{ borderBottom: '1.5pt solid #0f172a', padding: '0 10px' }}>{className.toUpperCase()}</span></div>
                                            </div>
                                            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#64748b', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session: {reportConfig.fromMonth} — {reportConfig.toMonth}</div>
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #e2e8f0', tableLayout: 'fixed' }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <th style={{ width: '35px', border: '0.5pt solid #cbd5e1', padding: '4pt', fontSize: '7pt', fontWeight: 900, color: '#475569' }}>#</th>
                                                    <th style={{ width: '120px', border: '0.5pt solid #cbd5e1', padding: '4pt', fontSize: '7.5pt', fontWeight: 900, color: '#475569', textAlign: 'left' }}>STUDENT NAME</th>
                                                    <th style={{ width: '100px', border: '0.5pt solid #cbd5e1', padding: '4pt', fontSize: '7.5pt', fontWeight: 900, color: '#475569', textAlign: 'left' }}>FATHER NAME</th>
                                                    <th style={{ width: '80px', border: '0.5pt solid #cbd5e1', padding: '4pt', fontSize: '7.5pt', fontWeight: 900, color: '#475569' }}>CONTACT</th>
                                                    {reportData.months.map((m: string) => (
                                                        <th key={m} style={{ border: '0.5pt solid #cbd5e1', padding: '3pt', fontSize: '7pt', fontWeight: 900, textAlign: 'center', color: '#0f172a', background: '#f1f5f9' }}>
                                                            {m.split(' ')[0].substring(0, 3).toUpperCase()}
                                                        </th>
                                                    ))}
                                                    <th style={{ width: '60px', border: '0.5pt solid #cbd5e1', padding: '4pt', fontSize: '7.5pt', fontWeight: 900, color: '#fff', background: '#0f172a' }}>ANNUAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((s: any, idx: number) => (
                                                    <tr key={s.id} style={{ breakInside: 'avoid', background: idx % 2 === 0 ? '#fff' : '#fcfdfe' }}>
                                                        <td style={{ border: '0.5pt solid #e2e8f0', padding: '4pt', fontSize: '7.5pt', fontWeight: 700, textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                                        <td style={{ border: '0.5pt solid #e2e8f0', padding: '4pt', fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>{s.name}</td>
                                                        <td style={{ border: '0.5pt solid #e2e8f0', padding: '4pt', fontSize: '7pt', fontWeight: 600, color: '#475569' }}>{s.fatherName}</td>
                                                        <td style={{ border: '0.5pt solid #e2e8f0', padding: '4pt', fontSize: '7pt', fontWeight: 600, textAlign: 'center', color: '#475569' }}>{s.contact}</td>
                                                        {s.months.map((m: any, mIdx: number) => (
                                                            <td key={mIdx} style={{ border: '0.5pt solid #e2e8f0', padding: 0, height: '28pt' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                                    <div style={{ flex: 1, borderBottom: '0.2pt solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7.5pt', fontWeight: 800, color: '#0f172a' }}>
                                                                        {m.paidAmount ? Math.round(Number(m.paidAmount)).toLocaleString() : ''}
                                                                    </div>
                                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', fontWeight: 600, color: '#94a3b8' }}>
                                                                        {m.voucherNumber ? m.voucherNumber.split('-').pop() : ''}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        ))}
                                                        <td style={{ border: '0.5pt solid #e2e8f0', padding: '4pt', fontSize: '8pt', fontWeight: 900, textAlign: 'center', color: '#0f172a', background: '#f8fafc' }}>
                                                            {s.annualCollected > 0 ? s.annualCollected.toLocaleString() : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '7.5pt', fontWeight: 600, color: '#94a3b8', borderTop: '0.5pt solid #f1f5f9', paddingTop: '8px' }}>
                                            <div>Reported: {(() => {
                                                const d = new Date();
                                                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                            })()}</div>
                                            <div style={{ color: '#64748b' }}>Signature: _________________________</div>
                                            <div>© WHES Financial Intelligence</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinning { animation: spin 1s linear infinite; }
                @media print {
                    body { margin: 0; padding: 0; background: #fff !important; }
                    .no-print { display: none !important; }
                    #report-printable-area { width: 297mm !important; margin: 0 !important; padding: 0 !important; }
                    @page { size: A4 landscape; margin: 5mm; }
                    div { box-shadow: none !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                }
            `}</style>

            {/* Adjustment Modal */}
            {showAdjustmentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', width: '90%', maxWidth: '400px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Add Adjustment Fee</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Category</label>
                                <select 
                                    value={adjustmentData.categoryId} 
                                    onChange={e => setAdjustmentData({...adjustmentData, categoryId: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Amount</label>
                                <input 
                                    type="number" 
                                    value={adjustmentData.amount} 
                                    onChange={e => setAdjustmentData({...adjustmentData, amount: Number(e.target.value)})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Applicable Month</label>
                                <input 
                                    value={adjustmentData.month} 
                                    onChange={e => setAdjustmentData({...adjustmentData, month: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button onClick={() => setShowAdjustmentModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleAddAdjustment} disabled={isProcessing} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Add Fee</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </FeeLayout>
    );
}
