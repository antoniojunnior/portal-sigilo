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
    body { font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; color: #1a1a1a; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 13px; margin-bottom: 32px; }
    .protocolo { font-family: monospace; font-size: 24px; font-weight: bold;
      letter-spacing: 4px; border: 2px solid #000; padding: 16px; text-align: center;
      border-radius: 8px; margin: 24px 0; }
    .aviso { font-size: 12px; color: #555; line-height: 1.6; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Portal Sigilo</h1>
  <p class="sub">Comprovante de relato registrado</p>
  <p><strong>Data de registro:</strong> ${data}</p>
  <div class="protocolo">${protocolo}</div>
  <div class="aviso">
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
      className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 transition-colors"
    >
      <span aria-hidden>⬇</span> Salvar comprovante
    </button>
  );
}
