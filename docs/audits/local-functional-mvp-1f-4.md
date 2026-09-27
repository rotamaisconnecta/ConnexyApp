# Fase 1F-4 — Meu Connexy, eliminar wizards falsos

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-3 (270 testes / 1125 assertions).

## 1. Problema

`/my-connexy` abria wizards de negócio, evento, local e oferta. O usuário
preenchia etapas e tocava **Publicar**. `onComplete` só fechava o overlay e
disparava `roleChanged`. Nenhuma entidade era gravada.

A mesma área mostrava estatísticas (2.4k, 847, Nível 4) e “atividade recente”
(Sunset no Parque, promoção criada) como se fossem do usuário.

`/gerenciar` (também titulado Meu Connexy) misturava atalhos reais com
`PresenceAnalytics` de `cafe-central` / `evt-1` como “Meus locais e eventos”.

## 2. Classificação

| Wizard / superfície | Código encontrado | Classificação | Comportamento final |
| --- | --- | --- | --- |
| Negócio | `WizardBase` + `negocioSteps`, sem persistência | D falso | Link → `/create/place-business` (1F-3 honesto) |
| Evento | idem | D falso | Link → `/create/event` |
| Local | idem | D falso | Link → `/create/place` |
| Oferta | idem | D falso | Link → `/create/offer` |
| Publicação (wizard interno, sem CTA) | `publicacaoSteps` | D falso | Removido |
| Foto/Vídeo/Texto em `/gerenciar` | hop 1F-3 → `/create-post` | B equivalente | Preservado |
| Reel em `/gerenciar` | `/gerenciar/novo-reel` | A funcional | Preservado |
| Mobilidade em `/gerenciar` | `/driver` | A funcional | Preservado |
| Estatísticas / atividade | fixtures `STATS` / `ACTIVITIES` | D falso | Texto honesto, sem números inventados |
| Análises de presença | `PresenceAnalytics` em catálogo | D falso como “meus” | Texto honesto |

## 3. Alteração aplicada

- CTAs de `/my-connexy` navegam para as rotas honestas da 1F-3. Sem wizard,
  sem toast de sucesso, sem `roleChanged` fingindo cadastro.
- Estatísticas deixam de mostrar métricas de fixture.
- `/gerenciar` não trata negócio/evento/local/oferta como gerenciáveis; o
  subtítulo é a mensagem honesta. Mobilidade, Reel e Foto/Vídeo/Texto
  permanecem.
- `wizard-base.tsx` ficou órfão (não deletado).

Não foram criados cadastros, repositories nem persistência.

## 4. Persistência

Nenhuma nova.

## 5. Testes

Focados: `tests/persist-phase-1f-4.test.ts`,
`tests/persist-phase-1f-4-browser.test.ts`,
`tests/fixtures/my-connexy-browser.ts`.

Suíte completa: **276 pass / 1191 assertions / 0 fail**.

## 6. Browser E2E

| Cenário | Resultado |
| --- | --- |
| `/my-connexy` | mensagem honesta; sem 2.4k / Sunset / wizard |
| Criar Negócio | `/create/place-business`, indisponível, sem sucesso falso |
| Criar Evento | `/create/event`, idem |
| Criar Local | `/create/place`, idem |
| Nova Oferta | `/create/offer`, idem |
| `/gerenciar` → Meus Eventos | `/create/event` honesto |
| `/gerenciar` → Reel | `/gerenciar/novo-reel`, “Publicar reel” |
| Harness CDP | destinos honestos; `storageKeys []`; `networkCalls === 0` |

## 7. Residual

- `src/components/my-connexy/wizard-base.tsx` sem consumidores.
- `/gerenciar/bio` continua o caminho Supabase (fora do escopo; no demo local
  já falhava sem perfil remoto).
- `roles-utils` ainda aponta alguns CTAs para `/my-connexy`; a tela agora é
  honesta.

## 8. Validação

- Typecheck: PASS
- Build: PASS
- Lint dos arquivos alterados: PASS
- Lint global: não corrigido
- Supabase: não acessado nem alterado
- 1D-1…1D-5, 1F-1…1F-3: intactos
- Commit/push: não realizados
