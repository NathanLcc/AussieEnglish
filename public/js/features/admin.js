import { api } from "../core/api.js";
import { createCell, setButtonLoading, showToast } from "../core/ui.js";

let terms = [];
let users = [];
let editingId = null;

export function initializeAdmin() {
  document.querySelector("#openTermFormButton").addEventListener("click", () => openTermForm());
  document.querySelector("#closeTermFormButton").addEventListener("click", closeTermForm);
  document.querySelector("#cancelTermButton").addEventListener("click", closeTermForm);
  document.querySelector("#refreshTermsButton").addEventListener("click", loadTerms);
  document.querySelector("#refreshUsersButton").addEventListener("click", loadUsers);
  document.querySelector("#termForm").addEventListener("submit", saveTerm);
}

export async function loadUsers() {
  const refreshButton = document.querySelector("#refreshUsersButton");
  setButtonLoading(refreshButton, true, "刷新中...");

  try {
    const data = await api.get("/api/admin/users");
    users = Array.isArray(data.users) ? data.users : [];
    renderUsers();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(refreshButton, false);
  }
}

export async function loadTerms() {
  const refreshButton = document.querySelector("#refreshTermsButton");
  setButtonLoading(refreshButton, true, "刷新中...");

  try {
    const data = await api.get("/api/admin/terms");
    terms = [];
    for (let index = 0; index < data.terms.length; index += 1) {
      terms.push(data.terms[index]);
    }
    renderTerms();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(refreshButton, false);
  }
}

function renderTerms() {
  const tableBody = document.querySelector("#termsTableBody");
  const emptyTerms = document.querySelector("#emptyTerms");
  tableBody.replaceChildren();
  document.querySelector("#termCount").textContent = `共 ${terms.length} 条内容`;
  emptyTerms.classList.toggle("hidden", terms.length !== 0);

  for (let index = 0; index < terms.length; index += 1) {
    const term = terms[index];
    const row = document.createElement("tr");
    row.className = "transition hover:bg-slate-50";
    row.appendChild(createCell(term.termContent, "max-w-[220px] font-black text-slate-900"));
    row.appendChild(createCell(term.meaning, "max-w-[200px] text-sm text-slate-600"));
    row.appendChild(createCell(term.example, "max-w-[280px] text-sm italic text-slate-500"));
    row.appendChild(createTypeCell(term.termType));
    row.appendChild(createLevelCell(term.level));
    row.appendChild(createActionCell(term));
    tableBody.appendChild(row);
  }
}

function renderUsers() {
  const tableBody = document.querySelector("#usersTableBody");
  const emptyUsers = document.querySelector("#emptyUsers");
  tableBody.replaceChildren();
  document.querySelector("#userCount").textContent = `共 ${users.length} 个账号`;
  emptyUsers.classList.toggle("hidden", users.length !== 0);

  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const row = document.createElement("tr");
    row.className = "align-top transition hover:bg-slate-50";
    row.appendChild(createUserCell(user));
    row.appendChild(createRoleCell(user.role));
    row.appendChild(createCell(
      user.role === "user" ? `Level ${user.currentLevel}` : "—",
      "whitespace-nowrap font-black text-slate-800"
    ));
    row.appendChild(createProgressCell(user));
    row.appendChild(createCell(formatLatestActivity(user.progress), "whitespace-nowrap text-sm text-slate-500"));
    tableBody.appendChild(row);
  }
}

function createUserCell(user) {
  const cell = document.createElement("td");
  cell.className = "px-6 py-5";
  const username = document.createElement("p");
  username.className = "font-black text-slate-900";
  username.textContent = user.username;
  const identifier = document.createElement("p");
  identifier.className = "mt-1 text-xs text-slate-400";
  identifier.textContent = `用户编号 ${user.id}`;
  cell.appendChild(username);
  cell.appendChild(identifier);
  return cell;
}

function createRoleCell(role) {
  const cell = document.createElement("td");
  cell.className = "px-6 py-5";
  const badge = document.createElement("span");
  badge.className = role === "admin"
    ? "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700"
    : "inline-flex rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-black text-ocean-700";
  badge.textContent = role === "admin" ? "管理员" : "学习用户";
  cell.appendChild(badge);
  return cell;
}

function createProgressCell(user) {
  const cell = document.createElement("td");
  cell.className = "min-w-[360px] px-6 py-5";

  if (user.role !== "user") {
    cell.appendChild(createMutedText("管理员账号不参与学习"));
    return cell;
  }

  if (user.progress.length === 0) {
    cell.appendChild(createMutedText("尚未开始学习"));
    return cell;
  }

  const list = document.createElement("div");
  list.className = "grid gap-2";
  for (let index = 0; index < user.progress.length; index += 1) {
    list.appendChild(createProgressItem(user.progress[index]));
  }
  cell.appendChild(list);
  return cell;
}

