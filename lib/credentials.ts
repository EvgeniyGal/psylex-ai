export function formatCredentials(input: {
  role: string;
  login: string;
  password: string;
}) {
  return `Role: ${input.role}\nLogin: ${input.login}\nPassword: ${input.password}`;
}
