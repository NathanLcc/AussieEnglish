const database = require("../../db");

async function createTerm(term) {
  const result = await database.run(
    `INSERT INTO aussieTerms (termContent, meaning, example, termType, level)
     VALUES (?, ?, ?, ?, ?)`,
    [term.termContent, term.meaning, term.example, term.termType, term.level]
  );

  return findTermById(result.lastId);
}

async function findAllTerms() {
  return database.all(
    `SELECT id, termContent, meaning, example, termType, level
     FROM aussieTerms
     ORDER BY level ASC, id DESC`
  );
}

async function findTermsByLevel(level) {
  return database.all(
    `SELECT id, termContent, meaning, example, termType, level
     FROM aussieTerms
     WHERE level = ?
     ORDER BY id ASC`,
    [level]
  );
}

async function findTermById(id) {
  return database.get(
    `SELECT id, termContent, meaning, example, termType, level
     FROM aussieTerms
     WHERE id = ?`,
    [id]
  );
}

async function updateTerm(id, term) {
  const result = await database.run(
    `UPDATE aussieTerms
     SET termContent = ?, meaning = ?, example = ?, termType = ?, level = ?
     WHERE id = ?`,
    [term.termContent, term.meaning, term.example, term.termType, term.level, id]
  );

  if (result.changes === 0) {
    return null;
  }

  return findTermById(id);
}

async function deleteTerm(id) {
  const result = await database.run("DELETE FROM aussieTerms WHERE id = ?", [id]);
  return result.changes > 0;
}

module.exports = {
  createTerm,
  deleteTerm,
  findAllTerms,
  findTermById,
  findTermsByLevel,
  updateTerm
};
