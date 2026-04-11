import { LRUCache } from "lru-cache";
import { createClient } from "redis";
import { config } from "../config";

type Logger = Pick<Console, "warn">;

export interface ShortCache {
  enabled: boolean;
  get<T>(key: string): Promise<T | null>;
  put<T>(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  getOrPut<T>(key: string, load: () => Promise<T>): Promise<T>;
}

class MemoryShortCache implements ShortCache {
  readonly enabled = true;
  private readonly cache: LRUCache<string, any>;

  constructor(ttlSeconds: number) {
    this.cache = new LRUCache<string, any>({
      max: 500,
      ttl: ttlSeconds * 1000,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.cache.get(key) as T | undefined) ?? null;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async getOrPut<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await load();
    await this.put(key, value);
    return value;
  }
}

class RedisShortCache implements ShortCache {
  readonly enabled = true;
  private client: ReturnType<typeof createClient> | null = null;
  private connectPromise: Promise<ReturnType<typeof createClient> | null> | null = null;
  private disabled = false;

  constructor(
    private readonly namespace: string,
    private readonly ttlSeconds: number,
    private readonly logger: Logger = console,
  ) {}

  private buildKey(key: string) {
    return `${this.namespace}:${key}`;
  }

  private async getClient() {
    if (this.disabled) {
      return null;
    }

    if (this.client?.isReady) {
      return this.client;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const client = createClient({ url: config.redis.url });
    client.on("error", (error) => {
      this.logger.warn("[remoodle] redis short cache error", error);
    });

    this.connectPromise = client
      .connect()
      .then(() => {
        this.client = client;
        return client;
      })
      .catch((error) => {
        this.disabled = true;
        this.logger.warn("[remoodle] redis short cache disabled, connection failed", error);
        return null;
      })
      .finally(() => {
        this.connectPromise = null;
      });

    return this.connectPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(this.buildKey(key));
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.warn("[remoodle] redis short cache get failed", error);
      return null;
    }
  }

  async put<T>(key: string, value: T): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      return;
    }

    try {
      await client.set(this.buildKey(key), JSON.stringify(value), {
        EX: this.ttlSeconds,
      });
    } catch (error) {
      this.logger.warn("[remoodle] redis short cache put failed", error);
    }
  }

  async has(key: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) {
      return false;
    }

    try {
      return (await client.exists(this.buildKey(key))) === 1;
    } catch (error) {
      this.logger.warn("[remoodle] redis short cache has failed", error);
      return false;
    }
  }

  async getOrPut<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await load();
    await this.put(key, value);
    return value;
  }
}

export function createShortCache(namespace: string, logger?: Logger): ShortCache {
  if (!config.redis.enabled) {
    return new MemoryShortCache(config.redis.shortCacheTtlSeconds);
  }

  return new RedisShortCache(namespace, config.redis.shortCacheTtlSeconds, logger);
}
