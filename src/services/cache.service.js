/*
  Cache service with dual support:
  - Native Redis via `REDIS_URL` (ioredis) when available
  - Upstash REST API via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` when REDIS_URL is absent

  Exports: getRedisClient, getJson, setJson, deleteKey
*/
let redisClient = null;
let Redis;
try {
  Redis = require('ioredis');
} catch (e) {
  // ioredis may not be installed in some environments; we'll fallback to REST-only if needed
  Redis = null;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  if (process.env.REDIS_URL && Redis) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      console.error('Redis error:', error.message || error);
    });

    return redisClient;
  }

  return null;
};

const _fetch = async (url, opts = {}) => {
  if (typeof fetch === 'function') {
    return fetch(url, opts);
  }

  // fallback to node-fetch if available
  try {
    // eslint-disable-next-line global-require
    const nodeFetch = require('node-fetch');
    return nodeFetch(url, opts);
  } catch (e) {
    throw new Error('fetch is not available. Install node >=18 or add node-fetch dependency');
  }
};

const getJson = async (key) => {
  const client = getRedisClient();
  if (client) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.error('Error reading from Redis:', err.message || err);
      return null;
    }
  }

  // Fallback to Upstash REST
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const url = `${UPSTASH_URL.replace(/\/+$/, '')}/get/${encodeURIComponent(key)}`;
      const res = await _fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // non-fatal; treat as cache miss
        return null;
      }

      const body = await res.json();
      // Upstash may return different shapes: { result: <val> } or { value: <val>, ex: <ttl> }
      let raw = body;
      if (body && typeof body === 'object') {
        if (Object.prototype.hasOwnProperty.call(body, 'result')) {
          const parsed = typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
          if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'value')) {
            raw = parsed.value;
          } else {
            raw = parsed;
          }
        } else if (Object.prototype.hasOwnProperty.call(body, 'value')) {
          raw = body.value;
        }
      }

      // unwrap nested { value: { value: '...' } } shapes
      while (raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'value')) {
        raw = raw.value;
      }

      if (raw === null || raw === undefined) return null;

      try {
        return JSON.parse(raw);
      } catch (e) {
        return raw;
      }
    } catch (err) {
      console.error('Upstash REST get error:', err.message || err);
      return null;
    }
  }

  return null;
};

const setJson = async (key, value, ttlSeconds = 300) => {
  const client = getRedisClient();
  if (client) {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error('Error writing to Redis:', err.message || err);
    }

    return;
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const url = `${UPSTASH_URL.replace(/\/+$/, '')}/set/${encodeURIComponent(key)}`;
      const body = {
        value: JSON.stringify(value),
        ex: ttlSeconds,
      };

      const res = await _fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('Upstash REST set failed:', res.status, txt);
      }
    } catch (err) {
      console.error('Upstash REST set error:', err.message || err);
    }
  }
};

const deleteKey = async (key) => {
  const client = getRedisClient();
  if (client) {
    try {
      await client.del(key);
    } catch (err) {
      console.error('Error deleting key from Redis:', err.message || err);
    }
    return;
  }

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const url = `${UPSTASH_URL.replace(/\/+$/, '')}/del/${encodeURIComponent(key)}`;
      const res = await _fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('Upstash REST del failed:', res.status, txt);
      }
    } catch (err) {
      console.error('Upstash REST del error:', err.message || err);
    }
  }
};

module.exports = {
  getRedisClient,
  getJson,
  setJson,
  deleteKey,
};