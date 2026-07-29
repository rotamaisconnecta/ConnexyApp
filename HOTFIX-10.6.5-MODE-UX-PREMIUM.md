# HOTFIX 10.6.5 — Mode Switch UX Premium

## Objetivo

Melhorar a experiência de troca entre passageiro e motorista com toast premium, navegação automática para a home, badge persistente no header e animações suaves, preservando a arquitetura atual de roles e eventos.

## O que mudou

- Adicionado toast premium ao trocar de modo com mensagem específica para passageiro e motorista.
- Implementada navegação automática para /home após 300ms sem usar window.location.
- Adicionado badge permanente no header da home indicando o modo ativo.
- Incluída animação de entrada do switcher com fade/scale.
- Mantido o fluxo de setActiveMode(), roleChanged, localStorage e eventos globais.

## Arquivos impactados

- src/components/roles/ModeSwitcher.tsx
- src/routes/_app.home.tsx

## Validação

- npm run lint
- npx tsc --noEmit
- npm run build
