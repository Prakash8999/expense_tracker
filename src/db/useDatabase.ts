import { useEffect, useState } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './index';
import migrations from '../../drizzle/migrations';

export function useDatabase() {
  const { success, error } = useMigrations(db, migrations);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (success) {
      setIsReady(true);
    } else if (error) {
      console.error('Database migration error:', error);
    }
  }, [success, error]);

  return { isReady, error };
}
