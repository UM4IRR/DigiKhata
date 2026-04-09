import mongoose, { Schema, Document } from 'mongoose'

export interface ICustomer extends Document {
  userId: string
  name: string
  phone: string
  address?: string
  balance: number // positive = customer owes money (credit), negative = overpaid
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    userId:  { type: String, required: true, index: true },
    name:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    balance: { type: Number, default: 0 },
    notes:   { type: String, default: '' },
  },
  { timestamps: true }
)

CustomerSchema.index({ userId: 1, phone: 1 })

export const Customer =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>('Customer', CustomerSchema)
