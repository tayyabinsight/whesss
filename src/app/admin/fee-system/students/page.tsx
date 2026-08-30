'use client';
import { useState, useEffect, useMemo } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';
import { VoucherSlip } from '@/components/VoucherSlip';
import ClassRosterPDFModal from '@/components/ClassRosterPDFModal';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type StudentRecord = {
    id: string;
    student_id: string;
    full_name: string;
    father_name: string;
    grade: string;
    contact_number: string;
    secondary_phone?: string;
    home_address?: string;
    total_assigned: number;
    total_paid: number;
    total_dues: number;
    credit_balance: number;
    status: 'CLEARED' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'CREDIT';
    sort_order: number;
    raw: any;
};

const ACADEMIC_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
];

const getClassOrder = (className: string) => {
    if (!className) return 999;
    const order = [
        'mont', 'nursery', 'prep i', 'prep ii',
        'class 1', 'class 2', 'class 3', 'class 4', 'class 5',
        'class 6', 'class 7', 'class 8', 'class 9', 'class matric', 'class 10'
    ];
    const index = order.indexOf(className.toLowerCase().trim());
    return index === -1 ? 999 : index;
};

export default function FeeManagementCenter() {
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [classes, setClasses] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'CLEARED' | 'PENDING' | 'OVERDUE' | 'PARTIAL'>('all');
    
    // Master Workspace State
    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'vouchers' | 'payments' | 'courses' | 'ledger' | 'security'>('overview');
    
    // Detailed Data for Selected Student
    const [studentFees, setStudentFees] = useState<any[]>([]);
    const [studentVouchers, setStudentVouchers] = useState<any[]>([]);
    const [studentPayments, setStudentPayments] = useState<any[]>([]);
    const [studentCourses, setStudentCourses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedFeeIds, setSelectedFeeIds] = useState<Set<string>>(new Set());
    
    // Direct Settlement & Slip No States
    const [showDirectPayModal, setShowDirectPayModal] = useState(false);
    const [directPayFees, setDirectPayFees] = useState<any[]>([]);
    const [directPaySlipNo, setDirectPaySlipNo] = useState('');
    const [directPayMode, setDirectPayMode] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'DD' | 'Online'>('Cash');
    const [directPayDate, setDirectPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [directPayError, setDirectPayError] = useState('');

    const [showEditSlipModal, setShowEditSlipModal] = useState(false);
    const [slipFeeTarget, setSlipFeeTarget] = useState<any>(null);
    const [slipInputVal, setSlipInputVal] = useState('');

    const [showUpdateBaseFeeModal, setShowUpdateBaseFeeModal] = useState(false);
    const [newBaseFee, setNewBaseFee] = useState<number>(0);

    const [voucherFilterTab, setVoucherFilterTab] = useState<'all' | 'active' | 'old'>('all');

    // Modal States
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({ categoryId: '', amount: 0, month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }), slip_no: '' });
    const [showCollectPaymentModal, setShowCollectPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        voucherId: '',
        amount: 0,
        mode: 'Cash' as 'Cash' | 'Cheque' | 'Bank Transfer' | 'DD',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0]
    });
    
    // Print / Voucher View Modal
    const [viewVoucherModal, setViewVoucherModal] = useState<any | null>(null);
    const [viewVoucherItems, setViewVoucherItems] = useState<any[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);

    // Course Link / Reconciliation Modal
    const [showCourseReconciliationModal, setShowCourseReconciliationModal] = useState(false);
    const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
    const [reconcileForm, setReconcileForm] = useState({
        invoiceNo: '',
        totalAmount: 0,
        paidAmount: 0,
        booksGiven: [] as string[],
        copiesGiven: [] as any[]
    });

    // Security / Credential Reset State
    const [newPassword, setNewPassword] = useState('');
    const [securityMsg, setSecurityMsg] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    // Matrix & Alignment State
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAlignMode, setIsAlignMode] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Detail Sheet Generator State
    const [showReportModal, setShowReportModal] = useState(false);
    const [showClassRosterModal, setShowClassRosterModal] = useState(false);
    const [reportConfig, setReportConfig] = useState({
        fromMonth: '2025-09',
        toMonth: '2026-08',
        selectedClasses: [] as string[]
    });

    const generateDetailReport = () => {
        const targetStudents = students.filter(s => 
            reportConfig.selectedClasses.length === 0 || reportConfig.selectedClasses.includes(s.grade)
        );

        const printWin = window.open('', '_blank');
        if (!printWin) return alert('Pop-up blocked. Please allow pop-ups to print the report.');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fee Detail Sheet - Wisdom House</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #000; }
                    h1 { font-size: 18px; margin: 0; }
                    p { font-size: 11px; margin: 2px 0 16px 0; color: #555; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                    th { background: #f2f2f2; font-weight: bold; }
                    .num { text-align: right; }
                    .status-cleared { color: #16a34a; font-weight: bold; }
                    .status-due { color: #dc2626; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>WISDOM HOUSE EDUCATION SYSTEM</h1>
                <p>Fee Detail Sheet &bull; Range: ${reportConfig.fromMonth} to ${reportConfig.toMonth} &bull; Generated: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Guardian</th>
                            <th>Class</th>
                            <th class="num">Assigned</th>
                            <th class="num">Paid</th>
                            <th class="num">Dues</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${targetStudents.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.student_id}</td>
                                <td><b>${s.full_name}</b></td>
                                <td>${s.father_name}</td>
                                <td>${s.grade}</td>
                                <td class="num">Rs ${s.total_assigned.toLocaleString()}</td>
                                <td class="num">Rs ${s.total_paid.toLocaleString()}</td>
                                <td class="num"><b>Rs ${s.total_dues.toLocaleString()}</b></td>
                                <td class="${s.total_dues === 0 ? 'status-cleared' : 'status-due'}">${s.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => printWin.print(), 500);
    };

    useEffect(() => {
        fetchDirectory();
    }, []);

    const fetchDirectory = async () => {
        setLoading(true);
        try {
            const { data: stdData } = await supabase.from('students').select('*').order('grade').order('full_name');
            
            // Fetch all student fees
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

            // Fetch all vouchers
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

            // Fetch categories
            const { data: catData } = await supabase.from('fee_categories').select('*').eq('is_active', true);
            if (catData) setCategories(catData);

            if (stdData) {
                const uniqueClasses = Array.from(new Set(stdData.map(s => s.grade))).filter(Boolean) as string[];
                uniqueClasses.sort((a, b) => getClassOrder(a) - getClassOrder(b));
                setClasses(uniqueClasses);

                const mapped: StudentRecord[] = stdData.map(s => {
                    const studentFeesList = feeData?.filter(f => f.student_id === s.id) || [];
                    const studentVouchersList = voucherData?.filter(v => v.student_id === s.id) || [];

                    const totalAssigned = studentFeesList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                    const totalPaid = studentVouchersList.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
                    const rawDiff = totalAssigned - totalPaid;
                    const totalDues = Math.max(0, rawDiff);
                    const creditBalance = rawDiff < 0 ? Math.abs(rawDiff) : 0;

                    let status: StudentRecord['status'] = 'CLEARED';
                    if (creditBalance > 0) {
                        status = 'CREDIT';
                    } else if (totalDues > 0) {
                        const hasOverdue = studentVouchersList.some(v => v.status === 'overdue');
                        status = hasOverdue ? 'OVERDUE' : (totalPaid > 0 ? 'PARTIAL' : 'PENDING');
                    }

                    return {
                        id: s.id,
                        student_id: s.student_id || `STU-${s.id.slice(0, 6)}`,
                        full_name: s.full_name,
                        father_name: s.guardian_name || 'N/A',
                        grade: s.grade,
                        contact_number: s.contact_number || 'N/A',
                        secondary_phone: s.secondary_phone,
                        home_address: s.home_address,
                        total_assigned: totalAssigned,
                        total_paid: totalPaid,
                        total_dues: totalDues,
                        credit_balance: creditBalance,
                        status,
                        sort_order: s.sort_order || 0,
                        raw: s
                    };
                });
                
                const sortedMapped = [...mapped].sort((a, b) => {
                    const gradeDiff = getClassOrder(a.grade) - getClassOrder(b.grade);
                    if (gradeDiff !== 0) return gradeDiff;
                    const orderA = a.sort_order === 0 ? 999999 : a.sort_order;
                    const orderB = b.sort_order === 0 ? 999999 : b.sort_order;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.full_name.localeCompare(b.full_name);
                });

                setStudents(sortedMapped);
            }
        } catch (err) {
            console.error('Directory Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load full details for selected student
    const handleSelectStudent = async (student: StudentRecord) => {
        setSelectedStudent(student);
        setSelectedFeeIds(new Set());
        setSecurityMsg('');
        setNewPassword('');

        // 1. Fetch fees
        const { data: fees } = await supabase
            .from('student_fees')
            .select('*, fee_categories(name)')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false });

        // 2. Fetch vouchers
        const { data: vouchers } = await supabase
            .from('fee_vouchers')
            .select('*')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false });

        // 3. Fetch voucher items for paid status mapping
        const feeIds = fees?.map(f => f.id) || [];
        let vItems: any[] = [];
        if (feeIds.length > 0) {
            const { data: items } = await supabase
                .from('fee_voucher_items')
                .select('*, fee_vouchers(*)')
                .in('student_fee_id', feeIds);
            vItems = items || [];
        }

        // 4. Fetch payments
        const { data: payments } = await supabase
            .from('fee_payments')
            .select('*, fee_vouchers(voucher_number)')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false });

        // 5. Fetch course invoices linked to student
        const { data: courses } = await supabase
            .from('course_invoices')
            .select('*')
            .or(`student_name.ilike.%${student.full_name}%,class_name.eq.${student.grade}`)
            .order('created_at', { ascending: false });

        const feesWithStatus = (fees || []).map(f => {
            const vItem = vItems?.find(vi => vi.student_fee_id === f.id);
            const slip = f.slip_no || (f.notes?.startsWith('SLIP_NO:') ? f.notes.replace('SLIP_NO:', '') : '') || vItem?.fee_vouchers?.slip_no || '';
            return {
                ...f,
                slip_no: slip,
                voucher: vItem?.fee_vouchers || null,
                isPaid: vItem?.fee_vouchers?.status === 'paid'
            };
        });

        setStudentFees(feesWithStatus);
        setStudentVouchers(vouchers || []);
        setStudentPayments(payments || []);
        setStudentCourses(courses || []);

        // Recalculate summary live
        const totalAssigned = (fees || []).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        const totalPaid = (vouchers || []).reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
        const rawDiff = totalAssigned - totalPaid;
        const totalDues = Math.max(0, rawDiff);
        const creditBalance = rawDiff < 0 ? Math.abs(rawDiff) : 0;

        setSelectedStudent(prev => prev ? {
            ...prev,
            total_assigned: totalAssigned,
            total_paid: totalPaid,
            total_dues: totalDues,
            credit_balance: creditBalance
        } : null);
    };

    // Add Fee Adjustment with optional Slip No
    const handleAddAdjustment = async () => {
        if (!adjustmentData.categoryId || !adjustmentData.amount) return alert('Please select category and enter amount.');
        setIsProcessing(true);
        try {
            const cleanSlip = adjustmentData.slip_no ? adjustmentData.slip_no.trim() : '';
            const feePayload: any = {
                student_id: selectedStudent?.id,
                fee_category_id: adjustmentData.categoryId,
                amount: Number(adjustmentData.amount),
                month: adjustmentData.month,
                class_name: selectedStudent?.grade,
                is_assigned: true,
                issue_date: new Date().toISOString()
            };
            if (cleanSlip) {
                feePayload.slip_no = cleanSlip;
                feePayload.notes = `SLIP_NO:${cleanSlip}`;
            }

            const { error } = await supabase.from('student_fees').insert(feePayload);
            if (!error) {
                setShowAdjustmentModal(false);
                setAdjustmentData({ categoryId: '', amount: 0, month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }), slip_no: '' });
                if (selectedStudent) handleSelectStudent(selectedStudent);
                fetchDirectory();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    // Save/Update Slip No on individual fee record (old or new fee)
    const handleSaveSlipNo = async (feeId: string, slipNo: string) => {
        if (!feeId) return;
        setIsProcessing(true);
        try {
            const cleanSlip = slipNo.trim();
            // Try updating slip_no and notes
            const { error } = await supabase.from('student_fees').update({
                slip_no: cleanSlip,
                notes: `SLIP_NO:${cleanSlip}`
            }).eq('id', feeId);

            if (error) {
                await supabase.from('student_fees').update({
                    notes: `SLIP_NO:${cleanSlip}`
                }).eq('id', feeId);
            }

            setShowEditSlipModal(false);
            setSlipFeeTarget(null);
            setSlipInputVal('');
            if (selectedStudent) handleSelectStudent(selectedStudent);
            alert('Slip number updated successfully!');
        } catch (e: any) {
            alert('Error updating Slip No: ' + (e.message || e));
        } finally {
            setIsProcessing(false);
        }
    };

    // Open Direct Payment Modal for selected fees (single or multiple months)
    const handleOpenDirectPay = (feesList: any[]) => {
        const unpaids = feesList.filter(f => !f.isPaid);
        if (unpaids.length === 0) {
            alert('The selected fee(s) are already paid.');
            return;
        }
        setDirectPayFees(unpaids);
        setDirectPaySlipNo(unpaids[0]?.slip_no || '');
        setDirectPayError('');
        setDirectPayMode('Cash');
        setDirectPayDate(new Date().toISOString().split('T')[0]);
        setShowDirectPayModal(true);
    };

    // Complete Direct Fee Settlement with Mandatory Slip No
    const handleDirectPayWithSlip = async () => {
        if (!selectedStudent || directPayFees.length === 0) return;
        if (!directPaySlipNo.trim()) {
            setDirectPayError('Slip No is required. Please enter a valid slip number before marking fee as paid.');
            return;
        }
        setDirectPayError('');
        setIsProcessing(true);
        try {
            const totalPay = directPayFees.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            const slipNum = directPaySlipNo.trim();

            const { data: sData } = await supabase.from('fee_settings').select('id, manual_prefix, manual_current_increment').single();
            const prefix = sData?.manual_prefix || 'MANUAL-';
            const currentInc = sData?.manual_current_increment || 1;
            const vNum = `${prefix}${String(currentInc).padStart(5, '0')}`;

            // Create paid fee voucher with slip_no
            const voucherPayload: any = {
                student_id: selectedStudent.id,
                voucher_number: vNum,
                total_amount: totalPay,
                paid_amount: totalPay,
                status: 'paid',
                slip_no: slipNum,
                issue_date: directPayDate || new Date().toISOString().split('T')[0],
                due_date: directPayDate || new Date().toISOString().split('T')[0],
                class_name: selectedStudent.grade
            };

            let effectiveVoucherId: string | null = null;
            const { data: newV, error: vErr } = await supabase.from('fee_vouchers').insert(voucherPayload).select().single();
            if (!vErr && newV) {
                effectiveVoucherId = newV.id;
            } else {
                // In case slip_no column is not directly in fee_vouchers table, insert without slip_no
                delete voucherPayload.slip_no;
                const { data: retryV } = await supabase.from('fee_vouchers').insert(voucherPayload).select().single();
                if (retryV) effectiveVoucherId = retryV.id;
            }

            // Link all selected student fees to this voucher & save slip_no
            for (const fee of directPayFees) {
                if (effectiveVoucherId) {
                    await supabase.from('fee_voucher_items').insert({
                        voucher_id: effectiveVoucherId,
                        student_fee_id: fee.id,
                        amount: fee.amount,
                        fee_category_id: fee.fee_category_id
                    });
                }

                // Update student_fees with slip_no
                try {
                    const { error: fErr } = await supabase.from('student_fees').update({
                        slip_no: slipNum,
                        notes: `SLIP_NO:${slipNum}`
                    }).eq('id', fee.id);
                    if (fErr) {
                        await supabase.from('student_fees').update({
                            notes: `SLIP_NO:${slipNum}`
                        }).eq('id', fee.id);
                    }
                } catch (err) {
                    console.error('Update fee slip err:', err);
                }
            }

            // Insert Payment receipt record
            await supabase.from('fee_payments').insert({
                voucher_id: effectiveVoucherId,
                student_id: selectedStudent.id,
                amount_paid: totalPay,
                payment_mode: directPayMode,
                payment_date: directPayDate,
                reference_number: slipNum
            });

            if (sData) {
                await supabase.from('fee_settings').update({ manual_current_increment: currentInc + 1 }).eq('id', sData.id);
            }

            setShowDirectPayModal(false);
            setDirectPayFees([]);
            setDirectPaySlipNo('');
            setSelectedFeeIds(new Set());
            if (selectedStudent) handleSelectStudent(selectedStudent);
            fetchDirectory();
            alert(`Fee marked as PAID directly with Slip #${slipNum}! New vouchers will exclude these paid fees.`);
        } catch (e: any) {
            alert('Error completing payment: ' + (e.message || e));
        } finally {
            setIsProcessing(false);
        }
    };

    // Update Base Tuition Fee for student (preserves old vouchers, applies to new vouchers)
    const handleUpdateBaseFee = async () => {
        if (!selectedStudent || newBaseFee < 0) return alert('Please enter a valid base fee amount.');
        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('students')
                .update({ base_fee: Number(newBaseFee) })
                .eq('id', selectedStudent.id);

            if (error) throw error;

            alert(`Base tuition fee updated to Rs ${Number(newBaseFee).toLocaleString()}! All old historical vouchers remain unchanged at their base fee, and newly generated vouchers will reflect this updated fee.`);
            setShowUpdateBaseFeeModal(false);
            if (selectedStudent) {
                const updated = { 
                    ...selectedStudent, 
                    raw: { ...selectedStudent.raw, base_fee: Number(newBaseFee) } 
                };
                setSelectedStudent(updated);
                handleSelectStudent(updated);
            }
            fetchDirectory();
        } catch (err: any) {
            alert('Error updating base fee: ' + (err.message || err));
        } finally {
            setIsProcessing(false);
        }
    };

    // Quick Mark Fee As Paid (opens direct pay modal)
    const handleSetFeeAsPaid = (fee: any) => {
        handleOpenDirectPay([fee]);
    };

    // Record Payment
    const handleRecordPayment = async () => {
        if (!selectedStudent || !paymentForm.amount || paymentForm.amount <= 0) {
            return alert('Please enter a valid payment amount.');
        }

        setIsProcessing(true);
        try {
            let voucherId = paymentForm.voucherId;
            // If no specific voucher selected, find first unpaid voucher or generate settlement voucher
            if (!voucherId) {
                const unpaidV = studentVouchers.find(v => v.status !== 'paid');
                if (unpaidV) {
                    voucherId = unpaidV.id;
                }
            }

            const { error: payErr } = await supabase.from('fee_payments').insert({
                student_id: selectedStudent.id,
                voucher_id: voucherId || null,
                amount_paid: Number(paymentForm.amount),
                payment_mode: paymentForm.mode,
                payment_date: paymentForm.paymentDate,
                reference_number: paymentForm.reference || `REC-${Date.now().toString().slice(-6)}`
            });

            if (payErr) throw payErr;

            // If voucher linked, update its paid_amount and status
            if (voucherId) {
                const v = studentVouchers.find(x => x.id === voucherId);
                if (v) {
                    const newPaid = Number(v.paid_amount || 0) + Number(paymentForm.amount);
                    const newStatus = newPaid >= Number(v.total_amount) ? 'paid' : (newPaid > 0 ? 'partial' : v.status);
                    await supabase.from('fee_vouchers').update({ paid_amount: newPaid, status: newStatus }).eq('id', voucherId);
                }
            }

            setShowCollectPaymentModal(false);
            setPaymentForm({ voucherId: '', amount: 0, mode: 'Cash', reference: '', paymentDate: new Date().toISOString().split('T')[0] });
            if (selectedStudent) handleSelectStudent(selectedStudent);
            fetchDirectory();
            alert('Payment recorded successfully!');
        } catch (e: any) {
            alert('Error recording payment: ' + (e.message || e));
        } finally {
            setIsProcessing(false);
        }
    };

    // Open Voucher Preview & Print
    const handleOpenVoucherSlip = async (voucher: any) => {
        setIsProcessing(true);
        try {
            const { data: items } = await supabase
                .from('fee_voucher_items')
                .select('*, student_fees(*, fee_categories(*)), fee_categories(*)')
                .eq('voucher_id', voucher.id);

            setViewVoucherModal(voucher);
            setViewVoucherItems(items || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    // Secure Student Password Reset (No plaintext exposure)
    const handleResetPassword = async () => {
        if (!selectedStudent || !newPassword || newPassword.length < 6) {
            return alert('Password must be at least 6 characters.');
        }
        setIsResettingPassword(true);
        setSecurityMsg('');
        try {
            // Update student password securely in database
            const { error } = await supabase
                .from('students')
                .update({ password: newPassword })
                .eq('id', selectedStudent.id);

            if (error) throw error;
            setSecurityMsg('Password updated successfully. Student credentials secured.');
            setNewPassword('');
        } catch (err: any) {
            setSecurityMsg('Failed to update password: ' + (err.message || err));
        } finally {
            setIsResettingPassword(false);
        }
    };

    // Filter students
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = 
                s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
                s.father_name?.toLowerCase().includes(search.toLowerCase()) ||
                s.contact_number?.toLowerCase().includes(search.toLowerCase());
            const matchesClass = selectedClass === 'all' || s.grade === selectedClass;
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            return matchesSearch && matchesClass && matchesStatus;
        });
    }, [students, search, selectedClass, statusFilter]);

    // Aggregate statistics
    const stats = useMemo(() => {
        const totalStudents = students.length;
        const totalReceivable = students.reduce((acc, s) => acc + s.total_assigned, 0);
        const totalCollected = students.reduce((acc, s) => acc + s.total_paid, 0);
        const totalPending = students.reduce((acc, s) => acc + s.total_dues, 0);
        const totalCredit = students.reduce((acc, s) => acc + s.credit_balance, 0);
        return { totalStudents, totalReceivable, totalCollected, totalPending, totalCredit };
    }, [students]);

    return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* Top Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Enrolled</span>
                            <span className="material-icons" style={{ color: '#3b82f6', fontSize: '20px' }}>groups</span>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{stats.totalStudents.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Active Registry Records</div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Fee Worth</span>
                            <span className="material-icons" style={{ color: '#0f172a', fontSize: '20px' }}>account_balance</span>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>Rs {stats.totalReceivable.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Cumulative Assigned Fees</div>
                    </div>

                    <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '20px', border: '1px solid #dcfce7', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</span>
                            <span className="material-icons" style={{ color: '#16a34a', fontSize: '20px' }}>payments</span>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#14532d' }}>Rs {stats.totalCollected.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', fontWeight: 600 }}>Realized Bank & Cash Inflows</div>
                    </div>

                    <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '20px', border: '1px solid #fee2e2', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Dues</span>
                            <span className="material-icons" style={{ color: '#dc2626', fontSize: '20px' }}>pending_actions</span>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7f1d1d' }}>Rs {stats.totalPending.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '4px', fontWeight: 600 }}>Pending & Overdue Balances</div>
                    </div>
                </div>

                {/* Main Content Layout: Student Directory on Left / Full Workspace Drawer when Selected */}
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Header Controls & Filters */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Fee Management Workspace</h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: 600 }}>
                                Single source of truth: Select any student to manage fees, vouchers, payments, courses, and ledgers in one place.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                            {/* Search Input */}
                            <div style={{ position: 'relative' }}>
                                <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
                                <input
                                    placeholder="Search by name, ID, phone..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        padding: '10px 14px 10px 38px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #e2e8f0',
                                        outline: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        width: '240px',
                                        background: '#f8fafc'
                                    }}
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: '#f8fafc',
                                    color: '#0f172a'
                                }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="CLEARED">Cleared</option>
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>

                            {/* Class Roster A4 PDF Generator */}
                            <button
                                onClick={() => setShowClassRosterModal(true)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#08213d',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(8, 33, 61, 0.25)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px', color: '#60a5fa' }}>picture_as_pdf</span>
                                Class Rosters (PDF)
                            </button>

                            {/* Detail Sheet Generator */}
                            <button
                                onClick={() => setShowReportModal(true)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#0f172a',
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
                                Detail Sheet
                            </button>

                            {/* Align Registry Order */}
                            <button
                                onClick={async () => {
                                    if (isAlignMode) {
                                        setIsProcessing(true);
                                        try {
                                            const updates = students.map((s, idx) => ({ ...s.raw, sort_order: idx + 1 }));
                                            const { error } = await supabase.from('students').upsert(updates);
                                            if (error) throw error;
                                            alert('Registry alignment order saved successfully!');
                                            setIsAlignMode(false);
                                            fetchDirectory();
                                        } catch (err: any) {
                                            alert('Error saving order: ' + err.message);
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    } else {
                                        setIsAlignMode(true);
                                    }
                                }}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: isAlignMode ? '#10b981' : '#f1f5f9',
                                    color: isAlignMode ? '#fff' : '#0f172a',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '18px' }}>{isAlignMode ? 'save' : 'sort'}</span>
                                {isAlignMode ? 'Save Alignment' : 'Align Order'}
                            </button>
                        </div>
                    </div>

                    {/* Class Filter Bar (All, Mont, Nursery, Prep I, Prep II, Class 1-10) */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                        <button
                            onClick={() => setSelectedClass('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: selectedClass === 'all' ? '#0f172a' : '#f1f5f9',
                                color: selectedClass === 'all' ? '#fff' : '#475569',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            All Classes ({students.length})
                        </button>
                        {classes.map(c => {
                            const count = students.filter(s => s.grade === c).length;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setSelectedClass(c)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: selectedClass === c ? '#0f172a' : '#f1f5f9',
                                        color: selectedClass === c ? '#fff' : '#475569',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {c} ({count})
                                </button>
                            );
                        })}

                        {/* Quick Active Class PDF Trigger */}
                        <button
                            onClick={() => setShowClassRosterModal(true)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1.5px dashed #08213d',
                                background: '#eff6ff',
                                color: '#08213d',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginLeft: 'auto'
                            }}
                            title="Export Class Roster PDF (Standard A4)"
                        >
                            <span className="material-icons" style={{ fontSize: '16px', color: '#2563eb' }}>picture_as_pdf</span>
                            Export {selectedClass === 'all' ? 'All Classes' : selectedClass} PDF
                        </button>
                    </div>

                    {/* Student Records Data Table */}
                    <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    {isAlignMode && <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '60px' }}>Order</th>}
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student Information</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class & Contact</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Assigned</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Paid</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Dues Balance</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '14px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Workspace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '60px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <span className="material-icons spinning" style={{ fontSize: '28px', color: '#0f172a' }}>refresh</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Loading Wisdom House Records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                            No students found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((s, idx) => (
                                        <tr
                                            key={s.id}
                                            draggable={isAlignMode}
                                            onDragStart={() => isAlignMode && setDraggedIndex(idx)}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (!isAlignMode || draggedIndex === null || draggedIndex === idx) return;
                                                const sourceStudent = filteredStudents[draggedIndex];
                                                const targetStudent = filteredStudents[idx];
                                                const newStudents = [...students];
                                                const sourceGlobalIdx = newStudents.findIndex(x => x.id === sourceStudent.id);
                                                const targetGlobalIdx = newStudents.findIndex(x => x.id === targetStudent.id);
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
                                                transition: '0.15s background',
                                                cursor: isAlignMode ? 'grab' : 'pointer',
                                                background: selectedStudent?.id === s.id ? '#f0f9ff' : (draggedIndex === idx ? '#f1f5f9' : 'transparent'),
                                                opacity: draggedIndex === idx ? 0.5 : 1
                                            }}
                                            onClick={() => !isAlignMode && handleSelectStudent(s)}
                                            onMouseEnter={e => !isAlignMode && selectedStudent?.id !== s.id && (e.currentTarget.style.background = '#f8fafc')}
                                            onMouseLeave={e => !isAlignMode && selectedStudent?.id !== s.id && (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {isAlignMode && (
                                                <td style={{ padding: '14px 20px', color: '#94a3b8' }}>
                                                    <span className="material-icons" style={{ fontSize: '18px' }}>drag_indicator</span>
                                                </td>
                                            )}
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: '10px',
                                                        background: '#0f172a',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 800,
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {s.full_name ? s.full_name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{s.full_name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>S/O: {s.father_name} &bull; <span style={{ color: '#0284c7' }}>{s.student_id}</span></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{s.grade}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{s.contact_number}</div>
                                            </td>
                                            <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                                                Rs {s.total_assigned.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.85rem', color: '#16a34a' }}>
                                                Rs {s.total_paid.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '14px 20px', fontWeight: 900, fontSize: '0.85rem', color: s.total_dues > 0 ? '#b91c1c' : '#94a3b8' }}>
                                                Rs {s.total_dues.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    background: s.status === 'CLEARED' ? '#dcfce7' : (s.status === 'OVERDUE' ? '#fee2e2' : '#fef9c3'),
                                                    color: s.status === 'CLEARED' ? '#15803d' : (s.status === 'OVERDUE' ? '#b91c1c' : '#854d0e'),
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectStudent(s);
                                                    }}
                                                    style={{
                                                        padding: '8px 14px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e2e8f0',
                                                        background: selectedStudent?.id === s.id ? '#0f172a' : '#fff',
                                                        color: selectedStudent?.id === s.id ? '#fff' : '#0f172a',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: '16px' }}>open_in_new</span> Open Hub
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* THE UNIFIED STUDENT WORKSPACE (POPUP / FULL DRAWER MODAL) */}
                {selectedStudent && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#fff',
                            width: '100%',
                            maxWidth: '1200px',
                            height: '92vh',
                            borderRadius: '28px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
                            border: '1px solid #e2e8f0'
                        }}>
                            {/* Workspace Top Header Bar */}
                            <div style={{
                                padding: '20px 32px',
                                background: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: '16px',
                                        background: '#0f172a',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.4rem',
                                        fontWeight: 900
                                    }}>
                                        {selectedStudent.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>{selectedStudent.full_name}</h3>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                background: '#e0f2fe',
                                                color: '#0369a1'
                                            }}>
                                                {selectedStudent.grade}
                                            </span>
                                        </div>
                                        <p style={{ margin: '3px 0 0 0', fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>
                                            ID: <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedStudent.student_id}</span> &bull; Guardian: {selectedStudent.father_name} &bull; Phone: {selectedStudent.contact_number}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setShowCollectPaymentModal(true)}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: '#16a34a',
                                            color: '#fff',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>add_card</span> Record Payment
                                    </button>

                                    <button
                                        onClick={() => setShowAdjustmentModal(true)}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: '#0f172a',
                                            color: '#fff',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '18px' }}>add_circle</span> Add Charge
                                    </button>

                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        style={{
                                            border: 'none',
                                            background: '#e2e8f0',
                                            borderRadius: '12px',
                                            width: 40,
                                            height: 40,
                                            cursor: 'pointer',
                                            color: '#475569',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '22px' }}>close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Summary Stat Pills for Selected Student */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '16px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Assigned</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Rs {selectedStudent.total_assigned.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '14px', border: '1px solid #dcfce7' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Total Paid</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803d' }}>Rs {selectedStudent.total_paid.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: '14px', border: '1px solid #fee2e2' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Outstanding Balance</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#b91c1c' }}>Rs {selectedStudent.total_dues.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '14px', border: '1px solid #dbeafe' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>Credit Balance</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1d4ed8' }}>Rs {selectedStudent.credit_balance.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Workspace Navigation Tabs */}
                            <div style={{ display: 'flex', gap: '6px', padding: '12px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                                {[
                                    { id: 'overview', label: 'Overview & Profile', icon: 'person' },
                                    { id: 'fees', label: 'Fee Items & Charges', icon: 'receipt_long' },
                                    { id: 'vouchers', label: 'Fee Vouchers', icon: 'receipt' },
                                    { id: 'payments', label: 'Payment Receipts', icon: 'payments' },
                                    { id: 'courses', label: 'Course Invoices & Books', icon: 'menu_book' },
                                    { id: 'ledger', label: 'Financial Ledger & Matrix', icon: 'table_view' },
                                    { id: 'security', label: 'Portal Security', icon: 'security' },
                                ].map(tab => {
                                    const active = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: active ? '#0f172a' : '#f1f5f9',
                                                color: active ? '#fff' : '#64748b',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content Container */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                                
                                {/* TAB 1: OVERVIEW */}
                                {activeTab === 'overview' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Academic Profile</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Full Name</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{selectedStudent.full_name}</span>
                                                </div>
                                                 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Registration ID</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800 }}>{selectedStudent.student_id}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Current Grade / Class</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{selectedStudent.grade}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Base Tuition Fee</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Old vouchers stay fixed; new vouchers take updated fee</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 900 }}>Rs {Number(selectedStudent.raw?.base_fee || 0).toLocaleString()}</span>
                                                        <button
                                                            onClick={() => {
                                                                setNewBaseFee(Number(selectedStudent.raw?.base_fee || 0));
                                                                setShowUpdateBaseFeeModal(true);
                                                            }}
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #cbd5e1',
                                                                background: '#fff',
                                                                color: '#0f172a',
                                                                fontWeight: 800,
                                                                fontSize: '0.7rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                            title="Update Base Fee for new vouchers"
                                                        >
                                                            <span className="material-icons" style={{ fontSize: '14px' }}>edit</span> Update Fee
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 800, textTransform: 'capitalize' }}>{selectedStudent.raw?.status || 'Active'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Guardian & Contact Info</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Father / Guardian</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{selectedStudent.father_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Primary Phone</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{selectedStudent.contact_number}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Secondary Phone</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>{selectedStudent.secondary_phone || 'N/A'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Home Address</span>
                                                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800, maxWidth: '200px', textAlign: 'right' }}>{selectedStudent.home_address || 'Karachi, Pakistan'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: FEES & CHARGES */}
                                {activeTab === 'fees' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Assigned Fees & Charges</h4>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Select unpaid month(s) and directly settle by adding mandatory Slip No</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {selectedFeeIds.size > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const selectedList = studentFees.filter(f => selectedFeeIds.has(f.id));
                                                            handleOpenDirectPay(selectedList);
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '10px',
                                                            border: 'none',
                                                            background: '#16a34a',
                                                            color: '#fff',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>
                                                        Pay Selected ({selectedFeeIds.size}) with Slip No
                                                    </button>
                                                )}
                                                <button onClick={() => setShowAdjustmentModal(true)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                                                    + Add Fee Item
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '12px 16px', width: '40px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={studentFees.filter(f => !f.isPaid).length > 0 && studentFees.filter(f => !f.isPaid).every(f => selectedFeeIds.has(f.id))}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        const unpaidIds = studentFees.filter(f => !f.isPaid).map(f => f.id);
                                                                        setSelectedFeeIds(new Set(unpaidIds));
                                                                    } else {
                                                                        setSelectedFeeIds(new Set());
                                                                    }
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Description / Category</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Billing Month</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Slip No</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Settlement Status</th>
                                                        <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentFees.length === 0 ? (
                                                        <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No fee assignments found.</td></tr>
                                                    ) : (
                                                        studentFees.map(f => (
                                                            <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: f.isPaid ? '#f0fdf4' : 'transparent' }}>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    {!f.isPaid ? (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedFeeIds.has(f.id)}
                                                                            onChange={e => {
                                                                                const next = new Set(selectedFeeIds);
                                                                                if (e.target.checked) next.add(f.id);
                                                                                else next.delete(f.id);
                                                                                setSelectedFeeIds(next);
                                                                            }}
                                                                            style={{ cursor: 'pointer' }}
                                                                        />
                                                                    ) : (
                                                                        <span className="material-icons" style={{ fontSize: '18px', color: '#16a34a' }}>check_circle</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{f.fee_categories?.name || 'Academic Charge'}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {f.id.slice(0, 8).toUpperCase()}</div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>{f.month}</td>
                                                                <td style={{ padding: '12px 16px', fontWeight: 900, fontSize: '0.85rem', color: f.isPaid ? '#15803d' : '#0f172a' }}>
                                                                    Rs {Number(f.amount).toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {f.slip_no ? (
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                                                #{f.slip_no}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                                                                        )}
                                                                        <button
                                                                            onClick={() => {
                                                                                setSlipFeeTarget(f);
                                                                                setSlipInputVal(f.slip_no || '');
                                                                                setShowEditSlipModal(true);
                                                                            }}
                                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                                                                            title="Edit / Set Slip No"
                                                                        >
                                                                            <span className="material-icons" style={{ fontSize: '15px' }}>edit</span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <span style={{
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 800,
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        background: f.isPaid ? '#dcfce7' : '#fee2e2',
                                                                        color: f.isPaid ? '#15803d' : '#b91c1c'
                                                                    }}>
                                                                        {f.isPaid ? 'PAID' : 'PENDING'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                                    {!f.isPaid ? (
                                                                        <button
                                                                            onClick={() => handleOpenDirectPay([f])}
                                                                            disabled={isProcessing}
                                                                            style={{
                                                                                padding: '6px 12px',
                                                                                borderRadius: '8px',
                                                                                border: 'none',
                                                                                background: '#16a34a',
                                                                                color: '#fff',
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: 800,
                                                                                cursor: 'pointer',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '4px'
                                                                            }}
                                                                        >
                                                                            <span className="material-icons" style={{ fontSize: '14px' }}>payment</span>
                                                                            Pay (Slip)
                                                                        </button>
                                                                    ) : (
                                                                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 800 }}>Settled</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: VOUCHERS */}
                                {activeTab === 'vouchers' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Generated Fee Vouchers</h4>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Vouchers past their due date are moved to the Old Vouchers archive</p>
                                            </div>
                                            {/* Sub-tabs for All / Active / Old Past Due */}
                                            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                                {[
                                                    { id: 'all', label: 'All Vouchers', count: studentVouchers.length },
                                                    { id: 'active', label: 'Active', count: studentVouchers.filter(v => v.status !== 'paid' && (!v.due_date || v.due_date >= new Date().toISOString().split('T')[0])).length },
                                                    { id: 'old', label: 'Old (Past Due)', count: studentVouchers.filter(v => (v.due_date && v.due_date < new Date().toISOString().split('T')[0]) || v.status === 'overdue').length },
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setVoucherFilterTab(t.id as any)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: voucherFilterTab === t.id ? '#0f172a' : 'transparent',
                                                            color: voucherFilterTab === t.id ? '#fff' : '#64748b',
                                                            fontWeight: 800,
                                                            fontSize: '0.7rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {t.label} ({t.count})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Voucher No</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Slip No</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Issue Date</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Due Date</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Amount</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Paid Amount</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const todayStr = new Date().toISOString().split('T')[0];
                                                        const filtered = studentVouchers.filter(v => {
                                                            if (voucherFilterTab === 'active') {
                                                                return v.status !== 'paid' && (!v.due_date || v.due_date >= todayStr);
                                                            }
                                                            if (voucherFilterTab === 'old') {
                                                                return (v.due_date && v.due_date < todayStr) || v.status === 'overdue';
                                                            }
                                                            return true;
                                                        });

                                                        if (filtered.length === 0) {
                                                            return <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No vouchers found in this filter category.</td></tr>;
                                                        }

                                                        return filtered.map(v => {
                                                            const isPastDue = v.due_date && v.due_date < todayStr;
                                                            return (
                                                                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', background: isPastDue && v.status !== 'paid' ? '#fff1f2' : 'transparent' }}>
                                                                    <td style={{ padding: '12px 20px', fontWeight: 900, color: '#0f172a', fontSize: '0.85rem' }}>{v.voucher_number}</td>
                                                                    <td style={{ padding: '12px 20px' }}>
                                                                        {v.slip_no ? (
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                                                #{v.slip_no}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>-</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: '0.8rem', color: '#475569' }}>{v.issue_date ? new Date(v.issue_date).toLocaleDateString() : 'N/A'}</td>
                                                                    <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.8rem', color: isPastDue ? '#dc2626' : '#475569' }}>
                                                                        {v.due_date ? new Date(v.due_date).toLocaleDateString() : 'N/A'}
                                                                        {isPastDue && v.status !== 'paid' && (
                                                                            <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>OLD / EXPIRED</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Rs {Number(v.total_amount).toLocaleString()}</td>
                                                                    <td style={{ padding: '12px 20px', fontWeight: 800, fontSize: '0.85rem', color: '#16a34a' }}>Rs {Number(v.paid_amount || 0).toLocaleString()}</td>
                                                                    <td style={{ padding: '12px 20px' }}>
                                                                        <span style={{
                                                                            fontSize: '0.65rem',
                                                                            fontWeight: 800,
                                                                            padding: '3px 8px',
                                                                            borderRadius: '6px',
                                                                            background: v.status === 'paid' ? '#dcfce7' : (v.status === 'overdue' || isPastDue ? '#fee2e2' : '#fef9c3'),
                                                                            color: v.status === 'paid' ? '#15803d' : (v.status === 'overdue' || isPastDue ? '#b91c1c' : '#854d0e'),
                                                                            textTransform: 'uppercase'
                                                                        }}>
                                                                            {v.status}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                                                        <button
                                                                            onClick={() => handleOpenVoucherSlip(v)}
                                                                            style={{
                                                                                padding: '6px 14px',
                                                                                borderRadius: '8px',
                                                                                border: '1px solid #e2e8f0',
                                                                                background: '#fff',
                                                                                color: '#0f172a',
                                                                                fontWeight: 800,
                                                                                fontSize: '0.75rem',
                                                                                cursor: 'pointer',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px'
                                                                            }}
                                                                        >
                                                                            <span className="material-icons" style={{ fontSize: '16px' }}>print</span> View & Print
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: PAYMENTS */}
                                {activeTab === 'payments' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Payment Receipts & Inflows</h4>
                                            <button
                                                onClick={() => setShowCollectPaymentModal(true)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: '#16a34a',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '16px' }}>add</span> Record Payment
                                            </button>
                                        </div>

                                        <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Receipt Ref</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Payment Date</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Amount Paid</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Mode</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Voucher Ref</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentPayments.length === 0 ? (
                                                        <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No payments logged yet.</td></tr>
                                                    ) : (
                                                        studentPayments.map(p => (
                                                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '12px 20px', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{p.reference_number || p.id.slice(0, 8).toUpperCase()}</td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: '0.8rem', color: '#475569' }}>{p.payment_date || new Date(p.created_at).toLocaleDateString()}</td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: '0.85rem', color: '#16a34a' }}>Rs {Number(p.amount_paid).toLocaleString()}</td>
                                                                <td style={{ padding: '12px 20px' }}>
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a' }}>
                                                                        {p.payment_mode || 'Cash'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>
                                                                    {p.fee_vouchers?.voucher_number || 'Direct'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: COURSES */}
                                {activeTab === 'courses' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Course Books & Invoice Reconciliation</h4>
                                        </div>

                                        <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Invoice No</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class Level</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Amount</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Paid Amount</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Books Delivered</th>
                                                        <th style={{ padding: '12px 20px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentCourses.length === 0 ? (
                                                        <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No course records linked yet.</td></tr>
                                                    ) : (
                                                        studentCourses.map(c => (
                                                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '12px 20px', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{c.invoice_no}</td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>{c.class_name}</td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Rs {Number(c.total_amount).toLocaleString()}</td>
                                                                <td style={{ padding: '12px 20px', fontWeight: 800, fontSize: '0.85rem', color: '#16a34a' }}>Rs {Number(c.paid_amount || 0).toLocaleString()}</td>
                                                                <td style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                                                                    {(c.books_given || []).length} books handed over
                                                                </td>
                                                                <td style={{ padding: '12px 20px' }}>
                                                                    <span style={{
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 800,
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        background: c.status === 'paid' ? '#dcfce7' : '#fee2e2',
                                                                        color: c.status === 'paid' ? '#15803d' : '#b91c1c',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        {c.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 6: FINANCIAL LEDGER & ACADEMIC YEAR MATRIX */}
                                {activeTab === 'ledger' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>Academic Year Ledger Matrix</h4>
                                                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>12-month billing distribution for academic cycle {reportYear}.</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                                <button onClick={() => setReportYear(y => y-1)} style={{ background: '#fff', border: 'none', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-icons" style={{ fontSize: '18px' }}>chevron_left</span></button>
                                                <span style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>{reportYear}</span>
                                                <button onClick={() => setReportYear(y => y+1)} style={{ background: '#fff', border: 'none', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span></button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                            {ACADEMIC_MONTHS.map(month => {
                                                const monthKey = `${month} ${reportYear}`;
                                                const assignments = studentFees.filter(f => f.month === monthKey);
                                                const total = assignments.reduce((a, b) => a + Number(b.amount || 0), 0);
                                                const isPaidMonth = assignments.length > 0 && assignments.every(f => f.isPaid);
                                                return (
                                                    <div key={month} style={{
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        border: '1px solid ' + (isPaidMonth ? '#dcfce7' : (total > 0 ? '#e2e8f0' : '#f1f5f9')),
                                                        background: isPaidMonth ? '#f0fdf4' : (total > 0 ? '#fff' : '#f8fafc'),
                                                        transition: '0.2s'
                                                    }}>
                                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '8px', color: '#0f172a', textTransform: 'uppercase' }}>{month}</div>
                                                        {total > 0 ? (
                                                            <>
                                                                <div style={{ fontWeight: 900, color: isPaidMonth ? '#15803d' : '#0f172a', fontSize: '1.05rem' }}>Rs {total.toLocaleString()}</div>
                                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isPaidMonth ? '#15803d' : '#ea580c' }}>
                                                                    {isPaidMonth ? 'SETTLED' : 'PENDING'}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <div style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>UNASSIGNED</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 7: PORTAL SECURITY (NO PLAINTEXT PASSWORDS) */}
                                {activeTab === 'security' && (
                                    <div style={{ maxWidth: '600px', background: '#f8fafc', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <span className="material-icons" style={{ color: '#0f172a', fontSize: '24px' }}>vpn_key</span>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>Portal Access Credentials</h4>
                                                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Zero plain-text exposure standard. Reset or update student password securely.</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Student Login Portal ID</label>
                                                <input
                                                    value={selectedStudent.student_id}
                                                    readOnly
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', color: '#475569', outline: 'none' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Set New Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Enter new strong password (min 6 chars)..."
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 600, fontSize: '0.85rem', outline: 'none' }}
                                                />
                                            </div>

                                            {securityMsg && (
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: securityMsg.includes('Failed') ? '#dc2626' : '#16a34a', padding: '8px 12px', borderRadius: '8px', background: securityMsg.includes('Failed') ? '#fee2e2' : '#dcfce7' }}>
                                                    {securityMsg}
                                                </div>
                                            )}

                                            <button
                                                onClick={handleResetPassword}
                                                disabled={isResettingPassword}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: '#0f172a',
                                                    color: '#fff',
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>lock_reset</span>
                                                {isResettingPassword ? 'Updating Security...' : 'Update Password Securely'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* RECORD PAYMENT MODAL */}
                {showCollectPaymentModal && selectedStudent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Record Payment</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>for {selectedStudent.full_name} ({selectedStudent.grade})</p>
                                </div>
                                <button onClick={() => setShowCollectPaymentModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Select Voucher (Optional)</label>
                                    <select
                                        value={paymentForm.voucherId}
                                        onChange={e => {
                                            const vId = e.target.value;
                                            const v = studentVouchers.find(x => x.id === vId);
                                            setPaymentForm(p => ({ ...p, voucherId: vId, amount: v ? Number(v.total_amount) - Number(v.paid_amount || 0) : p.amount }));
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                    >
                                        <option value="">-- General Account Settlement --</option>
                                        {studentVouchers.filter(v => v.status !== 'paid').map(v => (
                                            <option key={v.id} value={v.id}>{v.voucher_number} (Rs {Number(v.total_amount).toLocaleString()}) - Due: {v.due_date ? new Date(v.due_date).toLocaleDateString() : 'N/A'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amount to Pay (PKR)</label>
                                    <input
                                        type="number"
                                        value={paymentForm.amount || ''}
                                        onChange={e => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Payment Mode</label>
                                        <select
                                            value={paymentForm.mode}
                                            onChange={e => setPaymentForm(p => ({ ...p, mode: e.target.value as any }))}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="DD">Demand Draft</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Payment Date</label>
                                        <input
                                            type="date"
                                            value={paymentForm.paymentDate}
                                            onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Receipt / Bank Reference No</label>
                                    <input
                                        placeholder="e.g. HBL-987654 or Slip #1234"
                                        value={paymentForm.reference}
                                        onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>

                                <button
                                    onClick={handleRecordPayment}
                                    disabled={isProcessing}
                                    style={{
                                        marginTop: '10px',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#16a34a',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isProcessing ? 'Processing...' : 'Confirm & Log Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ADD FEE ADJUSTMENT MODAL */}
                {showAdjustmentModal && selectedStudent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '480px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Add Fee Charge</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>for {selectedStudent.full_name}</p>
                                </div>
                                <button onClick={() => setShowAdjustmentModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Fee Category</label>
                                    <select
                                        value={adjustmentData.categoryId}
                                        onChange={e => setAdjustmentData(p => ({ ...p, categoryId: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amount (PKR)</label>
                                    <input
                                        type="number"
                                        value={adjustmentData.amount || ''}
                                        onChange={e => setAdjustmentData(p => ({ ...p, amount: Number(e.target.value) }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Cycle Month</label>
                                    <input
                                        value={adjustmentData.month}
                                        onChange={e => setAdjustmentData(p => ({ ...p, month: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Slip No (Manual Slip Number)</label>
                                    <input
                                        placeholder="e.g. SLIP-2024-001 or 98234"
                                        value={adjustmentData.slip_no || ''}
                                        onChange={e => setAdjustmentData(p => ({ ...p, slip_no: e.target.value }))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                    />
                                </div>

                                <button
                                    onClick={handleAddAdjustment}
                                    disabled={isProcessing}
                                    style={{
                                        marginTop: '10px',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#0f172a',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isProcessing ? 'Saving...' : 'Add Fee to Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DIRECT FEE PAYMENT WITH MANDATORY SLIP NO MODAL */}
                {showDirectPayModal && selectedStudent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1150 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '520px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Direct Fee Settlement</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Mark selected month(s) as paid directly with mandatory Slip No</p>
                                </div>
                                <button onClick={() => setShowDirectPayModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            {/* Selected Items Summary */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Selected Months / Fees ({directPayFees.length}):</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                    {directPayFees.map(f => (
                                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                                            <span>• {f.fee_categories?.name || 'Fee'} ({f.month})</span>
                                            <span style={{ fontWeight: 900, color: '#0f172a' }}>Rs {Number(f.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Total Payment</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a' }}>Rs {directPayFees.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                        <span className="material-icons" style={{ fontSize: '14px' }}>pin</span> Slip Number (Mandatory *)
                                    </label>
                                    <input
                                        placeholder="Enter manual slip number (e.g. 10452 or SLIP-FEB-01)..."
                                        value={directPaySlipNo}
                                        onChange={e => setDirectPaySlipNo(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: directPayError ? '2px solid #dc2626' : '1.5px solid #0f172a', fontWeight: 800, fontSize: '0.95rem', outline: 'none', background: '#f8fafc' }}
                                        autoFocus
                                    />
                                    {directPayError && (
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>
                                            {directPayError}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Payment Mode</label>
                                        <select
                                            value={directPayMode}
                                            onChange={e => setDirectPayMode(e.target.value as any)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Online">Online</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Payment Date</label>
                                        <input
                                            type="date"
                                            value={directPayDate}
                                            onChange={e => setDirectPayDate(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '10px', border: '1px solid #a7f3d0', fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>
                                    ✓ This directly sets the selected fee(s) as <strong>PAID</strong> and attaches Slip #{directPaySlipNo || '...'}.<br />
                                    ✓ Future voucher generation will <strong>exclude</strong> these settled fees.
                                </div>

                                <button
                                    onClick={handleDirectPayWithSlip}
                                    disabled={isProcessing}
                                    style={{
                                        marginTop: '6px',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#16a34a',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span className="material-icons">check_circle</span>
                                    {isProcessing ? 'Recording Settlement...' : 'Mark Directly as PAID with Slip No'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT / SET SLIP NO MODAL (FOR OLD & NEW FEES) */}
                {showEditSlipModal && slipFeeTarget && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '420px', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Update Slip Number</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{slipFeeTarget.fee_categories?.name || 'Fee'} • {slipFeeTarget.month}</p>
                                </div>
                                <button onClick={() => setShowEditSlipModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Slip Number</label>
                                    <input
                                        placeholder="Enter manual slip number (e.g. 50493)..."
                                        value={slipInputVal}
                                        onChange={e => setSlipInputVal(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem', outline: 'none' }}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={() => handleSaveSlipNo(slipFeeTarget.id, slipInputVal)}
                                    disabled={isProcessing}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#0f172a',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isProcessing ? 'Saving...' : 'Save Slip Number'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* UPDATE BASE TUITION FEE MODAL */}
                {showUpdateBaseFeeModal && selectedStudent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '460px', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Update Base Fee</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>for {selectedStudent.full_name} ({selectedStudent.grade})</p>
                                </div>
                                <button onClick={() => setShowUpdateBaseFeeModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                                    <strong>Fee Update Policy:</strong><br />
                                    • All existing/old historical vouchers will remain at their original base fee.<br />
                                    • Newly created vouchers in upcoming cycles will automatically use this new fee.
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>New Monthly Base Fee (PKR)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        value={newBaseFee || ''}
                                        onChange={e => setNewBaseFee(Number(e.target.value))}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #0f172a', fontWeight: 900, fontSize: '1.1rem', outline: 'none' }}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateBaseFee}
                                    disabled={isProcessing}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#0f172a',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isProcessing ? 'Updating...' : 'Confirm Base Fee Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXACT PRESERVED VOUCHER SLIP PREVIEW & PRINT MODAL */}
                {viewVoucherModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '20px' }}>
                        <div style={{ background: '#fff', width: '100%', maxWidth: '980px', maxHeight: '92vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                            <div style={{ padding: '16px 24px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="material-icons">receipt</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Preserved Voucher: {viewVoucherModal.voucher_number}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => window.print()}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '16px' }}>print</span> Print Dual Slip
                                    </button>
                                    <button
                                        onClick={() => setViewVoucherModal(null)}
                                        style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <span className="material-icons">close</span>
                                    </button>
                                </div>
                            </div>

                            <div id="voucher-print-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', gap: '20px', background: '#fff' }}>
                                <VoucherSlip voucher={viewVoucherModal} items={viewVoucherItems} copyType="School Copy" student={selectedStudent} />
                                <VoucherSlip voucher={viewVoucherModal} items={viewVoucherItems} copyType="Parent's Copy" student={selectedStudent} />
                            </div>
                        </div>
                    </div>
                )}
                {/* DETAIL SHEET GENERATOR MODAL */}
                {showReportModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1150 }}>
                        <div style={{ background: '#fff', width: '90%', maxWidth: '520px', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Fee Detail Sheet Generator</h3>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Generate clean printable master ledger for all students or selected classes</p>
                                </div>
                                <button onClick={() => setShowReportModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b' }}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Select Classes to Include</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setReportConfig(c => ({ ...c, selectedClasses: c.selectedClasses.length === classes.length ? [] : [...classes] }))}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: reportConfig.selectedClasses.length === classes.length ? '#0f172a' : '#f1f5f9',
                                                color: reportConfig.selectedClasses.length === classes.length ? '#fff' : '#475569',
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {reportConfig.selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        {classes.map(cls => {
                                            const isSelected = reportConfig.selectedClasses.includes(cls);
                                            return (
                                                <button
                                                    key={cls}
                                                    type="button"
                                                    onClick={() => {
                                                        setReportConfig(c => ({
                                                            ...c,
                                                            selectedClasses: isSelected ? c.selectedClasses.filter(x => x !== cls) : [...c.selectedClasses, cls]
                                                        }));
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: isSelected ? '#0f172a' : '#f1f5f9',
                                                        color: isSelected ? '#fff' : '#475569',
                                                        fontWeight: 800,
                                                        fontSize: '0.7rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {cls}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>From Cycle</label>
                                        <input
                                            value={reportConfig.fromMonth}
                                            onChange={e => setReportConfig(c => ({ ...c, fromMonth: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>To Cycle</label>
                                        <input
                                            value={reportConfig.toMonth}
                                            onChange={e => setReportConfig(c => ({ ...c, toMonth: e.target.value }))}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 700, outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        generateDetailReport();
                                        setShowReportModal(false);
                                    }}
                                    style={{
                                        marginTop: '10px',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: '#0f172a',
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>print</span>
                                    Generate & Print Detail Sheet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EXACT FORMAT CLASS ROSTER PDF GENERATOR MODAL */}
                <ClassRosterPDFModal
                    isOpen={showClassRosterModal}
                    onClose={() => setShowClassRosterModal(false)}
                    students={students}
                    classes={classes}
                    defaultClass={selectedClass}
                />
            </div>
        </FeeLayout>
    );
}
