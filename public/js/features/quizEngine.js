import { api } from "../core/api.js";
import { showToast } from "../core/ui.js";

let activeSession = null;
let exitHandler = null;
let continueHandler = null;
let settledHandler = null;
let feedbackTimer = null;

export function initializeQuizEngine(onExit, onContinue, onSettled) {
  exitHandler = onExit;
  continueHandler = onContinue;
  settledHandler = onSettled;
  document.querySelector("#exitQuizButton").addEventListener("click", exitQuiz);
  document.querySelector("#quizBackToLevelsButton").addEventListener("click", exitQuiz);
  document.querySelector("#quizReviewButton").addEventListener("click", continueLearning);
  document.querySelector("#retryQuizButton").addEventListener("click", retryQuiz);
}

export function showQuizSession(session) {
  clearFeedbackTimer();
  activeSession = session;
  showQuizView();
  if (session.phase === "quiz") {
    renderQuestion(session);
    return;
  }
  if (session.phase === "result" || session.phase === "completed") {
    renderResult(session);
  }
}

export function resetQuizEngine() {
  clearFeedbackTimer();
  activeSession = null;
}

function renderQuestion(session) {
  const quiz = session.quiz;
  const question = quiz.question;
  document.querySelector("#quizQuestionPanel").classList.remove("hidden");
  document.querySelector("#quizResultPanel").classList.add("hidden");
  document.querySelector("#quizLevelLabel").textContent = `Level ${session.level} · 第 ${session.batchNumber} 批`;
  document.querySelector("#quizProgress").textContent = `${quiz.currentQuestionIndex + 1}/${quiz.totalQuestions}`;
  document.querySelector("#quizProgressBar").style.width = `${((quiz.currentQuestionIndex + 1) / quiz.totalQuestions) * 100}%`;
  document.querySelector("#quizDirection").textContent = question.direction === "englishToChinese"
    ? "看英文 · 选择中文释义"
    : "看中文 · 选择英文表达";
  document.querySelector("#quizPrompt").textContent = question.prompt;
  document.querySelector("#answerFeedback").textContent = "";
  document.querySelector("#answerFeedback").className = "mt-5 min-h-6 text-center text-sm font-black";

  const options = document.querySelector("#quizOptions");
  options.replaceChildren();
  for (let index = 0; index < question.options.length; index += 1) {
    options.appendChild(createOptionButton(question.options[index], index));
  }
}

function createOptionButton(option, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.answer = option;
  button.className = "group flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left font-bold text-slate-700 transition hover:border-ocean-400 hover:bg-ocean-50 focus:outline-none focus:ring-4 focus:ring-ocean-100 disabled:cursor-default sm:p-5";

  const marker = document.createElement("span");
  marker.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500 group-hover:bg-white";
  marker.textContent = String.fromCharCode(65 + index);
  const text = document.createElement("span");
  text.className = "break-words leading-6";
  text.textContent = option;
  button.appendChild(marker);
  button.appendChild(text);
  button.addEventListener("click", () => submitAnswer(button));
  return button;
}

async function submitAnswer(selectedButton) {
  if (!activeSession || activeSession.phase !== "quiz") {
    return;
  }
  setOptionButtonsDisabled(true);
  const questionIndex = activeSession.quiz.currentQuestionIndex;
  try {
    const data = await api.post(
      `/api/learning/levels/${activeSession.level}/quiz/answer`,
      { questionIndex, selectedAnswer: selectedButton.dataset.answer }
    );
    if (data.user && settledHandler) {
      settledHandler(data.user);
    }
    if (data.session.phase !== "quiz") {
      showQuizSession(data.session);
      return;
    }

    showAnswerFeedback(selectedButton, data.answerResult);
    feedbackTimer = window.setTimeout(() => {
      feedbackTimer = null;
      showQuizSession(data.session);
    }, 700);
  } catch (error) {
    if (error.status === 409) {
      await reloadSession();
    } else {
      setOptionButtonsDisabled(false);
      showToast(error.message, "error");
    }
  }
}

