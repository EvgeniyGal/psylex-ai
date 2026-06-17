function randomString(length: number): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

export function generateLogin() {
  return `psylex_${crypto.randomUUID()}`;
}

export function generatePassword() {
  return randomString(12);
}
