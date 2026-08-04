export function renderLobby(user) {
  document.querySelector("#lobbyUsername").textContent = user.username;
  document.querySelector("#lobbyLevel").textContent = user.currentLevel;
  document.querySelector("#journeyLevel").textContent = user.currentLevel;
}
