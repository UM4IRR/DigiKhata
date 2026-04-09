'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { User, Globe, Bell, Shield, Loader2 } from 'lucide-react'
import { useTheme } from '@/lib/context/ThemeContext'
import { useTranslation } from 'react-i18next'

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR']

export default function SettingsPage() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<{ name: string; email: string; currency: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', currency: 'PKR' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) {
        setUser(d.user)
        setForm({ name: d.user.name, currency: d.user.currency })
      }
    }).finally(() => setLoading(false))
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('failed_to_save', { defaultValue: 'Failed to save' }))
      setUser(prev => prev ? { ...prev, ...form } : prev)
      toast.success(t('profile_updated', { defaultValue: 'Profile updated!' }))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('failed_to_save', { defaultValue: 'Failed to save' }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('settings')}</h1>
          <p className="page-subtitle">{t('manage_preferences', { defaultValue: 'Manage your account preferences' })}</p>
        </div>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <User size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('profile')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
            {user?.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>

        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">{t('display_name')}</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('email')} ({t('read_only')})</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="input-group">
            <label className="input-label">Currency</label>
            <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {t('save_changes')}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Globe size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('appearance')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{t('dark_mode', { defaultValue: 'Dark Mode' })}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('theme_switch_sub', { defaultValue: 'Switch between light and dark theme' })}</div>
          </div>
          <button
            onClick={toggleTheme}
            className={`theme-toggle${theme === 'dark' ? ' active' : ''}`}
            aria-label="Toggle dark mode"
          >
            <span className="theme-toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('notifications')}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
          🔔 {t('notifications_soon')}
        </div>
      </div>

      {/* Security */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Shield size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('security')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{t('password')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('password_sub')}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => toast.info(t('coming_soon'))}>{t('change')}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{t('two_factor')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('two_factor_sub')}</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => toast.info(t('coming_soon'))}>{t('enable')}</button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
