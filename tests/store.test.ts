import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, loadSession, clearSession } from '../src/core/store';

describe('store helpers (IndexedDB fake)', () => {
  let fakeStore: Record<string, any> = {};

  beforeEach(() => {
    fakeStore = {};
    const fakeDB = {
      transaction: () => ({
        objectStore: () => ({
          put: (val: any) => {
            fakeStore[val.id] = val;
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: val.id } }), 0);
            return req;
          },
          get: (id: string) => {
            const req = { result: fakeStore[id] || null, onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: fakeStore[id] || null } }), 0);
            return req;
          },
          delete: (id: string) => {
            delete fakeStore[id];
            const req = { onsuccess: null as any, onerror: null as any };
            setTimeout(() => req.onsuccess?.({ target: { result: undefined } }), 0);
            return req;
          },
        }),
      }),
    };

    (globalThis as any).window = {
      indexedDB: {
        open: () => {
          const req = {
            result: fakeDB,
            onsuccess: null as any,
            onerror: null as any,
            onupgradeneeded: null as any,
          };
          setTimeout(() => req.onsuccess?.({ target: { result: fakeDB } }), 0);
          return req;
        },
      },
    };
  });

  it('saves and loads session safely in on-device storage', async () => {
    const ok = await saveSession('Hello test chat', 'Alice', ['Alice', 'Ali'], 1760000000000);
    expect(ok).toBe(true);

    const loaded = await loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.sender).toBe('Alice');
    expect(loaded?.rawText).toBe('Hello test chat');
    expect(loaded?.aliases).toEqual(['Alice', 'Ali']);
  });

  it('clears session safely', async () => {
    await saveSession('Hello test chat', 'Alice', ['Alice'], 1760000000000);
    const cleared = await clearSession();
    expect(cleared).toBe(true);

    const after = await loadSession();
    expect(after).toBeNull();
  });
});
