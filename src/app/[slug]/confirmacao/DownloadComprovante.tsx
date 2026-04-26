"use client";

interface Props {
  protocolo: string;
  data: string;
}

export function DownloadComprovante({ protocolo, data }: Props) {
  function download() {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comprovante de Relato — Portal Sigilo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 48px auto; color: #0F2030; background: #fff; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .icon { width: 36px; height: 45px; }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
    .brand .p { color: #2A6070; }
    .brand .s { color: #C05A4A; }
    h2 { font-size: 13px; color: #6A8898; font-weight: 400; margin: 0 0 32px; }
    .date { font-size: 13px; color: #6A8898; margin-bottom: 24px; }
    .protocol-box { background: #E8F2F5; border: 1px solid rgba(42,96,112,0.20); border-left: 4px solid #2A6070; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .protocol-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.10em; color: #1D4A5A; margin-bottom: 8px; }
    .protocol-num { font-family: 'Courier New', monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.08em; color: #102F3C; white-space: nowrap; }
    .notice { background: #F7FAFB; border: 1px solid #D3E3E8; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #3D5A6A; line-height: 1.6; margin-bottom: 32px; }
    .footer { font-size: 11px; color: #6A8898; border-top: 1px solid #D3E3E8; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <svg class="icon" viewBox="0 0 40 50" fill="none">
      <path d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8" stroke="#2A6070" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z" fill="#C05A4A"/>
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="white" fill-opacity="0.95"/>
      <rect x="8" y="33" width="20" height="2.5" rx="1.25" fill="white" fill-opacity="0.80"/>
      <rect x="8" y="38" width="15" height="2.5" rx="1.25" fill="white" fill-opacity="0.65"/>
    </svg>
    <div class="brand"><span class="p">portal</span><span class="s">sigilo</span></div>
  </div>
  <h2>Comprovante de relato registrado</h2>
  <p class="date"><strong>Data de registro:</strong> ${data}</p>
  <div class="protocol-box">
    <div class="protocol-label">Número do protocolo</div>
    <div class="protocol-num">${protocolo}</div>
  </div>
  <div class="notice">
    <p>Guarde este número com cuidado.</p>
    <p>Nenhum dado pessoal está vinculado a ele. Sem este protocolo, não é possível acompanhar este relato.</p>
    <p>Prazo de resposta: até 30 dias.</p>
  </div>
  <div class="footer">Portal Sigilo · Canal de relatos corporativo · portalsigilo.com.br</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprovante-${protocolo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      aria-label="Salvar comprovante do relato"
      className="flex items-center justify-center w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] transition-colors"
      style={{
        height: 40,
        gap: 7,
        background: "var(--color-card)",
        border: "0.5px solid var(--color-border-strong)",
        borderRadius: "var(--radius-md)",
        fontSize: 13,
        fontWeight: 400,
        color: "var(--color-text-secondary)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-secondary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card)"; }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <path d="M8 2v8M5 7l3 3 3-3"/>
        <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/>
      </svg>
      Salvar comprovante
    </button>
  );
}
