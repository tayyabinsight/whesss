'use client';
import React from 'react';

export const VoucherSlip = ({ voucher, items, copyType, student }: { voucher: any, items: any[], copyType: string, student?: any }) => {
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div style={{ display: 'flex', gap: '4px' }}><span style={{ fontWeight: 850 }}>Voucher No:</span> <span style={{ fontWeight: 950, borderBottom: '1.2px solid #000' }}>{voucher?.voucher_number || 'N/A'}</span></div>
                <div style={{ textAlign: 'right' }}><span style={{ fontWeight: 850 }}>Issue Date:</span> {formatDate(voucher?.issue_date)}</div>
            </div>

            {/* Student Info Box - EXACT PRESERVED DISPLAY */}
            <div style={{ border: '1.5px solid #000', padding: '12px', borderRadius: '4px', marginBottom: '10px', fontSize: '0.85rem', position: 'relative' }}>
                {isDefaulter && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#d32f2f', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: 950, fontSize: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #fff' }}>
                        Defaulter
                    </div>
                )}
                <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 800, width: '120px', flexShrink: 0, color: '#333' }}>Student Name:</span> 
                    <span style={{ fontWeight: 950, fontSize: '1.1rem', textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #eee', flex: 1, paddingRight: isDefaulter ? '100px' : '0' }}>{studentData.full_name || '---'}</span>
                </div>
                <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 800, width: '120px', flexShrink: 0, color: '#333' }}>Father Name:</span> 
                    <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#000', borderBottom: '1px solid #eee', flex: 1 }}>{studentData.guardian_name || '---'}</span>
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

export default VoucherSlip;
