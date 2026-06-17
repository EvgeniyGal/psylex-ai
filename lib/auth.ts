import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";

const loginSchema = z.object({
  login: z.string().regex(/^psylex_[0-9a-fA-F-]{36}$/),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.login, parsed.data.login))
          .limit(1);
        if (!user) return null;
        if (user.password !== parsed.data.password) return null;

        return {
          id: user.id,
          name: user.login,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role =
          typeof (user as { role?: string }).role === "string"
            ? (user as { role?: string }).role
            : token.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: token.role as string,
      };
      return session;
    },
  },
};
