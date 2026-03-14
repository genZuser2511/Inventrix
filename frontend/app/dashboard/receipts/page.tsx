'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface Product { id: string; name: string; sku: string; }
interface Receipt { id: string; supplier: string; status: string; createdAt: string; lines: { product: { name: string }; quantity: number }[]; }

const statusColor: Record<string, React.CSSProperties> = {
  DRAFT:    { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  DONE:     { backgroundColor: '#F0FDF4', color: '#15803D' },
  CANCELED: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};

export default function ReceiptsPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }]);
  const { register, handleSubmit, reset } = useForm<{ supplier: string }>();

  const { data: receipts = [], isLoading } = useQuery<Receipt[]>({
    queryKey: ['receipts'], queryFn: () => apiFetch('/receipts', {}, token),
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'], queryFn: () => apiFetch('/products', {}, token),
  });

  const createM = useMutation({
    mutationFn: (d: any) => apiFetch('/receipts', { method: 'POST', body: JSON.stringify(d) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receipts'] }); toast.success('Receipt created'); setOpen(false); reset(); setLines([{ productId: '', quantity: 1 }]); },
    onError: (e: any) => toast.error(e.message),
  });

  const confirmM = useMutation({
    mutationFn: (id: string) => apiFetch(`/receipts/${id}/confirm`, { method: 'PUT' }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receipts', 'stock', 'stats'] }); toast.success('Receipt confirmed — stock updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const addLine = () => setLines([...lines, { productId: '', quantity: 1 }]);
  const updateLine = (i: number, field: string, val: any) => {
    const next = [...lines]; next[i] = { ...next[i], [field]: val }; setLines(next);
  };

  const onSubmit = (d: { supplier: string }) => {
    if (lines.some(l => !l.productId)) return toast.error('Select a product for each line');
    createM.mutate({ ...d, lines });
  };

  const S = { card: { backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' as const }, th: { padding: '10px 16px', fontSize: '12px', color: '#6B7280', fontWeight: 600, textAlign: 'left' as const, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }, td: { padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #F3F4F6' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Receipts</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0' }}>Goods received from suppliers</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6C63FF', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> New Receipt
        </button>
      </div>

      <div style={S.card}>
        {isLoading ? <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={S.th}>Supplier</th><th style={S.th}>Lines</th><th style={S.th}>Status</th><th style={S.th}>Date</th><th style={S.th}>Actions</th></tr></thead>
            <tbody>
              {receipts.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#9CA3AF', padding: '48px' }}>No receipts yet. Create one!</td></tr>}
              {receipts.map((r) => (
                <>
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <td style={S.td}><b>{r.supplier || '—'}</b></td>
                    <td style={S.td}>{r.lines.length} item(s)</td>
                    <td style={S.td}><span style={{ ...statusColor[r.status], padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{r.status}</span></td>
                    <td style={{ ...S.td, color: '#6B7280' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={S.td}>
                      {r.status === 'DRAFT' && (
                        <button onClick={(e) => { e.stopPropagation(); confirmM.mutate(r.id); }} disabled={confirmM.isPending}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          <CheckCircle size={13} /> Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-exp`}><td colSpan={5} style={{ padding: 0, background: '#F9FAFB' }}>
                      <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {r.lines.map((l, i) => (
                          <div key={i} style={{ fontSize: '13px', color: '#374151' }}>• {l.product.name} — <b>{l.quantity}</b> units</div>
                        ))}
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
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#111827' }}>New Receipt</h2>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Supplier</label>
                <input {...register('supplier')} placeholder="Supplier name" style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Lines</label>
                  <button type="button" onClick={addLine} style={{ fontSize: '12px', color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Line</button>
                </div>
                {lines.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                    <select value={l.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)}
                      style={{ padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, 'quantity', +e.target.value)}
                      style={{ width: '80px', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: '9px 18px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={createM.isPending} style={{ padding: '9px 18px', backgroundColor: '#6C63FF', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {createM.isPending ? 'Creating...' : 'Create Receipt'}
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
