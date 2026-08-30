'use client';
import { useState, useEffect, useMemo } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

const CLASSES = ['Mont', 'Nursery', 'Prep I', 'Prep II', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class Matric'];

const getClassOrder = (className: string) => {
    if (!className) return 999;
    const order = [
        'mont', 'nursery', 'prep i', 'prep ii', 'prep 1', 'prep 2', 'prep',
        'class 1', 'class 2', 'class 3', 'class 4', 'class 5',
        'class 6', 'class 7', 'class 8', 'class 9', 'class matric', 'class 10'
    ];
    const index = order.indexOf(className.toLowerCase().trim());
    return index === -1 ? 999 : index;
};

type FeeItem = {
    id: string;
    amount: number;
    month: string;
    fee_category_id: string;
    fee_categories: { name: string };
    selected: boolean;
};

export default function GenerateVouchers() {
    const [targetAudience, setTargetAudience] = useState<'all' | 'class' | 'student'>('student');
    const [selectedClass, setSelectedClass] = useState('Class 1');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [allCategories, setAllCategories] = useState<any[]>([]);

    // Fee Selection State (Individual)
    const [unpaidFees, setUnpaidFees] = useState<FeeItem[]>([]);
    const [lateFine, setLateFine] = useState(0);
    const [discount, setDiscount] = useState(0);

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    const [manualSlipNo, setManualSlipNo] = useState('');
    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Registry State
    const [allVouchers, setAllVouchers] = useState<any[]>([]);
    const [registrySearch, setRegistrySearch] = useState('');
    const [registryStatus, setRegistryStatus] = useState('all');
    const [registryClass, setRegistryClass] = useState('all');
    const [registryIssueDate, setRegistryIssueDate] = useState('all');
    const [viewingVoucher, setViewingVoucher] = useState<any | null>(null);
    const [voucherItems, setVoucherItems] = useState<any[]>([]);
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const [selectedVoucherIds, setSelectedVoucherIds] = useState<Set<string>>(new Set());
    const [bulkPrintData, setBulkPrintData] = useState<any[]>([]); // Array of {voucher, items, student}
    const [isBulkPrinting, setIsBulkPrinting] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    // Class-Wise Document / Report State
    const [showClassWiseReportModal, setShowClassWiseReportModal] = useState(false);
    const [reportIssueDate, setReportIssueDate] = useState<string>('all');
    const [reportClassFilter, setReportClassFilter] = useState<string>('all');
    const [classWiseReportData, setClassWiseReportData] = useState<any[]>([]);
    const [reportTotals, setReportTotals] = useState<any>({
        totalClasses: 0,
        totalStudents: 0,
        totalMonthlyFee: 0,
        totalVoucherAmount: 0,
        totalPaidAmount: 0,
        totalDueAmount: 0
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<any>(null);
    const [editingItems, setEditingItems] = useState<any[]>([]);
    const [availableToEdit, setAvailableToEdit] = useState<any[]>([]);
    const [editForm, setEditForm] = useState({
        voucher_number: '',
        issue_date: '',
        due_date: '',
        fine: 0,
        discount: 0
    });

    const [loadingRegistry, setLoadingRegistry] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchVouchers();
        fetchCategories();
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase.from('fee_settings').select('*').single();
        if (data) setSettings(data);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('fee_categories').select('*').eq('is_active', true);
        if (data) setAllCategories(data);
    };

    const fetchVouchers = async () => {
        setLoadingRegistry(true);
        try {
            const { data: rawVouchers, error: vError } = await supabase
                .from('fee_vouchers')
                .select('*')
                .order('created_at', { ascending: false });

            if (vError) throw vError;

            if (rawVouchers && rawVouchers.length > 0) {
                // Fetch students using select('*') to prevent errors from missing columns
                const { data: studentsData, error: sError } = await supabase
                    .from('students')
                    .select('*');

                if (sError) console.error('Students fetch error:', sError);

                const studentMap: Record<string, any> = {};
                studentsData?.forEach(s => {
                    if (s.id) studentMap[s.id] = s;
                    if (s.student_id) studentMap[s.student_id] = s;
                });
                
                const enriched = rawVouchers.map(v => {
                    const std = studentMap[v.student_id] || studentMap[v.studentId] || null;
                    return {
                        ...v,
                        students: std,
                        studentName: std?.full_name || '',
                        fatherName: std?.guardian_name || std?.father_name || '',
                        className: v.class_name || std?.grade || 'General'
                    };
                });
                
                setAllVouchers(enriched);
            } else {
                setAllVouchers([]);
            }
        } catch (err: any) {
            console.error('Master Registry Fetch Error:', err.message || err);
            const { data: rawData } = await supabase.from('fee_vouchers').select('*').order('created_at', { ascending: false });
            setAllVouchers(rawData || []);
        } finally {
            setLoadingRegistry(false);
        }
    };

    useEffect(() => {
        if (targetAudience === 'student' && searchQuery.length > 2) {
            const timeout = setTimeout(() => searchStudents(), 300);
            return () => clearTimeout(timeout);
        } else {
            setStudents([]);
        }
    }, [searchQuery, targetAudience]);

    const searchStudents = async () => {
        const { data } = await supabase.from('students').select('*').or(`full_name.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%,guardian_name.ilike.%${searchQuery}%`).limit(5);
        if (data) setStudents(data);
    };

    const handleSelectStudent = async (s: any) => {
        setSelectedStudent(s);
        setSearchQuery('');
        setStudents([]);
        const { data } = await supabase.from('student_fees').select('*, fee_categories(name)').eq('student_id', s.id).order('month', { ascending: true });
        if (data) {
            // Fetch items linked to PAID vouchers only to identify what's truly "settled"
            const feeIds = data.map(f => f.id);
            const { data: linkedItems } = await supabase
                .from('fee_voucher_items')
                .select('student_fee_id, fee_vouchers!inner(status)')
                .in('student_fee_id', feeIds)
                .eq('fee_vouchers.status', 'paid');
            
            const paidIds = new Set(linkedItems?.map(i => i.student_fee_id).filter(Boolean));
            
            const available = data.filter(f => !paidIds.has(f.id)).map(f => ({ ...f, selected: true }));
            setUnpaidFees(available as FeeItem[]);
        }
    };

    const toggleFeeSelection = (id: string) => {
        setUnpaidFees(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
    };

    const totalSelectedAmount = unpaidFees.filter(f => f.selected).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const netGrandTotal = Math.max(0, totalSelectedAmount + lateFine - discount);

    const handleGenerate = async () => {
        if (targetAudience === 'student' && (!selectedStudent || unpaidFees.filter(f => f.selected).length === 0)) {
            return alert('Please select a student and at least one fee item.');
        }
        setGenerating(true);
        setStatus({ type: 'info', message: 'Generating Secure Financial Voucher...' });
        try {
            let targets: any[] = [];
            if (targetAudience === 'student') targets = [selectedStudent];
            else if (targetAudience === 'class') {
                const { data } = await supabase.from('students').select('*').eq('grade', selectedClass).eq('status', 'active');
                targets = data || [];
            } else {
                const { data } = await supabase.from('students').select('*').eq('status', 'active');
                targets = data || [];
            }
            if (targets.length === 0) throw new Error('No target students found.');
            const { data: latestSettings } = await supabase.from('fee_settings').select('*').single();
            const { data: existingVouchers } = await supabase.from('fee_vouchers').select('voucher_number');

            let prefix = latestSettings?.voucher_prefix || 'WHES-';
            let currentInc = latestSettings?.current_increment || 1;

            // Only look at existing vouchers that start with our prefix to determine the next serial
            const relevantVouchers = existingVouchers?.filter(v => v.voucher_number.startsWith(prefix)) || [];
            
            if (relevantVouchers.length > 0) {
                const nums = relevantVouchers.map(v => {
                    const match = v.voucher_number.match(/\d+$/);
                    return match ? parseInt(match[0]) : 0;
                });
                const maxInDb = Math.max(...nums);
                if (maxInDb >= currentInc) {
                    currentInc = maxInDb + 1;
                }
            }

            let successCount = 0;
            
            // ROBUST FETCH: Get ONLY PAID linked fee IDs to allow unpaid ones to be re-vouchered
            let allPaidFeeIds: string[] = [];
            let lastId = null;
            let hasMore = true;
            while (hasMore && allPaidFeeIds.length < 100000) {
                let query = supabase
                    .from('fee_voucher_items')
                    .select('id, student_fee_id, fee_vouchers!inner(status)')
                    .eq('fee_vouchers.status', 'paid')
                    .order('id')
                    .limit(1000);
                if (lastId) query = query.gt('id', lastId);
                const { data } = await query;
                if (data && data.length > 0) {
                    allPaidFeeIds = [...allPaidFeeIds, ...data.map(i => i.student_fee_id).filter(Boolean)];
                    lastId = data[data.length - 1].id;
                } else {
                    hasMore = false;
                }
            }
            const paidSet = new Set(allPaidFeeIds);

            for (const target of targets) {
                let itemsToVoucher: any[] = [];
                if (targetAudience === 'student') {
                    itemsToVoucher = unpaidFees.filter(f => f.selected);
                } else {
                    const { data: stdFees } = await supabase.from('student_fees').select('*, fee_categories(name)').eq('student_id', target.id);
                    let availableFees = stdFees?.filter(f => !paidSet.has(f.id)) || [];

                    // Consolidated Logic: If any fee matches the filter (e.g. Monthly Only), 
                    // we include ALL unpaid fees for that student to provide a complete latest voucher.
                    const matchesFilter = (f: any) => {
                        if (categoryFilter === 'all') return true;
                        const catName = f.fee_categories?.name?.toLowerCase() || '';
                        if (categoryFilter === 'monthly_only') return catName.includes('tuition') || catName.includes('monthly');
                        if (categoryFilter === 'annual_only') return catName.includes('annual') || catName.includes('admission') || catName.includes('fund');
                        return f.fee_category_id === categoryFilter;
                    };

                    const hasMatchingFee = availableFees.some(matchesFilter);
                    if (hasMatchingFee) {
                        itemsToVoucher = availableFees;
                    }
                }

                if (itemsToVoucher.length === 0) continue;
                const stdTotal = itemsToVoucher.reduce((a, b) => a + Number(b.amount), 0);
                
                // SKIPPING ZERO VOUCHERS: Do not generate if total amount is zero or less
                if (stdTotal <= 0) continue;

                // CLEANUP: Delete previous unpaid vouchers for this student to ensure the "Latest" one is consolidated.
                await supabase.from('fee_vouchers').delete().eq('student_id', target.id).eq('status', 'unpaid');

                const finalTotal = Math.max(0, stdTotal + lateFine - discount);
                const voucherNo = `${prefix}${String(currentInc).padStart(5, '0')}`;
                const voucherPayload: any = {
                    voucher_number: voucherNo, 
                    student_id: target.id, 
                    class_name: target.grade,
                    issue_date: issueDate, 
                    due_date: dueDate, 
                    total_amount: finalTotal,
                    fine: lateFine, 
                    discount: discount, 
                    status: 'unpaid'
                };
                if (manualSlipNo.trim()) {
                    voucherPayload.slip_no = manualSlipNo.trim();
                }

                let { data: vData, error: vError } = await supabase.from('fee_vouchers').insert([voucherPayload]).select().single();
                
                // Fallback if slip_no column does not exist in schema yet
                if (vError && (vError.message?.includes('slip_no') || vError.code === 'PGRST204')) {
                    delete voucherPayload.slip_no;
                    const retry = await supabase.from('fee_vouchers').insert([voucherPayload]).select().single();
                    vData = retry.data;
                    vError = retry.error;
                }

                if (vError) throw vError;

                const itemInserts = itemsToVoucher.map(f => ({ voucher_id: vData.id, fee_category_id: f.fee_category_id, student_fee_id: f.id, amount: f.amount }));
                await supabase.from('fee_voucher_items').insert(itemInserts);

                // If a slip number was manually specified, also tag the student_fees
                if (manualSlipNo.trim()) {
                    for (const f of itemsToVoucher) {
                        await supabase.from('student_fees').update({ notes: `SLIP_NO:${manualSlipNo.trim()}` }).eq('id', f.id);
                    }
                }

                currentInc++; successCount++;
            }
            await supabase.from('fee_settings').update({ current_increment: currentInc }).eq('id', latestSettings.id);
            setStatus({ type: 'success', message: `✅ Successfully generated ${successCount} consolidated vouchers.` });
            fetchVouchers();
            if (targetAudience === 'student') { setSelectedStudent(null); setUnpaidFees([]); setManualSlipNo(''); }
        } catch (err: any) { setStatus({ type: 'error', message: err.message }); } finally { setGenerating(false); }
    };

    const fetchVoucherItems = async (v: any) => {
        setVoucherItems([]);
        setViewingStudent(null);
        
        try {
            const data = await fetchFullVoucherData(v);
            if (data) {
                setVoucherItems(data.items);
                setViewingStudent(data.student);
            }
        } catch (err) {
            console.error('Fetch Error:', err);
        }
    };

    const fetchFullVoucherData = async (v: any) => {
        // 1. Fetch Raw Items
        const { data: rawItems } = await supabase.from('fee_voucher_items').select('*').eq('voucher_id', v.id);
        let enrichedItems: any[] = [];
        if (rawItems && rawItems.length > 0) {
            const catIds = Array.from(new Set(rawItems.map(i => i.fee_category_id).filter(Boolean)));
            const { data: cats } = catIds.length > 0 ? await supabase.from('fee_categories').select('id, name').in('id', catIds) : { data: [] };
            
            const feeIds = Array.from(new Set(rawItems.map(i => i.student_fee_id).filter(Boolean)));
            const { data: fees } = feeIds.length > 0 ? await supabase.from('student_fees').select('id, month, amount, notes, fee_category_id').in('id', feeIds) : { data: [] };
            
            const catsMap = new Map(cats?.map(c => [c.id, c]) || []);
            const feesMap = new Map(fees?.map(f => [f.id, f]) || []);

            enrichedItems = rawItems.map(item => {
                const feeObj = feesMap.get(item.student_fee_id);
                const catObj = catsMap.get(item.fee_category_id);
                return {
                    ...item,
                    fee_categories: catObj || { name: 'Institutional Fee' },
                    student_fees: feeObj || { month: 'Current' },
                    month: feeObj?.month || 'Current'
                };
            });
        }
        // 2. Fetch Student data safely
        let stdData = v.students;
        if (!stdData) {
            const { data: s } = await supabase.from('students').select('*').or(`id.eq.${v.student_id},student_id.eq.${v.student_id}`).maybeSingle();
            stdData = s;
        }
        return { items: enrichedItems, student: stdData };
    };

    const handleDeleteVoucher = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voucher? This will NOT delete the associated fees, but the voucher link will be removed.')) return;
        const { error } = await supabase.from('fee_vouchers').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchVouchers();
    };

    const handleOpenEdit = async (v: any) => {
        setEditingVoucher(v);
        setIsEditing(true);
        setGenerating(true); 
        
        try {
            // 1. Fetch current voucher items (Simplified query for stability)
            const { data: currentItems, error: itemsError } = await supabase.from('fee_voucher_items').select('*').eq('voucher_id', v.id);
            
            if (itemsError) throw itemsError;

            // 2. Fetch names separately if needed (More robust than joins)
            const catIds = Array.from(new Set(currentItems?.map(i => i.fee_category_id).filter(Boolean) || []));
            const { data: cats } = await supabase.from('fee_categories').select('id, name').in('id', catIds);
            
            const feeIds = Array.from(new Set(currentItems?.map(i => i.student_fee_id).filter(Boolean) || []));
            const { data: fees } = await supabase.from('student_fees').select('id, month').in('id', feeIds);

            // Normalize current items
            const normalizedCurrent = (currentItems || []).map(i => {
                const cat = cats?.find(c => c.id === i.fee_category_id);
                const fee = fees?.find(f => f.id === i.student_fee_id);
                return {
                    student_fee_id: i.student_fee_id,
                    amount: i.amount,
                    fee_category_id: i.fee_category_id,
                    name: cat?.name || 'Institutional Fee',
                    month: fee?.month || 'Current'
                };
            });

            console.log('DEBUG: Found Items:', normalizedCurrent.length);
            setEditingItems(normalizedCurrent);
            
            // 2. Fetch ALL student fees to identify unvouchered ones
            const { data: allStudentFees } = await supabase.from('student_fees').select('*, fee_categories(name)').eq('student_id', v.student_id).order('month', { ascending: true });
            
            // 3. Identify which fees are already linked to PAID vouchers
            const { data: studentPaidVouchers } = await supabase.from('fee_vouchers').select('id').eq('student_id', v.student_id).eq('status', 'paid');
            const paidVIds = studentPaidVouchers?.map(sv => sv.id) || [];
            
            let paidFeeIds = new Set<string>();
            if (paidVIds.length > 0) {
                const { data: paidItems } = await supabase.from('fee_voucher_items').select('student_fee_id').in('voucher_id', paidVIds);
                paidFeeIds = new Set(paidItems?.map(li => li.student_fee_id).filter(Boolean) || []);
            }
            
            // 4. Available fees = Fees not in any PAID voucher
            const available = allStudentFees?.filter(f => !paidFeeIds.has(f.id)) || [];
            
            setAvailableToEdit(available);
            setEditForm({
                voucher_number: v.voucher_number,
                issue_date: v.issue_date?.split('T')[0] || '',
                due_date: v.due_date?.split('T')[0] || '',
                fine: v.fine || 0,
                discount: v.discount || 0
            });
        } catch (err) { 
            console.error('Edit Load Error:', err); 
        } finally { 
            setGenerating(false); 
        }
    };

    const handleUpdateVoucher = async () => {
        if (!editingVoucher) return;
        if (editingItems.length === 0) return alert('Cannot save an empty voucher. Please include at least one fee item.');
        
        setGenerating(true);
        try {
            const totalItemsAmt = editingItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const finalTotal = Math.max(0, totalItemsAmt + editForm.fine - editForm.discount);
            
            // 1. Update main record
            const { error: vError } = await supabase.from('fee_vouchers').update({
                voucher_number: editForm.voucher_number,
                issue_date: editForm.issue_date,
                due_date: editForm.due_date,
                fine: editForm.fine,
                discount: editForm.discount,
                total_amount: finalTotal
            }).eq('id', editingVoucher.id);
            
            if (vError) throw vError;
            
            // 2. Sync Items
            await supabase.from('fee_voucher_items').delete().eq('voucher_id', editingVoucher.id);
            
            const newItems = editingItems.map(item => ({
                voucher_id: editingVoucher.id,
                fee_category_id: item.fee_category_id,
                student_fee_id: item.student_fee_id,
                amount: item.amount
            }));
            
            const { error: iError } = await supabase.from('fee_voucher_items').insert(newItems);
            if (iError) throw iError;
            
            setIsEditing(false);
            fetchVouchers();
            alert('✅ Voucher updated and synchronized successfully!');
        } catch (err: any) { 
            alert('Sync Error: ' + err.message); 
        } finally { 
            setGenerating(false); 
        }
    };

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        } catch {
            return dateStr;
        }
    };

    const availableIssueDates = useMemo(() => {
        const datesMap = new Map<string, number>();
        allVouchers.forEach(v => {
            if (v.issue_date) {
                const d = v.issue_date.split('T')[0];
                datesMap.set(d, (datesMap.get(d) || 0) + 1);
            }
        });
        return Array.from(datesMap.entries())
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([date, count]) => ({ date, count }));
    }, [allVouchers]);

    const handleBulkPrint = async () => {
        if (selectedVoucherIds.size === 0) return;
        setIsBulkPrinting(true);
        setStatus({ type: 'info', message: 'Preparing Bulk Print Data...' });
        const results = [];
        for (const id of Array.from(selectedVoucherIds)) {
            const v = allVouchers.find(v => v.id === id);
            if (v) {
                const full = await fetchFullVoucherData(v);
                results.push({ voucher: v, ...full });
            }
        }
        setBulkPrintData(results);
        setStatus({ type: '', message: '' });
    };

    const handleBulkPrintByDate = async (targetDate: string) => {
        if (!targetDate || targetDate === 'all') {
            if (allVouchers.length === 0) return alert('No vouchers available to print.');
            setSelectedVoucherIds(new Set(filteredVouchers.map(v => v.id)));
            handleBulkPrint();
            return;
        }

        const targetVouchers = allVouchers.filter(v => v.issue_date && v.issue_date.split('T')[0] === targetDate);
        if (targetVouchers.length === 0) return alert(`No vouchers found issued on ${formatDateStr(targetDate)}.`);
        
        setIsBulkPrinting(true);
        setStatus({ type: 'info', message: `Preparing bulk print for ${targetVouchers.length} vouchers issued on ${formatDateStr(targetDate)}...` });
        const results = [];
        for (const v of targetVouchers) {
            const full = await fetchFullVoucherData(v);
            results.push({ voucher: v, ...full });
        }
        setBulkPrintData(results);
        setStatus({ type: '', message: '' });
    };

    const handleOpenClassWiseReport = (initialDate = 'all') => {
        const dateToUse = initialDate !== 'all' ? initialDate : (registryIssueDate !== 'all' ? registryIssueDate : (availableIssueDates[0]?.date || 'all'));
        setReportIssueDate(dateToUse);
        setReportClassFilter(registryClass !== 'all' ? registryClass : 'all');
        setShowClassWiseReportModal(true);
        generateClassWiseReportData(dateToUse, registryClass !== 'all' ? registryClass : 'all');
    };

    const generateClassWiseReportData = async (targetIssueDate = reportIssueDate, targetClass = reportClassFilter) => {
        setReportLoading(true);
        try {
            // 1. Filter vouchers by target issue date and class
            const matchedVouchers = allVouchers.filter(v => {
                const vDate = v.issue_date ? v.issue_date.split('T')[0] : '';
                const matchesDate = !targetIssueDate || targetIssueDate === 'all' || vDate === targetIssueDate;
                const matchesClass = !targetClass || targetClass === 'all' || v.class_name === targetClass || v.students?.grade === targetClass;
                return matchesDate && matchesClass;
            });

            if (matchedVouchers.length === 0) {
                setClassWiseReportData([]);
                setReportTotals({ totalClasses: 0, totalStudents: 0, totalMonthlyFee: 0, totalVoucherAmount: 0, totalPaidAmount: 0, totalDueAmount: 0 });
                return;
            }

            const vIds = matchedVouchers.map(v => v.id);

            // 2. Fetch raw items for matched vouchers in chunks of 500
            let allRawItems: any[] = [];
            for (let i = 0; i < vIds.length; i += 500) {
                const chunk = vIds.slice(i, i + 500);
                const { data: itemsChunk, error: itemsErr } = await supabase
                    .from('fee_voucher_items')
                    .select('*')
                    .in('voucher_id', chunk);

                if (itemsErr) {
                    console.error('Error fetching report items chunk:', itemsErr);
                } else if (itemsChunk) {
                    allRawItems = [...allRawItems, ...itemsChunk];
                }
            }

            // 3. Fetch referenced fee_categories and student_fees separately for 100% data reliability
            const allCatIds = Array.from(new Set(allRawItems.map(i => i.fee_category_id).filter(Boolean)));
            const allFeeIds = Array.from(new Set(allRawItems.map(i => i.student_fee_id).filter(Boolean)));

            const { data: catsData } = allCatIds.length > 0
                ? await supabase.from('fee_categories').select('id, name').in('id', allCatIds)
                : { data: [] };
            const catsMap = new Map(catsData?.map(c => [c.id, c]) || []);

            let allFeesData: any[] = [];
            for (let i = 0; i < allFeeIds.length; i += 500) {
                const feeChunk = allFeeIds.slice(i, i + 500);
                const { data: fData } = await supabase.from('student_fees').select('id, month, amount, notes, fee_category_id').in('id', feeChunk);
                if (fData) allFeesData = [...allFeesData, ...fData];
            }
            const feesMap = new Map(allFeesData.map(f => [f.id, f]));

            // Ensure students map is complete if any matched voucher doesn't have students
            const missingStudentIds = matchedVouchers.filter(v => !v.students).map(v => v.student_id).filter(Boolean);
            let extraStudentsMap = new Map<string, any>();
            if (missingStudentIds.length > 0) {
                const { data: extraStudents } = await supabase.from('students').select('*').in('id', missingStudentIds);
                extraStudents?.forEach(s => {
                    extraStudentsMap.set(s.id, s);
                    if (s.student_id) extraStudentsMap.set(s.student_id, s);
                });
            }

            // Group items by voucher_id
            const itemsByVoucher = new Map<string, any[]>();
            allRawItems.forEach(item => {
                const feeObj = feesMap.get(item.student_fee_id);
                const enrichedItem = {
                    ...item,
                    fee_categories: catsMap.get(item.fee_category_id) || { name: 'Institutional Fee' },
                    student_fees: feeObj || null,
                    month: feeObj?.month || ''
                };
                const list = itemsByVoucher.get(item.voucher_id) || [];
                list.push(enrichedItem);
                itemsByVoucher.set(item.voucher_id, list);
            });

            // 4. Process each voucher into student record
            const processedRecords = matchedVouchers.map(v => {
                const items = itemsByVoucher.get(v.id) || [];
                const std = v.students || extraStudentsMap.get(v.student_id) || {};

                // Extract monthly base fee
                let monthlyFee = Number(std.base_fee || 0);
                if (!monthlyFee || monthlyFee === 0) {
                    const tuitionItem = items.find(it => {
                        const name = (it.fee_categories?.name || '').toLowerCase();
                        return name.includes('tuition') || name.includes('monthly');
                    });
                    if (tuitionItem) {
                        monthlyFee = Number(tuitionItem.amount || 0);
                    } else if (items.length > 0) {
                        monthlyFee = Number(items[0].amount || 0);
                    }
                }

                // Extract month names & categories
                const monthNamesSet = new Set<string>();
                const otherCategoriesSet = new Set<string>();

                items.forEach(it => {
                    const catName = it.fee_categories?.name || '';
                    const m = it.student_fees?.month || it.month || '';
                    if (m && m !== 'Current') {
                        monthNamesSet.add(m);
                    }
                    if (!catName.toLowerCase().includes('tuition') && !catName.toLowerCase().includes('monthly') && catName) {
                        otherCategoriesSet.add(catName);
                    }
                });

                const uniqueMonths = Array.from(monthNamesSet);
                let monthsSummary = '';
                if (uniqueMonths.length > 0) {
                    monthsSummary = uniqueMonths.join(', ');
                    if (uniqueMonths.length > 1) {
                        monthsSummary += ` (${uniqueMonths.length} Mos)`;
                    }
                } else {
                    if (v.issue_date) {
                        try {
                            const d = new Date(v.issue_date);
                            monthsSummary = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        } catch {
                            monthsSummary = 'Current Cycle';
                        }
                    } else {
                        monthsSummary = 'Current Cycle';
                    }
                }

                if (otherCategoriesSet.size > 0) {
                    monthsSummary += ` + ${Array.from(otherCategoriesSet).join(', ')}`;
                }

                const voucherAmount = Number(v.total_amount || 0);
                const isPaid = v.status === 'paid';
                const paidAmount = isPaid ? voucherAmount : Number(v.paid_amount || 0);
                const dueAmount = isPaid ? 0 : Math.max(0, voucherAmount - paidAmount);

                const studentName = std.full_name || v.studentName || '---';
                const fatherName = std.guardian_name || std.father_name || v.fatherName || '---';
                const studentRoll = std.student_id || '---';

                return {
                    voucherId: v.id,
                    voucherNumber: v.voucher_number,
                    slipNo: v.slip_no || '',
                    issueDate: v.issue_date,
                    dueDate: v.due_date,
                    studentId: studentRoll,
                    studentName: studentName,
                    fatherName: fatherName,
                    className: v.class_name || std.grade || 'General',
                    monthlyFee: monthlyFee,
                    monthsCount: Math.max(1, uniqueMonths.length),
                    monthsSummary: monthsSummary,
                    voucherAmount: voucherAmount,
                    paidAmount: paidAmount,
                    dueAmount: dueAmount,
                    status: v.status,
                    fine: Number(v.fine || 0),
                    discount: Number(v.discount || 0)
                };
            });

            // 5. Group by Class and sort
            const classMap = new Map<string, any[]>();
            processedRecords.forEach(rec => {
                const cls = rec.className || 'General';
                const list = classMap.get(cls) || [];
                list.push(rec);
                classMap.set(cls, list);
            });

            const sortedClasses = Array.from(classMap.keys()).sort((a, b) => getClassOrder(a) - getClassOrder(b));

            let grandStudents = 0;
            let grandMonthlyFee = 0;
            let grandVoucherAmount = 0;
            let grandPaid = 0;
            let grandDue = 0;

            const groupedData = sortedClasses.map(clsName => {
                const classStudents = classMap.get(clsName) || [];
                classStudents.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

                const classTotalMonthly = classStudents.reduce((acc, curr) => acc + curr.monthlyFee, 0);
                const classTotalVoucherAmt = classStudents.reduce((acc, curr) => acc + curr.voucherAmount, 0);
                const classTotalPaid = classStudents.reduce((acc, curr) => acc + curr.paidAmount, 0);
                const classTotalDue = classStudents.reduce((acc, curr) => acc + curr.dueAmount, 0);

                grandStudents += classStudents.length;
                grandMonthlyFee += classTotalMonthly;
                grandVoucherAmount += classTotalVoucherAmt;
                grandPaid += classTotalPaid;
                grandDue += classTotalDue;

                return {
                    className: clsName,
                    students: classStudents,
                    subtotal: {
                        count: classStudents.length,
                        totalMonthlyFee: classTotalMonthly,
                        totalVoucherAmount: classTotalVoucherAmt,
                        totalPaid: classTotalPaid,
                        totalDue: classTotalDue
                    }
                };
            });

            setClassWiseReportData(groupedData);
            setReportTotals({
                totalClasses: groupedData.length,
                totalStudents: grandStudents,
                totalMonthlyFee: grandMonthlyFee,
                totalVoucherAmount: grandVoucherAmount,
                totalPaidAmount: grandPaid,
                totalDueAmount: grandDue
            });
        } catch (err) {
            console.error('Error generating class-wise report:', err);
        } finally {
            setReportLoading(false);
        }
    };

    const handlePrintClassWiseReport = () => {
        const reportElem = document.getElementById('class-wise-report-printable');
        if (!reportElem) return alert('Report content not ready.');
        const p = window.open('', '', 'height=900,width=1200');
        if (!p) return alert('Pop-up blocked. Please allow pop-ups to print or download PDF.');

        p.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Class-Wise Fee Statement - Wisdom House</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    * { box-sizing: border-box; }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #0f172a;
                        background: #fff;
                        font-size: 10px;
                        line-height: 1.3;
                    }
                    .report-header {
                        text-align: center;
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 8px;
                        margin-bottom: 12px;
                    }
                    .school-title {
                        font-size: 16px;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                        margin: 0;
                        text-transform: uppercase;
                    }
                    .report-subtitle {
                        font-size: 11px;
                        font-weight: 800;
                        margin: 3px 0 6px 0;
                        color: #1e293b;
                    }
                    .meta-bar {
                        display: flex;
                        justify-content: space-between;
                        font-size: 8.5px;
                        font-weight: 700;
                        color: #475569;
                        background: #f8fafc;
                        padding: 4px 8px;
                        border-radius: 4px;
                        border: 1px solid #e2e8f0;
                    }
                    .class-section {
                        margin-bottom: 16px;
                        page-break-inside: avoid;
                    }
                    .class-title-banner {
                        background: #0f172a;
                        color: #fff;
                        padding: 5px 10px;
                        font-size: 10.5px;
                        font-weight: 900;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-radius: 4px 4px 0 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 8.5px;
                    }
                    th, td {
                        border: 1px solid #cbd5e1;
                        padding: 4px 6px;
                        text-align: left;
                    }
                    th {
                        background: #f1f5f9;
                        font-weight: 800;
                        color: #334155;
                        text-transform: uppercase;
                        font-size: 8px;
                    }
                    .num {
                        text-align: right;
                        font-weight: 700;
                    }
                    .subtotal-row {
                        background: #f8fafc;
                        font-weight: 800;
                        border-top: 1.5px solid #0f172a;
                        border-bottom: 1.5px solid #0f172a;
                    }
                    .grand-total-card {
                        margin-top: 20px;
                        border: 2px solid #0f172a;
                        border-radius: 6px;
                        padding: 10px 14px;
                        background: #f8fafc;
                        page-break-inside: avoid;
                    }
                    .grand-total-title {
                        font-size: 11px;
                        font-weight: 900;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                        color: #0f172a;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 4px;
                    }
                    .grand-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 8px;
                        text-align: center;
                    }
                    .grand-box {
                        padding: 6px;
                        background: #fff;
                        border: 1px solid #cbd5e1;
                        border-radius: 4px;
                    }
                    .grand-label {
                        font-size: 7.5px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    .grand-val {
                        font-size: 12px;
                        font-weight: 900;
                        color: #0f172a;
                        margin-top: 2px;
                    }
                    .grand-due {
                        color: #dc2626;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 36px;
                        padding-top: 8px;
                        page-break-inside: avoid;
                    }
                    .sig-line {
                        border-top: 1px solid #000;
                        width: 140px;
                        text-align: center;
                        font-size: 8px;
                        font-weight: 800;
                        padding-top: 3px;
                    }
                    @media print {
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                ${reportElem.innerHTML}
            </body>
            </html>
        `);
        p.document.close();
        p.focus();
        setTimeout(() => {
            p.print();
            p.close();
        }, 600);
    };

    const toggleVoucherSelection = (id: string, index: number, event?: React.MouseEvent) => {
        const next = new Set(selectedVoucherIds);
        
        if (event?.shiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const rangeIds = filteredVouchers.slice(start, end + 1).map(v => v.id);
            
            // If the start item is being selected, select the range. If being deselected, deselect.
            const shouldSelect = next.has(filteredVouchers[lastSelectedIndex].id);
            rangeIds.forEach(rid => {
                if (shouldSelect) next.add(rid);
                else next.delete(rid);
            });
        } else {
            if (next.has(id)) next.delete(id);
            else next.add(id);
        }
        
        setSelectedVoucherIds(next);
        setLastSelectedIndex(index);
    };

    const filteredVouchers = allVouchers.filter(v => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isPastDue = v.due_date && v.due_date < todayStr;
        
        const slipVal = (v.slip_no || '').toLowerCase();
        const sName = (v.students?.full_name || v.studentName || '').toLowerCase();
        const gName = (v.students?.guardian_name || v.students?.father_name || v.fatherName || '').toLowerCase();
        const sId = (v.students?.student_id || '').toLowerCase();
        const vNo = (v.voucher_number || '').toLowerCase();
        const q = registrySearch.toLowerCase().trim();
        const matchesSearch = !q || vNo.includes(q) || slipVal.includes(q) || sName.includes(q) || gName.includes(q) || sId.includes(q);

        let matchesStatus = true;
        if (registryStatus === 'unpaid') matchesStatus = v.status === 'unpaid';
        else if (registryStatus === 'paid') matchesStatus = v.status === 'paid';
        else if (registryStatus === 'active') matchesStatus = v.status === 'unpaid' && !isPastDue;
        else if (registryStatus === 'old_past_due') matchesStatus = isPastDue;
        
        const matchesClass = registryClass === 'all' || v.class_name === registryClass;
        const matchesIssueDate = registryIssueDate === 'all' || (v.issue_date && v.issue_date.split('T')[0] === registryIssueDate);
        return matchesSearch && matchesStatus && matchesClass && matchesIssueDate;
    });

    const VoucherSlip = ({ voucher, items, copyType, student }: { voucher: any, items: any[], copyType: string, student?: any }) => {
        const monthMap: { [key: string]: number } = {
            'January': 1, 'Feb': 2, 'February': 2, 'Mar': 3, 'March': 3, 'Apr': 4, 'April': 4, 'May': 5, 'Jun': 6, 'June': 6,
            'Jul': 7, 'July': 7, 'Aug': 8, 'August': 8, 'Sep': 9, 'September': 9, 'Oct': 10, 'October': 10, 'Nov': 11, 'November': 11, 'Dec': 12, 'December': 12
        };

        const parseMonth = (mStr: string) => {
            if (!mStr) return 0;
            const parts = mStr.split(' ');
            if (parts.length === 2) {
                const monthName = parts[0];
                const year = parseInt(parts[1]) || 0;
                const month = monthMap[monthName] || 0;
                return year * 12 + month;
            }
            return 0;
        };

        // Robust property access helpers
        const getCatName = (i: any) => i.fee_categories?.name || i.fee_category?.name || 'Institutional Fee';
        const getMonth = (i: any) => i.student_fees?.month || i.student_fee?.month || '';

        // 1. Identify Tuition/Monthly items for the primary row
        const tuitionItems = (items || []).filter(i => {
            const name = getCatName(i).toLowerCase();
            return name.includes('tuition') || name.includes('monthly');
        }).sort((a, b) => parseMonth(getMonth(a)) - parseMonth(getMonth(b)));

        const latestTuition = tuitionItems.length > 0 ? tuitionItems[tuitionItems.length - 1] : null;
        
        // 2. All other items (previous tuition + other categories) - Catch-all logic
        const latestId = latestTuition?.id;
        const remainingItems = (items || []).filter(i => i.id !== latestId);

        const arrearsTotal = remainingItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        // DEFAULTER LOGIC: If student has > 3 months of unpaid tuition fees
        const isDefaulter = tuitionItems.length > 3;

        // Robust student data access
        const studentData = student || voucher?.students || voucher?.student || {};
        const studentFullName = studentData.full_name || voucher?.studentName || '---';
        const fatherFullName = studentData.guardian_name || studentData.father_name || voucher?.fatherName || '---';

        const formatDate = (dateStr: string) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            return `${d}-${m}-${y}`;
        };

        return (
            <div style={{ padding: '15px', flex: 1, position: 'relative', minHeight: '100%', borderRight: copyType === 'School Copy' ? '1px dashed #ccc' : 'none', color: '#000', background: '#fff' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <img src="/wisdom.png" alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 950, color: '#000', lineHeight: 1.1 }}>WISDOM HOUSE EDUCATION SYSTEM</h2>
                        <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#444' }}>A project of Oxford Grammar School</p>
                        <p style={{ margin: '2px 0', fontSize: '0.58rem', fontWeight: 600, color: '#555', lineHeight: 1.2 }}>
                            Plot RS-5, Street No 10, Near Thanvi Masjid, Jacob Line, Karachi.<br />
                            Phone: 0330-4784749, 0311-1284802
                        </p>
                    </div>
                </div>

                <div style={{ border: '1.5px solid #000', borderRadius: '4px', textAlign: 'center', padding: '2px', fontSize: '0.7rem', fontWeight: 950, marginBottom: '8px', background: '#f2f2f2' }}>
                    {copyType.toUpperCase()}
                </div>

                {/* Bank Details Section */}
                <div style={{ display: 'flex', border: '1.5px solid #000', borderRadius: '4px', marginBottom: '8px', overflow: 'hidden', alignItems: 'stretch' }}>
                    <div style={{ flex: '0 0 75px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.5rem', background: '#fff', borderRight: '2px solid #000' }}>
                        HBL
                    </div>
                    <div style={{ flex: 1, padding: '5px 12px', fontSize: '0.65rem' }}>
                        <div style={{ fontWeight: 800, marginBottom: '1px' }}>Account Title: <span style={{ fontWeight: 950, fontSize: '0.75rem' }}>WISDOM HOUSE ED.</span></div>
                        <div style={{ fontWeight: 800, marginBottom: '1px' }}>Account No: <span style={{ fontWeight: 950, fontSize: '0.75rem' }}>54267000073803</span></div>
                        <div style={{ fontWeight: 800 }}>IBAN: <span style={{ fontWeight: 950, fontSize: '0.7rem' }}>PK70HABB0054267000073803</span></div>
                    </div>
                </div>

                {/* Metadata Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', fontSize: '0.7rem', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <div><span style={{ fontWeight: 850 }}>Voucher No:</span> <span style={{ fontWeight: 950, borderBottom: '1.2px solid #000' }}>{voucher?.voucher_number || 'N/A'}</span></div>
                        {voucher?.slip_no && (
                            <div style={{ marginLeft: '6px' }}><span style={{ fontWeight: 850 }}>Slip #:</span> <span style={{ fontWeight: 950, borderBottom: '1.2px solid #000', color: '#0f172a' }}>{voucher.slip_no}</span></div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}><span style={{ fontWeight: 850 }}>Issue Date:</span> {formatDate(voucher?.issue_date)}</div>
                </div>

                {/* Student Info Box - IMPROVED FOR 'PROPER' DISPLAY */}
                <div style={{ border: '1.5px solid #000', padding: '12px', borderRadius: '4px', marginBottom: '10px', fontSize: '0.85rem', position: 'relative' }}>
                    {isDefaulter && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#d32f2f', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: 950, fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #fff' }}>
                            Defaulter
                        </div>
                    )}
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 800, width: '120px', flexShrink: 0, color: '#333' }}>Student Name:</span> 
                        <span style={{ fontWeight: 950, fontSize: '1.1rem', textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #eee', flex: 1, paddingRight: isDefaulter ? '100px' : '0' }}>{studentFullName}</span>
                    </div>
                    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 800, width: '120px', flexShrink: 0, color: '#333' }}>Father Name:</span> 
                        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#000', borderBottom: '1px solid #eee', flex: 1 }}>{fatherFullName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 800, width: '120px', flexShrink: 0, color: '#333' }}>Class:</span> 
                            <span style={{ fontWeight: 950, color: '#000' }}>{voucher?.class_name || 'N/A'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                            <span style={{ fontWeight: 800, color: '#333' }}>Due Date:</span> <span style={{ color: '#d32f2f', fontWeight: 950, marginLeft: '5px' }}>{formatDate(voucher?.due_date)}</span>
                        </div>
                    </div>
                </div>

                {/* Fee Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <thead>
                        <tr style={{ background: '#eee', border: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 950 }}>Fee Description</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 950 }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 1. Latest Monthly Fee */}
                        {latestTuition ? (
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 900 }}>Monthly Fee ({getMonth(latestTuition) || 'Current'})</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 950 }}>{Number(latestTuition.amount || 0).toLocaleString()}</td>
                            </tr>
                        ) : (
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ padding: '6px 8px', color: '#888', fontStyle: 'italic' }}>No Tuition Items Found</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>0</td>
                            </tr>
                        )}
                        
                        {/* 2. All other items (Arrears & Other Charges) */}
                        {remainingItems.map((item, i) => (
                            <tr key={'rem' + i} style={{ borderBottom: '0.5px solid #ccc' }}>
                                <td style={{ padding: '4px 8px', fontWeight: 750, paddingLeft: '15px', color: '#444' }}>
                                    - {getCatName(item)} {getMonth(item) ? `(${getMonth(item)})` : ''}
                                </td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800 }}>
                                    {Number(item.amount || 0).toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {/* 4. Arrears (Due Amount Total) */}
                        {arrearsTotal > 0 && (
                            <tr style={{ borderTop: '1.2px solid #000', background: '#f9f9f9' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 950 }}>Total Arrears (Due Amount)</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 950 }}>{arrearsTotal.toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        {/* Discount */}
                        {(voucher?.discount || 0) > 0 && (
                            <tr>
                                <td style={{ padding: '4px 8px', fontWeight: 850, color: '#2e7d32' }}>Institutional Discount (-)</td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 850, color: '#2e7d32' }}>{Number(voucher.discount).toLocaleString()}</td>
                            </tr>
                        )}
                        
                        {/* Dual Payment Section */}
                        <tr>
                            <td colSpan={2} style={{ padding: '5px 0' }}>
                                <div style={{ display: 'flex', border: '1.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ flex: 1, padding: '6px 8px', borderRight: '1.5px solid #000' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#444' }}>Payable Within Due Date</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950 }}>Rs {Number((voucher?.total_amount || 0) - (voucher?.fine || 0)).toLocaleString()}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '6px 8px', background: '#f2f2f2' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#c62828' }}>Payable After Due Date (Incl. Fine)</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#c62828' }}>Rs {Number(voucher?.total_amount || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        {/* Late Fee Note */}
                        {(voucher?.fine || 0) > 0 && (
                            <tr>
                                <td colSpan={2} style={{ padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                    * Late fee of Rs {Number(voucher.fine).toLocaleString()} is included in the "After Due Date" total.
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>

                {/* Footer and Stamps */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.55rem', color: '#333', fontWeight: 700 }}>
                        Printed on: {new Date().toLocaleString()}<br />
                        Note: This is a computer generated voucher.<br />
                        Correction only through admin office.
                    </div>
                    <div style={{ textAlign: 'center', borderTop: '1.5px solid #000', width: '130px', paddingTop: '4px', fontSize: '0.65rem', fontWeight: 950 }}>
                        Issuing Authority
                    </div>
                </div>
            </div>
        );
    };

    return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Voucher Issuance</h2>
                            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                                {(['student', 'class', 'all'] as const).map(type => (
                                    <button key={type} onClick={() => { setTargetAudience(type); setSelectedStudent(null); }} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: targetAudience === type ? '#fff' : 'transparent', color: targetAudience === type ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: targetAudience === type ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}>{type.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>

                        {targetAudience === 'student' ? (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <span className="material-icons" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
                                    <input placeholder="Search Student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600, fontSize: '0.9rem', background: '#f8fafc' }} />
                                    {students.length > 0 && !selectedStudent && (
                                        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
                                            {students.map(s => <div key={s.id} onClick={() => handleSelectStudent(s)} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}><div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.full_name}</div><div style={{ fontSize: '0.65rem', color: '#64748b' }}>S/O: {s.guardian_name || 'N/A'} &bull; {s.grade}</div></div><span className="material-icons" style={{ color: '#10b981', fontSize: '18px' }}>add_circle</span></div>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: targetAudience === 'class' ? '1fr 1.5fr' : '1fr', gap: '16px', marginBottom: '20px' }}>
                                {targetAudience === 'class' && (
                                    <div>
                                        <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Target Class</label>
                                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#fff', outline: 'none', fontSize: '0.85rem' }}>
                                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Fee Category</label>
                                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#fff', outline: 'none', fontSize: '0.85rem' }}>
                                        <option value="all">All Pending Fees</option>
                                        <option value="monthly_only">Monthly Fee Only</option>
                                        <option value="annual_only">Annual Charges Only</option>
                                        <option value="divider" disabled>────────────────</option>
                                        {allCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} Only</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                        {selectedStudent && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>{selectedStudent.full_name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{selectedStudent.full_name}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{selectedStudent.grade} &bull; Base Fee: Rs {selectedStudent.base_fee?.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedStudent(null)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}><span className="material-icons" style={{ fontSize: '20px' }}>cancel</span></button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Select Fees</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setUnpaidFees(prev => prev.map(f => ({ ...f, selected: true })))} style={{ background: 'none', border: 'none', fontSize: '0.6rem', fontWeight: 800, color: '#0284c7', cursor: 'pointer' }}>ALL</button>
                                        <button onClick={() => setUnpaidFees(prev => prev.map(f => ({ ...f, selected: false })))} style={{ background: 'none', border: 'none', fontSize: '0.6rem', fontWeight: 800, color: '#ef4444', cursor: 'pointer' }}>CLEAR</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {unpaidFees.map(fee => (
                                        <div key={fee.id} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid', borderColor: fee.selected ? '#0f172a' : '#e2e8f0', background: fee.selected ? '#fff' : '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => toggleFeeSelection(fee.id)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 16, borderRadius: '4px', border: '2px solid', borderColor: fee.selected ? '#0f172a' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: fee.selected ? '#0f172a' : 'transparent' }}>{fee.selected && <span className="material-icons" style={{ fontSize: '10px', color: '#fff' }}>check</span>}</div><div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{fee.fee_categories?.name} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({fee.month})</span></div></div>
                                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: fee.selected ? '#0f172a' : '#94a3b8' }}>Rs {fee.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {unpaidFees.length === 0 && <div style={{ padding: '24px', textAlign: 'center', border: '1.5px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>No unvouchered fees found.</div>}
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px 0', borderTop: '1px solid #f1f5f9' }}>
                            <div><label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none', fontSize: '0.85rem' }} /></div>
                            <div><label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none', fontSize: '0.85rem' }} /></div>
                            <div><label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ef4444', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Fine (+)</label><input type="number" value={lateFine} onChange={e => setLateFine(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fffcfc', fontWeight: 800, outline: 'none', color: '#ef4444', fontSize: '0.9rem' }} /></div>
                            <div><label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#10b981', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Discount (-)</label><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #dcfce7', background: '#f8fffb', fontWeight: 800, outline: 'none', color: '#10b981', fontSize: '0.9rem' }} /></div>
                        </div>

                        <div style={{ paddingBottom: '16px' }}>
                            <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                                <span className="material-icons" style={{ fontSize: '14px' }}>tag</span> Manual Slip No (Optional)
                            </label>
                            <input 
                                placeholder="e.g. SLIP-2024-001 or manual serial..." 
                                value={manualSlipNo} 
                                onChange={e => setManualSlipNo(e.target.value)} 
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, outline: 'none', fontSize: '0.85rem', background: '#f8fafc' }} 
                            />
                        </div>

                        {status.message && <div style={{ padding: '12px 16px', borderRadius: '12px', background: status.type === 'error' ? '#fef2f2' : '#f0fdf4', color: status.type === 'error' ? '#991b1b' : '#166534', fontWeight: 700, fontSize: '0.8rem', marginBottom: '16px', border: '1px solid', borderColor: status.type === 'error' ? '#fee2e2' : '#dcfce7' }}>{status.message}</div>}

                        <button onClick={handleGenerate} disabled={generating || (targetAudience === 'student' && !selectedStudent)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>{generating ? <span className="material-icons spinning" style={{ fontSize: '20px' }}>refresh</span> : <span className="material-icons" style={{ fontSize: '20px' }}>receipt_long</span>} {generating ? 'Processing...' : 'Generate Voucher'}</button>
                    </div>

                    {/* Summary Matrix */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#0f172a', padding: '24px', borderRadius: '24px', color: '#fff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.05em' }}>Voucher Serial</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{settings?.voucher_prefix}{String(settings?.current_increment || 1).padStart(5, '0')}</div>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700 }}>NEXT</span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.7, fontSize: '0.85rem', fontWeight: 600 }}><span>Base Amount</span><span>Rs {totalSelectedAmount.toLocaleString()}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}><span>Late Fine (+)</span><span>Rs {lateFine.toLocaleString()}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}><span>Discount (-)</span><span>Rs {discount.toLocaleString()}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '1rem', fontWeight: 800 }}>TOTAL</span><span style={{ fontSize: '1.5rem', fontWeight: 800 }}>Rs {netGrandTotal.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Master Voucher Registry */}
                <div style={{ background: '#fff', borderRadius: '28px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Voucher Registry</h3>
                            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>Manage, filter, bulk print, and generate class-wise reports.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button 
                                onClick={() => handleOpenClassWiseReport(registryIssueDate)} 
                                style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)' }}
                            >
                                <span className="material-icons" style={{ fontSize: '16px' }}>assessment</span>
                                Class-Wise Fee Document (PDF)
                            </button>

                            {selectedVoucherIds.size > 0 && (
                                <button onClick={handleBulkPrint} style={{ background: '#0f172a', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none' }}>
                                    <span className="material-icons" style={{ fontSize: '16px' }}>print</span>
                                    Bulk Print ({selectedVoucherIds.size})
                                </button>
                            )}

                            <div style={{ position: 'relative' }}>
                                <span className="material-icons" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 18 }}>search</span>
                                <input placeholder="Search name/slip..." value={registrySearch} onChange={e => setRegistrySearch(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 600, outline: 'none', width: '160px', fontSize: '0.8rem', background: '#f8fafc' }} />
                            </div>

                            <select value={registryIssueDate} onChange={e => setRegistryIssueDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, outline: 'none', fontSize: '0.8rem', background: registryIssueDate !== 'all' ? '#f0f9ff' : '#f8fafc', color: registryIssueDate !== 'all' ? '#0369a1' : '#0f172a' }}>
                                <option value="all">Issue Date: All Dates</option>
                                {availableIssueDates.map(d => (
                                    <option key={d.date} value={d.date}>
                                        {formatDateStr(d.date)} ({d.count} Vouchers)
                                    </option>
                                ))}
                            </select>

                            <select value={registryClass} onChange={e => setRegistryClass(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none', fontSize: '0.8rem', background: '#f8fafc', color: '#0f172a' }}>
                                <option value="all">Class: All</option>
                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select value={registryStatus} onChange={e => setRegistryStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none', fontSize: '0.8rem', background: '#f8fafc', color: '#0f172a' }}>
                                <option value="all">Status: All</option>
                                <option value="active">Active (Before Due)</option>
                                <option value="old_past_due">Old / Past Due</option>
                                <option value="unpaid">Unpaid Only</option>
                                <option value="paid">Paid Only</option>
                            </select>

                            <button onClick={fetchVouchers} disabled={loadingRegistry} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: 36, height: 36, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className={`material-icons ${loadingRegistry ? 'spinning' : ''}`} style={{ fontSize: '20px' }}>refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Date Action Banner when a date is selected */}
                    {registryIssueDate !== 'all' && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ color: '#16a34a', fontSize: '20px' }}>event_available</span>
                                <div>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#15803d' }}>
                                        Filtered by Issue Date: {formatDateStr(registryIssueDate)}
                                    </span>
                                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>
                                        ({filteredVouchers.length} Vouchers Found)
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => setSelectedVoucherIds(new Set(filteredVouchers.map(v => v.id)))}
                                    style={{ padding: '6px 12px', background: '#fff', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    Select All on Date ({filteredVouchers.length})
                                </button>
                                <button 
                                    onClick={() => handleBulkPrintByDate(registryIssueDate)}
                                    style={{ padding: '6px 12px', background: '#15803d', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '14px' }}>print</span>
                                    Bulk Print Date Slips
                                </button>
                                <button 
                                    onClick={() => handleOpenClassWiseReport(registryIssueDate)}
                                    style={{ padding: '6px 12px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '14px' }}>picture_as_pdf</span>
                                    Date Fee PDF Report
                                </button>
                                <button 
                                    onClick={() => setRegistryIssueDate('all')}
                                    style={{ padding: '6px 10px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    Clear Date Filter
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 16px', width: '40px' }}>
                                        <input type="checkbox" onChange={(e) => {
                                            if (e.target.checked) setSelectedVoucherIds(new Set(filteredVouchers.map(v => v.id)));
                                            else setSelectedVoucherIds(new Set());
                                        }} checked={selectedVoucherIds.size === filteredVouchers.length && filteredVouchers.length > 0} />
                                    </th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Voucher No</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Slip No</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student Name</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Father Name</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Issue Date</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Grand Total</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVouchers.map(v => {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const isPastDue = v.due_date && v.due_date < todayStr;
                                    return (
                                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedVoucherIds.has(v.id) ? '#f0f9ff' : 'transparent', transition: '0.2s' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedVoucherIds.has(v.id)} 
                                                onChange={() => {}} // Controlled component requirement
                                                onClick={(e) => toggleVoucherSelection(v.id, filteredVouchers.indexOf(v), e)} 
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{v.voucher_number}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {v.slip_no ? (
                                                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>
                                                    #{v.slip_no}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>---</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{v.students?.full_name || v.studentName || '---'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{v.students?.guardian_name || v.students?.father_name || v.fatherName || '---'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{v.class_name}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{v.issue_date ? (() => {
                                            const d = new Date(v.issue_date);
                                            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                        })() : 'N/A'}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>Rs {(v.total_amount || 0).toLocaleString()}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {v.status === 'paid' ? (
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', textTransform: 'uppercase' }}>PAID</span>
                                            ) : isPastDue ? (
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                    <span className="material-icons" style={{ fontSize: '12px' }}>history</span> OLD / PAST DUE
                                                </span>
                                            ) : (
                                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 800, background: '#fee2e2', color: '#b91c1c', textTransform: 'uppercase' }}>ACTIVE</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => { setViewingVoucher(v); fetchVoucherItems(v); }} style={{ padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }} title="Preview"><span className="material-icons" style={{ fontSize: '18px' }}>visibility</span></button>
                                                <button onClick={() => handleOpenEdit(v)} style={{ padding: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', color: '#0284c7' }} title="Edit Easily"><span className="material-icons" style={{ fontSize: '18px' }}>edit</span></button>
                                                <button onClick={() => handleDeleteVoucher(v.id)} style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }} title="Delete"><span className="material-icons" style={{ fontSize: '18px' }}>delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                                {filteredVouchers.length === 0 && !loadingRegistry && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <span className="material-icons" style={{ fontSize: '48px', opacity: 0.3 }}>receipt_long</span>
                                                No vouchers found matching your criteria.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {loadingRegistry && allVouchers.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <span className="material-icons spinning" style={{ fontSize: '32px' }}>refresh</span>
                                                Syncing Registry Data...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                </div>

            {/* Premium Preview Modal (A5 Landscape Template) */}
            {viewingVoucher && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '1000px', borderRadius: '32px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: 950 }}>Institutional Voucher Print Preview (A5 Layout)</h3>
                            <button onClick={() => setViewingVoucher(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                        </div>

                        <div style={{ padding: '20px', overflowX: 'auto' }}>
                            <div id="voucher-print-container" style={{ display: 'flex', width: '210mm', height: '148mm', margin: '0 auto', background: '#fff', border: '1px solid #ddd', boxSizing: 'border-box', position: 'relative' }}>
                                <VoucherSlip voucher={viewingVoucher} items={voucherItems} copyType="School Copy" student={viewingStudent} />
                                <div style={{ width: '1px', borderLeft: '1.5px dashed #000', height: '100%' }}></div>
                                <VoucherSlip voucher={viewingVoucher} items={voucherItems} copyType="Parent's Copy" student={viewingStudent} />
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', background: '#f9f9f9', display: 'flex', gap: '12px' }}>
                            <button onClick={() => setViewingVoucher(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#eee', fontWeight: 800, cursor: 'pointer' }}>Close Preview</button>
                            <button onClick={() => {
                                const p = window.open('', '', 'height=800,width=1100');
                                p?.document.write('<html><head><title>Print Voucher</title><style>@page { size: A5 landscape; margin: 0; } body { margin: 0; font-family: sans-serif; }</style></head><body>' + document.getElementById('voucher-print-container')?.outerHTML + '</body></html>');
                                p?.document.close(); p?.focus(); setTimeout(() => { p?.print(); p?.close(); }, 500);
                            }} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#1a1c1e', color: '#fff', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span className="material-icons">print</span> Proceed to Final Print (A5)</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Easy Edit Modal */}
            {isEditing && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '800px', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Edit Voucher {editingVoucher?.voucher_number}</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Modify details and linked fees easily.</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#64748b' }}><span className="material-icons">close</span></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Voucher Number</label>
                                    <input value={editForm.voucher_number} onChange={e => setEditForm({ ...editForm, voucher_number: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Issue Date</label>
                                    <input type="date" value={editForm.issue_date} onChange={e => setEditForm({ ...editForm, issue_date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Due Date</label>
                                    <input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Fine (+)</label>
                                    <input type="number" value={editForm.fine} onChange={e => setEditForm({ ...editForm, fine: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2', fontWeight: 800, fontSize: '0.85rem', color: '#ef4444' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Discount (-)</label>
                                    <input type="number" value={editForm.discount} onChange={e => setEditForm({ ...editForm, discount: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #dcfce7', fontWeight: 800, fontSize: '0.85rem', color: '#10b981' }} />
                                </div>
                                </div>

                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Voucher Total Summary</div>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#0f172a' }}>Rs {(editingItems.reduce((a, b) => a + Number(b.amount), 0) + editForm.fine - editForm.discount).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>({editingItems.length} Items Included)</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '24px', textAlign: 'right', fontSize: '0.8rem' }}>
                                    <div>
                                        <div style={{ color: '#64748b', fontWeight: 600 }}>Fees Subtotal</div>
                                        <div style={{ fontWeight: 800 }}>Rs {editingItems.reduce((a, b) => a + Number(b.amount), 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#ef4444', fontWeight: 600 }}>Fine (+)</div>
                                        <div style={{ fontWeight: 800 }}>Rs {editForm.fine.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#10b981', fontWeight: 600 }}>Discount (-)</div>
                                        <div style={{ fontWeight: 800 }}>Rs {editForm.discount.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>Items Included in this Voucher</label>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#10b981', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>ACTIVE SELECTION</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {editingItems.map((item, idx) => (
                                        <div key={item.student_fee_id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', border: '2px solid #0f172a', background: '#fff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span className="material-icons" style={{ color: '#0f172a', fontSize: '20px' }}>check_circle</span>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{item.name || 'Fee Item'}</div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Month: {item.month || 'Current'}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>Rs {Number(item.amount || 0).toLocaleString()}</div>
                                                <button onClick={() => setEditingItems(prev => prev.filter((_, i) => i !== idx))} style={{ padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>UNSELECT</button>
                                            </div>
                                        </div>
                                    ))}
                                    {editingItems.length === 0 && <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>No items selected yet.</div>}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Available to Add (Unpaid Fees)</label>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>PENDING ITEMS</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {availableToEdit
                                        .filter(f => !editingItems.some(i => i.student_fee_id === f.id))
                                        .map(fee => (
                                            <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span className="material-icons" style={{ color: '#cbd5e1', fontSize: '20px' }}>add_circle_outline</span>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>{fee.fee_categories?.name}</div>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>Month: {fee.month}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#94a3b8' }}>Rs {Number(fee.amount || 0).toLocaleString()}</div>
                                                    <button onClick={() => setEditingItems(prev => [...prev, { student_fee_id: fee.id, amount: fee.amount, fee_category_id: fee.fee_category_id, name: fee.fee_categories?.name, month: fee.month }])} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.65rem', cursor: 'pointer' }}>ADD ITEM</button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {availableToEdit.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>No more unpaid fees available.</div>}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #eee', display: 'flex', gap: '16px' }}>
                            <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateVoucher} disabled={generating || editingItems.length === 0} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                {generating ? <span className="material-icons spinning">refresh</span> : <span className="material-icons">save</span>}
                                {generating ? 'Saving Changes...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isBulkPrinting && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '95%', maxWidth: '1100px', borderRadius: '32px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: '#e3f2fd', borderRadius: '12px', color: '#1976d2' }}><span className="material-icons">print</span></div>
                                <h3 style={{ margin: 0, fontWeight: 950 }}>Bulk Printing ({bulkPrintData.length} Vouchers)</h3>
                            </div>
                            <button onClick={() => setIsBulkPrinting(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer' }}><span className="material-icons">close</span></button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto', background: '#e0e0e0' }}>
                            <div id="bulk-print-container" style={{ margin: '0 auto' }}>
                                {bulkPrintData.map((data, idx) => (
                                    <div key={data.voucher.id} style={{ 
                                        width: '210mm', 
                                        height: '148mm', 
                                        margin: '0 auto', 
                                        background: '#fff', 
                                        boxSizing: 'border-box', 
                                        display: 'flex',
                                        position: 'relative',
                                        pageBreakAfter: idx % 2 === 1 ? 'always' : 'auto',
                                        borderBottom: idx % 2 === 0 && idx !== bulkPrintData.length - 1 ? '2px dashed #999' : 'none'
                                    }}>
                                        <VoucherSlip voucher={data.voucher} items={data.items} copyType="School Copy" student={data.student} />
                                        <div style={{ width: '1px', borderLeft: '1.5px dashed #000', height: '100%' }}></div>
                                        <VoucherSlip voucher={data.voucher} items={data.items} copyType="Parent's Copy" student={data.student} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '24px 32px', background: '#f9f9f9', display: 'flex', gap: '12px' }}>
                            <button onClick={() => setIsBulkPrinting(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#eee', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => {
                                const p = window.open('', '', 'height=800,width=1100');
                                p?.document.write('<html><head><title>Bulk Print Vouchers</title><style>@page { size: A4 portrait; margin: 0; } body { margin: 0; padding: 0; } @media print { .no-print { display: none; } }</style></head><body>' + document.getElementById('bulk-print-container')?.innerHTML + '</body></html>');
                                p?.document.close(); p?.focus(); setTimeout(() => { p?.print(); p?.close(); }, 500);
                            }} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: '#1a1c1e', color: '#fff', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <span className="material-icons">print</span> Start Printing (A4 Stacked)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Class-Wise Fee Demand & Statement Document Modal */}
            {showClassWiseReportModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
                    <div style={{ background: '#f8fafc', width: '100%', maxWidth: '1200px', maxHeight: '94vh', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        {/* Modal Header & Toolbar */}
                        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-icons" style={{ fontSize: '22px' }}>assessment</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Class-Wise Fee Statement & Demand Document</h3>
                                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Official consolidated billing sheet grouped by class with subtotals & grand totals.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Issue Date:</label>
                                    <select 
                                        value={reportIssueDate} 
                                        onChange={e => {
                                            setReportIssueDate(e.target.value);
                                            generateClassWiseReportData(e.target.value, reportClassFilter);
                                        }}
                                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.8rem', background: '#fff', color: '#0f172a', outline: 'none' }}
                                    >
                                        <option value="all">All Issued Dates ({allVouchers.length} Vouchers)</option>
                                        {availableIssueDates.map(d => (
                                            <option key={d.date} value={d.date}>
                                                {formatDateStr(d.date)} ({d.count} Vouchers)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Class:</label>
                                    <select 
                                        value={reportClassFilter} 
                                        onChange={e => {
                                            setReportClassFilter(e.target.value);
                                            generateClassWiseReportData(reportIssueDate, e.target.value);
                                        }}
                                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.8rem', background: '#fff', color: '#0f172a', outline: 'none' }}
                                    >
                                        <option value="all">All Classes</option>
                                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <button 
                                    onClick={handlePrintClassWiseReport} 
                                    style={{ padding: '10px 18px', borderRadius: '12px', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '18px' }}>print</span>
                                    Print / Save PDF
                                </button>

                                <button 
                                    onClick={() => setShowClassWiseReportModal(false)} 
                                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Document Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {reportLoading ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                    <span className="material-icons spinning" style={{ fontSize: '36px', color: '#0284c7' }}>refresh</span>
                                    <p style={{ marginTop: '12px', fontWeight: 700, fontSize: '0.9rem' }}>Compiling Class-Wise Statement & Vouchers...</p>
                                </div>
                            ) : classWiseReportData.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                    <span className="material-icons" style={{ fontSize: '48px', color: '#94a3b8' }}>description</span>
                                    <h4 style={{ margin: '12px 0 4px 0', fontWeight: 800, color: '#1e293b' }}>No Vouchers Found</h4>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>No vouchers match the selected issue date ({reportIssueDate === 'all' ? 'All Dates' : formatDateStr(reportIssueDate)}) and class filter.</p>
                                </div>
                            ) : (
                                <div id="class-wise-report-printable" style={{ background: '#fff', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                                    {/* Document Header */}
                                    <div className="report-header" style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                                        <h2 className="school-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
                                            {settings?.school_name || 'WISDOM HOUSE EDUCATION SYSTEM'}
                                        </h2>
                                        <div className="report-subtitle" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', margin: '4px 0 8px 0', textTransform: 'uppercase' }}>
                                            CLASS-WISE FEE DEMAND & ISSUED VOUCHERS STATEMENT
                                        </div>
                                        <div className="meta-bar" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#475569', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <div><strong>Issue Date:</strong> {reportIssueDate === 'all' ? 'All Issued Dates' : formatDateStr(reportIssueDate)}</div>
                                            <div><strong>Class Scope:</strong> {reportClassFilter === 'all' ? 'All Classes' : reportClassFilter}</div>
                                            <div><strong>Total Students:</strong> {reportTotals.totalStudents}</div>
                                            <div><strong>Printed:</strong> {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    {/* Class Sections */}
                                    {classWiseReportData.map((group) => (
                                        <div key={group.className} className="class-section" style={{ marginBottom: '24px' }}>
                                            <div className="class-title-banner" style={{ background: '#0f172a', color: '#fff', padding: '8px 12px', fontSize: '0.85rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '6px 6px 0 0', textTransform: 'uppercase' }}>
                                                <span>CLASS: {group.className}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {group.students.length} {group.students.length === 1 ? 'Student' : 'Students'}
                                                </span>
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '32px', textAlign: 'center' }}>#</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '80px' }}>Roll / ID</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Student Name</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Father Name</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px' }}>Monthly Fee</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Fee Months / Categories</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '120px' }}>Voucher (Slip #)</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px' }}>Total Amount</th>
                                                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px' }}>Due Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.students.map((st: any, sIdx: number) => (
                                                        <tr key={st.voucherId} style={{ background: sIdx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{sIdx + 1}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>{st.studentId}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>{st.studentName}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#334155' }}>{st.fatherName}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>Rs {st.monthlyFee.toLocaleString()}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>{st.monthsSummary}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                                                                {st.voucherNumber}
                                                                {st.slipNo && <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: '#0284c7', fontWeight: 800 }}>#{st.slipNo}</span>}
                                                            </td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>Rs {st.voucherAmount.toLocaleString()}</td>
                                                            <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800 }}>
                                                                {st.dueAmount === 0 ? (
                                                                    <span style={{ color: '#16a34a' }}>PAID</span>
                                                                ) : (
                                                                    <span style={{ color: '#dc2626' }}>Rs {st.dueAmount.toLocaleString()}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Subtotal Row */}
                                                    <tr className="subtotal-row" style={{ background: '#f8fafc', fontWeight: 800, borderTop: '1.5px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
                                                        <td colSpan={4} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#0f172a' }}>
                                                            SUBTOTAL — {group.className} ({group.subtotal.count} Students)
                                                        </td>
                                                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#0f172a' }}>
                                                            Rs {group.subtotal.totalMonthlyFee.toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#64748b' }}>-</td>
                                                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', color: '#64748b' }}>-</td>
                                                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#0f172a' }}>
                                                            Rs {group.subtotal.totalVoucherAmount.toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#dc2626' }}>
                                                            Rs {group.subtotal.totalDue.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}

                                    {/* Grand Total Summary Box */}
                                    <div className="grand-total-card" style={{ marginTop: '24px', border: '2px solid #0f172a', borderRadius: '8px', padding: '14px 18px', background: '#f8fafc' }}>
                                        <div className="grand-total-title" style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>GRAND RECONCILIATION TOTALS (ALL CLASSES)</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Scope: {reportTotals.totalClasses} Classes &bull; {reportTotals.totalStudents} Students</span>
                                        </div>
                                        <div className="grand-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
                                            <div className="grand-box" style={{ padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                                <div className="grand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Classes</div>
                                                <div className="grand-val" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{reportTotals.totalClasses}</div>
                                            </div>
                                            <div className="grand-box" style={{ padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                                <div className="grand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Students</div>
                                                <div className="grand-val" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{reportTotals.totalStudents}</div>
                                            </div>
                                            <div className="grand-box" style={{ padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                                <div className="grand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Grand Monthly Fee</div>
                                                <div className="grand-val" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>Rs {reportTotals.totalMonthlyFee.toLocaleString()}</div>
                                            </div>
                                            <div className="grand-box" style={{ padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                                <div className="grand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Grand Voucher Total</div>
                                                <div className="grand-val" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>Rs {reportTotals.totalVoucherAmount.toLocaleString()}</div>
                                            </div>
                                            <div className="grand-box" style={{ padding: '8px', background: '#fff', border: '2px solid #dc2626', borderRadius: '6px' }}>
                                                <div className="grand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>TOTAL DUE AMOUNT</div>
                                                <div className="grand-val grand-due" style={{ fontSize: '1.1rem', fontWeight: 950, color: '#dc2626', marginTop: '2px' }}>Rs {reportTotals.totalDueAmount.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures */}
                                    <div className="signatures" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px' }}>
                                        <div className="sig-line" style={{ borderTop: '1px solid #0f172a', width: '150px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, paddingTop: '4px' }}>
                                            Prepared By
                                        </div>
                                        <div className="sig-line" style={{ borderTop: '1px solid #0f172a', width: '150px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, paddingTop: '4px' }}>
                                            Accounts Officer
                                        </div>
                                        <div className="sig-line" style={{ borderTop: '1px solid #0f172a', width: '150px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, paddingTop: '4px' }}>
                                            Principal / Incharge
                                        </div>
                                    </div>
                                </div>
                            )}
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
