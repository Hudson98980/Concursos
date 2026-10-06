# Concursos Brasil — Portal automatizado

Portal de concursos públicos com visual institucional inspirado no antigo modelo do Concurseiros Brasil, mas com conteúdo próprio para concursos reais.

## O que já está pronto

- Página inicial com contadores de concursos abertos, iminentes e fechados.
- Central de concursos com filtros por **UF**, **Município**, **Abrangência** e **Situação**.
- Categoria **Nacionais** para PRF, PF e outros concursos de abrangência nacional.
- Página individual de cada concurso.
- Status visual: 🟢 ABERTO, 🟡 IMINENTE e ⚪ FECHADO.
- Status por datas muda automaticamente no navegador sem precisar editar o HTML.
- Monitor oficial em Python.
- GitHub Actions programado para executar o monitor a cada 6 horas.
- O monitor usa o horário de Brasília.
- O monitor consulta fontes oficiais cadastradas e pode atualizar `data.js` automaticamente.
- Concursos previstos não são transformados em ABERTO apenas por notícia: o monitor exige sinais de edital e inscrição na fonte oficial.
- Log de monitoramento em `automation/monitor-log.json`.
- Rodapé com **Desenvolvido por Hudson Santos**.
- Layout responsivo para celular, tablet e computador.

## Como colocar no GitHub Pages

1. Crie ou abra seu repositório.
2. Envie **todos os arquivos e pastas mantendo a estrutura**.
3. A pasta `.github/workflows` precisa ser enviada também — ela contém a automação.
4. No GitHub, abra **Settings → Pages**.
5. Em Source, selecione **GitHub Actions** se essa opção estiver disponível; ou publique pela branch configurada para Pages.
6. Abra **Actions** e execute `Monitorar concursos` uma vez com **Run workflow** para testar.
7. Depois disso, o agendamento roda sozinho a cada 6 horas.

## Importante sobre a automação

GitHub Pages é apenas hospedagem estática. Por isso, o robô fica no GitHub Actions, consulta as fontes oficiais e grava o resultado de volta no repositório. Quando o GitHub Pages publica a nova versão, o site passa a mostrar os dados atualizados.

Fluxo:

`Fonte oficial → Monitor Python → validação → data.js → commit automático → GitHub Pages`

### Regra de segurança

O sistema **não deve inventar** edital, vaga, banca ou período de inscrição. Para concursos previstos, o estado continua como `iminente` até haver confirmação suficiente em fonte oficial.

## Banco de dados

O projeto atual usa `data.js` como banco inicial versionado no Git. Isso permite funcionamento imediato no GitHub Pages sem servidor próprio.

Para uma versão ainda maior, com histórico, painel administrativo autenticado, banco PostgreSQL, alertas por e-mail/Telegram e múltiplos coletores, a mesma estrutura pode ser migrada para Supabase/PostgreSQL.

## Arquivos principais

- `index.html` — início
- `concursos.html` — filtros e resultados
- `concurso.html` — detalhes
- `data.js` — dados publicados
- `script.js` — lógica do site
- `style.css` — visual
- `automation/sources.json` — fontes oficiais monitoradas
- `automation/monitor.py` — robô de atualização
- `.github/workflows/monitor.yml` — agendamento automático
- `admin/index.html` — painel visual de acompanhamento

## Observação

A lista inicial é uma base curada, não uma promessa de conter literalmente todos os concursos do Brasil. Para cobertura nacional realmente ampla, é necessário cadastrar continuamente novas fontes oficiais e seus respectivos padrões de monitoramento.
