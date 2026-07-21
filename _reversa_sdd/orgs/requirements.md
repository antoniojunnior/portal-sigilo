# Orgs

> Fonte: `_reversa_sdd/code-analysis.md` §9.

## Visão Geral
Busca de organizações por nome (prefixo/substring) para autocomplete/seleção de empresa no portal público, sem autenticação. 🟢

## Responsabilidades
- Buscar orgs por trecho do nome, retornando dados públicos mínimos (nome, slug, logo, plano) 🟢

## Regras de Negócio
- Busca exige mínimo 3 caracteres — abaixo disso retorna lista vazia sem consultar o banco 🟢
- Firestore não tem full-text search nativo: busca até 100 docs ordenados por `nome_lower` e filtra em memória, limitando a 10 resultados 🟢
- Campo interno `nome_lower` nunca é exposto na resposta 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Retornar lista vazia para busca com menos de 3 caracteres | Must | Nenhuma query ao Firestore é feita |
| RF-02 | Buscar por substring case-insensitive no nome | Must | "acme" encontra "Grupo ACME Ltda" |
| RF-03 | Limitar resultado a 10 itens | Should | Nunca retorna mais que 10 orgs |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Escalabilidade | Busca em memória sobre até 100 docs — não escala além de poucas dezenas/centenas de tenants | `src/app/api/orgs/search/route.ts:16-20` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado q="ac"
Quando GET /api/orgs/search?q=ac é chamado
Então retorna {"orgs": []} sem consultar o Firestore

Dado q="acme" e existe uma org "Grupo ACME Ltda"
Quando GET /api/orgs/search?q=acme é chamado
Então a org aparece nos resultados, sem o campo nome_lower
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|----------------|
| Busca básica funcional | Must | Necessária para o fluxo de seleção de empresa (Tela 0) |
| Performance/escala além de 100 orgs | Won't (hoje) | Implementação atual não escala — aceito como débito conhecido |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `src/app/api/orgs/search/route.ts` | `GET` | 🟢 |
