// Preload (-r) que redireciona require("server-only") para um shim vazio,
// só usado por scripts standalone que precisam importar módulos server-only
// fora do runtime Next.js (ex.: scripts/test-asaas-billing-payloads.ts).
const Module = require("module");
const path = require("path");

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only") {
    return path.join(__dirname, "server-only.js");
  }
  return originalResolveFilename.call(this, request, ...args);
};
