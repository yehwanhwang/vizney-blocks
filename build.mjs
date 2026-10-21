// Builds Vizney Blocks: one self-contained snippet per card, the public site in docs/ (GitHub Pages at blocks.vizney.com:
// home, a page per chart type, a page and a plain-text copy per card, llms.txt for AI tools), and the one-page gallery
// in dist/ that is published as an artifact. Both embed a renamed subset of Spoqa Han Sans Neo (VZ Sans).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const r = (p) => readFileSync(join(root, p), 'utf8');
const FONT_DIR = process.env.SPOQA_DIR;
const VERSION = 'v0.21';
const SITE = 'https://blocks.vizney.com';
const REPO = 'https://github.com/yehwanhwang/vizney-blocks';
const GUIDE = 'https://kr.vizney.com/chart-guide/';
const NOTICE = '© 2026 Vizney · MIT License';
const FONT_LINK = '<link rel="stylesheet" href="https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css">';

// ---------- Snippets ----------
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

const built = cats.map((cat) => ({ ...cat, variants: cat.variants.map((v) => ({ ...v, cat: cat.id, code: snippet(v, cat) })) }));
const variants = built.flatMap((cat) => cat.variants);
const byId = Object.fromEntries(variants.map((v) => [v.id, v]));
const catName = Object.fromEntries(built.map((c) => [c.id, c.name]));
const N = { cards: variants.length, cats: built.length };

// ---------- Page parts ----------
// Two modes share the markup: the site (a page per chart type) and the one-page gallery (every chart type on one page).
const SITE_M = { one: false, home: '/', cards: '/#cards', usage: '/#usage', cat: (id) => `/${id}/`, card: (v) => `/${v.cat}/#${v.id}`, file: (p) => `/${p}` };
const ONE_M = { one: true, home: '#top', cards: `#cat-${built[0].id}`, usage: '#usage', cat: (id) => `#cat-${id}`, card: (v) => `#${v.id}`, file: (p) => `${SITE}/${p}` };
const NEW = ['sankey', 'radar'];
const EXAMPLE = [{ id: 'kpi-line' }, { id: 'kpi-bar' }, { id: 'bar-ranking' }, { id: 'sankey-levels', wide: true }, { id: 'radar-basic' }];
const ART = JSON.parse(r('page/tiles.json'));
// Card heights in units of 168px: KPI - Number 1, KPI - Line and Bar 2, the other KPI cards 1.5, every chart card 2.
const TIER = { 'kpi-number': 1, 'kpi-gauge': 1.5, 'kpi-paired-bar': 1.5, 'kpi-stacked-bar': 1.5 };
const tierPx = (v) => Math.round((TIER[v.id] || 2) * 168);

const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/`/g, '');
// Backticks in the notes become <code>.
const rich = (s) => String(s).split('`').map((part, i) => (i % 2 ? `<code>${h(part)}</code>` : h(part))).join('');
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const ext = (href) => `href="${href}" target="_blank" rel="noopener"`;

const IC = {
  search: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
  out: '<svg class="ic" width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5h5.5V8M9.5 2.5L3 9"/></svg>',
  code: '<svg class="ic" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 4L2 7l3 3M9 4l3 3-3 3"/></svg>',
  copy: '<svg class="ic" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5"/><path d="M9.5 4.5V3A1 1 0 0 0 8.5 2H3A1 1 0 0 0 2 3v5.5a1 1 0 0 0 1 1h1.5"/></svg>',
  copyLg: '<svg class="ic" width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5"/><path d="M9.5 4.5V3A1 1 0 0 0 8.5 2H3A1 1 0 0 0 2 3v5.5a1 1 0 0 0 1 1h1.5"/></svg>',
  link: '<svg class="ic" width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M6 8a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 8 2.5l-.5.5M8 6a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 6 11.5l.5-.5"/></svg>',
  down: '<svg class="ic" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5l3-3"/></svg>',
};

