import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

export const sqliteDb = SQLite.openDatabaseSync('expense_tracker.db');
export const db = drizzle(sqliteDb, { schema });
