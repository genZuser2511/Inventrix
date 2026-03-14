'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  unitOfMeasure: string;
  reorderPoint: number;
}

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  unitOfMeasure: z.string().min(1, 'Unit is required'),
  reorderPoint: z.coerce.number().min(0),
  totalStock: z.coerce.number().min(0).optional(),
});
type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiFetch('/products', {}, token),
  });

  const { data: stock = [] } = useQuery<any[]>({
    queryKey: ['stock'],
    queryFn: () => apiFetch('/stock', {}, token),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', unitOfMeasure: 'units', reorderPoint: 0, totalStock: 0 }
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', 'stock', 'stats', 'ledger'] }); toast.success('Product created'); setOpen(false); reset(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      apiFetch(`/products/${editing!.id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', 'stock', 'stats', 'ledger'] }); toast.success('Product updated'); setOpen(false); setEditing(null); reset(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/products/${id}`, { method: 'DELETE' }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', 'stock', 'stats', 'ledger'] }); toast.success('Product deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); reset({ name: '', sku: '', unitOfMeasure: 'units', reorderPoint: 0, totalStock: 0 }); setOpen(true); };
  const openEdit = (p: Product) => { 
    const currentStock = stock.filter((s: any) => s.productId === p.id).reduce((acc: number, curr: any) => acc + curr.quantity, 0);
    setEditing(p); 
    reset({ ...p, totalStock: currentStock }); 
    setOpen(true); 
  };
  const onSubmit = (data: ProductForm) => editing ? updateMutation.mutate(data) : createMutation.mutate(data);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted text-sm mt-1">{products.length} products in catalogue</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-pressed text-white gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-elevated-surface">
                  <TableHead className="text-muted">Name</TableHead>
                  <TableHead className="text-muted">SKU</TableHead>
                  <TableHead className="text-muted">Unit</TableHead>
                  <TableHead className="text-muted">Total Stock</TableHead>
                  <TableHead className="text-muted">Reorder Point</TableHead>
                  <TableHead className="text-muted w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted py-12">
                      No products found. Add your first product!
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="border-border hover:bg-elevated-surface">
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{p.sku}</Badge>
                      </TableCell>
                      <TableCell className="text-muted">{p.unitOfMeasure}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">
                          {stock.filter((s: any) => s.productId === p.id).reduce((acc: number, curr: any) => acc + curr.quantity, 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={p.reorderPoint > 0 ? 'text-warning font-semibold' : 'text-muted'}>
                          {p.reorderPoint}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}
                            className="h-7 w-7 p-0 text-muted hover:text-primary">
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm"
                            onClick={() => deleteMutation.mutate(p.id)}
                            className="h-7 w-7 p-0 text-muted hover:text-danger">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Product name" {...register('name')} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input placeholder="PRD-001" {...register('sku')} />
              {errors.sku && <p className="text-xs text-danger">{errors.sku.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Input placeholder="units" {...register('unitOfMeasure')} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Point</Label>
                <Input type="number" placeholder="0" {...register('reorderPoint')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Stock <span className="text-muted font-normal text-xs ml-1">(Quick Adjust)</span></Label>
              <Input type="number" placeholder="0" {...register('totalStock')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-pressed text-white"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
