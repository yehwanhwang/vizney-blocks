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
//  10. 문구: every Korean string a card can show goes through tx() in core.js, every tx() key has an English entry in EN and every
//      EN entry is used, so "lang": "en" leaves no Korean behind. The won notations (조 · 억 · 만 · 원) are the only bare Korean.
//  11. 영어: every card that is not retired has its English example (src/variants/<id>.en.json, with "lang": "en") and its
//      English wording (meta.en.json: when, rules of the same count, guide; every category: name, intro, lede, height), and
//      purposes.en.json mirrors purposes.json (same purposes and cards, in the same order, with translated when).
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const COLOR_OK = /^#f{3}$|^#f{6}$|^rgba\(\s*255\s*,\s*255\s*,\s*255\s*,|^rgba\(\s*(27\s*,\s*27\s*,\s*27|17\s*,\s*24\s*,\s*39)\s*,/i;
const COMPUTED = ['delta', 'change', 'share', 'pct', 'percent', 'ratio', 'rate', 'total', 'sum', 'rank'];
// Known gaps the guard reports as warnings instead of failing: card id → why, to be fixed as a card change.
const KNOWN = {};

// Strings and tx() calls in a card script. Walks the source once, keeping track of comments, the three string kinds and `${}` inside
// template literals, and returns every string literal with whether it is inside a tx(…) call (a ternary of keys counts) and
// which quote it uses. Keys are single-quoted literals inside tx(); any other Korean is a card word that bypasses tx().
export function wordsOf(src) {
  const out = [];
  let i = 0;
  const code = (inExpr) => {   // reads code to the end, or (inside `${…}`) to its closing brace, tracking tx() spans
    let tx = 0, depth = 0, brace = 0;
    while (i < src.length) {
      const c = src[i], c2 = src.slice(i, i + 2);
      if (c2 === '//') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c2 === '/*') { i = src.indexOf('*/', i + 2) + 2; continue; }
      if (c === "'" || c === '"' || c === '`') { str(c, tx > 0); continue; }
      if (c === '/' && /(?:[(,=:?!&|[{;]|\breturn|\btypeof)\s*$/.test(src.slice(Math.max(0, i - 20), i))) { i++; while (i < src.length && src[i] !== '/') { if (src[i] === '\\') i++; i++; } i++; continue; }   // a regex literal
      if (/\btx\($/.test(src.slice(Math.max(0, i - 3), i + 1))) { tx += 1; depth += 1; i++; continue; }
      if (c === '(') depth += tx ? 1 : 0;
      if (c === ')' && tx) { depth -= 1; if (!depth) tx = 0; }
      if (c === '{') brace += 1;
      if (c === '}') { if (brace) brace -= 1; else if (inExpr) return; }
      i++;
    }
  };
  const str = (q, inTx) => {
    let s = '';
    i++;
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; continue; }
      if (q === '`' && src.slice(i, i + 2) === '${') { i += 2; out.push({ q, inTx, text: s }); code(true); i++; s = ''; continue; }
      s += src[i++];
    }
    i++;
    out.push({ q, inTx, text: s });
  };
  code(false);
  return out;
}

export function guard({ root, cats, parts, partCss, partJs, tokens, tier, snippets, snippetsEn, en, purposes, purposesEn, fontLink }) {
  const fails = [], warns = [];
  const fail = (where, msg) => fails.push(`${where}: ${msg}`);
  const warn = (msg) => warns.push(msg);
  const src = (p) => readFileSync(join(root, p), 'utf8');
  const vdir = join(root, 'src/variants');
  const all = cats.flatMap((c) => c.variants.map((v) => ({ ...v, cat: c.id })));
  const ids = new Set(all.map((v) => v.id));
  const live = all.filter((v) => !v.retired);

  // 10. card words: Korean only through tx(), every key in EN, every EN entry used
  const core = src('src/core.js');
  const enStart = core.indexOf('const EN = {'), enEnd = core.indexOf('\n  };', enStart) + 5;
  if (enStart < 0 || enEnd < 5) fail('src/core.js', 'const EN = { … }; 번역표가 없다');
  const EN = enStart < 0 ? {} : new Function(`${core.slice(enStart, enEnd)} return EN;`)();
  const usedKeys = new Set();
  const wordFiles = [['src/core.js', core.slice(0, enStart) + core.slice(enEnd)], ...parts.map((p) => [`src/${p}.js`, partJs[p]]), ...all.map((v) => [`src/variants/${v.id}.js`, src(`src/variants/${v.id}.js`)])];
  for (const [file, text] of wordFiles) {
    if (!text) continue;
    for (const w of wordsOf(text)) {
      if (w.inTx && w.q === "'" && /[가-힣%]/.test(w.text)) {   // a key: Korean, or a bare pattern like '%s%p'
        usedKeys.add(w.text);
        if (!(w.text in EN)) fail(file, `tx() 문구 '${w.text}'의 영어가 core.js의 EN에 없다`);
      } else if (/[가-힣]/.test(w.text.replace(/[조억만원]/g, ''))) fail(file, `카드에 보이는 한국어 '${w.text}'가 tx()를 거치지 않는다. "lang": "en"이면 영어가 나오게 tx(d, '…')로 적는다`);
    }
  }
  for (const k of Object.keys(EN)) if (!usedKeys.has(k)) fail('src/core.js', `EN의 '${k}'를 쓰는 카드가 없다. 표에서 지운다`);

  // 11. English: example data, wording and purpose index for every card that is not retired (build.mjs passes en; --check alone may not)
  const enCats = (en && en.cats) || {}, enCards = (en && en.cards) || {};
  for (const c of en ? cats : []) {
    if (!c.variants.some((v) => !v.retired)) continue;
    const e = enCats[c.id];
    if (!e) { fail(`meta.en.json`, `카테고리 ${c.id}의 영어(name · intro · lede · height)가 없다`); continue; }
    for (const k of ['name', 'intro', 'lede', 'height']) if (!e[k]) fail('meta.en.json', `${c.id}.${k}가 없다`);
    for (const g of c.groups || []) if (!e.groups || !e.groups[g.id] || !e.groups[g.id].name || !e.groups[g.id].note) fail('meta.en.json', `${c.id}.groups.${g.id}의 name과 note가 없다`);
    if (c.option && (!e.option || !e.option.label || !Array.isArray(e.option.choices) || e.option.choices.length !== c.option.choices.length)) fail('meta.en.json', `${c.id}.option의 label과 choices(${c.option.choices.length}개)가 없다`);
    if (c.guide && (!e.guide || !e.guide.name || !e.guide.url)) fail('meta.en.json', `${c.id}.guide의 name과 url이 없다`);
  }
  for (const v of en ? live : []) {
    const e = enCards[v.id];
    if (!e) fail('meta.en.json', `${v.id}의 영어(when · rules)가 없다`);
    else {
      if (!e.when) fail('meta.en.json', `${v.id}.when이 없다`);
      if (!Array.isArray(e.rules) || e.rules.length !== v.rules.length) fail('meta.en.json', `${v.id}.rules는 한국어와 같은 ${v.rules.length}개여야 한다`);
      if (v.guide && (!e.guide || !e.guide.name || !e.guide.url)) fail('meta.en.json', `${v.id}.guide의 name과 url이 없다`);
    }
    const p = join(vdir, `${v.id}.en.json`);
    if (!existsSync(p)) { fail(v.id, 'src/variants/<id>.en.json(영어 예시 데이터)이 없다'); continue; }
    try {
      const d = JSON.parse(readFileSync(p, 'utf8'));
      if (d.lang !== 'en') fail(`src/variants/${v.id}.en.json`, '"lang": "en"이 있어야 카드 안 문구가 영어가 된다');
      if (/[가-힣]/.test(JSON.stringify(d))) fail(`src/variants/${v.id}.en.json`, '영어 예시에 한국어가 있다');
    } catch (e) { fail(`src/variants/${v.id}.en.json`, `읽지 못한다: ${e.message}`); }
  }
  if (purposes && purposesEn) {
    if (purposesEn.length !== purposes.length) fail('purposes.en.json', `목적이 ${purposes.length}개여야 한다`);
    purposes.forEach((p, i) => {
      const e = purposesEn[i];
      if (!e || e.id !== p.id) { fail('purposes.en.json', `${i + 1}번째 목적은 ${p.id}여야 한다`); return; }
      if (!e.name || !e.question) fail('purposes.en.json', `${p.id}의 name과 question이 없다`);
      if (!Array.isArray(e.picks) || e.picks.map((k) => k.id).join() !== p.picks.map((k) => k.id).join()) fail('purposes.en.json', `${p.id}의 picks는 한국어와 같은 카드를 같은 순서로 둔다`);
      else e.picks.forEach((k) => { if (!k.when) fail('purposes.en.json', `${p.id}의 ${k.id}에 when이 없다`); });
    });
  }

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
    const m = f.match(/^(.+?)(\.en)?\.(js|json|css)$/);
    if (!m || ['meta.json', 'meta.en.json', 'purposes.json', 'purposes.en.json'].includes(f)) continue;
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

  // Snippet checks (1, 5, 7) on the code people copy, in both languages.
  for (const [v, code, where] of [...all.map((v) => [v, snippets[v.id], `cards/${v.id}.txt`]), ...live.map((v) => [v, (snippetsEn || {})[v.id], `en/cards/${v.id}.txt`])]) {
    if (!code) continue;
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
