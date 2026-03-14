'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Product { id: string; name: string; sku: string; }
interface Warehouse { id: string; name: string; }
interface Adjustment { id: string; oldQty: number; newQty: number; reason: string; createdAt: string; product: { name: string; sku: string }; warehouse: { name: string }; }

export default function AdjustmentsPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', adjQty: '', reason: '' });

  const { data: adjustments = [], isLoading } = useQuery<Adjustment[]>({
    queryKey: ['adjustments'], queryFn: () => apiFetch('/adjustments', {}, token),
  });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => apiFetch('/products', {}, token) });
  const { data: warehouses = [] } = useQuery<Warehouse[]>({ queryKey: ['warehouses'], queryFn: () => apiFetch('/warehouses', {}, token) });
  const { data: stock = [] } = useQuery<any[]>({ queryKey: ['stock'], queryFn: () => apiFetch('/stock', {}, token) });

  const currentStockLevel = stock.find((s: any) => s.productId === form.productId && s.warehouseId === form.warehouseId)?.quantity || 0;

  const createM = useMutation({
    mutationFn: (d: any) => apiFetch('/adjustments', { method: 'POST', body: JSON.stringify(d) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adjustments', 'stock', 'stats', 'ledger'] }); toast.success('Adjustment applied'); setOpen(false); setForm({ productId: '', warehouseId: '', adjQty: '', reason: '' }); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.warehouseId || form.adjQty === '') return toast.error('All fields required');
    const finalQty = currentStockLevel + +form.adjQty;
    if (finalQty < 0) return toast.error(`Stock cannot be below 0 (calculation: ${finalQty})`);
    createM.mutate({ productId: form.productId, warehouseId: form.warehouseId, newQty: finalQty, reason: form.reason });
  };

  const S = { card: { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' as const }, th: { padding: '10px 16px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textAlign: 'left' as const, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }, td: { padding: '12px 16px', fontSize: '14px', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Adjustments</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>Manually correct stock quantities</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6C63FF', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> New Adjustment
        </button>
      </div>

      <div style={S.card}>
        {isLoading ? <div style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>Product</th><th style={S.th}>Warehouse</th><th style={S.th}>Before</th><th style={S.th}>After</th><th style={S.th}>Change</th><th style={S.th}>Reason</th><th style={S.th}>Date</th></tr></thead>
            <tbody>
              {adjustments.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#9CA3AF', padding: '48px' }}>No adjustments yet.</td></tr>}
              {adjustments.map((a) => {
                const diff = a.newQty - a.oldQty;
                return (
                  <tr key={a.id}>
                    <td style={S.td}><b>{a.product.name}</b><br /><span style={{ fontSize: '12px', color: '#9CA3AF' }}>{a.product.sku}</span></td>
                    <td style={S.td}>{a.warehouse.name}</td>
                    <td style={{ ...S.td, color: 'var(--muted)' }}>{a.oldQty}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{a.newQty}</td>
                    <td style={S.td}><span style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{diff > 0 ? '+' : ''}{diff}</span></td>
                    <td style={{ ...S.td, color: 'var(--muted)' }}>{a.reason || '—'}</td>
                    <td style={{ ...S.td, color: '#9CA3AF', fontSize: '13px' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '28px', width: '460px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>New Adjustment</h2>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Product', field: 'productId', opts: products, optLabel: (p: Product) => `${p.name} (${p.sku})` },
                { label: 'Warehouse', field: 'warehouseId', opts: warehouses, optLabel: (w: Warehouse) => w.name },
              ].map(({ label, field, opts, optLabel }) => (
                <div key={field}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <select value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">Select {label}</option>
                    {(opts as any[]).map((o: any) => <option key={o.id} value={o.id}>{optLabel(o)}</option>)}
                  </select>
                </div>
              ))}
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Quantity to Apply (+ or -)</label>
                <input type="number" value={form.adjQty} onChange={(e) => setForm({ ...form, adjQty: e.target.value })}
                  placeholder="e.g. -5 to deduct, 10 to add" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              
              {form.productId && form.warehouseId && form.adjQty !== '' && (
                 <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '8px', fontSize: '13px', color: 'var(--foreground)' }}>
                   <div>Current Stock: <b>{currentStockLevel}</b></div>
                   <div>Adjustment: <b>{+form.adjQty >= 0 ? '+' : ''}{+form.adjQty}</b></div>
                   <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border)', fontWeight: 700 }}>
                     Final Stock: <span style={{ color: currentStockLevel + +form.adjQty < 0 ? 'var(--danger)' : 'var(--primary)' }}>{currentStockLevel + +form.adjQty}</span>
                   </div>
                 </div>
              )}

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>Reason (optional)</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Physical count anomaly, damages" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: '9px 18px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={createM.isPending} style={{ padding: '9px 18px', backgroundColor: '#6C63FF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {createM.isPending ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
