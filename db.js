const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, "aussieLearning.db");
const database = new sqlite3.Database(databasePath);

function run(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, parameters, function handleResult(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ lastId: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, parameters, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, parameters, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    database.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function initializeDatabase() {
  await run("PRAGMA journal_mode = WAL");
  await run("PRAGMA foreign_keys = ON");

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      currentLevel INTEGER NOT NULL DEFAULT 1 CHECK (currentLevel BETWEEN 1 AND 5)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS aussieTerms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      termContent TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT NOT NULL,
      termType TEXT NOT NULL CHECK (termType IN ('word', 'phrase', 'sentence')),
      level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionId TEXT PRIMARY KEY,
      sessionData TEXT NOT NULL,
      expiresAt INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS userMastery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      termId INTEGER NOT NULL,
      addedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (termId) REFERENCES aussieTerms(id) ON DELETE CASCADE,
      UNIQUE (userId, termId)
    )
  `);

  await run(`
    CREATE INDEX IF NOT EXISTS userMasteryUserAddedAtIndex
    ON userMastery (userId, addedAt DESC)
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS userLearningProgress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
      termOrder TEXT NOT NULL,
      currentPosition INTEGER NOT NULL DEFAULT 0 CHECK (currentPosition >= 0),
      batchStartPosition INTEGER NOT NULL DEFAULT 0 CHECK (batchStartPosition >= 0),
      phase TEXT NOT NULL DEFAULT 'learning'
        CHECK (phase IN ('learning', 'quiz', 'result', 'completed')),
      quizState TEXT,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS userLearningProgressUserLevelIndex
    ON userLearningProgress (userId, level)
  `);

  await run("PRAGMA optimize");
}

module.exports = {
  all,
  close,
  databasePath,
  get,
  initializeDatabase,
  run
};
