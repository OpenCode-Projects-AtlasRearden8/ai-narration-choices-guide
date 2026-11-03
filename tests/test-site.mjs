/**
 * Test suite for The Audiobook Voice Decision Guide.
 * Zero dependencies. Run: npm test
 *
 * Covers: build parity, internal link integrity, page structure,
 * decision-tree logic, rubric logic, and hygiene checks (credits, no
 * affiliate/referral links, no secrets).
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let pass = 0;
let fail = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push(`${name}: ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------------------------------------------------------------- build
execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-site.mjs')], { cwd: ROOT });

const EXPECTED_PAGES = [
  '00-start-here.html',
  '01-human-vs-ai-voice.html',
  '02-platform-rules.html',
  '03-sample-listening-rubric.html',
  '04-rights-and-disclosure.html',
  '05-budget-ladders.html',
  '06-launch-day-qc.html',
  'ws-01-voice-decision-worksheet.html',
  'ws-02-listening-rubric-scorecard.html',
  'ws-03-budget-ladder-planner.html',
  'ws-04-launch-day-qc-checklist.html',
];

check('build generates all 11 expected pages', () => {
  for (const p of EXPECTED_PAGES) {
    assert(existsSync(join(ROOT, 'site', 'pages', p)), `missing site/pages/${p}`);
  }
});

// walk all html files in site/
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
const siteFiles = walk(join(ROOT, 'site'));
const htmlFiles = siteFiles.filter((f) => extname(f) === '.html');

check('every internal href/src in every html page resolves', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (/^(https?:)?\/\//.test(ref) || ref.startsWith('mailto:')) continue;
      const target = join(dirname(file), ref.split('#')[0]);
      if (ref.split('#')[0] === '') continue; // pure anchor
      assert(existsSync(target), `${relative(ROOT, file)} -> dead link ${ref}`);
    }
  }
});

check('every generated page has nav, main content and the Asdale credit footer', () => {
  for (const file of walk(join(ROOT, 'site', 'pages')).filter((f) => extname(f) === '.html')) {
    const html = readFileSync(file, 'utf8');
    assert(html.includes('<nav class="topnav">'), `${relative(ROOT, file)}: no nav`);
    assert(html.includes('<main>'), `${relative(ROOT, file)}: no main`);
    assert(html.includes('Asdale Dynamics, LLC'), `${relative(ROOT, file)}: no credit`);
    assert(html.includes('<!DOCTYPE html>'), `${relative(ROOT, file)}: no doctype`);
  }
});

check('site pages contain no leftover markdown artifacts', () => {
  for (const file of walk(join(ROOT, 'site', 'pages'))) {
    const html = readFileSync(file, 'utf8');
    const body = html.split('<main>')[1];
    assert(!/\*\*/.test(body), `${relative(ROOT, file)}: unconverted ** in body`);
    assert(!/\u0000CODE\d/.test(body), `${relative(ROOT, file)}: unstashed code marker`);
    assert(!/[()]([^)]*\.md)/.test(body), `${relative(ROOT, file)}: unrewritten .md link`);
  }
});

check('manifest lists 11 pages', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'site', 'pages', 'manifest.json'), 'utf8'));
  assert(manifest.length === 11, `manifest has ${manifest.length} entries`);
});

// ------------------------------------------------- docs link integrity
check('all markdown links inside docs/ resolve to real files', () => {
  for (const file of [...walk(join(ROOT, 'docs'))]) {
    if (extname(file) !== '.md') continue;
    const md = readFileSync(file, 'utf8');
    for (const m of md.matchAll(/\]\(([^)]+)\)/g)) {
      const ref = m[1];
      if (/^https?:/.test(ref)) continue;
      const target = join(dirname(file), ref.split('#')[0]);
      assert(existsSync(target), `${relative(ROOT, file)} -> dead md link ${ref}`);
    }
  }
});

// ---------------------------------------------------------------- logic
const tree = require(join(ROOT, 'site', 'js', 'decision-tree.js'));
const rubric = require(join(ROOT, 'site', 'js', 'rubric.js'));

check('decision tree: dialogue-heavy fiction + human budget -> human', () => {
  const r = tree.recommend({ bookType: 'fiction-dialogue', budgetRung: 3, schedule: 'patient', authorVoice: 'no' });
  assert(r.decision === 'human', `got ${r.decision}`);
  assert(r.rung === 3, `got rung ${r.rung}`);
});

check('decision tree: dialogue-heavy fiction + tiny budget -> consider-waiting', () => {
  const r = tree.recommend({ bookType: 'fiction-dialogue', budgetRung: 1, schedule: 'patient', authorVoice: 'no' });
  assert(r.decision === 'consider-waiting', `got ${r.decision}`);
});

check('decision tree: nonfiction + fast/cheap -> AI voice', () => {
  const r = tree.recommend({ bookType: 'nonfiction', budgetRung: 1, schedule: 'this-month', authorVoice: 'no' });
  assert(r.decision === 'ai', `got ${r.decision}`);
});

check('decision tree: author-voice brand + patience -> DIY (rung 0)', () => {
  const r = tree.recommend({ bookType: 'nonfiction', budgetRung: 2, schedule: 'patient', authorVoice: 'yes' });
  assert(r.decision === 'diy', `got ${r.decision}`);
  assert(r.rung === 0, `got rung ${r.rung}`);
});

