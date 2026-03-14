'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Warehouse { id: string; name: string; location?: string; }

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  location: z.string().optional(),
});
type WForm = z.infer<typeof schema>;

export default function WarehousesPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const { data: warehouses = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => apiFetch('/warehouses', {}, token),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WForm>({
    resolver: zodResolver(schema),
  });

  const createM = useMutation({
    mutationFn: (d: WForm) => apiFetch('/warehouses', { method: 'POST', body: JSON.stringify(d) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Warehouse created'); setOpen(false); reset(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: (d: WForm) => apiFetch(`/warehouses/${editing!.id}`, { method: 'PUT', body: JSON.stringify(d) }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Updated'); setOpen(false); setEditing(null); reset(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiFetch(`/warehouses/${id}`, { method: 'DELETE' }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); reset({ name: '', location: '' }); setOpen(true); };
  const openEdit = (w: Warehouse) => { setEditing(w); reset(w); setOpen(true); };
  const onSubmit = (d: WForm) => editing ? updateM.mutate(d) : createM.mutate(d);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted text-sm mt-1">{warehouses.length} locations configured</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary-pressed text-white gap-2">
          <Plus size={16} /> Add Warehouse
        </Button>
      </div>

      <Card className="bg-surface border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted" size={24} /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-elevated-surface">
                  <TableHead className="text-muted">Name</TableHead>
                  <TableHead className="text-muted">Location</TableHead>
                  <TableHead className="text-muted w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted py-12">No warehouses yet. Add your first!</TableCell>
                  </TableRow>
                ) : warehouses.map((w) => (
                  <TableRow key={w.id} className="border-border hover:bg-elevated-surface">
                    <TableCell className="font-medium text-foreground">{w.name}</TableCell>
                    <TableCell className="text-muted">{w.location || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(w)} className="h-7 w-7 p-0 text-muted hover:text-primary"><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteM.mutate(w.id)} className="h-7 w-7 p-0 text-muted hover:text-danger"><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader><DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Main Warehouse" {...register('name')} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input placeholder="Building A, Floor 2" {...register('location')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary-pressed text-white"
                disabled={createM.isPending || updateM.isPending}>
                {(createM.isPending || updateM.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
