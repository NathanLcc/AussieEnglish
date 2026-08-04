const session = require("express-session");
const database = require("../../db");

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    this.cleanupTimer = setInterval(() => {
      database.run("DELETE FROM sessions WHERE expiresAt < ?", [Date.now()]).catch(() => {});
    }, 15 * 60 * 1000);
    this.cleanupTimer.unref();
  }

  get(sessionId, callback) {
    database
      .get("SELECT sessionData, expiresAt FROM sessions WHERE sessionId = ?", [sessionId])
      .then((row) => {
        if (!row) {
          callback(null, null);
          return;
        }

        if (row.expiresAt < Date.now()) {
          this.destroy(sessionId, callback);
          return;
        }

        callback(null, JSON.parse(row.sessionData));
      })
      .catch(callback);
  }

  set(sessionId, sessionData, callback) {
    const expiresAt = getExpiresAt(sessionData);
    database
      .run(
        `INSERT INTO sessions (sessionId, sessionData, expiresAt)
         VALUES (?, ?, ?)
         ON CONFLICT(sessionId) DO UPDATE SET
           sessionData = excluded.sessionData,
           expiresAt = excluded.expiresAt`,
        [sessionId, JSON.stringify(sessionData), expiresAt]
      )
      .then(() => callback(null))
      .catch(callback);
  }

  touch(sessionId, sessionData, callback) {
    const expiresAt = getExpiresAt(sessionData);
    database
      .run("UPDATE sessions SET expiresAt = ? WHERE sessionId = ?", [expiresAt, sessionId])
      .then(() => callback(null))
      .catch(callback);
  }

  destroy(sessionId, callback) {
    database
      .run("DELETE FROM sessions WHERE sessionId = ?", [sessionId])
      .then(() => callback(null))
      .catch(callback);
  }
}

function getExpiresAt(sessionData) {
  if (sessionData.cookie && sessionData.cookie.expires) {
    return new Date(sessionData.cookie.expires).getTime();
  }

  return Date.now() + 24 * 60 * 60 * 1000;
}

module.exports = SqliteSessionStore;