check('decision tree: patient author with budget -> human default', () => {
  const r = tree.recommend({ bookType: 'fiction-quiet', budgetRung: 4, schedule: 'patient', authorVoice: 'no' });
  assert(r.decision === 'human', `got ${r.decision}`);
});

check('decision tree: shrug answers -> cheap-ai-now with rung 1', () => {
  const r = tree.recommend({ bookType: 'fiction-quiet', budgetRung: 1, schedule: 'this-month', authorVoice: 'unsure' });
  assert(r.decision === 'cheap-ai-now', `got ${r.decision}`);
  assert(r.rung === 1, `got rung ${r.rung}`);
});

check('decision tree: rung 4 human never recommends rung above 4', () => {
  const r = tree.recommend({ bookType: 'nonfiction', budgetRung: 9, schedule: 'patient' });
  assert(r.rung === 4, `got rung ${r.rung}`);
});

check('decision tree: every recommendation carries a title and why', () => {
  for (const answers of [{}, { bookType: 'fiction-dialogue' }, { budgetRung: 4 }, { schedule: 'this-month', authorVoice: 'yes' }]) {
    const r = tree.recommend(answers);
    assert(typeof r.title === 'string' && r.title.length > 0, 'missing title');
    assert(typeof r.why === 'string' && r.why.length > 0, 'missing why');
  }
});

check('rubric: totals map to the documented decision bands', () => {
  assert(rubric.band(25).action === 'offer', '25 should be offer');
  assert(rubric.band(21).action === 'offer', '21 should be offer');
  assert(rubric.band(20).action === 'second-audition', '20 should be caution');
  assert(rubric.band(16).action === 'second-audition', '16 should be caution');
  assert(rubric.band(15).action === 'cross-off', '15 should be cross-off');
  assert(rubric.band(11).action === 'cross-off', '11 should be cross-off');
  assert(rubric.band(10).action === 'reject', '10 should be reject');
  assert(rubric.band(1).action === 'reject', '1 should be reject');
});

check('rubric: evaluate clamps bad input and flags broken dimensions', () => {
  const ev = rubric.evaluate([0, 99, 3, 4, 5, 2]); // extra + out of range
  assert(ev.scores.length === 5, 'clamp to 5 dims');
  assert(ev.scores[0] === 1 && ev.scores[1] === 5, '1..5 clamp');
  assert(ev.broken === true, 'should flag low dimension');
  assert(ev.total === 18, `total ${ev.total}`);
});

check('rubric: clean 5x5 = 25 and offer', () => {
  const ev = rubric.evaluate([5, 5, 5, 5, 5]);
  assert(ev.total === 25 && ev.band.action === 'offer' && !ev.broken);
});

// ---------------------------------------------------------------- hygiene
check('README exists, credits Asdale Dynamics, LLC, lists npm scripts', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert(readme.includes('Asdale Dynamics, LLC'), 'missing credit');
  assert(readme.includes('npm test'), 'missing npm test');
  assert(readme.includes('npm run build'), 'missing npm run build');
  assert(readme.includes('Audiobook Recording Handbook'), 'missing companion mention');
});

check('LICENSE is MIT with the exact copyright line', () => {
  const lic = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
  assert(lic.includes('Copyright (c) 2026 Asdale Dynamics, LLC'), 'missing exact copyright line');
  assert(lic.includes('Permission is hereby granted'), 'not an MIT license');
});

check('no affiliate/referral/tracking link patterns anywhere in site or docs', () => {
  const banned = /utm_|amzn\.to|\?tag=|\/dp\/|affil\.(?:link|page)|referral=|affiliate-?link/i;
  for (const file of [...siteFiles, ...walk(join(ROOT, 'docs'))]) {
    if (['.html', '.md', '.css', '.js'].includes(extname(file))) {
      const txt = readFileSync(file, 'utf8');
      assert(!banned.test(txt), `${relative(ROOT, file)}: looks affiliate-controlled`);
    }
  }
});

check('no obvious secrets or keys in the repo', () => {
  const banned = /(api[_-]?key|secret|password)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{12,}/i;
  for (const file of siteFiles) {
    const txt = readFileSync(file, 'utf8');
    assert(!banned.test(txt), `${relative(ROOT, file)}: possible secret`);
  }
});

check('all interactive pages load their testable JS modules', () => {
  const dt = readFileSync(join(ROOT, 'site', 'decision-tree.html'), 'utf8');
  assert(dt.includes('js/decision-tree.js'), 'decision-tree page missing its script');
  const sc = readFileSync(join(ROOT, 'site', 'scorecard.html'), 'utf8');
  assert(sc.includes('js/rubric.js'), 'scorecard page missing its script');
});

check('worksheets render as interactive checkboxes on the site', () => {
  for (const p of EXPECTED_PAGES.filter((n) => n.startsWith('ws-'))) {
    const html = readFileSync(join(ROOT, 'site', 'pages', p), 'utf8');
    assert(html.includes('input type="checkbox"'), `${p}: no checkboxes`);
  }
});

// ---------------------------------------------------------------- report
console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) {
  for (const f of failures) console.error('FAIL  ' + f);
  process.exit(1);
}
console.log('All tests passed.');
