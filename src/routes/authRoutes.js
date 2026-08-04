const express = require("express");
const userRepository = require("../repositories/userRepository");
const passwordService = require("../services/passwordService");

const router = express.Router();

router.get("/captcha", (request, response) => {
  const firstNumber = randomDigit();
  const secondNumber = randomDigit();
  request.session.captchaAnswer = firstNumber + secondNumber;
  response.json({ question: `${firstNumber} + ${secondNumber} = ?` });
});

router.post("/register", async (request, response, next) => {
  try {
    const captchaValidation = validateCaptcha(request, request.body || {});
    if (!captchaValidation.valid) {
      response.status(400).json({ message: captchaValidation.message });
      return;
    }

    const credentials = getCredentials(request.body);
    if (!credentials.valid) {
      response.status(400).json({ message: credentials.message });
      return;
    }

    const existingUser = await userRepository.findUserWithPassword(credentials.username);
    if (existingUser) {
      response.status(409).json({ message: "用户名已存在" });
      return;
    }

    const password = await passwordService.hashPassword(credentials.password);
    const user = await userRepository.createUser(credentials.username, password);
    await createLoginSession(request, user);
    response.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const captchaValidation = validateCaptcha(request, request.body || {});
    if (!captchaValidation.valid) {
      response.status(400).json({ message: captchaValidation.message });
      return;
    }

    const credentials = getCredentials(request.body, false);
    if (!credentials.valid) {
      response.status(400).json({ message: credentials.message });
      return;
    }

    const userWithPassword = await userRepository.findUserWithPassword(credentials.username);
    if (!userWithPassword) {
      response.status(401).json({ message: "用户名或密码错误" });
      return;
    }

    const passwordMatches = await passwordService.verifyPassword(
      credentials.password,
      userWithPassword.password
    );
    if (!passwordMatches) {
      response.status(401).json({ message: "用户名或密码错误" });
      return;
    }

    const user = toPublicUser(userWithPassword);
    await createLoginSession(request, user);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    response.clearCookie("aussieLearningSession");
    response.status(204).end();
  });
});

router.get("/me", async (request, response, next) => {
  try {
    if (!request.session.user) {
      response.json({ user: null });
      return;
    }

    const user = await userRepository.findUserById(request.session.user.id);
    if (!user) {
      request.session.destroy(() => {});
      response.json({ user: null });
      return;
    }

    request.session.user = user;
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

function getCredentials(body, enforceLength = true) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username.length < 3 || username.length > 30) {
    return { valid: false, message: "用户名长度需要在 3 到 30 个字符之间" };
  }

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return { valid: false, message: "用户名只能包含英文字母和数字" };
  }

  if (!password || (enforceLength && password.length < 6) || password.length > 100) {
    return { valid: false, message: "密码长度需要在 6 到 100 个字符之间" };
  }

  return { valid: true, username, password };
}

function validateCaptcha(request, body) {
  const expectedAnswer = request.session.captchaAnswer;
  delete request.session.captchaAnswer;
  const rawAnswer = body.captchaAnswer;
  if (rawAnswer === null || rawAnswer === undefined || String(rawAnswer).trim() === "") {
    return { valid: false, message: "请先完成计算验证码" };
  }
  const submittedAnswer = Number(rawAnswer);
  if (!Number.isInteger(expectedAnswer) || !Number.isInteger(submittedAnswer)) {
    return { valid: false, message: "请先完成计算验证码" };
  }
  if (submittedAnswer !== expectedAnswer) {
    return { valid: false, message: "计算验证码错误，请重新计算" };
  }
  return { valid: true };
}

function randomDigit() {
  return Math.floor(Math.random() * 9) + 1;
}

function createLoginSession(request, user) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      request.session.user = user;
      request.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    currentLevel: user.currentLevel
  };
}

module.exports = router;
