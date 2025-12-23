import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Statistics, GroupStatistics } from '../types/index.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sortByCount(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

function generateSummaryTable(groups: GroupStatistics[]): string {
  const rows = groups.map((g, i) => {
    const { ruleTypes } = g;
    const networkTotal = ruleTypes.network.blocking + ruleTypes.network.exception;
    const cosmeticTotal =
      ruleTypes.cosmetic.elementHiding +
      ruleTypes.cosmetic.elementHidingException +
      ruleTypes.cosmetic.cssInjection +
      ruleTypes.cosmetic.cssInjectionException;
    const scriptletTotal = ruleTypes.scriptlet.rules + ruleTypes.scriptlet.exceptions;
    const scriptTotal = ruleTypes.script.rules + ruleTypes.script.exceptions;

    return `<tr>
      <td><a href="#group-${i}" class="group-link">${escapeHtml(g.name)}</a></td>
      <td>${g.totalRules.toLocaleString()}</td>
      <td>${networkTotal.toLocaleString()}</td>
      <td>${cosmeticTotal.toLocaleString()}</td>
      <td>${scriptletTotal.toLocaleString()}</td>
        <td>${scriptTotal.toLocaleString()}</td>
      <td>${Object.keys(g.modifiers).length.toLocaleString()}</td>
      <td>${g.errors.length > 0 ? `<span class="error-badge">${g.errors.length}</span>` : '-'}</td>
    </tr>`;
  }).join('\n');

  return `
    <section class="summary-section">
      <h2>Overview</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Filter</th>
            <th>Total</th>
            <th>Network</th>
            <th>Cosmetic</th>
            <th>Scriptlet</th>
            <th>Script</th>
            <th>Modifiers</th>
            <th>Errors</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function generateGroupSection(group: GroupStatistics, index: number): string {
  const { ruleTypes, modifiers, scriptlets, redirects } = group;

  const networkTotal = ruleTypes.network.blocking + ruleTypes.network.exception;
  const cosmeticTotal =
    ruleTypes.cosmetic.elementHiding +
    ruleTypes.cosmetic.elementHidingException +
    ruleTypes.cosmetic.cssInjection +
    ruleTypes.cosmetic.cssInjectionException;
  const scriptletTotal = ruleTypes.scriptlet.rules + ruleTypes.scriptlet.exceptions;
    const scriptTotal = ruleTypes.script.rules + ruleTypes.script.exceptions;
  const htmlTotal = ruleTypes.htmlFiltering.rules + ruleTypes.htmlFiltering.exceptions;

  const modifierRows = sortByCount(modifiers)
    .map(([name, count]) => `<tr><td>${escapeHtml(name)}</td><td>${count.toLocaleString()}</td></tr>`)
    .join('\n');

  const scriptletRows = sortByCount(scriptlets.byName)
    .map(([name, count]) => `<tr><td>${escapeHtml(name)}</td><td>${count.toLocaleString()}</td></tr>`)
    .join('\n');

  const redirectRows = sortByCount(redirects.byResource)
    .map(([name, count]) => `<tr><td>${escapeHtml(name)}</td><td>${count.toLocaleString()}</td></tr>`)
    .join('\n');

  return `
    <details class="group" id="group-${index}">
      <summary class="group-header">
        <h2>${escapeHtml(group.name)}</h2>
        <div class="group-summary-stats">
          <span class="stat-pill"><strong>${group.totalRules.toLocaleString()}</strong> rules</span>
          <span class="stat-pill">${networkTotal.toLocaleString()} network</span>
          <span class="stat-pill">${cosmeticTotal.toLocaleString()} cosmetic</span>
          <span class="stat-pill">${scriptletTotal.toLocaleString()} scriptlet</span>
          <span class="stat-pill">${scriptTotal.toLocaleString()} script</span>
        </div>
      </summary>

      <div class="group-content">
        <details class="subsection" open>
          <summary>Rule Types</summary>
          <table class="data-table">
            <thead>
              <tr><th>Category</th><th>Type</th><th>Count</th></tr>
            </thead>
            <tbody>
              <tr><td>Network</td><td>Blocking</td><td>${ruleTypes.network.blocking.toLocaleString()}</td></tr>
              <tr><td>Network</td><td>Exception</td><td>${ruleTypes.network.exception.toLocaleString()}</td></tr>
              <tr><td>Cosmetic</td><td>Element Hiding</td><td>${ruleTypes.cosmetic.elementHiding.toLocaleString()}</td></tr>
              <tr><td>Cosmetic</td><td>Element Hiding Exception</td><td>${ruleTypes.cosmetic.elementHidingException.toLocaleString()}</td></tr>
              <tr><td>Cosmetic</td><td>CSS Injection</td><td>${ruleTypes.cosmetic.cssInjection.toLocaleString()}</td></tr>
              <tr><td>Cosmetic</td><td>CSS Injection Exception</td><td>${ruleTypes.cosmetic.cssInjectionException.toLocaleString()}</td></tr>
              <tr><td>Scriptlet</td><td>Rules</td><td>${ruleTypes.scriptlet.rules.toLocaleString()}</td></tr>
              <tr><td>Scriptlet</td><td>Exceptions</td><td>${ruleTypes.scriptlet.exceptions.toLocaleString()}</td></tr>
                <tr><td>Script</td><td>Rules</td><td>${ruleTypes.script.rules.toLocaleString()}</td></tr>
                <tr><td>Script</td><td>Exceptions</td><td>${ruleTypes.script.exceptions.toLocaleString()}</td></tr>
              <tr><td>HTML Filtering</td><td>Rules</td><td>${ruleTypes.htmlFiltering.rules.toLocaleString()}</td></tr>
              <tr><td>HTML Filtering</td><td>Exceptions</td><td>${ruleTypes.htmlFiltering.exceptions.toLocaleString()}</td></tr>
              <tr><td colspan="2">Comments</td><td>${ruleTypes.comments.toLocaleString()}</td></tr>
              <tr><td colspan="2">Preprocessor Directives</td><td>${ruleTypes.preprocessor.toLocaleString()}</td></tr>
              <tr><td colspan="2">Invalid/Unparseable</td><td>${ruleTypes.invalid.toLocaleString()}</td></tr>
            </tbody>
          </table>
        </details>

        ${Object.keys(modifiers).length > 0 ? `
        <details class="subsection">
          <summary>Modifiers (${Object.keys(modifiers).length})</summary>
          <table class="data-table">
            <thead>
              <tr><th>Modifier</th><th>Count</th></tr>
            </thead>
            <tbody>
              ${modifierRows}
            </tbody>
          </table>
        </details>
        ` : ''}

        ${scriptlets.total > 0 ? `
        <details class="subsection">
          <summary>Scriptlets (${scriptlets.total.toLocaleString()})</summary>
          <div class="syntax-breakdown">
            <span><strong>AdGuard:</strong> ${scriptlets.bySyntax.adguard.toLocaleString()}</span>
            <span><strong>uBlock:</strong> ${scriptlets.bySyntax.ublock.toLocaleString()}</span>
            <span><strong>ABP:</strong> ${scriptlets.bySyntax.abp.toLocaleString()}</span>
          </div>
          <table class="data-table">
            <thead>
              <tr><th>Scriptlet</th>
            <th>Script</th><th>Count</th></tr>
            </thead>
            <tbody>
              ${scriptletRows}
            </tbody>
          </table>
        </details>
        ` : ''}

        ${redirects.total > 0 ? `
        <details class="subsection">
          <summary>Redirects (${redirects.total.toLocaleString()})</summary>
          <table class="data-table">
            <thead>
              <tr><th>Resource</th><th>Count</th></tr>
            </thead>
            <tbody>
              ${redirectRows}
            </tbody>
          </table>
        </details>
        ` : ''}

        ${group.errors.length > 0 ? `
        <details class="subsection errors-section">
          <summary>Errors (${group.errors.length})</summary>
          <ul class="error-list">
            ${group.errors.slice(0, 100).map(e => `<li>${escapeHtml(e)}</li>`).join('\n')}
            ${group.errors.length > 100 ? `<li>... and ${group.errors.length - 100} more</li>` : ''}
          </ul>
        </details>
        ` : ''}
      </div>
    </details>
  `;
}

function generateHtml(stats: Statistics): string {
  const sections = stats.groups
    .map((g, i) => generateGroupSection(g, i))
    .join('\n');

  const summaryTable = generateSummaryTable(stats.groups);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Filter Rules Statistics</title>
  <style>
    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --error: #f85149;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .timestamp {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .controls button {
      background: var(--surface);
      color: var(--accent);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .controls button:hover {
      background: var(--accent);
      color: var(--bg);
    }

    .summary-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-section h2 {
      color: var(--accent);
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .summary-table th,
    .summary-table td {
      padding: 0.6rem 0.8rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .summary-table th {
      background: var(--bg);
      font-weight: 600;
      color: var(--text-muted);
      position: sticky;
      top: 0;
    }

    .summary-table td:not(:first-child) {
      text-align: right;
      font-family: monospace;
    }

    .summary-table tr:hover {
      background: rgba(88, 166, 255, 0.05);
    }

    .group-link {
      color: var(--accent);
      text-decoration: none;
    }

    .group-link:hover {
      text-decoration: underline;
    }

    .error-badge {
      background: var(--error);
      color: white;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      font-size: 0.8rem;
    }

    .group {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .group-header {
      padding: 1rem 1.5rem;
      cursor: pointer;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      list-style: none;
    }

    .group-header::-webkit-details-marker {
      display: none;
    }

    .group-header::before {
      content: '▶';
      font-size: 0.8rem;
      color: var(--text-muted);
      transition: transform 0.2s;
    }

    .group[open] > .group-header::before {
      transform: rotate(90deg);
    }

    .group-header h2 {
      color: var(--accent);
      font-size: 1.1rem;
      margin: 0;
    }

    .group-summary-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-left: auto;
    }

    .stat-pill {
      background: var(--bg);
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .stat-pill strong {
      color: var(--text);
    }

    .group-content {
      padding: 0 1.5rem 1.5rem;
    }

    .subsection {
      margin-bottom: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
    }

    .subsection > summary {
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-muted);
      list-style: none;
    }

    .subsection > summary::-webkit-details-marker {
      display: none;
    }

    .subsection > summary::before {
      content: '▶ ';
      font-size: 0.7rem;
      margin-right: 0.5rem;
    }

    .subsection[open] > summary::before {
      content: '▼ ';
    }

    .subsection > summary:hover {
      color: var(--text);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.5rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .data-table th {
      background: var(--surface);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .data-table tr:hover {
      background: rgba(88, 166, 255, 0.05);
    }

    .data-table td:last-child {
      text-align: right;
      font-family: monospace;
    }

    .syntax-breakdown {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }

    .error-list {
      max-height: 200px;
      overflow-y: auto;
      padding: 1rem;
      font-size: 0.8rem;
      font-family: monospace;
      list-style: none;
    }

    .error-list li {
      margin-bottom: 0.4rem;
      color: var(--error);
    }

    .errors-section > summary {
      color: var(--warning);
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      margin-top: 1rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--accent);
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .group-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .group-summary-stats {
        margin-left: 0;
      }

      .summary-table {
        font-size: 0.8rem;
      }

      .summary-table th,
      .summary-table td {
        padding: 0.4rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Filter Rules Statistics</h1>
    <p class="timestamp">Generated: ${escapeHtml(stats.generatedAt)}</p>
  </header>

  <div class="controls">
    <button onclick="document.querySelectorAll('.group').forEach(d => d.open = true)">Expand All</button>
    <button onclick="document.querySelectorAll('.group').forEach(d => d.open = false)">Collapse All</button>
  </div>

  ${summaryTable}

  <main>
    ${sections}
  </main>

  <footer>
    <p>Generated by <a href="https://github.com/ameshkov/filter-rules-stats">filter-rules-stats</a></p>
  </footer>
</body>
</html>`;
}

export async function writeHtmlOutput(
  stats: Statistics,
  outputPath: string
): Promise<void> {
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });

  const html = generateHtml(stats);
  await writeFile(outputPath, html, 'utf-8');
}
