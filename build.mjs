// Builds Vizney Blocks: one self-contained snippet per card, the public site in docs/ (GitHub Pages at blocks.vizney.com:
// home, a page per chart type, a page and a plain-text copy per card, llms.txt for AI tools, and the same in English under /en/),
// the skill for coding agents in skills/vizney-blocks/ (installed with `npx skills add yehwanhwang/vizney-blocks`), and the
// one-page gallery in dist/ that is published as an artifact. The site and the gallery embed a renamed subset of Spoqa Han Sans Neo (VZ Sans).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { guard } from './guard.mjs';

const root = new URL('.', import.meta.url).pathname;
const r = (p) => readFileSync(join(root, p), 'utf8');
const FONT_DIR = process.env.SPOQA_DIR;
const VERSION = 'v0.29';
const SITE = 'https://blocks.vizney.com';
const REPO = 'https://github.com/yehwanhwang/vizney-blocks';
const GUIDE = { ko: 'https://kr.vizney.com/chart-guide/', en: 'https://www.vizney.com/chart-guide/' };
const NOTICE = '© 2026 Vizney · MIT License';
const FONT_LINK = '<link rel="stylesheet" href="https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css">';

// ---------- Snippets ----------
// Korean is the source (tokens.css, meta.json, purposes.json, <id>.json). English overlays tokens.en.css (same declarations,
// English notes), meta.en.json (category and card wording), purposes.en.json and <id>.en.json (example data with "lang": "en",
// which switches the words the card itself prints). The card code is one and the same in both languages.
const tokensBy = { ko: r('src/tokens.css').trim(), en: r('src/tokens.en.css').trim() };
const tokens = tokensBy.ko;
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
const EN = JSON.parse(r('src/variants/meta.en.json'));
const vp = (id, ext) => `src/variants/${id}.${ext}`;

const css = (v, lang = 'ko') => [tokensBy[lang], baseCss, ...v.uses.map((u) => partCss[u] || ''), existsSync(join(root, vp(v.id, 'css'))) ? r(vp(v.id, 'css')).trim() : '']
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

// Retired cards ("retired": { version, use, note } in meta.json) leave the gallery, llms.txt, the skill and the search,
// but keep their public addresses (/cards/<id>.html and .txt) with working code and a note naming the card to use instead.
const allVariants = cats.flatMap((cat) => cat.variants.map((v) => ({ ...v, cat: cat.id })));
const nameOf = Object.fromEntries(allVariants.map((v) => [v.id, v.name]));
for (const v of allVariants) if (v.retired && (!nameOf[v.retired.use] || allVariants.find((x) => x.id === v.retired.use).retired)) throw new Error(`meta.json: ${v.id} points to a missing or retired card`);
const retiredNote = (v) => `${v.retired.version}에 목록에서 내린 카드입니다. 대신 ${nameOf[v.retired.use]}(${SITE}/cards/${v.retired.use}.txt)를 쓰세요. ${v.retired.note}`;
const PASTE = {
  ko: '<body> 안 원하는 자리에 붙여 넣으면 그려집니다. 데이터는 아래 JSON만 바꾸세요.',
  en: 'Paste anywhere inside <body> and it draws itself. Change only the JSON below ("lang": "en" keeps the card\'s own words in English).',
};

// The English snippet of a card differs from the Korean one only in the header, the token notes and the example data.
function snippet(v, cat, lang = 'ko') {
  const base = lang === 'en' ? `${SITE}/en` : SITE;
  return `<!-- Vizney Blocks ${VERSION} · ${cat.name} · ${v.name} (${v.id})
     ${base}/cards/${v.id}.html · ${NOTICE}
${v.retired ? `     ${retiredNote(v)}\n` : ''}     ${PASTE[lang]} -->
${FONT_LINK}
<style>
${css(v, lang)}
</style>
${card(v.id, JSON.parse(r(vp(v.id, lang === 'en' ? 'en.json' : 'json'))))}
${tail(v)}`;
}

const builtAll = cats.map((cat) => ({ ...cat, variants: cat.variants.map((v) => ({ ...v, cat: cat.id, code: snippet(v, cat) })) }));
const retired = builtAll.flatMap((c) => c.variants.filter((v) => v.retired));
// English wording and snippets for the cards that are not retired (the English site never had the retired ones).
const enCat = (c) => ({ ...c, ...(EN.cats[c.id] || {}), groups: c.groups && c.groups.map((g) => ({ ...g, ...((EN.cats[c.id] || {}).groups || {})[g.id] })), option: c.option && { ...c.option, ...(EN.cats[c.id] || {}).option, choices: c.option.choices.map((ch, i) => ({ ...ch, label: ((EN.cats[c.id] || {}).option || {}).choices?.[i] || ch.label })) } });
const builtEnAll = cats.map((cat) => { const c = enCat(cat); return { ...c, variants: cat.variants.filter((v) => !v.retired && existsSync(join(root, vp(v.id, 'en.json')))).map((v) => ({ ...v, ...(EN.cards[v.id] || {}), cat: cat.id, code: snippet(v, c, 'en') })) }; });
const purposes = JSON.parse(r('src/variants/purposes.json'));
const purposesEn = JSON.parse(r('src/variants/purposes.en.json'));
// Guard (guard.mjs): self-containment, colors only from tokens, heights, scoping, accessibility hooks, example data,
// meta ↔ files, public addresses, card words through tx() and the English files. `node build.mjs --check` runs only this and needs no font.
const TIER = { 'kpi-number': 1, 'kpi-gauge': 1.5, 'kpi-paired-bar': 1.5, 'kpi-stacked-bar': 1.5 };
const checked = guard({
  root, cats, parts, partCss, partJs, tokens, tier: TIER, fontLink: FONT_LINK, en: EN, purposes, purposesEn,
  snippets: Object.fromEntries(builtAll.flatMap((c) => c.variants.map((v) => [v.id, v.code]))),
  snippetsEn: Object.fromEntries(builtEnAll.flatMap((c) => c.variants.map((v) => [v.id, v.code]))),
});
console.log(`guard: ${checked} cards pass`);
const stripNotes = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
if (stripNotes(tokensBy.ko) !== stripNotes(tokensBy.en)) throw new Error('src/tokens.en.css: the declarations must match src/tokens.css (only the notes differ)');
if (process.argv.includes('--check')) process.exit(0);
const built = builtAll.map((c) => ({ ...c, variants: c.variants.filter((v) => !v.retired) })).filter((c) => c.variants.length);
const builtEn = builtEnAll.filter((c) => c.variants.length);
const variants = built.flatMap((cat) => cat.variants);
const byId = Object.fromEntries(variants.map((v) => [v.id, v]));
const N = { cards: variants.length, cats: built.length };

// Purpose index: the question a screen answers, its base card (the first pick), and the other cards with the condition
// that calls for each. People and AI tools pick cards here first; a card outside the index is for cases it does not cover.
for (const p of purposes) {
  if (!p.picks.length) throw new Error(`purposes.json: ${p.name} has no cards`);
  for (const k of p.picks) if (!byId[k.id]) throw new Error(`purposes.json: no card ${k.id} (${p.name})`);
}
const picked = new Set(purposes.flatMap((p) => p.picks.map((k) => k.id)));
const unpicked = variants.filter((v) => !picked.has(v.id)).map((v) => v.id);
const SKILL_CMD = 'npx skills add yehwanhwang/vizney-blocks';

