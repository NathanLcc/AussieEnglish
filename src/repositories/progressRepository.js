const database = require("../../db");

async function createProgress(userId, level, termOrder) {
  await database.run(
    `INSERT OR IGNORE INTO userLearningProgress
       (userId, level, termOrder, currentPosition, batchStartPosition, phase, quizState)
     VALUES (?, ?, ?, 0, 0, 'learning', NULL)`,
    [userId, level, JSON.stringify(termOrder)]
  );

  return findProgress(userId, level);
}

async function findProgress(userId, level) {
  return database.get(
    `SELECT id, userId, level, termOrder, currentPosition,
            batchStartPosition, phase, quizState, updatedAt
     FROM userLearningProgress
     WHERE userId = ? AND level = ?`,
    [userId, level]
  );
}

async function findProgressByUserId(userId) {
  return database.all(
    `SELECT id, userId, level, termOrder, currentPosition,
            batchStartPosition, phase, quizState, updatedAt
     FROM userLearningProgress
     WHERE userId = ?
     ORDER BY level ASC`,
    [userId]
  );
}

async function findAllProgress() {
  return database.all(
    `SELECT id, userId, level, termOrder, currentPosition,
            batchStartPosition, phase, quizState, updatedAt
     FROM userLearningProgress
     ORDER BY userId ASC, level ASC`
  );
}

async function updateProgress(progress) {
  await database.run(
    `UPDATE userLearningProgress
     SET termOrder = ?, currentPosition = ?, batchStartPosition = ?,
         phase = ?, quizState = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      JSON.stringify(progress.termOrder),
      progress.currentPosition,
      progress.batchStartPosition,
      progress.phase,
      progress.quizState ? JSON.stringify(progress.quizState) : null,
      progress.id
    ]
  );

  return findProgress(progress.userId, progress.level);
}

module.exports = {
  createProgress,
  findAllProgress,
  findProgress,
  findProgressByUserId,
  updateProgress
};
