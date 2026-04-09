'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/lib/context/LanguageContext'

interface Tx {
  _id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string | Date
  paymentMethod: string
}

const CAT_ICONS: Record<string, string> = {
  Salary: '💼', Freelance: '💻', Food: '🍔', Rent: '🏠', Transport: '🚗',
  Utilities: '⚡', Shopping: '🛍️', Health: '🏥', Education: '📚', Other: '📦',
  Entertainment: '🎬', Travel: '✈️',
}

function fmt(amount: number, currency = 'PKR', locale = 'en-PK') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function groupByMonth(transactions: Tx[], locale = 'en') {
  const map: Record<string, { income: number; expense: number }> = {}
  transactions.forEach(tx => {
    const d = new Date(tx.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { income: 0, expense: 0 }
    map[key][tx.type as 'income' | 'expense'] += tx.amount
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => ({
      month: new Date(key + '-01').toLocaleDateString(locale, { month: 'short' }),
      ...val,
      net: val.income - val.expense,
    }))
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('PKR')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([txData, meData]) => {
      setTransactions(txData.transactions || [])
      if (meData?.user?.currency) setCurrency(meData.user.currency)
      if (meData?.user?.id === 'demo-user-001') setIsDemo(true)
    }).finally(() => setLoading(false))
  }, [])

  const locale = language === 'ur' ? 'ur-PK' : 'en-PK'
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  const chartData = groupByMonth(transactions, language)
  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {isDemo && (
        <div className="demo-banner">
          <span>⚡</span>
          <span>{t('demo_mode_desc')}</span>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title={t('total_balance')}
          value={fmt(balance, currency, locale)}
          icon="💰"
          colorClass="stat-indigo"
          sub={`${t('savings_rate')}: ${savingsRate}%`}
        />
        <StatCard
          title={t('total_income')}
          value={fmt(income, currency, locale)}
          icon="📈"
          colorClass="stat-emerald"
          sub={`${transactions.filter(t => t.type === 'income').length} ${t('transactions')}`}
        />
        <StatCard
          title={t('total_expenses')}
          value={fmt(expense, currency, locale)}
          icon="📉"
          colorClass="stat-rose"
          sub={`${transactions.filter(t => t.type === 'expense').length} ${t('transactions')}`}
        />
        <StatCard
          title={t('net_savings')}
          value={fmt(Math.max(0, balance), currency, locale)}
          icon="🎯"
          colorClass="stat-amber"
          sub={balance >= 0 ? t('on_track') : t('over_budget')}
        />
      </div>

      {/* Main content grid */}
      <div className="content-grid">
        {/* Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t('income_vs_expenses')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('overview_6mos')}</div>
            </div>
            <Link href="/transactions" className="btn btn-outline btn-sm">
              {t('view_all')} <ArrowRight size={13} />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [fmt(Number(v) || 0, currency, locale), '']}
                />
                <Area type="monotone" dataKey="income" name={t('income')} stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name={t('expense')} stroke="#f43f5e" strokeWidth={2} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t('recent_transactions')}</div>
            <Link href="/transactions" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              {t('view_all')} <ArrowRight size={13} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📒</div>
              {t('no_transactions')}
            </div>
          ) : recent.map(tx => (
            <div key={tx._id} className="tx-item">
              <div className="tx-icon" style={{
                background: tx.type === 'income' ? 'var(--success-glow)' : 'var(--danger-glow)',
              }}>
                {CAT_ICONS[tx.category] || '💸'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.description || tx.category}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {tx.category} · {new Date(tx.date).toLocaleDateString(language, { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, flexShrink: 0, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency, locale)}
              </div>
            </div>
          ))}

          <Link href="/transactions" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
            <Plus size={14} />
            {t('add_transaction')}
          </Link>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
        <QuickStat title={t('largest_expense')} tx={transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0]} currency={currency} type="expense" locale={locale} />
        <QuickStat title={t('largest_income')} tx={transactions.filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount)[0]} currency={currency} type="income" locale={locale} />
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {t('top_category')}
          </div>
          {(() => {
            const byCategory: Record<string, number> = {}
            transactions.filter(t => t.type === 'expense').forEach(t => {
              byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
            })
            const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a)
            if (!sorted.length) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('no_transactions')}</div>
            const [name, total] = sorted[0]
            const pct = Math.round((total / expense) * 100)
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{CAT_ICONS[name] || '📦'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(total, currency, locale)}</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% {t('total_expenses')}</div>
              </>
            )
          })()}
        </div>
      </div>

      <style>{`@media(max-width:768px){.stats-grid{margin-bottom:16px} div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}

function StatCard({ title, value, icon, colorClass, sub }: { title: string; value: string; icon: string; colorClass: string; sub: string }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{sub}</div>
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 28, opacity: 0.3 }}>{icon}</div>
    </div>
  )
}

function QuickStat({ title, tx, currency, type, locale }: { title: string; tx: Tx | undefined; currency: string; type: 'income' | 'expense'; locale: string }) {
  const { t } = useTranslation()
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {title}
      </div>
      {tx ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {type === 'income'
            ? <ArrowUpRight size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
            : <ArrowDownRight size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
              {fmt(tx.amount, currency, locale)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {tx.category} — {new Date(tx.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wallet size={16} /> {t('no_transactions')}
        </div>
      )}
    </div>
  )
}

function EmptyChart() {
  const { t } = useTranslation()
  return (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-muted)' }}>
      <TrendingUp size={36} style={{ opacity: 0.3 }} />
      <div style={{ fontSize: 14 }}>{t('add_transactions_chart')}</div>
    </div>
  )
}
