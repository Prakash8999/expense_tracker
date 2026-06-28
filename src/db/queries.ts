import { db } from './index';
import {
  accounts, categories, transactions, settings,
  budgets, goals, goalContributions,
  plannedPayments, debts, debtPayments,
  shoppingLists, shoppingItems, documents, investments,
} from './schema';
import { eq, desc, and, gte, lte, like, or, asc } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';

const uuid = () => Crypto.randomUUID();
const now = () => Date.now();

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string) {
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════
export async function getAccounts() {
  return db.select().from(accounts).where(eq(accounts.isArchived, false));
}

export async function getAccountById(id: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.id, id));
  return rows[0] || null;
}

export async function addAccount(data: {
  name: string; type: string; balance: number; currency: string;
  icon?: string; color?: string;
}) {
  const id = uuid();
  await db.insert(accounts).values({
    id,
    name: data.name,
    type: data.type,
    balance: data.balance,
    currency: data.currency,
    icon: data.icon || 'wallet',
    color: data.color || '#6366F1',
    createdAt: now(),
    isArchived: false,
  });
  return id;
}

export async function updateAccount(id: string, data: Partial<{
  name: string; type: string; balance: number; icon: string; color: string;
}>) {
  await db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: string) {
  await db.update(accounts).set({ isArchived: true }).where(eq(accounts.id, id));
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════
export async function getCategories(type?: 'expense' | 'income') {
  if (type) {
    return db.select().from(categories)
      .where(eq(categories.type, type))
      .orderBy(asc(categories.sortOrder));
  }
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function addCategory(data: {
  name: string; icon: string; color: string; type: 'expense' | 'income';
  parentId?: string;
}) {
  const id = uuid();
  await db.insert(categories).values({
    id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type,
    parentId: data.parentId || null,
    isDefault: false,
    sortOrder: 999,
  });
  return id;
}

export async function updateCategory(id: string, data: Partial<{
  name: string; icon: string; color: string;
}>) {
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: string) {
  // Only allow deleting non-default categories
  const cat = await db.select().from(categories).where(eq(categories.id, id));
  if (cat.length > 0 && !cat[0].isDefault) {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }
  return false;
}

export async function seedDefaultCategories() {
  const existing = await db.select().from(categories);

  // Self-healing: Remove accidental duplicates caused by React Strict Mode race conditions
  const parentMap = new Map();
  for (const c of existing) {
    if (!c.parentId) {
      if (parentMap.has(c.name)) {
        // It's a duplicate. Delete it and its children.
        await db.delete(categories).where(eq(categories.parentId, c.id));
        await db.delete(categories).where(eq(categories.id, c.id));
      } else {
        parentMap.set(c.name, c.id);
      }
    }
  }

  // Refetch existing after cleanup
  const cleanedExisting = await db.select().from(categories);

  const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  let sortOrder = cleanedExisting.length > 0 ? cleanedExisting.length : 0;

  for (const parent of allDefaults) {
    // Check if this parent category already exists in the DB
    const parentExists = cleanedExisting.find(c => c.name === parent.name && !c.parentId);
    if (parentExists) {
      // Ensure its subcategories exist too
      let subSort = 0;
      for (const sub of parent.subcategories) {
        const subExists = cleanedExisting.find(c => c.name === sub.name && c.parentId === parentExists.id);
        if (!subExists) {
          await db.insert(categories).values({
            id: uuid(), name: sub.name, icon: sub.icon, color: parent.color, type: parent.type,
            parentId: parentExists.id, isDefault: true, sortOrder: subSort++,
          });
        }
      }
      continue;
    }

    const parentId = uuid();
    // Insert Parent
    await db.insert(categories).values({
      id: parentId,
      name: parent.name,
      icon: parent.icon,
      color: parent.color,
      type: parent.type,
      parentId: null,
      isDefault: true,
      sortOrder: sortOrder++,
    });

    // Insert Subcategories
    for (const sub of parent.subcategories) {
      await db.insert(categories).values({
        id: uuid(),
        name: sub.name,
        icon: sub.icon,
        color: parent.color, // Inherit parent color
        type: parent.type,
        parentId: parentId,
        isDefault: true,
        sortOrder: sortOrder++,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════
export async function getTransactions(filters?: {
  type?: string; accountId?: string; startDate?: number; endDate?: number;
  search?: string; limit?: number;
}) {
  let query = db.select().from(transactions).orderBy(desc(transactions.date));

  if (filters) {
    const conditions = [];
    if (filters.type) conditions.push(eq(transactions.type, filters.type));
    if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
    if (filters.startDate) conditions.push(gte(transactions.date, filters.startDate));
    if (filters.endDate) conditions.push(lte(transactions.date, filters.endDate));
    if (filters.search) {
      conditions.push(like(transactions.note, `%${filters.search}%`));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
  }

  return query;
}

export async function addTransaction(data: {
  accountId: string; categoryId?: string; amount: number;
  type: 'expense' | 'income' | 'transfer'; note?: string;
  date?: number; toAccountId?: string;
}) {
  const id = uuid();
  const txnDate = data.date || now();

  await db.insert(transactions).values({
    id,
    accountId: data.accountId,
    toAccountId: data.toAccountId || null,
    categoryId: data.categoryId || null,
    amount: data.amount,
    type: data.type,
    date: txnDate,
    note: data.note || null,
    createdAt: now(),
  });

  // Update account balances
  const sourceAcc = await getAccountById(data.accountId);
  if (sourceAcc) {
    if (data.type === 'expense' || data.type === 'transfer') {
      await db.update(accounts)
        .set({ balance: sourceAcc.balance - data.amount })
        .where(eq(accounts.id, data.accountId));
    } else if (data.type === 'income') {
      await db.update(accounts)
        .set({ balance: sourceAcc.balance + data.amount })
        .where(eq(accounts.id, data.accountId));
    }
  }

  // For transfers, credit the destination account
  if (data.type === 'transfer' && data.toAccountId) {
    const destAcc = await getAccountById(data.toAccountId);
    if (destAcc) {
      await db.update(accounts)
        .set({ balance: destAcc.balance + data.amount })
        .where(eq(accounts.id, data.toAccountId));
    }
  }

  return id;
}

export async function deleteTransaction(id: string) {
  const txn = await db.select().from(transactions).where(eq(transactions.id, id));
  if (txn.length === 0) return;

  const t = txn[0];
  // Reverse the balance change
  const acc = await getAccountById(t.accountId);
  if (acc) {
    if (t.type === 'expense' || t.type === 'transfer') {
      await db.update(accounts).set({ balance: acc.balance + t.amount }).where(eq(accounts.id, t.accountId));
    } else if (t.type === 'income') {
      await db.update(accounts).set({ balance: acc.balance - t.amount }).where(eq(accounts.id, t.accountId));
    }
  }
  if (t.type === 'transfer' && t.toAccountId) {
    const destAcc = await getAccountById(t.toAccountId);
    if (destAcc) {
      await db.update(accounts).set({ balance: destAcc.balance - t.amount }).where(eq(accounts.id, t.toAccountId));
    }
  }

  await db.delete(transactions).where(eq(transactions.id, id));
}

// ═══════════════════════════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════════════════════════
export async function getBudgets() {
  return db.select().from(budgets);
}

export async function addBudget(data: {
  categoryId?: string; amount: number; period: string;
  startDate: number; endDate?: number;
}) {
  const id = uuid();
  await db.insert(budgets).values({
    id,
    categoryId: data.categoryId || null,
    amount: data.amount,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate || null,
    createdAt: now(),
  });
  return id;
}

export async function deleteBudget(id: string) {
  await db.delete(budgets).where(eq(budgets.id, id));
}

// ═══════════════════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════════════════
export async function getGoals() {
  return db.select().from(goals);
}

export async function getGoalById(id: string) {
  const rows = await db.select().from(goals).where(eq(goals.id, id));
  return rows[0] || null;
}

export async function addGoal(data: {
  name: string; targetAmount: number; targetDate?: number; currentAmount?: number;
  icon: string; color: string; note?: string;
}) {
  const id = uuid();
  await db.insert(goals).values({
    id,
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount || 0,
    targetDate: data.targetDate || null,
    icon: data.icon,
    color: data.color,
    note: data.note || null,
    createdAt: now(),
  });

  if (data.currentAmount && data.currentAmount > 0) {
    await db.insert(goalContributions).values({ 
      id: uuid(), goalId: id, amount: data.currentAmount, date: now(), note: 'Starting balance' 
    });
  }

  return id;
}

export async function addGoalContribution(goalId: string, amount: number, note?: string) {
  const id = uuid();
  await db.insert(goalContributions).values({ id, goalId, amount, date: now(), note: note || null });

  // Update goal current amount
  const goalRows = await db.select().from(goals).where(eq(goals.id, goalId));
  if (goalRows.length > 0) {
    await db.update(goals)
      .set({ currentAmount: goalRows[0].currentAmount + amount })
      .where(eq(goals.id, goalId));
  }
  return id;
}

export async function getGoalContributions(goalId: string) {
  return db.select().from(goalContributions)
    .where(eq(goalContributions.goalId, goalId))
    .orderBy(desc(goalContributions.date));
}

export async function deleteGoal(id: string) {
  await db.delete(goalContributions).where(eq(goalContributions.goalId, id));
  await db.delete(goals).where(eq(goals.id, id));
}

// ═══════════════════════════════════════════════════════════════
// PLANNED PAYMENTS
// ═══════════════════════════════════════════════════════════════
export async function getPlannedPayments() {
  return db.select().from(plannedPayments)
    .where(eq(plannedPayments.isActive, true))
    .orderBy(asc(plannedPayments.nextDueDate));
}

export async function addPlannedPayment(data: {
  name: string; amount: number; type: string; categoryId?: string;
  accountId: string; frequency: string; startDate: number;
  reminderDays?: string; note?: string;
}) {
  const id = uuid();
  await db.insert(plannedPayments).values({
    id,
    name: data.name,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId || null,
    accountId: data.accountId,
    frequency: data.frequency,
    startDate: data.startDate,
    nextDueDate: data.startDate,
    reminderDays: data.reminderDays || '[0, 1, 3]',
    isActive: true,
    note: data.note || null,
    createdAt: now(),
  });
  return id;
}

export async function deletePlannedPayment(id: string) {
  await db.update(plannedPayments).set({ isActive: false }).where(eq(plannedPayments.id, id));
}

// ═══════════════════════════════════════════════════════════════
// DEBTS
// ═══════════════════════════════════════════════════════════════
export async function getDebts() {
  return db.select().from(debts)
    .where(eq(debts.isSettled, false))
    .orderBy(desc(debts.date));
}

export async function addDebt(data: {
  personName: string; type: 'borrowed' | 'lent'; totalAmount: number;
  date: number; dueDate?: number; note?: string;
}) {
  const id = uuid();
  await db.insert(debts).values({
    id,
    personName: data.personName,
    type: data.type,
    totalAmount: data.totalAmount,
    remainingAmount: data.totalAmount,
    date: data.date,
    dueDate: data.dueDate || null,
    note: data.note || null,
    isSettled: false,
    createdAt: now(),
  });
  return id;
}

export async function addDebtPayment(debtId: string, amount: number, note?: string) {
  const id = uuid();
  await db.insert(debtPayments).values({ id, debtId, amount, date: now(), note: note || null });

  const debtRows = await db.select().from(debts).where(eq(debts.id, debtId));
  if (debtRows.length > 0) {
    const newRemaining = debtRows[0].remainingAmount - amount;
    await db.update(debts).set({
      remainingAmount: Math.max(0, newRemaining),
      isSettled: newRemaining <= 0,
    }).where(eq(debts.id, debtId));
  }
  return id;
}

export async function getDebtPayments(debtId: string) {
  return db.select().from(debtPayments)
    .where(eq(debtPayments.debtId, debtId))
    .orderBy(desc(debtPayments.date));
}

// ═══════════════════════════════════════════════════════════════
// SHOPPING LISTS
// ═══════════════════════════════════════════════════════════════
export async function getShoppingLists() {
  return db.select().from(shoppingLists).orderBy(desc(shoppingLists.createdAt));
}

export async function addShoppingList(name: string) {
  const id = uuid();
  await db.insert(shoppingLists).values({ id, name, createdAt: now(), isCompleted: false });
  return id;
}

export async function getShoppingItems(listId: string) {
  return db.select().from(shoppingItems)
    .where(eq(shoppingItems.listId, listId))
    .orderBy(asc(shoppingItems.sortOrder));
}

export async function addShoppingItem(listId: string, name: string, expectedPrice?: number) {
  const id = uuid();
  await db.insert(shoppingItems).values({
    id, listId, name, expectedPrice: expectedPrice || null, isChecked: false, sortOrder: 999,
  });
  return id;
}

export async function toggleShoppingItem(id: string, isChecked: boolean) {
  await db.update(shoppingItems).set({ isChecked }).where(eq(shoppingItems.id, id));
}

export async function deleteShoppingList(id: string) {
  await db.delete(shoppingItems).where(eq(shoppingItems.listId, id));
  await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════
export async function getDocuments() {
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function addDocument(data: {
  title: string; type: string; expiryDate?: number;
  barcodeData?: string; imagePath?: string; note?: string;
}) {
  const id = uuid();
  await db.insert(documents).values({
    id,
    title: data.title,
    type: data.type,
    expiryDate: data.expiryDate || null,
    barcodeData: data.barcodeData || null,
    imagePath: data.imagePath || null,
    note: data.note || null,
    createdAt: now(),
  });
  return id;
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}

// ═══════════════════════════════════════════════════════════════
// INVESTMENTS
// ═══════════════════════════════════════════════════════════════
export async function getInvestments() {
  return db.select().from(investments).orderBy(desc(investments.createdAt));
}

export async function addInvestment(data: {
  name: string; type: string; purchasePrice: number;
  currentValue: number; quantity?: number; purchaseDate: number; note?: string;
}) {
  const id = uuid();
  await db.insert(investments).values({
    id,
    name: data.name,
    type: data.type,
    purchasePrice: data.purchasePrice,
    currentValue: data.currentValue,
    quantity: data.quantity || 1,
    purchaseDate: data.purchaseDate,
    note: data.note || null,
    createdAt: now(),
  });
  return id;
}

export async function updateInvestment(id: string, data: Partial<{
  currentValue: number; note: string;
}>) {
  await db.update(investments).set(data).where(eq(investments.id, id));
}

export async function deleteInvestment(id: string) {
  await db.delete(investments).where(eq(investments.id, id));
}
