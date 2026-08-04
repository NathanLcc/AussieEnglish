const database = require("../../db");

async function addMastery(userId, termId) {
  const result = await database.run(
    `INSERT OR IGNORE INTO userMastery (userId, termId)
     VALUES (?, ?)`,
    [userId, termId]
  );

  return result.changes > 0;
}

async function findMasteredTermsByUserId(userId) {
  return database.all(
    `SELECT
       aussieTerms.id,
       aussieTerms.termContent,
       aussieTerms.meaning,
       aussieTerms.example,
       aussieTerms.termType,
       aussieTerms.level,
       userMastery.addedAt
     FROM userMastery
     INNER JOIN aussieTerms ON aussieTerms.id = userMastery.termId
     WHERE userMastery.userId = ?
     ORDER BY
       CASE aussieTerms.termType
         WHEN 'word' THEN 1
         WHEN 'phrase' THEN 2
         WHEN 'sentence' THEN 3
       END ASC,
       userMastery.addedAt DESC,
       aussieTerms.id ASC`,
    [userId]
  );
}

module.exports = { addMastery, findMasteredTermsByUserId };
