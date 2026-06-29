import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── User Settings ───────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// ─── Financial Accounts ──────────────────────────────────────
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'bank' | 'cash' | 'credit' | 'savings' | 'ewallet'
  balance: real('balance').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  icon: text('icon').notNull().default('wallet'),
  color: text('color').notNull().default('#6366F1'),
  createdAt: integer('created_at').notNull(),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  isHidden: integer('is_hidden', { mode: 'boolean' }).default(false), // Premium feature: Hidden Mode
});

// ─── Categories ──────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type').notNull().default('expense'), // 'expense' | 'income'
  parentId: text('parent_id'), // for sub-categories
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
});

// ─── Transactions ────────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  toAccountId: text('to_account_id'), // for transfers
  categoryId: text('category_id'),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income' | 'transfer'
  date: integer('date').notNull(),
  note: text('note'),
  groupId: text('group_id'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringId: text('recurring_id'), // links to planned_payments
  status: text('status').default('success'), // 'success' | 'failed' | 'pending'
  createdAt: integer('created_at').notNull(),
});

// ─── Budgets ─────────────────────────────────────────────────
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  categoryId: text('category_id'), // null = total budget
  amount: real('amount').notNull(),
  period: text('period').notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time'
  startDate: integer('start_date').notNull(),
  endDate: integer('end_date'), // for one-time budgets
  createdAt: integer('created_at').notNull(),
});

// ─── Savings Goals ───────────────────────────────────────────
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  targetDate: integer('target_date'),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
});

// ─── Goal Contributions ──────────────────────────────────────
export const goalContributions = sqliteTable('goal_contributions', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').notNull(),
  amount: real('amount').notNull(),
  date: integer('date').notNull(),
  note: text('note'),
});

// ─── Planned / Recurring Payments ────────────────────────────
export const plannedPayments = sqliteTable('planned_payments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // 'expense' | 'income'
  categoryId: text('category_id'),
  accountId: text('account_id').notNull(),
  frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: integer('start_date').notNull(),
  nextDueDate: integer('next_due_date').notNull(),
  reminderDays: text('reminder_days'), // JSON array like "[0, 1, 3]" (0=due date, 1=1 day before, etc.)
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
});

// ─── Debts ───────────────────────────────────────────────────
export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  personName: text('person_name').notNull(),
  type: text('type').notNull(), // 'borrowed' | 'lent'
  totalAmount: real('total_amount').notNull(),
  remainingAmount: real('remaining_amount').notNull(),
  date: integer('date').notNull(),
  dueDate: integer('due_date'),
  note: text('note'),
  isSettled: integer('is_settled', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').notNull(),
});

// ─── Debt Payments ───────────────────────────────────────────
export const debtPayments = sqliteTable('debt_payments', {
  id: text('id').primaryKey(),
  debtId: text('debt_id').notNull(),
  amount: real('amount').notNull(),
  date: integer('date').notNull(),
  note: text('note'),
});

// ─── Shopping Lists ──────────────────────────────────────────
export const shoppingLists = sqliteTable('shopping_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  budget: real('budget'), // optional budget limit
  createdAt: integer('created_at').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
});

export const shoppingItems = sqliteTable('shopping_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').notNull(),
  name: text('name').notNull(),
  expectedPrice: real('expected_price'),
  quantity: real('quantity'),
  unit: text('unit'),
  category: text('category'), // for smart sorting
  isChecked: integer('is_checked', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
});

// ─── Document Vault ──────────────────────────────────────────
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'warranty' | 'loyalty_card' | 'receipt' | 'other'
  expiryDate: integer('expiry_date'),
  barcodeData: text('barcode_data'),
  imagePath: text('image_path'),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
});

// ─── Investment Ledger ───────────────────────────────────────
export const investments = sqliteTable('investments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'stock' | 'crypto' | 'gold' | 'real_estate' | 'other'
  purchasePrice: real('purchase_price').notNull(),
  currentValue: real('current_value').notNull(),
  quantity: real('quantity').notNull().default(1),
  purchaseDate: integer('purchase_date').notNull(),
  note: text('note'),
  createdAt: integer('created_at').notNull(),
});

// ─── Groups (for bill splitting - future) ────────────────────
export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('USD'),
  createdAt: integer('created_at').notNull(),
});

export const groupMembers = sqliteTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull(),
  name: text('name').notNull(),
  isUser: integer('is_user', { mode: 'boolean' }).default(false),
});

export const splits = sqliteTable('splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  groupId: text('group_id').notNull(),
  memberId: text('member_id').notNull(),
  amount: real('amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
});
