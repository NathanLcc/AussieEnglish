const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "aussie-learning-test-"));
process.env.DATABASE_PATH = path.join(testDirectory, "test.db");
process.env.SESSION_SECRET = "guided-learning-test-secret";

const database = require("../db");
const { app } = require("../server");

let server;
let baseUrl;

before(async () => {
  await database.initializeDatabase();
  server = await listen(app);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await closeServer(server);
  }
  await database.close();
  fs.rmSync(testDirectory, { force: true, recursive: true });
});

test("数学验证码会保护注册并在每次尝试后失效", async () => {
  const captcha = await getCaptcha();
  const incorrectRegistration = await postJson("/api/auth/register", captcha.cookie, {
    captchaAnswer: captcha.answer + 1,
    password: "securePassword",
    username: "captchauser"
  });
  assert.equal(incorrectRegistration.response.status, 400);
  assert.equal(incorrectRegistration.data.message, "计算验证码错误，请重新计算");

  const reusedRegistration = await postJson("/api/auth/register", captcha.cookie, {
    captchaAnswer: captcha.answer,
    password: "securePassword",
    username: "captchauser"
  });
  assert.equal(reusedRegistration.response.status, 400);
  assert.equal(reusedRegistration.data.message, "请先完成计算验证码");
});

test("随机分段学习会保存位置、恢复测验并以 70% 作为通关门槛", async () => {
  await createTerms(1, 20);
  await createTerms(2, 20);
  let cookie = await registerUser("guidedlearner", "securePassword");

  let sessionResponse = await getJson("/api/learning/levels/1/session", cookie);
  assert.equal(sessionResponse.response.status, 200);
  assert.equal(sessionResponse.data.session.phase, "learning");
  assert.equal(sessionResponse.data.session.position, 1);
  assert.equal(sessionResponse.data.session.batchSize, 20);
  assert.ok(sessionResponse.data.session.term);

  const storedProgress = await database.get(
    `SELECT termOrder FROM userLearningProgress
     INNER JOIN users ON users.id = userLearningProgress.userId
     WHERE users.username = ? AND userLearningProgress.level = 1`,
    ["guidedlearner"]
  );
  const termOrder = JSON.parse(storedProgress.termOrder);
  assert.equal(termOrder.length, 20);
  assert.equal(new Set(termOrder).size, 20);
  assert.equal(isStrictlyAscending(termOrder), false);

  for (let index = 0; index < 19; index += 1) {
    sessionResponse = await postJson("/api/learning/levels/1/navigate", cookie, {
      direction: "next"
    });
  }
  assert.equal(sessionResponse.data.session.phase, "learning");
  assert.equal(sessionResponse.data.session.position, 20);
  assert.equal(sessionResponse.data.session.nextStartsQuiz, true);

  sessionResponse = await postJson("/api/learning/levels/1/navigate", cookie, {
    direction: "next"
  });
  assert.equal(sessionResponse.data.session.phase, "quiz");
  assert.equal(sessionResponse.data.session.quiz.currentQuestionIndex, 0);
  assert.equal(sessionResponse.data.session.quiz.totalQuestions, 10);

  for (let index = 0; index < 3; index += 1) {
    sessionResponse = await answerCurrentQuestion(cookie, true);
  }
  assert.equal(sessionResponse.data.session.quiz.currentQuestionIndex, 3);

  await fetch(`${baseUrl}/api/auth/logout`, {
    headers: { Cookie: cookie },
    method: "POST"
  });
  cookie = await loginUser("guidedlearner", "securePassword");

  sessionResponse = await getJson("/api/learning/levels/1/session", cookie);
  assert.equal(sessionResponse.data.session.phase, "quiz");
  assert.equal(sessionResponse.data.session.quiz.currentQuestionIndex, 3);

  for (let index = 3; index < 10; index += 1) {
    sessionResponse = await answerCurrentQuestion(cookie, index < 6);
  }
  assert.equal(sessionResponse.data.session.phase, "result");
  assert.equal(sessionResponse.data.session.result.correctCount, 6);
  assert.equal(sessionResponse.data.session.result.accuracy, 60);
  assert.equal(sessionResponse.data.session.result.passed, false);
  assert.equal(sessionResponse.data.user.currentLevel, 1);

  sessionResponse = await postJson("/api/learning/levels/1/quiz/retry", cookie, {});
  assert.equal(sessionResponse.data.session.phase, "quiz");
  for (let index = 0; index < 10; index += 1) {
    sessionResponse = await answerCurrentQuestion(cookie, index < 7);
  }
  assert.equal(sessionResponse.data.session.phase, "result");
  assert.equal(sessionResponse.data.session.result.correctCount, 7);
  assert.equal(sessionResponse.data.session.result.accuracy, 70);
  assert.equal(sessionResponse.data.session.result.passed, true);
  assert.equal(sessionResponse.data.session.result.levelCompleted, true);
  assert.equal(sessionResponse.data.session.result.levelUnlocked, true);
  assert.equal(sessionResponse.data.user.currentLevel, 2);

  sessionResponse = await postJson("/api/learning/levels/1/quiz/continue", cookie, {});
  assert.equal(sessionResponse.data.session.phase, "completed");

  const levelTwoSession = await getJson("/api/learning/levels/2/session", cookie);
  assert.equal(levelTwoSession.response.status, 200);
  assert.equal(levelTwoSession.data.session.phase, "learning");

  const masteryResponse = await getJson("/api/mastery", cookie);
  assert.equal(masteryResponse.response.status, 200);
  assert.ok(masteryResponse.data.terms.length >= 7);
});

