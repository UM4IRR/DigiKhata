import { NextRequest, NextResponse } from 'next/server'
import { connectDB, isDemoMode } from '@/lib/db'
import { User } from '@/lib/models/User'
import { getAuthUser, authCookieOptions, signToken } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(2).max(100).optional(),
  currency: z.string().min(2).max(5).optional(),
})

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.id === 'demo-user-001' || isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode: connect MongoDB to update profile' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)
    await connectDB()
    const updated = await User.findByIdAndUpdate(user.id, data, { new: true }).lean() as { name: string; email: string; currency: string } | null
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Re-issue token with updated name/currency
    const newUser = { id: user.id, email: user.email, name: updated.name, currency: updated.currency }
    const token = signToken(newUser)
    const res = NextResponse.json({ ok: true, user: newUser })
    res.cookies.set(authCookieOptions(token))
    return res
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