const header = (m, current) => `<header class="top" id="top">
<div class="wrap top-in">
<a class="logo" href="${m.home}"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Vizney Blocks</a>
<nav class="top-nav" aria-label="주 메뉴"><a href="${m.cards}"${current ? ' aria-current="page"' : ''}>카드</a><a href="${m.usage}">쓰는 법</a><a ${ext(GUIDE)}>차트 가이드 ↗</a></nav>
<div class="top-end">
<div class="search">${IC.search}<label class="sr" for="q">카드 찾기</label><input id="q" type="search" placeholder="카드 찾기" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="q-pop"><kbd aria-hidden="true">⌘K</kbd><ul class="search-pop" id="q-pop" role="listbox" aria-label="찾은 카드" hidden></ul></div>
<a class="btn is-git" ${ext(REPO)}>GitHub${IC.out}</a>
</div>
</div>
</header>`;

const footer = (m) => `<footer class="foot">
<div class="wrap foot-in">
<span>Vizney Blocks ${VERSION} · ${NOTICE}</span>
<span>글꼴 VZ Sans(Spoqa Han Sans Neo 부분 글꼴) · <a href="${m.file('OFL.txt')}">SIL Open Font License</a></span>
<nav aria-label="바닥글"><a ${ext(REPO)}>GitHub</a><a href="${m.file('llms.txt')}">llms.txt</a><a ${ext(GUIDE)}>Vizney 차트 가이드</a></nav>
</div>
</footer>`;

const dialog = `<dialog class="dlg" id="dlg" aria-labelledby="dlg-title" aria-describedby="dlg-sub">
<div class="dlg-hd">
<div><h2 id="dlg-title"></h2><p id="dlg-sub"></p></div>
<div class="acts"><button type="button" class="btn is-primary" data-act="dlg-copy">${IC.copy}복사</button><button type="button" class="btn" data-act="dlg-link">${IC.link}AI용 링크</button><button type="button" class="btn" data-act="dlg-close">닫기</button></div>
</div>
<pre class="code" id="dlg-code" tabindex="0"></pre>
</dialog>
<p class="sr" id="say" aria-live="polite"></p>`;

const skip = '<a class="skip" href="#main">본문으로 건너뛰기</a>';

// Home
const hero = () => `<section class="wrap hero" aria-labelledby="hero-title">
<p class="eyebrow">카드 ${N.cards}종 · 차트 ${N.cats}가지 · MIT 라이선스</p>
<h1 id="hero-title">분석가의 판단을 담은<br>대시보드 카드</h1>
<p class="lede">카드를 복사해 HTML에 붙여 넣고 JSON만 바꾸세요. 증감, 비중, 달성률은 카드가 계산하고, 색과 강조는 Vizney 차트 가이드의 규칙을 따릅니다.</p>
<div class="cta"><a class="btn is-primary is-lg" href="#cards">카드 둘러보기</a><a class="btn is-lg" ${ext(REPO)}>GitHub에서 보기</a></div>
<p class="hint">AI에게 맡길 때는 카드 링크나 <a href="/llms.txt">llms.txt</a>를 함께 주세요.</p>
</section>`;

const showcase = () => `<section class="wrap show-wrap" aria-label="카드로 만든 대시보드 예시">
<div class="show">
<div class="show-hd"><div><p class="show-title">영업 현황</p><p class="show-sub">카드 ${EXAMPLE.length}장을 격자에 붙여 넣어 만든 대시보드</p></div><button type="button" class="btn" data-act="example">${IC.code}이 예시의 코드 보기</button></div>
<div class="show-grid">
${EXAMPLE.map((x) => `<div${x.wide ? ' class="is-wide"' : ''} data-mount="${x.id}" style="min-height:${tierPx(byId[x.id])}px"></div>`).join('\n')}
</div>
</div>
</section>`;

const tiles = () => `<section class="wrap sec" id="cards" aria-labelledby="cards-title">
<div class="sec-hd"><div><h2 id="cards-title">차트 ${N.cats}가지, 카드 ${N.cards}종</h2><p>Vizney 차트 가이드의 차트 이름으로 묶었습니다. 차트를 고르면 그 차트의 카드가 모두 나옵니다.</p></div></div>
<div class="tiles">
${built.map((c) => `<a class="tile" href="/${c.id}/"><span class="tile-art">${ART[c.id]}</span><span class="tile-name"><b>${h(c.name)}</b><em>${c.variants.length}</em>${NEW.includes(c.id) ? '<span class="new">New</span>' : ''}</span></a>`).join('\n')}
</div>
</section>`;

