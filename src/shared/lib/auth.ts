import { timingSafeEqual } from "crypto";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import type { UserRole } from "@/entities/user";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(inputBuf, expectedBuf);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Admin Password",
      credentials: { password: { type: "password" } },
      async authorize(credentials) {
        const password = credentials?.password as string | undefined;
        if (!password || !verifyAdminPassword(password)) return null;

        return {
          id: "super-admin",
          name: "Администратор",
          role: "SUPER_ADMIN" as UserRole,
          teacherId: null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherId = user.teacherId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.teacherId = (token.teacherId as number | null) ?? null;
      return session;
    },
  },
});
