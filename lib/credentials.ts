export function localizeRole(roles: Record<string, string>, role: string) {
  return roles[role] ?? role;
}

export function formatCredentials(input: {
  roleLabel: string;
  loginLabel: string;
  passwordLabel: string;
  role: string;
  login: string;
  password: string;
}) {
  return `${input.roleLabel}: ${input.role}\n${input.loginLabel}: ${input.login}\n${input.passwordLabel}: ${input.password}`;
}
