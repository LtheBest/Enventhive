import { db } from '../db';
import { neon } from '@neondatabase/serverless';

// Helper to run database operations in a transaction
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  const sql = neon(process.env.DATABASE_URL!);
  
  // Use Drizzle's transaction method
  return await db.transaction(async (tx) => {
    return await callback(tx as any);
  });
}