const usage = (m) => `<section class="${m.one ? '' : 'wrap '}sec" id="usage" aria-labelledby="usage-title">
<div class="sec-hd"><div><h2 id="usage-title">쓰는 법</h2><p>설치할 것은 없습니다. 카드 하나가 스타일, 데이터, 스크립트를 모두 담은 HTML 조각입니다.</p></div></div>
<ol class="steps">
<li class="step"><span class="num" aria-hidden="true">1</span><h3>복사해서 붙이기</h3><p>카드의 <b>복사</b>를 눌러 HTML의 &lt;body&gt; 안 원하는 자리에 붙여 넣습니다.</p><pre class="snip">&lt;div class="vzb-card"
     data-vzb="bar-basic"&gt;
  …
&lt;/div&gt;</pre></li>
<li class="step"><span class="num" aria-hidden="true">2</span><h3>JSON만 바꾸기</h3><p>카드 안 JSON의 값만 바꿉니다. 증감, 비중, 달성률은 카드가 계산합니다.</p><pre class="snip">"title": "분기별 출고 금액",
"format": "eok",
"labels": ["1Q26", "2Q26", "3Q26"],
"values": [2561, 2654, 2750]</pre></li>
<li class="step"><span class="num" aria-hidden="true">3</span><h3>변수로 맞추기</h3><p>색과 글꼴은 :root의 변수로 바꿉니다. 모든 카드에 한 번에 적용됩니다.</p><pre class="snip">:root {
  --vzb-primary: #0f766e;
  --vzb-font: 'Pretendard';
}</pre></li>
<li class="step"><span class="num" aria-hidden="true">4</span><h3>AI에게 맡기기</h3><p>카드의 <b>AI용 링크</b>를 주고 데이터를 설명하면 AI가 카드를 채웁니다.</p><pre class="snip">blocks.vizney.com/cards/
  bar-basic.txt
이 카드로 지점별 월 매출을
그려줘</pre></li>
</ol>
<details class="fields">
<summary>공통 필드와 여러 장 배치${IC.down}</summary>
<div class="fields-in">
<dl>
<dt><code>title</code></dt><dd>지표명</dd>
<dt><code>subtitle</code></dt><dd>기간 부제. 무엇을 언제 기준으로 보는지 적습니다.</dd>
<dt><code>value</code></dt><dd>KPI 카드의 대표 수치. KPI - Line과 KPI - Bar는 생략하면 마지막 값을 씁니다.</dd>
<dt><code>format</code></dt><dd><code>eok</code> 억 단위 값, <code>krw</code> 원 단위 값을 만·억·조로, <code>count</code> 개수(<code>unit</code>에 단위), <code>pct</code> 비율(증감은 %p), <code>days</code> 일수</dd>
<dt><code>better</code></dt><dd><code>up</code>, <code>down</code>, <code>neutral</code>. 증감을 초록과 빨강 중 무엇으로 칠할지 정합니다.</dd>
<dt><code>compare</code></dt><dd><code>{ "label", "value" }</code>. KPI 카드에서 증감을 계산할 비교 기준입니다.</dd>
<dt><code>labels</code></dt><dd>기간 이름. <code>values</code>와 같은 길이로 적고, 값이 없는 기간은 <code>null</code>로 둡니다.</dd>
<dt><code>series</code></dt><dd><code>[{ "name", "values" }]</code>. 선이나 막대를 여러 묶음 그릴 때 씁니다.</dd>
<dt><code>rows</code></dt><dd>표와 목록의 줄. 줄마다 <code>name</code>과 값을 적습니다. 합계 줄과 비중, 증감률, 달성률은 카드가 계산합니다.</dd>
<dt><code>curve</code></dt><dd>선 모양. <code>smooth</code>(기본) 곡선, <code>linear</code> 직선, <code>step</code> 계단. 라인 카드와 KPI - Line에서 씁니다.</dd>
</dl>
<div>
<h3>여러 장을 한 줄에</h3>
<p>카드는 배치를 맡지 않습니다. 감싸는 요소에 격자를 주면 폭에 맞춰 줄이 바뀌고, 높이는 1 · 1.5 · 2단위(1단위 168px) 중 하나라 섞어 놓아도 맞습니다.</p>
<pre class="snip">&lt;div style="display:grid;
  grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));
  gap:16px;"&gt;
  &lt;!-- 카드 여러 장 --&gt;
&lt;/div&gt;</pre>
</div>
</div>
</details>
</section>`;

