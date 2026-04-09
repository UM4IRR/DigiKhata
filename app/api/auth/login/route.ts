import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { User } from '@/lib/models/User'
import { comparePassword, signToken, authCookieOptions } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Demo user for testing without DB
const DEMO = { email: 'demo@digitalkhata.pk', password: 'demo1234', name: 'Demo User', id: 'demo-user-001', currency: 'PKR' }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Allow demo login always
    if (data.email === DEMO.email && data.password === DEMO.password) {
      const token = signToken({ id: DEMO.id, email: DEMO.email, name: DEMO.name, currency: DEMO.currency })
      const res = NextResponse.json({ ok: true, user: { name: DEMO.name, email: DEMO.email, currency: DEMO.currency } })
      res.cookies.set(authCookieOptions(token))
      return res
    }

    if (isDemoMode()) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: data.email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await comparePassword(data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, currency: user.currency })
    const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email, currency: user.currency } })
    res.cookies.set(authCookieOptions(token))
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
