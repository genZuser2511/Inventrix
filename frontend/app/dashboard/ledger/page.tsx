'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';

interface LedgerEntry { id: string; change: number; type: string; timestamp: string; product: { name: string; sku: string }; warehouse: { name: string }; refId?: string; }

const typeColor: Record<string, React.CSSProperties> = {
  RECEIPT:    { backgroundColor: '#F0FDF4', color: '#15803D' },
  DELIVERY:   { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  TRANSFER:   { backgroundColor: '#FFFBEB', color: '#B45309' },
  ADJUSTMENT: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};

export default function LedgerPage() {
  const token = useAuthStore((s) => s.token);
  const { data: entries = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger'], queryFn: () => apiFetch('/ledger', {}, token),
  });

  const S = { card: { backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' as const }, th: { padding: '10px 16px', fontSize: '12px', color: 'var(--muted)', fontWeight: 600, textAlign: 'left' as const, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }, td: { padding: '12px 16px', fontSize: '14px', color: 'var(--foreground)', borderBottom: '1px solid var(--border)' } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Stock Ledger</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>Full audit trail of all stock movements (last 100 entries)</p>
      </div>

      <div style={S.card}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={S.th}>Time</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Product</th>
                <th style={S.th}>Warehouse</th>
                <th style={S.th}>Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#9CA3AF', padding: '48px' }}>
                  No ledger entries yet. Confirm a receipt or apply an adjustment to see entries here.
                </td></tr>
              )}
              {entries.map((e) => (
                <tr key={e.id}>
                  <td style={{ ...S.td, color: '#9CA3AF', fontSize: '13px', whiteSpace: 'nowrap' as const }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td style={S.td}>
                    <span style={{ ...typeColor[e.type], padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{e.type}</span>
                  </td>
                  <td style={S.td}>
                    <span style={{ fontWeight: 600 }}>{e.product.name}</span>
                    <br /><span style={{ fontSize: '12px', color: '#9CA3AF' }}>{e.product.sku}</span>
                  </td>
                  <td style={{ ...S.td, color: 'var(--foreground)' }}>{e.warehouse.name}</td>
                  <td style={S.td}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: e.change >= 0 ? '#15803D' : '#B91C1C' }}>
                      {e.change >= 0 ? '+' : ''}{e.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
