import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { Transaction } from '@/lib/models/Transaction'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().default(''),
  date: z.string().default(() => new Date().toISOString()),
  paymentMethod: z.string().default('cash'),
})

// Mock data for demo mode
const DEMO_TRANSACTIONS = [
  { _id: 'd1', type: 'income',  amount: 85000,  category: 'Salary',       description: 'Monthly salary',        date: new Date('2026-04-01'), paymentMethod: 'bank' },
  { _id: 'd2', type: 'expense', amount: 22000,  category: 'Rent',         description: 'Office rent',           date: new Date('2026-04-02'), paymentMethod: 'bank' },
  { _id: 'd3', type: 'expense', amount: 4500,   category: 'Food',         description: 'Groceries',             date: new Date('2026-04-03'), paymentMethod: 'cash' },
  { _id: 'd4', type: 'income',  amount: 12000,  category: 'Freelance',    description: 'Web project payment',   date: new Date('2026-04-05'), paymentMethod: 'bank' },
  { _id: 'd5', type: 'expense', amount: 3200,   category: 'Transport',    description: 'Fuel & ride hailing',   date: new Date('2026-04-06'), paymentMethod: 'cash' },
  { _id: 'd6', type: 'expense', amount: 8500,   category: 'Utilities',    description: 'Electricity & internet',date: new Date('2026-03-28'), paymentMethod: 'bank' },
  { _id: 'd7', type: 'income',  amount: 5000,   category: 'Other',        description: 'Sold old laptop',       date: new Date('2026-03-25'), paymentMethod: 'cash' },
  { _id: 'd8', type: 'expense', amount: 6800,   category: 'Shopping',     description: 'Clothing & accessories',date: new Date('2026-03-22'), paymentMethod: 'card' },
  { _id: 'd9', type: 'expense', amount: 2100,   category: 'Food',         description: 'Restaurant',             date: new Date('2026-03-20'), paymentMethod: 'card' },
  { _id:'d10', type: 'income',  amount: 85000,  category: 'Salary',       description: 'Monthly salary',        date: new Date('2026-03-01'), paymentMethod: 'bank' },
]

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ transactions: DEMO_TRANSACTIONS, total: DEMO_TRANSACTIONS.length })
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const type = searchParams.get('type')
  const category = searchParams.get('category')

  const filter: Record<string, unknown> = { userId: user.id }
  if (type) filter.type = type
  if (category) filter.category = category

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ])

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB to add transactions' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    await connectDB()
    
    // Robust date parsing
    let txDate = new Date(data.date)
    if (isNaN(txDate.getTime())) {
      // Try parsing DD/MM/YYYY if standard parsing fails
      const parts = data.date.split('/')
      if (parts.length === 3) {
        txDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      }
      // If still invalid, use current date
      if (isNaN(txDate.getTime())) txDate = new Date()
    }

    const tx = await Transaction.create({ ...data, userId: user.id, date: txDate })
    return NextResponse.json({ transaction: tx }, { status: 201 })
  } catch (err: any) {
    console.error('[API_TRANSACTIONS_POST_ERROR]', err)
    
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    
    // Return the actual error message or a stringified version of the error
    const errorMessage = err.message || (typeof err === 'string' ? err : JSON.stringify(err))
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
