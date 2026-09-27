# Fase 1F-3 — Create Hub, tipos restantes

- **Data:** 2026-09-18
- **Status:** PASS
- **Modo:** implementação controlada. Sem Supabase. Sem commit/push.
- **Baseline anterior:** 1F-2 (262 testes / 1024 assertions).

## 1. Problema

Após 1F-2, Reel do Create Hub era canônico. Os demais tipos ainda usavam
`usePublisherForm`: toast “Publicando...” / “Publicado com sucesso!” e
navegação para `/home` sem persistir.

## 2. Auditoria (código real)

| Tipo | Fluxo `/create/*` | Persistência / fluxo equivalente | Classificação |
| --- | --- | --- | --- |
| photo | formulário + `usePublisherForm` | `/create-post` → `saveDemoPost` → `connexy:demo:posts` (perfil) | FLUXO EQUIVALENTE EXISTENTE |
| video | idem | mesmo `/create-post` | FLUXO EQUIVALENTE EXISTENTE |
| text | idem | mesmo `/create-post` | FLUXO EQUIVALENTE EXISTENTE |
| event | idem | só catálogo/detalhe (`/event/$id`); `/gerenciar/novo-evento` redirecionava para o fake | NÃO FUNCIONAL / FUTURO |
| place | idem | só catálogo `/locais`; `/gerenciar/novo-local` redirecionava para o fake | NÃO FUNCIONAL / FUTURO |
| offer | idem | ofertas de fixture no detalhe de negócio | NÃO FUNCIONAL / FUTURO |
| ride | “publicar carona” + `usePublisherForm` | Trip funcional em `/ride/request` (1D-4); listagem de carona não existe | FLUXO EQUIVALENTE EXISTENTE (Trip) |
| moment | idem | nenhum repository/store de momento | NÃO FUNCIONAL / FUTURO |

Hub extra (mesmo padrão falso, tratado junto): **negócio** (`/create/place-business`) — só catálogo `/business/$id`.

`/gerenciar/nova-foto|novo-video|novo-texto` também redirecionavam para os
formulários falsos. Não foram reescritos: o hop agora cai no destino honesto
ou canônico.

## 3. Fluxo antigo

```text
/create → Foto|Vídeo|Texto|Evento|Local|Oferta
→ /create/{tipo} → usePublisherForm
→ toast → /home
→ nada persistido
```

## 4. Fluxo novo

```text
/create → Foto|Vídeo|Texto → /create-post → saveDemoPost → connexy:demo:posts
/create → Reel → /gerenciar/novo-reel (1F-2, intacto)
/create/ride → /ride/request → Trip existente
/create → Evento|Local|Oferta|Negócio|Momento
→ mensagem honesta, sem toast de sucesso
```

## 5. Alteração aplicada

Mínima: destinos do hub + redirect ou tela honesta nas rotas `/create/*`.

- Sem novo formulário de publicação.
- Sem copiar `/create-post` ou o fluxo de Trip.
- Sem novo repository, IndexedDB, chave ou store.

`usePublisherForm` permanece no arquivo, sem consumidores no Create Hub.

## 6. Persistência

Nenhuma nova.

- Posts: chave já existente `connexy:demo:posts`
- Reel: IndexedDB `connexy-reels-data-local-db` / store `reels` (1F-2)
- Ride: Trip `connexy_demo_trip` (1D-4)

## 7. Testes

Focados: `tests/persist-phase-1f-3.test.ts`,
`tests/persist-phase-1f-3-browser.test.ts`,
`tests/fixtures/create-hub-browser.ts`.

Suíte completa: **270 pass / 1125 assertions / 0 fail**.

## 8. Browser E2E

Vite `http://localhost:8080`, sessão demo.

| Cenário | Resultado |
| --- | --- |
| `/create` → Criar Foto | `/create-post`, sem “Publicando...” |
| `/create` → Criar Evento | `/create/event` + mensagem honesta |
| `/create/ride` | `/ride/request` |
| `/create/video` | `/create-post` |
| `/create/reel` e hub Reel | `/gerenciar/novo-reel`, “Publicar reel” |
| `/create/moment` e `/create/place` | mensagem honesta, sem toast falso |
| Harness CDP | destinos canônicos; um `saveDemoPost`; reload; `networkCalls === 0` |

## 9. Código legado residual

- `usePublisherForm.ts` sem consumidores no hub.
- `roles-engine`, `RoleSelector`, `context-rules` e bottom nav ainda nomeiam
  `/create/*`; os redirects/telas honestas cobrem o acesso.
- `/gerenciar/nova-*` continua redirecionando para `/create/*` (agora seguro).
- Wizards de `/my-connexy` continuam visuais (fora do hub).

## 10. Validação

- Typecheck: PASS
- Build: PASS
- Lint dos arquivos alterados: PASS
- Lint global: não corrigido
- Supabase: não acessado nem alterado
- 1D-1…1D-5, 1F-1, 1F-2: intactos
- Commit/push: não realizados