// ---------- Languages ----------
// Everything a page says, in both languages. A locale (L) carries its cards, purpose index, addresses and strings, and every
// page part takes one. The Korean site is at /, the English site at /en/; tokens.css, OFL.txt and the fonts are shared.
const WORDS = {
  ko: {
    html: 'ko', og: 'ko_KR', other: { lang: 'en', label: 'English' },
    skip: '본문으로 건너뛰기', menu: '주 메뉴', cards: '카드', usage: '쓰는 법', guide: '차트 가이드', find: '카드 찾기', found: '찾은 카드',
    footFont: '글꼴 VZ Sans(Spoqa Han Sans Neo 부분 글꼴)', footNav: '바닥글', footGuide: 'Vizney 차트 가이드',
    copy: '복사', aiLink: 'AI용 링크', close: '닫기', code: '코드', viewCode: '코드 보기', copyCode: '카드 코드 복사', copyCodeNote: 'HTML에 붙여 넣습니다', copyLink: 'AI용 링크 복사', copyLinkNote: (id) => `${id}.txt 주소를 AI에 줍니다`,
    eyebrow: `카드 ${N.cards}종 · 차트 ${N.cats}가지 · MIT 라이선스`, h1: '분석가의 판단을 담은<br>대시보드 카드', h1one: '분석가의 판단을 담은 대시보드 카드',
    lede: '카드를 복사해 HTML에 붙여 넣고 JSON만 바꾸세요. 증감, 비중, 달성률은 카드가 계산하고, 색과 강조는 Vizney 차트 가이드의 규칙을 따릅니다.',
    browse: '카드 둘러보기', onGithub: 'GitHub에서 보기', hint: (llms) => `AI에게 맡길 때는 카드 링크나 <a href="${llms}">llms.txt</a>를 주고, 코딩 에이전트에는 <a href="#usage">스킬</a>을 설치하세요.`,
    showAria: '카드로 만든 대시보드 예시', showTitle: '영업 현황', showSub: (n) => `카드 ${n}장을 격자에 붙여 넣어 만든 대시보드`, showCode: '이 예시의 코드 보기',
    purposeTitle: '목적으로 고르기', purposeSub: '보여줄 것부터 정하세요. 목적마다 기본 카드를 먼저 쓰고, 다른 카드는 조건이 맞을 때만 고릅니다.', base: '기본',
    tilesTitle: '차트로 고르기', tilesSub: `차트 ${N.cats}가지, 카드 ${N.cards}종을 Vizney 차트 가이드의 차트 이름으로 묶었습니다. 차트를 고르면 그 차트의 카드가 모두 나옵니다.`,
    usageTitle: '쓰는 법', usageSub: '설치할 것은 없습니다. 카드 하나가 스타일, 데이터, 스크립트를 모두 담은 HTML 조각입니다.',
    step1: '복사해서 붙이기', step1p: '카드의 <b>복사</b>를 눌러 HTML의 &lt;body&gt; 안 원하는 자리에 붙여 넣습니다.',
    step2: 'JSON만 바꾸기', step2p: '카드 안 JSON의 값만 바꿉니다. 증감, 비중, 달성률은 카드가 계산합니다.', step2code: '"title": "분기별 출고 금액",\n"format": "eok",\n"labels": ["1Q26", "2Q26", "3Q26"],\n"values": [2561, 2654, 2750]',
    step3: '변수로 맞추기', step3p: (tokens) => `색과 글꼴은 :root의 변수로 바꿉니다. 모든 카드에 한 번에 적용됩니다. 변수 목록은 <a href="${tokens}">tokens.css</a>에 있습니다.`,
    step4: 'AI에게 맡기기', step4p: '채팅 AI에는 카드의 <b>AI용 링크</b>를 주고, 코딩 에이전트에는 스킬을 설치합니다.', step4code: (base) => `blocks.vizney.com${base}/cards/\n  bar-basic.txt\n이 카드로 지점별 월 매출을\n그려줘\n\nnpx skills add\n  yehwanhwang/vizney-blocks`,
    fields: '공통 필드와 여러 장 배치',
    fieldList: [
      ['title', '지표명'], ['subtitle', '기간 부제. 무엇을 언제 기준으로 보는지 적습니다.'], ['value', 'KPI 카드의 대표 수치. KPI - Line과 KPI - Bar는 생략하면 마지막 값을 씁니다.'],
      ['format', '<code>eok</code> 억 단위 값, <code>krw</code> 원 단위 값을 만·억·조로, <code>usd</code> 달러 값을 $745.6K·$1.2M처럼, <code>count</code> 개수(<code>unit</code>에 단위), <code>pct</code> 비율(증감은 %p), <code>days</code> 일수'],
      ['better', '<code>up</code>, <code>down</code>, <code>neutral</code>. 증감을 초록과 빨강 중 무엇으로 칠할지 정합니다.'], ['compare', '<code>{ "label", "value" }</code>. KPI 카드에서 증감을 계산할 비교 기준입니다.'],
      ['labels', '기간 이름. <code>values</code>와 같은 길이로 적고, 값이 없는 기간은 <code>null</code>로 둡니다.'], ['series', '<code>[{ "name", "values" }]</code>. 선이나 막대를 여러 묶음 그릴 때 씁니다.'],
      ['rows', '표와 목록의 줄. 줄마다 <code>name</code>과 값을 적습니다. 합계 줄과 비중, 증감률, 달성률은 카드가 계산합니다.'], ['curve', '선 모양. <code>smooth</code>(기본) 곡선, <code>linear</code> 직선, <code>step</code> 계단. 라인 카드와 KPI - Line에서 씁니다.'],
      ['lang', '<code>en</code>이면 카드 안의 합계 · 기타 · 달성 같은 문구가 영어가 됩니다. 비우면 한국어입니다.'],
    ],
    grid: '여러 장을 한 줄에', gridp: '카드는 배치를 맡지 않습니다. 감싸는 요소에 격자를 주면 폭에 맞춰 줄이 바뀝니다. 카드 폭은 340px 이상이 되게 두세요. 더 좁으면 표와 도넛의 글자가 잘립니다. 같은 줄의 카드는 가장 높은 카드에 맞춰 늘어나므로, 높이가 같은 카드끼리 한 줄에 두면 빈 곳이 없습니다.', gridNote: '카드 여러 장',
    aiList: 'AI용 목록 llms.txt', kinds: '차트 종류', crumb: '현재 위치', nCards: (n) => `카드 ${n}장`, height: (h) => `높이 ${h}`, nInGroup: (n) => `${n}장`, judgment: (n) => `들어 있는 판단 ${n}`,
    pagerAria: '이전과 다음 차트', prev: '이전', next: '다음', codeText: '코드(텍스트)',
    homeTitle: 'Vizney Blocks · 복사해 쓰는 대시보드 카드', catTitle: (name) => `${name} · Vizney Blocks`, catDesc: (lede, n) => `${lede} 복사해 붙여 쓰는 HTML 카드 ${n}종.`,
    homeDesc: `복사해 붙여 쓰는 HTML 대시보드 카드 ${N.cards}종. KPI, 막대, 라인, 그리드, 도넛, 스캐터, 생키, 레이더 등 차트 ${N.cats}가지를 Vizney 차트 가이드의 판단 규칙으로 만들었습니다. MIT License.`,
    // site.js
    js: { copied: '복사됨', linkCopied: '링크 복사됨', sub: '<b>주황 줄</b>의 데이터(JSON)만 바꾸면 됩니다. 나머지는 그대로 둡니다.', blocked: '복사가 막혀 있습니다. 코드를 선택해 두었으니 Ctrl+C(⌘+C)로 복사하세요.', none: '찾는 카드가 없습니다.', exampleTitle: '영업 현황 예시', exampleSub: (n) => `카드 ${n}장을 격자에 넣은 코드입니다. 각 카드의 <b>주황 줄</b>의 데이터(JSON)만 바꾸면 됩니다. 나머지는 그대로 둡니다.`, exampleComment: (n) => `<!-- Vizney Blocks 예시 · 영업 현황(카드 ${n}장)\n     ${SITE}/ · 각 카드의 JSON만 바꾸세요. -->` },
  },
  en: {
    html: 'en', og: 'en_US', other: { lang: 'ko', label: '한국어' },
    skip: 'Skip to content', menu: 'Main menu', cards: 'Cards', usage: 'How to use', guide: 'Chart guide', find: 'Find a card', found: 'Cards found',
    footFont: 'Font VZ Sans (a subset of Spoqa Han Sans Neo)', footNav: 'Footer', footGuide: 'Vizney chart guide',
    copy: 'Copy', aiLink: 'AI link', close: 'Close', code: 'Code', viewCode: 'view code', copyCode: 'Copy card code', copyCodeNote: 'Paste it into your HTML', copyLink: 'Copy AI link', copyLinkNote: (id) => `Give an AI the ${id}.txt address`,
    eyebrow: `${N.cards} cards · ${N.cats} chart types · MIT License`, h1: 'Dashboard cards<br>with an analyst’s judgment built in', h1one: 'Dashboard cards with an analyst’s judgment built in',
    lede: 'Copy a card into your HTML and change only its JSON. The card computes changes, shares and attainment, and its colors and emphasis follow the rules of the Vizney chart guide.',
    browse: 'Browse cards', onGithub: 'View on GitHub', hint: (llms) => `Working with an AI? Give it a card link or <a href="${llms}">llms.txt</a>, or install the <a href="#usage">skill</a> in a coding agent.`,
    showAria: 'Example dashboard made of cards', showTitle: 'Sales Overview', showSub: (n) => `A dashboard made by pasting ${n} cards into a grid`, showCode: 'View the code of this example',
    purposeTitle: 'Pick by purpose', purposeSub: 'Decide what to show first. Each purpose has a base card; pick another card only when its condition fits.', base: 'Base',
    tilesTitle: 'Pick by chart', tilesSub: `${N.cards} cards in ${N.cats} chart types, grouped by the chart names of the Vizney chart guide. Pick a chart to see all of its cards.`,
    usageTitle: 'How to use', usageSub: 'Nothing to install. One card is an HTML snippet that carries its own styles, data and script.',
    step1: 'Copy and paste', step1p: 'Press <b>Copy</b> on a card and paste it anywhere inside the &lt;body&gt; of your HTML.',
    step2: 'Change only the JSON', step2p: 'Edit the values in the card’s JSON. The card computes changes, shares and attainment.', step2code: '"title": "Orders by Quarter",\n"format": "count",\n"labels": ["1Q26", "2Q26", "3Q26"],\n"values": [2561, 2654, 2750]',
    step3: 'Tune with variables', step3p: (tokens) => `Set colors and the font with :root variables; they apply to every card at once. The list is in <a href="${tokens}">tokens.css</a>.`,
    step4: 'Hand it to an AI', step4p: 'Give a chat AI the card’s <b>AI link</b>; install the skill in a coding agent.', step4code: (base) => `blocks.vizney.com${base}/cards/\n  bar-basic.txt\nDraw our monthly sales by\nbranch with this card\n\nnpx skills add\n  yehwanhwang/vizney-blocks`,
    fields: 'Common fields and layout',
    fieldList: [
      ['title', 'Metric name'], ['subtitle', 'Period subtitle: what is measured, and as of when.'], ['value', 'The headline figure of a KPI card. KPI - Line and KPI - Bar use the last value when it is omitted.'],
      ['format', '<code>usd</code> dollar amounts, shortened to $745.6K · $1.2M; <code>count</code> a count (its unit in <code>unit</code>); <code>pct</code> a percentage (changes in pp); <code>days</code> a number of days; <code>eok</code> and <code>krw</code> are Korean won notations'],
      ['better', '<code>up</code>, <code>down</code>, <code>neutral</code>. Decides whether a change is colored green or red.'], ['compare', '<code>{ "label", "value" }</code>. The baseline a KPI card computes its change against.'],
      ['labels', 'Period names, the same length as <code>values</code>; use <code>null</code> for a period without a value.'], ['series', '<code>[{ "name", "values" }]</code>, for several lines or groups of bars.'],
      ['rows', 'Rows of a table or list, each with a <code>name</code> and its values. The card computes the total row, shares, change rates and attainment.'], ['curve', 'Line shape: <code>smooth</code> (default), <code>linear</code>, <code>step</code>. Used by the line cards and KPI - Line.'],
      ['lang', '<code>en</code> makes the words the card prints itself English (Total, Other, Met…). Omit it for Korean.'],
    ],
    grid: 'Several cards in a row', gridp: 'Cards do not lay themselves out. Give the wrapper a grid and the rows wrap to the width. Keep each card at least 340px wide; narrower, the text in tables and donuts clips. Cards in a row stretch to the tallest one, so a row of equal-height cards leaves no gaps.', gridNote: 'several cards',
    aiList: 'llms.txt for AI', kinds: 'Chart types', crumb: 'You are here', nCards: (n) => `${n} cards`, height: (h) => `Height ${h}`, nInGroup: (n) => `${n} cards`, judgment: (n) => `Judgment built in (${n})`,
    pagerAria: 'Previous and next chart', prev: 'Previous', next: 'Next', codeText: 'Code (text)',
    homeTitle: 'Vizney Blocks · Copy-paste dashboard cards', catTitle: (name) => `${name} · Vizney Blocks`, catDesc: (lede, n) => `${lede} ${n} copy-paste HTML cards.`,
    homeDesc: `${N.cards} copy-paste HTML dashboard cards. ${N.cats} chart types, from KPI, bar, line and grid to donut, scatter, Sankey and radar, built on the judgment rules of the Vizney chart guide. MIT License.`,
    js: { copied: 'Copied', linkCopied: 'Link copied', sub: 'Change only the data (JSON) on the <b>orange lines</b>. Leave the rest as it is.', blocked: 'Copying is blocked here. The code is selected; press Ctrl+C (⌘+C) to copy it.', none: 'No card found.', exampleTitle: 'Sales Overview example', exampleSub: (n) => `The code of ${n} cards in a grid. In each card, change only the data (JSON) on the <b>orange lines</b>. Leave the rest as it is.`, exampleComment: (n) => `<!-- Vizney Blocks example · Sales Overview (${n} cards)\n     ${SITE}/en/ · Change only each card's JSON. -->` },
  },
};
const locale = (lang) => {
  const base = lang === 'en' ? '/en' : '';
  const cs = lang === 'en' ? builtEn : built;
  const vs = cs.flatMap((c) => c.variants);
  const ps = lang === 'en' ? purposesEn : purposes;
  return {
    lang, base, cats: cs, variants: vs, purposes: ps, guide: GUIDE[lang], t: WORDS[lang],
    byId: Object.fromEntries(vs.map((v) => [v.id, v])),
    catName: Object.fromEntries(cs.map((c) => [c.id, c.name])),
    // Search words for a card: the purposes it answers and their conditions.
    tagsOf: (id) => ps.flatMap((p) => p.picks.filter((k) => k.id === id).map((k) => `${p.name} ${p.question} ${k.when}`)).join(' '),
    llms: `${base}/llms.txt`, tokens: `${base}/tokens.css`,
  };
};
const KO = locale('ko'), ENL = locale('en');
const LOCALES = [KO, ENL];

