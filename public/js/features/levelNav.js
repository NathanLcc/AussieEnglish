import { api } from "../core/api.js";
import { setButtonLoading, showToast } from "../core/ui.js";

const levelDetails = [
  { name: "入门", description: "从六级难度表达开始建立基础" },
  { name: "基础", description: "进入更复杂的抽象表达与语境" },
  { name: "中级", description: "理解跨学科与结构化论述" },
  { name: "进阶", description: "挑战高阶分析与长句表达" },
  { name: "熟练", description: "掌握 C2 与学术英语表达" }
];

const typeLabels = {
  word: "单词",
  phrase: "词组",
  sentence: "句子"
};

let currentLevel = 1;
let selectedLevel = null;
let sessionHandler = null;
let progressByLevel = {};

export function initializeLevelNavigation(onSessionChange) {
  sessionHandler = onSessionChange;
  document.querySelector("#backToLevelsButton").addEventListener("click", showLevelNavigation);
  document.querySelector("#previousTermButton").addEventListener("click", (event) => {
    navigate("previous", event.currentTarget);
  });
  document.querySelector("#nextTermButton").addEventListener("click", (event) => {
    navigate("next", event.currentTarget);
  });
}

export async function renderLevelNavigation(user) {
  currentLevel = normalizeLevel(user.currentLevel);
  selectedLevel = null;
  progressByLevel = {};
  document.querySelector("#lobbyUsername").textContent = user.username;
  document.querySelector("#lobbyLevel").textContent = currentLevel;
  document.querySelector("#journeyLevel").textContent = currentLevel;
  renderLevelCards();
  showLevelNavigation();

  try {
    const data = await api.get("/api/learning/progress");
    for (let index = 0; index < data.progress.length; index += 1) {
      progressByLevel[data.progress[index].level] = data.progress[index];
    }
    renderLevelCards();
  } catch (error) {
    showToast(error.message, "error");
  }
}

export function showLevelNavigation() {
  setLearningView("levelNavigationView");
  document.querySelector("#activeSection").textContent = "选择等级";
}

export function showLearningSession(session) {
  if (!session || session.phase !== "learning") {
    if (sessionHandler) {
      sessionHandler(session);
    }
    return;
  }

  selectedLevel = session.level;
  renderTerm(session);
  setLearningView("learningPreviewView");
  document.querySelector("#activeSection").textContent = `Level ${selectedLevel} 分段学习`;
}

function normalizeLevel(level) {
  const parsedLevel = Number(level);
  if (!Number.isInteger(parsedLevel)) {
    return 1;
  }
  return Math.min(5, Math.max(1, parsedLevel));
}

function renderLevelCards() {
  const levelCards = document.querySelector("#levelCards");
  levelCards.replaceChildren();

  for (let level = 1; level <= 5; level += 1) {
    const locked = level > currentLevel;
    const progress = progressByLevel[level];
    const card = document.createElement("button");
    card.type = "button";
    card.disabled = locked;
    card.className = locked
      ? "group relative min-h-56 cursor-not-allowed overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-6 text-left opacity-70"
      : "group relative min-h-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-ocean-300 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-ocean-100";

    const number = document.createElement("span");
    number.className = locked
      ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-xl font-black text-slate-500"
      : "flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-700 text-xl font-black text-white shadow-lg shadow-ocean-700/20";
    number.textContent = String(level);

    const status = document.createElement("span");
    status.className = locked
      ? "absolute right-5 top-5 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-500"
      : "absolute right-5 top-5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700";
    status.textContent = getStatusText(level, locked, progress);

    const title = document.createElement("span");
    title.className = "mt-7 block text-2xl font-black text-slate-900";
    title.textContent = `Level ${level} · ${levelDetails[level - 1].name}`;

    const description = document.createElement("span");
    description.className = "mt-2 block text-sm leading-6 text-slate-500";
    description.textContent = locked
      ? "完成前面的学习旅程后解锁"
      : levelDetails[level - 1].description;

    card.appendChild(number);
    card.appendChild(status);
    card.appendChild(title);
    card.appendChild(description);

    if (!locked) {
      const action = document.createElement("span");
      action.className = "mt-5 inline-flex items-center text-sm font-black text-ocean-700";
      action.textContent = getActionText(progress);
      card.appendChild(action);
      card.addEventListener("click", () => loadLevelSession(level, card));
    }
    levelCards.appendChild(card);
  }
}

