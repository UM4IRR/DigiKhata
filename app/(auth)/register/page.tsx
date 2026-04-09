'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTheme } from '@/lib/context/ThemeContext'
import { Eye, EyeOff, BookOpen, Sun, Moon, Loader2 } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.string().min(1, 'Please select a currency'),
})
type FormData = z.infer<typeof schema>

const currencies = [
  { code: 'PKR', label: 'Pakistani Rupee (PKR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
]

export default function RegisterPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'PKR' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      toast.success('Account created! Welcome to Digital Khata 🎉')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-icon"
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div className="logo-icon" style={{ width: 44, height: 44, fontSize: 22 }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>Digital Khata</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Smart Finance Tracker</div>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          Start tracking your finances in seconds
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-name">Full name</label>
              <input id="reg-name" type="text" className="input" placeholder="Ali Khan" autoComplete="name" {...register('name')} />
              {errors.name && <span className="input-error">{errors.name.message}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-email">Email address</label>
              <input id="reg-email" type="email" className="input" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              {errors.email && <span className="input-error">{errors.email.message}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: 44 }}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="input-error">{errors.password.message}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-currency">Currency</label>
              <select id="reg-currency" className="input" {...register('currency')}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
