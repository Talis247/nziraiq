import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function upsertOAuthUser(email: string, name?: string | null) {
  const normalized = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: normalized,
      name: name || normalized.split("@")[0],
      role: "TRAVELER",
      travelerProfile: { create: { interests: [], groupSize: 1 } },
    },
  });
}

const googleReady = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const facebookReady = Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);

export const oauthEnabled = {
  google: googleReady,
  facebook: facebookReady,
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(googleReady
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(facebookReady
      ? [
          Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID!,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        const email = (user?.email || (profile as { email?: string } | undefined)?.email)?.toLowerCase();
        if (!email) return token;
        const dbUser = await upsertOAuthUser(email, user?.name ?? null);
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.email = dbUser.email;
        token.name = dbUser.name;
        return token;
      }

      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
