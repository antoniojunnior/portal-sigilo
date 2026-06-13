import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  ArrowRight,
  RefreshCcw,
  BarChart3,
} from "lucide-react";

type CaseStatus = "Aberto" | "Em análise" | "Em triagem" | "Encerrado";
type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

type RecentCase = {
  protocol: string;
  category: string;
  urgency: UrgencyLevel;
  urgencyLabel: string;
  slaHours: number;
  status: CaseStatus;
  openedAt: string;
};

type DepartmentHeatmapRow = {
  department: string;
  values: {
    assedio: number;
    discriminacao: number;
    fraude: number;
    conduta: number;
    outros: number;
  };
};

const recentCases: RecentCase[] = [
  {
    protocol: "ETK-AZ91-2043",
    category: "Assédio moral",
    urgency: 5,
    urgencyLabel: "Crítica",
    slaHours: -12,
    status: "Aberto",
    openedAt: "02/05/2024 08:21",
  },
  {
    protocol: "ETK-KL22-9911",
    category: "Discriminação",
    urgency: 4,
    urgencyLabel: "Alta",
    slaHours: 6,
    status: "Em análise",
    openedAt: "02/05/2024 07:15",
  },
  {
    protocol: "ETK-PL33-8822",
    category: "Conduta inadequada",
    urgency: 3,
    urgencyLabel: "Média",
    slaHours: 18,
    status: "Aberto",
    openedAt: "01/05/2024 16:42",
  },
  {
    protocol: "ETK-MN44-7763",
    category: "Fraude",
    urgency: 2,
    urgencyLabel: "Baixa",
    slaHours: 32,
    status: "Em triagem",
    openedAt: "01/05/2024 11:08",
  },
  {
    protocol: "ETK-QW55-6654",
    category: "Outros",
    urgency: 1,
    urgencyLabel: "Muito baixa",
    slaHours: 40,
    status: "Aberto",
    openedAt: "30/04/2024 18:33",
  },
];

const heatmapRows: DepartmentHeatmapRow[] = [
  { department: "Financeiro", values: { assedio: 6, discriminacao: 4, fraude: 2, conduta: 3, outros: 1 } },
  { department: "Recursos Humanos", values: { assedio: 4, discriminacao: 6, fraude: 1, conduta: 2, outros: 2 } },
  { department: "Operações", values: { assedio: 3, discriminacao: 2, fraude: 1, conduta: 5, outros: 1 } },
  { department: "Comercial", values: { assedio: 2, discriminacao: 1, fraude: 0, conduta: 3, outros: 1 } },
  { department: "TI", values: { assedio: 1, discriminacao: 0, fraude: 2, conduta: 1, outros: 0 } },
  { department: "Jurídico", values: { assedio: 0, discriminacao: 0, fraude: 1, conduta: 1, outros: 0 } },
  { department: "Outros", values: { assedio: 1, discriminacao: 1, fraude: 0, conduta: 1, outros: 2 } },
];

const navItems = [
  { label: "Visão geral", icon: Home, active: true },
  { label: "Casos", icon: FileText, active: false },
  { label: "Relatórios", icon: BarChart3, active: false },
  { label: "Mensagens", icon: MessageSquare, active: false },
  { label: "Usuários", icon: Users, active: false },
  { label: "Configurações", icon: Settings, active: false },
];

