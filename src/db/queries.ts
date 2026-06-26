import { db } from './index';
import { accounts, categories, transactions, groups, groupMembers, splits } from './schema';
import { eq, desc } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

// --- Accounts ---
export async function getAccounts() {
  return await db.select().from(accounts);
}

export async function addAccount(name: string, type: string, initialBalance: number) {
  const id = Crypto.randomUUID();
  await db.insert(accounts).values({
    id,
    name,
    type,
    balance: initialBalance,
  });
  return id;
}

// --- Categories ---
export async function getCategories() {
  return await db.select().from(categories);
}

export async function addCategory(name: string, icon: string, color: string, isDefault: boolean = false) {
  const id = Crypto.randomUUID();
  await db.insert(categories).values({
    id,
    name,
    icon,
    color,
    isDefault,
  });
  return id;
}

export async function seedDefaultCategories() {
  const existing = await getCategories();
  if (existing.length > 0) return;

  const defaults = [
    { name: 'Food/Drink', icon: 'fast-food', color: '#FF6B6B' },
    { name: 'Shopping', icon: 'cart', color: '#4ECDC4' },
    { name: 'Housing', icon: 'home', color: '#45B7D1' },
    { name: 'Transport', icon: 'car', color: '#96CEB4' },
  ];

  for (const cat of defaults) {
    await addCategory(cat.name, cat.icon, cat.color, true);
  }
}

// --- Transactions ---
export async function getTransactions() {
  return await db.select().from(transactions).orderBy(desc(transactions.date));
}

export async function addTransaction(
  accountId: string,
  categoryId: string,
  amount: number,
  type: string,
  note: string = ''
) {
  const id = Crypto.randomUUID();
  await db.insert(transactions).values({
    id,
    accountId,
    categoryId,
    amount,
    type,
    date: Date.now(),
    note,
  });
  
  // Update account balance
  const accountRows = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (accountRows.length > 0) {
    const acc = accountRows[0];
    const newBalance = type === 'income' ? acc.balance + amount : acc.balance - amount;
    await db.update(accounts).set({ balance: newBalance }).where(eq(accounts.id, accountId));
  }
  
  return id;
}
