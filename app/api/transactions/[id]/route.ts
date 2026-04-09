import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { Transaction } from '@/lib/models/Transaction'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  paymentMethod: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB to edit transactions' }, { status: 503 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)
    await connectDB()
    const tx = await Transaction.findOneAndUpdate(
      { _id: id, userId: user.id },
      { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
      { new: true }
    )
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ transaction: tx })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB to delete transactions' }, { status: 503 })
  }

  try {
    const { id } = await params
    await connectDB()
    const tx = await Transaction.findOneAndDelete({ _id: id, userId: user.id })
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
