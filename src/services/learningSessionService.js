const masteryRepository = require("../repositories/masteryRepository");
const progressRepository = require("../repositories/progressRepository");
const termRepository = require("../repositories/termRepository");
const userRepository = require("../repositories/userRepository");

const batchSize = 20;
const quizSize = 10;
const passPercentage = 70;

const fallbackEnglishOptions = [
  "None of these",
  "Not listed here",
  "Another expression",
  "Unknown answer"
];

const fallbackChineseOptions = [
  "以上都不是",
  "未列出的释义",
  "另一种表达",
  "暂不确定"
];

async function getSession(user, level) {
  const progress = await getOrCreateProgress(user.id, level);
  return toPublicSession(progress);
}

async function getProgressSummaries(userId) {
  const progressRows = await progressRepository.findProgressByUserId(userId);
  const summaries = [];
  for (let index = 0; index < progressRows.length; index += 1) {
    const progress = hydrateProgress(progressRows[index]);
    summaries.push({
      level: progress.level,
      phase: progress.phase,
      position: progress.termOrder.length === 0 ? 0 : progress.currentPosition + 1,
      totalTerms: progress.termOrder.length,
      updatedAt: progress.updatedAt
    });
  }
  return summaries;
}

async function navigate(user, level, direction) {
  const progress = await getOrCreateProgress(user.id, level);
  if (progress.phase !== "learning") {
    return { valid: false, message: "当前阶段不是学习浏览" };
  }

  if (direction === "previous") {
    if (progress.currentPosition > progress.batchStartPosition) {
      progress.currentPosition -= 1;
      await progressRepository.updateProgress(progress);
    }
    return { session: await toPublicSession(progress), valid: true };
  }

  if (direction !== "next") {
    return { valid: false, message: "导航方向无效" };
  }

  const currentBatchEnd = Math.min(
    progress.batchStartPosition + batchSize,
    progress.termOrder.length
  );
  if (progress.currentPosition + 1 < currentBatchEnd) {
    progress.currentPosition += 1;
    await progressRepository.updateProgress(progress);
    return { session: await toPublicSession(progress), valid: true };
  }

  if (progress.termOrder.length === 0) {
    return { session: await toPublicSession(progress), valid: true };
  }

  progress.quizState = await createQuizState(progress);
  progress.phase = "quiz";
  await progressRepository.updateProgress(progress);
  return { session: await toPublicSession(progress), valid: true };
}

async function answerQuiz(user, level, answer) {
  const progress = await getOrCreateProgress(user.id, level);
  if (progress.phase !== "quiz" || !progress.quizState) {
    return { valid: false, message: "当前没有进行中的测验" };
  }

  const selectedAnswer = typeof answer.selectedAnswer === "string"
    ? answer.selectedAnswer
    : "";
  const questionIndex = Number(answer.questionIndex);
  if (questionIndex !== progress.quizState.currentQuestionIndex) {
    return { conflict: true, valid: false, message: "题目状态已更新，请继续当前题目" };
  }

  const question = progress.quizState.questions[questionIndex];
  if (!question || !containsValue(question.options, selectedAnswer)) {
    return { valid: false, message: "请选择有效答案" };
  }

  const correct = selectedAnswer === question.correctAnswer;
  if (correct) {
    progress.quizState.score += 1;
    progress.quizState.correctTermIds.push(question.termId);
  }
  progress.quizState.currentQuestionIndex += 1;

  if (progress.quizState.currentQuestionIndex >= progress.quizState.questions.length) {
    const settlement = await settleQuiz(user, progress);
    return { session: settlement.session, user: settlement.user, valid: true };
  }

  await progressRepository.updateProgress(progress);
  return {
    answerResult: { correct, correctAnswer: question.correctAnswer },
    session: await toPublicSession(progress),
    user,
    valid: true
  };
}

async function retryQuiz(user, level) {
  const progress = await getOrCreateProgress(user.id, level);
  if (progress.phase !== "result" || !progress.quizState || progress.quizState.result.passed) {
    return { valid: false, message: "当前测验不需要重试" };
  }

  progress.quizState = await createQuizState(progress);
  progress.phase = "quiz";
  await progressRepository.updateProgress(progress);
  return { session: await toPublicSession(progress), valid: true };
}

