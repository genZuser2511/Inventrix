'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';
import {
  LayoutDashboard, Package, Warehouse, ArrowDownToLine,
  Truck, ArrowLeftRight, Sliders, BookOpen, LogOut, Menu, X, Moon, Sun
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/warehouses', label: 'Warehouses', icon: Warehouse },
  { href: '/dashboard/receipts', label: 'Receipts', icon: ArrowDownToLine },
  { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/dashboard/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { href: '/dashboard/adjustments', label: 'Adjustments', icon: Sliders },
  { href: '/dashboard/ledger', label: 'Stock Ledger', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={cn(
      'flex flex-col h-full transition-all duration-300',
      collapsed ? 'w-16' : 'w-56'
    )} style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <Image
          src="/image2121.png"
          alt="Inventrix Logo"
          width={36}
          height={36}
          style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
        />
        {!collapsed && (
          <span className="font-bold text-lg text-foreground tracking-tight">Inventrix</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                active
                  ? 'bg-primary-subtle text-primary'
                  : 'text-secondary hover:bg-elevated-surface hover:text-foreground'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="mb-2 px-2">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        )}
        <div className={cn("flex gap-1", collapsed ? "flex-col" : "flex-row")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={cn("justify-start text-muted hover:text-foreground", !collapsed && "flex-1 justify-center")}
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn("justify-start text-muted hover:text-danger", !collapsed && "flex-1 justify-center")}
            title="Logout"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
