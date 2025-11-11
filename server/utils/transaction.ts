import { db } from '../db';

// Helper to run database operations
// NOTE: neon-http driver does not support real transactions
// Operations are executed sequentially without atomicity guarantees
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  console.warn('[withTransaction] Running without transaction support (neon-http driver limitation)');
  
  // Execute callback with db instance (no real transaction)
  return await callback(db);
}
