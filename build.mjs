// Builds the Vizney Blocks gallery: one self-contained snippet per card variant, the gallery page that previews
// and copies them, standalone test pages, an embedded subset of the font, and the public site in docs/
// (GitHub Pages at blocks.vizney.com: gallery, a page and a plain-text copy per card, llms.txt for AI tools).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const r = (p) => readFileSync(join(root, p), 'utf8');
const FONT_DIR = process.env.SPOQA_DIR;
const VERSION = 'v0.20';
const SITE = 'https://blocks.vizney.com';
const REPO = 'https://github.com/yehwanhwang/vizney-blocks';
const NOTICE = '© 2026 Vizney · MIT License';
const FONT_LINK = '<link rel="stylesheet" href="https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css">';

const tokens = r('src/tokens.css').trim();
const baseCss = r('src/base.css').trim();
const core = r('src/core.js').trimEnd();
// Shared parts a card can use: chart (tooltip, pointer/keyboard), curve (line shapes), axis (axis frame for line and bar cards),
// line and bar (marks drawn on the frame), tabs (equal-width metric tabs), table (sortable tables with total rows),
// waterfall (floating bars on the bar frame), scatter (x/y frame), bump (rank lines), funnel (stepped flows),
// sankey (node-and-ribbon flows) and radar (polygons on spokes).
const parts = ['chart', 'curve', 'axis', 'line', 'bar', 'list', 'share', 'tabs', 'table', 'waterfall', 'scatter', 'bump', 'funnel', 'sankey', 'radar'];
const opt = (p) => (existsSync(join(root, p)) ? r(p) : '');
const partCss = Object.fromEntries(parts.map((p) => [p, opt(`src/${p}.css`).trim()]));
const partJs = Object.fromEntries(parts.map((p) => [p, opt(`src/${p}.js`).trimEnd()]));
const cats = JSON.parse(r('src/variants/meta.json'));
const vp = (id, ext) => `src/variants/${id}.${ext}`;

const css = (v) => [tokens, baseCss, ...v.uses.map((u) => partCss[u] || ''), existsSync(join(root, vp(v.id, 'css'))) ? r(vp(v.id, 'css')).trim() : '']
  .filter(Boolean).join('\n');
const js = (v) => [core, ...v.uses.map((u) => partJs[u] || ''), r(vp(v.id, 'js')).trimEnd()].filter(Boolean).join('\n\n');
// Flat arrays and small objects stay on one line so the data reads like a table.
const json = (data) => JSON.stringify(data, null, 2)
  .replace(/\[\n\s+([^\[\]{}]*?)\n\s+\]/g, (m, inner) => `[${inner.split(/,\n\s+/).join(', ')}]`)
  .replace(/\{\n\s+([^\[\]{}]*?)\n\s+\}/g, (m, inner) => `{ ${inner.split(/,\n\s+/).join(', ')} }`);
const card = (id, data) => `<div class="vzb-card" data-vzb="${id}">
<script type="application/json">
${json(data)}
</script>
</div>`;
const tail = (v) => `<script>
(() => {
  'use strict';
${js(v)}
})();
</script>
`;

function snippet(v, cat) {
  return `<!-- Vizney Blocks ${VERSION} · ${cat.name} · ${v.name} (${v.id})
     ${SITE}/cards/${v.id}.html · ${NOTICE}
     <body> 안 원하는 자리에 붙여 넣으면 그려집니다. 데이터는 아래 JSON만 바꾸세요. -->
${FONT_LINK}
<style>
${css(v)}
</style>
${card(v.id, JSON.parse(r(vp(v.id, 'json'))))}
${tail(v)}`;
}

const built = cats.map((cat) => ({ ...cat, variants: cat.variants.map((v) => ({ ...v, code: snippet(v, cat) })) }));
const variants = built.flatMap((cat) => cat.variants);
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

let html = r('page/template.html')
  .replace('/*__PAGE_CSS__*/', () => r('page/page.css').trim())
  .replace('/*__DATA__*/', () => `window.VZB_CATS = ${esc(built)};`)
  .replace('/*__PAGE_JS__*/', () => r('page/page.js').trim())
  .replaceAll('/*__VERSION__*/', VERSION);

