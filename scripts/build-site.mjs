#!/usr/bin/env node
/**
 * Build script: turns docs/*.md into static HTML in site/pages/.
 * No external dependencies. Run: node scripts/build-site.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const OUT = join(ROOT, 'site', 'pages');

const CHAPTERS = [
  '00-start-here.md',
  '01-human-vs-ai-voice.md',
  '02-platform-rules.md',
  '03-sample-listening-rubric.md',
  '04-rights-and-disclosure.md',
  '05-budget-ladders.md',
  '06-launch-day-qc.md',
];

const WORKSHEETS = [
  'worksheets/ws-01-voice-decision-worksheet.md',
  'worksheets/ws-02-listening-rubric-scorecard.md',
  'worksheets/ws-03-budget-ladder-planner.md',
  'worksheets/ws-04-launch-day-qc-checklist.md',
];

// ---------------------------------------------------------------- helpers

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rewriteLink(url) {
  // links ending in .md become .html with the basename (site is flat)
  if (/\.md($|#)/.test(url)) {
    const hashIdx = url.indexOf('#');
    const hash = hashIdx >= 0 ? url.slice(hashIdx) : '';
    const base = (hashIdx >= 0 ? url.slice(0, hashIdx) : url).split('/').pop();
    return base.replace(/\.md$/, '.html') + hash;
  }
  return url;
}

let codeCache = [];
function stashCode(html) {
  codeCache.push(html);
  return `\u0000CODE${codeCache.length - 1}\u0000`;
}

/**
 * Small inline markdown tokenizer. Handles `code`, [links](url), **bold**,
 * and *italic* with arbitrary nesting (bold-with-italic inside and vice versa).
 */
function inlineTokens(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];

    // inline code
    if (c === '`') {
      const e = s.indexOf('`', i + 1);
      if (e > i) {
        out += `<code>${s.slice(i + 1, e)}</code>`;
        i = e + 1;
        continue;
      }
    }

    // link [text](url)
    if (c === '[') {
      const closeB = s.indexOf(']', i + 1);
      if (closeB > i && s[closeB + 1] === '(') {
        const closeP = s.indexOf(')', closeB + 2);
        if (closeP > closeB) {
          out += `<a href="${rewriteLink(s.slice(closeB + 2, closeP))}">`
            + `${inlineTokens(s.slice(i + 1, closeB))}</a>`;
          i = closeP + 1;
          continue;
        }
      }
    }

    // bold **...** (find the matching pair, then recurse on the interior)
    if (c === '*' && s[i + 1] === '*') {
      const e = s.indexOf('**', i + 2);
      if (e > i + 1) {
        out += `<strong>${inlineTokens(s.slice(i + 2, e))}</strong>`;
        i = e + 2;
        continue;
      }
    }

    // italic *...* (single star, fails gracefully if unmatched)
    if (c === '*') {
      let j = i + 1;
      while (j < s.length && !(s[j] === '*' && s[j + 1] !== '*')) j += 1;
      if (j < s.length && j > i + 1) {
        out += `<em>${inlineTokens(s.slice(i + 1, j))}</em>`;
        i = j + 1;
        continue;
      }
    }

    out += c;
    i += 1;
  }
  return out;
}

function inline(md) {
  return inlineTokens(md);
}

