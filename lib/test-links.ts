export const TEST_LOGIN_EMAIL_DOMAIN = "test.com";

/** External test platforms expect portal login as an email: `psylex_xxxx@test.com`. */
export function toTestLoginEmail(login: string) {
  return `${login}@${TEST_LOGIN_EMAIL_DOMAIN}`;
}

export function buildTestUrl(baseUrl: string, login: string) {
  if (!baseUrl.trim()) return "";

  const testLogin = toTestLoginEmail(login);

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("login", testLogin);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}login=${encodeURIComponent(testLogin)}`;
  }
}
