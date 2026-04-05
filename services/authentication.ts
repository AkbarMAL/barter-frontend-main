

export const logout = () => {
  document.cookie = "token=; path=/; max-age=0";
  window.location.href = "/login";
};