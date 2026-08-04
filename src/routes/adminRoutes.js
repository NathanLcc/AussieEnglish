const express = require("express");
const progressRepository = require("../repositories/progressRepository");
const termRepository = require("../repositories/termRepository");
const userRepository = require("../repositories/userRepository");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const allowedTypes = ["word", "phrase", "sentence"];

router.use(requireAdmin);

router.get("/users", async (request, response, next) => {
  try {
    const users = await userRepository.findAllUsers();
    const progressRows = await progressRepository.findAllProgress();
    const progressByUserId = groupProgressByUserId(progressRows);
    const publicUsers = [];

    for (let userIndex = 0; userIndex < users.length; userIndex += 1) {
      const user = users[userIndex];

      publicUsers.push({
        id: user.id,
        username: user.username,
        role: user.role,
        currentLevel: user.currentLevel,
        progress: progressByUserId.get(user.id) || []
      });
    }

    response.json({ users: publicUsers });
  } catch (error) {
    next(error);
  }
});

router.get("/terms", async (request, response, next) => {
  try {
    const terms = await termRepository.findAllTerms();
    response.json({ terms });
  } catch (error) {
    next(error);
  }
});

router.get("/terms/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) {
      response.status(400).json({ message: "内容编号无效" });
      return;
    }

    const term = await termRepository.findTermById(id);
    if (!term) {
      response.status(404).json({ message: "学习内容不存在" });
      return;
    }

    response.json({ term });
  } catch (error) {
    next(error);
  }
});

router.post("/terms", async (request, response, next) => {
  try {
    const validation = validateTerm(request.body);
    if (!validation.valid) {
      response.status(400).json({ message: validation.message });
      return;
    }

    const term = await termRepository.createTerm(validation.term);
    response.status(201).json({ term });
  } catch (error) {
    next(error);
  }
});

router.put("/terms/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) {
      response.status(400).json({ message: "内容编号无效" });
      return;
    }

    const validation = validateTerm(request.body);
    if (!validation.valid) {
      response.status(400).json({ message: validation.message });
      return;
    }

    const term = await termRepository.updateTerm(id, validation.term);
    if (!term) {
      response.status(404).json({ message: "学习内容不存在" });
      return;
    }

    response.json({ term });
  } catch (error) {
    next(error);
  }
});

router.delete("/terms/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) {
      response.status(400).json({ message: "内容编号无效" });
      return;
    }

    const deleted = await termRepository.deleteTerm(id);
    if (!deleted) {
      response.status(404).json({ message: "学习内容不存在" });
      return;
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

function toPublicProgress(row) {
  const termOrder = parseJsonArray(row.termOrder);
  const totalTerms = termOrder.length;
  const position = totalTerms === 0 ? 0 : Math.min(row.currentPosition + 1, totalTerms);

  return {
    level: row.level,
    phase: row.phase,
    position,
    totalTerms,
    updatedAt: row.updatedAt
  };
}

function groupProgressByUserId(rows) {
  const grouped = new Map();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!grouped.has(row.userId)) {
      grouped.set(row.userId, []);
    }
    grouped.get(row.userId).push(toPublicProgress(row));
  }

  return grouped;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function validateTerm(body) {
  const termContent = typeof body.termContent === "string" ? body.termContent.trim() : "";
  const meaning = typeof body.meaning === "string" ? body.meaning.trim() : "";
  const example = typeof body.example === "string" ? body.example.trim() : "";
  const termType = typeof body.termType === "string" ? body.termType : "";
  const level = Number(body.level);

  if (!termContent || termContent.length > 300) {
    return { valid: false, message: "英文内容不能为空，且不能超过 300 个字符" };
  }

  if (!meaning || meaning.length > 300) {
    return { valid: false, message: "中文释义不能为空，且不能超过 300 个字符" };
  }

  if (!example || example.length > 1000) {
    return { valid: false, message: "澳洲例句不能为空，且不能超过 1000 个字符" };
  }

  let typeAllowed = false;
  for (let index = 0; index < allowedTypes.length; index += 1) {
    if (allowedTypes[index] === termType) {
      typeAllowed = true;
      break;
    }
  }

  if (!typeAllowed) {
    return { valid: false, message: "内容类型无效" };
  }

  if (!Number.isInteger(level) || level < 1 || level > 5) {
    return { valid: false, message: "难度等级必须是 1 到 5" };
  }

  return {
    valid: true,
    term: { termContent, meaning, example, termType, level }
  };
}

module.exports = router;
