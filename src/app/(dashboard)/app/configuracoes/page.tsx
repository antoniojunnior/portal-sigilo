import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const PLAN_OPTIONS = [
  { value: "entrada", label: "Entrada" },
  { value: "gestao", label: "Gestão" },
  { value: "enterprise", label: "Enterprise" },
];

export default function ConfiguracoesPage() {
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: "Visão geral", href: "/app" }, { label: "Configurações" }]}
        user={{ name: "Admin" }}
      />

      <PageContainer>
        <div className="max-w-lg space-y-6">
          {/* Org settings */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
              Organização
            </h2>

            <Input label="Nome da organização" defaultValue="Empresa Demo" />
            <Input label="Slug / URL do portal" defaultValue="empresa-demo" helper="portal-sigilo.com.br/empresa-demo" />
            <Input label="E-mail de notificações" type="email" defaultValue="compliance@empresa.com" />

            <Select
              label="Plano atual"
              options={PLAN_OPTIONS}
              defaultValue="gestao"
            />

            <div className="pt-2">
              <Button variant="primary" size="md">
                Salvar alterações
              </Button>
            </div>
          </section>

          {/* Portal customization */}
          <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">
              Personalização do portal
            </h2>

            <Input
              label="Mensagem de boas-vindas"
              defaultValue="Este é um espaço seguro para você ser ouvido."
              helper="Exibida na tela inicial do canal de denúncias."
            />

            <div className="pt-2">
              <Button variant="primary" size="md">
                Salvar personalização
              </Button>
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-[var(--color-danger-surface)] border border-[var(--color-danger)]/20 rounded-[var(--radius-lg)] p-5 space-y-3">
            <h2 className="text-[var(--text-base)] font-semibold text-[var(--color-danger)]">
              Zona de perigo
            </h2>
            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              Ações irreversíveis. Proceda com cautela.
            </p>
            <Button variant="danger" size="sm">
              Desativar canal
            </Button>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