async function continueAfterQuiz(user, level) {
  const progress = await getOrCreateProgress(user.id, level);
  if (progress.phase !== "result" || !progress.quizState || !progress.quizState.result.passed) {
    return { valid: false, message: "需要先通过当前测验" };
  }

  if (progress.quizState.result.levelCompleted) {
    progress.phase = "completed";
    await progressRepository.updateProgress(progress);
    return { session: await toPublicSession(progress), valid: true };
  }

  progress.batchStartPosition = Math.min(
    progress.batchStartPosition + batchSize,
    Math.max(0, progress.termOrder.length - 1)
  );
  progress.currentPosition = progress.batchStartPosition;
  progress.phase = "learning";
  progress.quizState = null;
  await progressRepository.updateProgress(progress);
  return { session: await toPublicSession(progress), valid: true };
}

async function settleQuiz(user, progress) {
  const questionCount = progress.quizState.questions.length;
  const correctCount = progress.quizState.score;
  const accuracy = questionCount === 0 ? 0 : Math.round((correctCount / questionCount) * 100);
  const passed = correctCount * 100 >= questionCount * passPercentage;
  const batchEnd = Math.min(progress.batchStartPosition + batchSize, progress.termOrder.length);
  const levelCompleted = passed && batchEnd >= progress.termOrder.length;
  let masteryAddedCount = 0;

  for (let index = 0; index < progress.quizState.correctTermIds.length; index += 1) {
    const added = await masteryRepository.addMastery(
      user.id,
      progress.quizState.correctTermIds[index]
    );
    if (added) {
      masteryAddedCount += 1;
    }
  }

  let levelUnlocked = false;
  if (levelCompleted && progress.level === user.currentLevel && user.currentLevel < 5) {
    levelUnlocked = await userRepository.promoteCurrentLevel(user.id, progress.level);
  }

  progress.quizState.result = {
    accuracy,
    correctCount,
    levelCompleted,
    levelUnlocked,
    masteryAddedCount,
    passed,
    totalQuestions: questionCount
  };
  progress.phase = "result";
  await progressRepository.updateProgress(progress);
  const updatedUser = await userRepository.findUserById(user.id);
  return { session: await toPublicSession(progress), user: updatedUser };
}

async function getOrCreateProgress(userId, level) {
  const terms = await termRepository.findTermsByLevel(level);
  let progressRow = await progressRepository.findProgress(userId, level);
  if (!progressRow) {
    const termOrder = [];
    for (let index = 0; index < terms.length; index += 1) {
      termOrder.push(terms[index].id);
    }
    shuffleInPlace(termOrder);
    progressRow = await progressRepository.createProgress(userId, level, termOrder);
  }

  const progress = hydrateProgress(progressRow);
  const reconciled = reconcileTermOrder(progress, terms);
  if (reconciled) {
    const updatedRow = await progressRepository.updateProgress(progress);
    return hydrateProgress(updatedRow);
  }
  return progress;
}

function reconcileTermOrder(progress, terms) {
  const previousPosition = progress.currentPosition;
  const availableIds = new Set();
  for (let index = 0; index < terms.length; index += 1) {
    availableIds.add(terms[index].id);
  }

  const currentTermId = progress.termOrder[progress.currentPosition];
  const nextOrder = [];
  const includedIds = new Set();
  for (let index = 0; index < progress.termOrder.length; index += 1) {
    const termId = progress.termOrder[index];
    if (availableIds.has(termId) && !includedIds.has(termId)) {
      includedIds.add(termId);
      nextOrder.push(termId);
    }
  }

  const newTermIds = [];
  for (let index = 0; index < terms.length; index += 1) {
    if (!includedIds.has(terms[index].id)) {
      newTermIds.push(terms[index].id);
    }
  }
  shuffleInPlace(newTermIds);
  for (let index = 0; index < newTermIds.length; index += 1) {
    nextOrder.push(newTermIds[index]);
  }

  if (sameValues(progress.termOrder, nextOrder)) {
    return false;
  }

  progress.termOrder = nextOrder;
  progress.currentPosition = findValueIndex(nextOrder, currentTermId);
  if (progress.currentPosition < 0) {
    progress.currentPosition = Math.min(
      previousPosition,
      Math.max(0, nextOrder.length - 1)
    );
  }
  progress.currentPosition = Math.max(0, progress.currentPosition);
  progress.batchStartPosition = Math.floor(progress.currentPosition / batchSize) * batchSize;
  progress.phase = "learning";
  progress.quizState = null;
  return true;
}

