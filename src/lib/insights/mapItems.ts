// BUG-20260722-SRC1: fonte não persistida cai aqui — "ai_generated" só é correto
// quando o dado é legado (persistido antes desta feature ter o campo `source`).
export function resolveInsightSource(source: string | undefined): string {
  return source ?? "ai_generated";
}

export function mapInsightItemsToInsightResponse(items: string[]): {
  summary: string;
  description: string;
  recommendations: string[];
} {
  if (items.length === 0) {
    return { summary: "", description: "", recommendations: [] };
  }
  const summary = items[0] ?? "";
  const description = items.length >= 2 ? items[1] : "";
  const recommendations = items.length >= 2 ? items.slice(2) : [];
  return { summary, description, recommendations };
}
