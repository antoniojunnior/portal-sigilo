"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LogoSigilo } from "@/components/portal/LogoSigilo";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/app");
    } catch {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg-secondary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoSigilo iconSize={36} />
        </div>

        {/* Card */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)]">
          <h1 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] mb-1">
            Entrar
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] mb-6">
            Acesse o painel de gestão de denúncias.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            {error && (
              <p role="alert" className="text-[var(--text-sm)] text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={loading}
              >
                Entrar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
