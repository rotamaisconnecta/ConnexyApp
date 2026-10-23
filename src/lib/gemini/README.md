# Connexy AI — Gemini

Camada única de geração de texto com a Gemini API. As três funções (anúncio B2B, primeiro contato e sugerir assunto) compartilham o mesmo cliente, prompts, limites e fallback.

## Configuração (Google AI Studio)

1. Crie ou selecione um projeto Google.
2. Em [Google AI Studio](https://aistudio.google.com/apikey), crie uma API key Gemini.
3. Coloque a chave **somente** em `.env.local` (arquivo ignorado pelo Git):

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
```

O padrão atual da camada gratuita para chaves novas é `gemini-3.5-flash-lite`. `gemini-2.5-flash` não está mais disponível para projetos novos (a API devolve 404). Para o Flash mais recente, use `gemini-3.8-flash`.

4. Reinicie `bun run dev`.
5. Teste Criar oferta, uma solicitação de conversa e o botão **Sugerir assunto** no chat.

A chave **não** usa prefixo `VITE_`. Ela permanece no servidor (`createServerFn` + `gemini-client.server.ts`) e não entra no bundle do navegador.

## Limites

- Timeout: 12s
- Até 8 pedidos por minuto por usuário e função
- Cache de 5 minutos para o mesmo contexto
- Chat envia no máximo as 8 mensagens de texto mais recentes

Se a chave estiver ausente ou a API falhar, a UI mostra: `Não foi possível gerar uma sugestão agora. Tente novamente.` O restante do app continua funcionando.
