import { describe, it, expect } from 'vitest';
import { getNextSequence, generateTicketId } from '../src/common/models/counter.model';

describe('Annual Counter Model & Atomic Sequence Generation', () => {
  it('increments sequence atomically for a given counter key', async () => {
    const key = 'test-seq';
    const first = await getNextSequence(key);
    const second = await getNextSequence(key);
    const third = await getNextSequence(key);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(third).toBe(3);
  });

  it('generates annual ticket IDs with FIX-YYYY-000001 format', async () => {
    const year = 2026;
    const ticketId1 = await generateTicketId(year);
    const ticketId2 = await generateTicketId(year);

    expect(ticketId1).toBe('FIX-2026-000001');
    expect(ticketId2).toBe('FIX-2026-000002');
  });

  it('handles concurrent sequence increments without collisions', async () => {
    const year = 2027;
    const promises = Array.from({ length: 10 }, () => generateTicketId(year));
    const ids = await Promise.all(promises);

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
    expect(ids).toContain('FIX-2027-000001');
    expect(ids).toContain('FIX-2027-000010');
  });
});
