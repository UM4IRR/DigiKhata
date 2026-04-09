'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

interface Tx {
  _id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  paymentMethod: string
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16']

function fmt(n: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function groupByMonth(txs: Tx[]) {
  const map: Record<string, { income: number; expense: number }> = {}
  txs.forEach(tx => {
    const d = new Date(tx.date)
    const key = d.toLocaleDateString('en', { year: 'numeric', month: 'short' })
    if (!map[key]) map[key] = { income: 0, expense: 0 }
    if (tx.type === 'income') map[key].income += tx.amount
    else map[key].expense += tx.amount
  })
  return Object.entries(map).map(([month, v]) => ({ month, ...v }))
}

function groupByCategory(txs: Tx[], type: 'income' | 'expense') {
  const map: Record<string, number> = {}
  txs.filter(t => t.type === type).forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))
}

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('PKR')

  useEffect(() => {
    Promise.all([
      fetch('/api/transactions?limit=200').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([txData, meData]) => {
      setTransactions(txData.transactions || [])
      if (meData?.user?.currency) setCurrency(meData.user.currency)
    }).finally(() => setLoading(false))
  }, [])

  const monthlyData = groupByMonth(transactions)
  const expenseByCategory = groupByCategory(transactions, 'expense')
  const incomeByCategory = groupByCategory(transactions, 'income')

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpense / monthlyData.length : 0

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Visual breakdown of your finances</p>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Income', value: fmt(totalIncome, currency), color: 'var(--success)' },
          { label: 'Total Expenses', value: fmt(totalExpense, currency), color: 'var(--danger)' },
          { label: 'Avg Monthly Expense', value: fmt(avgMonthlyExpense, currency), color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Monthly Breakdown</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Income vs expenses per month</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={64}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
              formatter={(v: unknown) => [fmt(Number(v), currency), '']}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <PieCard title="Expense by Category" data={expenseByCategory} currency={currency} />
        <PieCard title="Income by Category" data={incomeByCategory} currency={currency} />
      </div>
    </div>
  )
}

function PieCard({ title, data, currency }: { title: string; data: { name: string; value: number }[]; currency: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{title}</div>
      {data.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                formatter={(v: unknown) => [fmt(Number(v), currency), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {data.slice(0, 5).map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                <span style={{ fontWeight: 600 }}>{Math.round((d.value / total) * 100)}%</span>
                <span style={{ color: 'var(--text-muted)' }}>{fmt(d.value, currency)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
