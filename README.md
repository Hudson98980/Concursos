# Concursos Brasil — V4 definitiva

Portal nacional de concursos com frontend responsivo, base inicial, descoberta automática por feeds, atualização de status, painel administrativo e integração opcional com Cloudflare Pages Functions + D1.

## O que é automático
- Status calculado por datas: iminente → aberto → fechado.
- Monitor agendado pelo GitHub Actions a cada 4 horas (o GitHub permite agendamentos via cron). 
- Descoberta inicial de notícias via Google News RSS para todos os estados + nacional. Descobertas ficam como **iminentes / não oficiais** até confirmação.
- Sincronização opcional com D1 pelo endpoint `/api/admin/monitor`.
- Deploy do frontend pelo Cloudflare Pages via Git.

## Painel administrativo
Abra `/admin/`.

O painel real usa **D1** para persistência e Pages Functions para autenticação, CRUD, fontes e histórico. Para habilitar:

1. Crie um banco D1 chamado `concursos-brasil` no Cloudflare.
2. Execute `db/schema.sql` no D1.
3. Em Workers & Pages → projeto → Settings → Bindings, adicione o D1 com variável `DB`. Pages Functions suportam bindings D1. 
4. Em Settings → Variables and Secrets, crie `ADMIN_PASSWORD` (secret).
5. Opcional: crie `MONITOR_TOKEN` (secret) para o GitHub Actions sincronizar o monitor com o D1.
6. No GitHub, crie os secrets `SITE_API_URL` (ex.: `https://seu-dominio.com`) e `MONITOR_TOKEN` com o mesmo valor do Cloudflare.
7. Abra `/admin/`, entre e use **Carregar base inicial no banco**.

## Importante sobre a descoberta automática
O robô pode descobrir notícias e criar candidatos automaticamente. Ele **não deve afirmar que um edital está aberto apenas por uma notícia**. Registros descobertos são marcados como `oficial=false`, `confidence=noticia` e `status=iminente` até uma fonte oficial fornecer confirmação/datas.

Nenhum agregador consegue garantir 100% dos concursos municipais do Brasil sem monitorar cada portal e diário oficial individualmente. A arquitetura aceita novas fontes em `automation/sources.json` e pelo painel administrativo.

## Cloudflare
O projeto usa Pages Functions em `/functions`. Para elas funcionarem, o projeto precisa ser publicado por uma integração/CI compatível; Direct Upload não suporta Pages Functions. D1 é configurado como binding.

## Rodapé
Desenvolvido por Hudson Santos.
