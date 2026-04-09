import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { Customer } from '@/lib/models/Customer'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const DEMO_CUSTOMERS = [
  { _id: 'dc1', name: 'Ahmed Raza',    phone: '03001234567', address: 'Lahore', balance: 15000,  notes: 'Regular customer', createdAt: new Date() },
  { _id: 'dc2', name: 'Sara Malik',    phone: '03111234567', address: 'Karachi', balance: -3500,  notes: '',                createdAt: new Date() },
  { _id: 'dc3', name: 'Bilal Khan',    phone: '03211234567', address: 'Islamabad', balance: 8200, notes: 'Pays on time',   createdAt: new Date() },
  { _id: 'dc4', name: 'Zara Hussain',  phone: '03321234567', address: 'Faisalabad', balance: 0,  notes: '',                createdAt: new Date() },
  { _id: 'dc5', name: 'Usman Sheikh',  phone: '03451234567', address: 'Multan', balance: 22000,  notes: 'VIP customer',   createdAt: new Date() },
]

const createSchema = z.object({
  name:    z.string().min(1, 'Name is required').max(100),
  phone:   z.string().min(1, 'Phone is required').max(20),
  address: z.string().default(''),
  notes:   z.string().default(''),
})

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ customers: DEMO_CUSTOMERS, total: DEMO_CUSTOMERS.length })
  }

  await connectDB()
  const customers = await Customer.find({ userId: user.id }).sort({ name: 1 }).lean()
  return NextResponse.json({ customers, total: customers.length })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB to add customers' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    await connectDB()
    const customer = await Customer.create({ ...data, userId: user.id })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