// Embed the font: every character the page or a card can render, plus digits and number signs.
mkdirSync(join(root, 'build'), { recursive: true });
const chars = new Set(html.replace(/\\u003c/g, '<'));
for (const c of '0123456789.,+-−–%()[]/:·×…→ ') chars.add(c);
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
writeFileSync(join(root, 'build/chars.txt'), [...chars].filter((c) => c >= ' ').join(''));
if (!FONT_DIR) throw new Error('Set SPOQA_DIR to the folder holding SpoqaHanSansNeo-{Regular,Medium,Bold}.ttf');
console.log(execFileSync('python3', ['-I', join(root, 'tools/font.py'), FONT_DIR, join(root, 'build/chars.txt'), join(root, 'build')]).toString().trim());
let fontCss = '';
for (const w of [400, 500, 700]) {
  const b64 = readFileSync(join(root, `build/vz-sans-${w}.woff`)).toString('base64');
  fontCss += `@font-face{font-family:'VZ Sans';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff;base64,${b64}) format('woff');}\n`;
}
html = html.replace('/*__FONTS__*/', () => fontCss.trim());

// The artifact skeleton, so local test pages render the way the published page will.
const skeleton = (body) => `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n${body}</body></html>`;

// The artifact page leaves out the site-only links; the site fills them in below.
const site = html;
html = html.replace(/<!--__(LINKS|AI_STEP|FOOT)__-->\n?/g, '');

