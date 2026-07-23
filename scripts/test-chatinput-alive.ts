/**
 * Testa a correção de BUG-20260723-DOC1: ChatInput.tsx/ChatAttachment.tsx são
 * código VIVO (têm consumidor real), apesar de actions.md#T001 (feature 007)
 * afirmar que foram deletados como "código morto". Este teste é um guarda de
 * regressão contra uma futura limpeza baseada na premissa incorreta.
 *
 * Execute com: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' scripts/test-chatinput-alive.ts
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function test(name: string, fn: () => void): void {
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (err) { console.log(`  ✗ ${name}`); throw err; }
}

console.log("\n🧪 Teste: ChatInput/ChatAttachment continuam vivos (BUG-20260723-DOC1)\n");

const componentsDir = path.join(__dirname, "..", "src", "components", "portal");

test("BUG-20260723-DOC1 (regressao): ChatInput.tsx e ChatAttachment.tsx continuam existindo", () => {
  assert.ok(fs.existsSync(path.join(componentsDir, "ChatInput.tsx")), "ChatInput.tsx não existe mais — foi deletado erroneamente?");
  assert.ok(fs.existsSync(path.join(componentsDir, "ChatAttachment.tsx")), "ChatAttachment.tsx não existe mais — foi deletado erroneamente?");
});

test("ChatContainer.tsx (consumidor real de ambos) continua existindo e os importa", () => {
  const containerPath = path.join(componentsDir, "ChatContainer.tsx");
  assert.ok(fs.existsSync(containerPath), "ChatContainer.tsx não existe mais");
  const src = fs.readFileSync(containerPath, "utf-8");
  assert.ok(src.includes("ChatInput"), "ChatContainer.tsx não importa mais ChatInput");
  assert.ok(src.includes("ChatAttachment"), "ChatContainer.tsx não importa mais ChatAttachment");
});

console.log("\n✅ ChatInput/ChatAttachment seguem vivos, consumidor confirmado!\n");
