import {
  adminOrderLogQuerySchema,
  resolveAdminOrderLogDayRange,
} from '../admin-orders.validation';

describe('adminOrderLogQuerySchema', () => {
  it('defaults to page 1 and pageSize 10 without all/date', () => {
    const parsed = adminOrderLogQuerySchema.parse({});
    expect(parsed).toEqual({
      page: 1,
      pageSize: 10,
      all: false,
      date: undefined,
      q: undefined,
    });
  });

  it('accepts all=true and drops date', () => {
    const parsed = adminOrderLogQuerySchema.parse({
      all: 'true',
      date: '2026-10-15',
      page: '2',
      pageSize: '20',
    });
    expect(parsed).toEqual({
      page: 2,
      pageSize: 20,
      all: true,
      date: undefined,
      q: undefined,
    });
  });

  it('trims and accepts search query', () => {
    const parsed = adminOrderLogQuerySchema.parse({ q: '  IN-1001  ' });
    expect(parsed.q).toBe('IN-1001');
  });

  it('rejects invalid date format', () => {
    expect(() => adminOrderLogQuerySchema.parse({ date: '15-10-2026' })).toThrow();
  });
});

describe('resolveAdminOrderLogDayRange', () => {
  it('returns all-mode when all is true', () => {
    expect(resolveAdminOrderLogDayRange({ all: true, date: '2026-10-01' })).toEqual({
      mode: 'all',
      date: null,
    });
  });

  it('defaults to today when date is omitted', () => {
    const now = new Date('2026-10-15T12:30:00');
    const result = resolveAdminOrderLogDayRange({ all: false, now });
    expect(result.mode).toBe('day');
    expect(result.date).toBe('2026-10-15');
    expect(result.from?.getFullYear()).toBe(2026);
    expect(result.from?.getMonth()).toBe(9);
    expect(result.from?.getDate()).toBe(15);
    expect(result.from?.getHours()).toBe(0);
    expect(result.to?.getHours()).toBe(23);
  });

  it('uses the provided date', () => {
    const result = resolveAdminOrderLogDayRange({
      all: false,
      date: '2026-01-05',
    });
    expect(result).toMatchObject({
      mode: 'day',
      date: '2026-01-05',
    });
  });
});
