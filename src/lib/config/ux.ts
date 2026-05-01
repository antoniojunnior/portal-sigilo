/**
 * Parâmetros de UX ajustáveis manualmente para tuning.
 * Altere os valores aqui e recarregue para testar.
 */
export const UX_CONFIG = {
  /**
   * Intervalo do drain de caracteres no chat (ms por caractere).
   * 30ms ≈ 200 WPM. Diminua para digitação mais rápida.
   */
  CHAT_TYPING_INTERVAL_MS: 50,
} as const;
