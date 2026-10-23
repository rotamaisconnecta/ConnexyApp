-- G4.26D — matrix executável do guard SQL `private.g4_26b_is_canonical_avatar_path`.
--
-- Executar SOMENTE contra o PostgreSQL LOCAL, dentro de uma transação revertida.
-- O runner `tests/avatar-canonical-guard-sql-g4-26d.test.ts` carrega a função
-- real da migration (não uma cópia) e concatena este matrix, revertendo ao final.
-- Nenhuma operação remota. Nenhum objeto persistido.
--
-- Cada linha retorna `PASS`/`FAIL`; qualquer `FAIL` falha o teste.

with cases(ord, descr, input, expected) as (values
  (1,  'valido 2-seg',                       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg', true),
  (2,  'valido 3-seg',                       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/avatar/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg', true),
  (3,  'ext maiuscula',                      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.JPG', true),
  (4,  'ext php (formato aceita)',           'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.php', true),
  (5,  'ext png',                            'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.png', true),
  (6,  'ext webp',                           'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.webp', true),
  (7,  'ext jpeg',                           'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpeg', true),
  (8,  'null',                               null, false),
  (9,  'vazio',                              '', false),
  (10, 'so espacos',                         '   ', false),
  (11, 'http url',                           'http://x.com/a.jpg', false),
  (12, 'https url publica',                  'https://x.supabase.co/storage/v1/object/public/avatars/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.jpg', false),
  (13, 'data url',                           'data:image/png;base64,AAAA', false),
  (14, 'blob url',                           'blob:https://app/x', false),
  (15, 'barra inicial',                      '/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.jpg', false),
  (16, 'traversal inicio',                   '../aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.jpg', false),
  (17, 'traversal meio',                     'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/../b.jpg', false),
  (18, 'backslash',                          E'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa\\b.jpg', false),
  (19, 'octeto %2e',                         'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/%2e%2e/b.jpg', false),
  (20, 'octeto %2f',                         'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/%2f/b.jpg', false),
  (21, 'segmento vazio',                     'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa//b.jpg', false),
  (22, 'uuid invalido',                      'not-a-uuid/b.jpg', false),
  (23, 'uuid curto',                         'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa/b.jpg', false),
  (24, 'uuid versao 0',                      'aaaaaaaa-aaaa-0aaa-aaaa-aaaaaaaaaaaa/b.jpg', false),
  (25, 'uuid versao 9',                      'aaaaaaaa-aaaa-9aaa-aaaa-aaaaaaaaaaaa/b.jpg', false),
  (26, 'uuid variante c',                    'aaaaaaaa-aaaa-4aaa-caaa-aaaaaaaaaaaa/b.jpg', false),
  (27, 'sem extensao',                       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', false),
  (28, 'dois pontos ext',                    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.tar.gz', false),
  (29, 'ext longa >8',                       'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.abcdefghi', false),
  (30, 'ext com hifen',                      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.jp-g', false),
  (31, 'espaco interno (ambos aceitam)',     'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/ b.jpg', true),
  (32, 'uuid maiusculo 1seg',                'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA/b.jpg', true),
  (33, 'somente uuid (1 seg)',               'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', false),
  (34, 'uuid + . + ext vazio',               'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.', false),
  (35, 'ext 8 chars ok',                     'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.abcdefgh', true),
  (36, 'ext 9 chars nok',                    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b.abcdefghi', false),
  (37, 'control char 0x01 (rejeitado)',      E'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b\x01.jpg', false),
  (38, 'control char 0x7f (rejeitado)',      E'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/b\x7f.jpg', false)
)
select
  ord,
  descr,
  private.g4_26b_is_canonical_avatar_path(input) as got,
  expected,
  case
    when private.g4_26b_is_canonical_avatar_path(input) = expected then 'PASS'
    else 'FAIL'
  end as result
from cases
order by result desc, ord;
