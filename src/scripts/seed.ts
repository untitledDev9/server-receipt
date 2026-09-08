import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { Business } from '../models/Business.js';
import { User } from '../models/User.js';
import { Receipt } from '../models/Receipt.js';
import { generateTransactionId } from '../services/transactionIdService.js';
import mongoose from 'mongoose';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@receipt.com';
const DEMO_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Password@123';

interface DemoBank {
  name: string;
  slug: string;
  slogan: string;
  currency: string;
  branding: { primaryColor: string; secondaryColor: string; accentColor: string };
  footerText: string;
  narrations: string[];
  amountRange: [number, number];
}

const demoBanks: DemoBank[] = [
  {
    name: 'Horizon Trust Bank',
    slug: 'horizontrust',
    slogan: 'Banking Beyond Boundaries',
    currency: 'USD',
    branding: { primaryColor: '#1e3a5f', secondaryColor: '#0f2942', accentColor: '#3b82f6' },
    footerText: 'This is a system-generated receipt. No signature required.',
    narrations: ['Funds transfer', 'Bill payment - Electricity', 'Airtime purchase'],
    amountRange: [2000, 250000],
  },
  {
    name: 'Meridian Bank',
    slug: 'meridianbank',
    slogan: 'Your Trusted Financial Partner',
    currency: 'USD',
    branding: { primaryColor: '#065f46', secondaryColor: '#064e3b', accentColor: '#10b981' },
    footerText: 'Thank you for banking with Meridian.',
    narrations: ['Savings deposit', 'Loan repayment', 'Salary payment'],
    amountRange: [5000, 500000],
  },
  {
    name: 'Coral Savings Bank',
    slug: 'coralsavings',
    slogan: 'Save Smart, Grow Wealth',
    currency: 'USD',
    branding: { primaryColor: '#c2410c', secondaryColor: '#7c2d12', accentColor: '#fb923c' },
    footerText: 'Your savings, secured. Thank you for choosing us.',
    narrations: ['Account funding', 'Fixed deposit', 'Standing order payment'],
    amountRange: [3000, 300000],
  },
  {
    name: 'Apex Microfinance Bank',
    slug: 'apexmfb',
    slogan: 'Empowering Everyday Dreams',
    currency: 'USD',
    branding: { primaryColor: '#581c87', secondaryColor: '#3b0764', accentColor: '#a855f7' },
    footerText: 'Empowering dreams, one loan at a time.',
    narrations: ['Microloan repayment', 'Group savings contribution', 'Loan disbursement'],
    amountRange: [1000, 150000],
  },
  {
    name: 'Silverline Bank',
    slug: 'silverline',
    slogan: 'Banking Without Borders',
    currency: 'USD',
    branding: { primaryColor: '#334155', secondaryColor: '#1e293b', accentColor: '#64748b' },
    footerText: 'Please retain this receipt for your records.',
    narrations: ['ATM withdrawal', 'POS transaction', 'Bill payment - Cable TV'],
    amountRange: [2000, 200000],
  },
  {
    name: 'Nova Digital Bank',
    slug: 'novabank',
    slogan: 'The Future of Banking',
    currency: 'USD',
    branding: { primaryColor: '#1d4ed8', secondaryColor: '#1e3a8a', accentColor: '#60a5fa' },
    footerText: 'Banking at the speed of now.',
    narrations: ['Instant transfer', 'Bulk transfer', 'Wallet funding'],
    amountRange: [1000, 400000],
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await connectDB();

  await Promise.all([Business.deleteMany({}), User.deleteMany({}), Receipt.deleteMany({})]);

  const superAdminHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const admin = await User.create({
    name: 'Platform Super Admin',
    email: ADMIN_EMAIL,
    passwordHash: superAdminHash,
    role: 'super_admin',
  });

  for (const demo of demoBanks) {
    const bank = await Business.create({
      name: demo.name,
      slug: demo.slug,
      slogan: demo.slogan,
      currency: demo.currency,
      branding: demo.branding,
      address: { street: '12 Market Road', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
      phone: '+234 801 234 5678',
      email: `hello@${demo.slug}.com`,
      status: 'active',
      receiptConfig: {
        footerText: demo.footerText,
        numbering: { prefix: demo.slug.slice(0, 2).toUpperCase(), startingNumber: 1000, nextNumber: 1000, padding: 6 },
      },
      createdBy: admin._id,
    });

    for (let i = 0; i < 5; i++) {
      const amount = randomInt(demo.amountRange[0], demo.amountRange[1]);
      const narration = demo.narrations[randomInt(0, demo.narrations.length - 1)];

      bank.receiptConfig.numbering.nextNumber += 1;
      const receiptNumber = `${bank.receiptConfig.numbering.prefix}-${String(
        bank.receiptConfig.numbering.nextNumber - 1
      ).padStart(bank.receiptConfig.numbering.padding, '0')}`;

      await Receipt.create({
        businessId: bank._id,
        receiptNumber,
        transactionId: generateTransactionId(),
        amount,
        narration,
        customer: { name: 'Walk-in Customer' },
        paymentMethod: ['cash', 'transfer', 'pos'][randomInt(0, 2)] as 'cash' | 'transfer' | 'pos',
        cashierId: admin._id,
      });
    }
    await bank.save();

    console.log(`[seed] created ${demo.name} -> /${demo.slug}`);
  }

  console.log(`\n[seed] done. Admin login: ${ADMIN_EMAIL} / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
