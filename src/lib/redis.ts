// In-memory rate limiter for development (no Redis required)
// In production, replace with Redis

const store = new Map<string, { count: number; expiresAt: number }>();

export const redis = {
  async incr(key: string): Promise<number> {
    const now = Date.now();
    const entry = store.get(key);
    if (entry && entry.expiresAt > now) {
      entry.count++;
      return entry.count;
    }
    store.set(key, { count: 1, expiresAt: now + 600000 }); // 10 min default
    return 1;
  },
  async expire(key: string, seconds: number): Promise<void> {
    const entry = store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
  },
  async get(key: string): Promise<string | null> {
    const entry = store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return String(entry.count);
    }
    return null;
  },
  async set(key: string, value: string): Promise<void> {
    store.set(key, { count: parseInt(value) || 0, expiresAt: Date.now() + 600000 });
  },
};
