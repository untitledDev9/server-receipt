export type UserRole = 'super_admin';

export type BusinessStatus = 'active' | 'suspended';

export type ReceiptStatus = 'completed' | 'void';

export type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'card' | 'mobile_money' | 'other';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
