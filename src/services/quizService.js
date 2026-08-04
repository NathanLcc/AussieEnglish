const masteryRepository = require("../repositories/masteryRepository");
const termRepository = require("../repositories/termRepository");
const userRepository = require("../repositories/userRepository");

async function submitQuiz(user, submission) {
  const validation = await validateSubmission(user, submission);
  if (!validation.valid) {
    return validation;
  }

  const correctCount = validation.correctTermIds.length;
  const passed = correctCount * 100 >= validation.totalQuestions * 70;
  let masteryAddedCount = 0;

  for (let index = 0; index < validation.correctTermIds.length; index += 1) {
    const added = await masteryRepository.addMastery(user.id, validation.correctTermIds[index]);
    if (added) {
      masteryAddedCount += 1;
    }
  }

  const updatedUser = await userRepository.findUserById(user.id);
  return {
    valid: true,
    result: {
      accuracy: Math.round((correctCount / validation.totalQuestions) * 100),
      correctCount,
      level: validation.level,
      levelUnlocked: false,
      masteryAddedCount,
      passed,
      totalQuestions: validation.totalQuestions
    },
    user: updatedUser
  };
}

async function validateSubmission(user, submission) {
  const level = Number(submission.level);
  const totalQuestions = Number(submission.totalQuestions);
  const submittedTermIds = submission.correctTermIds;

  if (!Number.isInteger(level) || level < 1 || level > 5) {
    return { valid: false, message: "测验等级必须是 1 到 5" };
  }

  if (level > user.currentLevel) {
    return { valid: false, message: "该等级尚未解锁" };
  }

  if (!Number.isInteger(totalQuestions) || totalQuestions < 1 || totalQuestions > 10) {
    return { valid: false, message: "测验题目数量必须是 1 到 10" };
  }

  if (!Array.isArray(submittedTermIds)) {
    return { valid: false, message: "答对条目列表格式无效" };
  }

  const correctTermIds = [];
  const seenTermIds = new Set();
  for (let index = 0; index < submittedTermIds.length; index += 1) {
    const termId = Number(submittedTermIds[index]);
    if (!Number.isInteger(termId) || termId < 1) {
      return { valid: false, message: "答对条目编号无效" };
    }

    if (!seenTermIds.has(termId)) {
      seenTermIds.add(termId);
      correctTermIds.push(termId);
    }
  }

  if (correctTermIds.length > totalQuestions) {
    return { valid: false, message: "答对条目数量不能超过测验题目数量" };
  }

  const levelTerms = await termRepository.findTermsByLevel(level);
  const maximumQuestionCount = Math.min(10, levelTerms.length);
  if (totalQuestions !== maximumQuestionCount) {
    return { valid: false, message: "测验题目数量与当前等级内容不匹配" };
  }

  for (let index = 0; index < correctTermIds.length; index += 1) {
    let belongsToLevel = false;
    for (let termIndex = 0; termIndex < levelTerms.length; termIndex += 1) {
      if (levelTerms[termIndex].id === correctTermIds[index]) {
        belongsToLevel = true;
        break;
      }
    }

    if (!belongsToLevel) {
      return { valid: false, message: "答对条目不属于本次测验等级" };
    }
  }

  return { correctTermIds, level, totalQuestions, valid: true };
}

module.exports = { submitQuiz };
