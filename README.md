# Concursos Brasil V4

V4 consolida frontend, base inicial e automação segura.

## Automação
- GitHub Actions a cada 6 horas + execução manual.
- Status ABERTO/FECHADO/IMINENTE recalculado por datas.
- Histórico de mudanças.
- `automation/sources.json` é o registro de fontes oficiais/organizadoras a expandir.
- `data/runtime.js` é gerado para o frontend.
- Descoberta automática deve usar fontes/feeds cadastrados; descoberta nunca vira ABERTO sem datas de inscrição.

## Cobertura
Não existe garantia honesta de 100% dos municípios sem cadastrar e monitorar seus portais/diários. A arquitetura permite ampliar a rede de fontes sem alterar o frontend.

## Cloudflare
Use Git integration com GitHub. Site é HTML estático; sem framework. Production branch `main`. O Cloudflare documenta deploy automático por push e Deploy Hooks para disparos externos.

Rodapé: Desenvolvido por Hudson Santos.
