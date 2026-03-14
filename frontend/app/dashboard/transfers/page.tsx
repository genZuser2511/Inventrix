'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Product { id: string; name: string; sku: string; }
interface Warehouse { id: string; name: string; }
interface Transfer { id: string; status: string; createdAt: string; fromWarehouse: { name: string }; toWarehouse: { name: string }; lines: { product: { name: string }; quantity: number }[]; }

const statusColor: Record<string, React.CSSProperties> = {
  DRAFT:      { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  IN_TRANSIT: { backgroundColor: '#FFFBEB', color: '#B45309' },
  DONE:       { backgroundColor: '#F0FDF4', color: '#15803D' },
  CANCELED:   { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};

export default function TransfersPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ fromWarehouseId: '', toWarehouseId: '' });
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }]);

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers'], queryFn: () => apiFetch('/transfers', {}, token),
  });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => apiFetch('/products', {}, token) });
  const { data: warehouses = [] } = useQuery<Warehouse[]>({ queryKey: ['warehouses'], queryFn: () => apiFetch('/warehouses', {}, token) });

  const createM = useMutation({
    mutationFn: (d: any) => apiFetch('/transfers', { method: 'POST', body: JSON.stringify(d) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transfers'] }); toast.success('Transfer created'); setOpen(false); setForm({ fromWarehouseId: '', toWarehouseId: '' }); setLines([{ productId: '', quantity: 1 }]); },
    onError: (e: any) => toast.error(e.message),
  });

  const confirmM = useMutation({
    mutationFn: (id: string) => apiFetch(`/transfers/${id}/confirm`, { method: 'PUT' }, token),
    onSuccess: () => { 
      ['transfers', 'stock', 'stats', 'ledger'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      toast.success('Transfer confirmed and received'); 
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addLine = () => setLines([...lines, { productId: '', quantity: 1 }]);
  const updateLine = (i: number, field: string, val: any) => {
    const next = [...lines]; next[i] = { ...next[i], [field]: val }; setLines(next);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromWarehouseId || !form.toWarehouseId) return toast.error('Select source and destination');
    if (form.fromWarehouseId === form.toWarehouseId) return toast.error('Source and destination must differ');
    if (lines.some(l => !l.productId)) return toast.error('Select a product for each line');
    createM.mutate({ ...form, lines });
  };

  const S = { card: { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' as const }, th: { padding: '10px 16px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textAlign: 'left' as const, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }, td: { padding: '12px 16px', fontSize: '14px', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }, select: { padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', width: '100%' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Transfers</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>Move stock between warehouses</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6C63FF', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> New Transfer
        </button>
      </div>

      <div style={S.card}>
        {isLoading ? <div style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>From</th><th style={S.th}>To</th><th style={S.th}>Lines</th><th style={S.th}>Status</th><th style={S.th}>Date</th><th style={S.th}>Actions</th></tr></thead>
            <tbody>
              {transfers.length === 0 && <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#9CA3AF', padding: '48px' }}>No transfers yet.</td></tr>}
              {transfers.map((t) => (
                <>
                  <tr key={t.id} onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>
                    <td style={S.td}><b>{t.fromWarehouse.name}</b></td>
                    <td style={S.td}>{t.toWarehouse.name}</td>
                    <td style={S.td}>{t.lines.length} item(s)</td>
                    <td style={S.td}><span style={{ ...statusColor[t.status], padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{t.status}</span></td>
                    <td style={{ ...S.td, color: 'var(--muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={S.td}>
                      {t.status === 'DRAFT' && (
                        <button onClick={(e) => { e.stopPropagation(); confirmM.mutate(t.id); }} disabled={confirmM.isPending}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          <CheckCircle size={13} /> Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === t.id && (
                    <tr key={`${t.id}-exp`}><td colSpan={6} style={{ padding: 0, background: 'var(--surface)' }}>
                      <div style={{ padding: '12px 24px' }}>
                        {t.lines.map((l, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--foreground)' }}>• {l.product.name} — <b>{l.quantity}</b> units</div>)}
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '28px', width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>New Transfer</h2>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>From Warehouse</label>
                  <select value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })} style={S.select}>
                    <option value="">Select</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: '6px' }}>To Warehouse</label>
                  <select value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })} style={S.select}>
                    <option value="">Select</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Lines</label>
                  <button type="button" onClick={addLine} style={{ fontSize: '12px', color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Line</button>
                </div>
                {lines.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                    <select value={l.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, 'quantity', +e.target.value)} style={{ width: '80px', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: '9px 18px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--card)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={createM.isPending} style={{ padding: '9px 18px', backgroundColor: '#6C63FF', color: 'var(--card)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {createM.isPending ? 'Creating...' : 'Create Transfer'}
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
