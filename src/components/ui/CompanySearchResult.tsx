interface CompanySearchResultProps {
  org: { id: string; nome: string; slug: string; logo?: string | null };
  onSelect: () => void;
}

/** Result card for org search. Used in Tela 0 search dropdown. */
export function CompanySearchResult({ org, onSelect }: CompanySearchResultProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-5 min-h-[52px] hover:bg-[var(--color-card-hover)] text-left transition-colors focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] cursor-pointer"
    >
      {org.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={org.logo}
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 rounded-[var(--radius-md)] object-contain flex-shrink-0"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-surface)] flex items-center justify-center flex-shrink-0 text-[var(--text-xs)] font-semibold text-[var(--color-primary-dark)]"
          aria-hidden
        >
          {org.nome.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] truncate">
          {org.nome}
        </p>
        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-0.5">{org.slug}</p>
      </div>

      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-[var(--color-border-strong)]" aria-hidden>
        <path d="M4 2l4 4-4 4" />
      </svg>
    </button>
  );
}