function getStatusText(level, locked, progress) {
  if (locked) {
    return "🔒 未解锁";
  }
  if (!progress) {
    return level === currentLevel ? "当前等级" : "✓ 已解锁";
  }
  if (progress.phase === "completed") {
    return "✓ 已完成";
  }
  if (progress.phase === "quiz") {
    return "测验中";
  }
  if (progress.phase === "result") {
    return "待处理结果";
  }
  return `${progress.position} / ${progress.totalTerms}`;
}

function getActionText(progress) {
  if (!progress) {
    return "开始随机学习 →";
  }
  if (progress.phase === "quiz") {
    return "继续未完成的测验 →";
  }
  if (progress.phase === "result") {
    return "查看测验结果 →";
  }
  if (progress.phase === "completed") {
    return "查看完成记录 →";
  }
  return `从第 ${progress.position} 条继续 →`;
}

async function loadLevelSession(level, card) {
  const originalContent = card.innerHTML;
  card.disabled = true;
  card.innerHTML = `<span class="flex min-h-44 items-center justify-center text-sm font-black text-ocean-700">正在恢复 Level ${level} 进度...</span>`;
  try {
    const data = await api.get(`/api/learning/levels/${level}/session`);
    selectedLevel = level;
    showLearningSession(data.session);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    card.innerHTML = originalContent;
    card.disabled = false;
  }
}

function renderTerm(session) {
  const term = session.term;
  document.querySelector("#previewLevelTitle").textContent = `Level ${session.level} · 第 ${session.batchNumber} 批`;
  document.querySelector("#previewTermCount").textContent = `本批 ${session.batchProgress} / ${session.batchSize} · 总进度 ${session.position} / ${session.totalTerms}`;
  document.querySelector("#learningProgressBar").style.width = session.totalTerms === 0
    ? "0%"
    : `${(session.position / session.totalTerms) * 100}%`;

  const card = document.querySelector("#singleTermCard");
  const emptyState = document.querySelector("#emptyPreview");
  card.classList.toggle("hidden", !term);
  emptyState.classList.toggle("hidden", Boolean(term));
  if (term) {
    document.querySelector("#singleTermType").textContent = typeLabels[term.termType] || "学习内容";
    document.querySelector("#singleTermEnglish").textContent = term.termContent;
    document.querySelector("#singleTermChinese").textContent = term.meaning;
    document.querySelector("#singleTermExample").textContent = `“${term.example}”`;
  }

  const previousButton = document.querySelector("#previousTermButton");
  const nextButton = document.querySelector("#nextTermButton");
  previousButton.disabled = !session.canGoPrevious;
  nextButton.disabled = !term;
  nextButton.textContent = session.nextStartsQuiz ? "开始本批测验 →" : "下一个 →";
}

async function navigate(direction, button) {
  if (selectedLevel === null) {
    return;
  }
  setButtonLoading(button, true, direction === "next" ? "正在保存..." : "正在返回...");
  let nextSession = null;
  try {
    const data = await api.post(`/api/learning/levels/${selectedLevel}/navigate`, { direction });
    nextSession = data.session;
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
  if (nextSession) {
    showLearningSession(nextSession);
  }
}

function setLearningView(visibleViewId) {
  const viewIds = ["levelNavigationView", "learningPreviewView", "quizView"];
  for (let index = 0; index < viewIds.length; index += 1) {
    document.querySelector(`#${viewIds[index]}`).classList.toggle(
      "hidden",
      viewIds[index] !== visibleViewId
    );
  }
}
