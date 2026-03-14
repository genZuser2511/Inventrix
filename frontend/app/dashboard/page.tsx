'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/lib/api';
import {
  Package, Warehouse, AlertTriangle, XCircle,
  TrendingUp, ArrowDownToLine, Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockChartData = [
  { month: 'Jan', receipts: 42, deliveries: 35 },
  { month: 'Feb', receipts: 58, deliveries: 49 },
  { month: 'Mar', receipts: 71, deliveries: 62 },
  { month: 'Apr', receipts: 45, deliveries: 51 },
  { month: 'May', receipts: 88, deliveries: 73 },
  { month: 'Jun', receipts: 95, deliveries: 84 },
];

function KpiCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <Card className="bg-surface border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted mb-1">{title}</p>
            <p className={`text-3xl font-bold ${color || 'text-foreground'}`}>{value}</p>
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-elevated-surface flex items-center justify-center">
            <Icon size={20} className={color || 'text-muted'} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => apiFetch<any>('/stats', {}, token),
    placeholderData: {
      totalProducts: 0, lowStock: 0, pendingReceipts: 0, outOfStock: 0
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Welcome back, {user?.name || user?.email}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          subtitle="↑ In catalogue"
          icon={Package}
        />
        <KpiCard
          title="Low Stock"
          value={stats?.lowStock ?? 0}
          subtitle="⚠ Needs reorder"
          icon={AlertTriangle}
          color="text-warning"
        />
        <KpiCard
          title="Pending Receipts"
          value={stats?.pendingReceipts ?? 0}
          subtitle="• In transit"
          icon={ArrowDownToLine}
          color="text-info"
        />
        <KpiCard
          title="Out of Stock"
          value={stats?.outOfStock ?? 0}
          subtitle="✕ Immediate action"
          icon={XCircle}
          color="text-danger"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="receipts" stroke="#6C63FF" fillOpacity={1} fill="url(#colorReceipts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receipts vs Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="receipts" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deliveries" fill="var(--secondary-text)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Badges */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Status Reference</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-success-subtle text-success border-success/20">Done</Badge>
          <Badge className="bg-info-subtle text-info border-info/20">Draft</Badge>
          <Badge className="bg-warning-subtle text-warning border-warning/20">Waiting</Badge>
          <Badge className="bg-primary-subtle text-primary border-primary/20">Ready</Badge>
          <Badge className="bg-danger-subtle text-danger border-danger/20">Canceled</Badge>
          <Badge className="bg-elevated-surface text-muted">Internal</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