// ---------- Page parts ----------
// Two modes share the markup: the site (a page per chart type, in each language under its base path) and the one-page
// gallery (every chart type on one page, Korean). Every part takes the locale L (cards, purposes, strings, addresses).
const siteMode = (L) => ({ one: false, home: `${L.base}/`, cards: `${L.base}/#cards`, usage: `${L.base}/#usage`, cat: (id) => `${L.base}/${id}/`, card: (v) => `${L.base}/${v.cat}/#${v.id}`, file: (p) => `/${p}`, llms: L.llms, tokens: L.tokens });
const ONE_M = { one: true, home: '#top', cards: `#cat-${built[0].id}`, usage: '#usage', cat: (id) => `#cat-${id}`, card: (v) => `#${v.id}`, file: (p) => `${SITE}/${p}`, llms: `${SITE}/llms.txt`, tokens: `${SITE}/tokens.css` };
const NEW = ['sankey', 'radar'];
const EXAMPLE = [{ id: 'kpi-line' }, { id: 'kpi-bar' }, { id: 'bar-ranking' }, { id: 'sankey-levels', wide: true }, { id: 'radar-basic' }];
const ART = JSON.parse(r('page/tiles.json'));
// Card heights in units of 168px (TIER above): KPI - Number 1, KPI - Line and Bar 2, the other KPI cards 1.5, every chart card 2.
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

// The header's language switch (alt: the same page in the other language) sits before the GitHub button on the site pages.
const header = (m, current, L, alt) => `<header class="top" id="top">
<div class="wrap top-in">
<a class="logo" href="${m.home}"><span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Vizney Blocks</a>
<nav class="top-nav" aria-label="${L.t.menu}"><a href="${m.cards}"${current ? ' aria-current="page"' : ''}>${L.t.cards}</a><a href="${m.usage}">${L.t.usage}</a><a ${ext(L.guide)}>${L.t.guide} ↗</a></nav>
<div class="top-end">
<div class="search">${IC.search}<label class="sr" for="q">${L.t.find}</label><input id="q" type="search" placeholder="${L.t.find}" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="q-pop"><kbd aria-hidden="true">⌘K</kbd><ul class="search-pop" id="q-pop" role="listbox" aria-label="${L.t.found}" hidden></ul></div>
${alt ? `<a class="btn is-lang" href="${alt}" hreflang="${L.t.other.lang}" lang="${L.t.other.lang}">${L.t.other.label}</a>\n` : ''}<a class="btn is-git" ${ext(REPO)}>GitHub${IC.out}</a>
</div>
</div>
</header>`;

const footer = (m, L) => `<footer class="foot">
<div class="wrap foot-in">
<span>Vizney Blocks ${VERSION} · ${NOTICE}</span>
<span>${L.t.footFont} · <a href="${m.file('OFL.txt')}">SIL Open Font License</a></span>
<nav aria-label="${L.t.footNav}"><a ${ext(REPO)}>GitHub</a><a href="${m.llms}">llms.txt</a><a ${ext(L.guide)}>${L.t.footGuide}</a></nav>
</div>
</footer>`;

