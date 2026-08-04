let toastTimer = null;

export function showToast(message, type = "success") {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.className = "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl";
  toast.classList.add(type === "error" ? "bg-rose-600" : "bg-ocean-700");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

export function setButtonLoading(button, loading, loadingText) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

export function createCell(text, className = "") {
  const cell = document.createElement("td");
  cell.className = `px-6 py-4 ${className}`;
  cell.textContent = text;
  return cell;
}
