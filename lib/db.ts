import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

interface Cache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = global as any
const cached: Cache = g._mongoose || { conn: null, promise: null }
if (!g._mongoose) g._mongoose = cached

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    console.warn('[DB] MONGODB_URI not configured — running in demo mode')
    return null
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export const isDemoMode = () => !MONGODB_URI
