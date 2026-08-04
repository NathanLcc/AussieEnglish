const database = require("../../db");

async function createUser(username, password, role = "user") {
  const result = await database.run(
    `INSERT INTO users (username, password, role, currentLevel)
     VALUES (?, ?, ?, 1)`,
    [username, password, role]
  );

  return findUserById(result.lastId);
}

async function findUserById(id) {
  return database.get(
    `SELECT id, username, role, currentLevel
     FROM users
     WHERE id = ?`,
    [id]
  );
}

async function findUserWithPassword(username) {
  return database.get(
    `SELECT id, username, password, role, currentLevel
     FROM users
     WHERE username = ? COLLATE NOCASE`,
    [username]
  );
}

async function findAllUsers() {
  return database.all(
    `SELECT id, username, role, currentLevel
     FROM users
     ORDER BY
       CASE role WHEN 'user' THEN 1 ELSE 2 END ASC,
       username COLLATE NOCASE ASC,
       id ASC`
  );
}

async function promoteCurrentLevel(id, expectedLevel) {
  const result = await database.run(
    `UPDATE users
     SET currentLevel = currentLevel + 1
     WHERE id = ? AND currentLevel = ? AND currentLevel < 5`,
    [id, expectedLevel]
  );

  return result.changes > 0;
}

module.exports = {
  createUser,
  findAllUsers,
  findUserById,
  findUserWithPassword,
  promoteCurrentLevel
};
