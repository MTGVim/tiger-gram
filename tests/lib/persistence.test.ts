import { describe, expect, it } from 'vitest';
import { loadLocal, saveLocal } from '../../src/lib/persistence';

describe('persistence', () => {
  it('stores and loads local payloads', () => {
    saveLocal('sample', { a: 1 });
    expect(loadLocal('sample', { a: 0 })).toEqual({ a: 1 });
  });

  it('returns fallback on missing or invalid payload', () => {
    expect(loadLocal('missing', { ok: true })).toEqual({ ok: true });
    localStorage.setItem('tiger-gram:bad', '{not-json}');
    expect(loadLocal('bad', { ok: false })).toEqual({ ok: false });
  });
});