function renderListItems(lines, ordered) {
  return lines
    .map((raw) => {
      let text = raw.replace(/^\s*(?:[-*]|\d+\.)\s+/, '');
      const isCheckbox = /^\[( |x|X)\]\s*/.test(text);
      if (isCheckbox) {
        text = text.replace(/^\[( |x|X)\]\s*/, '');
        return `<li class="check"><label><input type="checkbox"><span>${inline(text)}</span></label></li>`;
      }
      return `<li>${inline(text)}</li>`;
    })
    .filter(Boolean);
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let para = [];
  let inCode = false;
  let code = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      flushPara();
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
      }
      inCode = !inCode;
      i += 1;
      continue;
    }
    if (inCode) {
      code.push(line);
      i += 1;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // hr
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushPara();
      out.push('<hr>');
      i += 1;
      continue;
    }

    // blank
    if (/^\s*$/.test(line)) {
      flushPara();
      i += 1;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${mdToHtml(buf.join('\n'))}</blockquote>`);
      continue;
    }

    // table
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushPara();
      const header = line.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
        i += 1;
      }
      const cell = (c, tag) => {
        // multi-line looking cells: let "or / phrase / other" render plainly
        return `<${tag}>${inline(c)}</${tag}>`;
      };
      out.push('<table><thead><tr>' + header.map((c) => cell(c, 'th')).join('') + '</tr></thead><tbody>'
        + rows.map((r) => '<tr>' + r.map((c) => cell(c, 'td')).join('') + '</tr>').join('')
        + '</tbody></table>');
      continue;
    }

    // list item (absorbs indented continuation lines into the current item)
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+/);
    if (listMatch) {
      flushPara();
      const ordered = /\d+\./.test(listMatch[2]);
      const items = [];
      while (i < lines.length) {
        const cur = lines[i];
        if (/^\s*([-*]|\d+\.)\s+/.test(cur)) {
          items.push(cur.replace(/^\s*/, ''));
          i += 1;
        } else if (/^\s{2,}\S/.test(cur) && items.length > 0) {
          // wrapped continuation of the previous item
          items[items.length - 1] += ' ' + cur.trim();
          i += 1;
        } else {
          break;
        }
      }
      // remove stray empty items from block boundaries
      const rendered = renderListItems(items, ordered).join('');
      out.push(`<${ordered ? 'ol' : 'ul'}>` + rendered + `</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    // regular paragraph line
    para.push(line.trim());
    i += 1;
  }
  flushPara();
  return out.join('\n');
}

// ---------------------------------------------------------------- template

function pageTemplate({ title, body, kind }) {
  const crumb = kind === 'worksheet' ? 'Printable worksheet' : 'Guide chapter';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="../css/style.css">
</head>
<body>
<nav class="topnav">
  <a class="brand" href="../index.html">Audiobook Voice Guide</a>
  <div class="links">
    <a href="../index.html">Home</a>
    <a href="../decision-tree.html">Decision Tree</a>
    <a href="../scorecard.html">Listening Rubric</a>
    <a href="00-start-here.html">Chapters</a>
    <a href="ws-01-voice-decision-worksheet.html">Worksheets</a>
  </div>
</nav>
<main>
  <p class="crumb">${crumb}</p>
  ${body}
</main>
<footer>
  <p><strong>The Audiobook Voice Decision Guide</strong> — by <strong>Asdale Dynamics, LLC</strong>.
  Plain-words AI education. Companion to <em>Audiobook Recording Handbook</em>.</p>
  <p>No vendor kickbacks, no affiliate links. Copyright (c) 2026 Asdale Dynamics, LLC. MIT licensed.</p>
</footer>
<script src="../js/main.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- run

function build() {
  codeCache = [];
  mkdirSync(OUT, { recursive: true });
  const manifest = [];

  for (const rel of [...CHAPTERS, ...WORKSHEETS]) {
    codeCache = [];
    const srcPath = join(DOCS, rel);
    if (!existsSync(srcPath)) throw new Error(`Missing source doc: docs/${rel}`);
    const md = readFileSync(srcPath, 'utf8');
    const body = mdToHtml(md);
    const firstHeading = md.match(/^#\s+(.+)$/m);
    const title = firstHeading ? firstHeading[1].replace(/\*[^*]+\*/g, '').trim() : basename(rel);
    const outName = rel.replace(/^worksheets\//, '').replace(/\.md$/, '.html');
    const kind = rel.startsWith('worksheets/') ? 'worksheet' : 'chapter';
    writeFileSync(join(OUT, outName), pageTemplate({ title, body, kind }));
    manifest.push({ source: `docs/${rel}`, output: `site/pages/${outName}`, title });
  }

  writeFileSync(join(ROOT, 'site', 'pages', 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Built ${manifest.length} pages into site/pages/.`);
}

build();
