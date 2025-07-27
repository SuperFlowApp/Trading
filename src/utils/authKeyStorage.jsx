export function getAuthKey() {
  return localStorage.getItem("authKey");
}

export function setAuthKey(key) {
  localStorage.setItem("authKey", key);
}