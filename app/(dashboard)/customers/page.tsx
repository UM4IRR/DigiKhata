import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Search, Users, PhoneCall, ArrowUpRight, ArrowDownRight, TrendingUp, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/lib/context/LanguageContext'

interface Customer {
  _id: string
  name: string
  phone: string
  address?: string
  balance: number
  notes?: string
  createdAt: string
}

function fmt(amount: number, locale = 'en-PK') {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.abs(amount))
}

export default function CustomersPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  const load = async () => {
    setLoading(true)
    const [custRes, meRes] = await Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ])
    setCustomers(custRes.customers || [])
    if (meRes?.user?.id === 'demo-user-001') setIsDemo(true)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const locale = language === 'ur' ? 'ur-PK' : 'en-PK'
  const totalCredit = customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0)
  const totalDebt = customers.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0)

  return (
    <div className="animate-fade-in">
      {isDemo && (
        <div className="demo-banner">
          <span>⚡</span>
          <span>{t('demo_mode_desc')}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('customers')}</h1>
          <p className="page-subtitle">{customers.length} {t('customers')} · {t('manage_khata')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-customer-btn">
          <Plus size={16} /> {t('add_customer')}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{t('customers')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 22, fontWeight: 800 }}>{customers.length}</span>
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{t('they_owe_you')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={20} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{language === 'ur' ? 'PKR' : 'PKR'} {fmt(totalCredit, locale)}</span>
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{t('you_owe_them')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownRight size={20} style={{ color: 'var(--danger)' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{language === 'ur' ? 'PKR' : 'PKR'} {fmt(totalDebt, locale)}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: language === 'ur' ? 'auto' : 12, right: language === 'ur' ? 12 : 'auto', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: language === 'ur' ? 12 : 36, paddingRight: language === 'ur' ? 36 : 12, background: 'transparent', border: 'none', boxShadow: 'none', padding: '2px 2px 2px 36px' }}
            placeholder={t('search_customer')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="customer-search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              {search ? t('no_customers_found', { defaultValue: 'No customers found' }) : t('no_transactions')}
            </div>
            <div style={{ fontSize: 13 }}>
              {search ? t('try_different_search', { defaultValue: 'Try a different search term' }) : t('add_customer_sub', { defaultValue: 'Add your first customer to start tracking' })}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>
                <th>{t('customers')}</th>
                <th>{t('phone')}</th>
                <th>{t('total_balance')}</th>
                <th>{t('settings')}</th>
                <th>{t('view_all')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/customers/${c._id}`)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        {c.address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-secondary)', flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
                      <PhoneCall size={12} />{c.phone}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 15, color: c.balance > 0 ? 'var(--success)' : c.balance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {c.balance > 0 ? '+' : c.balance < 0 ? '-' : ''}PKR {fmt(c.balance, locale)}
                    </span>
                  </td>
                  <td>
                    {c.balance > 0 ? (
                      <span className="badge badge-income">{t('owes_you')}</span>
                    ) : c.balance < 0 ? (
                      <span className="badge badge-expense">{t('you_owe')}</span>
                    ) : (
                      <span className="badge badge-neutral">{t('settled')}</span>
                    )}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => router.push(`/customers/${c._id}`)}
                    >
                      {t('view_khata')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddCustomerModal
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); load() }}
          isDemo={isDemo}
          t={t}
        />
      )}
    </div>
  )
}

function AddCustomerModal({ onClose, onAdded, isDemo, t }: { onClose: () => void; onAdded: () => void; isDemo: boolean; t: any }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemo) { toast.error(t('demo_mode_desc')); return }
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t('field_required', { defaultValue: 'Name and phone are required' }))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(t('customer_added'))
      onAdded()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('add_customer')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">{t('full_name')} *</label>
            <input className="input" placeholder="Ali Hassan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('phone')} *</label>
            <input className="input" placeholder="03001234567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('address')}</label>
            <input className="input" placeholder="Lahore, Pakistan" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('notes')}</label>
            <input className="input" placeholder={t('notes') + '...'} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={16} />{t('add_customer')}</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