function showAnswerFeedback(selectedButton, answerResult) {
  const buttons = document.querySelectorAll("#quizOptions button");
  for (let index = 0; index < buttons.length; index += 1) {
    if (buttons[index].dataset.answer === answerResult.correctAnswer) {
      applyCorrectStyle(buttons[index]);
    } else if (buttons[index] === selectedButton) {
      applyIncorrectStyle(buttons[index]);
    }
  }
  document.querySelector("#answerFeedback").textContent = answerResult.correct
    ? "回答正确！进度已保存"
    : "回答错误，已标出正确答案";
  document.querySelector("#answerFeedback").className = answerResult.correct
    ? "mt-5 min-h-6 text-center text-sm font-black text-emerald-600"
    : "mt-5 min-h-6 text-center text-sm font-black text-rose-600";
}

function renderResult(session) {
  const result = session.result;
  document.querySelector("#quizQuestionPanel").classList.add("hidden");
  document.querySelector("#quizResultPanel").classList.remove("hidden");
  document.querySelector("#quizProgress").textContent = `${result.totalQuestions}/${result.totalQuestions}`;
  document.querySelector("#quizProgressBar").style.width = "100%";
  document.querySelector("#quizScore").textContent = String(result.correctCount);
  document.querySelector("#quizTotal").textContent = String(result.totalQuestions);
  document.querySelector("#quizResultTitle").textContent = `答对 ${result.correctCount} 题，准确率 ${result.accuracy}%`;
  document.querySelector("#quizResultMessage").textContent = getResultMessage(session);

  const continueButton = document.querySelector("#quizReviewButton");
  const retryButton = document.querySelector("#retryQuizButton");
  continueButton.classList.toggle("hidden", !result.passed || session.phase === "completed");
  retryButton.classList.toggle("hidden", result.passed || session.phase === "completed");
  continueButton.textContent = result.levelCompleted ? "完成本等级" : "继续学习下一批";
}

function getResultMessage(session) {
  const result = session.result;
  if (!result.passed) {
    return "未达到 70%，请重新挑战本批测验";
  }
  if (session.phase === "completed") {
    return "这个等级已经全部完成";
  }
  if (result.levelUnlocked) {
    return "恭喜完成本等级并解锁下一级";
  }
  if (result.levelCompleted) {
    return "恭喜完成本等级全部学习内容";
  }
  return "测验通过，可以进入下一批 20 条内容";
}

async function retryQuiz() {
  if (!activeSession) {
    return;
  }
  setResultButtonsDisabled(true);
  try {
    const data = await api.post(`/api/learning/levels/${activeSession.level}/quiz/retry`);
    showQuizSession(data.session);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setResultButtonsDisabled(false);
  }
}

async function continueLearning() {
  if (!activeSession) {
    return;
  }
  setResultButtonsDisabled(true);
  try {
    const data = await api.post(`/api/learning/levels/${activeSession.level}/quiz/continue`);
    if (data.session.phase === "completed") {
      exitQuiz();
      return;
    }
    if (continueHandler) {
      continueHandler(data.session);
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setResultButtonsDisabled(false);
  }
}

async function reloadSession() {
  try {
    const data = await api.get(`/api/learning/levels/${activeSession.level}/session`);
    showQuizSession(data.session);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function setOptionButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll("#quizOptions button");
  for (let index = 0; index < buttons.length; index += 1) {
    buttons[index].disabled = disabled;
  }
}

function setResultButtonsDisabled(disabled) {
  const buttons = document.querySelectorAll("#quizResultPanel button");
  for (let index = 0; index < buttons.length; index += 1) {
    buttons[index].disabled = disabled;
  }
}

function applyCorrectStyle(button) {
  button.className = "flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-left font-bold text-emerald-800 shadow-sm sm:p-5";
  button.firstElementChild.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white";
  button.firstElementChild.textContent = "✓";
}

function applyIncorrectStyle(button) {
  button.className = "flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 border-rose-500 bg-rose-50 p-4 text-left font-bold text-rose-800 sm:p-5";
  button.firstElementChild.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-sm font-black text-white";
  button.firstElementChild.textContent = "×";
}

function showQuizView() {
  document.querySelector("#levelNavigationView").classList.add("hidden");
  document.querySelector("#learningPreviewView").classList.add("hidden");
  document.querySelector("#quizView").classList.remove("hidden");
  document.querySelector("#activeSection").textContent = activeSession
    ? `Level ${activeSession.level} 批次测验`
    : "批次测验";
}

function exitQuiz() {
  clearFeedbackTimer();
  if (exitHandler) {
    exitHandler();
  }
}

function clearFeedbackTimer() {
  if (feedbackTimer !== null) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
}
