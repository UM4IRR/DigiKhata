import mongoose, { Schema, Document } from 'mongoose'

export type TxType = 'credit' | 'payment' | 'income' | 'expense'

export interface ITransaction extends Document {
  userId: string
  customerId?: string
  type: TxType
  amount: number
  note?: string
  description?: string
  category?: string
  paymentMethod?: string
  date: Date
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId:     { type: String, required: true, index: true },
    customerId: { type: String, required: false, index: true },
    type:       { type: String, enum: ['credit', 'payment', 'income', 'expense'], required: true },
    amount:     { type: Number, required: true, min: 0.01 },
    note:       { type: String, default: '' },
    description: { type: String, default: '' },
    category:    { type: String, default: '' },
    paymentMethod: { type: String, default: 'cash' },
    date:       { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema, 'khatatransactions')
