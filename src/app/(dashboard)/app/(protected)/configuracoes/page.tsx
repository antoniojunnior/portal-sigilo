"use client";

import { useState, useEffect, useCallback } from "react";
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

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "auditor", label: "Auditor" },
];

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [orgNome, setOrgNome] = useState("");
  const [boasVindas, setBoasVindas] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserNome, setNewUserNome] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("gestor");
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

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
      fetchUsers();
      setOrgNome(user.orgName ?? "");
    }
  }, [user, fetchUsers]);

  async function handleSaveOrg() {
    setSavingOrg(true);
    setOrgSaved(false);
    try {
      const payload: Record<string, unknown> = {};
      if (orgNome) payload.nome = orgNome;
      if (boasVindas) payload.configuracoes = { boas_vindas: boasVindas };

      const res = await fetch("/api/dashboard/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setOrgSaved(true);
        setTimeout(() => setOrgSaved(false), 3000);
      }
    } catch (err) {
      console.error("[Configuracoes] saveOrg:", err);
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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ativo: !currentAtivo } : u))
      );
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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("[Configuracoes] changeRole:", err);
    }
  }

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <>
        <DashboardHeader
          breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]}
          user={{ name: user.nome }}
        />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <p className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)] mb-2">
                Acesso restrito a administradores
              </p>
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                Somente administradores podem acessar as configura��ões da organização.
              </p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]}
        user={{ name: user.nome }}
      />

      <PageContainer>
        <div className="max-w-2xl space-y-6">
          {/* Org settings */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
              Organização
            </h2>

            <Input
              label="Nome da organização"
              value={orgNome}
              onChange={(e) => setOrgNome(e.target.value)}
            />

            <Input
              label="Mensagem de boas-vindas"
              value={boasVindas}
              onChange={(e) => setBoasVindas(e.target.value)}
              helper="Exibida na tela inicial do canal de denúncias."
              placeholder="Este é um espaço seguro para você ser ouvido."
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                loading={savingOrg}
                onClick={handleSaveOrg}
              >
                Salvar alterações
              </Button>
              {orgSaved && (
                <span className="text-[var(--text-sm)] text-[var(--color-success)]">
                  Salvo com sucesso!
                </span>
              )}
            </div>
          </section>

          {/* Users section */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
                Usuários
              </h2>
              <Button variant="primary" size="sm" onClick={() => setAddUserOpen(true)}>
                + Adicionar usuário
              </Button>
            </div>

            {loadingUsers ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="48px" rounded="md" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                Nenhum usuário encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Nome</th>
                      <th className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">E-mail</th>
                      <th className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Perfil</th>
                      <th className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Status</th>
                      <th className="px-3 py-2.5 text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-3 py-3 text-[var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                          {u.nome}
                          {u.id === user.uid && (
                            <span className="ml-1.5 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">(você)</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
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
                          <Badge className={u.ativo ? "bg-green-50 text-green-700 border-green-200" : ""}>
                            {u.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          {u.id !== user.uid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAtivo(u.id, u.ativo)}
                            >
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
        </div>
      </PageContainer>

      {/* Add user modal */}
      <Modal
        open={addUserOpen}
        onClose={() => { setAddUserOpen(false); setCreateUserError(null); }}
        title="Adicionar usuário"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={creatingUser}
              onClick={handleCreateUser}
            >
              Criar usuário
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            value={newUserNome}
            onChange={(e) => setNewUserNome(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            required
          />
          <Select
            label="Perfil"
            options={ROLE_OPTIONS}
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as Role)}
          />
          {createUserError && (
            <p role="alert" className="text-[var(--text-sm)] text-[var(--color-danger)]">
              {createUserError}
            </p>
          )}
          <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
            Uma senha temporária será gerada e o usuário deverá redefini-la no primeiro acesso.
          </p>
        </div>
      </Modal>
    </>
  );
}