// One-page gallery: a short introduction before the chart types.
const intro = () => `<section class="intro" aria-labelledby="intro-title">
<p class="eyebrow">카드 ${N.cards}종 · 차트 ${N.cats}가지 · MIT 라이선스</p>
<h1 id="intro-title">분석가의 판단을 담은 대시보드 카드</h1>
<p class="cat-lede">카드를 복사해 HTML에 붙여 넣고 JSON만 바꾸세요. 증감, 비중, 달성률은 카드가 계산하고, 색과 강조는 Vizney 차트 가이드의 규칙을 따릅니다.</p>
<div class="cat-links"><a class="pill" ${ext(`${SITE}/`)}>blocks.vizney.com${IC.out}</a><a class="pill" ${ext(`${SITE}/llms.txt`)}>AI용 목록 llms.txt${IC.out}</a></div>
</section>`;

// Category pages
const sidebar = (m, current) => `<nav class="side" aria-label="차트 종류">
<p class="side-hd">차트 종류</p>
${built.map((c) => `<a href="${m.cat(c.id)}"${m.one ? ` data-cat="${c.id}"` : ''}${c.id === current ? ' aria-current="page"' : ''}><span>${h(c.name)}</span>${NEW.includes(c.id) ? '<span class="new">New</span>' : ''}<em>${c.variants.length}</em></a>`).join('\n')}
<hr>
<a class="side-link" href="${m.usage}">쓰는 법</a>
<a class="side-link" href="${m.file('llms.txt')}">AI용 목록 llms.txt</a>
<a class="side-link" ${ext(REPO)}>GitHub ↗</a>
</nav>`;

const optBar = (o) => `<div class="opt" role="group" aria-label="${h(o.label)}" data-opt="${o.field}"><span>${h(o.label)}</span>${o.choices.map((ch, k) => `<button type="button" data-val="${k ? ch.value : ''}" aria-pressed="${!k}">${h(ch.label)}</button>`).join('')}</div>`;

const item = (v, c, tag) => {
  // Only the cards that draw curves follow the line-shape option.
  const fixed = c.option && c.option.field === 'curve' && !v.uses.includes('curve');
  return `<article class="item" id="${v.id}" aria-labelledby="t-${v.id}">
<div class="item-hd"><${tag} id="t-${v.id}">${h(v.name)}</${tag}><code>${v.id}</code><div class="acts">
<button type="button" class="btn is-sm" data-act="code" data-id="${v.id}" aria-label="${h(v.name)} 코드 보기">${IC.code}코드</button>
<div class="copy"><button type="button" class="btn is-sm is-primary" data-act="copy" data-id="${v.id}" aria-haspopup="menu" aria-expanded="false" aria-label="${h(v.name)} 복사">${IC.copy}복사${IC.down}</button><div class="menu" role="menu" aria-label="${h(v.name)} 복사" hidden>
<button type="button" role="menuitem" data-act="copy-code" data-id="${v.id}">${IC.copyLg}<span><b>카드 코드 복사</b><small>HTML에 붙여 넣습니다</small></span></button>
<button type="button" role="menuitem" data-act="copy-link" data-id="${v.id}">${IC.link}<span><b>AI용 링크 복사</b><small>${v.id}.txt 주소를 AI에 줍니다</small></span></button>
</div></div>
</div></div>
<div class="item-preview" data-mount="${v.id}"${fixed ? ' data-fixed' : ''} style="min-height:${tierPx(v)}px"></div>
<p class="item-when">${rich(v.when)}</p>
${v.guide ? `<a class="item-guide" ${ext(v.guide.url)}>차트 가이드 · ${h(v.guide.name)} ↗</a>\n` : ''}<details class="rules"><summary>들어 있는 판단 ${v.rules.length}${IC.down}</summary><ul>${v.rules.map((x) => `<li>${rich(x)}</li>`).join('')}</ul></details>
</article>`;
};

