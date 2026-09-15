import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Business } from '../models/Business.js';
import { SupportThread } from '../models/SupportThread.js';

async function listBusinesses() {
  await connectDB();
  const businesses = await Business.find().select('name slug status createdAt');
  const supportThreadCount = await SupportThread.countDocuments();
  console.log(`[list] ${businesses.length} business(es):`);
  for (const b of businesses) {
    console.log(`  - ${b.name} (/${b.slug}) [${b.status}] created ${b.createdAt.toISOString()}`);
  }
  console.log(`[list] ${supportThreadCount} support thread(s) referencing businesses/receipts`);
  await mongoose.disconnect();
}

listBusinesses().catch((err) => {
  console.error('[list] failed', err);
  process.exit(1);
});
