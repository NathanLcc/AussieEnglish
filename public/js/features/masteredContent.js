import { api } from "../core/api.js";
import { showToast } from "../core/ui.js";

const masteryGroups = [
  { key: "word", label: "单词", englishLabel: "Words" },
  { key: "phrase", label: "词组", englishLabel: "Phrases" },
  { key: "sentence", label: "句子", englishLabel: "Sentences" }
];

export async function loadMasteredContent() {
  const content = document.querySelector("#masteredContentGroups");
  const emptyState = document.querySelector("#emptyMasteredContent");
  const loadingState = document.querySelector("#masteredContentLoading");
  content.replaceChildren();
  emptyState.classList.add("hidden");
  loadingState.classList.remove("hidden");

  try {
    const data = await api.get("/api/mastery");
    document.querySelector("#masteredContentCount").textContent = `共掌握 ${data.terms.length} 条澳洲表达`;
    emptyState.classList.toggle("hidden", data.terms.length !== 0);
    renderGroups(data.terms);
  } catch (error) {
    document.querySelector("#masteredContentCount").textContent = "掌握内容加载失败";
    showToast(error.message, "error");
  } finally {
    loadingState.classList.add("hidden");
  }
}

function renderGroups(terms) {
  const content = document.querySelector("#masteredContentGroups");
  content.replaceChildren();

  for (let groupIndex = 0; groupIndex < masteryGroups.length; groupIndex += 1) {
    const group = masteryGroups[groupIndex];
    const groupTerms = [];
    for (let termIndex = 0; termIndex < terms.length; termIndex += 1) {
      if (terms[termIndex].termType === group.key) {
        groupTerms.push(terms[termIndex]);
      }
    }

    if (groupTerms.length > 0) {
      content.appendChild(createGroup(group, groupTerms));
    }
  }
}

function createGroup(group, terms) {
  const section = document.createElement("section");
  section.className = "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm";

  const heading = document.createElement("div");
  heading.className = "flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-7";

  const title = document.createElement("h2");
  title.className = "font-black text-slate-900";
  title.textContent = `${group.label} · ${group.englishLabel}`;

  const count = document.createElement("span");
  count.className = "rounded-full bg-ocean-50 px-3 py-1 text-xs font-black text-ocean-700";
  count.textContent = `${terms.length} 条`;

  const list = document.createElement("div");
  list.className = "divide-y divide-slate-100";
  for (let index = 0; index < terms.length; index += 1) {
    list.appendChild(createTermRow(terms[index]));
  }

  heading.appendChild(title);
  heading.appendChild(count);
  section.appendChild(heading);
  section.appendChild(list);
  return section;
}

function createTermRow(term) {
  const row = document.createElement("article");
  row.className = "grid gap-2 px-5 py-5 sm:grid-cols-2 sm:items-center sm:gap-8 sm:px-7";

  const english = document.createElement("p");
  english.className = "break-words text-lg font-black text-slate-900";
  english.textContent = term.termContent;

  const chinese = document.createElement("p");
  chinese.className = "break-words text-sm font-bold text-ocean-800 sm:text-right sm:text-base";
  chinese.textContent = term.meaning;

  row.appendChild(english);
  row.appendChild(chinese);
  return row;
}
