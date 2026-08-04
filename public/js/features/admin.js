import { api } from "../core/api.js";
import { createCell, setButtonLoading, showToast } from "../core/ui.js";

let terms = [];
let editingId = null;

export function initializeAdmin() {
  document.querySelector("#openTermFormButton").addEventListener("click", () => openTermForm());
  document.querySelector("#closeTermFormButton").addEventListener("click", closeTermForm);
  document.querySelector("#cancelTermButton").addEventListener("click", closeTermForm);
  document.querySelector("#refreshTermsButton").addEventListener("click", loadTerms);
  document.querySelector("#termForm").addEventListener("submit", saveTerm);
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