function getHeatmapIntensity(value: number): React.CSSProperties {
  const opacity = Math.min(0.12 + value * 0.12, 0.84);
  return {
    backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(opacity * 100)}%, var(--color-card))`,
  };
}

function getSlaColor(hours: number): string {
  if (hours < 0) return "bg-[var(--color-danger)]";
  if (hours <= 8) return "bg-[var(--color-warning)]";
  return "bg-[var(--color-success)]";
}

function getUrgencyClasses(level: UrgencyLevel): string {
  const map: Record<UrgencyLevel, string> = {
    1: "bg-[var(--color-urgency-1-surface)] text-[var(--color-urgency-1)]",
    2: "bg-[var(--color-urgency-2-surface)] text-[var(--color-urgency-2)]",
    3: "bg-[var(--color-urgency-3-surface)] text-[var(--color-urgency-3)]",
    4: "bg-[var(--color-urgency-4-surface)] text-[var(--color-urgency-4)]",
    5: "bg-[var(--color-urgency-5-surface)] text-[var(--color-urgency-5)]",
  };
  return map[level];
}

function getStatusClasses(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    Aberto: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
    "Em análise": "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]",
    "Em triagem": "bg-[var(--color-warning-surface)] text-[var(--color-warning)]",
    Encerrado: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  };
  return map[status];
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width-expanded)] transform overflow-hidden bg-[var(--color-primary-xdark)] text-[var(--color-text-inverse)] transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Navegação principal"
    >
      <div className="flex h-full flex-col p-5">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <ShieldCheck size={23} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Portal</p>
              <p className="font-[var(--font-display)] text-2xl leading-none">Sigilo</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={`flex h-12 items-center gap-3 rounded-xl px-4 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-white/60 ${
                  item.active
                    ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)]"
                    : "text-white/78 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-white/12 bg-white/7 p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <strong>Plano Gestão</strong>
            <span className="rounded-full bg-[var(--color-success)] px-2 py-1 text-[11px] font-semibold text-white">Ativo</span>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-white/70">Seu plano inclui todos os recursos de gestão.</p>
          <button className="h-10 w-full rounded-lg border border-white/30 text-sm font-medium transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60">
            Ver plano
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--dashboard-header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/92 px-4 backdrop-blur md:px-6 lg:ml-[var(--sidebar-width-expanded)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] outline-none transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)] lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Empresa Exemplo LTDA</p>
          <p className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            Ambiente de produção
          </p>
        </div>
      </div>

      <div className="hidden w-full max-w-md items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 shadow-[var(--shadow-xs)] md:flex">
        <Search size={17} className="text-[var(--color-text-tertiary)]" />
        <input
          aria-label="Buscar protocolo, caso ou categoria"
          className="ml-2 w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          placeholder="Buscar protocolo, caso ou categoria..."
        />
        <span className="rounded-md bg-[var(--color-bg-tertiary)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]">⌘ K</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]"
        >
          <Bell size={20} />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">3</span>
        </button>
        <div className="flex items-center gap-3 border-l border-[var(--color-border)] pl-3">
          <div className="h-9 w-9 rounded-full bg-[var(--color-primary-surface)] ring-2 ring-[var(--color-card)]" aria-hidden="true" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Antonio Silva</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Gestor</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  tone?: "primary" | "danger" | "success";
}) {
  const toneClasses = {
    primary: "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]",
    danger: "bg-[var(--color-danger-surface)] text-[var(--color-danger)]",
    success: "bg-[var(--color-success-surface)] text-[var(--color-success)]",
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <svg width="84" height="30" viewBox="0 0 84 30" aria-hidden="true" className="mt-3 hidden sm:block">
          <polyline
            points="0,22 14,17 28,11 42,18 56,12 70,16 84,9"
            fill="none"
            stroke={`var(${tone === "danger" ? "--color-danger" : tone === "success" ? "--color-success" : "--color-primary"})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">{value}</p>
      <p className={`mt-3 text-xs ${tone === "danger" ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>{trend}</p>
    </section>
  );
}

function CriticalAlert() {
  return (
    <section className="animate-[pulse_3s_ease-in-out_infinite] rounded-2xl border border-[var(--color-danger)] bg-[var(--color-danger-surface)] p-4 shadow-[var(--shadow-sm)] md:flex md:items-center md:justify-between md:p-5">
      <div className="flex gap-4">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-card)] text-[var(--color-danger)]">
          <AlertTriangle size={24} strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="font-semibold text-[var(--color-text-primary)]">Existe 1 caso sem resposta há mais de 48 horas.</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">Conforme o SLA do seu plano, o prazo máximo é de 48 horas.</p>
        </div>
      </div>
      <button className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-on-accent)] shadow-[var(--shadow-sm)] transition hover:brightness-95 focus-visible:shadow-[var(--shadow-focus-danger)] md:mt-0">
        Ver caso
        <ArrowRight size={17} />
      </button>
    </section>
  );
}