const dialog = (L) => `<dialog class="dlg" id="dlg" aria-labelledby="dlg-title" aria-describedby="dlg-sub">
<div class="dlg-hd">
<div><h2 id="dlg-title"></h2><p id="dlg-sub"></p></div>
<div class="acts"><button type="button" class="btn is-primary" data-act="dlg-copy">${IC.copy}${L.t.copy}</button><button type="button" class="btn" data-act="dlg-link">${IC.link}${L.t.aiLink}</button><button type="button" class="btn" data-act="dlg-close">${L.t.close}</button></div>
</div>
<pre class="code" id="dlg-code" tabindex="0"></pre>
</dialog>
<p class="sr" id="say" aria-live="polite"></p>`;

const skip = (L) => `<a class="skip" href="#main">${L.t.skip}</a>`;

// Home
const hero = (m, L) => `<section class="wrap hero" aria-labelledby="hero-title">
<p class="eyebrow">${L.t.eyebrow}</p>
<h1 id="hero-title">${L.t.h1}</h1>
<p class="lede">${L.t.lede}</p>
<div class="cta"><a class="btn is-primary is-lg" href="#cards">${L.t.browse}</a><a class="btn is-lg" ${ext(REPO)}>${L.t.onGithub}</a></div>
<p class="hint">${L.t.hint(m.llms)}</p>
</section>`;

// Purpose index: a box per question with its base card first, then each other card after the condition that calls for it.
const purposeSec = (m, L) => `<section class="${m.one ? '' : 'wrap '}sec" id="purpose" aria-labelledby="purpose-title">
<div class="sec-hd"><div><h2 id="purpose-title">${L.t.purposeTitle}</h2><p>${L.t.purposeSub}</p></div></div>
<ol class="purposes">
${L.purposes.map((p) => {
    const [base, ...rest] = p.picks;
    const b = L.byId[base.id];
    return `<li class="purpose" id="p-${p.id}">
<h3><b>${h(p.name)}</b><span>${h(p.question)}</span></h3>
<a class="pick-base" href="${m.card(b)}"><span class="pick-tag">${L.t.base}</span><b>${h(b.name)}</b><small>${h(base.when)}</small></a>
${rest.length ? `<ul class="picks">\n${rest.map((k) => `<li><a href="${m.card(L.byId[k.id])}"><small>${h(k.when)}</small><b>${h(L.byId[k.id].name)}</b></a></li>`).join('\n')}\n</ul>\n` : ''}</li>`;
  }).join('\n')}
</ol>
</section>`;

const showcase = (L) => `<section class="wrap show-wrap" aria-label="${L.t.showAria}">
<div class="show">
<div class="show-hd"><div><p class="show-title">${L.t.showTitle}</p><p class="show-sub">${L.t.showSub(EXAMPLE.length)}</p></div><button type="button" class="btn" data-act="example">${IC.code}${L.t.showCode}</button></div>
<div class="show-grid">
${EXAMPLE.map((x) => `<div${x.wide ? ' class="is-wide"' : ''} data-mount="${x.id}" style="min-height:${tierPx(L.byId[x.id])}px"></div>`).join('\n')}
</div>
</div>
</section>`;

const tiles = (m, L) => `<section class="wrap sec" id="cards" aria-labelledby="cards-title">
<div class="sec-hd"><div><h2 id="cards-title">${L.t.tilesTitle}</h2><p>${L.t.tilesSub}</p></div></div>
<div class="tiles">
${L.cats.map((c) => `<a class="tile" href="${m.cat(c.id)}"><span class="tile-art">${ART[c.id]}</span><span class="tile-name"><b>${h(c.name)}</b><em>${c.variants.length}</em>${NEW.includes(c.id) ? '<span class="new">New</span>' : ''}</span></a>`).join('\n')}
</div>
</section>`;

const usage = (m, L) => `<section class="${m.one ? '' : 'wrap '}sec" id="usage" aria-labelledby="usage-title">
<div class="sec-hd"><div><h2 id="usage-title">${L.t.usageTitle}</h2><p>${L.t.usageSub}</p></div></div>
<ol class="steps">
<li class="step"><span class="num" aria-hidden="true">1</span><h3>${L.t.step1}</h3><p>${L.t.step1p}</p><pre class="snip">&lt;div class="vzb-card"
     data-vzb="bar-basic"&gt;
  …
&lt;/div&gt;</pre></li>
<li class="step"><span class="num" aria-hidden="true">2</span><h3>${L.t.step2}</h3><p>${L.t.step2p}</p><pre class="snip">${L.t.step2code}</pre></li>
<li class="step"><span class="num" aria-hidden="true">3</span><h3>${L.t.step3}</h3><p>${L.t.step3p(m.tokens)}</p><pre class="snip">:root {
  --vzb-primary: #0f766e;
  --vzb-font: 'Pretendard';
}</pre></li>
<li class="step"><span class="num" aria-hidden="true">4</span><h3>${L.t.step4}</h3><p>${L.t.step4p}</p><pre class="snip">${L.t.step4code(L.base)}</pre></li>
</ol>
<details class="fields">
<summary>${L.t.fields}${IC.down}</summary>
<div class="fields-in">
<dl>
${L.t.fieldList.map(([k, v]) => `<dt><code>${k}</code></dt><dd>${v}</dd>`).join('\n')}
</dl>
<div>
<h3>${L.t.grid}</h3>
<p>${L.t.gridp}</p>
<pre class="snip">&lt;div style="display:grid;
  grid-template-columns:
    repeat(auto-fit,
      minmax(min(100%, 340px), 1fr));
  gap:16px;"&gt;
  &lt;!-- ${L.t.gridNote} --&gt;
&lt;/div&gt;</pre>
</div>
</div>
</details>
</section>`;

// One-page gallery: a short introduction before the chart types.
const intro = (L) => `<section class="intro" aria-labelledby="intro-title">
<p class="eyebrow">${L.t.eyebrow}</p>
<h1 id="intro-title">${L.t.h1one}</h1>
<p class="cat-lede">${L.t.lede}</p>
<div class="cat-links"><a class="pill" ${ext(`${SITE}/`)}>blocks.vizney.com${IC.out}</a><a class="pill" ${ext(`${SITE}/llms.txt`)}>${L.t.aiList}${IC.out}</a></div>
</section>`;

// Category pages
const sidebar = (m, current, L) => `<nav class="side" aria-label="${L.t.kinds}">
<p class="side-hd">${L.t.kinds}</p>
${L.cats.map((c) => `<a href="${m.cat(c.id)}"${m.one ? ` data-cat="${c.id}"` : ''}${c.id === current ? ' aria-current="page"' : ''}><span>${h(c.name)}</span>${NEW.includes(c.id) ? '<span class="new">New</span>' : ''}<em>${c.variants.length}</em></a>`).join('\n')}
<hr>
<a class="side-link" href="${m.usage}">${L.t.usage}</a>
<a class="side-link" href="${m.llms}">${L.t.aiList}</a>
<a class="side-link" ${ext(REPO)}>GitHub ↗</a>
</nav>`;

const optBar = (o) => `<div class="opt" role="group" aria-label="${h(o.label)}" data-opt="${o.field}"><span>${h(o.label)}</span>${o.choices.map((ch, k) => `<button type="button" data-val="${k ? ch.value : ''}" aria-pressed="${!k}">${h(ch.label)}</button>`).join('')}</div>`;

