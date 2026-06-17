import { z } from "zod";

/** Login must start with `psylex_` followed by at least one allowed character. */
export const loginPattern = /^psylex_[a-zA-Z0-9_-]+$/;

export const credentialsSchema = z.object({
  login: z.string().regex(loginPattern, "Login must start with psylex_"),
  password: z.string().min(1),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
