// Shim vazio de "server-only" para scripts ts-node fora do runtime Next.js.
// O pacote real lança erro ao ser importado fora de um Server Component; aqui
// rodamos scripts standalone (ex.: scripts/test-asaas-billing-payloads.ts),
// então o require abaixo intercepta e neutraliza esse import.
module.exports = {};