async function createQuizState(progress) {
  const batchEnd = Math.min(progress.batchStartPosition + batchSize, progress.termOrder.length);
  const batchTerms = [];
  for (let index = progress.batchStartPosition; index < batchEnd; index += 1) {
    const term = await termRepository.findTermById(progress.termOrder[index]);
    if (term) {
      batchTerms.push(term);
    }
  }

  const questionTerms = [];
  const shuffledTerms = [];
  for (let index = 0; index < batchTerms.length; index += 1) {
    shuffledTerms.push(batchTerms[index]);
  }
  shuffleInPlace(shuffledTerms);
  const questionCount = Math.min(quizSize, shuffledTerms.length);
  for (let index = 0; index < questionCount; index += 1) {
    questionTerms.push(shuffledTerms[index]);
  }

  const questions = [];
  for (let index = 0; index < questionTerms.length; index += 1) {
    const direction = Math.random() < 0.5 ? "englishToChinese" : "chineseToEnglish";
    questions.push(createQuestion(questionTerms[index], batchTerms, direction));
  }

  return {
    correctTermIds: [],
    currentQuestionIndex: 0,
    questions,
    result: null,
    score: 0
  };
}

function createQuestion(term, batchTerms, direction) {
  const asksForChinese = direction === "englishToChinese";
  const correctAnswer = asksForChinese ? term.meaning : term.termContent;
  const options = [correctAnswer];
  const candidates = [];
  for (let index = 0; index < batchTerms.length; index += 1) {
    const candidate = asksForChinese ? batchTerms[index].meaning : batchTerms[index].termContent;
    if (candidate !== correctAnswer && !containsValue(candidates, candidate)) {
      candidates.push(candidate);
    }
  }
  shuffleInPlace(candidates);
  for (let index = 0; index < candidates.length && options.length < 4; index += 1) {
    options.push(candidates[index]);
  }

  const fallbacks = asksForChinese ? fallbackChineseOptions : fallbackEnglishOptions;
  for (let index = 0; index < fallbacks.length && options.length < 4; index += 1) {
    if (!containsValue(options, fallbacks[index])) {
      options.push(fallbacks[index]);
    }
  }
  shuffleInPlace(options);
  return {
    correctAnswer,
    direction,
    options,
    prompt: asksForChinese ? term.termContent : term.meaning,
    termId: term.id
  };
}

async function toPublicSession(progress) {
  const session = {
    batchNumber: Math.floor(progress.batchStartPosition / batchSize) + 1,
    batchProgress: progress.termOrder.length === 0
      ? 0
      : progress.currentPosition - progress.batchStartPosition + 1,
    batchSize: Math.min(batchSize, progress.termOrder.length - progress.batchStartPosition),
    canGoPrevious: progress.phase === "learning"
      && progress.currentPosition > progress.batchStartPosition,
    level: progress.level,
    phase: progress.phase,
    position: progress.termOrder.length === 0 ? 0 : progress.currentPosition + 1,
    totalTerms: progress.termOrder.length
  };

  if (progress.phase === "learning") {
    const termId = progress.termOrder[progress.currentPosition];
    session.term = termId ? await termRepository.findTermById(termId) : null;
    session.nextStartsQuiz = progress.termOrder.length > 0
      && progress.currentPosition + 1 >= Math.min(
        progress.batchStartPosition + batchSize,
        progress.termOrder.length
      );
  }

  if (progress.phase === "quiz" && progress.quizState) {
    const questionIndex = progress.quizState.currentQuestionIndex;
    const question = progress.quizState.questions[questionIndex];
    session.quiz = {
      currentQuestionIndex: questionIndex,
      question: question ? {
        direction: question.direction,
        options: question.options,
        prompt: question.prompt
      } : null,
      score: progress.quizState.score,
      totalQuestions: progress.quizState.questions.length
    };
  }

  if ((progress.phase === "result" || progress.phase === "completed") && progress.quizState) {
    session.result = progress.quizState.result;
  }
  return session;
}

function hydrateProgress(row) {
  return {
    batchStartPosition: row.batchStartPosition,
    currentPosition: row.currentPosition,
    id: row.id,
    level: row.level,
    phase: row.phase,
    quizState: parseJson(row.quizState, null),
    termOrder: parseJson(row.termOrder, []),
    updatedAt: row.updatedAt,
    userId: row.userId
  };
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function containsValue(values, target) {
  return findValueIndex(values, target) >= 0;
}

function findValueIndex(values, target) {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === target) {
      return index;
    }
  }
  return -1;
}

function sameValues(firstValues, secondValues) {
  if (firstValues.length !== secondValues.length) {
    return false;
  }
  for (let index = 0; index < firstValues.length; index += 1) {
    if (firstValues[index] !== secondValues[index]) {
      return false;
    }
  }
  return true;
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryItem = items[index];
    items[index] = items[randomIndex];
    items[randomIndex] = temporaryItem;
  }
}

module.exports = {
  answerQuiz,
  continueAfterQuiz,
  getProgressSummaries,
  getSession,
  navigate,
  retryQuiz
};
