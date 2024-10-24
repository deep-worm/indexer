import mongoose, { Document, Schema } from 'mongoose';

interface ITransaction extends Document {
    signature: string;
    from: string;
    to: string;
    amount: string;
    slot: number;
    blockTime: number | null;
    activity_type: string;
}

const TransactionSchema: Schema = new Schema({
    signature: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: String, required: true },
    slot: { type: Number, required: true },
    blockTime: { type: Number, required: false },
    activity_type: { type: String, required: true },
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);