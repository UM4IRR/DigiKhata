'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownRight, Loader2, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface KhataTransaction {
  _id: string
  type: 'credit' | 'payment'
  amount: number
  note: string
  date: string
  createdAt: string
}

interface Customer {
  _id: string
  name: string
  phone: string
  address?: string
  balance: number
  notes?: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.abs(n))
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<KhataTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [txType, setTxType] = useState<'credit' | 'payment'>('credit')
  const [isDemo, setIsDemo] = useState(false)

  const load = async () => {
    setLoading(true)
    const [custRes, txRes, meRes] = await Promise.all([
      fetch(`/api/customers/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/customers/${id}/transactions`).then(r => r.ok ? r.json() : { transactions: [] }),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ])
    if (!custRes) { router.push('/customers'); return }
    setCustomer(custRes.customer)
    setTransactions(txRes.transactions || [])
    if (meRes?.user?.id === 'demo-user-001') setIsDemo(true)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const deleteCustomer = async () => {
    if (!confirm(`Delete ${customer?.name}? This cannot be undone.`)) return
    if (isDemo) { toast.error('Demo mode: connect MongoDB'); return }
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    toast.success('Customer deleted')
    router.push('/customers')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    )
  }

  if (!customer) return null

  const balance = customer.balance
  const credits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const payments = transactions.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="animate-fade-in">
      {isDemo && (
        <div className="demo-banner">
          <span>⚡</span>
          <span><b>Demo Mode</b> — connect MongoDB to manage real khata entries.</span>
        </div>
      )}

      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/customers" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {customer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{customer.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              📞 {customer.phone}
              {customer.address && <> · 📍 {customer.address}</>}
            </div>
          </div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={deleteCustomer}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Balance card */}
      <div className="card" style={{
        padding: 24, marginBottom: 20, textAlign: 'center',
        background: balance > 0
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))'
          : balance < 0
          ? 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(225,29,72,0.04))'
          : 'var(--surface)',
        borderColor: balance > 0 ? 'rgba(16,185,129,0.3)' : balance < 0 ? 'rgba(244,63,94,0.3)' : 'var(--border)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
          {balance > 0 ? 'Owes You' : balance < 0 ? 'You Owe' : 'Settled'}
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', color: balance > 0 ? 'var(--success)' : balance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
          PKR {fmt(balance)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Total Credit</div>
            <div style={{ fontWeight: 700, color: 'var(--success)' }}>PKR {fmt(credits)}</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Total Payments</div>
            <div style={{ fontWeight: 700, color: 'var(--danger)' }}>PKR {fmt(payments)}</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => { setTxType('credit'); setShowModal(true) }}
          id="add-credit-btn"
        >
          <ArrowUpRight size={16} /> Add Credit (Owed)
        </button>
        <button
          className="btn"
          style={{ flex: 1, background: 'linear-gradient(135deg,#059669,#0d9488)', color: 'white' }}
          onClick={() => { setTxType('payment'); setShowModal(true) }}
          id="add-payment-btn"
        >
          <ArrowDownRight size={16} /> Record Payment
        </button>
      </div>

      {/* Transaction history */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-2)' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Transaction History</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{transactions.length} entries</div>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📒</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No khata entries yet</div>
            <div style={{ fontSize: 13 }}>Add a credit or payment to start the ledger</div>
          </div>
        ) : (
          <div>
            {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => (
              <div key={tx._id} className="tx-item" style={{ padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid var(--border-2)' : 'none' }}>
                <div className="tx-icon" style={{
                  background: tx.type === 'credit' ? 'var(--danger-glow)' : 'var(--success-glow)',
                }}>
                  {tx.type === 'credit' ? '📤' : '📥'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {tx.type === 'credit' ? 'Credit Given' : 'Payment Received'}
                    {tx.note && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> — {tx.note}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(tx.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: tx.type === 'credit' ? 'var(--danger)' : 'var(--success)' }}>
                  {tx.type === 'credit' ? '+' : '-'}PKR {fmt(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddKhataModal
          type={txType}
          onClose={() => setShowModal(false)}
          onAdded={() => { setShowModal(false); load() }}
          customerId={id}
          isDemo={isDemo}
        />
      )}
    </div>
  )
}

function AddKhataModal({ type, customerId, onClose, onAdded, isDemo }: {
  type: 'credit' | 'payment'
  customerId: string
  onClose: () => void
  onAdded: () => void
  isDemo: boolean
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemo) { toast.error('Demo mode: connect MongoDB'); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: amt, note, date }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(type === 'credit' ? 'Credit added!' : 'Payment recorded!')
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
          <h2 className="modal-title">
            {type === 'credit' ? '📤 Add Credit' : '📥 Record Payment'}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 18, fontSize: 13,
          background: type === 'credit' ? 'var(--danger-glow)' : 'var(--success-glow)',
          color: type === 'credit' ? 'var(--danger)' : 'var(--success)',
        }}>
          {type === 'credit'
            ? 'Credit means the customer owes you money (you gave goods/services on credit).'
            : 'Payment means the customer paid you (reducing their debt).'}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Amount (PKR) *</label>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group">
            <label className="input-label">Note (optional)</label>
            <input className="input" placeholder="Groceries, bill payment…" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <><Plus size={16} />{type === 'credit' ? 'Add Credit' : 'Record Payment'}</>
              }
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
