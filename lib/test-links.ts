export function buildTestUrl(baseUrl: string, login: string) {
  if (!baseUrl.trim()) return "";

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("login", login);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}login=${encodeURIComponent(login)}`;
  }
}