function RecentCases() {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Casos recentes</h2>
        <button className="hidden h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)] sm:inline-flex">
          Ver todos os casos
          <ArrowRight size={16} />
        </button>
        <button className="h-9 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-primary-dark)] sm:hidden">Ver todos</button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[740px] border-collapse text-sm">
          <thead>
            <tr className="h-11 border-b border-[var(--color-border)] text-left text-xs font-medium text-[var(--color-text-secondary)]">
              <th className="px-5">Protocolo</th>
              <th className="px-4">Categoria</th>
              <th className="px-4">Urgência</th>
              <th className="px-4">SLA</th>
              <th className="px-4">Status</th>
              <th className="px-4">Abertura</th>
              <th className="w-10 px-4" />
            </tr>
          </thead>
          <tbody>
            {recentCases.map((item) => (
              <tr key={item.protocol} className="h-[52px] border-b border-[var(--color-border)] transition duration-100 hover:bg-[var(--color-card-hover)]">
                <td className="px-5 font-[var(--font-mono)] text-xs font-semibold text-[var(--color-text-primary)]">
                  <span className={`mr-3 inline-block h-2 w-2 rounded-full ${item.urgency >= 5 ? "bg-[var(--color-danger)]" : item.urgency >= 4 ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"}`} />
                  {item.protocol}
                </td>
                <td className="px-4 text-[var(--color-text-primary)]">{item.category}</td>
                <td className="px-4">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getUrgencyClasses(item.urgency)}`}>{item.urgency} {item.urgencyLabel}</span>
                </td>
                <td className="px-4">
                  <span className={item.slaHours < 0 ? "text-[var(--color-danger)]" : item.slaHours <= 8 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}>
                    {item.slaHours < 0 ? `${item.slaHours}h` : `${item.slaHours}h`}
                  </span>
                  <div className="mt-1 h-1.5 w-16 rounded-full bg-[var(--color-bg-tertiary)]">
                    <div className={`h-1.5 rounded-full ${getSlaColor(item.slaHours)}`} style={{ width: item.slaHours < 0 ? "100%" : `${Math.max(20, Math.min(100, item.slaHours * 2.5))}%` }} />
                  </div>
                </td>
                <td className="px-4">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>{item.status}</span>
                </td>
                <td className="px-4 text-xs text-[var(--color-text-secondary)]">{item.openedAt}</td>
                <td className="px-4 text-[var(--color-text-secondary)]"><MoreHorizontal size={17} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--color-border)] md:hidden">
        {recentCases.map((item) => (
          <article key={item.protocol} className="p-5 transition hover:bg-[var(--color-card-hover)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${item.urgency >= 5 ? "bg-[var(--color-danger)]" : item.urgency >= 4 ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"}`} />
                <div>
                  <p className="font-[var(--font-mono)] text-sm font-semibold text-[var(--color-text-primary)]">{item.protocol}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.category}</p>
                </div>
              </div>
              <button aria-label="Mais opções" className="rounded-lg p-1 text-[var(--color-text-secondary)] focus-visible:shadow-[var(--shadow-focus)]">
                <MoreHorizontal size={18} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 pl-5">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getUrgencyClasses(item.urgency)}`}>{item.urgency} {item.urgencyLabel}</span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>{item.status}</span>
              <span className={item.slaHours < 0 ? "text-sm font-semibold text-[var(--color-danger)]" : "text-sm font-semibold text-[var(--color-success)]"}>{item.slaHours}h</span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-[var(--color-border)] px-5 py-4 text-xs text-[var(--color-text-secondary)]">
        <RefreshCcw size={14} />
        Atualizado há 2 minutos
      </div>
    </section>
  );
}