function createProgressItem(progress) {
  const item = document.createElement("div");
  item.className = "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs";

  const level = document.createElement("span");
  level.className = "font-black text-slate-800";
  level.textContent = `Level ${progress.level}`;

  const status = document.createElement("span");
  status.className = "font-bold text-ocean-700";
  status.textContent = phaseLabel(progress.phase);

  const position = document.createElement("span");
  position.className = "text-slate-500";
  position.textContent = progress.totalTerms === 0
    ? "暂无学习内容"
    : `${progress.position} / ${progress.totalTerms}`;

  item.appendChild(level);
  item.appendChild(status);
  item.appendChild(position);
  return item;
}

function createMutedText(text) {
  const content = document.createElement("span");
  content.className = "text-sm font-bold text-slate-400";
  content.textContent = text;
  return content;
}

function phaseLabel(phase) {
  const labels = {
    learning: "学习中",
    quiz: "测验中",
    result: "测验已完成",
    completed: "本级已完成"
  };
  return labels[phase] || "进度已记录";
}

function formatLatestActivity(progressItems) {
  let latestTimestamp = 0;
  for (let index = 0; index < progressItems.length; index += 1) {
    const timestamp = new Date(`${progressItems[index].updatedAt}Z`).getTime();
    if (Number.isFinite(timestamp) && timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
    }
  }

  if (latestTimestamp === 0) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(latestTimestamp));
}

function createTypeCell(termType) {
  const labels = { word: "单词", phrase: "词组", sentence: "句子" };
  const cell = document.createElement("td");
  cell.className = "px-6 py-4";
  const badge = document.createElement("span");
  badge.className = "inline-flex rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-black text-ocean-700";
  badge.textContent = labels[termType];
  cell.appendChild(badge);
  return cell;
}

function createLevelCell(level) {
  const cell = document.createElement("td");
  cell.className = "px-6 py-4";
  const badge = document.createElement("span");
  badge.className = "inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700";
  badge.textContent = level;
  cell.appendChild(badge);
  return cell;
}

function createActionCell(term) {
  const cell = document.createElement("td");
  cell.className = "px-6 py-4 text-right";
  const editButton = document.createElement("button");
  editButton.className = "mr-2 rounded-lg px-3 py-2 text-sm font-bold text-ocean-700 hover:bg-ocean-50";
  editButton.textContent = "编辑";
  editButton.addEventListener("click", () => openTermForm(term));

  const deleteButton = document.createElement("button");
  deleteButton.className = "rounded-lg px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50";
  deleteButton.textContent = "删除";
  deleteButton.addEventListener("click", () => removeTerm(term));

  cell.appendChild(editButton);
  cell.appendChild(deleteButton);
  return cell;
}

function openTermForm(term = null) {
  editingId = term ? term.id : null;
  document.querySelector("#termFormTitle").textContent = term ? "编辑学习内容" : "添加学习内容";
  document.querySelector("#termContent").value = term ? term.termContent : "";
  document.querySelector("#meaning").value = term ? term.meaning : "";
  document.querySelector("#example").value = term ? term.example : "";
  document.querySelector("#termType").value = term ? term.termType : "word";
  document.querySelector("#level").value = term ? String(term.level) : "1";
  const panel = document.querySelector("#termFormPanel");
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#termContent").focus({ preventScroll: true });
}

function closeTermForm() {
  editingId = null;
  document.querySelector("#termForm").reset();
  document.querySelector("#termFormPanel").classList.add("hidden");
}

async function saveTerm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const payload = {
    termContent: document.querySelector("#termContent").value,
    meaning: document.querySelector("#meaning").value,
    example: document.querySelector("#example").value,
    termType: document.querySelector("#termType").value,
    level: Number(document.querySelector("#level").value)
  };
  setButtonLoading(submitButton, true, "保存中...");

  try {
    if (editingId) {
      await api.put(`/api/admin/terms/${editingId}`, payload);
      showToast("学习内容已更新");
    } else {
      await api.post("/api/admin/terms", payload);
      showToast("学习内容已添加");
    }
    closeTermForm();
    await loadTerms();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function removeTerm(term) {
  const confirmed = window.confirm(`确定删除“${term.termContent}”吗？此操作无法撤销。`);
  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/api/admin/terms/${term.id}`);
    showToast("学习内容已删除");
    await loadTerms();
  } catch (error) {
    showToast(error.message, "error");
  }
}
