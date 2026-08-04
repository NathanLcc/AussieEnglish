const state = { user: null };

export function getUser() {
  return state.user;
}

export function setUser(user) {
  state.user = user;
}
