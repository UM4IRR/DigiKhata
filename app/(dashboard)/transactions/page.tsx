'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Filter, Search, ArrowUpRight, ArrowDownRight, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/lib/context/LanguageContext'

interface Tx {
  _id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  paymentMethod: string
}

const CATEGORIES = ['All', 'Salary', 'Freelance', 'Food', 'Rent', 'Transport', 'Utilities', 'Shopping', 'Health', 'Education', 'Entertainment', 'Travel', 'Other']
const PAYMENT_METHODS = ['cash', 'bank', 'card', 'mobile']
const CAT_ICONS: Record<string, string> = {
  Salary: '💼', Freelance: '💻', Food: '🍔', Rent: '🏠', Transport: '🚗',
  Utilities: '⚡', Shopping: '🛍️', Health: '🏥', Education: '📚', Other: '📦',
  Entertainment: '🎬', Travel: '✈️',
}

function fmt(n: number, currency = 'PKR', locale = 'en-PK') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default function TransactionsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('PKR')
  const [isDemo, setIsDemo] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter, setCatFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editTx, setEditTx] = useState<Tx | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const load = async () => {
    setLoading(true)
    const [txData, meData] = await Promise.all([
      fetch('/api/transactions?limit=100').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ])
    setTransactions(txData.transactions || [])
    if (meData?.user?.currency) setCurrency(meData.user.currency)
    if (meData?.user?.id === 'demo-user-001') setIsDemo(true)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const locale = language === 'ur' ? 'ur-PK' : 'en-PK'
  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (catFilter !== 'All' && t.category !== catFilter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const deleteTx = async (id: string) => {
    if (isDemo) { toast.error(t('demo_mode_desc')); return }
    if (!confirm(t('delete_confirm'))) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    toast.success(t('transaction_deleted'))
    setTransactions(prev => prev.filter(t => t._id !== id))
  }

  return (
    <div className="animate-fade-in">
      {isDemo && (
        <div className="demo-banner">
          <span>⚡</span>
          <span>{t('demo_mode_desc')}</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('transactions')}</h1>
          <p className="page-subtitle">{transactions.length} {t('all')} · {fmt(income, currency, locale)} {t('income')} · {fmt(expense, currency, locale)} {t('expense')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true) }} id="add-transaction-btn">
          <Plus size={16} /> {t('add_transaction')}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{t('filtered_income')}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{fmt(income, currency, locale)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{t('filtered_expenses')}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>{fmt(expense, currency, locale)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{t('net')}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: income - expense >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {fmt(income - expense, currency, locale)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: language === 'ur' ? 'auto' : 10, right: language === 'ur' ? 10 : 'auto', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: language === 'ur' ? 12 : 32, paddingRight: language === 'ur' ? 32 : 12, fontSize: 13 }}
              placeholder={t('search_transactions')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="transaction-search"
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'income', 'expense'] as const).map(f => (
              <button
                key={f}
                className={`btn btn-sm ${typeFilter === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTypeFilter(f)}
              >
                {t(f)}
              </button>
            ))}
          </div>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={13} /> {t('filter')}
          </button>
        </div>
        {showFilters && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)', textAlign: language === 'ur' ? 'right' : 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{t('category')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCatFilter(c)}
                  style={{ fontSize: 12 }}
                >
                  {c !== 'All' ? CAT_ICONS[c] : ''} {c === 'All' ? t('all') : c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t('no_transactions')}</div>
            <div style={{ fontSize: 13 }}>{t('add_transactions_chart')}</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>
                <th style={{ textAlign: language === 'ur' ? 'right' : 'left' }}>{t('category')}</th>
                <th>{t('description')}</th>
                <th>{t('date')}</th>
                <th>{t('payment_method')}</th>
                <th style={{ textAlign: language === 'ur' ? 'left' : 'right' }}>{t('amount')}</th>
                <th>{t('settings')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                <tr key={tx._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: language === 'ur' ? 'row-reverse' : 'row' }}>
                      <span className={`badge badge-${tx.type === 'income' ? 'income' : 'expense'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      </span>
                      <span style={{ fontSize: 13 }}>{CAT_ICONS[tx.category] || '📦'} {tx.category}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: language === 'ur' ? 'right' : 'left' }}>
                    {tx.description || '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(tx.date).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: 11 }}>
                      {t(tx.paymentMethod, { defaultValue: tx.paymentMethod })}
                    </span>
                  </td>
                  <td style={{ textAlign: language === 'ur' ? 'left' : 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency, locale)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => { setEditTx(tx); setShowModal(true) }}
                        title={t('search')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => deleteTx(tx._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <TxModal
          tx={editTx}
          currency={currency}
          isDemo={isDemo}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
          t={t}
        />
      )}
    </div>
  )
}

function TxModal({ tx, currency, isDemo, onClose, onSaved, t }: {
  tx: Tx | null
  currency: string
  isDemo: boolean
  onClose: () => void
  onSaved: () => void
  t: any
}) {
  const isEdit = !!tx
  const [form, setForm] = useState({
    type: tx?.type || 'expense',
    amount: tx?.amount?.toString() || '',
    category: tx?.category || 'Food',
    description: tx?.description || '',
    date: tx ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: tx?.paymentMethod || 'cash',
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemo) { toast.error(t('demo_mode_desc')); return }
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) { toast.error(t('field_required')); return }
    setLoading(true)
    try {
      const body = { ...form, amount: amt }
      const url = isEdit ? `/api/transactions/${tx!._id}` : '/api/transactions'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(isEdit ? t('transaction_updated') : t('add_transaction'))
      onSaved()
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
          <h2 className="modal-title">{isEdit ? t('edit_transaction') : t('add_transaction')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['income', 'expense'] as const).map(f => (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${form.type === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => set('type', f)}
                style={{ justifyContent: 'center' }}
              >
                {f === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {t(f)}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">{t('amount')} ({currency}) *</label>
              <input className="input" type="number" min="0.01" step="0.01" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} autoFocus />
            </div>
            <div className="input-group">
              <label className="input-label">{t('category')}</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('description')}</label>
            <input className="input" placeholder={t('description') + '...'} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">{t('date')}</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('payment_method')}</label>
              <select className="input" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{t(m)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={16} />{isEdit ? t('change') : t('add')}</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
