import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(), 
  name: text('name').notNull(),
  type: text('type').notNull(), 
  balance: real('balance').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), 
  date: integer('date').notNull(), 
  note: text('note'),
  groupId: text('group_id'), 
});

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('USD'),
  createdAt: integer('created_at').notNull(),
});

export const groupMembers = sqliteTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
  isUser: integer('is_user', { mode: 'boolean' }).default(false), 
});

export const splits = sqliteTable('splits', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  groupId: text('group_id').notNull().references(() => groups.id),
  memberId: text('member_id').notNull().references(() => groupMembers.id),
  amount: real('amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  targetDate: integer('target_date'),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
});