mkdirSync(join(root, 'dist/snippets'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), html);
writeFileSync(join(root, 'dist/preview.html'), skeleton(html));
writeFileSync(join(root, 'dist/snippets/all.html'), skeleton(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding:24px;background:#f6f7fb">\n${variants.map((v) => v.code).join('\n')}</div>\n`));
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB, ${variants.length} variants in ${built.length} categories`);

// ---------- Public site (docs/, served by GitHub Pages at blocks.vizney.com) ----------
const docs = join(root, 'docs');
rmSync(docs, { recursive: true, force: true });
mkdirSync(join(docs, 'cards'), { recursive: true });
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const plain = (s) => String(s).replace(/`/g, '');
const head = ({ title, desc, path, icon, css = '', extra = '' }) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${SITE}${path}">
<link rel="icon" href="${icon}" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vizney Blocks">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
${css}${extra}</head>`;

// Gallery: the page's own <title>, artifact meta and style move into <head>.
const desc = '복사해 붙여 쓰는 HTML 대시보드 카드 모음. KPI, 막대, 라인, 그리드, 도넛, 스캐터, 생키, 레이더 등 '
  + `${variants.length}종을 Vizney 차트 가이드의 판단 규칙으로 만들었습니다. MIT License.`;
const parts0 = site.match(/^<title>[^<]*<\/title>\n<meta name="claude:viewport-fit-sides"[^>]*>\n(<style>[\s\S]*?<\/style>)\n/);
if (!parts0) throw new Error('Unexpected page head');
const gallery = site.slice(parts0[0].length)
  .replace('<!--__LINKS__-->', `<a class="ver" href="${REPO}" target="_blank" rel="noopener">GitHub ↗</a>`)
  .replace('<!--__AI_STEP__-->', `<li>AI에게 맡길 때는 카드의 <b>링크</b>로 코드 주소를 복사해 “이 카드로 우리 데이터를 그려줘”처럼 함께 넘깁니다. 전체 카드 목록과 규칙은 <a href="llms.txt">llms.txt</a>에 있습니다.</li>`)
  .replace('<!--__FOOT__-->', ` 카드 코드는 <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>, 글꼴은 <a href="OFL.txt">SIL Open Font License</a>를 따릅니다.`);
writeFileSync(join(docs, 'index.html'), `${head({ title: 'Vizney Blocks · 복사해 쓰는 대시보드 카드', desc, path: '/', icon: 'favicon.svg', css: parts0[1] + '\n', extra: `<script>window.VZB_SITE = '${SITE}';</script>\n` })}
<body>
${gallery}</body>
</html>
`);

// One page per card (the snippet on a plain background) and the same snippet as plain text for AI tools.
const cardCss = `<style>body{margin:0;background:#eef0f4;font:14px/1.6 'Spoqa Han Sans Neo','Noto Sans KR',sans-serif;color:#4a4a4a}main{box-sizing:border-box;max-width:var(--w,640px);margin:0 auto;padding:40px 16px 24px}p{margin:16px 2px 0;font-size:13px}a{color:#1b1b1b}</style>\n`;
for (const cat of built) {
  for (const v of cat.variants) {
    const w = cat.id === 'kpi' ? 420 : 640;
    writeFileSync(join(docs, 'cards', `${v.id}.txt`), v.code);
    writeFileSync(join(docs, 'cards', `${v.id}.html`), `${head({ title: `${v.name} · Vizney Blocks`, desc: `${cat.name} · ${v.name}. ${plain(v.when)}`, path: `/cards/${v.id}.html`, icon: '../favicon.svg', css: cardCss })}
<body>
<main style="--w:${w}px">
${v.code}
<p><a href="../#sec-${cat.id}">Vizney Blocks 갤러리</a> · <a href="${v.id}.txt">코드(텍스트)</a> · ${NOTICE}</p>
</main>
</body>
</html>
`);
  }
}

// llms.txt: what the cards are, how to use them, and every card with its plain-text code address.
let llms = `# Vizney Blocks

> 복사해 붙여 쓰는 HTML 대시보드 카드 ${variants.length}종(${VERSION}). 카드 하나는 <style>, 데이터 JSON, <script>를 한데 묶은 HTML 조각이며, <body> 안에 붙여 넣으면 그려진다. 데이터는 카드 안 <script type="application/json">의 값만 바꾼다. ${NOTICE}.

쓰는 법:
- 아래 링크(.txt)의 카드 코드를 그대로 붙여 넣고 JSON 값만 바꾼다. 스타일과 스크립트는 고치지 않는다. 같은 카드를 여러 장 쓸 때는 카드 코드를 통째로 다시 붙여 넣고 각 JSON만 바꾼다.
- 카드는 놓인 자리의 폭을 채우고, 높이는 1 · 1.5 · 2단위(1단위 168px, --vzb-unit) 중 하나다. 여러 장은 감싸는 요소에 격자를 준다: display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px
- 색과 글꼴은 :root의 --vzb-* 변수(--vzb-primary, --vzb-font 등)로 바꾼다.
- 공통 필드: title(지표명), subtitle(기간 부제), format(eok 억 단위 · krw 원 단위 · count 개수와 unit · pct 비율 · days 일수), better(up · down · neutral, 증감 색), compare({ label, value }), labels(기간 이름), series([{ name, values }]), rows(표의 줄).
- 증감, 비중, 달성률, 합계는 카드가 계산하므로 JSON에 적지 않는다.
- 갤러리: ${SITE}/ · 소스: ${REPO}
`;
for (const cat of built) {
  llms += `\n## ${cat.name}\n\n${plain(cat.intro)}\n\n`;
  for (const v of cat.variants) llms += `- [${v.name}](${SITE}/cards/${v.id}.txt): ${plain(v.when)} 규칙: ${v.rules.map(plain).join(' ')}\n`;
}
writeFileSync(join(docs, 'llms.txt'), llms);

// Domain, Jekyll off, icon, font license.
writeFileSync(join(docs, 'CNAME'), 'blocks.vizney.com\n');
writeFileSync(join(docs, '.nojekyll'), '');
writeFileSync(join(docs, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="13" height="13" rx="3" fill="#1b1b1b"/><rect x="17" y="2" width="13" height="13" rx="3" fill="#ff9500"/><rect x="2" y="17" width="13" height="13" rx="3" fill="#ffcc00"/><rect x="17" y="17" width="13" height="13" rx="3" fill="#ff2d55"/></svg>\n');
copyFileSync(join(root, 'tools/OFL.txt'), join(docs, 'OFL.txt'));
if (existsSync(join(root, 'tools/og.png'))) copyFileSync(join(root, 'tools/og.png'), join(docs, 'og.png'));
console.log(`docs/: index.html, ${variants.length} card pages and .txt files, llms.txt (${(llms.length / 1024).toFixed(0)} KB)`);
