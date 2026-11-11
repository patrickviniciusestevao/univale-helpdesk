#!/usr/bin/env node
/**
 * Hook do harness (HARNESS.md, regra 3): bloqueia `git commit` sem relatório de desenvolvimento.
 *
 * Roda antes de cada comando Bash do agente (PreToolUse). Se o comando tiver `git commit`, exige que exista um relatório
 * `docs/relatorios/R-*.md` novo ou alterado (adicionado ao commit ou ainda só no disco — num `git add … && git commit`
 * o add ainda não aconteceu quando o hook roda). Sem relatório: sai com código 2 e o commit não é executado.
 */
const { execSync } = require('child_process');

let entrada = '';
process.stdin.on('data', (parte) => (entrada += parte));
process.stdin.on('end', () => {
  let comando = '';
  try {
    comando = JSON.parse(entrada).tool_input?.command || '';
  } catch {
    process.exit(0); // entrada inesperada: não atrapalha
  }
  if (!/\bgit\s+commit\b/.test(comando)) process.exit(0);

  let alterados = '';
  try {
    alterados = execSync('git status --porcelain -- docs/relatorios', { encoding: 'utf8', cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() });
  } catch {
    process.exit(0); // sem git disponível: não bloqueia
  }
  if (/docs\/relatorios\/R-\d+[^\n]*\.md/.test(alterados)) process.exit(0);

  process.stderr.write(
    'Commit bloqueado pelo harness (HARNESS.md, regra 3): nenhum relatório novo ou alterado em docs/relatorios/R-*.md.\n' +
      'Crie o relatório desta etapa (skill "novo-relatorio") e atualize o índice em docs/relatorios/README.md antes de commitar.\n'
  );
  process.exit(2);
});
