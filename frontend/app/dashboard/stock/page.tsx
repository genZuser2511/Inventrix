'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StockItem {
  id: string;
  quantity: number;
  product: { name: string; sku: string; reorderPoint: number };
  warehouse: { name: string };
}

export default function StockPage() {
  const token = useAuthStore((s) => s.token);
  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: () => apiFetch('/stock', {}, token),
  });

  const getStockStatus = (qty: number, reorderPoint: number) => {
    if (qty === 0) return { label: 'Out of Stock', className: 'bg-danger-subtle text-danger border-danger/20' };
    if (qty <= reorderPoint) return { label: 'Low Stock', className: 'bg-warning-subtle text-warning border-warning/20' };
    return { label: 'In Stock', className: 'bg-success-subtle text-success border-success/20' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Levels</h1>
        <p className="text-muted text-sm mt-1">Live stock across all warehouses</p>
      </div>
      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted" size={24} /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-elevated-surface">
                  <TableHead className="text-muted">Product</TableHead>
                  <TableHead className="text-muted">SKU</TableHead>
                  <TableHead className="text-muted">Warehouse</TableHead>
                  <TableHead className="text-muted">Quantity</TableHead>
                  <TableHead className="text-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted py-12">
                      No stock records. Confirm a receipt to add stock.
                    </TableCell>
                  </TableRow>
                ) : stock.map((s) => {
                  const status = getStockStatus(s.quantity, s.product.reorderPoint);
                  return (
                    <TableRow key={s.id} className="border-border hover:bg-elevated-surface">
                      <TableCell className="font-medium text-foreground">{s.product.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{s.product.sku}</Badge></TableCell>
                      <TableCell className="text-muted">{s.warehouse.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{s.quantity}</span>
                          {s.quantity <= s.product.reorderPoint && s.quantity > 0 && (
                            <AlertTriangle size={14} className="text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
