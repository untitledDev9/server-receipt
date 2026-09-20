import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Business } from '../models/Business.js';
import { SupportThread } from '../models/SupportThread.js';

const DEMO_SLUGS = [
  'horizontrust',
  'meridianbank',
  'coralsavings',
  'apexmfb',
  'silverline',
  'novabank',
  'ffff',
];

async function clearDemoBusinesses() {
  await connectDB();

  const demoBusiness = await Business.find({ slug: { $in: DEMO_SLUGS } });
  const demoBusinessIds = demoBusiness.map((b) => b._id);

  const supportDeleted = await SupportThread.deleteMany({
    businessId: { $in: demoBusinessIds },
  });

  const businessDeleted = await Business.deleteMany({
    slug: { $in: DEMO_SLUGS },
  });

  console.log(`[clear-demo] deleted ${businessDeleted.deletedCount} business(es)`);
  console.log(`[clear-demo] deleted ${supportDeleted.deletedCount} support thread(s)`);

  await mongoose.disconnect();
}

clearDemoBusinesses().catch((err) => {
  console.error('[clear-demo] failed', err);
  process.exit(1);
});