const catSection = (c, m) => {
  // Heading levels: the site page owns its h1; the one-page gallery sits under the introduction's h1.
  const H = m.one ? ['h2', 'h3', 'h4'] : ['h1', 'h2', 'h3'];
  let body;
  if (c.groups) {
    body = c.groups.map((g) => {
      const vs = c.variants.filter((v) => v.group === g.id);
      return `<div class="grp"><${H[1]}>${h(g.name)}</${H[1]}><span>${h(g.note)} · ${vs.length}장</span></div>
<div class="items">
${vs.map((v) => item(v, c, H[2])).join('\n')}
</div>`;
    }).join('\n');
  } else {
    body = `<div class="items">
${c.variants.map((v) => item(v, c, H[1])).join('\n')}
</div>`;
  }
  const links = [c.guide && `<a class="pill" ${ext(c.guide.url)}>차트 가이드 · ${h(c.guide.name)}${IC.out}</a>`, c.option && optBar(c.option)].filter(Boolean);
  return `<section class="cat" id="cat-${c.id}" aria-labelledby="h-${c.id}">
${m.one ? '' : `<nav class="crumb" aria-label="현재 위치"><a href="/#cards">카드</a><i aria-hidden="true">/</i><span>${h(c.name)}</span></nav>\n`}<div class="cat-title"><${H[0]} id="h-${c.id}">${h(c.name)}</${H[0]}><span class="chip">카드 ${c.variants.length}장</span><span class="chip">높이 ${h(c.height)}</span></div>
<p class="cat-lede">${rich(c.lede)}</p>
${links.length ? `<div class="cat-links">${links.join('')}</div>\n` : ''}${body}
</section>`;
};

const pager = (i) => {
  const prev = built[i - 1], next = built[i + 1];
  return `<nav class="pager" aria-label="이전과 다음 차트">${prev ? `<a class="is-prev" href="/${prev.id}/" rel="prev"><span>이전</span><b>← ${h(prev.name)}</b></a>` : '<span></span>'}${next ? `<a class="is-next" href="/${next.id}/" rel="next"><span>다음</span><b>${h(next.name)} →</b></a>` : '<span></span>'}</nav>`;
};

// Page data for site.js: the search index, and the code of the cards this page shows.
const data = (m, page, ids) => `<script>window.VZB = ${esc({
  mode: m.one ? 'one' : 'site',
  page,
  site: SITE,
  cats: built.map((c) => ({ id: c.id, name: c.name })),
  index: variants.map((v) => ({ id: v.id, name: v.name, cat: v.cat, catName: catName[v.cat], when: plain(v.when), url: m.card(v) })),
  example: page === 'home' ? EXAMPLE : [],
  code: Object.fromEntries(ids.map((id) => [id, byId[id].code])),
})};</script>`;

// ---------- Site pages (docs/) ----------
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const head = ({ title, desc, path, extra = '' }) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${SITE}${path}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vizney Blocks">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
${extra}</head>`;
// Asset versions are filled in once the font is built (the font depends on every character the pages use).
const assets = '<link rel="preload" href="/assets/fonts/vz-sans-400.woff?v=__FONT_V__" as="font" type="font/woff" crossorigin>\n<link rel="stylesheet" href="/assets/site.css?v=__CSS_V__">\n';
const sitePage = ({ title, desc, path, body, page, ids, current, robots }) => `${head({ title, desc, path, extra: (robots ? `<meta name="robots" content="${robots}">\n` : '') + assets })}
<body>
${skip}
${header(SITE_M, current)}
${body}
${footer(SITE_M)}
${dialog}
${data(SITE_M, page, ids)}
<script src="/assets/site.js?v=__JS_V__"></script>
</body>
</html>
`;

const pages = {};
const homeDesc = `복사해 붙여 쓰는 HTML 대시보드 카드 ${N.cards}종. KPI, 막대, 라인, 그리드, 도넛, 스캐터, 생키, 레이더 등 차트 ${N.cats}가지를 Vizney 차트 가이드의 판단 규칙으로 만들었습니다. MIT License.`;
pages['index.html'] = sitePage({
  title: 'Vizney Blocks · 복사해 쓰는 대시보드 카드',
  desc: homeDesc,
  path: '/',
  page: 'home',
  ids: EXAMPLE.map((x) => x.id),
  body: `<main id="main">
