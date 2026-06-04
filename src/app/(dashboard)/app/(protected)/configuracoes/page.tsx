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
import { 
  AlertTriangle,
  X,
  Users,
  Settings,
  CreditCard,
  ShieldAlert,
  Plus,
  CheckCircle2,
  Building2,
  Trash2,
  UserPlus
} from "lucide-react";
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
    departamentos?: string[];
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
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [novoDept, setNovoDept] = useState("");
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
      setDepartamentos(data.configuracoes?.departamentos ?? []);
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
        departamentos,
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
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mb-6 border border-[var(--color-border)]">
              <ShieldAlert className="text-[var(--color-text-tertiary)]" size={32} />
            </div>
            <h1 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2">
              Acesso Restrito
            </h1>
            <p className="text-[var(--text-base)] text-[var(--color-text-tertiary)] mb-8">
              Somente administradores podem acessar as configurações da organização e gerenciar usuários.
            </p>
            <Button variant="primary" asChild>
              <Link href="/app">Voltar para o Dashboard</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]} />

      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex flex-col gap-1">
            <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)]">Configurações</h1>
            <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              Gerencie os dados da sua organização, membros da equipe e preferências do canal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block space-y-1">
              {[
                { icon: Building2, label: "Organização", href: "/app/configuracoes", active: true },
                { icon: Users, label: "Usuários", href: "/app/configuracoes", active: false },
                { icon: CreditCard, label: "Faturamento", href: "/app/configuracoes/faturamento", active: false },
                { icon: Settings, label: "Preferências", href: "/app/configuracoes", active: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[var(--text-sm)] font-medium transition-all ${
                    item.active
                      ? "bg-[var(--color-bg-secondary)] text-[var(--color-primary)] border border-[var(--color-border)] shadow-sm"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                  }`}
                >
                  <item.icon size={18} strokeWidth={item.active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              ))}
            </aside>

            <div className="lg:col-span-2 space-y-8">
              
              {/* ── Organização ── */}
              <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <Building2 className="text-[var(--color-primary)]" size={20} />
                    <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">Dados da Organização</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {orgLoading ? (
                    <div className="space-y-4">
                      <Skeleton height="60px" rounded="xl" />
                      <Skeleton height="60px" rounded="xl" />
                      <Skeleton height="100px" rounded="xl" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-6">
                        <Input
                          label="Nome da organização"
                          value={orgNome}
                          onChange={(e) => setOrgNome(e.target.value)}
                          placeholder="Ex: Minha Empresa S.A."
                        />

                        {org?.slug && (
                          <div className="space-y-1.5">
                            <label className="text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                              Slug do Canal (URL)
                            </label>
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] group">
                              <span className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] select-none">
                                portalsigilo.com.br/
                              </span>
                              <span className="font-mono text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">
                                {org.slug}
                              </span>
                              <Badge className="ml-auto bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border-none">
                                Reservado
                              </Badge>
                            </div>
                          </div>
                        )}

                        <Input
                          label="Mensagem de boas-vindas"
                          value={boasVindas}
                          onChange={(e) => setBoasVindas(e.target.value)}
                          helper="Esta mensagem aparece na tela inicial do canal de denúncias."
                          placeholder="Este é um ambiente seguro..."
                          multiline
                          rows={3}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                              Prazo de Resposta (Dias)
                            </label>
                            <div className="relative max-w-[120px]">
                              <input
                                type="number"
                                min={1}
                                max={90}
                                value={prazoPadrao}
                                onChange={(e) => setPrazoPadrao(e.target.value)}
                                className="w-full h-11 rounded-xl border border-[var(--color-border)] px-4 bg-[var(--color-bg)] text-[var(--color-text-primary)] text-[var(--text-sm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                              Departamentos
                            </label>
                            <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                              Estruture sua organização para relatórios detalhados.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
                            {departamentos.length > 0 ? (
                              departamentos.map((dept) => (
                                <Badge 
                                  key={dept} 
                                  className="pl-3 pr-1.5 py-1 bg-white border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm flex items-center gap-1.5 transition-all hover:border-[var(--color-primary)] group"
                                >
                                  {dept}
                                  <button
                                    type="button"
                                    onClick={() => setDepartamentos((prev) => prev.filter((d) => d !== dept))}
                                    className="p-0.5 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] italic p-1">
                                Nenhum departamento cadastrado.
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Adicionar departamento..."
                              value={novoDept}
                              onChange={(e) => setNovoDept(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const trimmed = novoDept.trim();
                                  if (trimmed && !departamentos.includes(trimmed)) {
                                    setDepartamentos((prev) => [...prev, trimmed]);
                                  }
                                  setNovoDept("");
                                }
                              }}
                              className="flex-1 h-10 rounded-xl border border-[var(--color-border)] px-4 bg-[var(--color-bg)] text-[var(--text-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-10 px-4"
                              onClick={() => {
                                const trimmed = novoDept.trim();
                                if (trimmed && !departamentos.includes(trimmed)) {
                                  setDepartamentos((prev) => [...prev, trimmed]);
                                }
                                setNovoDept("");
                              }}
                              disabled={!novoDept.trim() || departamentos.includes(novoDept.trim())}
                            >
                              <Plus size={16} className="mr-1.5" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                          {orgSaved && (
                            <div className="flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-success)] font-medium animate-in fade-in slide-in-from-left-2">
                              <CheckCircle2 size={16} />
                              Alterações salvas com sucesso!
                            </div>
                          )}
                          {orgError && (
                            <div className="flex items-center gap-1.5 text-[var(--text-sm)] text-[var(--color-danger)] font-medium">
                              <AlertTriangle size={16} />
                              {orgError}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="primary" 
                          size="md" 
                          loading={savingOrg} 
                          onClick={handleSaveOrg}
                          className="min-w-[140px]"
                        >
                          Salvar Dados
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* ── Plano Atual ── */}
              <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <CreditCard className="text-[var(--color-primary)]" size={20} />
                    <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">Plano e Faturamento</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/[0.02]">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
                      <CreditCard size={24} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)]">
                          Plano {PLANO_LABELS[user.plano] ?? user.plano}
                        </h3>
                        <Badge className="bg-[var(--color-primary)] text-white border-none text-[var(--text-2xs)] font-bold">ATIVO</Badge>
                      </div>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] leading-relaxed">
                        {user.plano === "entrada" ? "Ideal para pequenas empresas (1 gestor, sem IA)." :
                         user.plano === "gestao" ? "Completo para times em crescimento (Até 10 gestores, IA, WhatsApp)." :
                         "Solução enterprise ilimitada com todas as funcionalidades e suporte prioritário."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/app/configuracoes/faturamento"
                        className="inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] border border-transparent transition-all cursor-pointer select-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] active:scale-[0.98] [box-shadow:0_2px_8px_rgba(42,96,112,0.30)] hover:[box-shadow:0_4px_14px_rgba(42,96,112,0.40)] px-3 min-h-[32px] text-[var(--text-xs)]"
                      >
                        Fazer Upgrade
                      </Link>
                      <button className="text-[var(--text-xs)] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
                        Ver histórico de faturas
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Usuários ── */}
              <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="text-[var(--color-primary)]" size={20} />
                    <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">Membros da Equipe</h2>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setAddUserOpen(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Convidar
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  {loadingUsers ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="52px" rounded="xl" />)}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="mx-auto text-[var(--color-text-tertiary)] mb-4 opacity-20" size={48} />
                      <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">Nenhum usuário encontrado.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)]">
                          <th className="px-6 py-4 text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-4 text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">Perfil</th>
                          <th className="px-6 py-4 text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-center">Status</th>
                          <th className="px-6 py-4 text-[var(--text-xs)] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-[var(--color-bg-secondary)]/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
                                  {u.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)]">
                                    {u.nome}
                                    {u.id === user.uid && (
                                      <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[var(--color-bg-tertiary)] text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-tighter">EU</span>
                                    )}
                                  </span>
                                  <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {u.id === user.uid ? (
                                <Badge className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border-[var(--color-border)] capitalize">
                                  {u.role}
                                </Badge>
                              ) : (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                                  className="text-[var(--text-xs)] font-medium border border-[var(--color-border)] rounded-lg px-2 py-1 bg-white text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all outline-none"
                                >
                                  {ROLE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                                  u.ativo 
                                    ? "bg-[var(--color-success-surface)] text-[var(--color-success)] border-[var(--color-success)]/20" 
                                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border-[var(--color-border)]"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? "bg-[var(--color-success)]" : "bg-[var(--color-text-tertiary)]"}`} />
                                {u.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {u.id !== user.uid && (
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="xs" 
                                    onClick={() => handleToggleAtivo(u.id, u.ativo)}
                                    className={u.ativo ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]" : "text-[var(--color-success)] hover:bg-[var(--color-success-surface)]"}
                                  >
                                    {u.ativo ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
                                    <span className="ml-1.5">{u.ativo ? "Desativar" : "Reativar"}</span>
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* ── Zona de Perigo ── */}
              <section className="border border-[var(--color-danger)]/30 rounded-2xl overflow-hidden bg-white">
                <div className="p-6 bg-[var(--color-danger-surface)] border-b border-[var(--color-danger)]/20">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-[var(--color-danger)]" size={20} />
                    <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-danger)]">Zona de Perigo</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">
                    Desativar o canal interromperá imediatamente o recebimento de novos relatos. Os dados existentes continuarão disponíveis para consulta, mas o canal ficará inacessível para denunciantes.
                  </p>

                  {dangerStep === 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => setDangerStep(1)}
                      className="text-[var(--color-danger)] border border-[var(--color-danger)]/20 hover:bg-[var(--color-danger-surface)] transition-all"
                    >
                      Desativar Canal de Denúncias
                    </Button>
                  )}

                  {dangerStep === 1 && (
                    <div className="p-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-surface)]/30 space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-[var(--color-danger)] shrink-0" size={18} />
                        <div className="space-y-1">
                          <p className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)]">Confirme a desativação</p>
                          <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">
                            Digite o slug da organização <span className="font-mono font-bold text-[var(--color-danger)]">{org?.slug}</span> para prosseguir.
                          </p>
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        value={dangerConfirmText}
                        onChange={(e) => setDangerConfirmText(e.target.value)}
                        placeholder={org?.slug ?? "slug"}
                        className="w-full h-11 rounded-xl border border-[var(--color-danger)]/30 px-4 bg-white text-[var(--color-text-primary)] text-[var(--text-sm)] font-mono focus:ring-2 focus:ring-[var(--color-danger)]/20 transition-all outline-none"
                      />
                      
                      <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={() => { setDangerStep(0); setDangerConfirmText(""); }}>
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={dangerLoading}
                          disabled={dangerConfirmText !== org?.slug}
                          onClick={handleDeactivateChannel}
                          className="bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white border-none disabled:opacity-30"
                        >
                          Confirmar Desativação Definitiva
                        </Button>
                      </div>
                    </div>
                  )}

                  {dangerStep === 2 && (
                    <div className="p-4 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 flex items-center gap-3 text-[var(--color-danger)]">
                      <CheckCircle2 size={20} />
                      <p className="text-[var(--text-sm)] font-bold">
                        Canal desativado. Entre em contato com o suporte para reativar.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Add user modal */}
      <Modal
        open={addUserOpen}
        onClose={() => { setAddUserOpen(false); setCreateUserError(null); }}
        title="Convidar Novo Membro"
        footer={
          <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setAddUserOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={creatingUser} onClick={handleCreateUser}>
              Enviar Convite
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="flex flex-col gap-1 mb-2">
            <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              Preencha os dados abaixo para enviar um convite de acesso à plataforma.
            </p>
          </div>
          
          <Input 
            label="Nome Completo" 
            value={newUserNome} 
            onChange={(e) => setNewUserNome(e.target.value)} 
            placeholder="Ex: João Silva"
            required 
          />
          
          <Input 
            label="E-mail Corporativo" 
            type="email" 
            value={newUserEmail} 
            onChange={(e) => setNewUserEmail(e.target.value)} 
            placeholder="joao@empresa.com.br"
            required 
          />
          
          <Select 
            label="Perfil de Acesso" 
            options={ROLE_OPTIONS} 
            value={newUserRole} 
            onChange={(e) => setNewUserRole(e.target.value as Role)} 
          />
          
          {createUserError && (
            <div className="p-3 rounded-xl bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 flex items-center gap-2 text-[var(--color-danger)] text-[var(--text-sm)]">
              <AlertTriangle size={16} />
              {createUserError}
            </div>
          )}
          
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex gap-3">
              <ShieldAlert className="text-[var(--color-text-tertiary)] shrink-0" size={18} />
              <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] leading-relaxed">
                Uma senha temporária será gerada automaticamente e enviada para o e-mail do usuário. Ele deverá redefini-la no primeiro acesso por questões de segurança.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
