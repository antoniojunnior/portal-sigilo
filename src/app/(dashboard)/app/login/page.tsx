"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { LogoSigilo } from "@/components/portal/LogoSigilo";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Não conseguimos encontrar essa conta. Verifique o e-mail e a senha.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
    case "auth/user-disabled":
      return "Essa conta foi desativada. Entre em contato com o administrador.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet e tente novamente.";
    default:
      return "Não foi possível entrar. Verifique suas credenciais.";
  }
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: 44,
  paddingLeft: 40,
  paddingRight: 12,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg-secondary)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.border = "1px solid #2A6070";
  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(42,96,112,0.12)";
  e.currentTarget.style.background = "var(--color-card)";
}

function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.border = "1px solid var(--color-border)";
  e.currentTarget.style.boxShadow = "none";
  e.currentTarget.style.background = "var(--color-bg-secondary)";
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/app");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetFeedback(null);
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetFeedback({ ok: true, msg: "Enviamos um link de redefinição para o seu e-mail." });
    } catch {
      setResetFeedback({ ok: false, msg: "Não encontramos esse e-mail. Verifique e tente novamente." });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div
      data-portal
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--color-bg-secondary)" }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <LogoSigilo iconSize={48} />
        </div>

        {/* Trust strip */}
        <div
          className="flex items-center justify-center mb-7"
          style={{ gap: "1.25rem" }}
          role="list"
          aria-label="Garantias de acesso"
        >
          {([
            {
              label: "Criptografado",
              icon: (
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="6" width="10" height="7" rx="1.5" />
                  <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" />
                </svg>
              ),
            },
            {
              label: "Auditado",
              icon: (
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 1L2 3v4c0 3 2.3 5 5 6 2.7-1 5-3 5-6V3L7 1z" />
                  <path d="M4.5 7l1.8 1.8L9.5 5.5" />
                </svg>
              ),
            },
            {
              label: "Acesso restrito",
              icon: (
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#2A6070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="7" cy="5" r="2.5" />
                  <path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" />
                  <path d="M10.5 9.5L13 12M11 8.5l1.5-1.5" strokeLinecap="round" />
                </svg>
              ),
            },
          ] as const).map((item, i) => (
            <span key={item.label} className="flex items-center" style={{ gap: "0.375rem" }} role="listitem">
              {i > 0 && (
                <span
                  className="flex-shrink-0"
                  style={{ width: 1, height: 14, background: "var(--color-border-strong)" }}
                  aria-hidden
                />
              )}
              {item.icon}
              <span className="text-xs font-medium" style={{ color: "#2A6070" }}>
                {item.label}
              </span>
            </span>
          ))}
        </div>

        {/* Main card */}
        <div
          className="w-full mb-5"
          style={{
            background: "var(--color-card)",
            border: "0.5px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
          }}
        >
          {!resetMode ? (
            <>
              {/* Eyebrow */}
              <p
                className="text-center font-medium mb-3"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "#C05A4A",
                }}
              >
                Painel de gestão
              </p>

              {/* Headline */}
              <h1
                className="text-center mb-2"
                style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)", lineHeight: 1.3 }}
              >
                Bem-vindo de volta.
              </h1>

              {/* Subtext */}
              <p
                className="text-center mb-6"
                style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}
              >
                Registre-se para acessar o painel de gestão da sua organização.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="sr-only"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--color-text-tertiary)" }}>
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="1" y="3" width="12" height="8" rx="1.5" />
                        <path d="M1 4l6 4 6-4" />
                      </svg>
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      required
                      disabled={loading}
                      className="focus:outline-none"
                      style={{ ...INPUT_STYLE, opacity: loading ? 0.6 : 1 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="sr-only">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--color-text-tertiary)" }}>
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="2" y="6" width="10" height="7" rx="1.5" />
                        <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" />
                        <circle cx="7" cy="9.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      required
                      disabled={loading}
                      className="focus:outline-none"
                      style={{ ...INPUT_STYLE, opacity: loading ? 0.6 : 1 }}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-[var(--radius-md)] px-3.5 py-3"
                    style={{ background: "var(--color-danger-surface)", border: "1px solid var(--color-border-error)" }}
                  >
                    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" className="flex-shrink-0 mt-0.5" aria-hidden>
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                    </svg>
                    <p style={{ fontSize: 13, color: "var(--color-danger)", lineHeight: 1.5 }}>{error}</p>
                  </div>
                )}

                <div className="pt-1 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] transition-opacity"
                    style={{
                      height: 44,
                      borderRadius: "var(--radius-md)",
                      background: "#2A6070",
                      color: "#fff",
                      fontSize: "var(--text-sm)",
                      fontWeight: 500,
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#224f5e"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#2A6070"; }}
                  >
                    {loading ? "Entrando…" : "Entrar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setResetMode(true); setResetEmail(email); }}
                    className="w-full text-center focus:outline-none focus-visible:underline transition-colors"
                    style={{ fontSize: 13, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>

              {/* Audit banner */}
              <div
                className="flex items-center gap-2.5 mt-5"
                style={{
                  background: "rgba(42,96,112,0.06)",
                  border: "1px solid rgba(42,96,112,0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.625rem 0.875rem",
                }}
                role="note"
                aria-label="Aviso de auditoria"
              >
                <span
                  className="animate-pulse-slow flex-shrink-0 rounded-full"
                  style={{ width: 8, height: 8, background: "#2A6070", display: "block" }}
                  aria-hidden
                />
                <p style={{ fontSize: 12, color: "#2A6070", lineHeight: 1.4, margin: 0 }}>
                  <strong>Seu acesso é registrado</strong> para fins de auditoria e conformidade.
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setResetMode(false); setResetFeedback(null); }}
                className="flex items-center gap-1.5 mb-5 focus:outline-none focus-visible:underline transition-colors"
                style={{ fontSize: 13, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-tertiary)"; }}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <path d="M10 4L6 8l4 4" />
                </svg>
                Voltar
              </button>

              {/* Eyebrow */}
              <p
                className="text-center font-medium mb-3"
                style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: "#C05A4A" }}
              >
                Recuperar acesso
              </p>

              <h1
                className="text-center mb-2"
                style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}
              >
                Redefinir senha
              </h1>

              <p
                className="text-center mb-6"
                style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}
              >
                Enviaremos um link de redefinição para o seu e-mail.
              </p>

              {resetFeedback ? (
                <div
                  role="alert"
                  className="rounded-[var(--radius-md)] px-3.5 py-3 mb-4"
                  style={{
                    background: resetFeedback.ok ? "var(--color-success-surface)" : "var(--color-danger-surface)",
                    border: `1px solid ${resetFeedback.ok ? "var(--color-success)" : "var(--color-border-error)"}`,
                    color: resetFeedback.ok ? "var(--color-success)" : "var(--color-danger)",
                  }}
                >
                  <p style={{ fontSize: 13 }}>{resetFeedback.msg}</p>
                </div>
              ) : null}

              {!resetFeedback?.ok && (
                <form onSubmit={handleReset} className="space-y-3" noValidate>
                  <div>
                    <label htmlFor="reset-email" className="sr-only">E-mail</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none" style={{ color: "var(--color-text-tertiary)" }}>
                        <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="1" y="3" width="12" height="8" rx="1.5" />
                          <path d="M1 4l6 4 6-4" />
                        </svg>
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Seu e-mail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        onFocus={focusInput}
                        onBlur={blurInput}
                        required
                        disabled={resetLoading}
                        className="focus:outline-none"
                        style={{ ...INPUT_STYLE, opacity: resetLoading ? 0.6 : 1 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] transition-opacity"
                    style={{
                      height: 44,
                      borderRadius: "var(--radius-md)",
                      background: "#2A6070",
                      color: "#fff",
                      fontSize: "var(--text-sm)",
                      fontWeight: 500,
                      border: "none",
                      cursor: resetLoading ? "not-allowed" : "pointer",
                      opacity: resetLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!resetLoading) e.currentTarget.style.background = "#224f5e"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#2A6070"; }}
                  >
                    {resetLoading ? "Enviando…" : "Enviar link"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Compliance badges */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center flex-wrap gap-2">
            {["Lei 14.457/22", "NR-1", "Lei 14.611/23", "LGPD"].map((l) => (
              <span
                key={l}
                className="font-medium"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-secondary)",
                  background: "var(--color-bg-secondary)",
                  border: "0.5px solid var(--color-border)",
                  borderRadius: 99,
                  padding: "2px 10px",
                }}
              >
                {l}
              </span>
            ))}
          </div>
          <p
            className="text-center"
            style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}
          >
            Espaço gerenciado pelo Portal Sigilo · Direitos Reservados
          </p>
        </div>

      </div>
    </div>
  );
}