function Heatmap() {
  const maxValue = useMemo(() => {
    return Math.max(...heatmapRows.flatMap((row) => Object.values(row.values)));
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Concentração de casos por departamento</h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Mapa de calor por categoria registrada</p>
        </div>
        <select aria-label="Filtrar categoria" className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-text-primary)] outline-none focus-visible:shadow-[var(--shadow-focus)]">
          <option>Categoria: Todas</option>
          <option>Assédio moral</option>
          <option>Discriminação</option>
          <option>Fraude</option>
          <option>Conduta inadequada</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="h-9 text-left text-xs text-[var(--color-text-secondary)]">
              <th className="w-40 pr-3 font-medium">Departamento</th>
              <th className="text-center font-medium">Assédio</th>
              <th className="text-center font-medium">Discriminação</th>
              <th className="text-center font-medium">Fraude</th>
              <th className="text-center font-medium">Conduta inadequada</th>
              <th className="text-center font-medium">Outros</th>
              <th className="text-center font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {heatmapRows.map((row) => {
              const total = Object.values(row.values).reduce((sum, value) => sum + value, 0);
              return (
                <tr key={row.department} className="h-10 border-b border-[var(--color-border)] last:border-b-0">
                  <td className="pr-3 text-xs font-semibold text-[var(--color-primary-dark)]">{row.department}</td>
                  {Object.values(row.values).map((value, index) => (
                    <td key={`${row.department}-${index}`} className="border border-[var(--color-card)] text-center text-sm font-semibold text-[var(--color-text-primary)]" style={getHeatmapIntensity(maxValue === 0 ? 0 : value)}>
                      {value}
                    </td>
                  ))}
                  <td className="text-center font-bold text-[var(--color-text-primary)]">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-center gap-3 text-xs text-[var(--color-text-secondary)]">
        <span>Menor concentração</span>
        <div className="h-2 w-36 rounded-full bg-gradient-to-r from-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-card))] to-[var(--color-accent)]" />
        <span>Maior concentração</span>
      </div>
    </section>
  );
}

function AIInsight() {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
          <Sparkles className="text-[var(--color-primary)]" size={21} strokeWidth={1.8} />
          Insight da IA
        </h2>
        <span className="text-xs text-[var(--color-text-secondary)]">Gerado há 5 min</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-3xl leading-none text-[var(--color-primary-dark)]">“</p>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">3 casos registrados esta semana envolvem o mesmo departamento:</p>
          <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">Departamento Financeiro.</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Os relatos compartilham padrões semelhantes relacionados à comunicação inadequada e pressão excessiva por metas.
          </p>
          <button className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-card-hover)] focus-visible:shadow-[var(--shadow-focus)]">
            Ver análise completa
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Recomendações sugeridas</h3>
          <ul className="space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />Investigar padrões de comunicação no departamento.</li>
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />Avaliar treinamentos de liderança.</li>
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />Acompanhar novos relatos envolvendo a mesma equipe.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 pb-3 pt-2 shadow-[var(--shadow-lg)] backdrop-blur lg:hidden" aria-label="Navegação inferior">
      <div className="grid grid-cols-5 gap-1">
        {[
          { label: "Visão geral", icon: Home, active: true },
          { label: "Casos", icon: FileText, active: false },
          { label: "Relatórios", icon: BarChart3, active: false },
          { label: "Mensagens", icon: MessageSquare, active: false },
          { label: "Mais", icon: MoreHorizontal, active: false },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] outline-none transition focus-visible:shadow-[var(--shadow-focus)] ${item.active ? "bg-[var(--color-primary-surface)] text-[var(--color-primary-dark)]" : "text-[var(--color-text-secondary)]"}`}>
              <Icon size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function PortalSigiloDashboardG1() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] font-[var(--font-body)] text-[var(--color-text-primary)]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-[var(--color-overlay)] lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="pb-28 lg:ml-[var(--sidebar-width-expanded)] lg:pb-10">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-[var(--font-display)] text-4xl leading-tight tracking-tight text-[var(--color-text-primary)] md:text-5xl">Bom dia, Antonio.</h1>
              <p className="mt-1 text-lg text-[var(--color-text-secondary)]">Aqui está o resumo de hoje.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)]">
              <span className="flex items-center gap-2"><CalendarDays size={16} /> Segunda, 02 de Maio</span>
              <span className="hidden h-4 w-px bg-[var(--color-border)] sm:block" />
              <span className="flex items-center gap-2"><RefreshCcw size={16} /> Atualizado há 2 min</span>
            </div>
          </div>

          <div className="space-y-5 md:space-y-6">
            <CriticalAlert />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Casos abertos" value="24" trend="↑ 12% desde ontem" icon={FolderOpen} />
              <MetricCard label="Casos críticos" value="3" trend="↑ 1 desde ontem" icon={AlertTriangle} tone="danger" />
              <MetricCard label="Tempo médio de resposta" value="18h 24m" trend="↓ 15% desde a semana passada" icon={Clock3} />
              <MetricCard label="Encerrados no mês" value="17" trend="↑ 8% desde o mês passado" icon={CheckCircle2} tone="success" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <RecentCases />
              <Heatmap />
            </section>

            <AIInsight />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
