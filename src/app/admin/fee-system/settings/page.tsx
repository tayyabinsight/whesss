'use client';
import { useState, useEffect } from 'react';
import FeeLayout from '../FeeLayout';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';
const supabase = createClient();

type FeeCategory = {
    id: string;
    name: string;
    default_amount: number;
    is_active: boolean;
};

type FeeSettings = {
    id: string;
    voucher_prefix: string;
    current_increment: number;
    late_fine_amount: number;
    manual_prefix: string;
    manual_current_increment: number;
};

export default function FeeSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Settings state
    const [settings, setSettings] = useState<FeeSettings | null>(null);
    
    // Categories state
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    
    // UI state
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<FeeCategory | null>(null);
    const [catForm, setCatForm] = useState({ name: '', default_amount: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch Settings
        const { data: sData } = await supabase.from('fee_settings').select('*').single();
        if (sData) setSettings(sData);

        // 2. Fetch Categories
        const { data: cData } = await supabase.from('fee_categories').select('*').order('created_at', { ascending: true });
        if (cData) setCategories(cData);
        
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setSaving(true);
        const { error } = await supabase.from('fee_settings').update({
            voucher_prefix: settings.voucher_prefix,
            current_increment: settings.current_increment,
            late_fine_amount: settings.late_fine_amount,
            manual_prefix: settings.manual_prefix,
            manual_current_increment: settings.manual_current_increment
        }).eq('id', settings.id);

        if (error) alert('Error saving settings: ' + error.message);
        else alert('System settings updated successfully.');
        setSaving(false);
    };

    const resyncSerial = async () => {
        if (!settings || !confirm('This will automatically update the next voucher number to avoid duplicates. Continue?')) return;
        setSaving(true);
        try {
            const { data } = await supabase.from('fee_vouchers').select('voucher_number');
            const prefix = settings.voucher_prefix;
            
            // Only look at vouchers that match the regular series prefix
            const relevantVouchers = data?.filter(v => v.voucher_number.startsWith(prefix)) || [];
            
            if (relevantVouchers.length > 0) {
                const nums = relevantVouchers.map(v => {
                    const match = v.voucher_number.match(/\d+$/);
                    return match ? parseInt(match[0]) : 0;
                });
                const max = Math.max(...nums);
                const next = max + 1;
                
                const { error } = await supabase.from('fee_settings').update({ current_increment: next }).eq('id', settings.id);
                if (error) throw error;
                
                setSettings({ ...settings, current_increment: next });
                alert(`Sequence Resynced! Next voucher will be: ${settings.voucher_prefix}${String(next).padStart(5, '0')}`);
            } else {
                alert('No existing vouchers found. Sequence is already at base.');
            }
        } catch (err: any) {
            alert('Resync Failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const seedStandardCategories = async () => {
        if (!confirm('This will populate the system with standard institutional categories (Admission, Annual, Lab, etc.). Continue?')) return;
        setSaving(true);
        const standards = [
            { name: 'Monthly Tuition Fee', default_amount: 3500, is_active: true },
            { name: 'Annual Charges', default_amount: 2500, is_active: true },
            { name: 'Lab Charges', default_amount: 1500, is_active: true },
            { name: 'Admission Fee', default_amount: 5000, is_active: true },
            { name: 'Registration Form', default_amount: 500, is_active: true },
            { name: 'Admission Form', default_amount: 200, is_active: true },
            { name: 'Exam Fee', default_amount: 1000, is_active: true }
        ];

        try {
            const { error } = await supabase.from('fee_categories').insert(standards);
            if (error) throw error;
            alert('Standard categories seeded successfully.');
            await fetchData();
        } catch (err: any) {
            alert('Error seeding: ' + err.message);
        }
        setSaving(false);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name) return;
        setSaving(true);
        
        try {
            if (editingCat) {
                const { error } = await supabase.from('fee_categories').update({
                    name: catForm.name,
                    default_amount: catForm.default_amount
                }).eq('id', editingCat.id);
                if (error) throw error;
                alert('Category updated.');
            } else {
                const { error } = await supabase.from('fee_categories').insert([
                    { name: catForm.name, default_amount: catForm.default_amount, is_active: true }
                ]);
                if (error) throw error;
                alert('New category created.');
            }
            setIsCatModalOpen(false);
            setEditingCat(null);
            setCatForm({ name: '', default_amount: 0 });
            await fetchData();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
        setSaving(false);
    };

    const toggleCatStatus = async (cat: FeeCategory) => {
        try {
            const { error } = await supabase.from('fee_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
            if (error) throw error;
            await fetchData();
        } catch (err: any) {
            alert('Status update failed: ' + err.message);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will hide the category from future assignments. Historical data will remain.')) return;
        const { error } = await supabase.from('fee_categories').delete().eq('id', id);
        if (!error) fetchData();
        else {
            alert('This category is linked to student records and cannot be deleted. Deactivating it instead.');
            await supabase.from('fee_categories').update({ is_active: false }).eq('id', id);
            fetchData();
        }
    };

    if (loading) return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                <span className="material-icons spinning" style={{ fontSize: 40, color: '#0f172a' }}>refresh</span>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>Loading configuration...</p>
            </div>
        </FeeLayout>
    );

    return (
        <FeeLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                            <span className="material-icons" style={{ fontSize: '24px' }}>settings_suggest</span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Institutional Configuration</h2>
                            <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Define master categories, voucher logic, and penalty rules.</p>
                        </div>
                    </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                    {/* General Settings */}
                    {settings && (
                        <div>
                            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ color: '#64748b', fontSize: '20px' }}>receipt_long</span> Voucher Defaults
                                </h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Serial Prefix</label>
                                    <input 
                                        value={settings.voucher_prefix} 
                                        onChange={e => setSettings({...settings, voucher_prefix: e.target.value})}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, outline: 'none', fontSize: '0.9rem' }} 
                                    />
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                        <span className="material-icons" style={{ fontSize: '12px' }}>help_outline</span> Example: {settings.voucher_prefix}00001
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Next Serial</label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <input 
                                                type="number" 
                                                value={settings.current_increment} 
                                                onChange={e => setSettings({...settings, current_increment: parseInt(e.target.value) || 1})}
                                                style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, outline: 'none', fontSize: '0.9rem' }} 
                                            />
                                            <button 
                                                onClick={resyncSerial}
                                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: 44, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Sync sequence"
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>sync</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Fine (Rs)</label>
                                        <input 
                                            type="number" 
                                            value={settings.late_fine_amount} 
                                            onChange={e => setSettings({...settings, late_fine_amount: parseInt(e.target.value) || 0})}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fffcfc', fontWeight: 800, color: '#ef4444', outline: 'none', fontSize: '0.9rem' }} 
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Manual Prefix</label>
                                        <input 
                                            value={settings.manual_prefix || 'MANUAL-'} 
                                            onChange={e => setSettings({...settings, manual_prefix: e.target.value})}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, outline: 'none', fontSize: '0.9rem' }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Manual Next</label>
                                        <input 
                                            type="number"
                                            value={settings.manual_current_increment || 1} 
                                            onChange={e => setSettings({...settings, manual_current_increment: parseInt(e.target.value) || 1})}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, outline: 'none', fontSize: '0.9rem' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '-10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                    <span className="material-icons" style={{ fontSize: '12px' }}>info</span> Example: {settings.manual_prefix}{String(settings.manual_current_increment).padStart(5, '0')}
                                </div>

                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    style={{ marginTop: '4px', padding: '14px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' }}>
                                    {saving ? <span className="material-icons spinning" style={{ fontSize: '18px' }}>refresh</span> : <span className="material-icons" style={{ fontSize: '18px' }}>check_circle</span>}
                                    {saving ? 'Saving...' : 'Save Parameters'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Master Categories */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ color: '#64748b', fontSize: '20px' }}>inventory_2</span> Ledger Categories
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {categories.length === 0 && (
                                    <button onClick={seedStandardCategories} style={{ background: '#fff', border: '1px solid #0f172a', color: '#0f172a', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px' }}>Seed Defaults</button>
                                )}
                                <button 
                                    onClick={() => { setEditingCat(null); setCatForm({ name: '', default_amount: 0 }); setIsCatModalOpen(true); }}
                                    style={{ background: '#0f172a', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
                                    <span className="material-icons" style={{ fontSize: '16px' }}>add</span> New Item
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {categories.map((cat) => (
                                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', background: cat.is_active ? '#fff' : '#f8fafc', transition: '0.2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: cat.name.toLowerCase().includes('monthly') ? '#f0fdf4' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-icons" style={{ fontSize: '18px', color: cat.name.toLowerCase().includes('monthly') ? '#166534' : '#64748b' }}>
                                                {cat.name.toLowerCase().includes('monthly') ? 'event_repeat' : 'payments'}
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cat.is_active ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {cat.name}
                                                {cat.name.toLowerCase().includes('monthly') && <span style={{ fontSize: '0.55rem', background: '#0f172a', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>ANCHOR</span>}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Rate: <span style={{ color: '#0f172a', fontWeight: 700 }}>Rs {cat.default_amount}</span></div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            onClick={() => toggleCatStatus(cat)} 
                                            style={{ border: 'none', background: cat.is_active ? '#f0fdf4' : '#fef2f2', width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.is_active ? '#166534' : '#ef4444' }} 
                                            title={cat.is_active ? 'Active' : 'Disabled'}
                                        >
                                            <span className="material-icons" style={{ fontSize: '20px' }}>{cat.is_active ? 'check_circle' : 'cancel'}</span>
                                        </button>
                                        <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, default_amount: cat.default_amount }); setIsCatModalOpen(true); }} style={{ border: 'none', background: '#f1f5f9', width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                            <span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                        <button onClick={() => deleteCategory(cat.id)} style={{ border: 'none', background: '#fef2f2', width: 34, height: 34, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                            <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <div style={{ padding: '40px 24px', textAlign: 'center', background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: '20px' }}>
                                    <span className="material-icons" style={{ fontSize: '32px', color: '#cbd5e1' }}>folder_off</span>
                                    <p style={{ marginTop: '12px', color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem' }}>No fee categories defined.</p>
                                    <button onClick={seedStandardCategories} style={{ marginTop: '16px', background: '#0f172a', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Populate Defaults</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Category Modal */}
        {isCatModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setIsCatModalOpen(false)}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                                <span className="material-icons">{editingCat ? 'edit' : 'add_task'}</span>
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{editingCat ? 'Modify Category' : 'New Category'}</h4>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Label Name</label>
                                <input 
                                    placeholder="e.g. Monthly Tuition Fee" 
                                    value={catForm.name}
                                    onChange={e => setCatForm({...catForm, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Default Amount (Rs)</label>
                                <input 
                                    type="number"
                                    placeholder="0" 
                                    value={catForm.default_amount}
                                    onChange={e => setCatForm({...catForm, default_amount: parseInt(e.target.value) || 0})}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, outline: 'none', fontSize: '1.1rem', color: '#0f172a', boxSizing: 'border-box' }} 
                                />
                                <p style={{ marginTop: '8px', fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>* Pre-filled during mass assignment.</p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button onClick={() => setIsCatModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer', color: '#64748b', fontSize: '0.85rem' }}>Dismiss</button>
                                <button onClick={handleSaveCategory} style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>Save Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </FeeLayout>
    );
}
