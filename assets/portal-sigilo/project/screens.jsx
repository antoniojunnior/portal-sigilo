/* Portal Sigilo — Screen mockups (React) */

// ─────────────────────────────────────────────
// Logo (recreated faithfully from LogoSigilo.tsx)
// ─────────────────────────────────────────────
function LogoSigilo({ variant = "full", iconSize = 32 }) {
  const h = Math.round(iconSize * 1.25);
  const icon = (
    <svg width={iconSize} height={h} viewBox="0 0 40 50" fill="none" aria-hidden>
      <path d="M10 22V14C10 8.477 14.477 4 20 4s10 4.477 10 10v8" stroke="#1B3D7B" strokeWidth="4.5" strokeLinecap="round"/>
      <path d="M4 20h32c2.209 0 4 1.791 4 4v16c0 2.209-1.791 4-4 4H18L8 50l2-6H4c-2.209 0-4-1.791-4-4V24c0-2.209 1.791-4 4-4z" fill="#00B5AD"/>
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="white" fillOpacity="0.85"/>
      <rect x="8" y="33" width="20" height="2.5" rx="1.25" fill="white" fillOpacity="0.85"/>
      <rect x="8" y="38" width="15" height="2.5" rx="1.25" fill="white" fillOpacity="0.85"/>
    </svg>
  );
  if (variant === "icon") return icon;
  return (
    <span style={{display:"flex", alignItems:"center", gap:10}}>
      {icon}
      <span style={{fontWeight:700, lineHeight:1, letterSpacing:"-0.02em", fontSize:iconSize*0.56, fontFamily:"Inter,system-ui,sans-serif"}}>
        <span style={{color:"#1B3D7B"}}>portal</span>
        <span style={{color:"#00B5AD"}}>sigilo</span>
      </span>
    </span>
  );
}

function AnonBadge() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 10px",
      background:"var(--color-anon-bg)",
      border:"1px solid var(--color-anon-border)",
      borderRadius:9999,
      fontSize:11, fontWeight:500, color:"var(--color-anon-text)"
    }}>
      <span className="anon-dot" />
      Anônimo
    </span>
  );
}

