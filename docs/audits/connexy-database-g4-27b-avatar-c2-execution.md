# G4.27B — Execução remota controlada: privacidade de avatares

## Resultado

**BLOQUEADA na Fase A.** Nenhuma consulta ou escrita remota foi executada nesta passagem. O project ref `rsukwuqocgjmwwuwtqaf` não pôde ser reconfirmado pelo canal autenticado: o Supabase CLI não está disponível (`supabase: command not found`) e o plugin Supabase disponível no catálogo não está instalado/conectado. O inventário G4.27A é evidência histórica, não confirmação atual.

Conforme o critério de parada, a migration, o bucket e as policies não foram alterados. V1–V11 permanecem **NOT RUN** nesta execução.

## Estado local e preservação

- Branch: `backup/connexy-snapshot-2026-10-02`.
- HEAD antes da execução: `16f8c6bf1fafd18bd75fa3f56b1e2f0f7e7c2944`.
- Estado Git antes deste relatório: **303 entradas** (`159 ??`, `4 AM`, `1 D`, `138 M`, `1 MM`). O workspace já continha alterações extensas; foram preservadas integralmente.
- Migration local: `supabase/migrations/20261020120000_g4_26b_avatar_canonical_discovery_contract.sql`.
- SHA-256 local da migration: `98dc24086a41761684bfc8d9d6de90ebb6b3ba2943ce00b58c9b294e76525e63`.
- CLI remoto: indisponível; nenhuma credencial, chave ou token foi lido ou exibido.
- Não houve chamadas remotas, alteração de dados, migration, bucket, policy ou grant; nenhum teste local foi executado nesta etapa.

## Pré-verificações pendentes

Não foi possível cumprir as verificações atuais exigidas pela Fase A: confirmar o ref e o canal conectado; consultar histórico de migrations, definição e permissões de `get_nearby_profiles`, guard, bucket, policies, grants e contagens; comparar o estado remoto atual com G4.27A; ou confirmar que a migration local corresponde à revisão autorizada sem desvios. Os resultados registrados em G4.27A (incluindo bucket público, policy pública e projeto vazio) não foram tratados como estado atual.

Os documentos G4.26D, G4.26E e G4.27A e a migration local foram consultados para preparar a auditoria. O plano define V1–V11; todos ficam **NOT RUN**, pois dependem do destino remoto e dos testes funcionais no projeto.

## Resultado V1–V11

| Caso | Resultado | Evidência |
| --- | --- | --- |
| V1 — leitura anônima no endpoint público | NOT RUN | Sem conexão remota confirmada. |
| V2 — endpoint de resolução sem autenticação | NOT RUN | Sem conexão remota confirmada. |
| V3 — resolução autenticada do próprio avatar e TTL | NOT RUN | Sem conexão remota confirmada e sem usuários/objetos de teste autorizados verificados. |
| V4 — resolução autenticada de terceiro (Modelo 2) | NOT RUN | Sem conexão remota confirmada e sem fixtures verificadas. |
| V5 — profileId inválido/ausente | NOT RUN | Teste funcional remoto não executado. |
| V6 — referência de bucket/path alheio | NOT RUN | Teste funcional remoto não executado. |
| V7 — objeto ausente | NOT RUN | Teste funcional remoto não executado. |
| V8 — expiração de URL assinada | NOT RUN | Teste funcional remoto não executado. |
| V9 — RPC normaliza valor não canônico para NULL | NOT RUN | Migration e definição efetiva da RPC não foram verificadas/aplicadas. |
| V10 — ausência de novas URLs públicas | NOT RUN | Sem execução funcional remota. |
| V11 — ausência de token/URL assinada nos logs | NOT RUN | Fluxo remoto não executado. |

## Limitações, riscos e ações não executadas

- O estado remoto atual é **desconhecido**; não se afirma que C2 foi corrigido nem que a leitura pública foi removida.
- Nenhuma mudança remota ou teste de segurança/funcional foi executado.
- O relatório não afirma revogação de URLs antigas nem limpeza de cache.
- A autorização para aplicar a migration e privatizar o bucket permanece registrada no pedido, mas não substitui o requisito operacional de confirmar o projeto e o canal autenticado nesta etapa.
- Próximo requisito para retomar: disponibilizar o Supabase CLI autenticado neste ambiente (ou conectar o plugin Supabase) e então repetir as pré-verificações read-only antes de qualquer escrita.
- Nenhum commit ou push foi feito.

## Estado Git após o relatório

Um arquivo novo foi adicionado: este relatório. Contagem esperada após a criação: **304 entradas**, incluindo as 303 preexistentes; branch e HEAD sem alteração.
