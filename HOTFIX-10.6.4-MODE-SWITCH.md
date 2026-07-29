# HOTFIX 10.6.4 — Driver / Passenger Mode Switch

## Objetivo

Restaurar o alternador de modo na tela de perfil com o fluxo de motorista/passageiro, sem reload, persistindo a escolha no armazenamento local.

## O que mudou

- Criado o componente ModeSwitcher para a tela de perfil.
- Exibido o controle na tela de perfil logo abaixo do avatar.
- Quando o usuário ainda não possui a role DRIVER, o componente exibe o CTA "Tornar-me Motorista".
- Ao clicar em "Tornar-me Motorista", o fluxo encaminha para o cadastro de motorista.
- Ao salvar o cadastro, a role DRIVER é adicionada, o modo ativo passa a ser DRIVER e o evento global roleChanged é disparado.
- Quando o usuário já possui a role DRIVER, o controle mostra os modos Passageiro e Motorista com visual tipo segmented control.
- A alteração de modo persiste no localStorage e atualiza a UI sem reload via roleChanged.

## Arquivos impactados

- src/components/roles/ModeSwitcher.tsx
- src/routes/_app.profile.tsx
- src/routes/_app/driver/cadastro.tsx

## Validação

- npx eslint src/components/roles/ModeSwitcher.tsx src/routes/_app.profile.tsx src/routes/_app/driver/cadastro.tsx
- npx tsc --noEmit
- npm run build
