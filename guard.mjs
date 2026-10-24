// Guard: the mechanical half of the card checks, run by build.mjs before anything is written (also `node build.mjs --check`).
// It reads the assembled card code and the sources, and stops the build with one line per failure. What it checks:
//   1. 자립성: no external resource but the font link (no http(s) URL, <link>, @import, url(), import).
//   2. 색: raw colors only in tokens.css. White and translucent black (tooltip ink, shadows) are the only exceptions.
//   3. 토큰: every var(--vzb-*) is declared in tokens.css or set by the card itself; prefix --vzb- on every custom property.
//   4. 높이: the min-height rule each card ends up with is the unit in TIER (1 · 1.5 · 2) — no card without a height.
//   5. 충돌: every selector is scoped (contains "vzb"), no element ids, no globals (window.x =); the code is one IIFE.
//   6. 접근성: a file that animates has a prefers-reduced-motion rule; a card that reacts to the pointer also takes the keyboard.
//   7. 데이터: the example JSON parses, labels and values have the same length, and no field the card computes is written in.
//   8. 메타: every meta.json card has its .js and .json, no orphan source file, ids are slugs under their category, uses are known parts.
//   9. 주소: no public card address (docs/cards/<id>.txt) disappears.
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const COLOR_OK = /^#f{3}$|^#f{6}$|^rgba\(\s*255\s*,\s*255\s*,\s*255\s*,|^rgba\(\s*(27\s*,\s*27\s*,\s*27|17\s*,\s*24\s*,\s*39)\s*,/i;
const COMPUTED = ['delta', 'change', 'share', 'pct', 'percent', 'ratio', 'rate', 'total', 'sum', 'rank'];
// Known gaps the guard reports as warnings instead of failing: card id → why, to be fixed as a card change.
const KNOWN = { 'heatmap-basic': '칸 값은 화면 낭독기가 읽지만 키보드로는 못 연다. 칸 사이 키보드 이동을 더할 때 지운다' };

