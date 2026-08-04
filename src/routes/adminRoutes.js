const express = require("express");
const termRepository = require("../repositories/termRepository");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const allowedTypes = ["word", "phrase", "sentence"];

router.use(requireAdmin);

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
