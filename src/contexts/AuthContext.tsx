"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/utils/auth";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return (await res.json()) as SessionUser;
    } catch {
      return null;
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    // 1. Firebase client auth
    const credential = await signInWithEmailAndPassword(auth, email, password);
    // 2. Get ID token
    const idToken = await credential.user.getIdToken();
    // 3. Exchange for session cookie
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      throw new Error("Falha ao criar sessão");
    }
    // 4. Fetch full session user
    const sessionUser = await fetchMe();
    setUser(sessionUser);
  }, [fetchMe]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
    } catch {
      // Continue anyway
    } finally {
      setUser(null);
      router.push("/app/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
