const express = require("express");
const { requireLogin } = require("../middleware/authMiddleware");
const masteryRepository = require("../repositories/masteryRepository");
const userRepository = require("../repositories/userRepository");

const router = express.Router();

router.use(requireLogin);

router.get("/", async (request, response, next) => {
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

    const terms = await masteryRepository.findMasteredTermsByUserId(user.id);
    response.json({ terms });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
