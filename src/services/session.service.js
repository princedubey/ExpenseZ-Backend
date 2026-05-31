const { setJson, deleteKey, getJson } = require('./cache.service');

// Session keys are stored as `session:<hashedRefreshToken>`
const makeKey = (hashedRefreshToken) => `session:${hashedRefreshToken}`;

const storeSession = async (hashedRefreshToken, value, ttlSeconds = 7 * 24 * 60 * 60) => {
  try {
    await setJson(makeKey(hashedRefreshToken), value, ttlSeconds);
  } catch (err) {
    // non-fatal; cache is best-effort
    // eslint-disable-next-line no-console
    console.error('Failed to store session in cache:', err.message || err);
  }
};

const getSession = async (hashedRefreshToken) => {
  try {
    return await getJson(makeKey(hashedRefreshToken));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to read session from cache:', err.message || err);
    return null;
  }
};

const clearSession = async (hashedRefreshToken) => {
  try {
    await deleteKey(makeKey(hashedRefreshToken));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear session from cache:', err.message || err);
  }
};

module.exports = { storeSession, getSession, clearSession };
