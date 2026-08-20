// ─── Shared Data Store for Fee Management ───

export const students = [
    { id: 'STU-84920', name: 'Eleanor Vance',     grade: 'Grade 10-A', gradeShort: '10-A', guardian: 'Mr. Vance',    contact: '0300-1234567', email: 'e.vance@student.edu',    family: 'Vance' },
    { id: 'STU-84921', name: 'Ethan Caldwell',    grade: 'Grade 10-B', gradeShort: '10-B', guardian: 'Mrs. Caldwell', contact: '0301-2345678', email: 'e.caldwell@student.edu', family: 'Caldwell' },
    { id: 'STU-84922', name: 'Sophia Martinez',   grade: 'Grade 7-A',  gradeShort: '7-A',  guardian: 'Mr. Martinez', contact: '0302-3456789', email: 's.martinez@student.edu', family: 'Martinez' },
    { id: 'STU-84923', name: 'Lucas Vance',       grade: 'Grade 9-C',  gradeShort: '9-C',  guardian: 'Dr. Vance',    contact: '0300-1234567', email: 'l.vance@student.edu',   family: 'Vance' },
    { id: 'STU-84924', name: 'Amelia Brooks',     grade: 'Grade 11-A', gradeShort: '11-A', guardian: 'Mrs. Brooks',  contact: '0303-4567890', email: 'a.brooks@student.edu',  family: 'Brooks' },
    { id: 'STU-84925', name: 'Noah Williams',     grade: 'Grade 8-B',  gradeShort: '8-B',  guardian: 'Mr. Williams', contact: '0304-5678901', email: 'n.williams@student.edu', family: 'Williams' },
    { id: 'STU-84926', name: 'Chloe Davis',       grade: 'Grade 12-A', gradeShort: '12-A', guardian: 'Mrs. Davis',   contact: '0305-6789012', email: 'c.davis@student.edu',   family: 'Davis' },
    { id: 'STU-84927', name: 'Marcus Obi',        grade: 'Grade 6-C',  gradeShort: '6-C',  guardian: 'Dr. Obi',      contact: '0306-7890123', email: 'm.obi@student.edu',     family: 'Obi' },
    { id: 'STU-84928', name: 'Aisha Khan',        grade: 'Grade 10-A', gradeShort: '10-A', guardian: 'Mr. Khan',     contact: '0307-8901234', email: 'a.khan@student.edu',    family: 'Khan' },
    { id: 'STU-84929', name: 'Lucas Hernandez',   grade: 'Grade 9-B',  gradeShort: '9-B',  guardian: 'Mrs. Hernandez',contact: '0308-9012345',email: 'l.hernandez@student.edu',family:'Hernandez' },
    { id: 'STU-84930', name: 'Julian Anderson',   grade: 'Grade 9-A',  gradeShort: '9-A',  guardian: 'Mr. Anderson', contact: '0309-0123456', email: 'j.anderson@student.edu', family: 'Anderson' },
    { id: 'STU-84931', name: 'Maya Reed',         grade: 'Grade 8-C',  gradeShort: '8-C',  guardian: 'Mrs. Reed',    contact: '0310-1234567', email: 'm.reed@student.edu',    family: 'Reed' },
    { id: 'STU-84932', name: 'Thomas Wright',     grade: 'Grade 11-B', gradeShort: '11-B', guardian: 'Mr. Wright',   contact: '0311-2345678', email: 't.wright@student.edu',  family: 'Wright' },
];

