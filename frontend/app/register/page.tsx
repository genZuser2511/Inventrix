'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '10px 12px',
    border: `1px solid ${hasError ? '#B91C1C' : 'var(--border)'}`,
    borderRadius: '8px', fontSize: '14px', color: 'var(--foreground)',
    backgroundColor: 'var(--surface)', outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <Image src="/image2121.png" alt="Inventrix" width={44} height={44} style={{ borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>Inventrix</span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px 0' }}>Create Account</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 24px 0' }}>Join Inventrix to manage your inventory</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>Full Name</label>
              <input type="text" placeholder="John Doe" {...register('name')} style={inputStyle(!!errors.name)}
                onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                onBlur={(e) => e.target.style.borderColor = errors.name ? '#B91C1C' : 'var(--border)'}
              />
              {errors.name && <p style={{ color: '#B91C1C', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>Email</label>
              <input type="email" placeholder="name@company.com" {...register('email')} style={inputStyle(!!errors.email)}
                onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#B91C1C' : 'var(--border)'}
              />
              {errors.email && <p style={{ color: '#B91C1C', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>Password</label>
              <input type="password" placeholder="••••••••" {...register('password')} style={inputStyle(!!errors.password)}
                onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#B91C1C' : 'var(--border)'}
              />
              {errors.password && <p style={{ color: '#B91C1C', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px', backgroundColor: isSubmitting ? '#9CA3AF' : '#6C63FF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: isSubmitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.15s', marginTop: '4px' }}
              onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget).style.backgroundColor = '#524ACA'; }}
              onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget).style.backgroundColor = '#6C63FF'; }}
            >
              {isSubmitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              Create Account
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