// ─────────────────────────────────────────────
// TELA 0 — Search portal
// ─────────────────────────────────────────────
function Tela0Search() {
  return (
    <div className="portal-bg" style={{padding:"56px 28px", display:"flex", flexDirection:"column", alignItems:"center", gap:32}}>
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:18}}>
        <LogoSigilo iconSize={52}/>
        <div style={{display:"flex", alignItems:"center", gap:10, fontSize:11, color:"var(--color-text-tertiary)"}}>
          <span style={{display:"flex", alignItems:"center", gap:5}}>
            <svg viewBox="0 0 12 12" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="7" r="3"/><path d="M6 4V2M4 4.5L2.5 3M8 4.5L9.5 3"/></svg>
            inteligente
          </span>
          <span style={{color:"var(--color-border-strong)"}}>·</span>
          <span style={{display:"flex", alignItems:"center", gap:5}}>
            <svg viewBox="0 0 12 12" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2H2C1.45 2 1 2.45 1 3v5c0 .55.45 1 1 1h1l1 2 1-2h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z"/></svg>
            conecta
          </span>
          <span style={{color:"var(--color-border-strong)"}}>·</span>
          <span style={{display:"flex", alignItems:"center", gap:5}}>
            <svg viewBox="0 0 12 12" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1L2 3v3c0 2.5 1.8 4.5 4 5 2.2-.5 4-2.5 4-5V3L6 1z"/></svg>
            protege
          </span>
        </div>
      </div>

      <div style={{
        width:340, background:"var(--color-card)", border:"1px solid var(--color-border)",
        borderRadius:24, boxShadow:"var(--shadow-sm)", overflow:"hidden"
      }}>
        <div style={{padding:"24px 24px 20px"}}>
          <div style={{fontSize:16, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4}}>Acesse seu canal</div>
          <div style={{fontSize:13, color:"var(--color-text-secondary)", marginBottom:20, lineHeight:1.5}}>
            Digite o nome da empresa para encontrar o portal de denúncias.
          </div>
          <div style={{position:"relative"}}>
            <svg style={{position:"absolute", left:14, top:14}} viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input readOnly defaultValue="acm" style={{
              width:"100%", borderRadius:8, border:"1px solid var(--color-border)",
              background:"var(--color-bg-secondary)", padding:"10px 14px 10px 38px", fontSize:13,
              color:"var(--color-text-primary)", outline:"none"
            }}/>
          </div>
        </div>
        <div style={{borderTop:"1px solid var(--color-border)"}}>
          {[
            {n:"ACME Indústrias", s:"acme.portalsigilo.com.br"},
            {n:"ACME Logística", s:"acme-log.portalsigilo.com.br"},
          ].map((r,i)=>(
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"12px 24px", borderBottom: i===0?"1px solid var(--color-border)":"none",
              cursor:"pointer", background: i===0 ? "var(--color-card-hover)":"transparent"
            }}>
              <div style={{width:28, height:28, borderRadius:6, background:"var(--color-primary-surface)", color:"var(--color-primary-dark)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600}}>
                {r.n[0]}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:500, color:"var(--color-text-primary)"}}>{r.n}</div>
                <div style={{fontSize:11, color:"var(--color-text-tertiary)"}}>{r.s}</div>
              </div>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><path d="M6 4l4 4-4 4" strokeLinecap="round"/></svg>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 24px", borderTop:"1px solid var(--color-border)", textAlign:"center"}}>
          <span style={{fontSize:10, color:"var(--color-text-tertiary)"}}>Digite ao menos 2 caracteres para buscar</span>
        </div>
      </div>

      <div style={{textAlign:"center"}}>
        <div style={{display:"flex", justifyContent:"center", gap:6, marginBottom:10}}>
          {["Lei 14.457/22","NR-1","LGPD"].map(l=>(
            <span key={l} style={{fontSize:10, color:"var(--color-text-tertiary)", padding:"2px 8px", borderRadius:4, border:"1px solid var(--color-border)"}}>{l}</span>
          ))}
        </div>
        <div style={{fontSize:10, color:"var(--color-text-tertiary)", display:"flex", alignItems:"center", justifyContent:"center", gap:4}}>
          Canal operado por <LogoSigilo variant="icon" iconSize={13}/>
          <span style={{fontWeight:500, color:"#00B5AD"}}>Portal Sigilo</span>
          · portalsigilo.com.br
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TELA 1 — Org landing (welcome)
// ─────────────────────────────────────────────
function Tela1Welcome() {
  const guarantees = [
    { t: "Anonimato garantido", d: "Nenhum dado que identifique você é coletado.",
      icon: <><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><path d="M3 3l10 10" strokeLinecap="round"/></> },
    { t: "Resposta em até 30 dias", d: "Acompanhe pelo número de protocolo.",
      icon: <><circle cx="8" cy="8.5" r="5.5"/><path d="M8 5.5v3l2 1.5" strokeLinecap="round"/><path d="M5.5 1.5h5" strokeLinecap="round"/></> },
    { t: "Gestão independente", d: "Comitê externo sem conflito de interesse.",
      icon: <><path d="M8 2v12" strokeLinecap="round"/><path d="M3 5h10" strokeLinecap="round"/><path d="M3 5l-1.5 4a2.5 2.5 0 0 0 5 0L5 5M13 5l-1.5 4a2.5 2.5 0 0 0 5 0L13 5" strokeLinejoin="round"/><path d="M5 14h6" strokeLinecap="round"/></> },
  ];
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column"}}>
      <header style={{
        background:"var(--color-card)", borderBottom:"1px solid var(--color-border)",
        padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <div style={{display:"flex", alignItems:"center", gap:14}}>
          <LogoSigilo iconSize={24}/>
          <span style={{height:18, width:1, background:"var(--color-border)"}}/>
          <span style={{fontSize:11, color:"var(--color-text-tertiary)", letterSpacing:"0.04em"}}>
            canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
          </span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>Já tem protocolo?</span>
          <AnonBadge/>
        </div>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1}}>
        <div style={{maxWidth:560, margin:"0 auto"}}>
          <div style={{padding:"56px 40px", textAlign:"center", borderBottom:"1px solid var(--color-border)", background:"var(--color-card)"}}>
            <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"var(--color-primary-surface)", color:"var(--color-primary-dark)", fontSize:11, fontWeight:500, padding:"4px 12px", borderRadius:9999, marginBottom:20}}>
              <span style={{width:6, height:6, borderRadius:9999, background:"var(--color-primary)"}}/>
              Canal de denúncias seguro e confidencial
            </div>
            <h1 style={{fontSize:26, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1.3, maxWidth:420, margin:"0 auto 12px"}}>
              Este é um espaço seguro para você ser ouvido.
            </h1>
            <p style={{fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.65, maxWidth:380, margin:"0 auto 32px"}}>
              Relate situações de assédio, fraude ou qualquer irregularidade. Sua identidade é protegida durante todo o processo.
            </p>
            <div style={{display:"flex", justifyContent:"center", gap:10}}>
              <button className="btn-primary">Fazer uma denúncia</button>
              <button className="btn-ghost">Como funciona</button>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderBottom:"1px solid var(--color-border)", background:"var(--color-card)"}}>
            {guarantees.map((g,i)=>(
              <div key={g.t} style={{padding:"20px 20px", textAlign:"center", borderRight: i<2?"1px solid var(--color-border)":"none"}}>
                <div style={{width:32, height:32, borderRadius:9999, background:"var(--color-primary-surface)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px"}}>
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{g.icon}</svg>
                </div>
                <div style={{fontSize:11, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4}}>{g.t}</div>
                <div style={{fontSize:10, color:"var(--color-text-tertiary)", lineHeight:1.5}}>{g.d}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex", alignItems:"center", gap:12, padding:"16px 24px", background:"var(--color-bg-secondary)", borderBottom:"1px solid var(--color-border)"}}>
            <span style={{fontSize:11, color:"var(--color-text-tertiary)", whiteSpace:"nowrap"}}>Já tem protocolo?</span>
            <input placeholder="ETK-2024-0000" style={{flex:1, fontFamily:"var(--font-mono)", fontSize:12, padding:"8px 12px", borderRadius:6, border:"1px solid var(--color-border)", background:"var(--color-card)", color:"var(--color-text-primary)"}}/>
            <button className="btn-secondary-sm">Acompanhar →</button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// TELA 2 — Chat / Relato
// ─────────────────────────────────────────────
function ChatBubble({autor, texto, time}) {
  const isUser = autor === "denunciante";
  const label = isUser ? "Você" : autor === "gestor" ? "Comitê" : "Canal Sigilo";
  return (
    <div style={{display:"flex", gap:10, flexDirection: isUser?"row-reverse":"row"}}>
      {!isUser && (
        <div style={{marginTop:2, flexShrink:0, width:24, height:24, borderRadius:9999, background:"var(--color-primary-surface)", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <span style={{width:8, height:8, borderRadius:9999, background:"var(--color-primary)"}}/>
        </div>
      )}
      <div style={{display:"flex", flexDirection:"column", gap:4, maxWidth:"78%", alignItems: isUser?"flex-end":"flex-start"}}>
        <span style={{fontSize:11, color:"var(--color-text-tertiary)", padding:"0 2px"}}>
          {label} {time && <span style={{marginLeft:6}}>{time}</span>}
        </span>
        <div style={{
          borderRadius:16, padding:"10px 16px", fontSize:13, lineHeight:1.65, whiteSpace:"pre-wrap",
          ...(isUser ? {
            background:"var(--color-primary)", color:"#fff", borderTopRightRadius:4
          } : {
            background:"var(--color-card)", color:"var(--color-text-primary)", borderTopLeftRadius:4, border:"1px solid var(--color-border)"
          })
        }}>
          {texto}
        </div>
      </div>
    </div>
  );
}

function Tela2Chat() {
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column"}}>
      <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"0 20px", height:48, display:"flex", alignItems:"center"}}>
        <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>← Voltar</span>
      </div>

      {/* progress bar */}
      <div style={{padding:"12px 20px", background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
          <span style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Etapa 2 de 4</span>
          <span style={{fontSize:10, color:"var(--color-text-tertiary)"}}>Detalhes do ocorrido</span>
        </div>
        <div style={{height:4, background:"var(--color-bg-tertiary)", borderRadius:9999, overflow:"hidden"}}>
          <div style={{width:"50%", height:"100%", background:"var(--color-primary)", borderRadius:9999}}/>
        </div>
      </div>

      <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
        <div style={{flex:1, padding:"20px", display:"flex", flexDirection:"column", gap:16, background:"var(--color-bg-secondary)", overflowY:"auto"}}>
          <ChatBubble autor="sistema" time="14:02" texto={"Olá. Este é um espaço seguro e confidencial.\n\nVocê pode me contar o que aconteceu com suas próprias palavras, no seu ritmo. Quando estiver pronto, pode começar."}/>
          <ChatBubble autor="denunciante" time="14:04" texto="Quero relatar uma situação de assédio que está acontecendo na minha equipe há alguns meses."/>
          <ChatBubble autor="sistema" time="14:04" texto={"Obrigado por compartilhar. Para eu entender melhor: quando isso aconteceu (aproximadamente) e onde foi?"}/>
        </div>

        {/* Quick replies */}
        <div style={{padding:"10px 20px", background:"var(--color-card)", borderTop:"1px solid var(--color-border)", display:"flex", flexWrap:"wrap", gap:8}}>
          {["Ambiente de trabalho","Relação com gestor","Processo ou contrato","Outro assunto"].map(r=>(
            <button key={r} className="quick-reply">{r}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{padding:"12px 16px", background:"var(--color-card)", borderTop:"1px solid var(--color-border)", display:"flex", gap:8, alignItems:"flex-end"}}>
          <button style={{width:36, height:36, borderRadius:8, background:"var(--color-bg-secondary)", border:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-tertiary)"}}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 7L8 10 5 7M8 10V2M2 12v2h12v-2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{flex:1, minHeight:36, maxHeight:120, padding:"8px 12px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)", fontSize:13, color:"var(--color-text-tertiary)"}}>
            Escreva no seu ritmo…
          </div>
          <button className="btn-primary-icon">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8L14 2 10 14 8 9 2 8z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TELA 3 — Confirmation
// ─────────────────────────────────────────────
function Tela3Confirm() {
  const protocolo = "ETK-2024-0042";
  const steps = [
    {l:"Recebido", d:"Seu relato foi registrado.", done:true},
    {l:"Em apuração", d:"O comitê conduz a investigação.", done:false},
    {l:"Conclusão", d:"Resultado disponível pelo protocolo.", done:false},
  ];
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column"}}>
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:14}}>
          <LogoSigilo iconSize={24}/>
          <span style={{height:18, width:1, background:"var(--color-border)"}}/>
          <span style={{fontSize:11, color:"var(--color-text-tertiary)", letterSpacing:"0.04em"}}>
            canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
          </span>
        </div>
        <AnonBadge/>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1}}>
        <div style={{maxWidth:560, margin:"0 auto"}}>
          <div style={{padding:"40px 40px", textAlign:"center", borderBottom:"1px solid var(--color-border)", background:"var(--color-card)"}}>
            <div style={{width:56, height:56, borderRadius:9999, background:"var(--color-success-surface)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px"}}>
              <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round"><path d="M5 14l6 6L23 8"/></svg>
            </div>
            <h1 style={{fontSize:22, fontWeight:600, color:"var(--color-text-primary)", margin:"0 0 8px"}}>Relato recebido com sucesso.</h1>
            <p style={{fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.65, maxWidth:380, margin:"0 auto"}}>
              Seu relato foi registrado de forma segura e anônima. O comitê responsável será notificado e a apuração terá início em até 5 dias úteis.
            </p>
          </div>

          <div style={{padding:"32px 24px", background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
            <div style={{maxWidth:300, margin:"0 auto", textAlign:"center"}}>
              <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8}}>Seu protocolo</div>
              <div style={{
                fontFamily:"var(--font-mono)", fontSize:22, fontWeight:600, color:"var(--color-primary-dark)",
                background:"var(--color-primary-surface)", border:"1px dashed var(--color-primary)",
                padding:"14px 20px", borderRadius:8, letterSpacing:"0.04em"
              }}>{protocolo}</div>
              <div style={{fontSize:11, color:"var(--color-text-tertiary)", marginTop:10}}>Guarde este código. É a única forma de acompanhar o caso.</div>
            </div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
            {steps.map((s,i)=>(
              <div key={s.l} style={{padding:"20px 16px", textAlign:"center", borderRight: i<2?"1px solid var(--color-border)":"none"}}>
                <div style={{
                  width:24, height:24, borderRadius:9999, display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 8px", fontSize:11, fontWeight:500,
                  background: s.done?"var(--color-success)":"var(--color-primary-surface)",
                  color: s.done?"#fff":"var(--color-primary-dark)"
                }}>
                  {s.done ? <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2.5"/></svg> : (i+1)}
                </div>
                <div style={{fontSize:11, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:10, color:"var(--color-text-tertiary)", lineHeight:1.5}}>{s.d}</div>
              </div>
            ))}
          </div>

          <div style={{padding:"20px 24px", background:"var(--color-card)", display:"flex", flexDirection:"column", gap:10}}>
            <button className="btn-primary">Acompanhar pelo protocolo</button>
            <button className="btn-secondary">Baixar comprovante (PDF)</button>
            <button className="btn-ghost">Voltar ao início</button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// TELA 4 — Acompanhar (track)
// ─────────────────────────────────────────────
function Tela4Track() {
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column"}}>
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"0 20px", height:56, display:"flex", alignItems:"center", gap:14}}>
        <span style={{fontSize:14, color:"var(--color-text-tertiary)"}}>←</span>
        <LogoSigilo iconSize={24}/>
        <span style={{height:18, width:1, background:"var(--color-border)"}}/>
        <span style={{fontSize:11, color:"var(--color-text-tertiary)", letterSpacing:"0.04em", flex:1}}>
          canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
        </span>
        <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>Acompanhar relato</span>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1, maxWidth:560, width:"100%", margin:"0 auto"}}>
        {/* Status card */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"20px 24px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
            <span style={{fontFamily:"var(--font-mono)", fontSize:13, fontWeight:500, color:"var(--color-text-primary)"}}>ETK-2024-0042</span>
            <span style={{
              display:"inline-flex", alignItems:"center", padding:"4px 10px", borderRadius:9999,
              fontSize:11, fontWeight:500, border:"1px solid", background:"#eff6ff", color:"#1d4ed8", borderColor:"#bfdbfe"
            }}>Em apuração</span>
          </div>
          <div style={{fontSize:11, color:"var(--color-text-tertiary)", marginBottom:16}}>Registrado em 18 de abril de 2026</div>

          <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10}}>Histórico</div>
          <ol style={{listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:6}}>
            {[
              {t:"Relato recebido", d:"18 abr"},
              {t:"Triagem inicial concluída", d:"19 abr"},
              {t:"Comitê notificado — apuração iniciada", d:"21 abr"},
            ].map((h,i)=>(
              <li key={i} style={{display:"flex", alignItems:"flex-start", gap:10}}>
                <span style={{marginTop:6, width:6, height:6, borderRadius:9999, background:"var(--color-primary)", flexShrink:0}}/>
                <span style={{fontSize:12, color:"var(--color-text-secondary)"}}>{h.t} <span style={{marginLeft:6, color:"var(--color-text-tertiary)"}}>{h.d}</span></span>
              </li>
            ))}
          </ol>
        </div>

        {/* Committee chat */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
          <div style={{padding:"12px 24px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", gap:8}}>
            <span style={{width:6, height:6, borderRadius:9999, background:"var(--color-primary)"}}/>
            <span style={{fontSize:11, fontWeight:500, color:"var(--color-text-primary)"}}>Mensagens do comitê</span>
          </div>
          <div style={{padding:"16px 20px", display:"flex", flexDirection:"column", gap:12, background:"var(--color-bg-secondary)", maxHeight:200}}>
            <ChatBubble autor="gestor" time="ontem 16:30" texto="Olá. Para avançar com a apuração, você poderia confirmar se há outras pessoas que presenciaram o ocorrido? Não precisamos de nomes — apenas se houve testemunhas."/>
            <ChatBubble autor="denunciante" time="ontem 18:12" texto="Sim, havia ao menos 2 colegas presentes em ocasiões diferentes."/>
          </div>
          <div style={{padding:"10px 16px", borderTop:"1px solid var(--color-border)", display:"flex", gap:8, alignItems:"center"}}>
            <div style={{flex:1, padding:"8px 12px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)", fontSize:12, color:"var(--color-text-tertiary)"}}>Responder ao comitê…</div>
            <button className="btn-primary-icon">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8L14 2 10 14 8 9 2 8z"/></svg>
            </button>
          </div>
        </div>

        <div style={{padding:"10px 24px", background:"var(--color-card)", textAlign:"center"}}>
          <span style={{fontSize:10, color:"var(--color-text-tertiary)"}}>Atualiza automaticamente a cada 30 segundos.</span>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD — Sidebar
// ─────────────────────────────────────────────
function Sidebar({active="overview", plan="essential"}) {
  const items = [
    {k:"overview", l:"Visão geral", icon:<><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="9" rx="1"/></>},
    {k:"casos", l:"Casos", badge:"12", icon:<><path d="M4 2h8c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1z"/><path d="M5 6h6M5 9h4" strokeLinecap="round"/></>},
    {k:"relatorios", l:"Relatórios", icon:<><path d="M2 12V9l3-3 3 2 3-4v8H2z"/><path d="M2 14h12" strokeLinecap="round"/></>},
    plan==="plus" && {k:"insights", l:"Insights · IA", icon:<><circle cx="8" cy="8" r="5"/><path d="M6 8a2 2 0 0 1 4 0" strokeLinecap="round"/><path d="M8 13v1M3 8H2M14 8h-1" strokeLinecap="round"/></>},
    {k:"configuracoes", l:"Configurações", icon:<><circle cx="8" cy="8" r="2.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1" strokeLinecap="round"/></>},
  ].filter(Boolean);
  return (
    <nav style={{
      width:230, flexShrink:0, background:"var(--color-card)",
      borderRight:"1px solid var(--color-border)", display:"flex", flexDirection:"column"
    }}>
      <div style={{padding:"0 16px", height:56, borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center"}}>
        <LogoSigilo iconSize={24}/>
      </div>

      {/* Workspace switcher — identifies which company's data the operator is looking at */}
      <div style={{padding:"12px 12px 10px", borderBottom:"1px solid var(--color-border)"}}>
        <div style={{fontSize:9, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8, padding:"0 4px"}}>Workspace</div>
        <div style={{display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)", cursor:"pointer"}}>
          <div style={{width:28, height:28, borderRadius:6, background:"var(--color-primary)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, flexShrink:0}}>A</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:12, fontWeight:600, color:"var(--color-text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>ACME Indústrias</div>
            <div style={{display:"flex", alignItems:"center", gap:4, fontSize:9, color:"var(--color-text-tertiary)"}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:3, padding:"1px 5px", borderRadius:3, background: plan==="plus"?"var(--color-accent-surface)":"var(--color-primary-surface)", color: plan==="plus"?"var(--color-accent-dark)":"var(--color-primary-dark)", fontWeight:600, letterSpacing:"0.04em"}}>
                {plan==="plus" ? "PLUS" : "ESSENCIAL"}
              </span>
              <span>· 1.240 colab.</span>
            </div>
          </div>
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><path d="M3 5l3-3 3 3M3 7l3 3 3-3" strokeLinecap="round"/></svg>
        </div>
      </div>

      <div style={{padding:"12px 0", flex:1}}>
        {items.map(it=>{
          const isActive = it.k===active;
          return (
            <div key={it.k} style={{
              display:"flex", alignItems:"center", gap:12,
              margin:"0 8px 2px", padding:"9px 12px", borderRadius:8,
              background: isActive ? "var(--color-primary-surface)" : "transparent",
              color: isActive ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
              cursor:"pointer"
            }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke={isActive?"var(--color-primary)":"currentColor"} strokeWidth="1.5">
                {it.icon}
              </svg>
              <span style={{fontSize:13, fontWeight:500, flex:1}}>{it.l}</span>
              {it.badge && <span style={{fontSize:10, fontWeight:500, background:"var(--color-accent-surface)", color:"var(--color-accent)", padding:"1px 6px", borderRadius:9999, lineHeight:1.4}}>{it.badge}</span>}
            </div>
          );
        })}
      </div>
      <div style={{borderTop:"1px solid var(--color-border)", padding:8}}>
        <div style={{display:"flex", alignItems:"center", gap:8, padding:"8px 12px", color:"var(--color-text-tertiary)", fontSize:11}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 4L6 8l4 4"/></svg>
          Colapsar
        </div>
      </div>
    </nav>
  );
}

function DashHeader({crumbs, period="Últimos 30 dias", notif=3}) {
  return (
    <header style={{
      background:"var(--color-card)", borderBottom:"1px solid var(--color-border)",
      padding:"0 20px", height:56, display:"flex", alignItems:"center", gap:16
    }}>
      <ol style={{listStyle:"none", padding:0, margin:0, display:"flex", alignItems:"center", gap:6, flex:1}}>
        {crumbs.map((c,i)=>(
          <li key={c} style={{display:"flex", alignItems:"center", gap:6}}>
            {i>0 && <span style={{color:"var(--color-text-tertiary)", fontSize:11}}>/</span>}
            <span style={{
              fontSize:13, fontWeight: i===crumbs.length-1?500:400,
              color: i===crumbs.length-1?"var(--color-text-primary)":"var(--color-text-tertiary)"
            }}>{c}</span>
          </li>
        ))}
      </ol>
      <span style={{fontSize:11, color:"var(--color-text-tertiary)", border:"1px solid var(--color-border)", padding:"4px 10px", borderRadius:5}}>{period}</span>
      <button style={{position:"relative", width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-tertiary)", border:"none", background:"transparent"}}>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a5 5 0 0 0-5 5v2l-1 2h12l-1-2V7a5 5 0 0 0-5-5zM6 13a2 2 0 0 0 4 0" strokeLinecap="round"/></svg>
        {notif>0 && <span style={{position:"absolute", top:6, right:6, width:7, height:7, borderRadius:9999, background:"var(--color-accent)"}}/>}
      </button>
      <div style={{width:30, height:30, borderRadius:9999, background:"var(--color-primary-surface)", color:"var(--color-primary-dark)", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center"}}>AD</div>
    </header>
  );
}

function MetricCard({label, value, trendValue, trend="neutral", compareLabel}) {
  const tc = trend==="up" ? "var(--color-success)" : trend==="down" ? "var(--color-danger)" : "var(--color-text-tertiary)";
  const arrow = trend==="up" ? "↑" : trend==="down" ? "↓" : "";
  return (
    <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
      <div style={{fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:12}}>{label}</div>
      <div style={{fontSize:28, fontWeight:700, color:"var(--color-text-primary)", lineHeight:1, marginBottom:8, fontVariantNumeric:"tabular-nums"}}>{value}</div>
      <div style={{display:"flex", alignItems:"center", gap:6}}>
        {trendValue && <span style={{fontSize:11, fontWeight:600, color:tc}}>{arrow} {trendValue}</span>}
        {compareLabel && <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>{compareLabel}</span>}
      </div>
    </div>
  );
}

function StatusBadge({status}) {
  const map = {
    aguardando_triagem: {l:"Aguardando triagem", bg:"#fef3c7", fg:"#a16207", bd:"#fde68a"},
    em_apuracao: {l:"Em apuração", bg:"#dbeafe", fg:"#1d4ed8", bd:"#bfdbfe"},
    pendente_informacao: {l:"Pendente de informação", bg:"#ffedd5", fg:"#c2410c", bd:"#fed7aa"},
    encerrado_com_acao: {l:"Encerrado com ação", bg:"var(--color-primary-surface)", fg:"var(--color-primary-dark)", bd:"var(--color-border-strong)"},
  };
  const m = map[status] ?? map.em_apuracao;
  return <span style={{display:"inline-flex", padding:"3px 10px", borderRadius:9999, fontSize:11, fontWeight:500, background:m.bg, color:m.fg, border:`1px solid ${m.bd}`}}>{m.l}</span>;
}

function UrgencyDot({level, showLabel}) {
  const colors = ["#1A7A5A","#4A8A2A","#B07020","#C05A4A","#9A2020"];
  const c = colors[level-1];
  return (
    <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
      <span style={{width:8, height:8, borderRadius:9999, background:c, animation: level>=5?"urgencyPulse 2s ease-in-out infinite":"none"}}/>
      {showLabel && <span style={{fontSize:11, fontWeight:500, color:c, fontVariantNumeric:"tabular-nums"}}>{level}/5</span>}
    </span>
  );
}

function ChannelBadge({channel}) {
  const map = {
    web: {l:"Web", bg:"#f0f9ff", fg:"#0369a1", bd:"#bae6fd"},
    whatsapp: {l:"WhatsApp", bg:"#f0fdf4", fg:"#15803d", bd:"#bbf7d0"},
    app: {l:"App", bg:"#f5f3ff", fg:"#6d28d9", bd:"#ddd6fe"},
    "0800": {l:"0800", bg:"#fef3c7", fg:"#a16207", bd:"#fde68a"},
  };
  const m = map[channel] ?? map.web;
  return <span style={{display:"inline-flex", padding:"2px 8px", borderRadius:9999, fontSize:10, fontWeight:500, background:m.bg, color:m.fg, border:`1px solid ${m.bd}`}}>{m.l}</span>;
}

// ─────────────────────────────────────────────
// DASHBOARD — Visão geral
// ─────────────────────────────────────────────
function DashOverview() {
  const metrics = [
    { label: "Casos abertos", value: 12, trendValue: "+3", trend: "up", compareLabel: "vs. mês anterior" },
    { label: "Em apuração", value: 7, trendValue: "-1", trend: "down", compareLabel: "vs. mês anterior" },
    { label: "Resolvidos (30d)", value: 5, trendValue: "+2", trend: "up", compareLabel: "vs. mês anterior" },
    { label: "Prazo médio", value: "18d", trend: "neutral", compareLabel: "meta: 30d" },
  ];
  const recent = [
    { protocolo: "ETK-2024-0042", urgency: 5, status: "em_apuracao", category: "Assédio moral" },
    { protocolo: "ETK-2024-0041", urgency: 3, status: "aguardando_triagem", category: "Fraude" },
    { protocolo: "ETK-2024-0040", urgency: 2, status: "em_apuracao", category: "Conflito de interesse" },
  ];
  return (
    <div style={{display:"flex", height:"100%", background:"var(--color-bg-secondary)"}}>
      <Sidebar active="overview"/>
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <DashHeader crumbs={["Visão geral"]}/>
        <div style={{padding:24, flex:1, overflow:"auto"}}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:24}}>
            {metrics.map(m=><MetricCard key={m.label} {...m}/>)}
          </div>

          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
            <h2 style={{fontSize:15, fontWeight:600, color:"var(--color-text-primary)", margin:0}}>Casos recentes</h2>
            <span style={{fontSize:13, color:"var(--color-primary)", cursor:"pointer"}}>Ver todos →</span>
          </div>

          <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, overflow:"hidden"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--color-border)"}}>
                  {["Urgência","Categoria","Protocolo","Status"].map(h=>(
                    <th key={h} style={{padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(c=>(
                  <tr key={c.protocolo} style={{borderBottom:"1px solid var(--color-border)"}}>
                    <td style={{padding:"12px 16px"}}><UrgencyDot level={c.urgency} showLabel/></td>
                    <td style={{padding:"12px 16px", fontSize:13, color:"var(--color-text-secondary)"}}>{c.category}</td>
                    <td style={{padding:"12px 16px", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--color-text-tertiary)"}}>{c.protocolo}</td>
                    <td style={{padding:"12px 16px"}}><StatusBadge status={c.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Two-up: distribution + activity */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:24}}>
            <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
              <div style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)", marginBottom:16}}>Distribuição por urgência</div>
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                {[
                  {l:"Crítica (5)", v:1, c:"#9A2020"},
                  {l:"Alta (4)", v:2, c:"#C05A4A"},
                  {l:"Média (3)", v:4, c:"#B07020"},
                  {l:"Moderada (2)", v:3, c:"#4A8A2A"},
                  {l:"Baixa (1)", v:2, c:"#1A7A5A"},
                ].map(r=>(
                  <div key={r.l} style={{display:"flex", alignItems:"center", gap:10}}>
                    <span style={{fontSize:11, color:"var(--color-text-secondary)", width:90}}>{r.l}</span>
                    <div style={{flex:1, height:8, background:"var(--color-bg-tertiary)", borderRadius:9999, overflow:"hidden"}}>
                      <div style={{width:`${(r.v/4)*100}%`, height:"100%", background:r.c, borderRadius:9999}}/>
                    </div>
                    <span style={{fontSize:11, fontWeight:600, color:"var(--color-text-primary)", fontVariantNumeric:"tabular-nums", width:14, textAlign:"right"}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
              <div style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)", marginBottom:16}}>Canais de origem</div>
              <div style={{display:"flex", alignItems:"flex-end", gap:8, height:120, paddingBottom:8, borderBottom:"1px solid var(--color-border)"}}>
                {[
                  {l:"Web", v:78, c:"#0369a1"},
                  {l:"WhatsApp", v:42, c:"#15803d"},
                  {l:"App", v:18, c:"#6d28d9"},
                  {l:"0800", v:9, c:"#a16207"},
                ].map(b=>(
                  <div key={b.l} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                    <span style={{fontSize:10, fontWeight:600, color:"var(--color-text-secondary)"}}>{b.v}</span>
                    <div style={{width:"100%", height:`${b.v}%`, background:b.c, borderRadius:"4px 4px 0 0", opacity:0.85}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"flex", marginTop:8}}>
                {["Web","WhatsApp","App","0800"].map(l=>(
                  <span key={l} style={{flex:1, fontSize:10, color:"var(--color-text-tertiary)", textAlign:"center"}}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD — Visão geral · PLUS (heatmap + IA)
// ─────────────────────────────────────────────
function Heatmap() {
  const departments = ["Operações","Comercial","Logística","RH","Financeiro","TI","Manufatura"];
  const categories = ["Assédio","Fraude","Conflito","Segurança","Discrim.","Outros"];
  // 0..4 intensity; reproducible "data"
  const data = [
    [3,1,0,2,1,0],
    [1,2,3,0,1,1],
    [0,0,1,4,0,1],
    [2,0,1,0,2,1],
    [0,3,2,0,0,0],
    [1,1,0,1,0,2],
    [0,0,0,4,0,1],
  ];
  const intensity = (v) => v===0 ? "var(--color-bg-secondary)"
    : v===1 ? "#E8F2F5"
    : v===2 ? "#C9DDE3"
    : v===3 ? "#D4806E"
    : "#9A2020";
  const fg = (v) => v>=3 ? "#fff" : v===0 ? "var(--color-text-tertiary)" : "var(--color-text-secondary)";
  return (
    <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14}}>
        <div>
          <div style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)"}}>Concentração por departamento</div>
          <div style={{fontSize:11, color:"var(--color-text-tertiary)", marginTop:2}}>Casos abertos cruzados por categoria — últimos 90 dias</div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:6, fontSize:10, color:"var(--color-text-tertiary)"}}>
          <span>menos</span>
          {[0,1,2,3,4].map(v=>(
            <span key={v} style={{width:12, height:12, borderRadius:3, background: intensity(v), border:"1px solid var(--color-border)"}}/>
          ))}
          <span>mais</span>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:`118px repeat(${categories.length}, 1fr)`, gap:4}}>
        <div/>
        {categories.map(c=>(
          <div key={c} style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textAlign:"center", padding:"4px 0"}}>{c}</div>
        ))}
        {departments.map((d,r)=>(
          <React.Fragment key={d}>
            <div style={{fontSize:11, color:"var(--color-text-secondary)", padding:"6px 8px", display:"flex", alignItems:"center"}}>{d}</div>
            {data[r].map((v,c)=>(
              <div key={c} title={`${d} · ${categories[c]}: ${v} casos`} style={{
                aspectRatio:"1.4 / 1", background: intensity(v), borderRadius:4,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:600, color: fg(v), fontVariantNumeric:"tabular-nums",
                cursor:"pointer"
              }}>{v>0 ? v : ""}</div>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div style={{marginTop:14, paddingTop:12, borderTop:"1px dashed var(--color-border)", display:"flex", gap:14, fontSize:11, color:"var(--color-text-secondary)"}}>
        <span>↗ <b style={{color:"var(--color-danger)"}}>RH</b> e <b style={{color:"var(--color-danger)"}}>Manufatura</b> concentram 53% das ocorrências em <i>Segurança</i>.</span>
      </div>
    </div>
  );
}

function AIInsights() {
  const insights = [
    {tag:"PADRÃO", c:"var(--color-accent)", t:"3 casos similares em Manufatura · turno noturno", d:"Possível causa estrutural — sugiro abrir investigação ampliada."},
    {tag:"RISCO", c:"var(--color-warning)", t:"ETK-2024-0042 ultrapassou prazo de triagem", d:"Recomendo escalar para o comitê externo nas próximas 24h."},
    {tag:"TENDÊNCIA", c:"var(--color-primary)", t:"+38% de relatos via WhatsApp neste trimestre", d:"Considere ampliar a equipe de triagem do canal."},
  ];
  return (
    <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:0, overflow:"hidden", display:"flex", flexDirection:"column"}}>
      <div style={{padding:"16px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", gap:10}}>
        <div style={{width:28, height:28, borderRadius:9999, background:"linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#fff" strokeWidth="1.6"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)"}}>Insights de IA</div>
          <div style={{fontSize:10, color:"var(--color-text-tertiary)"}}>Atualizado há 12 min · análise sobre dados anonimizados</div>
        </div>
        <span style={{fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:3, background:"var(--color-accent-surface)", color:"var(--color-accent-dark)", letterSpacing:"0.04em"}}>PLUS</span>
      </div>

      <div style={{padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, flex:1, overflow:"auto"}}>
        {insights.map((it,i)=>(
          <div key={i} style={{padding:"12px 14px", borderRadius:8, background:"var(--color-bg-secondary)", border:"1px solid var(--color-border)"}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
              <span style={{fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:3, background: it.c, color:"#fff", letterSpacing:"0.06em"}}>{it.tag}</span>
              <span style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1.4}}>{it.t}</span>
            </div>
            <div style={{fontSize:11, color:"var(--color-text-secondary)", lineHeight:1.55, paddingLeft:2}}>{it.d}</div>
          </div>
        ))}
      </div>

      {/* Chat input */}
      <div style={{padding:"12px 14px", borderTop:"1px solid var(--color-border)", background:"var(--color-bg-secondary)"}}>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:10}}>
          {["Onde estão os pontos de risco?","Resumir últimos 30 dias","Comparar com Q1"].map(q=>(
            <button key={q} className="quick-reply" style={{fontSize:11, padding:"5px 10px", minHeight:28}}>{q}</button>
          ))}
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, background:"var(--color-card)", border:"1px solid var(--color-border)"}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--color-primary)" strokeWidth="1.6"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round"/></svg>
          <input placeholder="Pergunte à IA sobre seus dados…" style={{flex:1, border:"none", outline:"none", background:"transparent", fontSize:12, color:"var(--color-text-primary)"}}/>
          <button className="btn-primary-icon" style={{width:28, height:28}}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8L14 2 10 14 8 9 2 8z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function DashOverviewPlus() {
  const metrics = [
    { label: "Casos abertos", value: 12, trendValue: "+3", trend: "up", compareLabel: "vs. mês anterior" },
    { label: "Em apuração", value: 7, trendValue: "-1", trend: "down", compareLabel: "vs. mês anterior" },
    { label: "Resolvidos (30d)", value: 5, trendValue: "+2", trend: "up", compareLabel: "vs. mês anterior" },
    { label: "Prazo médio", value: "18d", trend: "neutral", compareLabel: "meta: 30d" },
  ];
  return (
    <div style={{display:"flex", height:"100%", background:"var(--color-bg-secondary)"}}>
      <Sidebar active="overview" plan="plus"/>
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <DashHeader crumbs={["Visão geral"]}/>
        <div style={{padding:24, flex:1, overflow:"auto"}}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginBottom:20}}>
            {metrics.map(m=><MetricCard key={m.label} {...m}/>)}
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:20, minHeight:340}}>
            <Heatmap/>
            <AIInsights/>
          </div>

          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
            <h2 style={{fontSize:14, fontWeight:600, color:"var(--color-text-primary)", margin:0}}>Casos recentes</h2>
            <span style={{fontSize:12, color:"var(--color-primary)", cursor:"pointer"}}>Ver todos →</span>
          </div>
          <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, overflow:"hidden"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--color-border)"}}>
                  {["Urgência","Categoria","Departamento","Protocolo","Status"].map(h=>(
                    <th key={h} style={{padding:"10px 16px", textAlign:"left", fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { protocolo: "ETK-2024-0042", urgency: 5, status: "em_apuracao", category: "Assédio moral", dep:"Manufatura" },
                  { protocolo: "ETK-2024-0041", urgency: 3, status: "aguardando_triagem", category: "Fraude", dep:"Comercial" },
                  { protocolo: "ETK-2024-0040", urgency: 2, status: "em_apuracao", category: "Conflito de interesse", dep:"RH" },
                ].map(c=>(
                  <tr key={c.protocolo} style={{borderBottom:"1px solid var(--color-border)"}}>
                    <td style={{padding:"10px 16px"}}><UrgencyDot level={c.urgency} showLabel/></td>
                    <td style={{padding:"10px 16px", fontSize:12, color:"var(--color-text-secondary)"}}>{c.category}</td>
                    <td style={{padding:"10px 16px", fontSize:12, color:"var(--color-text-tertiary)"}}>{c.dep}</td>
                    <td style={{padding:"10px 16px", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--color-text-tertiary)"}}>{c.protocolo}</td>
                    <td style={{padding:"10px 16px"}}><StatusBadge status={c.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE DASHBOARD — shared chrome
// ─────────────────────────────────────────────
function MobileDashHeader({title, plan="essential"}) {
  return (
    <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"12px 16px"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
        <LogoSigilo iconSize={22}/>
        <button style={{position:"relative", width:30, height:30, borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-card)", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"><path d="M8 2a5 5 0 0 0-5 5v2l-1 2h12l-1-2V7a5 5 0 0 0-5-5z" strokeLinecap="round"/></svg>
          <span style={{position:"absolute", top:5, right:5, width:6, height:6, borderRadius:9999, background:"var(--color-accent)"}}/>
        </button>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)"}}>
        <div style={{width:22, height:22, borderRadius:5, background:"var(--color-primary)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600}}>A</div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:11, fontWeight:600, color:"var(--color-text-primary)"}}>ACME Indústrias</div>
          <div style={{fontSize:9, color:"var(--color-text-tertiary)"}}>
            <span style={{padding:"1px 5px", borderRadius:3, background: plan==="plus"?"var(--color-accent-surface)":"var(--color-primary-surface)", color: plan==="plus"?"var(--color-accent-dark)":"var(--color-primary-dark)", fontWeight:600, letterSpacing:"0.04em", fontSize:8}}>{plan==="plus"?"PLUS":"ESSENCIAL"}</span>
          </div>
        </div>
        <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><path d="M3 5l3-3 3 3M3 7l3 3 3-3" strokeLinecap="round"/></svg>
      </div>
      {title && <div style={{marginTop:12, fontFamily:"var(--font-display)", fontSize:20, color:"var(--color-text-primary)"}}>{title}</div>}
    </header>
  );
}

function MobileBottomNav({active="overview"}) {
  const items = [
    {k:"overview", l:"Visão", icon:<><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></>},
    {k:"casos", l:"Casos", badge:"12", icon:<><path d="M4 2h8c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1z"/><path d="M5 6h6M5 9h4" strokeLinecap="round"/></>},
    {k:"insights", l:"IA", icon:<><circle cx="8" cy="8" r="5"/><path d="M8 13v1" strokeLinecap="round"/></>},
    {k:"perfil", l:"Perfil", icon:<><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" strokeLinecap="round"/></>},
  ];
  return (
    <nav style={{borderTop:"1px solid var(--color-border)", background:"var(--color-card)", display:"flex", padding:"6px 0 8px"}}>
      {items.map(it=>{
        const isActive = it.k===active;
        return (
          <div key={it.k} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"6px 4px", color: isActive?"var(--color-primary)":"var(--color-text-tertiary)", position:"relative"}}>
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">{it.icon}</svg>
            <span style={{fontSize:10, fontWeight: isActive?600:500}}>{it.l}</span>
            {it.badge && <span style={{position:"absolute", top:4, right:"calc(50% - 18px)", fontSize:9, fontWeight:600, background:"var(--color-accent)", color:"#fff", padding:"0 5px", borderRadius:9999, lineHeight:1.4}}>{it.badge}</span>}
          </div>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────
// MOBILE DASHBOARD — Visão geral
// ─────────────────────────────────────────────
function MobileDashOverview() {
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--color-bg-secondary)"}}>
      <MobileDashHeader title="Visão geral" plan="plus"/>
      <div style={{flex:1, overflow:"auto", padding:"16px"}}>
        {/* Metric cards — horizontal scroll */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16}}>
          {[
            {l:"Casos abertos", v:"12", t:"+3", trend:"up"},
            {l:"Em apuração", v:"7", t:"-1", trend:"down"},
            {l:"Resolvidos", v:"5", t:"+2", trend:"up"},
            {l:"Prazo médio", v:"18d", t:"meta 30d", trend:"neutral"},
          ].map(m=>{
            const tc = m.trend==="up"?"var(--color-success)":m.trend==="down"?"var(--color-danger)":"var(--color-text-tertiary)";
            return (
              <div key={m.l} style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:"12px 14px"}}>
                <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:8}}>{m.l}</div>
                <div style={{fontSize:22, fontWeight:700, color:"var(--color-text-primary)", lineHeight:1, marginBottom:4, fontVariantNumeric:"tabular-nums"}}>{m.v}</div>
                <div style={{fontSize:10, fontWeight:600, color:tc}}>{m.trend==="up"?"↑":m.trend==="down"?"↓":""} {m.t}</div>
              </div>
            );
          })}
        </div>

        {/* AI Insight card */}
        <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:14, marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
            <div style={{width:24, height:24, borderRadius:9999, background:"linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)", display:"flex", alignItems:"center", justifyContent:"center"}}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.6"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontSize:12, fontWeight:600, color:"var(--color-text-primary)"}}>Insights de IA</span>
            <span style={{marginLeft:"auto", fontSize:8, fontWeight:600, padding:"2px 5px", borderRadius:3, background:"var(--color-accent-surface)", color:"var(--color-accent-dark)"}}>PLUS</span>
          </div>
          <div style={{padding:"10px 12px", borderRadius:8, background:"var(--color-bg-secondary)", marginBottom:10}}>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
              <span style={{fontSize:9, fontWeight:600, padding:"1px 5px", borderRadius:3, background:"var(--color-accent)", color:"#fff"}}>PADRÃO</span>
              <span style={{fontSize:11, fontWeight:500, color:"var(--color-text-primary)"}}>3 casos similares · turno noturno</span>
            </div>
            <div style={{fontSize:10, color:"var(--color-text-secondary)", lineHeight:1.5}}>Possível causa estrutural na Manufatura. Sugiro investigação ampliada.</div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6, padding:"7px 10px", borderRadius:8, background:"var(--color-bg-secondary)", border:"1px solid var(--color-border)"}}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="var(--color-primary)" strokeWidth="1.6"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round"/></svg>
            <span style={{flex:1, fontSize:11, color:"var(--color-text-tertiary)"}}>Pergunte à IA…</span>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8L14 2 10 14 8 9 2 8z"/></svg>
          </div>
        </div>

        {/* Heatmap (compact) */}
        <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:14, marginBottom:16}}>
          <div style={{fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:2}}>Por departamento</div>
          <div style={{fontSize:10, color:"var(--color-text-tertiary)", marginBottom:12}}>Toque para detalhar</div>
          {[
            {d:"Manufatura", v:[0,0,0,4,0,1], total:5},
            {d:"RH", v:[2,0,1,0,2,1], total:6},
            {d:"Comercial", v:[1,2,3,0,1,1], total:8},
            {d:"Operações", v:[3,1,0,2,1,0], total:7},
            {d:"Logística", v:[0,0,1,4,0,1], total:6},
          ].map(row=>{
            const intensity = (v) => v===0 ? "var(--color-bg-secondary)" : v===1 ? "#E8F2F5" : v===2 ? "#C9DDE3" : v===3 ? "#D4806E" : "#9A2020";
            return (
              <div key={row.d} style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                <span style={{fontSize:11, color:"var(--color-text-secondary)", width:80, flexShrink:0}}>{row.d}</span>
                <div style={{flex:1, display:"flex", gap:3}}>
                  {row.v.map((v,i)=>(
                    <div key={i} style={{flex:1, height:18, background:intensity(v), borderRadius:3}}/>
                  ))}
                </div>
                <span style={{fontSize:11, fontWeight:600, color:"var(--color-text-primary)", width:18, textAlign:"right", fontVariantNumeric:"tabular-nums"}}>{row.total}</span>
              </div>
            );
          })}
        </div>

        {/* Recent cases */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
          <span style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)"}}>Casos recentes</span>
          <span style={{fontSize:11, color:"var(--color-primary)"}}>Ver todos</span>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {[
            { protocolo: "ETK-2024-0042", urgency: 5, status: "em_apuracao", category: "Assédio moral" },
            { protocolo: "ETK-2024-0041", urgency: 3, status: "aguardando_triagem", category: "Fraude" },
          ].map(c=>(
            <div key={c.protocolo} style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:"12px 14px"}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
                <UrgencyDot level={c.urgency} showLabel/>
                <span style={{marginLeft:"auto", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)"}}>{c.protocolo}</span>
              </div>
              <div style={{fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6}}>{c.category}</div>
              <StatusBadge status={c.status}/>
            </div>
          ))}
        </div>
      </div>
      <MobileBottomNav active="overview"/>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE DASHBOARD — Casos
// ─────────────────────────────────────────────
function MobileDashCasos() {
  const cases = [
    { protocolo: "ETK-2024-0042", urgency: 5, channel: "web", category: "Assédio moral", status: "em_apuracao", deadline: "Atrasado 2d", late: true },
    { protocolo: "ETK-2024-0041", urgency: 4, channel: "whatsapp", category: "Fraude", status: "aguardando_triagem", deadline: "5d" },
    { protocolo: "ETK-2024-0040", urgency: 3, channel: "web", category: "Conflito de interesse", status: "em_apuracao", deadline: "12d" },
    { protocolo: "ETK-2024-0039", urgency: 2, channel: "app", category: "Segurança do trabalho", status: "pendente_informacao", deadline: "20d" },
    { protocolo: "ETK-2024-0038", urgency: 1, channel: "0800", category: "Relacionamento", status: "encerrado_com_acao", deadline: "—" },
  ];
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--color-bg-secondary)"}}>
      <MobileDashHeader title="Casos" plan="plus"/>
      <div style={{padding:"12px 16px", display:"flex", gap:8, background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
        <div style={{flex:1, position:"relative"}}>
          <svg style={{position:"absolute", left:10, top:9}} viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
          <input placeholder="Buscar…" style={{width:"100%", padding:"7px 12px 7px 30px", borderRadius:6, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)", fontSize:12}}/>
        </div>
        <button style={{width:32, height:32, borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-card)", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div style={{display:"flex", gap:6, padding:"10px 16px", background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", overflowX:"auto"}}>
        {["Todos","Crítica","Em apuração","Atrasados","Meus"].map((f,i)=>(
          <span key={f} style={{padding:"5px 12px", borderRadius:9999, fontSize:11, fontWeight:500, whiteSpace:"nowrap", background: i===0?"var(--color-primary)":"var(--color-bg-secondary)", color: i===0?"#fff":"var(--color-text-secondary)", border:i===0?"none":"1px solid var(--color-border)"}}>{f}</span>
        ))}
      </div>

      <div style={{flex:1, overflow:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10}}>
        {cases.map(c=>(
          <div key={c.protocolo} style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:14}}>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
              <UrgencyDot level={c.urgency} showLabel/>
              <ChannelBadge channel={c.channel}/>
              <span style={{marginLeft:"auto", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)"}}>{c.protocolo}</span>
            </div>
            <div style={{fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:8}}>{c.category}</div>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <StatusBadge status={c.status}/>
              <span style={{marginLeft:"auto", fontSize:11, fontWeight:500, color: c.late?"var(--color-danger)":"var(--color-text-tertiary)"}}>{c.deadline}</span>
            </div>
          </div>
        ))}
      </div>
      <MobileBottomNav active="casos"/>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE DASHBOARD — Caso detalhe
// ─────────────────────────────────────────────
function MobileDashCaseDetail() {
  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:"var(--color-bg-secondary)"}}>
      {/* compact header */}
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"12px 16px", display:"flex", alignItems:"center", gap:12}}>
        <span style={{fontSize:18, color:"var(--color-text-secondary)"}}>←</span>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--color-text-tertiary)"}}>ETK-2024-0042</div>
          <div style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)"}}>Assédio moral</div>
        </div>
        <button style={{width:30, height:30, borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-card)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)"}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>
        </button>
      </header>

      <div style={{flex:1, overflow:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:12}}>
        {/* status bar */}
        <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:14}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap"}}>
            <UrgencyDot level={5} showLabel/>
            <ChannelBadge channel="web"/>
            <StatusBadge status="em_apuracao"/>
          </div>
          <p style={{fontSize:12, color:"var(--color-text-secondary)", lineHeight:1.6, margin:0}}>
            Denúncia de assédio moral sistemático por parte de liderança direta. Ocorrências ao longo de 6 meses.
          </p>
        </div>

        {/* Progress */}
        <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:14}}>
          <div style={{fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:12}}>Progresso</div>
          <div style={{display:"flex", alignItems:"center", gap:0}}>
            {[
              {l:"Recebido", done:true},
              {l:"Apuração", active:true},
              {l:"Conclusão"},
            ].map((s,i,arr)=>(
              <React.Fragment key={s.l}>
                <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                  <div style={{
                    width:22, height:22, borderRadius:9999, display:"flex", alignItems:"center", justifyContent:"center",
                    background: s.done?"var(--color-success)":(s.active?"var(--color-primary)":"var(--color-bg-tertiary)"),
                    color:"#fff", fontSize:10, fontWeight:600
                  }}>
                    {s.done ? "✓" : (i+1)}
                  </div>
                  <span style={{fontSize:10, color: s.active?"var(--color-primary)":"var(--color-text-tertiary)", fontWeight: s.active?600:400}}>{s.l}</span>
                </div>
                {i<arr.length-1 && <div style={{flex:1, height:1, background: arr[i].done?"var(--color-success)":"var(--color-border)", marginBottom:14}}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* AI quick action */}
        <button style={{padding:"10px 14px", borderRadius:10, border:"1px solid var(--color-border)", background:"var(--color-card)", display:"flex", alignItems:"center", gap:10, color:"var(--color-text-primary)", fontSize:12, fontWeight:500}}>
          <div style={{width:22, height:22, borderRadius:9999, background:"linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#fff" strokeWidth="1.6"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2z" strokeLinejoin="round"/></svg>
          </div>
          <span style={{flex:1, textAlign:"left"}}>Analisar caso com IA</span>
          <span style={{fontSize:8, fontWeight:600, padding:"2px 5px", borderRadius:3, background:"var(--color-accent-surface)", color:"var(--color-accent-dark)"}}>PLUS</span>
        </button>

        {/* Audit log */}
        <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:10, padding:14}}>
          <div style={{fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:12}}>Histórico</div>
          {[
            {a:"Caso criado via portal web", t:"18 abr · 14:02"},
            {a:"Triagem inicial realizada", t:"19 abr · 09:15", d:"Urgência 5/5"},
            {a:"Comitê notificado", t:"19 abr · 09:16"},
            {a:"Mensagem ao denunciante", t:"21 abr · 16:30"},
          ].map((e,i,arr)=>(
            <div key={i} style={{display:"flex", gap:10, paddingBottom: i<arr.length-1?10:0, marginBottom: i<arr.length-1?10:0, borderBottom: i<arr.length-1?"1px solid var(--color-border)":"none"}}>
              <div style={{marginTop:5, width:6, height:6, borderRadius:9999, background:"var(--color-primary)", flexShrink:0}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)"}}>{e.a}</div>
                {e.d && <div style={{fontSize:11, color:"var(--color-text-secondary)"}}>{e.d}</div>}
                <div style={{fontSize:10, color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)", marginTop:2}}>{e.t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:"10px 16px", background:"var(--color-card)", borderTop:"1px solid var(--color-border)"}}>
        <button className="btn-primary" style={{width:"100%", minHeight:42}}>Responder ao denunciante</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD — Casos list
// ─────────────────────────────────────────────
function DashCasos() {
  const cases = [
    { protocolo: "ETK-2024-0042", urgency: 5, channel: "web", category: "Assédio moral", status: "em_apuracao", deadline: "Atrasado 2d", late: true },
    { protocolo: "ETK-2024-0041", urgency: 4, channel: "whatsapp", category: "Fraude", status: "aguardando_triagem", deadline: "5d" },
    { protocolo: "ETK-2024-0040", urgency: 3, channel: "web", category: "Conflito de interesse", status: "em_apuracao", deadline: "12d" },
    { protocolo: "ETK-2024-0039", urgency: 2, channel: "app", category: "Segurança do trabalho", status: "pendente_informacao", deadline: "20d" },
    { protocolo: "ETK-2024-0038", urgency: 1, channel: "0800", category: "Relacionamento", status: "encerrado_com_acao", deadline: "—" },
  ];
  return (
    <div style={{display:"flex", height:"100%", background:"var(--color-bg-secondary)"}}>
      <Sidebar active="casos"/>
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <DashHeader crumbs={["Visão geral","Casos"]}/>
        <div style={{padding:24, flex:1, overflow:"auto"}}>
          {/* Filters */}
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap"}}>
            <div style={{position:"relative"}}>
              <svg style={{position:"absolute", left:10, top:9}} viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
              <input placeholder="Buscar protocolo, categoria…" style={{width:280, padding:"7px 12px 7px 30px", borderRadius:6, border:"1px solid var(--color-border)", background:"var(--color-card)", fontSize:12}}/>
            </div>
            <select className="dash-select"><option>Todos os status</option></select>
            <select className="dash-select"><option>Urgência: Todas</option></select>
            <select className="dash-select"><option>Canal: Todos</option></select>
            <button className="btn-secondary-sm" style={{marginLeft:"auto"}}>↓ Exportar</button>
          </div>

          <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, overflow:"hidden"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--color-border)"}}>
                  {["Urg.","Canal","Categoria","Protocolo","Status","Prazo"].map((h,i)=>(
                    <th key={h} style={{padding:"12px 16px", textAlign: i===5?"right":"left", fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map(c=>(
                  <tr key={c.protocolo} style={{borderBottom:"1px solid var(--color-border)"}}>
                    <td style={{padding:"12px 16px"}}><UrgencyDot level={c.urgency} showLabel/></td>
                    <td style={{padding:"12px 16px"}}><ChannelBadge channel={c.channel}/></td>
                    <td style={{padding:"12px 16px", fontSize:13, color:"var(--color-text-primary)", fontWeight:500}}>{c.category}</td>
                    <td style={{padding:"12px 16px", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--color-text-tertiary)"}}>{c.protocolo}</td>
                    <td style={{padding:"12px 16px"}}><StatusBadge status={c.status}/></td>
                    <td style={{padding:"12px 16px", textAlign:"right", fontSize:12, fontWeight:500, color: c.late?"var(--color-danger)":"var(--color-text-secondary)", fontVariantNumeric:"tabular-nums"}}>{c.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16}}>
            <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>5 de 47 casos</span>
            <div style={{display:"flex", gap:6}}>
              <button className="page-btn">←</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD — Case detail
// ─────────────────────────────────────────────
function DashCaseDetail() {
  return (
    <div style={{display:"flex", height:"100%", background:"var(--color-bg-secondary)"}}>
      <Sidebar active="casos"/>
      <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
        <DashHeader crumbs={["Casos","ETK-2024-0042"]}/>
        <div style={{padding:24, flex:1, overflow:"auto"}}>
          <div style={{display:"flex", gap:20}}>
            <div style={{flex:1, display:"flex", flexDirection:"column", gap:20, minWidth:0}}>
              {/* Case header */}
              <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
                <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--color-text-tertiary)", marginBottom:4}}>ETK-2024-0042</div>
                    <h1 style={{fontSize:18, fontWeight:600, color:"var(--color-text-primary)", margin:0}}>Assédio moral</h1>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <UrgencyDot level={5} showLabel/>
                    <ChannelBadge channel="web"/>
                  </div>
                </div>
                <p style={{fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.65, margin:"0 0 16px"}}>
                  Denúncia de assédio moral sistemático por parte de liderança direta. Situação relatada com ocorrências ao longo de 6 meses.
                </p>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <StatusBadge status="em_apuracao"/>
                  <span style={{fontSize:11, color:"var(--color-text-tertiary)"}}>Registrado em 18 de abril de 2026</span>
                </div>
              </div>

              {/* Audit log */}
              <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
                <h2 style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)", margin:"0 0 16px"}}>Log de auditoria</h2>
                {[
                  {a:"Caso criado via portal web", u:"Sistema", t:"18 abr · 14:02"},
                  {a:"Triagem inicial realizada", u:"ana.silva@empresa.com", t:"19 abr · 09:15", d:"Urgência classificada como 5/5"},
                  {a:"Comitê notificado", u:"Sistema", t:"19 abr · 09:16"},
                  {a:"Mensagem enviada ao denunciante", u:"comite@empresa.com", t:"21 abr · 16:30"},
                ].map((e,i)=>(
                  <div key={i} style={{display:"flex", gap:12, paddingBottom:12, marginBottom:12, borderBottom: i<3?"1px solid var(--color-border)":"none"}}>
                    <div style={{marginTop:4, width:6, height:6, borderRadius:9999, background:"var(--color-primary)", flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, color:"var(--color-text-primary)", fontWeight:500, marginBottom:2}}>{e.a}</div>
                      {e.d && <div style={{fontSize:12, color:"var(--color-text-secondary)", marginBottom:4}}>{e.d}</div>}
                      <div style={{fontSize:11, color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)"}}>{e.u} · {e.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar column */}
            <aside style={{width:260, flexShrink:0, display:"flex", flexDirection:"column", gap:16}}>
              <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
                <h3 style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)", margin:"0 0 14px"}}>Progresso</h3>
                {[
                  {l:"Recebido", d:"Triagem iniciada", done:true},
                  {l:"Em apuração", d:"Comitê investiga", active:true},
                  {l:"Conclusão", d:"Resultado disponível", done:false},
                ].map((s,i,arr)=>(
                  <div key={s.l} style={{display:"flex", gap:10, position:"relative", paddingBottom: i<arr.length-1?16:0}}>
                    {i<arr.length-1 && <div style={{position:"absolute", left:9, top:20, bottom:0, width:1, background:"var(--color-border)"}}/>}
                    <div style={{
                      width:18, height:18, borderRadius:9999, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                      background: s.done?"var(--color-success)":(s.active?"var(--color-primary)":"var(--color-bg-tertiary)"),
                      color:"#fff", fontSize:10, fontWeight:600, zIndex:1
                    }}>
                      {s.done ? <svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 5l2 2 4-4"/></svg> : (i+1)}
                    </div>
                    <div>
                      <div style={{fontSize:12, fontWeight:500, color:s.active?"var(--color-primary)":"var(--color-text-primary)"}}>{s.l}</div>
                      <div style={{fontSize:11, color:"var(--color-text-tertiary)"}}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button style={{
                padding:"10px 14px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-card)",
                fontSize:13, fontWeight:500, color:"var(--color-text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", gap:8
              }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/><path d="M6 8a2 2 0 0 1 4 0" strokeLinecap="round"/><path d="M8 13v1M3 8H2M14 8h-1" strokeLinecap="round"/></svg>
                Analisar com IA
              </button>

              <div style={{background:"var(--color-card)", border:"1px solid var(--color-border)", borderRadius:12, padding:20}}>
                <h3 style={{fontSize:13, fontWeight:600, color:"var(--color-text-primary)", margin:"0 0 12px"}}>Atribuição</h3>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{width:32, height:32, borderRadius:9999, background:"var(--color-accent-surface)", color:"var(--color-accent-dark)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600}}>AS</div>
                  <div>
                    <div style={{fontSize:12, fontWeight:500, color:"var(--color-text-primary)"}}>Ana Silva</div>
                    <div style={{fontSize:11, color:"var(--color-text-tertiary)"}}>Comitê de ética</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE TELA 1 — Welcome
// ─────────────────────────────────────────────
function MobileTela1Welcome() {
  const guarantees = [
    { t: "Anonimato garantido", d: "Nenhum dado que identifique você é coletado.",
      icon: <><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><path d="M3 3l10 10" strokeLinecap="round"/></> },
    { t: "Resposta em até 30 dias", d: "Acompanhe pelo número de protocolo.",
      icon: <><circle cx="8" cy="8.5" r="5.5"/><path d="M8 5.5v3l2 1.5" strokeLinecap="round"/><path d="M5.5 1.5h5" strokeLinecap="round"/></> },
    { t: "Gestão independente", d: "Comitê externo sem conflito de interesse.",
      icon: <><path d="M8 2v12" strokeLinecap="round"/><path d="M3 5h10" strokeLinecap="round"/><path d="M3 5l-1.5 4a2.5 2.5 0 0 0 5 0L5 5M13 5l-1.5 4a2.5 2.5 0 0 0 5 0L13 5" strokeLinejoin="round"/><path d="M5 14h6" strokeLinecap="round"/></> },
  ];
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0}}>
          <LogoSigilo iconSize={22}/>
          <span style={{height:16, width:1, background:"var(--color-border)"}}/>
          <span style={{fontSize:10, color:"var(--color-text-tertiary)", letterSpacing:"0.04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
          </span>
        </div>
        <AnonBadge/>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1, overflow:"auto"}}>
        {/* Hero */}
        <div style={{padding:"36px 24px 28px", textAlign:"center", background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
          <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"var(--color-primary-surface)", color:"var(--color-primary-dark)", fontSize:10, fontWeight:500, padding:"4px 10px", borderRadius:9999, marginBottom:16}}>
            <span style={{width:5, height:5, borderRadius:9999, background:"var(--color-primary)"}}/>
            Canal seguro e confidencial
          </div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:400, color:"var(--color-text-primary)", lineHeight:1.2, margin:"0 0 12px"}}>
            Este é um espaço seguro para você ser ouvido.
          </h1>
          <p style={{fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.6, margin:"0 0 24px"}}>
            Relate situações de assédio, fraude ou qualquer irregularidade. Sua identidade é protegida durante todo o processo.
          </p>
          <button className="btn-primary" style={{width:"100%", marginBottom:8}}>Fazer uma denúncia</button>
          <button className="btn-ghost" style={{width:"100%"}}>Como funciona</button>
        </div>

        {/* Guarantees — vertical stack on mobile */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
          {guarantees.map((g,i)=>(
            <div key={g.t} style={{display:"flex", gap:14, padding:"16px 20px", borderBottom: i<2?"1px solid var(--color-border)":"none", alignItems:"flex-start"}}>
              <div style={{width:36, height:36, borderRadius:9999, background:"var(--color-primary-surface)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <svg viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{g.icon}</svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4}}>{g.t}</div>
                <div style={{fontSize:11, color:"var(--color-text-tertiary)", lineHeight:1.55}}>{g.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Track protocol */}
        <div style={{padding:"16px 20px"}}>
          <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8}}>Já tem protocolo?</div>
          <div style={{display:"flex", gap:8}}>
            <input placeholder="ETK-2024-0000" style={{flex:1, fontFamily:"var(--font-mono)", fontSize:12, padding:"10px 12px", borderRadius:8, border:"1px solid var(--color-border)", background:"var(--color-card)", color:"var(--color-text-primary)"}}/>
            <button className="btn-secondary-sm" style={{padding:"0 14px"}}>→</button>
          </div>
        </div>

        <div style={{padding:"16px 20px 28px", textAlign:"center"}}>
          <div style={{display:"flex", justifyContent:"center", flexWrap:"wrap", gap:6}}>
            {["Lei 14.457/22","NR-1","LGPD"].map(l=>(
              <span key={l} style={{fontSize:9, color:"var(--color-text-tertiary)", padding:"2px 8px", borderRadius:4, border:"1px solid var(--color-border)"}}>{l}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE TELA 3 — Confirmation
// ─────────────────────────────────────────────
function MobileTela3Confirm() {
  const protocolo = "ETK-2024-0042";
  const steps = [
    {l:"Recebido", d:"Seu relato foi registrado.", done:true},
    {l:"Em apuração", d:"O comitê conduz a investigação.", done:false, active:true},
    {l:"Conclusão", d:"Resultado disponível pelo protocolo.", done:false},
  ];
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0}}>
          <LogoSigilo iconSize={22}/>
          <span style={{height:16, width:1, background:"var(--color-border)"}}/>
          <span style={{fontSize:10, color:"var(--color-text-tertiary)", letterSpacing:"0.04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
          </span>
        </div>
        <AnonBadge/>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1, overflow:"auto"}}>
        {/* Hero confirm */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"32px 24px 28px", textAlign:"center"}}>
          <div style={{width:56, height:56, borderRadius:9999, background:"var(--color-success-surface)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px"}}>
            <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="var(--color-success)" strokeWidth="2.2" strokeLinecap="round"><path d="M5 14l6 6L23 8"/></svg>
          </div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:400, color:"var(--color-text-primary)", margin:"0 0 8px"}}>Relato recebido com sucesso.</h1>
          <p style={{fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.6, margin:0}}>
            Seu relato foi registrado de forma segura e anônima. O comitê responsável será notificado em até 5 dias úteis.
          </p>
        </div>

        {/* Protocol */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"24px 20px", textAlign:"center"}}>
          <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10}}>Seu protocolo</div>
          <div style={{
            fontFamily:"var(--font-mono)", fontSize:20, fontWeight:600, color:"var(--color-primary-dark)",
            background:"var(--color-primary-surface)", border:"1px dashed var(--color-primary)",
            padding:"14px 20px", borderRadius:8, letterSpacing:"0.04em", marginBottom:10
          }}>{protocolo}</div>
          <div style={{fontSize:11, color:"var(--color-text-tertiary)", lineHeight:1.5}}>Guarde este código. É a única forma de acompanhar o caso.</div>
          <button style={{marginTop:12, fontSize:11, fontWeight:500, color:"var(--color-primary)", background:"transparent", border:"none", display:"inline-flex", alignItems:"center", gap:6}}>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="9" height="9" rx="1"/><path d="M2 11V3c0-.55.45-1 1-1h8" strokeLinecap="round"/></svg>
            Copiar código
          </button>
        </div>

        {/* Steps — vertical timeline */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"20px 24px"}}>
          <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16}}>Próximos passos</div>
          {steps.map((s,i,arr)=>(
            <div key={s.l} style={{display:"flex", gap:12, position:"relative", paddingBottom: i<arr.length-1?16:0}}>
              {i<arr.length-1 && <div style={{position:"absolute", left:11, top:24, bottom:0, width:1, background:"var(--color-border)"}}/>}
              <div style={{
                width:24, height:24, borderRadius:9999, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                background: s.done?"var(--color-success)":(s.active?"var(--color-primary)":"var(--color-bg-tertiary)"),
                color: s.done||s.active?"#fff":"var(--color-text-tertiary)", fontSize:11, fontWeight:600, zIndex:1
              }}>
                {s.done ? <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2.5"/></svg> : (i+1)}
              </div>
              <div style={{flex:1, paddingTop:2}}>
                <div style={{fontSize:13, fontWeight:500, color: s.active?"var(--color-primary)":"var(--color-text-primary)", marginBottom:2}}>{s.l}</div>
                <div style={{fontSize:11, color:"var(--color-text-tertiary)", lineHeight:1.55}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{padding:"16px 20px 24px", display:"flex", flexDirection:"column", gap:10}}>
          <button className="btn-primary" style={{width:"100%"}}>Acompanhar pelo protocolo</button>
          <button className="btn-secondary" style={{width:"100%"}}>Baixar comprovante (PDF)</button>
          <button className="btn-ghost" style={{width:"100%"}}>Voltar ao início</button>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE TELA 4 — Acompanhar
// ─────────────────────────────────────────────
function MobileTela4Track() {
  return (
    <div className="portal-bg" style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <header style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10}}>
        <span style={{fontSize:18, color:"var(--color-text-secondary)"}}>←</span>
        <LogoSigilo iconSize={22}/>
        <span style={{height:16, width:1, background:"var(--color-border)"}}/>
        <span style={{fontSize:10, color:"var(--color-text-tertiary)", letterSpacing:"0.04em", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
          canal de <span style={{fontWeight:500, color:"var(--color-text-secondary)"}}>ACME Indústrias</span>
        </span>
      </header>

      <main style={{background:"var(--color-bg-secondary)", flex:1, overflow:"auto"}}>
        {/* Status card */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)", padding:"18px 20px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
            <span style={{fontFamily:"var(--font-mono)", fontSize:13, fontWeight:600, color:"var(--color-text-primary)"}}>ETK-2024-0042</span>
            <span style={{display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:9999, fontSize:11, fontWeight:500, border:"1px solid", background:"#dbeafe", color:"#1d4ed8", borderColor:"#bfdbfe"}}>Em apuração</span>
          </div>
          <div style={{fontSize:11, color:"var(--color-text-tertiary)", marginBottom:14}}>Registrado em 18 de abril de 2026</div>

          <div style={{fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10}}>Histórico</div>
          <ol style={{listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:8}}>
            {[
              {t:"Relato recebido", d:"18 abr"},
              {t:"Triagem inicial concluída", d:"19 abr"},
              {t:"Comitê notificado — apuração iniciada", d:"21 abr"},
            ].map((h,i)=>(
              <li key={i} style={{display:"flex", alignItems:"flex-start", gap:10}}>
                <span style={{marginTop:6, width:6, height:6, borderRadius:9999, background:"var(--color-primary)", flexShrink:0}}/>
                <div style={{flex:1, fontSize:12, color:"var(--color-text-secondary)", lineHeight:1.5}}>
                  {h.t}
                  <span style={{display:"block", fontSize:10, color:"var(--color-text-tertiary)", marginTop:1}}>{h.d}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Committee chat */}
        <div style={{background:"var(--color-card)", borderBottom:"1px solid var(--color-border)"}}>
          <div style={{padding:"12px 20px", borderBottom:"1px solid var(--color-border)", display:"flex", alignItems:"center", gap:8}}>
            <span style={{width:6, height:6, borderRadius:9999, background:"var(--color-primary)"}}/>
            <span style={{fontSize:11, fontWeight:500, color:"var(--color-text-primary)"}}>Mensagens do comitê</span>
            <span style={{marginLeft:"auto", fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:9999, background:"var(--color-accent-surface)", color:"var(--color-accent-dark)"}}>1 nova</span>
          </div>
          <div style={{padding:"14px 16px", display:"flex", flexDirection:"column", gap:12, background:"var(--color-bg-secondary)"}}>
            <ChatBubble autor="gestor" time="ontem 16:30" texto="Olá. Para avançar com a apuração, você poderia confirmar se há outras pessoas que presenciaram o ocorrido?"/>
            <ChatBubble autor="denunciante" time="ontem 18:12" texto="Sim, havia ao menos 2 colegas presentes em ocasiões diferentes."/>
          </div>
        </div>
      </main>

      {/* Reply input — sticky */}
      <div style={{padding:"10px 12px", background:"var(--color-card)", borderTop:"1px solid var(--color-border)", display:"flex", gap:8, alignItems:"center"}}>
        <div style={{flex:1, padding:"10px 12px", borderRadius:9999, border:"1px solid var(--color-border)", background:"var(--color-bg-secondary)", fontSize:12, color:"var(--color-text-tertiary)"}}>Responder ao comitê…</div>
        <button className="btn-primary-icon" style={{borderRadius:9999}}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8L14 2 10 14 8 9 2 8z"/></svg>
        </button>
      </div>
    </div>
  );
}

window.PortalSigilo = {
  Tela0Search, Tela1Welcome, Tela2Chat, Tela3Confirm, Tela4Track,
  MobileTela1Welcome, MobileTela3Confirm, MobileTela4Track,
  DashOverview, DashOverviewPlus, DashCasos, DashCaseDetail,
  MobileDashOverview, MobileDashCasos, MobileDashCaseDetail
};
