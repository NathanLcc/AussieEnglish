const express = require("express");
const { requireLogin } = require("../middleware/authMiddleware");
const learningSessionService = require("../services/learningSessionService");
const termRepository = require("../repositories/termRepository");
const userRepository = require("../repositories/userRepository");

const router = express.Router();

router.use(requireLogin);

router.get("/progress", async (request, response, next) => {
  try {
    const user = await getLearningUser(request, response);
    if (!user) {
      return;
    }
    const progress = await learningSessionService.getProgressSummaries(user.id);
    response.json({ progress });
  } catch (error) {
    next(error);
  }
});

router.get("/levels/:level/terms", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const terms = await termRepository.findTermsByLevel(context.level);
    response.json({ level: context.level, terms });
  } catch (error) {
    next(error);
  }
});

router.get("/levels/:level/session", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const session = await learningSessionService.getSession(context.user, context.level);
    response.json({ session });
  } catch (error) {
    next(error);
  }
});

router.post("/levels/:level/navigate", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const result = await learningSessionService.navigate(
      context.user,
      context.level,
      request.body.direction
    );
    sendServiceResult(response, result);
  } catch (error) {
    next(error);
  }
});

router.post("/levels/:level/quiz/answer", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const result = await learningSessionService.answerQuiz(
      context.user,
      context.level,
      request.body || {}
    );
    if (result.user) {
      request.session.user = result.user;
    }
    sendServiceResult(response, result);
  } catch (error) {
    next(error);
  }
});

router.post("/levels/:level/quiz/retry", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const result = await learningSessionService.retryQuiz(context.user, context.level);
    sendServiceResult(response, result);
  } catch (error) {
    next(error);
  }
});

router.post("/levels/:level/quiz/continue", async (request, response, next) => {
  try {
    const context = await getLearningContext(request, response);
    if (!context) {
      return;
    }
    const result = await learningSessionService.continueAfterQuiz(context.user, context.level);
    sendServiceResult(response, result);
  } catch (error) {
    next(error);
  }
});

async function getLearningContext(request, response) {
  const level = Number(request.params.level);
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    response.status(400).json({ message: "难度等级必须是 1 到 5" });
    return null;
  }

  const user = await getLearningUser(request, response);
  if (!user) {
    return null;
  }
  if (level > user.currentLevel) {
    response.status(403).json({ message: "该等级尚未解锁" });
    return null;
  }
  return { level, user };
}

async function getLearningUser(request, response) {
  const user = await userRepository.findUserById(request.session.user.id);
  if (!user) {
    response.status(401).json({ message: "登录状态已失效，请重新登录" });
    return null;
  }
  if (user.role !== "user") {
    response.status(403).json({ message: "该接口仅供学习用户使用" });
    return null;
  }
  return user;
}

function sendServiceResult(response, result) {
  if (!result.valid) {
    response.status(result.conflict ? 409 : 400).json({ message: result.message });
    return;
  }
  response.json({
    answerResult: result.answerResult,
    session: result.session,
    user: result.user
  });
}

module.exports = router;
