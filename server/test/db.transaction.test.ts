import { describe, it, expect } from 'vitest';
import { runInTransaction } from '../src/common/database/connection';
import { Counter } from '../src/common/models/counter.model';

describe('MongoDB Multi-Document ACID Transactions (Replica Set)', () => {
  it('commits all operations inside a successful transaction', async () => {
    await runInTransaction(async (session) => {
      await Counter.create([{ key: 'tx-key-1', seq: 10 }], { session });
      await Counter.create([{ key: 'tx-key-2', seq: 20 }], { session });
    });

    const c1 = await Counter.findOne({ key: 'tx-key-1' });
    const c2 = await Counter.findOne({ key: 'tx-key-2' });

    expect(c1).toBeDefined();
    expect(c1?.seq).toBe(10);
    expect(c2).toBeDefined();
    expect(c2?.seq).toBe(20);
  });

  it('aborts and rolls back all operations when an error is thrown inside transaction', async () => {
    const action = async () => {
      await runInTransaction(async (session) => {
        await Counter.create([{ key: 'abort-key-1', seq: 100 }], { session });
        // Deliberately trigger an error
        throw new Error('Transaction failure simulation');
      });
    };

    await expect(action()).rejects.toThrow('Transaction failure simulation');

    // Verify key was rolled back
    const rolledBack = await Counter.findOne({ key: 'abort-key-1' });
    expect(rolledBack).toBeNull();
  });
});