const item = (v, c, tag, L) => {
  // Only the cards that draw curves follow the line-shape option.
  const fixed = c.option && c.option.field === 'curve' && !v.uses.includes('curve');
  return `<article class="item" id="${v.id}" aria-labelledby="t-${v.id}">
<div class="item-hd"><${tag} id="t-${v.id}">${h(v.name)}</${tag}><code>${v.id}</code><div class="acts">
<button type="button" class="btn is-sm" data-act="code" data-id="${v.id}" aria-label="${h(v.name)} ${L.t.viewCode}">${IC.code}${L.t.code}</button>
<div class="copy"><button type="button" class="btn is-sm is-primary" data-act="copy" data-id="${v.id}" aria-haspopup="menu" aria-expanded="false" aria-label="${h(v.name)} ${L.t.copy}">${IC.copy}${L.t.copy}${IC.down}</button><div class="menu" role="menu" aria-label="${h(v.name)} ${L.t.copy}" hidden>
<button type="button" role="menuitem" data-act="copy-code" data-id="${v.id}">${IC.copyLg}<span><b>${L.t.copyCode}</b><small>${L.t.copyCodeNote}</small></span></button>
<button type="button" role="menuitem" data-act="copy-link" data-id="${v.id}">${IC.link}<span><b>${L.t.copyLink}</b><small>${L.t.copyLinkNote(v.id)}</small></span></button>
</div></div>
</div></div>
<div class="item-preview" data-mount="${v.id}"${fixed ? ' data-fixed' : ''} style="min-height:${tierPx(v)}px"></div>
<p class="item-when">${rich(v.when)}</p>
${v.guide ? `<a class="item-guide" ${ext(v.guide.url)}>${L.t.guide} · ${h(v.guide.name)} ↗</a>\n` : ''}<details class="rules"><summary>${L.t.judgment(v.rules.length)}${IC.down}</summary><ul>${v.rules.map((x) => `<li>${rich(x)}</li>`).join('')}</ul></details>
</article>`;
};

const catSection = (c, m, L) => {
  // Heading levels: the site page owns its h1; the one-page gallery sits under the introduction's h1.
  const H = m.one ? ['h2', 'h3', 'h4'] : ['h1', 'h2', 'h3'];
  let body;
  if (c.groups) {
    body = c.groups.map((g) => {
      const vs = c.variants.filter((v) => v.group === g.id);
      return `<div class="grp"><${H[1]}>${h(g.name)}</${H[1]}><span>${h(g.note)} · ${L.t.nInGroup(vs.length)}</span></div>
<div class="items">
${vs.map((v) => item(v, c, H[2], L)).join('\n')}
</div>`;
    }).join('\n');
  } else {
    body = `<div class="items">
${c.variants.map((v) => item(v, c, H[1], L)).join('\n')}
</div>`;
  }
  const links = [c.guide && `<a class="pill" ${ext(c.guide.url)}>${L.t.guide} · ${h(c.guide.name)}${IC.out}</a>`, c.option && optBar(c.option)].filter(Boolean);
  return `<section class="cat" id="cat-${c.id}" aria-labelledby="h-${c.id}">
${m.one ? '' : `<nav class="crumb" aria-label="${L.t.crumb}"><a href="${m.cards}">${L.t.cards}</a><i aria-hidden="true">/</i><span>${h(c.name)}</span></nav>\n`}<div class="cat-title"><${H[0]} id="h-${c.id}">${h(c.name)}</${H[0]}><span class="chip">${L.t.nCards(c.variants.length)}</span><span class="chip">${L.t.height(h(c.height))}</span></div>
<p class="cat-lede">${rich(c.lede)}</p>
${links.length ? `<div class="cat-links">${links.join('')}</div>\n` : ''}${body}
</section>`;
};

const pager = (i, m, L) => {
  const prev = L.cats[i - 1], next = L.cats[i + 1];
  return `<nav class="pager" aria-label="${L.t.pagerAria}">${prev ? `<a class="is-prev" href="${m.cat(prev.id)}" rel="prev"><span>${L.t.prev}</span><b>← ${h(prev.name)}</b></a>` : '<span></span>'}${next ? `<a class="is-next" href="${m.cat(next.id)}" rel="next"><span>${L.t.next}</span><b>${h(next.name)} →</b></a>` : '<span></span>'}</nav>`;
};

// Page data for site.js: the search index, the words site.js prints, and the code of the cards this page shows.
const data = (m, page, ids, L) => `<script>window.VZB = ${esc({
  mode: m.one ? 'one' : 'site',
  page,
  site: SITE,
  base: L.base,
  t: Object.fromEntries(Object.entries(L.t.js).map(([k, v]) => [k, typeof v === 'function' ? v(EXAMPLE.length) : v])),
  cats: L.cats.map((c) => ({ id: c.id, name: c.name })),
  index: L.variants.map((v) => ({ id: v.id, name: v.name, cat: v.cat, catName: L.catName[v.cat], when: plain(v.when), tags: L.tagsOf(v.id), url: m.card(v) })),
  example: page === 'home' ? EXAMPLE : [],
  retired: Object.fromEntries(retired.map((v) => [v.id, m.card(L.byId[v.retired.use])])),
  code: Object.fromEntries(ids.map((id) => [id, L.byId[id].code])),
})};</script>`;

// ---------- Site pages (docs/) ----------
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// alt: the same page in the other language, for the hreflang links (Korean is the default for other languages).
const head = ({ title, desc, path, extra = '', L = KO, alt }) => `<!doctype html>
<html lang="${L.t.html}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${SITE}${path}">
${alt ? `<link rel="alternate" hreflang="${L.lang}" href="${SITE}${path}">\n<link rel="alternate" hreflang="${L.t.other.lang}" href="${SITE}${alt}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${L.lang === 'ko' ? path : alt}">\n` : ''}<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vizney Blocks">
<meta property="og:locale" content="${L.t.og}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/og.png">
<meta name="twitter:card" content="summary_large_image">
${extra}</head>`;
// Asset versions are filled in once the font is built (the font depends on every character the pages use).
const assets = '<link rel="preload" href="/assets/fonts/vz-sans-400.woff?v=__FONT_V__" as="font" type="font/woff" crossorigin>\n<link rel="stylesheet" href="/assets/site.css?v=__CSS_V__">\n';
const sitePage = ({ title, desc, path, body, page, ids, current, robots, L, alt }) => {
  const m = siteMode(L);
  return `${head({ title, desc, path, L, alt, extra: (robots ? `<meta name="robots" content="${robots}">\n` : '') + assets })}
<body>
${skip(L)}
${header(m, current, L, alt)}
${body}
${footer(m, L)}
${dialog(L)}
${data(m, page, ids, L)}
<script src="/assets/site.js?v=__JS_V__"></script>
</body>
</html>
`;
};

const pages = {};
for (const L of LOCALES) {
  const m = siteMode(L), other = L.lang === 'ko' ? ENL : KO;
  pages[`${L.base.slice(1)}${L.base ? '/' : ''}index.html`] = sitePage({
    title: L.t.homeTitle,
    desc: L.t.homeDesc,
    path: `${L.base}/`,
    L, alt: `${other.base}/`,
    page: 'home',
    ids: EXAMPLE.map((x) => x.id),
    body: `<main id="main">
${hero(m, L)}
${showcase(L)}
${purposeSec(m, L)}
${tiles(m, L)}
${usage(m, L)}
</main>`,
  });
  L.cats.forEach((c, i) => {
    pages[`${L.base.slice(1)}${L.base ? '/' : ''}${c.id}/index.html`] = sitePage({
      title: L.t.catTitle(c.name),
      desc: L.t.catDesc(plain(c.lede), c.variants.length),
      path: `${L.base}/${c.id}/`,
      L, alt: `${other.base}/${c.id}/`,
      page: 'cat',
      current: true,
      ids: c.variants.map((v) => v.id),
      body: `<div class="wrap doc">
${sidebar(m, c.id, L)}
<main class="main" id="main">
${catSection(c, m, L)}
${pager(i, m, L)}
</main>
</div>`,
    });
  });
}
// GitHub Pages serves one 404 page for every address, so it is Korean with an English line.
pages['404.html'] = sitePage({
  title: '페이지를 찾을 수 없습니다 · Vizney Blocks',
  desc: KO.t.homeDesc,
  path: '/404.html',
  robots: 'noindex',
  page: 'none',
  ids: [],
  L: KO,
  body: `<main id="main" class="wrap hero lost">
<p class="eyebrow">404</p>
<h1>페이지를 찾을 수 없습니다</h1>
<p class="lede">주소가 바뀌었거나 없는 페이지입니다. 위의 카드 찾기로 카드 이름을 찾거나 첫 화면에서 차트를 고르세요.</p>
<div class="cta"><a class="btn is-primary is-lg" href="/">첫 화면으로</a><a class="btn is-lg" href="/#cards">차트 고르기</a></div>
<p class="hint" lang="en">Page not found. The address may have changed. Search for a card above, or start from the <a href="/en/">English home page</a>.</p>
</main>`,
});

