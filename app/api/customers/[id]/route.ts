import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { Customer } from '@/lib/models/Customer'
import { getAuthUser } from '@/lib/auth'

const DEMO_CUSTOMERS: Record<string, { _id: string; name: string; phone: string; address: string; balance: number; notes: string; createdAt: Date }> = {
  'dc1': { _id: 'dc1', name: 'Ahmed Raza',   phone: '03001234567', address: 'Lahore',      balance: 15000,  notes: 'Regular customer', createdAt: new Date() },
  'dc2': { _id: 'dc2', name: 'Sara Malik',   phone: '03111234567', address: 'Karachi',     balance: -3500,  notes: '',                 createdAt: new Date() },
  'dc3': { _id: 'dc3', name: 'Bilal Khan',   phone: '03211234567', address: 'Islamabad',   balance: 8200,   notes: 'Pays on time',     createdAt: new Date() },
  'dc4': { _id: 'dc4', name: 'Zara Hussain', phone: '03321234567', address: 'Faisalabad',  balance: 0,      notes: '',                 createdAt: new Date() },
  'dc5': { _id: 'dc5', name: 'Usman Sheikh', phone: '03451234567', address: 'Multan',      balance: 22000,  notes: 'VIP customer',     createdAt: new Date() },
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (user.id === 'demo-user-001' || isDemoMode()) {
    const c = DEMO_CUSTOMERS[id]
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ customer: c })
  }

  await connectDB()
  const customer = await Customer.findOne({ _id: id, userId: user.id }).lean()
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ customer })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB' }, { status: 503 })
  }

  const { id } = await params
  const body = await req.json()
  await connectDB()
  const customer = await Customer.findOneAndUpdate({ _id: id, userId: user.id }, body, { new: true })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ customer })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB' }, { status: 503 })
  }

  const { id } = await params
  await connectDB()
  const customer = await Customer.findOneAndDelete({ _id: id, userId: user.id })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
