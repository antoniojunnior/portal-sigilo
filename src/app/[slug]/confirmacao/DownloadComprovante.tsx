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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 48px auto; color: #0f172a; background: #fff; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
    .icon { width: 36px; height: 36px; }
    .brand { font-size: 18px; font-weight: 700; }
    .brand span:first-child { color: #1b3d7b; }
    .brand span:last-child { color: #00b5ad; }
    h2 { font-size: 13px; color: #64748b; font-weight: 400; margin: 0 0 32px; }
    .date { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .protocol-box { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; text-align: center; margin-bottom: 24px; }
    .protocol-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
    .protocol-num { font-family: 'Courier New', monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.08em; color: #0f172a; }
    .notice { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
    .footer { font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <svg class="icon" viewBox="0 0 40 50" fill="none">
      <path d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8" stroke="#1B3D7B" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z" fill="#00B5AD"/>
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="white" fill-opacity="0.85"/>
      <rect x="8" y="33" width="20" height="2.5" rx="1.25" fill="white" fill-opacity="0.85"/>
      <rect x="8" y="38" width="15" height="2.5" rx="1.25" fill="white" fill-opacity="0.85"/>
    </svg>
    <div class="brand"><span>portal</span><span>sigilo</span></div>
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
      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
    >
      <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <path d="M7 1v8M4 6l3 3 3-3M2 11h10"/>
      </svg>
      Salvar comprovante
    </button>
  );
}
