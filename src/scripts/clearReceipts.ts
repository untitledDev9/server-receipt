import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Receipt } from '../models/Receipt.js';

async function clearReceipts() {
  await connectDB();
  const { deletedCount } = await Receipt.deleteMany({});
  console.log(`[clear-receipts] deleted ${deletedCount} receipt(s)`);
  await mongoose.disconnect();
}

clearReceipts().catch((err) => {
  console.error('[clear-receipts] failed', err);
  process.exit(1);
});
