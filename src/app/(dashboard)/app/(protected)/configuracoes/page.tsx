"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Role } from "@/lib/types";

interface UserData {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
}

interface OrgData {
  id: string;
  nome: string;
  slug: string;
  plano_ativo: string;
  logo: string | null;
  configuracoes: {
    boas_vindas?: string;
    prazo_padrao_dias?: number;
    categorias?: string[];
  };
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "auditor", label: "Auditor" },
];

const PLANO_LABELS: Record<string, string> = {
  entrada: "Entrada",
  gestao: "Gestão",
  enterprise: "Enterprise",
};

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  const [org, setOrg] = useState<OrgData | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const [orgNome, setOrgNome] = useState("");
  const [boasVindas, setBoasVindas] = useState("");
  const [prazoPadrao, setPrazoPadrao] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserNome, setNewUserNome] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("gestor");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Danger zone
  const [dangerStep, setDangerStep] = useState<0 | 1 | 2>(0);
  const [dangerConfirmText, setDangerConfirmText] = useState("");
  const [dangerLoading, setDangerLoading] = useState(false);

  const fetchOrg = useCallback(async () => {
    setOrgLoading(true);
    try {
      const res = await fetch("/api/dashboard/org");
      if (!res.ok) return;
      const data = await res.json() as OrgData;
      setOrg(data);
      setOrgNome(data.nome ?? "");
      setBoasVindas(data.configuracoes?.boas_vindas ?? "");
      setPrazoPadrao(String(data.configuracoes?.prazo_padrao_dias ?? "30"));
    } catch (err) {
      console.error("[Configuracoes] fetchOrg:", err);
    } finally {
      setOrgLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/dashboard/users");
      if (!res.ok) return;
      const data = await res.json() as { users: UserData[] };
      setUsers(data.users ?? []);
    } catch (err) {
      console.error("[Configuracoes] fetchUsers:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchOrg();
      fetchUsers();
    }
  }, [user, fetchOrg, fetchUsers]);

  async function handleSaveOrg() {
    setSavingOrg(true);
    setOrgSaved(false);
    setOrgError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (orgNome) payload.nome = orgNome;
      payload.configuracoes = {
        boas_vindas: boasVindas,
        prazo_padrao_dias: parseInt(prazoPadrao, 10) || 30,
      };

      const res = await fetch("/api/dashboard/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setOrgSaved(true);
        setTimeout(() => setOrgSaved(false), 3000);
        await fetchOrg();
      } else {
        const d = await res.json() as { error?: string };
        setOrgError(d.error ?? "Erro ao salvar.");
      }
    } catch (err) {
      console.error("[Configuracoes] saveOrg:", err);
      setOrgError("Erro ao salvar. Tente novamente.");
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleCreateUser() {
    setCreateUserError(null);
    if (!newUserEmail || !newUserNome) {
      setCreateUserError("E-mail e nome são obrigatórios.");
      return;
    }
    setCreatingUser(true);
    try {
      const res = await fetch("/api/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, nome: newUserNome, role: newUserRole }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setCreateUserError(data.error ?? "Erro ao criar usuário.");
        return;
      }
      setAddUserOpen(false);
      setNewUserEmail("");
      setNewUserNome("");
      setNewUserRole("gestor");
      await fetchUsers();
    } catch {
      setCreateUserError("Erro ao criar usuário.");
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleToggleAtivo(userId: string, currentAtivo: boolean) {
    try {
      await fetch(`/api/dashboard/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !currentAtivo }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ativo: !currentAtivo } : u)));
    } catch (err) {
      console.error("[Configuracoes] toggleAtivo:", err);
    }
  }

  async function handleChangeRole(userId: string, newRole: Role) {
    try {
      await fetch(`/api/dashboard/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error("[Configuracoes] changeRole:", err);
    }
  }

  async function handleDeactivateChannel() {
    if (dangerConfirmText !== org?.slug) return;
    setDangerLoading(true);
    try {
      // TODO Fase 9: implementar endpoint de desativação do canal
      await new Promise((r) => setTimeout(r, 800));
      setDangerStep(2);
    } catch {
      // handle
    } finally {
      setDangerLoading(false);
    }
  }

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <>
        <DashboardHeader breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]} />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <p className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-2">
                Acesso restrito a administradores
              </p>
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                Somente administradores podem acessar as configurações da organização.
              </p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]} />

      <PageContainer>
        <div className="max-w-2xl space-y-5">

          {/* ── Org data ── */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5 space-y-4">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">Organização</h2>

            {orgLoading ? (
              <div className="space-y-3">
                <Skeleton height="44px" rounded="md" />
                <Skeleton height="44px" rounded="md" />
                <Skeleton height="44px" rounded="md" />
              </div>
            ) : (
              <>
                <Input
                  label="Nome da organização"
                  value={orgNome}
                  onChange={(e) => setOrgNome(e.target.value)}
                />

                {org?.slug && (
                  <div>
                    <label className="block text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] mb-1.5">
                      Slug (URL do canal)
                    </label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                        portalsigilo.com.br/
                      </span>
                      <span className="font-mono text-[var(--text-sm)] text-[var(--color-text-primary)]">
                        {org.slug}
                      </span>
                      <span
                        className="ml-auto text-[var(--text-2xs)] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-tertiary)" }}
                      >
                        somente leitura
                      </span>
                    </div>
                  </div>
                )}

                <Input
                  label="Mensagem de boas-vindas do canal"
                  value={boasVindas}
                  onChange={(e) => setBoasVindas(e.target.value)}
                  helper="Exibida na tela inicial do canal de denúncias."
                  placeholder="Este é um espaço seguro para você ser ouvido."
                />

                <div>
                  <label className="block text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] mb-1.5">
                    Prazo padrão de resposta (dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={prazoPadrao}
                    onChange={(e) => setPrazoPadrao(e.target.value)}
                    className="w-28 min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-border)] px-3.5 py-2 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button variant="primary" size="md" loading={savingOrg} onClick={handleSaveOrg}>
                    Salvar alterações
                  </Button>
                  {orgSaved && (
                    <span className="text-[var(--text-sm)] text-[var(--color-success)]">Salvo!</span>
                  )}
                  {orgError && (
                    <span className="text-[var(--text-sm)] text-[var(--color-danger)]">{orgError}</span>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ── Plan ── */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-4">Plano atual</h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-[var(--text-sm)] font-semibold px-3 py-1.5 rounded-[var(--radius-md)]"
                  style={{ background: "var(--color-accent-surface)", color: "var(--color-accent-dark)" }}
                >
                  {PLANO_LABELS[user.plano] ?? user.plano}
                </span>
                <div>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium">
                    {user.orgName}
                  </p>
                  <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {user.plano === "entrada" ? "1 gestor · sem IA · sem WhatsApp" :
                     user.plano === "gestao" ? "Até 10 gestores · IA · WhatsApp" :
                     "Ilimitado · todas as funcionalidades"}
                  </p>
                </div>
              </div>
              {user.plano !== "enterprise" && (
                <Link
                  href="/app/configuracoes"
                  className="flex-shrink-0 text-[var(--text-sm)] font-semibold px-4 py-2 rounded-[var(--radius-md)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                  style={{ background: "var(--color-primary)", color: "var(--color-on-primary)" }}
                >
                  Fazer upgrade
                </Link>
              )}
            </div>
          </section>

          {/* ── Users ── */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">Usuários</h2>
              <Button variant="primary" size="sm" onClick={() => setAddUserOpen(true)}>
                + Convidar
              </Button>
            </div>

            {loadingUsers ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="48px" rounded="md" />)}
              </div>
            ) : users.length === 0 ? (
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 480 }}>
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {["Nome", "E-mail", "Perfil", "Status", "Ações"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-3 py-3 text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                          {u.nome}
                          {u.id === user.uid && (
                            <span className="ml-1.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">(você)</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-sm)] text-[var(--color-text-secondary)] max-w-[160px] truncate">
                          {u.email}
                        </td>
                        <td className="px-3 py-3">
                          {u.id === user.uid ? (
                            <Badge>{u.role}</Badge>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                              className="text-[var(--text-xs)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="text-[var(--text-xs)] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: u.ativo ? "var(--color-success-surface)" : "var(--color-bg-tertiary)",
                              color: u.ativo ? "var(--color-success)" : "var(--color-text-tertiary)",
                            }}
                          >
                            {u.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {u.id !== user.uid && (
                            <Button variant="ghost" size="sm" onClick={() => handleToggleAtivo(u.id, u.ativo)}>
                              {u.ativo ? "Desativar" : "Reativar"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Danger zone ── */}
          <section
            className="rounded-[var(--radius-lg)] p-4 sm:p-5 space-y-3"
            style={{ border: "1px solid var(--color-danger)", background: "var(--color-danger-surface)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" aria-hidden>
                <path d="M8 2L2 13h12L8 2z" strokeLinejoin="round" />
                <path d="M8 7v3M8 12h.01" strokeLinecap="round" />
              </svg>
              <h2 className="text-[var(--text-base)] font-semibold" style={{ color: "var(--color-danger)" }}>
                Zona de perigo
              </h2>
            </div>

            <p className="text-[var(--text-sm)]" style={{ color: "var(--color-danger)" }}>
              Desativar o canal impede novos relatos. Casos existentes são preservados. Esta ação não pode ser desfeita sem suporte.
            </p>

            {dangerStep === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDangerStep(1)}
                className="border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white"
              >
                Desativar canal de denúncias
              </Button>
            )}

            {dangerStep === 1 && (
              <div className="space-y-3">
                <p className="text-[var(--text-sm)] font-semibold" style={{ color: "var(--color-danger)" }}>
                  Para confirmar, digite o slug da organização: <code className="font-mono">{org?.slug}</code>
                </p>
                <input
                  type="text"
                  value={dangerConfirmText}
                  onChange={(e) => setDangerConfirmText(e.target.value)}
                  placeholder={org?.slug ?? "slug"}
                  className="w-full min-h-[44px] rounded-[var(--radius-md)] border border-[var(--color-danger)] px-3.5 py-2 bg-white text-[var(--color-text-primary)] text-[var(--text-base)] focus:outline-none focus-visible:ring-2"
                  style={{ outlineColor: "var(--color-danger)" }}
                />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setDangerStep(0); setDangerConfirmText(""); }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={dangerLoading}
                    disabled={dangerConfirmText !== org?.slug}
                    onClick={handleDeactivateChannel}
                    className="border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white disabled:opacity-40"
                  >
                    Confirmar desativação
                  </Button>
                </div>
              </div>
            )}

            {dangerStep === 2 && (
              <p className="text-[var(--text-sm)] font-semibold" style={{ color: "var(--color-danger)" }}>
                Canal desativado. Entre em contato com o suporte para reverter.
              </p>
            )}
          </section>
        </div>
      </PageContainer>

      {/* Add user modal */}
      <Modal
        open={addUserOpen}
        onClose={() => { setAddUserOpen(false); setCreateUserError(null); }}
        title="Convidar usuário"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddUserOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={creatingUser} onClick={handleCreateUser}>
              Criar usuário
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nome completo" value={newUserNome} onChange={(e) => setNewUserNome(e.target.value)} required />
          <Input label="E-mail" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
          <Select label="Perfil" options={ROLE_OPTIONS} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as Role)} />
          {createUserError && (
            <p role="alert" className="text-[var(--text-sm)] text-[var(--color-danger)]">{createUserError}</p>
          )}
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
            Uma senha temporária será gerada. O usuário deverá redefini-la no primeiro acesso.
          </p>
        </div>
      </Modal>
    </>
  );
}