export const feeRecords = [
    { id: 'FEE-2401', studentId: 'STU-84921', student: 'Ethan Caldwell',  grade: '10-B', family: 'Caldwell',  amount: 8500,  paid: 8500,  due: 0,    status: 'paid',    date: 'Apr 1, 2025',  type: 'Tuition',      method: 'Cash',     receiptNo: 'RCP-001' },
    { id: 'FEE-2402', studentId: 'STU-84922', student: 'Sophia Martinez', grade: '7-A',  family: 'Martinez',  amount: 6500,  paid: 6500,  due: 0,    status: 'paid',    date: 'Mar 28, 2025', type: 'Tuition',      method: 'Bank',     receiptNo: 'RCP-002' },
    { id: 'FEE-2403', studentId: 'STU-84930', student: 'Julian Anderson', grade: '9-A',  family: 'Anderson',  amount: 12000, paid: 0,     due: 12000,status: 'overdue', date: 'Mar 15, 2025', type: 'Tuition',      method: '',         receiptNo: '' },
    { id: 'FEE-2404', studentId: 'STU-84931', student: 'Maya Reed',       grade: '8-C',  family: 'Reed',      amount: 8500,  paid: 0,     due: 8500, status: 'overdue', date: 'Mar 22, 2025', type: 'Lab Fee',       method: '',         receiptNo: '' },
    { id: 'FEE-2405', studentId: 'STU-84932', student: 'Thomas Wright',   grade: '11-B', family: 'Wright',    amount: 21000, paid: 0,     due: 21000,status: 'overdue', date: 'Mar 5, 2025',  type: 'Tuition',      method: '',         receiptNo: '' },
    { id: 'FEE-2406', studentId: 'STU-84925', student: 'Noah Williams',   grade: '8-B',  family: 'Williams',  amount: 9500,  paid: 0,     due: 9500, status: 'pending', date: 'Apr 10, 2025', type: 'Tuition',      method: '',         receiptNo: '' },
    { id: 'FEE-2407', studentId: 'STU-84926', student: 'Chloe Davis',     grade: '12-A', family: 'Davis',     amount: 11000, paid: 11000, due: 0,    status: 'paid',    date: 'Apr 2, 2025',  type: 'Exam Fee',     method: 'Online',   receiptNo: 'RCP-003' },
    { id: 'FEE-2408', studentId: 'STU-84927', student: 'Marcus Obi',      grade: '6-C',  family: 'Obi',       amount: 7500,  paid: 0,     due: 7500, status: 'pending', date: 'Apr 15, 2025', type: 'Tuition',      method: '',         receiptNo: '' },
    { id: 'FEE-2409', studentId: 'STU-84928', student: 'Aisha Khan',      grade: '10-A', family: 'Khan',      amount: 9000,  paid: 4500,  due: 4500, status: 'partial', date: 'Apr 8, 2025',  type: 'Tuition',      method: 'Cash',     receiptNo: 'RCP-004' },
    { id: 'FEE-2410', studentId: 'STU-84929', student: 'Lucas Hernandez', grade: '9-B',  family: 'Hernandez', amount: 10500, paid: 0,     due: 10500,status: 'overdue', date: 'Mar 20, 2025', type: 'Activity Fee', method: '',         receiptNo: '' },
    { id: 'FEE-2411', studentId: 'STU-84920', student: 'Eleanor Vance',   grade: '10-A', family: 'Vance',     amount: 8500,  paid: 8500,  due: 0,    status: 'paid',    date: 'Apr 5, 2025',  type: 'Tuition',      method: 'Card',     receiptNo: 'RCP-005' },
    { id: 'FEE-2412', studentId: 'STU-84923', student: 'Lucas Vance',     grade: '9-C',  family: 'Vance',     amount: 8500,  paid: 8500,  due: 0,    status: 'paid',    date: 'Apr 5, 2025',  type: 'Tuition',      method: 'Card',     receiptNo: 'RCP-006' },
    { id: 'FEE-2413', studentId: 'STU-84924', student: 'Amelia Brooks',   grade: '11-A', family: 'Brooks',    amount: 9500,  paid: 0,     due: 9500, status: 'overdue', date: 'Mar 10, 2025', type: 'Tuition',      method: '',         receiptNo: '' },
];

export const classes = ['6-C', '7-A', '8-B', '8-C', '9-A', '9-B', '9-C', '10-A', '10-B', '11-A', '11-B', '12-A'];
export const feeTypes = ['Tuition', 'Exam Fee', 'Lab Fee', 'Activity Fee', 'Library Fee', 'Sports Fee', 'Transport Fee'];
export const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'Online/JazzCash', 'Cheque'];

export const statusStyle: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    paid:    { bg: '#e8f5e9', color: '#2e7d32', label: 'Paid',    dot: '#43a047' },
    overdue: { bg: '#ffebee', color: '#c62828', label: 'Overdue', dot: '#ef5350' },
    pending: { bg: '#fff8e1', color: '#f57f17', label: 'Pending', dot: '#ffb300' },
    partial: { bg: '#e3f2fd', color: '#1565c0', label: 'Partial', dot: '#42a5f5' },
};
