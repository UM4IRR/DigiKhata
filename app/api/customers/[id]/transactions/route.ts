import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { Transaction } from '@/lib/models/Transaction'
import { Customer } from '@/lib/models/Customer'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const DEMO_TX: Record<string, { _id: string; type: 'credit' | 'payment'; amount: number; note: string; date: Date }[]> = {
  'dc1': [
    { _id: 't1', type: 'credit',  amount: 20000, note: 'Goods supplied',       date: new Date('2026-03-10') },
    { _id: 't2', type: 'payment', amount: 5000,  note: 'Partial payment',      date: new Date('2026-03-20') },
  ],
  'dc2': [
    { _id: 't3', type: 'credit',  amount: 5000,  note: 'Monthly supplies',     date: new Date('2026-04-01') },
    { _id: 't4', type: 'payment', amount: 8500,  note: 'Overpaid',             date: new Date('2026-04-05') },
  ],
  'dc3': [
    { _id: 't5', type: 'credit',  amount: 12000, note: 'Order #103',           date: new Date('2026-03-15') },
    { _id: 't6', type: 'payment', amount: 3800,  note: 'Cash payment',         date: new Date('2026-03-22') },
  ],
  'dc5': [
    { _id: 't7', type: 'credit',  amount: 30000, note: 'Bulk order',           date: new Date('2026-02-01') },
    { _id: 't8', type: 'payment', amount: 8000,  note: 'February payment',     date: new Date('2026-02-15') },
  ],
}

const createSchema = z.object({
  type:   z.enum(['credit', 'payment']),
  amount: z.number().positive(),
  note:   z.string().default(''),
  date:   z.string().default(() => new Date().toISOString()),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ transactions: DEMO_TX[id] || [] })
  }

  await connectDB()
  const txs = await Transaction.find({ userId: user.id, customerId: id }).sort({ date: -1 }).lean()
  return NextResponse.json({ transactions: txs })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB' }, { status: 503 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    await connectDB()

    // Check customer belongs to user
    const customer = await Customer.findOne({ _id: id, userId: user.id })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Create transaction
    const tx = await Transaction.create({
      userId: user.id,
      customerId: id,
      type: data.type,
      amount: data.amount,
      note: data.note,
      date: new Date(data.date),
    })

    // Update customer balance
    const delta = data.type === 'credit' ? data.amount : -data.amount
    customer.balance += delta
    await customer.save()

    return NextResponse.json({ transaction: tx }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
