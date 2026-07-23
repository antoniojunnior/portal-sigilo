/**
 * Testa isRegenerationAllowed — rate limit de 24h (RF-03, D-02).
 *
 * Execute com: npx ts-node scripts/test-insights-ratelimit.ts
 */

import assert from "node:assert";

const HOURS_24 = 24 * 60 * 60 * 1000;

function isRegenerationAllowed(lastGeneratedAt: Date | null, now: Date): boolean {
  if (!lastGeneratedAt) return true;
  return now.getTime() - lastGeneratedAt.getTime() >= HOURS_24;
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}`);
    throw err;
  }
}

console.log("\n🧪 Testes: isRegenerationAllowed\n");

test("sem lastGeneratedAt → permitido", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  assert.strictEqual(isRegenerationAllowed(null, now), true);
});

test("dentro da janela de 24h → bloqueado", () => {
  const now = new Date("2026-07-22T12:00:00Z");
  const lastGenerated = new Date("2026-07-22T11:00:00Z");
  assert.strictEqual(isRegenerationAllowed(lastGenerated, now), false);
});

test("exatamente 24h atrás → permitido (limite da janela)", () => {
  const now = new Date("2026-07-23T12:00:00Z");
  const lastGenerated = new Date("2026-07-22T12:00:00Z");
  assert.strictEqual(isRegenerationAllowed(lastGenerated, now), true);
});

test("25h atrás → permitido", () => {
  const now = new Date("2026-07-23T13:00:00Z");
  const lastGenerated = new Date("2026-07-22T12:00:00Z");
  assert.strictEqual(isRegenerationAllowed(lastGenerated, now), true);
});

test("2 dias atrás → permitido", () => {
  const now = new Date("2026-07-24T12:00:00Z");
  const lastGenerated = new Date("2026-07-22T12:00:00Z");
  assert.strictEqual(isRegenerationAllowed(lastGenerated, now), true);
});

test("1 minuto antes de 24h → bloqueado", () => {
  const now = new Date("2026-07-23T12:00:00Z");
  const lastGenerated = new Date("2026-07-22T12:01:00Z");
  assert.strictEqual(isRegenerationAllowed(lastGenerated, now), false);
});

console.log("\n✅ Todos os testes de rate limit passaram!\n");
