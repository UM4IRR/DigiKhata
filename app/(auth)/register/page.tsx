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
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/lib/context/LanguageContext'

const schema = z.object({
  name: z.string().min(2, 'name_required'),
  email: z.string().email('email_required'),
  password: z.string().min(6, 'pwd_required'),
  currency: z.string().min(1, 'currency_required'),
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
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()
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
      if (!res.ok) throw new Error(json.error || t('failed_to_save'))
      toast.success(t('account_created'))
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('failed_to_save')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Top Controls */}
      <div style={{ position: 'fixed', top: 20, right: language === 'ur' ? 'auto' : 20, left: language === 'ur' ? 20 : 'auto', zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="btn btn-ghost"
          style={{ fontSize: 13, fontWeight: 700, padding: '0 12px' }}
        >
          {language === 'en' ? 'اردو' : 'English'}
        </button>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
          <div className="logo-icon" style={{ width: 44, height: 44, fontSize: 22 }}>
            <BookOpen size={22} />
          </div>
          <div style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>{t('brand')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('finance_tracker')}</div>
          </div>
        </div>

        <div style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{t('sign_up')}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
            {t('sign_up_sub')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-name" style={{ textAlign: language === 'ur' ? 'right' : 'left', display: 'block' }}>{t('full_name')}</label>
              <input id="reg-name" type="text" className="input" placeholder="Ali Khan" autoComplete="name" {...register('name')} />
              {errors.name && <span className="input-error" style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>{t(errors.name.message as any)}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-email" style={{ textAlign: language === 'ur' ? 'right' : 'left', display: 'block' }}>{t('email_addr')}</label>
              <input id="reg-email" type="email" className="input" placeholder="you@example.com" autoComplete="email" dir="ltr" {...register('email')} />
              {errors.email && <span className="input-error" style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>{t(errors.email.message as any)}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-password" style={{ textAlign: language === 'ur' ? 'right' : 'left', display: 'block' }}>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  style={{ paddingRight: 44 }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  dir="ltr"
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
              {errors.password && <span className="input-error" style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>{t(errors.password.message as any)}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-currency" style={{ textAlign: language === 'ur' ? 'right' : 'left', display: 'block' }}>{t('theme')}</label>
              <select id="reg-currency" className="input" {...register('currency')}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: language === 'ur' ? 'row-reverse' : 'row' }} disabled={loading}>
              {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? t('creating_account') : t('create_account')}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          {t('already_have_account')}{' '}
          <Link href="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{t('sign_in')}</Link>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