async function answerCurrentQuestion(cookie, shouldBeCorrect) {
  const progress = await database.get(
    `SELECT quizState FROM userLearningProgress
     INNER JOIN users ON users.id = userLearningProgress.userId
     WHERE users.username = ? AND userLearningProgress.level = 1`,
    ["guidedlearner"]
  );
  const quizState = JSON.parse(progress.quizState);
  const questionIndex = quizState.currentQuestionIndex;
  const question = quizState.questions[questionIndex];
  let selectedAnswer = question.correctAnswer;
  if (!shouldBeCorrect) {
    for (let index = 0; index < question.options.length; index += 1) {
      if (question.options[index] !== question.correctAnswer) {
        selectedAnswer = question.options[index];
        break;
      }
    }
  }
  return postJson("/api/learning/levels/1/quiz/answer", cookie, {
    questionIndex,
    selectedAnswer
  });
}

async function createTerms(level, count) {
  const termTypes = ["word", "phrase", "sentence"];
  for (let index = 0; index < count; index += 1) {
    await database.run(
      `INSERT INTO aussieTerms (termContent, meaning, example, termType, level)
       VALUES (?, ?, ?, ?, ?)`,
      [
        `level ${level} expression ${index}`,
        `等级 ${level} 释义 ${index}`,
        `Level ${level} example ${index}`,
        termTypes[index % termTypes.length],
        level
      ]
    );
  }
}

async function registerUser(username, password) {
  const captcha = await getCaptcha();
  const registration = await postJson("/api/auth/register", captcha.cookie, {
    captchaAnswer: captcha.answer,
    password,
    username
  });
  assert.equal(registration.response.status, 201);
  return getResponseCookie(registration.response, captcha.cookie);
}

async function loginUser(username, password) {
  const captcha = await getCaptcha();
  const login = await postJson("/api/auth/login", captcha.cookie, {
    captchaAnswer: captcha.answer,
    password,
    username
  });
  assert.equal(login.response.status, 200);
  return getResponseCookie(login.response, captcha.cookie);
}

async function getCaptcha() {
  const response = await fetch(`${baseUrl}/api/auth/captcha`);
  const data = await response.json();
  const numbers = data.question.match(/\d+/g);
  return {
    answer: Number(numbers[0]) + Number(numbers[1]),
    cookie: getResponseCookie(response, "")
  };
}

async function getJson(route, cookie) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { Cookie: cookie }
  });
  const data = await response.json();
  return { data, response };
}

async function postJson(route, cookie, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", Cookie: cookie },
    method: "POST"
  });
  const data = await response.json();
  return { data, response };
}

function getResponseCookie(response, fallback) {
  const cookieHeader = response.headers.get("set-cookie");
  return cookieHeader ? cookieHeader.split(";")[0] : fallback;
}

function isStrictlyAscending(values) {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] < values[index - 1]) {
      return false;
    }
  }
  return true;
}

function listen(application) {
  return new Promise((resolve) => {
    const activeServer = application.listen(0, "127.0.0.1", () => resolve(activeServer));
  });
}

function closeServer(activeServer) {
  return new Promise((resolve, reject) => {
    activeServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
