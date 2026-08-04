import { api } from "../core/api.js";
import { setButtonLoading, showToast } from "../core/ui.js";

let captchaLoading = false;

export function initializeAuth(onAuthenticated, onLoggedOut) {
  const loginTab = document.querySelector("#loginTab");
  const registerTab = document.querySelector("#registerTab");
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  const logoutButton = document.querySelector("#logoutButton");

  loginTab.addEventListener("click", () => {
    showAuthMode("login");
    refreshCaptcha();
  });
  registerTab.addEventListener("click", () => {
    showAuthMode("register");
    refreshCaptcha();
  });
  document.querySelector("#loginCaptchaRefreshButton").addEventListener("click", refreshCaptcha);
  document.querySelector("#registerCaptchaRefreshButton").addEventListener("click", refreshCaptcha);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, "正在登录...");

    try {
      const data = await api.post("/api/auth/login", {
        username: document.querySelector("#loginUsername").value,
        password: document.querySelector("#loginPassword").value,
        captchaAnswer: document.querySelector("#loginCaptchaAnswer").value
      });
      loginForm.reset();
      showToast("登录成功，欢迎回来");
      onAuthenticated(data.user);
    } catch (error) {
      showToast(error.message, "error");
      refreshCaptcha();
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#registerPassword").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    if (password !== confirmPassword) {
      showToast("两次输入的密码不一致", "error");
      return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, "正在创建...");

    try {
      const data = await api.post("/api/auth/register", {
        username: document.querySelector("#registerUsername").value,
        password,
        captchaAnswer: document.querySelector("#registerCaptchaAnswer").value
      });
      registerForm.reset();
      showToast("注册成功，学习档案已创建");
      onAuthenticated(data.user);
    } catch (error) {
      showToast(error.message, "error");
      refreshCaptcha();
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await api.post("/api/auth/logout");
      showToast("已安全退出");
      onLoggedOut();
      refreshCaptcha();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  refreshCaptcha();
}

async function refreshCaptcha() {
  if (captchaLoading) {
    return;
  }
  captchaLoading = true;
  const loginQuestion = document.querySelector("#loginCaptchaQuestion");
  const registerQuestion = document.querySelector("#registerCaptchaQuestion");
  loginQuestion.textContent = "加载中...";
  registerQuestion.textContent = "加载中...";
  document.querySelector("#loginCaptchaAnswer").value = "";
  document.querySelector("#registerCaptchaAnswer").value = "";
  try {
    const data = await api.get("/api/auth/captcha");
    loginQuestion.textContent = data.question;
    registerQuestion.textContent = data.question;
  } catch (error) {
    loginQuestion.textContent = "加载失败";
    registerQuestion.textContent = "加载失败";
    showToast(error.message, "error");
  } finally {
    captchaLoading = false;
  }
}

function showAuthMode(mode) {
  const loginMode = mode === "login";
  const loginTab = document.querySelector("#loginTab");
  const registerTab = document.querySelector("#registerTab");
  document.querySelector("#loginForm").classList.toggle("hidden", !loginMode);
  document.querySelector("#registerForm").classList.toggle("hidden", loginMode);
  document.querySelector("#authTitle").textContent = loginMode ? "欢迎回来" : "创建学习账号";
  document.querySelector("#authDescription").textContent = loginMode
    ? "登录后继续你的澳洲英语学习之旅。"
    : "加入学习大厅，从 Level 1 开始积累。";
  styleTab(loginTab, loginMode);
  styleTab(registerTab, !loginMode);
}

function styleTab(tab, active) {
  tab.setAttribute("aria-selected", String(active));
  tab.classList.toggle("bg-white", active);
  tab.classList.toggle("shadow-sm", active);
  tab.classList.toggle("text-ocean-700", active);
  tab.classList.toggle("font-black", active);
  tab.classList.toggle("text-slate-500", !active);
  tab.classList.toggle("font-bold", !active);
}