${hero()}
${showcase()}
${tiles()}
${usage(SITE_M)}
</main>`,
});
built.forEach((c, i) => {
  pages[`${c.id}/index.html`] = sitePage({
    title: `${c.name} · Vizney Blocks`,
    desc: `${plain(c.lede)} 복사해 붙여 쓰는 HTML 카드 ${c.variants.length}종.`,
    path: `/${c.id}/`,
    page: 'cat',
    current: true,
    ids: c.variants.map((v) => v.id),
    body: `<div class="wrap doc">
${sidebar(SITE_M, c.id)}
<main class="main" id="main">
${catSection(c, SITE_M)}
${pager(i)}
</main>
</div>`,
  });
});
pages['404.html'] = sitePage({
  title: '페이지를 찾을 수 없습니다 · Vizney Blocks',
  desc: homeDesc,
  path: '/404.html',
  robots: 'noindex',
  page: 'none',
  ids: [],
  body: `<main id="main" class="wrap hero lost">
<p class="eyebrow">404</p>
<h1>페이지를 찾을 수 없습니다</h1>
<p class="lede">주소가 바뀌었거나 없는 페이지입니다. 위의 카드 찾기로 카드 이름을 찾거나 첫 화면에서 차트를 고르세요.</p>
<div class="cta"><a class="btn is-primary is-lg" href="/">첫 화면으로</a><a class="btn is-lg" href="/#cards">차트 고르기</a></div>
</main>`,
});

// ---------- One-page gallery (dist/, published as an artifact) ----------
const siteCss = r('page/site.css').trim();
const siteJs = r('page/site.js').trim();
const onePage = (fontCss) => `<title>Vizney Blocks</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${fontCss}
${siteCss}
</style>
${skip}
${header(ONE_M, false)}
<div class="wrap doc is-one">
${sidebar(ONE_M, null)}
<main class="main" id="main">
${intro()}
${built.map((c) => catSection(c, ONE_M)).join('\n')}
${usage(ONE_M)}
</main>
</div>
${footer(ONE_M)}
${dialog}
${data(ONE_M, 'one', variants.map((v) => v.id))}
<script>
${siteJs}
</script>
`;

// ---------- Font: every character a page or a card can render, plus digits and number signs ----------
mkdirSync(join(root, 'build'), { recursive: true });
const chars = new Set([...Object.values(pages), onePage(''), siteJs].join('').replace(/\\u003c/g, '<'));
for (const c of '0123456789.,+-−–%()[]/:·×…→←↑↓↗ ') chars.add(c);
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
writeFileSync(join(root, 'build/chars.txt'), [...chars].filter((c) => c >= ' ').join(''));
if (!FONT_DIR) throw new Error('Set SPOQA_DIR to the folder holding SpoqaHanSansNeo-{Regular,Medium,Bold}.ttf');
console.log(execFileSync('python3', ['-I', join(root, 'tools/font.py'), FONT_DIR, join(root, 'build/chars.txt'), join(root, 'build')]).toString().trim());
const W = [400, 500, 700];
const woff = Object.fromEntries(W.map((w) => [w, readFileSync(join(root, `build/vz-sans-${w}.woff`))]));
const face = (src) => W.map((w) => `@font-face{font-family:'VZ Sans';font-style:normal;font-weight:${w};font-display:swap;src:${src(w)} format('woff');}`).join('\n');
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);

// ---------- dist/: the artifact page and local test pages ----------
const skeleton = (body) => `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n${body}</body></html>`;
const one = onePage(face((w) => `url(data:font/woff;base64,${woff[w].toString('base64')})`));
mkdirSync(join(root, 'dist/snippets'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), one);
writeFileSync(join(root, 'dist/preview.html'), skeleton(one));
writeFileSync(join(root, 'dist/snippets/all.html'), skeleton(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding:24px;background:#f6f7fb">\n${variants.map((v) => v.code).join('\n')}</div>\n`));
console.log(`dist/index.html: ${(one.length / 1024).toFixed(0)} KB, ${variants.length} variants in ${built.length} categories`);