// ---------- One-page gallery (dist/, published as an artifact) ----------
const siteCss = r('page/site.css').trim();
const siteJs = r('page/site.js').trim();
// The gallery inlines site.js in a <script>, where an HTML comment opener (even inside a regex or string) makes the parser miss the closing tag.
if (/<!--/.test(siteJs)) throw new Error('page/site.js: no "<!" + "--" sequence; write it as <!-{2} in a regex. The one-page gallery inlines this file');
const onePage = (fontCss) => `<title>Vizney Blocks</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${fontCss}
${siteCss}
</style>
${skip(KO)}
${header(ONE_M, false, KO)}
<div class="wrap doc is-one">
${sidebar(ONE_M, null, KO)}
<main class="main" id="main">
${intro(KO)}
${purposeSec(ONE_M, KO)}
${built.map((c) => catSection(c, ONE_M, KO)).join('\n')}
${usage(ONE_M, KO)}
</main>
</div>
${footer(ONE_M, KO)}
${dialog(KO)}
${data(ONE_M, 'one', variants.map((v) => v.id), KO)}
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
if (!FONT_DIR) throw new Error('Set SPOQA_DIR to Original/SpoqaHanSansNeo of github.com/spoqa/spoqa-han-sans (SpoqaHanSansNeo-{Regular,Medium,Bold}.ttf)');
// SOURCE_DATE_EPOCH pins the font's modified timestamp so a rebuild with the same characters gives byte-identical woff files
// (and so docs/ does not change when the cards did not).
console.log(execFileSync('python3', ['-I', join(root, 'tools/font.py'), FONT_DIR, join(root, 'build/chars.txt'), join(root, 'build')], { env: { ...process.env, SOURCE_DATE_EPOCH: '0' } }).toString().trim());
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
writeFileSync(join(root, 'dist/snippets/all.html'), skeleton(`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px;padding:24px;background:#f6f7fb">\n${variants.map((v) => v.code).join('\n')}</div>\n`));
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
// The English pages (/en/cards/) exist for the cards that are not retired; the retired addresses are Korean only.
const cardCss = `<style>body{margin:0;background:#eef0f4;font:14px/1.6 'Spoqa Han Sans Neo','Noto Sans KR',sans-serif;color:#4a4a4a}main{box-sizing:border-box;max-width:var(--w,640px);margin:0 auto;padding:40px 16px 24px}p{margin:16px 2px 0;font-size:13px}a{color:#1b1b1b}</style>\n`;
mkdirSync(join(docs, 'en/cards'), { recursive: true });
for (const [L, all] of [[KO, builtAll], [ENL, builtEnAll]]) {
  for (const c of all) {
    for (const v of c.variants) {
      const w = c.id === 'kpi' ? 420 : 640;
      const gone = v.retired && `<p>${h(v.retired.version)}에 목록에서 내린 카드입니다. 대신 <a href="${v.retired.use}.html">${h(nameOf[v.retired.use])}</a>를 쓰세요. ${h(v.retired.note)}</p>\n`;
      const path = `${L.base}/cards/${v.id}.html`;
      writeFileSync(join(docs, `${L.base}/cards`, `${v.id}.txt`), v.code);
      writeFileSync(join(docs, path), `${head({ title: `${v.name} · Vizney Blocks`, desc: `${c.name} · ${v.name}. ${plain(v.when)}`, path, L, alt: v.retired ? null : `${(L.lang === 'ko' ? ENL : KO).base}/cards/${v.id}.html`, extra: (gone ? '<meta name="robots" content="noindex">\n' : '') + cardCss })}
<body>
<main style="--w:${w}px">
${v.code}
${gone || ''}<p><a href="${L.base}/${c.id}/${gone ? '' : `#${v.id}`}">Vizney Blocks · ${h(c.name)}</a> · <a href="${v.id}.txt">${L.t.codeText}</a> · ${NOTICE}</p>
</main>
</body>
</html>
`);
    }
  }
}

// How to pick and use the cards: shared by llms.txt (both languages) and the skill (Korean) so they never disagree.
const PICK = {
  ko: '카드는 "목적으로 고르기"에서 고른다. 화면이 답할 질문마다 기본 카드를 먼저 쓰고, 다른 카드는 조건이 정확히 맞을 때만 쓴다. 애매하면 기본 카드를 쓴다. 카드 이름은 지표가 아니라 모양이므로, 지표 이름은 JSON의 title로 바꾼다.',
  en: 'Pick cards in "Pick by purpose". For each question the screen answers, use the base card first and another card only when its condition fits exactly. When unsure, use the base card. Card names describe the shape, not the metric, so put the metric name in the JSON title.',
};
const PICK_NOTE = {
  ko: '화면이 답할 질문마다 기본 카드를 먼저 쓰고, 다른 카드는 조건이 정확히 맞을 때만 쓴다. 애매하면 기본 카드를 쓴다. 여기 없는 카드는 이 조건들로 풀리지 않을 때만 쓴다.',
  en: 'For each question the screen answers, use the base card first and another card only when its condition fits exactly. When unsure, use the base card. A card not listed here is for cases these conditions do not cover.',
};
// Card heights by unit, from TIER: "KPI - Number 1단위, … 1.5단위, 나머지 2단위".
const HEIGHTS = (lang) => {
  const by = {};
  for (const v of variants) (by[TIER[v.id] || 2] = by[TIER[v.id] || 2] || []).push(v.name);
  return lang === 'en' ? `${by[1].join(' · ')} 1 unit, ${by[1.5].join(' · ')} 1.5 units, the rest 2 units` : `${by[1].join(' · ')} 1단위, ${by[1.5].join(' · ')} 1.5단위, 나머지 2단위`;
};
// The grid for several cards. Below 340px the tables, donut, funnel and waterfall clip or overlap their labels
// (measured on every card with the real font); KPI cards alone hold from 300px.
const GRID = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px';
const RULES = (from, lang = 'ko') => (lang === 'en' ? [
  `Paste the card code ${from} as it is and change only the JSON values. Do not edit the styles or the script. To use the same card several times, paste the whole card code again and change each JSON.`,
  `A card fills the width of its slot, and its height is one of 1 · 1.5 · 2 units (1 unit = 168px, --vzb-unit): ${HEIGHTS('en')}. Cards in a row stretch to the tallest one and their graphics sit on the bottom, so to leave no gaps, put cards of the same height in a row.`,
  `For several cards, give the wrapper a grid: ${GRID}. Below 340px, the text in tables, donuts, funnels and waterfalls clips or overlaps. A row of KPI cards alone can go down to 300px.`,
  `Change colors and the font with the --vzb-* variables on :root (--vzb-primary, --vzb-font, …). The variable list and what each one does are in ${SITE}/en/tokens.css (the same content as the :where(:root) block in the card code). To match a whole page, re-declare that file's values on :root.`,
  'Common fields: title (metric name), subtitle (period), value (the headline figure of a KPI card; KPI - Line and KPI - Bar use the last value when it is empty), format (usd dollar amounts, shortened to $745.6K · $1.2M · count a count, with its unit in unit · pct a percentage (3.4 is 3.4%), changes in pp · days a number of days · eok and krw are Korean won notations), better (up · down · neutral: the change color), compare ({ label, value }), labels (period names, the same length as values; null for a period without a value), series ([{ name, values }]), rows (table rows), curve (line shape of the line cards: smooth · linear · step), lang (en: the words the card prints itself, like Total, Other and Met, in English).',
  'Changes, shares, attainment and totals are computed by the card, so do not write them in the JSON. Ranking and share cards also sort by size and fold the rest into Other, so do not sort or fold the data beforehand.',
  'Give amounts as raw values, not rounded or divided into thousands or millions. The card shortens them to the format (usd) and computes totals and changes from the raw values, so totals agree across cards and decimals match. usd tables and scatter axes pick one of K · M · B per column or axis and write it in the column heading or axis name, like $K. Grid - Basic takes "format": "usd" on amount columns.',
] : [
  `${from} 카드 코드를 그대로 붙여 넣고 JSON 값만 바꾼다. 스타일과 스크립트는 고치지 않는다. 같은 카드를 여러 장 쓸 때는 카드 코드를 통째로 다시 붙여 넣고 각 JSON만 바꾼다.`,
  `카드는 놓인 자리의 폭을 채우고, 높이는 1 · 1.5 · 2단위(1단위 168px, --vzb-unit) 중 하나다: ${HEIGHTS('ko')}. 같은 줄의 카드는 가장 높은 카드에 맞춰 늘어나고 그래픽은 바닥에 붙으므로, 빈 곳이 없게 하려면 높이가 같은 카드끼리 한 줄에 둔다.`,
  `여러 장은 감싸는 요소에 격자를 준다: ${GRID}. 카드 폭이 340px보다 좁으면 표, 도넛, 퍼널, 워터폴의 글자가 잘리거나 겹친다. KPI 카드만 둔 줄은 300px까지 줄여도 된다.`,
  `색과 글꼴은 :root의 --vzb-* 변수(--vzb-primary, --vzb-font 등)로 바꾼다. 변수 목록과 쓰임은 ${SITE}/tokens.css 에 있다(카드 코드의 :where(:root) 블록과 같은 내용). 페이지 전체를 맞출 때는 그 파일의 값을 :root에 다시 적는다.`,
  '공통 필드: title(지표명), subtitle(기간 부제), value(KPI 카드의 대표 수치. KPI - Line과 KPI - Bar는 비우면 마지막 값), format(eok 억 단위 숫자 · krw 원 단위 숫자를 만·억·조로 줄여 적음 · usd 달러 금액을 $745.6K·$1.2M처럼 줄여 적음 · count 개수, 단위는 unit · pct 퍼센트 숫자(3.4는 3.4%), 증감은 %p · days 일수), better(up · down · neutral, 증감 색), compare({ label, value }), labels(기간 이름. values와 같은 길이로 적고, 값이 없는 기간의 값은 null), series([{ name, values }]), rows(표의 줄), curve(라인 카드의 선 모양: smooth · linear · step), lang(en이면 합계 · 기타 · 달성처럼 카드가 직접 적는 문구가 영어. 비우면 한국어).',
  '증감, 비중, 달성률, 합계는 카드가 계산하므로 JSON에 적지 않는다. 순위·비중 카드는 큰 순서 정렬과 "기타" 묶기도 직접 하므로 데이터를 미리 정렬하거나 묶지 않는다.',
  '금액은 미리 반올림하거나 천·백만 단위로 나누지 않고 원래 값을 넣는다. 카드가 형식(krw · usd)에 맞춰 줄여 적고 합계와 증감도 원래 값으로 계산하므로, 카드끼리 합계가 맞고 소수 자릿수도 맞는다. usd 표와 스캐터 축은 열·축마다 K · M · B 하나를 골라 열 제목과 축 이름에 $K처럼 적는다. Grid - Basic은 금액 열에 "format": "usd"를 적는다.',
]);

// llms.txt: what the cards are, how to use them, the purpose index, and every card with its plain-text code address. One per language.
const txt = (id, L) => `${SITE}${L.base}/cards/${id}.txt`;
for (const L of LOCALES) {
  const en = L.lang === 'en';
  let llms = en ? `# Vizney Blocks

> Copy-paste HTML dashboard cards: ${variants.length} cards (${VERSION}). One card is an HTML snippet that bundles <style>, a JSON data block and <script>; paste it inside <body> and it draws itself. Change only the values in the card's <script type="application/json">. ${NOTICE}.

How to use:
- ${PICK.en}
${RULES('from the links (.txt) below', 'en').map((x) => `- ${x}`).join('\n')}
- Coding agents can install the skill (its text is in Korean; the purpose index and rules are the ones above): ${SKILL_CMD}
- Gallery: ${SITE}/en/ · Korean: ${SITE}/llms.txt · Source: ${REPO}

## Pick by purpose

${PICK_NOTE.en}

${L.purposes.map((p) => `- ${p.name} · ${p.question}\n${p.picks.map((k, i) => `  - ${i ? '' : 'Base: '}[${L.byId[k.id].name}](${txt(k.id, L)}): ${k.when}`).join('\n')}`).join('\n')}
` : `# Vizney Blocks

> 복사해 붙여 쓰는 HTML 대시보드 카드 ${variants.length}종(${VERSION}). 카드 하나는 <style>, 데이터 JSON, <script>를 한데 묶은 HTML 조각이며, <body> 안에 붙여 넣으면 그려진다. 데이터는 카드 안 <script type="application/json">의 값만 바꾼다. ${NOTICE}.

쓰는 법:
- ${PICK.ko}
${RULES('아래 링크(.txt)의').map((x) => `- ${x}`).join('\n')}
- 코딩 에이전트에는 스킬로 설치한다: ${SKILL_CMD}
- 갤러리: ${SITE}/ · 영어: ${SITE}/en/llms.txt · 소스: ${REPO}

## 목적으로 고르기

${PICK_NOTE.ko}

${L.purposes.map((p) => `- ${p.name} · ${p.question}\n${p.picks.map((k, i) => `  - ${i ? '' : '기본 '}[${L.byId[k.id].name}](${txt(k.id, L)}): ${k.when}`).join('\n')}`).join('\n')}
`;
  for (const c of L.cats) {
    llms += `\n## ${c.name}\n\n${SITE}${L.base}/${c.id}/ · ${plain(c.intro)}\n\n`;
    for (const v of c.variants) llms += `- [${v.name}](${txt(v.id, L)}): ${plain(v.when)} ${en ? 'Rules:' : '규칙:'} ${v.rules.map(plain).join(' ')}\n`;
  }
  writeFileSync(join(docs, `${L.base}/llms.txt`), llms);
  // tokens.css at a stable address: the variable list with what each one does, for people and AI tools to re-declare in :root.
  writeFileSync(join(docs, `${L.base}/tokens.css`), `/* Vizney Blocks ${VERSION} · ${NOTICE} · ${en ? 'the same content as the :where(:root) block in the card code' : '카드 코드 안의 :where(:root) 블록과 같은 내용'} */\n${tokensBy[L.lang]}\n`);
}

// Skill for coding agents (Agent Skills format, skills/<name>/SKILL.md), installed with `npx skills add yehwanhwang/vizney-blocks`.
// It carries the purpose index and the rules, and sends the agent to the plain-text card code instead of rewriting it.
const SKILL_DESC = 'Vizney Blocks(blocks.vizney.com)의 HTML 대시보드 카드로 대시보드 화면을 만든다. 한 파일짜리 HTML 대시보드, KPI 카드, 차트나 표가 든 보고 화면을 만들거나 고칠 때, 사용자가 Vizney Blocks를 언급할 때 쓴다. 화면이 답할 질문마다 목적 색인에서 카드를 고르고, 카드 코드는 그대로 둔 채 JSON 데이터만 바꾼다.';
const skill = `---
name: vizney-blocks
description: ${JSON.stringify(SKILL_DESC)}
---

# Vizney Blocks로 대시보드 만들기

Vizney Blocks는 복사해 붙여 쓰는 HTML 대시보드 카드 모음이다(${VERSION}, MIT License). 카드 하나는 \`<style>\`, 데이터 JSON, \`<script>\`를 묶은 HTML 조각이라 설치할 라이브러리가 없다. 증감, 비중, 달성률, 합계와 색·강조는 카드가 Vizney 차트 가이드의 규칙대로 계산하고 그린다.

## 순서

1. 화면이 답할 질문을 적는다. 카드 한 장은 질문 하나에 답한다.
2. 질문마다 아래 "목적으로 고르기"에서 카드를 고른다. 기본 카드를 먼저 쓰고, 다른 카드는 조건이 정확히 맞을 때만 쓴다. 애매하면 기본 카드를 쓴다. 카드 이름은 지표가 아니라 모양이므로, 지표 이름은 JSON의 \`title\`로 바꾼다.
3. 카드 코드를 내려받는다. \`${SITE}/cards/<카드 id>.txt\`가 카드 코드 원문이다. 코드를 다시 쓰거나 줄이지 말고 받은 그대로 쓴다. 내려받을 수 없으면 사용자에게 그 주소의 내용을 붙여 달라고 한다.

   \`\`\`bash
   curl -fsSL ${SITE}/cards/kpi-line.txt -o kpi-line.html
   \`\`\`

4. 카드 안 \`<script type="application/json">\`과 \`</script>\` 사이의 JSON 값만 바꾼다. 필드는 카드 코드에 든 예시 JSON이 기준이다. 예시에 없는 필드는 ${SITE}/llms.txt 의 그 카드 줄에 이름이 나온 것만 더한다(예: \`sort\`, \`max\`, \`focus\`). 그 줄에는 카드가 그리는 규칙도 있다.
5. 카드를 격자 요소 안에 차례로 붙여 한 HTML 문서로 만든다.

   \`\`\`html
   <!doctype html>
   <html lang="ko">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>영업 현황</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">영업 현황</h1>
   <p style="margin:2px 0 16px; font:400 13px/1.5 var(--vzb-font); color:var(--vzb-muted);">2024년 연간 기준 · 데이터 출처</p>
   <div style="${GRID};">
   <!-- 카드 코드를 여기에 차례로 붙인다 -->
   </div>
   </body>
   </html>
   \`\`\`

6. 브라우저에서 열어 아래 "확인"을 거친다.

## 목적으로 고르기

${PICK_NOTE.ko}

${purposes.map((p) => `### ${p.name} · ${p.question}\n\n${p.picks.map((k, i) => `- ${i ? '' : '기본: '}${byId[k.id].name} (\`${k.id}\`) — ${k.when}`).join('\n')}`).join('\n\n')}

## 규칙

${RULES('내려받은', 'ko').map((x) => `- ${x}`).join('\n')}
- 낮을수록 좋은 지표(반품률, 비용, 불량률)는 \`"better": "down"\`으로 둔다. 증가가 빨간 배지가 된다.
- 비율 지표는 \`"format": "pct"\`로 둔다. 증감이 %p로 적힌다.
- 월별 추이는 데이터가 있으면 13개월을 넣는다. 처음과 마지막이 같은 달이라 전년 동월과 견줄 수 있다.
- 이번 달처럼 진행 중인 기간은 지난 기간의 같은 날짜까지와 견주고(전월 동기), \`compare.label\`과 \`subtitle\`에 그 기준을 적는다.
- 기간 이름은 \`25.09\`, \`3Q26\`처럼 짧게 적는다. 길면 축과 막대 아래에서 잘리거나 서로 붙는다.
- 같은 지표가 여러 카드에 나오면 기간과 합계가 서로 맞는지 본다. 맞지 않으면 값을 고치지 말고 사용자에게 묻는다.
- 항목 이름(지역, 카테고리 등)은 화면 전체에서 한 언어로 맞춘다. 번역하면 모두 번역하고, 원문을 쓰면 모두 원문으로 둔다.
- 카드는 HTML 문서에 그대로 붙이는 조각이다. innerHTML이나 React의 dangerouslySetInnerHTML로 넣으면 카드의 \`<script>\`가 실행되지 않는다.

## 확인

- 브라우저 콘솔에 오류가 없고, 카드 안에 오류 문구(\`.vzb-error\`)가 없다.
- 카드는 넘치는 글자를 오류 없이 말줄임(…)으로 자르므로, 폭 1280px과 390px에서 화면을 캡처해 잘리거나 겹친 글자가 없는지 본다. 캡처할 수 없으면 카드 안에서 \`scrollWidth\`가 \`clientWidth\`보다 큰 요소가 없는지 확인한다.
- 같은 줄에 놓인 카드의 높이가 맞고, 늘어난 카드에 큰 빈 곳이 없다.

갤러리: ${SITE}/ · 소스: ${REPO}
`;
mkdirSync(join(root, 'skills/vizney-blocks'), { recursive: true });
writeFileSync(join(root, 'skills/vizney-blocks/SKILL.md'), skill);

// The same folder is an OpenDesign plugin (open-design.ai): open-design.json beside SKILL.md names the skill and the output
// surface, icon.svg is the card icon, and preview/index.html is a real output (the home-page example dashboard). Installed in
// OpenDesign with `od plugin install github:yehwanhwang/vizney-blocks/skills/vizney-blocks`; the community marketplace index
// (nexu-io/open-design, plugins/registry/community) points at this folder, so the manifest version follows VERSION.
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="13" height="13" rx="3" fill="#1b1b1b"/><rect x="17" y="2" width="13" height="13" rx="3" fill="#ff9500"/><rect x="2" y="17" width="13" height="13" rx="3" fill="#ffcc00"/><rect x="17" y="17" width="13" height="13" rx="3" fill="#ff2d55"/></svg>\n';
const PLUGIN_DESC = `Copy-paste HTML dashboard cards (${variants.length} cards, ${built.length} chart types) built on the Vizney chart guide: pick a card by the question the screen answers, keep the card code, change only its JSON.`;
const manifest = {
  $schema: 'https://open-design.ai/schemas/plugin.v1.json',
  specVersion: '1.0.0',
  name: 'vizney-blocks',
  title: 'Vizney Blocks',
  version: `${VERSION.slice(1)}.0`,
  description: PLUGIN_DESC,
  description_i18n: { ko: `복사해 붙여 쓰는 HTML 대시보드 카드 ${variants.length}종(차트 ${built.length}가지). Vizney 차트 가이드의 판단을 담았고, 화면이 답할 질문으로 카드를 골라 코드는 그대로 두고 JSON만 바꾼다.` },
  license: 'MIT',
  author: { name: 'Yehwan Hwang · Vizney', url: SITE },
  homepage: SITE,
  icon: './icon.svg',
  plugin: { repo: `${REPO}/tree/main/skills/vizney-blocks` },
  tags: ['create', 'dashboard', 'kpi', 'chart', 'data-visualization', 'html', 'cards', 'korean'],
  compat: { agentSkills: [{ path: './SKILL.md' }] },
  od: {
    kind: 'skill',
    taskKind: 'new-generation',
    mode: 'prototype',
    scenario: 'operation',
    preview: { type: 'html', entry: './preview/index.html', motion: 'static' },
    useCase: {
      query: {
        en: 'Build a single-page HTML dashboard with Vizney Blocks cards. Pick one card per question the screen answers from the purpose index, keep each card\'s code and change only its JSON data.',
        ko: 'Vizney Blocks 카드로 한 페이지 HTML 대시보드를 만든다. 화면이 답할 질문마다 목적 색인에서 카드를 하나 고르고, 카드 코드는 그대로 둔 채 JSON 데이터만 바꾼다.',
        'zh-CN': '用 Vizney Blocks 卡片构建单页 HTML 仪表盘。按画面要回答的问题从目的索引中各选一张卡片，保留卡片代码，只修改其 JSON 数据。',
      },
    },
    context: { skills: [{ path: './SKILL.md' }] },
    capabilities: ['prompt:inject'],
  },
};
writeFileSync(join(root, 'skills/vizney-blocks/open-design.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(root, 'skills/vizney-blocks/icon.svg'), ICON);
mkdirSync(join(root, 'skills/vizney-blocks/preview'), { recursive: true });
writeFileSync(join(root, 'skills/vizney-blocks/preview/index.html'), skeleton(`<style>body{background:#f4f5f7}.vzb-show{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px;padding:24px;background:#f4f5f7}@media (min-width:720px){.vzb-show .is-wide{grid-column:span 2}}</style>
<div class="vzb-show">
${EXAMPLE.map((x) => (x.wide ? `<div class="is-wide">\n${byId[x.id].code}</div>` : byId[x.id].code)).join('\n')}
</div>
`));

// Domain, Jekyll off, icon, font license, share image, sitemap.
writeFileSync(join(docs, 'CNAME'), 'blocks.vizney.com\n');
writeFileSync(join(docs, '.nojekyll'), '');
writeFileSync(join(docs, 'favicon.svg'), ICON);
copyFileSync(join(root, 'tools/OFL.txt'), join(docs, 'OFL.txt'));
if (existsSync(join(root, 'tools/og.png'))) copyFileSync(join(root, 'tools/og.png'), join(docs, 'og.png'));
// The sitemap lists both languages and links each page to its translation.
const alt = (p) => ['ko', 'en'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${l === 'en' ? '/en' : ''}${p}"/>`).join('');
writeFileSync(join(docs, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LOCALES.flatMap((L) => ['/', ...L.cats.map((c) => `/${c.id}/`)].map((p) => `<url><loc>${SITE}${L.base}${p}</loc>${alt(p)}</url>`)).join('\n')}
</urlset>
`);
writeFileSync(join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const kb = (p) => `${(readFileSync(join(docs, p)).length / 1024).toFixed(0)} KB`;
console.log(`docs/: home ${kb('index.html')}, ${built.length} chart pages (bar ${kb('bar/index.html')}), ${variants.length + retired.length} card pages and .txt files (${retired.length} retired), llms.txt ${kb('llms.txt')}, fonts ${W.map((w) => `${(woff[w].length / 1024).toFixed(0)}`).join('/')} KB`);
console.log(`docs/en/: home ${kb('en/index.html')}, ${builtEn.length} chart pages, ${builtEn.flatMap((c) => c.variants).length} card pages and .txt files, llms.txt ${kb('en/llms.txt')}`);
console.log(`skills/vizney-blocks/SKILL.md: ${(skill.length / 1024).toFixed(0)} KB · purpose index: ${purposes.length} purposes, ${picked.size} cards; not in the index: ${unpicked.join(', ') || 'none'}`);
console.log(`retired (addresses kept): ${retired.map((v) => `${v.id} → ${v.retired.use}`).join(', ') || 'none'}`);
