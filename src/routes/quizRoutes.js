const express = require("express");
const { requireLogin } = require("../middleware/authMiddleware");
const userRepository = require("../repositories/userRepository");
const quizService = require("../services/quizService");

const router = express.Router();

router.use(requireLogin);

router.post("/submit", async (request, response, next) => {
  try {
    const user = await userRepository.findUserById(request.session.user.id);
    if (!user) {
      response.status(401).json({ message: "登录状态已失效，请重新登录" });
      return;
    }

    if (user.role !== "user") {
      response.status(403).json({ message: "该接口仅供学习用户使用" });
      return;
    }

    const submission = await quizService.submitQuiz(user, request.body || {});
    if (!submission.valid) {
      response.status(400).json({ message: submission.message });
      return;
    }

    request.session.user = submission.user;
    response.json({ result: submission.result, user: submission.user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