// ---------- docs/: the public site ----------
const docs = join(root, 'docs');
rmSync(docs, { recursive: true, force: true });
mkdirSync(join(docs, 'cards'), { recursive: true });
mkdirSync(join(docs, 'assets/fonts'), { recursive: true });
const fontV = hash(Buffer.concat(W.map((w) => woff[w])));
for (const w of W) writeFileSync(join(docs, `assets/fonts/vz-sans-${w}.woff`), woff[w]);
const cssOut = `${face((w) => `url(fonts/vz-sans-${w}.woff?v=${fontV})`)}\n${siteCss}\n`;
writeFileSync(join(docs, 'assets/site.css'), cssOut);
writeFileSync(join(docs, 'assets/site.js'), `${siteJs}\n`);
const V = { __FONT_V__: fontV, __CSS_V__: hash(cssOut), __JS_V__: hash(siteJs) };
for (const [path, html] of Object.entries(pages)) {
  mkdirSync(dirname(join(docs, path)), { recursive: true });
  writeFileSync(join(docs, path), html.replace(/__(FONT|CSS|JS)_V__/g, (k) => V[k]));
}

// One page per card (the snippet on a plain background, for embedding) and the same snippet as plain text for AI tools.
const cardCss = `<style>body{margin:0;background:#eef0f4;font:14px/1.6 'Spoqa Han Sans Neo','Noto Sans KR',sans-serif;color:#4a4a4a}main{box-sizing:border-box;max-width:var(--w,640px);margin:0 auto;padding:40px 16px 24px}p{margin:16px 2px 0;font-size:13px}a{color:#1b1b1b}</style>\n`;
for (const c of built) {
  for (const v of c.variants) {
    const w = c.id === 'kpi' ? 420 : 640;
    writeFileSync(join(docs, 'cards', `${v.id}.txt`), v.code);
    writeFileSync(join(docs, 'cards', `${v.id}.html`), `${head({ title: `${v.name} · Vizney Blocks`, desc: `${c.name} · ${v.name}. ${plain(v.when)}`, path: `/cards/${v.id}.html`, extra: cardCss })}
<body>
<main style="--w:${w}px">
${v.code}
<p><a href="/${c.id}/#${v.id}">Vizney Blocks · ${h(c.name)}</a> · <a href="${v.id}.txt">코드(텍스트)</a> · ${NOTICE}</p>
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
for (const c of built) {
  llms += `\n## ${c.name}\n\n${SITE}/${c.id}/ · ${plain(c.intro)}\n\n`;
  for (const v of c.variants) llms += `- [${v.name}](${SITE}/cards/${v.id}.txt): ${plain(v.when)} 규칙: ${v.rules.map(plain).join(' ')}\n`;
}
writeFileSync(join(docs, 'llms.txt'), llms);

// Domain, Jekyll off, icon, font license, share image, sitemap.
writeFileSync(join(docs, 'CNAME'), 'blocks.vizney.com\n');
writeFileSync(join(docs, '.nojekyll'), '');
writeFileSync(join(docs, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="13" height="13" rx="3" fill="#1b1b1b"/><rect x="17" y="2" width="13" height="13" rx="3" fill="#ff9500"/><rect x="2" y="17" width="13" height="13" rx="3" fill="#ffcc00"/><rect x="17" y="17" width="13" height="13" rx="3" fill="#ff2d55"/></svg>\n');
copyFileSync(join(root, 'tools/OFL.txt'), join(docs, 'OFL.txt'));
if (existsSync(join(root, 'tools/og.png'))) copyFileSync(join(root, 'tools/og.png'), join(docs, 'og.png'));
writeFileSync(join(docs, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', ...built.map((c) => `/${c.id}/`)].map((p) => `<url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const kb = (p) => `${(readFileSync(join(docs, p)).length / 1024).toFixed(0)} KB`;
console.log(`docs/: home ${kb('index.html')}, ${built.length} chart pages (bar ${kb('bar/index.html')}), ${variants.length} card pages and .txt files, llms.txt ${kb('llms.txt')}, fonts ${W.map((w) => `${(woff[w].length / 1024).toFixed(0)}`).join('/')} KB`);