export function guard({ root, cats, parts, partCss, partJs, tokens, tier, snippets, fontLink }) {
  const fails = [], warns = [];
  const fail = (where, msg) => fails.push(`${where}: ${msg}`);
  const warn = (msg) => warns.push(msg);
  const src = (p) => readFileSync(join(root, p), 'utf8');
  const vdir = join(root, 'src/variants');
  const all = cats.flatMap((c) => c.variants.map((v) => ({ ...v, cat: c.id })));
  const ids = new Set(all.map((v) => v.id));

  // 8. meta.json ↔ files
  for (const v of all) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.id)) fail(v.id, '카드 id는 소문자·숫자·하이픈만 쓴다');
    if (!v.id.startsWith(`${v.cat}-`)) fail(v.id, `카드 id는 카테고리 "${v.cat}-"로 시작해야 CSS의 [data-vzb^=] 규칙이 맞는다`);
    if (!existsSync(join(vdir, `${v.id}.js`))) fail(v.id, 'src/variants/<id>.js가 없다');
    if (!existsSync(join(vdir, `${v.id}.json`))) fail(v.id, 'src/variants/<id>.json(예시 데이터)이 없다');
    if (!v.when) fail(v.id, 'meta.json에 when(언제 쓰는지)이 없다');
    if (!v.rules || !v.rules.length) fail(v.id, 'meta.json에 rules(규칙과 이유)가 없다');
    for (const u of v.uses || []) if (!parts.includes(u)) fail(v.id, `uses에 모르는 부품 "${u}"`);
  }
  for (const f of readdirSync(vdir)) {
    const m = f.match(/^(.+)\.(js|json|css)$/);
    if (!m || f === 'meta.json' || f === 'purposes.json') continue;
    if (!ids.has(m[1])) fail(`src/variants/${f}`, 'meta.json에 없는 카드의 파일이다. 카드를 내릴 때는 지우지 말고 retired를 적는다');
  }

  // 9. public addresses never disappear
  const cardsDir = join(root, 'docs/cards');
  if (existsSync(cardsDir)) {
    for (const f of readdirSync(cardsDir)) {
      const m = f.match(/^(.+)\.txt$/);
      if (m && !ids.has(m[1])) fail(`docs/cards/${f}`, '공개된 카드 주소가 사라진다. meta.json에서 카드를 지우지 말고 retired를 적는다');
    }
  }

  // Source-file checks (2, 3, 5, 6): tokens.css is the only place for raw colors.
  const declared = new Set([...tokens.matchAll(/(--vzb-[\w-]+)\s*:/g)].map((m) => m[1]));
  const files = [
    ...parts.flatMap((p) => [[`src/${p}.css`, partCss[p]], [`src/${p}.js`, partJs[p]]]),
    ['src/base.css', src('src/base.css')], ['src/core.js', src('src/core.js')],
    ...all.flatMap((v) => [[`src/variants/${v.id}.js`, src(`src/variants/${v.id}.js`)], existsSync(join(vdir, `${v.id}.css`)) ? [`src/variants/${v.id}.css`, src(`src/variants/${v.id}.css`)] : null]),
  ].filter((x) => x && x[1]);
  const setByCode = new Set();
  for (const [file, text] of files) {
    // custom properties a card sets itself (style="--vzb-c:…", setProperty('--vzb-c'), or a declaration in its CSS)
    for (const m of text.matchAll(/(--vzb-[\w-]+)\s*:/g)) setByCode.add(m[1]);
    for (const m of text.matchAll(/setProperty\(\s*'(--vzb-[\w-]+)'/g)) setByCode.add(m[1]);
    for (const m of text.matchAll(/(?<![\w-])(--(?!vzb-)[a-z][\w-]*)\s*:/g)) fail(file, `사용자 변수는 --vzb-로 시작한다: ${m[1]}`);
    const noComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const [i, line] of noComments.split('\n').entries()) {
      if (!HEX.test(line)) continue;
      for (const c of line.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g) || []) {
        if (!COLOR_OK.test(c)) fail(`${file}:${i + 1}`, `토큰 밖의 색 ${c}. 색은 src/tokens.css의 --vzb-* 변수로만 쓴다`);
      }
    }
    if (file.endsWith('.css')) {
      if (/transition|animation/.test(noComments) && !/prefers-reduced-motion:\s*reduce/.test(noComments)) fail(file, 'transition·animation이 있으면 같은 파일에 @media (prefers-reduced-motion: reduce) 규칙을 둔다');
      // Every selector is scoped to the cards.
      for (const m of noComments.replace(/@media[^{]*\{/g, '').matchAll(/(^|[}{;])\s*([^{}@;]+?)\s*\{/g)) {
        for (const sel of m[2].split(',')) {
          const s = sel.trim();
          if (s && !/vzb/.test(s) && !/^(from|to|\d+%)$/.test(s)) fail(file, `카드 밖에 미치는 선택자 "${s}". 모든 선택자에 vzb가 들어가야 다른 페이지와 충돌하지 않는다`);
        }
      }
    } else {
      // Fixed element ids clash when the same card is pasted twice; generated ones (`vzb-ar${…}`) are fine.
      if (/getElementById|\bid\s*[:=]\s*['"][^'"]/.test(noComments)) fail(file, '카드 안에서 고정된 요소 id를 쓰지 않는다. 같은 카드 두 장이 한 페이지에 있으면 겹친다');
      if (/\bwindow\.\w+\s*=[^=]/.test(noComments)) fail(file, '전역(window.x =)에 쓰지 않는다');
      // Information shown only on hover (a tooltip) must also be reachable by keyboard: interact() from chart.js or a keydown handler.
      if (/\b(pointer|mouse)(enter|move|over)/.test(noComments) && /showTip\(/.test(noComments) && !/\binteract\(|keydown/.test(noComments)) {
        const id = file.match(/variants\/(.+)\.js$/)?.[1];
        if (id && KNOWN[id]) warn(`${file}: 툴팁을 마우스로만 연다 (알려진 예외: ${KNOWN[id]})`);
        else fail(file, '툴팁을 포인터로만 열지 않는다. interact()나 keydown으로 키보드에서도 같은 값을 보여준다');
      }
    }
  }
  const used = new Set(files.flatMap(([, t]) => [...t.matchAll(/var\(\s*(--vzb-[\w-]+)/g)].map((m) => m[1])));
  for (const name of used) if (!declared.has(name) && !setByCode.has(name)) fail('src', `var(${name})을 쓰지만 tokens.css에도, 카드 코드에도 선언이 없다`);

  // 4. height: the most specific min-height rule for the card must give TIER[id] (default 2) units.
  const allCss = files.filter(([f]) => f.endsWith('.css')).map(([f, t]) => [f, t.replace(/\/\*[\s\S]*?\*\//g, '')]);
  const unitOf = (decl) => {
    const m = decl.match(/min-height\s*:\s*(?:calc\(\s*)?var\(--vzb-unit\)(?:\s*\*\s*([\d.]+))?/);
    return m ? Number(m[1] || 1) : null;
  };
  for (const v of all) {
    let exact = null, prefix = null;
    for (const [, t] of allCss) {
      for (const m of t.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const u = unitOf(m[2]);
        if (u == null) continue;
        const sels = m[1].split(',').map((s) => s.trim());
        if (sels.some((s) => s.includes(`[data-vzb="${v.id}"]`))) exact = u;
        else if (sels.some((s) => { const p = s.match(/\[data-vzb\^="([^"]+)"\]/); return p && v.id.startsWith(p[1]); })) prefix = u;
      }
    }
    const got = exact ?? prefix ?? 1.5;
    const want = tier[v.id] || 2;
    if (![1, 1.5, 2].includes(got)) fail(v.id, `높이 ${got}단위는 없다. 1 · 1.5 · 2 중 하나로 둔다`);
    else if (got !== want) fail(v.id, `CSS의 높이는 ${got}단위인데 build.mjs TIER는 ${want}단위다. 둘을 맞춘다`);
  }

  // Snippet checks (1, 5, 7) on the code people copy.
  for (const v of all) {
    const code = snippets[v.id];
    const where = `cards/${v.id}.txt`;
    // Comments (the header, tokens.css notes, JS notes) may name addresses; only live references count.
    const body = code.replace(fontLink, '').replace(/<!--[\s\S]*?-->/, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of body.matchAll(/https?:\/\/[^\s"'`)]+/g)) if (m[0] !== 'http://www.w3.org/2000/svg') fail(where, `외부 주소 ${m[0]}. 카드는 글꼴 링크 말고 아무것도 밖에서 가져오지 않는다`);
    if (/<link\b|@import\b|\burl\((?!#)|^\s*import\s/m.test(body)) fail(where, '외부 리소스(<link>, @import, url(), import)를 쓰지 않는다. url(#id)로 카드 안 요소를 가리키는 것은 괜찮다');
    const scripts = [...body.matchAll(/<script(?![^>]*application\/json)[^>]*>/g)].length;
    if (scripts !== 1 || !/<script>\n\(\(\) => \{\n\s+'use strict';/.test(body)) fail(where, '스크립트는 IIFE 하나여야 다른 카드와 변수가 섞이지 않는다');
    const json = body.match(/<script type="application\/json">\n([\s\S]*?)\n<\/script>/);
    if (!json) { fail(where, '데이터 JSON 블록이 없다'); continue; }
    let d;
    try { d = JSON.parse(json[1]); } catch (e) { fail(where, `예시 JSON을 읽지 못한다: ${e.message}`); continue; }
    if (!d.title) fail(where, '예시 JSON에 title이 없다');
    const n = Array.isArray(d.labels) ? d.labels.length : null;
    if (n != null) {
      if (Array.isArray(d.values) && d.values.length !== n) fail(where, `labels ${n}개, values ${d.values.length}개. 길이를 맞추고 없는 기간은 null로 둔다`);
      for (const s of Array.isArray(d.series) ? d.series : []) if (Array.isArray(s.values) && s.values.length !== n) fail(where, `labels ${n}개, series "${s.name}"의 values ${s.values.length}개`);
    }
    for (const k of Object.keys(d)) if (COMPUTED.includes(k.toLowerCase())) fail(where, `예시 JSON의 "${k}"는 카드가 계산하는 값이다. JSON에 적지 않는다`);
    for (const row of Array.isArray(d.rows) ? d.rows : []) for (const k of Object.keys(row)) if (['share', 'pct', 'delta', 'change'].includes(k.toLowerCase())) fail(where, `rows의 "${k}"는 카드가 계산하는 값이다`);
  }

  for (const w of warns) console.warn(`guard warning: ${w}`);
  if (fails.length) throw new Error(`가드 ${fails.length}건 실패:\n${fails.map((f) => `  - ${f}`).join('\n')}`);
  return all.length;
}
