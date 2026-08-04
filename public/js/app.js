import { api } from "./core/api.js";
import { getUser, setUser } from "./core/state.js";
import { showToast } from "./core/ui.js";
import { initializeAuth } from "./features/auth.js";
import { initializeAdmin, loadTerms, loadUsers } from "./features/admin.js";
import {
  initializeLevelNavigation,
  renderLevelNavigation,
  showLearningSession
} from "./features/levelNav.js";
import { initializeQuizEngine, resetQuizEngine, showQuizSession } from "./features/quizEngine.js";
import { loadMasteredContent } from "./features/masteredContent.js";

initializeAuth(showApplication, showAuthentication);
initializeAdmin();
initializeLevelNavigation(showQuizSession);
initializeQuizEngine(returnToLevelNavigation, showLearningSession, handleQuizSettled);
document.querySelector("#learningNavButton").addEventListener("click", showLearningNavigation);
document.querySelector("#masteryNavButton").addEventListener("click", showMastery);
restoreSession();

async function restoreSession() {
  try {
    const data = await api.get("/api/auth/me");
    if (data.user) {
      showApplication(data.user);
      return;
    }

    showAuthentication();
  } catch (error) {
    showAuthentication();
    showToast("暂时无法连接服务器", "error");
  }
}

function showApplication(user) {
  setUser(user);
  setView("authView", false);
  document.querySelector("#logoutButton").classList.remove("hidden");
  document.querySelector("#userSummary").textContent = user.username;

  if (user.role === "admin") {
    document.querySelector("#learnerNavigation").classList.add("hidden");
    document.querySelector("#learnerNavigation").classList.remove("flex");
    document.querySelector("#activeSection").textContent = "管理员控制台";
    setView("adminView", true);
    setView("lobbyView", false);
    setView("masteredView", false);
    loadTerms();
    loadUsers();
    return;
  }

  document.querySelector("#learnerNavigation").classList.remove("hidden");
  document.querySelector("#learnerNavigation").classList.add("flex");
  setView("adminView", false);
  showLearningNavigation();
}

function showAuthentication() {
  resetQuizEngine();
  setUser(null);
  setView("authView", true);
  setView("adminView", false);
  setView("lobbyView", false);
  setView("masteredView", false);
  document.querySelector("#learnerNavigation").classList.add("hidden");
  document.querySelector("#learnerNavigation").classList.remove("flex");
  document.querySelector("#logoutButton").classList.add("hidden");
  document.querySelector("#userSummary").textContent = "";
  document.querySelector("#activeSection").textContent = "";
}

function showLearningNavigation() {
  const user = getUser();
  if (!user || user.role !== "user") {
    return;
  }

  resetQuizEngine();
  setView("lobbyView", true);
  setView("masteredView", false);
  renderLevelNavigation(user);
  setActiveLearnerNavigation("learning");
}

function returnToLevelNavigation() {
  showLearningNavigation();
}

function showMastery() {
  const user = getUser();
  if (!user || user.role !== "user") {
    return;
  }

  resetQuizEngine();
  setView("lobbyView", false);
  setView("masteredView", true);
  document.querySelector("#activeSection").textContent = "已掌握内容";
  setActiveLearnerNavigation("mastery");
  loadMasteredContent();
}

function handleQuizSettled(user) {
  setUser(user);
}

function setActiveLearnerNavigation(activeSection) {
  const learningButton = document.querySelector("#learningNavButton");
  const masteryButton = document.querySelector("#masteryNavButton");
  styleLearnerNavigationButton(learningButton, activeSection === "learning");
  styleLearnerNavigationButton(masteryButton, activeSection === "mastery");
}

function styleLearnerNavigationButton(button, active) {
  button.classList.toggle("bg-ocean-50", active);
  button.classList.toggle("text-ocean-700", active);
  button.classList.toggle("text-slate-600", !active);
  if (active) {
    button.setAttribute("aria-current", "page");
    return;
  }

  button.removeAttribute("aria-current");
}

function setView(id, visible) {
  document.querySelector(`#${id}`).classList.toggle("hidden", !visible);
}
