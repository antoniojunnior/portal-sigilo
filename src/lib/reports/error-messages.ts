const ERROR_MESSAGES: Record<string, string> = {
  plan_suspended: "Seu plano está suspenso ou cancelado. Entre em contato com o suporte para reativar o acesso a relatórios.",
};

/**
 * BUG-20260723-PSU1: route.ts retorna códigos de máquina (ex.: "plan_suspended")
 * em vez de mensagens para humano. Traduz códigos conhecidos; passa o resto direto.
 */
export function translateGenerateErrorMessage(raw: string): string {
  return ERROR_MESSAGES[raw] ?? raw;
}
