import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { User } from '@/lib/models/User'
import { hashPassword, signToken, authCookieOptions } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  currency: z.string().default('PKR'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (isDemoMode()) {
      return NextResponse.json({ error: 'Database not configured. Add MONGODB_URI to .env.local' }, { status: 503 })
    }

    await connectDB()

    const existing = await User.findOne({ email: data.email })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await hashPassword(data.password)
    const user = await User.create({ name: data.name, email: data.email, passwordHash, currency: data.currency })

    const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, currency: user.currency })
    const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } })
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
