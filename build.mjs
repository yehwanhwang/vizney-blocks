// Builds Vizney Blocks: one self-contained snippet per card, the public site in docs/ (GitHub Pages at blocks.vizney.com:
// the home page with the gallery, a page and a plain-text copy per card, llms.txt for AI tools and tokens.css, in English at /
// and in Korean at /ko/), and the skill for coding agents in skills/vizney-blocks/ (installed with
// `npx skills add yehwanhwang/vizney-blocks`), which is also an OpenDesign plugin. The site embeds a renamed subset of
// Spoqa Han Sans Neo (VZ Sans).
// v0.56: the cards of the earlier direction, the chart pages, the purpose index, the one-page gallery and the old /en/ copies
// are gone. The cards are the ones on the gallery, and a card id is its name in lower case with hyphens (Bump Race → bump-race).
// v0.60: a chart card is named for its chart type and its motion (Bar Overflow, Waffle Flip, Bump Race); a control keeps the
// plain name people search for (Date Picker, Range Slider, Filter Chips, Download Button).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { guard } from './guard.mjs';

const root = new URL('.', import.meta.url).pathname;
const r = (p) => readFileSync(join(root, p), 'utf8');
const FONT_DIR = process.env.SPOQA_DIR;
const VERSION = 'v0.66';
const SITE = 'https://blocks.vizney.com';
const REPO = 'https://github.com/yehwanhwang/vizney-blocks';
const GUIDE = { ko: 'https://kr.vizney.com/chart-guide/', en: 'https://www.vizney.com/chart-guide/' };
// The Vizney blog, the home of every Vizney line (Korean readers go to kr.vizney.com), and the sister line.
const BLOG = { ko: 'https://kr.vizney.com/', en: 'https://www.vizney.com/' };
const STYLES = 'https://styles.vizney.com/';
const NOTICE = '© 2026 Vizney · MIT License';
const FONT_LINK = '<link rel="stylesheet" href="https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css">';

// ---------- Snippets ----------
// Korean is the source (tokens.css, meta.json, <id>.json). English overlays tokens.en.css (same declarations, English notes),
// meta.en.json (chart type and card wording) and <id>.en.json (example data with "lang": "en", which switches the words the
// card itself prints). The card code is one and the same in both languages.
const tokensBy = { ko: r('src/tokens.css').trim(), en: r('src/tokens.en.css').trim() };
const tokens = tokensBy.ko;
const baseCss = r('src/base.css').trim();
const core = r('src/core.js').trimEnd();
// Shared parts a card can use: chart (tooltip, pointer and keyboard), slider (the two-thumb range slider) and roll (rolling digits).
const parts = ['chart', 'slider', 'roll'];
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

const PASTE = {
  ko: '<body> 안 원하는 자리에 붙여 넣으면 그려집니다. 데이터는 아래 JSON만 바꾸세요.',
  en: 'Paste anywhere inside <body> and it draws itself. Change only the JSON below ("lang": "en" keeps the card\'s own words in English).',
};

// The English snippet of a card differs from the Korean one only in the header, the token notes and the example data.
function snippet(v, cat, lang = 'ko') {
  const base = lang === 'en' ? SITE : `${SITE}/ko`;
  return `<!-- Vizney Blocks ${VERSION} · ${cat.name} · ${v.name} (${v.id})
     ${base}/cards/${v.id}.html · ${NOTICE}
     ${PASTE[lang]} -->
${FONT_LINK}
<style>
${css(v, lang)}
</style>
${card(v.id, JSON.parse(r(vp(v.id, lang === 'en' ? 'en.json' : 'json'))))}
${tail(v)}`;
}

// meta.json groups the cards by chart type (the chart names of the Vizney chart guide) plus the controls.
const built = cats.map((cat) => ({ ...cat, variants: cat.variants.map((v) => ({ ...v, cat: cat.id, code: snippet(v, cat) })) }));
const enCat = (c) => ({ ...c, ...(EN.cats[c.id] || {}) });
const builtEn = cats.map((cat) => { const c = enCat(cat); return { ...c, variants: cat.variants.map((v) => ({ ...v, ...(EN.cards[v.id] || {}), cat: cat.id, code: snippet(v, c, 'en') })) }; });
// Guard (guard.mjs): self-containment, colors only from tokens, heights, scoping, accessibility hooks, example data,
// meta ↔ files, ids that match the names, card words through tx() and the English files. `node build.mjs --check` runs only this and needs no font.
// Chart cards are 2 units tall (1 unit = 168px) unless listed here with 1 or 1.5; the controls are drawn bare (no head or
// frame) at the height of the control itself.
const TIER = {};
const checked = guard({
  root, cats, parts, partCss, partJs, tokens, tier: TIER, fontLink: FONT_LINK, en: EN,
  snippets: Object.fromEntries(built.flatMap((c) => c.variants.map((v) => [v.id, v.code]))),
  snippetsEn: Object.fromEntries(builtEn.flatMap((c) => c.variants.map((v) => [v.id, v.code]))),
});
console.log(`guard: ${checked} cards pass`);
const stripNotes = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
if (stripNotes(tokensBy.ko) !== stripNotes(tokensBy.en)) throw new Error('src/tokens.en.css: the declarations must match src/tokens.css (only the notes differ)');
if (process.argv.includes('--check')) process.exit(0);
const variants = built.flatMap((cat) => cat.variants);
const isControl = (v) => v.cat === 'control';
const SKILL_CMD = 'npx skills add yehwanhwang/vizney-blocks';

// ---------- Languages ----------
// Everything a page says, in both languages. A locale (L) carries its cards, addresses and strings, and every page part
// takes one. English is the main site: its pages, card code, llms.txt and tokens.css are at / and the Korean ones at /ko/.
// The home page's description, also its meta description.
const GDESC = {
  ko: '한도를 넘긴 값, 뒤바뀐 순위, 달라진 비중처럼 움직여야 보이는 변화를 그리는 차트와, 대시보드에 필요한 컨트롤입니다. 카드 하나가 HTML 조각 하나라서, 복사해 붙이고 JSON 값만 바꾸면 됩니다.',
  en: 'Charts for the changes you only see in motion, such as a limit crossed, a rank overtaken or a share that grew, and the controls a dashboard needs. Each card is one HTML snippet: paste it in and change only the JSON.',
};
// Step 3 of "How to use": the shortest page script that redraws a chart from a control (the same pattern as CONNECT below).
// The step cards are narrow (27 characters of code at 1280px), so the lines are broken by hand.
const STEP3 = (note) => `document.addEventListener(
  'vzb-change', (e) =&gt; {
  const src = document
    .querySelector(
      '#spend script');
  const d = JSON.parse(
    src.textContent);
  // ${note}
  d.values =
    totals(e.detail.value);
  src.textContent =
    JSON.stringify(d);
});`;
const WORDS = {
  ko: {
    html: 'ko', og: 'ko_KR', other: { lang: 'en', label: 'English' },
    skip: '본문으로 건너뛰기', menu: '주 메뉴', more: '더 보기', find: '카드 찾기', found: '찾은 카드',
    footFont: '글꼴 VZ Sans(Spoqa Han Sans Neo 부분 글꼴)', footNav: '바닥글', footBlog: '블로그', footContact: '문의',
    copy: '복사', aiLink: 'AI용 링크', close: '닫기', gTitle: 'Blocks', gDesc: GDESC.ko, sponsor: '후원', aiCopy: 'AI용 링크 복사', toLight: '밝은 바탕으로 보기', gAria: '카드 갤러리', tPrompt: '프롬프트 복사', tCode: '코드 복사', codeText: '코드(텍스트)',
    usageTitle: '쓰는 법', usageSub: '설치할 것은 없습니다. 카드 하나가 스타일, 데이터, 스크립트를 모두 담은 HTML 조각입니다.',
    step1: '복사해서 붙이기', step1p: '카드의 <b>코드 복사</b>를 눌러 HTML의 &lt;body&gt; 안 원하는 자리에 붙여 넣습니다.',
    step2: 'JSON만 바꾸기', step2p: '카드 안 JSON의 값만 바꿉니다. 넘친 양, 비중, 순위는 카드가 계산합니다.', step2code: '"limit": 40000000,\n"labels": ["25.11", …],\n"values": [34200000, …]',
    step3: '컨트롤과 잇기', step3p: '컨트롤은 값이 바뀌면 <code>vzb-change</code> 이벤트를 보냅니다. 그 값으로 차트 카드 안 JSON의 글자를 바꾸면 카드가 다시 그려집니다. 아래의 <code>#spend</code>는 차트 카드 코드를 감싼 요소입니다.', step3code: STEP3('고른 값으로 다시 계산'),
    step4: 'AI에게 맡기기', step4p: '채팅 AI에는 카드의 <b>프롬프트 복사</b>로 규칙과 코드를 함께 붙여 넣습니다. 주소를 열 수 있는 AI에는 llms.txt 주소를 주고, 코딩 에이전트에는 스킬을 설치합니다.', step4code: (base) => `blocks.vizney.com${base}/\n  llms.txt\n\nnpx skills add\n  yehwanhwang/vizney-blocks`,
    fields: '공통 필드와 배치',
    fieldList: [
      ['title', '무엇의 값인지. 차트 카드의 머리에 적습니다.'], ['subtitle', '기간과 기준. 무엇을 언제 기준으로 보는지 적습니다.'],
      ['format', '<code>krw</code> 원 단위 값을 만·억·조로(10만 원 미만은 87,324원처럼 원 단위 그대로), <code>eok</code> 억 단위 값, <code>usd</code> 달러 값을 $745.6K·$1.2M처럼, <code>count</code> 개수(<code>unit</code>에 단위), <code>pct</code> 비율(증감은 %p), <code>days</code> 일수'],
      ['decimals', '숫자의 소수 자릿수. 비우면 카드가 정합니다.'],
      ['better', '<code>up</code>, <code>down</code>, <code>neutral</code>. 늘어난 것과 줄어든 것 가운데 어느 쪽이 좋은지 정합니다.'],
      ['labels', '기간 이름. <code>values</code>와 같은 길이로 적고, 값이 없는 기간은 값을 <code>null</code>로 둡니다.'],
      ['theme', '<code>dark</code>면 Vizney 검정 바탕에 노랑을 첫째 색으로 그립니다. 비우면 흰 바탕에 파랑입니다.'],
      ['lang', '<code>en</code>이면 카드가 직접 적는 문구(초과, 대비, 툴팁)가 영어가 됩니다. 비우면 한국어입니다.'],
      ['label', '컨트롤에서 화면 낭독기가 읽는 이름. 컨트롤은 제목을 그리지 않으므로 꼭 적습니다.'],
      ['name', '컨트롤이 보내는 이벤트의 <code>detail.name</code>. 어느 컨트롤이 바뀌었는지 가릅니다.'],
    ],
    grid: '여러 장을 한 줄에', gridp: '카드는 배치를 맡지 않습니다. 감싸는 요소에 격자를 주면 폭에 맞춰 줄이 바뀝니다. 차트 카드의 폭은 340px 이상으로 두고, 가로로 길게 읽는 차트에는 두 칸이나 전체 폭을 주세요. 지금 있는 차트 카드는 높이가 모두 2단위(336px)라 한 줄에 섞어도 높이가 맞습니다. 컨트롤은 틀이 없으므로 차트 위 필터 줄에 그대로 놓습니다.', gridNote: '차트 카드 여러 장',
    tokensTitle: '색 · 글꼴 · 바탕', tokensP: (tokens) => `색과 글꼴은 :root의 변수로 바꿉니다. 모든 카드에 한 번에 적용되고, 변수 목록은 <a href="${tokens}">tokens.css</a>에 있습니다. 어두운 화면에는 카드마다 JSON에 <code>"theme": "dark"</code>를 적습니다.`,
    notesTitle: '알아 둘 것',
    notes: ['차트 카드는 화면에 보이면 한 번 재생하고 마지막 장면에서 멈춥니다. 움직임이 데이터의 뜻이라 운영체제의 동작 줄이기 설정과 상관없이 재생합니다.', '카드 안 JSON의 글자가 바뀌면 그 카드만 다시 그립니다. 이때는 처음부터 재생하지 않습니다.', '카드는 HTML에 그대로 붙이는 조각입니다. innerHTML로 넣으면 카드의 스크립트가 실행되지 않습니다.'],
    notesAll: (u) => `카드마다의 규칙과 컨트롤을 잇는 법은 <a href="${u}">llms.txt</a>에 모두 있습니다.`,
    homeTitle: 'Vizney Blocks · 움직임으로 읽는 차트와 대시보드 컨트롤', homeDesc: GDESC.ko,
    // site.js
    js: { copied: '복사됨', linkCopied: '링크 복사됨', promptCopied: '프롬프트 복사됨', toLight: '밝은 바탕으로 보기', toDark: '어두운 바탕으로 보기', sub: '<b>주황 줄</b>의 데이터(JSON)만 바꾸면 됩니다. 나머지는 그대로 둡니다.', blocked: '복사가 막혀 있습니다. 코드를 선택해 두었으니 Ctrl+C(⌘+C)로 복사하세요.', none: '찾는 카드가 없습니다.' },
  },
  en: {
    html: 'en', og: 'en_US', other: { lang: 'ko', label: '한국어' },
    skip: 'Skip to content', menu: 'Main menu', more: 'More', find: 'Find a card', found: 'Cards found',
    footFont: 'Font VZ Sans (a subset of Spoqa Han Sans Neo)', footNav: 'Footer', footBlog: 'Blog', footContact: 'Contact',
    copy: 'Copy', aiLink: 'AI link', close: 'Close', gTitle: 'Blocks', gDesc: GDESC.en, sponsor: 'Sponsor', aiCopy: 'Copy AI link', toLight: 'Show on light', gAria: 'Card gallery', tPrompt: 'Copy prompt', tCode: 'Copy code', codeText: 'Code (text)',
    usageTitle: 'How to use', usageSub: 'Nothing to install. One card is an HTML snippet that carries its own styles, data and script.',
    step1: 'Copy and paste', step1p: 'Press <b>Copy code</b> on a card and paste it anywhere inside the &lt;body&gt; of your HTML.',
    step2: 'Change only the JSON', step2p: 'Edit the values in the card’s JSON. The card computes the amount over the limit, the shares and the ranks.', step2code: '"limit": 40000,\n"labels": ["Nov \'25", …],\n"values": [34200, …]',
    step3: 'Connect a control', step3p: 'A control sends a <code>vzb-change</code> event when its value changes. Rewrite the JSON text inside a chart card from that value and the card draws again. <code>#spend</code> below is an element wrapped around the chart card code.', step3code: STEP3('from the picked values'),
    step4: 'Hand it to an AI', step4p: 'Paste a card’s <b>Copy prompt</b> (rules and code together) into a chat AI. Give llms.txt to an AI that can open addresses, and install the skill in a coding agent.', step4code: (base) => `blocks.vizney.com${base}/\n  llms.txt\n\nnpx skills add\n  yehwanhwang/vizney-blocks`,
    fields: 'Common fields and layout',
    fieldList: [
      ['title', 'What the values are; the head of a chart card.'], ['subtitle', 'The period and the basis: what is measured, and as of when.'],
      ['format', '<code>usd</code> dollar amounts, shortened to $745.6K · $1.2M; <code>count</code> a count (its unit in <code>unit</code>); <code>pct</code> a percentage (changes in pp); <code>days</code> a number of days; <code>eok</code> and <code>krw</code> are Korean won notations (<code>krw</code> writes amounts under 100,000 won in full)'],
      ['decimals', 'Decimal places of the numbers. Left empty, the card decides.'],
      ['better', '<code>up</code>, <code>down</code>, <code>neutral</code>. Says whether more or less is the good direction.'],
      ['labels', 'Period names, the same length as <code>values</code>; use <code>null</code> as the value of a period without one.'],
      ['theme', '<code>dark</code> draws the card on Vizney black with yellow as the first color. Empty is white with blue.'],
      ['lang', '<code>en</code> makes the words the card prints itself English (over, vs, tooltips). Omit it for Korean.'],
      ['label', 'On a control, the name screen readers read. A control draws no title, so always write it.'],
      ['name', 'The <code>detail.name</code> of the events a control sends; it tells which control changed.'],
    ],
    grid: 'Several cards in a row', gridp: 'Cards do not lay themselves out. Give the wrapper a grid and the rows wrap to the width. Keep a chart card at least 340px wide, and give a chart that reads along a long axis two columns or the full width. Every chart card is now 2 units tall (336px), so a mixed row lines up. The controls have no frame, so put them as they are in a filter bar above the charts.', gridNote: 'several chart cards',
    tokensTitle: 'Colors, font and background', tokensP: (tokens) => `Set colors and the font with :root variables; they apply to every card at once. The list is in <a href="${tokens}">tokens.css</a>. For a dark screen, write <code>"theme": "dark"</code> in each card’s JSON.`,
    notesTitle: 'Good to know',
    notes: ['A chart card plays once when it comes into view and stops on its last frame. The motion carries the data, so it plays whatever the reduced-motion setting of the system.', 'When the JSON text inside a card changes, only that card draws again, without playing from the start.', 'A card is a snippet pasted into the HTML as it is. Inserted with innerHTML, its script does not run.'],
    notesAll: (u) => `Every card’s rules and how to connect the controls are in <a href="${u}">llms.txt</a>.`,
    homeTitle: 'Vizney Blocks · Charts in motion and dashboard controls', homeDesc: GDESC.en,
    js: { copied: 'Copied', linkCopied: 'Link copied', promptCopied: 'Prompt copied', toLight: 'Show on light', toDark: 'Show on dark', sub: 'Change only the data (JSON) on the <b>orange lines</b>. Leave the rest as it is.', blocked: 'Copying is blocked here. The code is selected; press Ctrl+C (⌘+C) to copy it.', none: 'No card found.' },
  },
};
const locale = (lang) => {
  const base = lang === 'en' ? '' : '/ko';
  const cs = lang === 'en' ? builtEn : built;
  const vs = cs.flatMap((c) => c.variants);
  return {
    lang, base, cats: cs, variants: vs, charts: vs.filter((v) => !isControl(v)), controls: vs.filter(isControl), guide: GUIDE[lang], blog: BLOG[lang], t: WORDS[lang],
    byId: Object.fromEntries(vs.map((v) => [v.id, v])),
    cat: Object.fromEntries(cs.map((c) => [c.id, c])),
    llms: `${base}/llms.txt`, tokens: `${base}/tokens.css`,
  };
};
const KO = locale('ko'), ENL = locale('en');
const LOCALES = [ENL, KO];

// ---------- Page parts ----------
// Every part takes the locale L (cards, strings, addresses).
// The Vizney logo of the blog header (vizney_logo_w_v2.png, white, with the image's own padding), 3x of its 40px height.
const LOGO = readFileSync(join(root, 'page/vizney-logo.png'));
const FAVICON_V = createHash('sha1').update(readFileSync(join(root, 'page/favicon.png'))).digest('hex').slice(0, 10);
const LOGO_SRC = `/assets/vizney-logo.png?v=${createHash('sha1').update(LOGO).digest('hex').slice(0, 10)}`;
const siteMode = (L) => ({ logo: LOGO_SRC, file: (p) => `/${p}`, llms: L.llms, tokens: L.tokens });
// Card heights in units of 168px: a chart card is 2 units unless TIER says 1 or 1.5, and a control is 0 (bare, the height of the control).
const tierOf = (v) => (isControl(v) ? 0 : v.id in TIER ? TIER[v.id] : 2);
const tierPx = (v) => Math.round(tierOf(v) * 168);

const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/`/g, '');
const esc = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const ext = (href) => `href="${href}" target="_blank" rel="noopener"`;

const IC = {
  search: '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
  sun: '<svg class="ic ic-sun" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/></svg>',
  moon: '<svg class="ic ic-moon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z"/></svg>',
  copy: '<svg class="ic" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.5"/><path d="M9.5 4.5V3A1 1 0 0 0 8.5 2H3A1 1 0 0 0 2 3v5.5a1 1 0 0 0 1 1h1.5"/></svg>',
  prompt: '<svg class="ic" width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h7A1.5 1.5 0 0 1 12 3.5v5A1.5 1.5 0 0 1 10.5 10H6.5L4 12v-2h-.5A1.5 1.5 0 0 1 2 8.5zM4.5 5h5M4.5 7h3"/></svg>',
  link: '<svg class="ic" width="16" height="16" viewBox="0 0 14 14" aria-hidden="true"><path d="M6 8a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 8 2.5l-.5.5M8 6a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 6 11.5l.5-.5"/></svg>',
  down: '<svg class="ic" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5L6 7.5l3-3"/></svg>',
};

// The header is the Vizney blog header (kr.vizney.com · www.vizney.com, Ghost Casper with the Stacked navigation), the
// common header of every Vizney site: Blocks and Styles use the same values, measured on the blog. 768px and up: two rows
// (80px with the globe and search on the left and the logo in the middle, a 1px rule, 56px with the menu); 767px and down:
// one 64px row (logo, globe, search, burger) and a full-screen menu. Only Vizney links in it, in the same tab.
const VIZNEY_NAV = {
  ko: { home: 'https://kr.vizney.com/', items: [['Chart Guide', 'https://kr.vizney.com/chart-guide/'], ['Blocks', 'https://blocks.vizney.com/ko/', true], ['Styles', 'https://styles.vizney.com/?lang=ko'], ['Tips & Tricks', 'https://kr.vizney.com/tips/'], ['Knowledge Base', 'https://kr.vizney.com/kb/'], ['Contact', 'https://kr.vizney.com/contact-us/']], other: 'Switch to English', otherLang: 'en' },
  en: { home: 'https://www.vizney.com/', items: [['Chart Guide', 'https://www.vizney.com/chart-guide/'], ['Blocks', 'https://blocks.vizney.com/', true], ['Styles', 'https://styles.vizney.com/'], ['Tips & Tricks', 'https://www.vizney.com/tips/'], ['Knowledge Base', 'https://www.vizney.com/kb/'], ['Contact', 'https://www.vizney.com/contact-us/']], other: '한글로 보기', otherLang: 'ko' },
};
// The blog's icons: the globe of its language switch, the search of Ghost (20px, stroke 2) and Ghost's "more" dots.
const GLOBE = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
const LOUPE = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>';
const DOTS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="24" height="24" aria-hidden="true"><circle cx="8" cy="16" r="2.667"/><circle cx="16" cy="16" r="2.667"/><circle cx="24" cy="16" r="2.667"/></svg>';
// alt: the same page in the other language (the globe); the 404 page has none and links the English home page.
const header = (m, L, alt) => {
  const N = VIZNEY_NAV[L.lang];
  return `<header class="vz-head" id="top">
<div class="vz-in">
<div class="vz-tools"><a class="vz-icon vz-globe" href="${alt || `${SITE}/`}" hreflang="${N.otherLang}" title="${N.other}" aria-label="${N.other}">${GLOBE}</a><button class="vz-icon vz-search" type="button" aria-label="${L.t.find}" aria-haspopup="dialog" aria-controls="q-dlg">${LOUPE}</button></div>
<a class="vz-logo" href="${N.home}"><img src="${m.logo}" alt="Vizney" width="106" height="40"></a>
<button class="vz-burger" type="button" aria-label="${L.t.menu}" aria-expanded="false" aria-controls="vz-menu"></button>
<nav class="vz-menu" id="vz-menu" aria-label="Vizney"><ul class="vz-nav">
${N.items.map(([t, href, here]) => `<li><a href="${href}"${here ? ' aria-current="true"' : ''}>${h(t)}</a></li>`).join('\n')}
<li class="vz-more" hidden><button type="button" aria-label="${L.t.more}" aria-expanded="false" aria-controls="vz-drop">${DOTS}</button><ul class="vz-drop" id="vz-drop"></ul></li>
</ul></nav>
</div>
</header>
<dialog class="qdlg" id="q-dlg" aria-label="${L.t.find}">
<div class="search">${IC.search}<label class="sr" for="q">${L.t.find}</label><input id="q" type="search" placeholder="${L.t.find}" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="q-pop"><kbd aria-hidden="true">⌘K</kbd></div>
<ul class="search-pop" id="q-pop" role="listbox" aria-label="${L.t.found}" hidden></ul>
</dialog>`;
};

const footer = (m, L) => `<footer class="foot">
<div class="wrap foot-in">
<span>Vizney Blocks ${VERSION} · © 2026 <a ${ext(L.blog)}>Vizney</a> · MIT License</span>
<span>${L.t.footFont} · <a href="${m.file('OFL.txt')}">SIL Open Font License</a></span>
<nav aria-label="${L.t.footNav}"><a ${ext(L.blog)}>${L.t.footBlog}</a><a ${ext(STYLES)}>Vizney Styles</a><a href="${m.llms}">llms.txt</a><a ${ext(REPO)}>GitHub</a><a ${ext(`${L.blog}contact-us/`)}>${L.t.footContact}</a></nav>
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

// Home (v0.45, v0.49): the title area of a Vizney blog category page (title and description, sized from the blog), then a
// gallery of blocks. Each tile holds the live card as it is copied (its head shows the title of the example data); under it
// come the block name with the light/dark switch on its right (v0.53) and two copy buttons, so a button always belongs to the
// block above it. Every tile has the height of a 2-unit card, and a lower block sits in the middle of it.
// v0.52: the controls are drawn bare (no head, no frame) in the middle of the tile, like the units of a motion gallery.
// v0.49: the gallery is built one block at a time. v0.56: the gallery is the whole list; a card that is not here does not exist.
// Blocks that move (data-vzb-loop) replay on the first screen instead of stopping at the end.
const GALLERY = ['bar-overflow', 'waffle-flip', 'bump-race', 'waterfall-walk', 'funnel-wave', 'date-picker', 'range-slider', 'filter-chips', 'download-button'];
const LOOP = new Set(GALLERY);
// v0.53: tile widths follow the block. On the 3-column gallery a chart that reads along a long axis (13 months, a 5 × 20 waffle)
// takes 2 columns; a chart that reads better compact (a donut, a single figure) and every control take 1. The tiles are laid out
// so that rows alternate 2 + 1 and 1 + 2. A wide block left without a partner sits alone; narrow blocks left over go three to a row.
const SPAN = { 'bar-overflow': 2, 'waffle-flip': 2, 'bump-race': 2, 'waterfall-walk': 2, 'funnel-wave': 2 };
const wideOf = (id) => SPAN[id] === 2;
const ORDER = (() => {
  const wide = GALLERY.filter(wideOf), narrow = GALLERY.filter((id) => !wideOf(id)), out = [];
  for (let r = 0; wide.length || narrow.length; r++) {
    if (wide.length && narrow.length) out.push(...(r % 2 ? [narrow.shift(), wide.shift()] : [wide.shift(), narrow.shift()]));
    else if (wide.length) out.push(wide.shift());
    else out.push(...narrow.splice(0, 3));
  }
  return out;
})();
// The title area: the title and the description at the left, two buttons at the right (laid out as on Vizney Styles).
// Sponsor is the yellow one and opens GitHub Sponsors; Copy AI link copies the address of llms.txt (without scripts it is a plain
// link to that file). SPONSOR stays empty until the Sponsors profile is live: while it is empty the button is not drawn.
const SPONSOR = 'https://github.com/sponsors/yehwanhwang';
const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 20.5 3.6 12.3a5 5 0 0 1 7.1-7.1L12 6.5l1.3-1.3a5 5 0 0 1 7.1 7.1z"/></svg>';
const galleryHead = (L) => `<section class="wrap ghead" aria-labelledby="ghead-title">
<div class="ghead-copy">
<h1 id="ghead-title">${L.t.gTitle}</h1>
<p>${L.t.gDesc}</p>
</div>
<div class="ghead-acts">
${SPONSOR ? `<a class="btn is-primary is-lg" href="${SPONSOR}" target="_blank" rel="noopener">${L.t.sponsor}${HEART}</a>\n` : ''}<a class="btn is-lg" href="${L.base}/llms.txt" data-act="copy-llms">${L.t.aiCopy}</a>
</div>
</section>`;
const gallery = (m, L) => `<section class="wrap gal" id="cards" aria-label="${L.t.gAria}">
<ul class="gal-grid">
${ORDER.map((id) => {
    const v = L.byId[id];
    return `<li class="gt is-dark${tierOf(v) === 0 ? ' is-bare' : ''}${wideOf(id) ? ' is-wide' : ''}" id="${id}" data-gal="${id}" aria-labelledby="gt-${id}">
<div class="gt-box"><div class="gt-in">
<div class="gt-pv" data-mount="${id}"${LOOP.has(id) ? ' data-vzb-loop' : ''} style="min-height:${tierPx(v)}px"></div>
</div></div>
<div class="gt-meta"><span class="gt-name" id="gt-${id}">${h(v.name)}</span><button type="button" class="gt-theme" data-act="theme" data-id="${id}" aria-label="${L.t.toLight}" title="${L.t.toLight}">${IC.sun}${IC.moon}</button></div>
<div class="gt-acts"><button type="button" class="btn" data-act="copy-prompt" data-id="${id}" aria-label="${h(v.name)} ${L.t.tPrompt}">${IC.prompt}<span>${L.t.tPrompt}</span></button><button type="button" class="btn" data-act="copy-code" data-id="${id}" aria-label="${h(v.name)} ${L.t.tCode}">${IC.copy}<span>${L.t.tCode}</span></button></div>
</li>`;
  }).join('\n')}
</ul>
</section>`;
if (GALLERY.length !== variants.length || GALLERY.some((id) => !KO.byId[id])) throw new Error('build.mjs: GALLERY must list every card in meta.json, and only those');

// How to use, under the gallery: four steps, then the common fields with layout, colors and a few things to know.
const usage = (m, L) => `<section class="wrap sec" id="usage" aria-labelledby="usage-title">
<div class="sec-hd"><div><h2 id="usage-title">${L.t.usageTitle}</h2><p>${L.t.usageSub}</p></div></div>
<ol class="steps">
<li class="step"><span class="num" aria-hidden="true">1</span><h3>${L.t.step1}</h3><p>${L.t.step1p}</p><pre class="snip">&lt;div class="vzb-card"
  data-vzb="${GALLERY[0]}"&gt;
  …
&lt;/div&gt;</pre></li>
<li class="step"><span class="num" aria-hidden="true">2</span><h3>${L.t.step2}</h3><p>${L.t.step2p}</p><pre class="snip">${L.t.step2code}</pre></li>
<li class="step"><span class="num" aria-hidden="true">3</span><h3>${L.t.step3}</h3><p>${L.t.step3p}</p><pre class="snip">${L.t.step3code}</pre></li>
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
<h3 class="fields-sub">${L.t.tokensTitle}</h3>
<p>${L.t.tokensP(m.tokens)}</p>
<pre class="snip">:root {
  --vzb-primary: #5856d6;
  --vzb-font: 'Pretendard';
}</pre>
<h3 class="fields-sub">${L.t.notesTitle}</h3>
<ul class="fields-rules">
${L.t.notes.map((x) => `<li>${x}</li>`).join('\n')}
</ul>
<p>${L.t.notesAll(`${SITE}${L.base}/llms.txt`)}</p>
</div>
</div>
</details>
</section>`;

// Copy prompt (v0.44): what a chat AI that cannot open links needs to draw with one card, in one paste. The head below goes in
// front of the card code: the request with a place for the user's content, how to use the card, when to use it and its rules
// (meta.json, as on the card), and the fields (the keys of the example JSON; common fields carry a short note). site.js adds the
// card code as it is shown on the tile, so the background picked there (theme) is kept.
const FIELD_NOTE = {
  ko: {
    title: '무엇의 값인지', subtitle: '기간과 기준', format: 'krw 원 단위 숫자 · eok 억 단위 숫자 · usd 달러 금액 · count 개수(단위는 unit) · pct 퍼센트 숫자(3.4는 3.4%) · days 일수',
    unit: 'count의 단위', decimals: '소수 자릿수. 비우면 카드가 정함', better: 'up · down · neutral, 어느 쪽이 좋은지',
    labels: '기간 이름. 값과 같은 길이로 적고, 값이 없는 기간의 값은 null', lang: 'en이면 카드가 직접 적는 문구가 영어. 비우면 한국어',
  },
  en: {
    title: 'what the values are', subtitle: 'the period and the basis', format: 'usd dollar amounts · count a count (its unit in unit) · pct a percentage (3.4 is 3.4%) · days a number of days · eok and krw are Korean won notations',
    unit: 'the unit of a count', decimals: 'decimal places; empty lets the card decide', better: 'up · down · neutral: which direction is good',
    labels: 'period names, the same length as the values; null for a period without a value', lang: 'en: the words the card prints itself in English; empty is Korean',
  },
};
// Cards whose fields mean something other than the common note.
const FIELD_OVERRIDE = {
  'bar-overflow': {
    ko: { title: '무엇의 값인지(예: 월별 광고비)', subtitle: '기간과 한도의 기준(예: 2025년 11월–2026년 11월, 월 예산 4,000만 원 대비)', limit: '모든 기간에 같은 한도(숫자 하나)', limitLabel: '한도선의 이름(예: 예산 · 처리 용량). 비우면 한도', labels: '기간 이름. 월별 추이는 13개월', values: '기간마다의 값(labels와 같은 개수)' },
    en: { title: 'what the values are (e.g. Monthly Ad Spend)', subtitle: 'the period and the basis of the limit (e.g. Nov 2025 – Nov 2026, against a $40K monthly budget)', limit: 'one limit for every period (a single number)', limitLabel: 'the name of the line (e.g. Budget, Capacity); Limit when empty', labels: 'the period names; 13 months for a monthly trend', values: 'the value of each period (as many as labels)' },
  },
  'waffle-flip': {
    ko: { title: '무엇의 비중인지(예: 시장 점유율)', subtitle: '기준과 두 기간(예: 판매 대수 기준, 2025년 → 2026년)', periods: '[앞 기간, 뒤 기간]의 이름. 하나만 적으면 그 기간의 칸만 그린다', focus: '짚을 항목의 이름. 비우면 첫 항목', items: '항목 2~4개. 항목마다 name과 values([앞 기간 값, 뒤 기간 값], 비중이 아니라 원래 값)' },
    en: { title: 'what the shares are of (e.g. Market Share)', subtitle: 'the basis and the two periods (e.g. by units sold, 2025 → 2026)', periods: 'the names of [the earlier period, the later period]; with one, the card draws that period only', focus: 'the name of the item to point at; the first item when empty', items: '2 to 4 items, each with name and values ([earlier value, later value], raw values, not shares)' },
  },
  'bump-race': {
    ko: { title: '무엇의 순위인지(예: 판매 순위)', subtitle: '순위의 기준과 기간(예: 월별 판매 수량 순위, 2025년 11월 – 2026년 11월)', labels: '기간 이름. 월별 추이는 13개월', focus: '짚을 항목의 이름. 비우면 첫 항목', items: '항목 2~8개. 항목마다 name과 values(기간마다의 값, labels와 같은 개수. 값이 없는 기간은 null)', better: 'up(비우면, 큰 값이 1위) · down(작은 값이 1위)' },
    en: { title: 'what is ranked (e.g. Top Sellers)', subtitle: 'the basis of the rank and the period (e.g. monthly rank by units sold, Nov 2025 – Nov 2026)', labels: 'the period names; 13 months for a monthly trend', focus: 'the name of the item to follow; the first item when empty', items: '2 to 8 items, each with name and values (one per period, as many as labels; null for a period without a value)', better: 'up (default: the largest value ranks 1) or down (the smallest value ranks 1)' },
  },
  'waterfall-walk': {
    ko: { title: '무엇의 값인지(예: 회원 수)', subtitle: '무엇을 보는지와 두 지점(예: 무엇이 늘리고 줄였나, 연초 → 연말)', items: '읽는 순서대로 적은 항목. 첫 항목은 시작 값({ name, value }), 증감 항목은 { name, value }(늘면 +, 줄면 -, 값이 없으면 null), 그때까지의 누계를 세울 자리(끝이나 중간 합계)에는 { name, total: true }(값은 카드가 계산한다). 이름은 막대 끝에 적으므로 짧게', compare: '끝 막대의 말풍선에 적을 것. 비우면 첫 항목 대비 증감, share면 첫 항목의 몇 %인지(손익의 이익률처럼)', better: 'up(비우면, 늘린 항목이 초록) · down(줄인 항목이 초록) · neutral(증감을 모두 첫째 색으로)' },
    en: { title: 'what the values are (e.g. Members)', subtitle: 'what it shows and the two points (e.g. What changed it, Jan 1 → Dec 31)', items: 'the items in reading order: the first is the starting value ({ name, value }), a change is { name, value } (+ up, - down, null when it has no value), and { name, total: true } stands a running total at that point, at the end or as a subtotal (the card computes its value). Names are printed at the bar ends, so keep them short', compare: 'what the callout on the end bar adds: empty for the change against the first item, share for its share of the first item (like a margin on an income statement)', better: 'up (default: items that raise the value are green) · down (items that lower it are green) · neutral (every change in the first color)' },
  },
  'funnel-wave': {
    ko: { title: '무엇의 퍼널인지(예: 영업 퍼널)', subtitle: '처음 · 끝 단계와 기간(예: 리드에서 계약까지, 2026년 3분기)', items: '단계 2~6개를 순서대로. 단계마다 name과 value(그 단계까지 온 수). 첫 단계 대비 비율 · 단계별 전환율 · 전체 전환율은 카드가 계산한다. 이름은 단계 칸 아래에 적으므로 짧게', unit: '값 뒤에 붙는 말(예: 건)' },
    en: { title: 'what the funnel is (e.g. Sales Funnel)', subtitle: 'the first and last stages and the period (e.g. From lead to won deal, Q3 2026)', items: '2 to 6 stages in order, each with name and value (how many reached that stage); the card computes the share of the first stage, the stage-to-stage conversion rates and the overall conversion. Names sit under the stage cells, so keep them short', unit: 'the word after the values (e.g. people)' },
  },
  'date-picker': {
    ko: { label: '화면 낭독기가 읽는 이름(예: 주문일). 화면에는 그리지 않는다', name: '값이 바뀔 때 보내는 vzb-change 이벤트의 detail.name', min: '데이터가 있는 첫날(YYYY-MM-DD). 그 앞은 고를 수 없다', max: '데이터가 있는 마지막 날(YYYY-MM-DD). 빠른 선택의 기준일이고, 비우면 오늘이 기준일', value: '처음 기간 ["시작", "끝"](YYYY-MM-DD, 끝일 포함). 비우면 기준일까지 30일', presets: '빠른 선택 칩: last7 · last30 · month · lastmonth · quarter · year · all 가운데 세 개 안팎', mode: '날짜 하나를 고를 때만 "day"(value도 날짜 하나)', align: '화면 오른쪽 끝에 둘 때 "end"' },
    en: { label: 'the name screen readers read (e.g. Order date); not drawn on screen', name: 'detail.name of the vzb-change event sent when the value changes', min: 'the first date with data (YYYY-MM-DD); earlier dates cannot be picked', max: 'the last date with data (YYYY-MM-DD); the reference date of the quick picks, today when empty', value: 'the starting period ["start", "end"] (YYYY-MM-DD, end included); empty means the 30 days up to the reference date', presets: 'quick-pick chips: about three of last7, last30, month, lastmonth, quarter, year, all', mode: '"day" only to pick a single date (value is then one date)', align: '"end" when it sits at the right end of the screen' },
  },
  'range-slider': {
    ko: { label: '화면 낭독기가 읽는 이름(예: 주문 금액). 화면에는 그리지 않는다', name: '값이 바뀔 때 보내는 vzb-change 이벤트의 detail.name', min: '고를 수 있는 가장 작은 값', max: '고를 수 있는 가장 큰 값', step: '한 칸의 크기. 비우면 범위를 100칸쯤으로 나눈다', value: '[시작, 끝]. 비우면 전체 범위', counts: 'min~max를 같은 폭으로 나눈 칸마다의 개수(분포 막대). 없어도 된다', noun: '개수 뒤에 붙는 말(예: 건). 비우면 행' },
    en: { label: 'the name screen readers read (e.g. order value); not drawn on screen', name: 'detail.name of the vzb-change event sent when the value changes', min: 'the smallest value that can be picked', max: 'the largest value that can be picked', step: 'the size of one step; empty splits the range into about 100 steps', value: '[start, end]; empty is the whole range', counts: 'the number of records in each equal-width bin from min to max (the distribution bars); optional', noun: 'the word after the count (e.g. orders); rows when empty' },
  },
  'filter-chips': {
    ko: { label: '화면 낭독기가 읽는 칩 묶음의 이름(예: 채널). 화면에는 그리지 않는다', name: '값이 바뀔 때 보내는 vzb-change 이벤트의 detail.name', options: '고를 항목의 이름들. 8개 안팎', value: '처음 고른 항목들. 비우면 모두', all: '전체 칩의 이름. 비우면 전체, 빈 글자면 전체 칩을 두지 않는다' },
    en: { label: 'the name screen readers read for the chips (e.g. Channel); not drawn on screen', name: 'detail.name of the vzb-change event sent when the value changes', options: 'the names of the items to pick, about 8', value: 'the items picked at first; empty picks all', all: 'the name of the All chip; empty means All, an empty string leaves the chip out' },
  },
  'download-button': {
    ko: { name: 'vzb-download 이벤트의 detail.name', target: '내려받을 카드의 data-vzb(예: bar-overflow). 페이지에서 처음 만나는 그 카드', filename: '파일 이름. 확장자는 형식에 따라 붙는다(예: monthly-ad-spend)', formats: '받을 형식들: csv · json · png. 비우면 셋 다', label: '화면 낭독기가 읽는 단추 이름(예: 월별 광고비 내려받기). 비우면 내려받기', align: 'start(비우면) · end. end면 아이콘을 놓인 자리의 오른쪽 끝에 두고 왼쪽으로 펼친다' },
    en: { name: 'detail.name of the vzb-download event', target: 'the data-vzb of the card to download (e.g. bar-overflow); the first such card on the page', filename: 'the file name; the extension follows the format (e.g. monthly-ad-spend)', formats: 'the formats: csv, json, png; empty means all three', label: 'the name screen readers read for the button (e.g. Download monthly ad spend); Download when empty', align: 'start (default) or end; end puts the icon at the right end of its slot and opens to the left' },
  },
};
const promptHead = (v, L) => {
  const en = L.lang === 'en';
  const keys = Object.keys(JSON.parse(r(vp(v.id, en ? 'en.json' : 'json'))));
  const N = FIELD_NOTE[L.lang];
  const O = (FIELD_OVERRIDE[v.id] || {})[L.lang] || {};
  const noted = keys.filter((k) => O[k] || N[k]).map((k) => `- ${k}: ${O[k] || N[k]}`);
  Object.keys(O).filter((k) => !keys.includes(k)).forEach((k) => noted.push(`- ${k}: ${O[k]}`));   // fields the example leaves out
  noted.push(en ? '- theme: optional; dark draws the card on Vizney black with yellow as the first color, empty is white' : '- theme: dark면 Vizney 검정 바탕에 노랑을 첫째 색으로 그린다. 비우면 흰 바탕');
  const rules = v.rules.map((x) => `- ${plain(x)}`).join('\n');
  return en ? `Draw the following with the Vizney Blocks card below (${v.name}).

[Write what to draw here: what the values are, the period, the values]

How to use
- Paste the card code at the bottom as it is inside <body> and change only the values in <script type="application/json">. Do not edit <style> or <script>.
- Give amounts as raw values. The amount over a limit, shares, ranks, changes and totals are computed by the card, so do not write them in the JSON.
- To use the same card several times, paste the whole card code again and change each JSON.
- If the values are not given above, ask for them first; do not make them up.

When to use this card
- ${plain(v.when)}

Rules and reasons
${rules}

Values to change (JSON)
- The keys of the example JSON in the card code are the reference: ${keys.join(', ')}
${noted.join('\n')}
- Add a field the example lacks only when it is named above.

If this card does not fit, pick another one: ${SITE}/llms.txt

--- Card code (Vizney Blocks ${VERSION} · MIT) ---
` : `아래 Vizney Blocks 카드(${v.name})로 다음 내용을 그려 줘.

[여기에 그릴 내용을 적으세요: 무엇의 값인지, 기간, 값]

쓰는 법
- 맨 아래 카드 코드를 그대로 <body> 안에 붙이고, <script type="application/json">의 값만 바꾼다. <style>과 <script>는 고치지 않는다.
- 금액은 가공하지 않은 원래 값으로 넣는다. 넘친 양, 비중, 순위, 증감, 합계는 카드가 계산하므로 JSON에 적지 않는다.
- 같은 카드를 여러 장 쓰면 카드 코드 전체를 다시 붙이고 JSON만 각각 바꾼다.
- 위에 값이 없으면 지어내지 말고 먼저 물어본다.

이 카드를 쓰는 때
- ${plain(v.when)}

규칙과 이유
${rules}

바꿀 값(JSON)
- 카드 코드 안 예시 JSON의 키가 기준이다: ${keys.join(', ')}
${noted.join('\n')}
- 예시에 없는 필드는 위에 적힌 것만 더한다.

이 카드가 맞지 않으면 다른 카드를 고른다: ${SITE}/ko/llms.txt

--- 카드 코드 (Vizney Blocks ${VERSION} · MIT) ---
`;
};

// Page data for site.js: the search index (each card leads to its tile on the home page), the words site.js prints, and the
// code and the prompt head of the cards this page shows.
const data = (ids, L) => `<script>window.VZB = ${esc({
  site: SITE,
  base: L.base,
  t: L.t.js,
  index: GALLERY.map((id) => L.byId[id]).map((v) => ({ id: v.id, name: v.name, catName: L.cat[v.cat].name, when: plain(v.when), url: `${L.base}/#${v.id}` })),
  code: Object.fromEntries(ids.map((id) => [id, L.byId[id].code])),
  prompt: Object.fromEntries(ids.map((id) => [id, promptHead(L.byId[id], L)])),
})};</script>`;

// ---------- Site pages (docs/) ----------
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// alt: the same page in the other language, for the hreflang links (English is the default for other languages).
const head = ({ title, desc, path, extra = '', L = KO, alt }) => `<!doctype html>
<html lang="${L.t.html}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${attr(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${SITE}${path}">
${alt ? `<link rel="alternate" hreflang="${L.lang}" href="${SITE}${path}">\n<link rel="alternate" hreflang="${L.t.other.lang}" href="${SITE}${alt}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${L.lang === 'en' ? path : alt}">\n` : ''}<link rel="icon" href="/favicon.png?v=${FAVICON_V}" type="image/png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${FAVICON_V}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vizney Blocks">
<meta property="og:locale" content="${L.t.og}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/${L.lang === 'ko' ? 'og-ko.png' : 'og.png'}">
<meta name="twitter:card" content="summary_large_image">
${extra}</head>`;
// Asset versions are filled in once the font is built (the font depends on every character the pages use).
const assets = '<link rel="preload" href="/assets/fonts/vz-sans-400.woff?v=__FONT_V__" as="font" type="font/woff" crossorigin>\n<link rel="stylesheet" href="/assets/site.css?v=__CSS_V__">\n';
const sitePage = ({ title, desc, path, body, ids, robots, L, alt }) => {
  const m = siteMode(L);
  return `${head({ title, desc, path, L, alt, extra: (robots ? `<meta name="robots" content="${robots}">\n` : '') + assets })}
<body>
${skip(L)}
${header(m, L, alt)}
${body}
${footer(m, L)}
${dialog(L)}
${data(ids, L)}
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
    ids: GALLERY,
    body: `<main id="main">
${galleryHead(L)}
${gallery(m, L)}
${usage(m, L)}
</main>`,
  });
}
// GitHub Pages serves one 404 page for every address, so it is English (the main site) with a Korean line. Addresses of the
// cards and chart pages removed in v0.56 land here.
pages['404.html'] = sitePage({
  title: 'Page not found · Vizney Blocks',
  desc: ENL.t.homeDesc,
  path: '/404.html',
  robots: 'noindex',
  ids: [],
  L: ENL,
  body: `<main id="main" class="wrap hero lost">
<p class="eyebrow">404</p>
<h1>Page not found</h1>
<p class="lede">The address may have changed, or the page is gone. Every card is on the home page.</p>
<div class="cta"><a class="btn is-primary is-lg" href="/">See the cards</a></div>
<p class="hint" lang="ko">페이지를 찾을 수 없습니다. 주소가 바뀌었거나 없어진 페이지입니다. 카드는 모두 <a href="/ko/">한국어 첫 화면</a>에 있습니다.</p>
</main>`,
});

const siteCss = r('page/site.css').trim();
const siteJs = r('page/site.js').trim();

// ---------- Font: every character a page or a card can render, plus digits and number signs ----------
mkdirSync(join(root, 'build'), { recursive: true });
const chars = new Set([...Object.values(pages), siteJs].join('').replace(/\\u003c/g, '<'));
for (const c of '0123456789.,+-–%()[]/:·×…→←↑↓↗ ') chars.add(c);
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

// ---------- docs/: the public site ----------
const docs = join(root, 'docs');
rmSync(docs, { recursive: true, force: true });
mkdirSync(join(docs, 'cards'), { recursive: true });
mkdirSync(join(docs, 'ko/cards'), { recursive: true });
mkdirSync(join(docs, 'assets/fonts'), { recursive: true });
const fontV = hash(Buffer.concat(W.map((w) => woff[w])));
for (const w of W) writeFileSync(join(docs, `assets/fonts/vz-sans-${w}.woff`), woff[w]);
const cssOut = `${face((w) => `url(fonts/vz-sans-${w}.woff?v=${fontV})`)}\n${siteCss}\n`;
writeFileSync(join(docs, 'assets/site.css'), cssOut);
writeFileSync(join(docs, 'assets/site.js'), `${siteJs}\n`);
writeFileSync(join(docs, 'assets/vizney-logo.png'), LOGO);
const V = { __FONT_V__: fontV, __CSS_V__: hash(cssOut), __JS_V__: hash(siteJs) };
for (const [path, html] of Object.entries(pages)) {
  mkdirSync(dirname(join(docs, path)), { recursive: true });
  writeFileSync(join(docs, path), html.replace(/__(FONT|CSS|JS)_V__/g, (k) => V[k]));
}

// One page per card (the snippet on a plain background, for embedding) and the same snippet as plain text for AI tools:
// English at /cards/<id>.html and .txt, Korean at /ko/cards/.
const cardCss = `<style>body{margin:0;background:#eef0f4;font:14px/1.6 'Spoqa Han Sans Neo','Noto Sans KR',sans-serif;color:#4a4a4a}main{box-sizing:border-box;max-width:var(--w,640px);margin:0 auto;padding:40px 16px 24px}p{margin:16px 2px 0;font-size:13px}a{color:#1b1b1b}</style>\n`;
for (const L of LOCALES) {
  const other = L.lang === 'ko' ? ENL : KO;
  for (const c of L.cats) {
    for (const v of c.variants) {
      const path = `${L.base}/cards/${v.id}.html`;
      writeFileSync(join(docs, L.base, 'cards', `${v.id}.txt`), v.code);
      writeFileSync(join(docs, path), `${head({ title: `${v.name} · Vizney Blocks`, desc: `${c.name} · ${v.name}. ${plain(v.when)}`, path, L, alt: `${other.base}/cards/${v.id}.html`, extra: cardCss })}
<body>
<main style="--w:640px">
${v.code}
<p><a href="${L.base}/#${v.id}">Vizney Blocks</a> · <a href="${v.id}.txt">${L.t.codeText}</a> · ${NOTICE}</p>
</main>
</body>
</html>
`);
    }
  }
}

// ---------- How to use the cards: shared by llms.txt and the skill, in both languages, so they never disagree ----------
const GRID = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px';
const namesOf = (vs) => vs.map((v) => v.name).join(' · ');
// Chart card heights by unit, from TIER.
const HEIGHTS = (lang) => {
  const by = {};
  for (const v of KO.charts) (by[tierOf(v)] = by[tierOf(v)] || []).push(v.name);
  const units = Object.keys(by).map(Number).sort((a, b) => a - b);
  if (units.length === 1) return lang === 'en' ? `every chart card is now ${units[0]} units (${units[0] * 168}px)` : `지금 있는 차트 카드는 모두 ${units[0]}단위(${units[0] * 168}px)다`;
  const low = units.filter((u) => u !== 2);
  return lang === 'en' ? `${low.map((u) => `${by[u].join(' · ')} ${u === 1 ? '1 unit' : `${u} units`}`).join(', ')}, the other chart cards 2 units` : `${low.map((u) => `${by[u].join(' · ')} ${u}단위`).join(', ')}, 나머지 차트 카드는 2단위다`;
};
// from: where the card code came from; at: where each card's own rules are.
const RULES = (from, at, lang = 'ko') => (lang === 'en' ? [
  `Paste the card code ${from} as it is and change only the JSON values. Do not edit the styles or the script. To use the same card several times, paste the whole card code again and change each JSON.`,
  `A card fills the width of its slot. A chart card is 1, 1.5 or 2 units tall (1 unit = 168px, --vzb-unit), and ${HEIGHTS('en')}. The controls (${namesOf(ENL.controls)}) draw only the control, with no card head or frame, at the height of the control itself. Their background is left empty, so set "theme" to match where they sit ("dark" on a dark background).`,
  `For several cards, give the wrapper a grid: ${GRID}. Keep a chart card at least 340px wide. A chart that reads along a long axis (13 months of bars, the 20 cells across a waffle, rank lines) reads better with two columns or the full width. Put the controls as they are in a filter bar above the charts or in the page header.`,
  `Change colors and the font with the --vzb-* variables on :root (--vzb-primary, --vzb-font, …). The variable list and what each one does are in ${SITE}/tokens.css (the same content as the :where(:root) block in the card code). The background is picked per card with "theme" in its JSON: empty is white with blue as the first data color, "dark" is Vizney black with yellow as the first data color.`,
  `Common fields: title (what the values are), subtitle (the period and the basis), format (usd dollar amounts, shortened to $745.6K · $1.2M · count a count, with its unit in unit · pct a percentage (3.4 is 3.4%), changes in pp · days a number of days · eok and krw are Korean won notations), decimals (decimal places; empty lets the card decide), better (up · down · neutral), labels (period names, the same length as the values; null for a period without a value), lang (en: the words the card prints itself in English), theme. Controls: label (the name screen readers read; not drawn on screen) and name (detail.name of the control's events). Each card's own fields are in the example JSON of its code and ${at}.`,
  'The amount over a limit, shares, ranks, changes and totals are computed by the card, so do not write them in the JSON. Give amounts as raw values, not rounded or divided into thousands or millions.',
  'A chart card plays once when it comes into view and stops on its last frame. The still frame reads correctly by itself. The motion carries the data, so cards play whatever the reduced-motion setting of the system; mouse-over and keyboard focus pause them, and a replay button or player sits on the card. A wrapper with data-vzb-loop makes the card repeat; a card that keeps moving makes its neighbours hard to read, so use that only on a showcase such as a gallery.',
  'A card is a snippet pasted into the HTML document as it is. Inserted with innerHTML or React\'s dangerouslySetInnerHTML, the card\'s <script> does not run.',
] : [
  `${from} 카드 코드를 그대로 붙여 넣고 JSON 값만 바꾼다. 스타일과 스크립트는 고치지 않는다. 같은 카드를 여러 장 쓸 때는 카드 코드를 통째로 다시 붙여 넣고 각 JSON만 바꾼다.`,
  `카드는 놓인 자리의 폭을 채운다. 차트 카드의 높이는 1 · 1.5 · 2단위(1단위 168px, --vzb-unit) 가운데 하나이고, ${HEIGHTS('ko')}. 컨트롤(${namesOf(KO.controls)})은 카드 머리와 틀 없이 조작부만 그리고, 높이는 조작부 자체의 높이다. 바탕을 비워 두므로 theme은 놓을 자리의 바탕에 맞춘다(어두운 바탕이면 "dark").`,
  `여러 장은 감싸는 요소에 격자를 준다: ${GRID}. 차트 카드는 340px보다 좁히지 않는다. 가로로 길게 읽는 차트(13개월 막대, 가로 20칸 와플, 순위 선)는 두 칸이나 전체 폭을 주면 더 잘 읽힌다. 컨트롤은 차트 위 필터 줄이나 머리글에 그대로 놓는다.`,
  `색과 글꼴은 :root의 --vzb-* 변수(--vzb-primary, --vzb-font 등)로 바꾼다. 변수 목록과 쓰임은 ${SITE}/ko/tokens.css 에 있다(카드 코드의 :where(:root) 블록과 같은 내용). 바탕은 카드마다 JSON의 theme으로 고른다. 비우면 흰 바탕에 파랑이 첫째 데이터 색이고, "dark"면 Vizney 검정 바탕에 노랑이 첫째 데이터 색이다.`,
  `공통 필드: title(무엇의 값인지), subtitle(기간과 기준), format(krw 원 단위 숫자를 만·억·조로 줄여 적음. 10만 원 미만은 87,324원처럼 원 단위 그대로 · eok 억 단위 숫자 · usd 달러 금액을 $745.6K·$1.2M처럼 · count 개수, 단위는 unit · pct 퍼센트 숫자(3.4는 3.4%), 증감은 %p · days 일수), decimals(소수 자릿수, 비우면 카드가 정함), better(up · down · neutral), labels(기간 이름, 값과 같은 길이. 값이 없는 기간은 값을 null로), lang(en이면 카드가 직접 적는 문구가 영어), theme. 컨트롤: label(화면 낭독기가 읽는 이름. 화면에는 그리지 않음), name(컨트롤이 보내는 이벤트의 detail.name). 카드마다의 필드는 카드 코드의 예시 JSON과 ${at}에 있다.`,
  '넘친 양, 비중, 순위, 증감, 합계는 카드가 계산하므로 JSON에 적지 않는다. 금액은 미리 반올림하거나 천·백만 단위로 나누지 않고 원래 값을 넣는다.',
  '차트 카드는 화면에 보이면 한 번 재생하고 마지막 장면에서 멈춘다. 멈춘 장면만으로 바르게 읽힌다. 움직임이 데이터의 뜻이라 운영체제의 동작 줄이기 설정과 상관없이 재생하고, 마우스를 올리거나 키보드로 포커스하면 잠시 멈추며, 다시 보기 단추나 재생 단추를 둔다. 감싼 요소에 data-vzb-loop를 붙이면 되풀이하지만, 계속 움직이는 카드는 옆 카드를 읽기 어렵게 하므로 갤러리 같은 전시 화면에만 쓴다.',
  '카드는 HTML 문서에 그대로 붙이는 조각이다. innerHTML이나 React의 dangerouslySetInnerHTML로 넣으면 카드의 <script>가 실행되지 않는다.',
]);
// Connecting controls and charts: the page script between them. The example is the one the plugin preview runs (DEMO below).
const CONNECT = {
  ko: {
    title: '컨트롤과 차트 잇기',
    intro: '컨트롤과 차트는 서로를 모른다. 페이지의 짧은 스크립트가 컨트롤의 이벤트를 받아 차트 카드의 JSON을 바꿔 적는다.',
    list: [
      '컨트롤은 값이 바뀔 때마다 카드에서 `vzb-change` 이벤트를 보낸다(위로 전달되므로 `document`에서 받는다). `detail`은 `{ name, value }`이고 `name`은 그 컨트롤 JSON의 `name`이다. Date Picker의 `value`는 `["시작", "끝"]` 날짜 글자(YYYY-MM-DD, 끝일 포함), Range Slider의 `value`는 `[시작, 끝]` 숫자, Filter Chips의 `value`는 고른 항목을 `options` 순서대로 담은 배열이다. 지금 값은 카드의 `data-vzb-value` 속성에도 JSON으로 적혀 있다.',
      '컨트롤은 처음 그릴 때는 이벤트를 보내지 않는다. 컨트롤의 `value`와 차트의 JSON을 처음부터 같은 조건으로 적는다.',
      '차트 카드는 안의 `<script type="application/json">` 글자가 바뀌면 그 카드만 다시 그린다. 페이지가 거르기 전의 전체 데이터를 들고 있다가, 이벤트를 받으면 거른 결과로 차트의 JSON을 만들어 바꿔 적는다. 다시 그린 카드는 처음부터 재생하지 않고 마지막 장면을 바로 그리며, 보는 사람이 고른 기간과 항목은 그대로 둔다.',
      '걸러서 남은 것이 없으면 빈 배열을 준다. Bar Overflow는 `"labels": []`, Waffle Flip · Bump Race · Waterfall Walk · Funnel Wave는 `"items": []`이면 오류 대신 빈 화면을 그린다.',
      '같은 종류의 카드를 두 장 쓰면 카드마다 id를 준 요소로 감싸고 그 id로 가려 쓴다(아래 예시의 `#spend`).',
      'Download Button은 `target`에 적은 종류(`data-vzb`)의 카드 가운데 페이지에서 처음 만나는 카드의 지금 JSON을 받는다. 그래서 컨트롤로 거른 뒤의 값이 그대로 내려간다. 받기 전에 `vzb-download` 이벤트(`detail: { name, target, format, filename, rows }`)를 보내고, 페이지가 `preventDefault()`를 부르면 파일을 만들지 않으므로 서버에서 원본을 받는 화면도 같은 단추를 쓸 수 있다.',
    ],
    code: `<div><!-- Filter Chips 카드 코드: "name": "channel" --></div>
<div id="spend"><!-- Bar Overflow 카드 코드 --></div>
<script>
// 페이지가 들고 있는 전체 데이터: 기간 이름과, 채널마다의 월별 값
const LABELS = ['25.11', '25.12', '26.01'];
const SPEND = { SNS: [8600000, 16200000, 9700000], 검색: [9500000, 10300000, 10100000] };
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // 고른 채널들
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // 고른 것이 없으면 빈 배열: 카드가 빈 화면을 그린다
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  src.textContent = JSON.stringify(d);   // 글자가 바뀌면 카드가 다시 그린다
});
</script>`,
  },
  en: {
    title: 'Connecting controls and charts',
    intro: 'Controls and charts do not know each other. A short page script takes a control\'s event and rewrites the chart card\'s JSON.',
    list: [
      'A control sends a `vzb-change` event from its card whenever its value changes (it bubbles, so listen on `document`). `detail` is `{ name, value }`, where `name` is the `name` in that control\'s JSON. Date Picker\'s `value` is `["start", "end"]` as date strings (YYYY-MM-DD, the end date included); Range Slider\'s `value` is `[from, to]` as numbers; Filter Chips\' `value` is the picked items in the order of `options`. The current value is also on the card, as JSON in its `data-vzb-value` attribute.',
      'A control sends nothing when it first draws. Write the control\'s `value` and the chart\'s JSON for the same starting condition.',
      'A chart card redraws by itself when the text of its `<script type="application/json">` changes. The page keeps the full data; on an event it filters the data, builds the chart\'s JSON from the result and writes it back. The redrawn card does not play from the start: it draws its last frame at once and keeps the period and the item the viewer picked.',
      'When the filter leaves nothing, give an empty array. Bar Overflow draws an empty state for `"labels": []`, and Waffle Flip, Bump Race, Waterfall Walk and Funnel Wave for `"items": []`, instead of an error.',
      'With two cards of the same kind on a page, wrap each in an element with an id and address it through that id (`#spend` in the example).',
      'Download Button downloads the current JSON of the first card on the page whose `data-vzb` is its `target`, so the file holds what the controls left on screen. Before that it sends a `vzb-download` event (`detail: { name, target, format, filename, rows }`); if the page calls `preventDefault()`, the card makes no file, so a screen that gets the source data from a server can use the same button.',
    ],
    code: `<div><!-- the Filter Chips card code, with "name": "channel" --></div>
<div id="spend"><!-- the Bar Overflow card code --></div>
<script>
// The full data the page holds: the period names and the monthly values of each channel.
const LABELS = ["Nov '25", "Dec '25", "Jan '26"];
const SPEND = { Social: [8600, 16200, 9700], Search: [9500, 10300, 10100] };
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // the channels picked
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // nothing picked: an empty array, and the card draws its empty state
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  src.textContent = JSON.stringify(d);   // the card redraws when this text changes
});
</script>`,
  },
};

// llms.txt: what the cards are, how to use them, every card with its plain-text code address and rules, and how to connect
// controls to charts. One per language.
const txt = (id, L) => `${SITE}${L.base}/cards/${id}.txt`;
const cardLine = (v, L) => { const c = L.cat[v.cat]; return `- [${v.name}](${txt(v.id, L)})${isControl(v) ? '' : ` · ${c.name}${c.guide ? ` (${c.guide.url})` : ''}`}: ${plain(v.when)} ${L.lang === 'en' ? 'Rules:' : '규칙:'} ${v.rules.map(plain).join(' ')}`; };
for (const L of LOCALES) {
  const en = L.lang === 'en', C = CONNECT[L.lang];
  const llms = en ? `# Vizney Blocks

> Charts you read through their motion and the dashboard controls that go with them, as copy-paste HTML cards: ${L.charts.length} charts and ${L.controls.length} controls (${VERSION}). One card is an HTML snippet that bundles <style>, a JSON data block and <script>; paste it inside <body> and it draws itself. Change only the values in the card's <script type="application/json">. ${NOTICE}.

How to use:
- Pick a card by what it shows (the first sentences of each card below). The cards on this page are all there are; when none fits, draw that part yourself and say so, rather than bending a card. Card names describe the shape, not the metric, so put what the values are in the JSON title.
${RULES('from the links (.txt) below', 'in its rules below', 'en').map((x) => `- ${x}`).join('\n')}
- Coding agents can install the skill (the same cards and rules): ${SKILL_CMD}
- Gallery: ${SITE}/ · Korean: ${SITE}/ko/ (llms.txt: ${SITE}/ko/llms.txt) · Source: ${REPO}

## Charts

Each chart card belongs to a chart type of the Vizney chart guide (${L.guide}); its motion is what the data means, not decoration.

${L.charts.map((v) => cardLine(v, L)).join('\n')}

## Controls

${plain(L.cat.control.intro)}

${L.controls.map((v) => cardLine(v, L)).join('\n')}

## ${C.title}

${C.intro}

${C.list.map((x) => `- ${plain(x)}`).join('\n')}

\`\`\`html
${C.code}
\`\`\`
` : `# Vizney Blocks

> 움직임으로 읽는 차트와 대시보드 컨트롤을 담은, 복사해 붙여 쓰는 HTML 카드: 차트 ${L.charts.length}종과 컨트롤 ${L.controls.length}종(${VERSION}). 카드 하나는 <style>, 데이터 JSON, <script>를 한데 묶은 HTML 조각이며, <body> 안에 붙여 넣으면 그려진다. 데이터는 카드 안 <script type="application/json">의 값만 바꾼다. ${NOTICE}.

쓰는 법:
- 카드는 무엇을 보여 주는지로 고른다(아래 카드마다의 첫 문장들). 이 문서에 있는 카드가 전부다. 맞는 카드가 없으면 카드를 억지로 맞추지 말고 그 부분은 직접 그린 뒤 그렇게 했다고 알린다. 카드 이름은 지표가 아니라 모양이므로, 무엇의 값인지는 JSON의 title에 적는다.
${RULES('아래 링크(.txt)의', '아래 그 카드의 규칙').map((x) => `- ${x}`).join('\n')}
- 코딩 에이전트에는 스킬로 설치한다(같은 카드와 규칙): ${SKILL_CMD}
- 갤러리: ${SITE}/ko/ · 영어: ${SITE}/ (llms.txt: ${SITE}/llms.txt) · 소스: ${REPO}

## 차트

차트 카드는 Vizney 차트 가이드(${L.guide})의 차트 종류에 속하고, 움직임은 꾸밈이 아니라 데이터의 뜻이다.

${L.charts.map((v) => cardLine(v, L)).join('\n')}

## 컨트롤

${plain(L.cat.control.intro)}

${L.controls.map((v) => cardLine(v, L)).join('\n')}

## ${C.title}

${C.intro}

${C.list.map((x) => `- ${plain(x)}`).join('\n')}

\`\`\`html
${C.code}
\`\`\`
`;
  writeFileSync(join(docs, L.base, 'llms.txt'), llms);
  // tokens.css at a stable address: the variable list with what each one does, for people and AI tools to re-declare in :root.
  writeFileSync(join(docs, L.base, 'tokens.css'), `/* Vizney Blocks ${VERSION} · ${NOTICE} · ${en ? 'the same content as the :where(:root) block in the card code' : '카드 코드 안의 :where(:root) 블록과 같은 내용'} */\n${tokensBy[L.lang]}\n`);
}

// Worked examples for the skill: src/skill/examples/*.md are copied beside SKILL.md, and both skill files list them.
const EXAMPLES = readdirSync(join(root, 'src/skill/examples')).filter((f) => f.endsWith('.md')).sort().map((file) => {
  const md = readFileSync(join(root, 'src/skill/examples', file), 'utf8');
  const [, title] = md.match(/^# (.+)$/m);
  const desc = md.split('\n\n')[1].split('. ')[0].replace(/ 예시다$/, ' 예시');
  return { file, title, desc };
}).sort((a, b) => a.title.localeCompare(b.title));

// Skill for coding agents (Agent Skills format, skills/<name>/SKILL.md), installed with `npx skills add yehwanhwang/vizney-blocks`.
// It lists the cards, sends the agent to the plain-text card code instead of rewriting it, and carries the rules, the way to
// connect controls to charts and a checklist. The steps run: pick → check and assume → download → JSON → paste → connect → check.
const SKILL_DESC = `Vizney Blocks(blocks.vizney.com)의 HTML 카드로 움직임으로 읽는 차트와 대시보드 컨트롤을 화면에 넣는다. 차트(${namesOf(KO.charts)})를 그리거나 컨트롤(${namesOf(KO.controls)})을 둘 때, 사용자가 Vizney Blocks를 언급할 때 쓴다. 카드 코드는 그대로 두고 JSON 데이터만 바꾸며, 컨트롤과 차트는 짧은 페이지 스크립트로 잇는다.`;
const SKILL_DESC_EN = `Add charts read through their motion and dashboard controls to an HTML page with Vizney Blocks (blocks.vizney.com) cards. Use it to draw one of the charts (${namesOf(ENL.charts)}) or add one of the controls (${namesOf(ENL.controls)}), or when the user mentions Vizney Blocks. Keep the card code, change only its JSON data, and connect controls to charts with a short page script.`;
const skillCards = (L) => `### ${L.lang === 'en' ? 'Charts' : '차트'}

${L.charts.map((v) => `- ${v.name} (\`${v.id}\`) · ${L.cat[v.cat].name} — ${plain(v.when)}`).join('\n')}

### ${L.lang === 'en' ? 'Controls' : '컨트롤'}

${L.controls.map((v) => `- ${v.name} (\`${v.id}\`) — ${plain(v.when)}`).join('\n')}`;
const skillPage = (lang) => (lang === 'en' ? `<!doctype html>
   <html lang="en">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ad spend</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">Ad spend</h1>
   <p style="margin:2px 0 16px; font:400 14px/1.5 var(--vzb-font); color:var(--vzb-muted);">As of November 2026 · Data source</p>
   <!-- Filter bar: a control draws no title, so the page names it. Give each control a slot with a width. -->
   <div style="display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:16px 24px; margin-bottom:16px; padding:16px 20px; border-radius:16px; background:#ffffff;">
   <div><div style="margin-bottom:8px; font:500 12px/16px var(--vzb-font); color:var(--vzb-muted);">Channel</div><!-- the Filter Chips card code --></div>
   <div><!-- the Download Button card code, with "align": "end" --></div>
   </div>
   <!-- Charts: paste the chart card code, one card per grid cell. Wrap a card the script must find in an element with an id. -->
   <div style="${GRID};">
   <div id="spend"><!-- the Bar Overflow card code --></div>
   </div>
   </body>
   </html>` : `<!doctype html>
   <html lang="ko">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>광고비 현황</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">광고비 현황</h1>
   <p style="margin:2px 0 16px; font:400 14px/1.5 var(--vzb-font); color:var(--vzb-muted);">2026년 11월 기준 · 데이터 출처</p>
   <!-- 필터 줄: 컨트롤은 제목을 그리지 않으므로 페이지가 이름을 적는다. 컨트롤마다 폭이 있는 자리를 준다. -->
   <div style="display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:16px 24px; margin-bottom:16px; padding:16px 20px; border-radius:16px; background:#ffffff;">
   <div><div style="margin-bottom:8px; font:500 12px/16px var(--vzb-font); color:var(--vzb-muted);">채널</div><!-- Filter Chips 카드 코드 --></div>
   <div><!-- Download Button 카드 코드("align": "end") --></div>
   </div>
   <!-- 차트: 격자 한 칸에 차트 카드 코드를 하나씩 붙인다. 스크립트가 찾아야 하는 카드는 id를 준 요소로 감싼다. -->
   <div style="${GRID};">
   <div id="spend"><!-- Bar Overflow 카드 코드 --></div>
   </div>
   </body>
   </html>`);
const skill = `<!-- Vizney Blocks 스킬의 한국어판. 스킬 입구는 같은 폴더의 SKILL.md(영어)이고, 한국어로 일할 때 이 파일을 따른다. ${SKILL_DESC} -->

# Vizney Blocks 카드로 화면 만들기

> 스킬의 한국어판이다. 영어판은 같은 폴더의 \`SKILL.md\`다. 순서, 카드 목록, 규칙, 체크리스트는 같은 원본에서 만들어져 내용이 같고, 카드 코드 주소(\`/ko/cards/\`)와 카드 문구가 한국어다.

Vizney Blocks는 움직임으로 읽는 차트와 대시보드 컨트롤을 담은, 복사해 붙여 쓰는 HTML 카드 모음이다(${VERSION}, MIT License). 카드 하나는 \`<style>\`, 데이터 JSON, \`<script>\`를 묶은 HTML 조각이라 설치할 라이브러리가 없다. 넘친 양 · 비중 · 순위 같은 계산과 색 · 강조 · 움직임은 카드가 Vizney 차트 가이드의 규칙대로 맡는다. 그래서 카드 코드는 그대로 두고 JSON 값만 바꾼다. 카드가 정하는 것은 그 차트를 바르게 그리는 방법이고, 화면에 무엇을 둘지는 화면을 만드는 쪽이 정한다.

## 카드

지금 있는 카드는 차트 ${KO.charts.length}종과 컨트롤 ${KO.controls.length}종이 전부다. 요청에 맞는 카드가 없으면 카드를 억지로 맞추지 않는다. 그 부분은 직접 만들고, 카드로 만들지 않았다고 사용자에게 알린다.

${skillCards(KO)}

카드마다의 규칙과 필드는 ${SITE}/ko/llms.txt 의 그 카드 줄에 있다. 카드를 쓰기 전에 그 줄을 읽는다.

## 순서

1. 화면에 둘 것을 적고, 위 "카드"에서 쓰임이 맞는 카드를 고른다. 카드 이름은 지표가 아니라 모양이므로, 무엇의 값인지는 JSON의 \`title\`에 적는다.
2. 카드마다 기간, \`format\`, \`better\`와 그 카드에 필요한 값(한도, 두 기간, 짚을 항목)을 확인한다. 요청과 데이터에서 알 수 없는 것만 모아 한 번에 묻는다(하나씩 묻지 않는다). 답을 받을 수 없으면 가장 그럴듯한 값으로 가정하고, 가정을 한 줄로 적은 뒤 계속한다.
3. 카드 코드를 내려받는다. \`${SITE}/ko/cards/<카드 id>.txt\`가 카드 코드 원문이다(카드 문구가 한국어). 코드를 다시 쓰거나 줄이지 말고 받은 그대로 쓴다. 내려받을 수 없으면 사용자에게 그 주소의 내용을 붙여 달라고 한다.

   \`\`\`bash
   curl -fsSL ${SITE}/ko/cards/${GALLERY[0]}.txt -o ${GALLERY[0]}.html
   \`\`\`

4. 카드 안 \`<script type="application/json">\`과 \`</script>\` 사이의 JSON 값만 바꾼다. 필드는 카드 코드에 든 예시 JSON이 기준이다. 예시에 없는 필드는 아래 규칙의 공통 필드와, llms.txt의 그 카드 줄에 이름이 나온 것만 더한다. 영어 화면이면 \`"lang": "en"\`을 더한다.
5. 카드를 한 HTML 문서에 붙인다. 컨트롤은 차트 위 필터 줄에, 차트는 격자에 둔다.

   \`\`\`html
   ${skillPage('ko')}
   \`\`\`

6. 컨트롤을 두었으면 아래 "${CONNECT.ko.title}"대로 페이지 스크립트를 쓴다.
7. 브라우저에서 열어 아래 "체크리스트"를 거친다. 완성한 파일을 넘길 때 가정 줄을 다시 알린다.

## 규칙

${RULES('내려받은', 'llms.txt의 그 카드 줄').map((x) => `- ${x}`).join('\n')}
- 낮을수록 좋은 지표는 \`"better": "down"\`으로 둔다. Waffle Flip은 줄어든 쪽이 초록 배지가 되고, Bump Race는 작은 값이 1위가 된다.
- 월별 추이는 데이터가 있으면 13개월을 넣는다. 처음과 마지막이 같은 달이라 전년 동월과 견줄 수 있다.
- 기간 이름은 \`25.09\`, \`3Q26\`처럼 짧게 적는다. 길면 막대 아래와 구간 막대 아래에서 잘리거나 서로 붙는다.
- 항목 이름(채널, 상품 등)은 화면 전체에서 한 언어로 맞춘다. 번역하면 모두 번역하고, 원문을 쓰면 모두 원문으로 둔다.

## ${CONNECT.ko.title}

${CONNECT.ko.intro}

${CONNECT.ko.list.map((x) => `- ${x}`).join('\n')}

\`\`\`html
${CONNECT.ko.code}
\`\`\`

## 체크리스트

완성한 파일을 넘기기 전에 하나씩 확인한다. 하나라도 어긋나면 고친 뒤 다시 확인한다.

### 카드 코드

- [ ] 카드 코드는 내려받은 그대로이고, JSON 값만 바꿨다.
- [ ] 필드는 예시 JSON, 규칙의 공통 필드, llms.txt의 그 카드 줄에 나온 것만 썼다.
- [ ] 넘친 양, 비중, 순위, 증감, 합계를 JSON에 적지 않았고, 금액은 반올림하거나 나누지 않은 원래 값이다.
- [ ] 카드를 innerHTML이나 dangerouslySetInnerHTML로 넣지 않았다.

### 데이터

- [ ] \`labels\`와 \`values\`의 길이가 같고, 값이 없는 기간은 값이 \`null\`이다.
- [ ] 낮을수록 좋은 지표는 \`"better": "down"\`이다.
- [ ] Bar Overflow의 \`limit\`은 넘으면 안 되는 한도다. 넘을수록 좋은 목표에는 쓰지 않았다.
- [ ] 기간 이름은 짧고, 항목 이름은 화면 전체에서 한 언어다.

### 컨트롤

- [ ] 컨트롤마다 \`label\`(화면 낭독기가 읽는 이름)과 \`name\`(이벤트 이름)이 있다.
- [ ] 컨트롤의 \`theme\`이 놓인 자리의 바탕과 맞다.
- [ ] 컨트롤의 처음 \`value\`와 차트의 처음 JSON이 같은 조건이다.
- [ ] 값을 바꾸면 차트가 다시 그려지고, 모두 풀었다가 다시 골라도 돌아온다.
- [ ] Download Button의 \`target\`이 받을 카드의 \`data-vzb\`와 같다.

### 화면

- [ ] 브라우저 콘솔에 오류가 없고, 카드 안에 오류 문구(\`.vzb-error\`)가 없다.
- [ ] 폭 1280px과 390px에서 화면을 캡처해 잘리거나 겹친 글자가 없다.
- [ ] 차트 카드는 한 번 재생하고 멈춘다. 계속 되풀이하게 두지 않았다.
- [ ] 가정 줄을 사용자에게 알렸다.

## 예시

요청 하나를 고른 카드 · JSON 핵심 · 잇는 스크립트 · 확인 결과까지 따라간 예시다. 비슷한 요청을 받으면 먼저 읽는다.

${EXAMPLES.map((e) => `- [${e.title}](examples/${e.file}) — ${e.desc}`).join('\n')}

갤러리: ${SITE}/ (한국어 ${SITE}/ko/) · 소스: ${REPO}
`;
// The English skill: the same steps, cards, rules and checklist from the same sources, for agents working in English.
// It is SKILL.md, the entry; one skill folder keeps the install command and the plugin ID, and Korean work goes to SKILL.ko.md.
const skillEn = `---
name: vizney-blocks
description: ${JSON.stringify(`${SKILL_DESC_EN} 한국어 요청이나 한국어 화면에도 쓴다(한국어판 SKILL.ko.md).`)}
---

# Building screens with Vizney Blocks cards

> 한국어로 일할 때(사용자가 한국어로 요청하거나 화면 문구가 한국어일 때)는 같은 폴더의 \`SKILL.ko.md\`를 읽고 그것을 따른다. Working in Korean? Read \`SKILL.ko.md\` in this folder and follow it instead; it has the same steps and rules with the Korean card addresses.

Vizney Blocks is a set of copy-paste HTML cards: charts you read through their motion, and dashboard controls (${VERSION}, MIT License). One card is an HTML snippet that bundles \`<style>\`, a JSON data block and \`<script>\`, so there is no library to install. The card does the arithmetic (the amount over a limit, shares, ranks) and the colors, emphasis and motion, by the rules of the Vizney chart guide. So keep the card code and change only the JSON values. A card decides how to draw its chart correctly; what goes on the screen is up to whoever builds it.

## Cards

The cards are these ${ENL.charts.length} charts and ${ENL.controls.length} controls, and no others. When no card fits a request, do not bend one to it: build that part yourself and tell the user it is not a card.

${skillCards(ENL)}

Each card's rules and fields are in its line of ${SITE}/llms.txt. Read that line before using a card.

## Steps

1. Write down what the screen shows and pick the cards whose use fits in "Cards" above. Card names describe the shape, not the metric, so put what the values are in the JSON \`title\`.
2. For each card, check the period, \`format\`, \`better\` and the values that card needs (the limit, the two periods, the item to follow). Gather only what the request and the data do not tell you and ask it in one go (not one by one). If no answer can come, assume the most likely value, write the assumption on one line and go on.
3. Download the card code. \`${SITE}/cards/<card id>.txt\` is the card code as published (card text in English). Use it as received; do not rewrite or shorten it. If you cannot download it, ask the user to paste the content of that address.

   \`\`\`bash
   curl -fsSL ${SITE}/cards/${GALLERY[0]}.txt -o ${GALLERY[0]}.html
   \`\`\`

4. Change only the JSON values between \`<script type="application/json">\` and \`</script>\` in the card. The example JSON in the card code is the reference for fields. Add a field the example lacks only when it is a common field in the rules below or is named in that card's line in llms.txt.
5. Paste the cards into one HTML document: the controls in a filter bar above the charts, the charts in a grid.

   \`\`\`html
   ${skillPage('en')}
   \`\`\`

6. If the screen has controls, write the page script as in "${CONNECT.en.title}" below.
7. Open it in a browser and go through the "Checklist" below. When you hand over the file, repeat the assumptions.

## Rules

${RULES('you downloaded', 'in that card\'s line in llms.txt', 'en').map((x) => `- ${x}`).join('\n')}
- A metric where lower is better gets \`"better": "down"\`. Waffle Flip then shows a decrease as the green badge, and Bump Race ranks the smallest value first.
- A monthly trend gets 13 months when the data has them. The first and last are the same month, so the year-over-year comparison is visible.
- Keep period names short, like \`Sep '25\` or \`3Q26\`. Long ones clip or run together under the bars and under the scrubber.
- Keep item names (channels, products) in one language across the screen. Translate all of them or keep all of them as they are.

## ${CONNECT.en.title}

${CONNECT.en.intro}

${CONNECT.en.list.map((x) => `- ${x}`).join('\n')}

\`\`\`html
${CONNECT.en.code}
\`\`\`

## Checklist

Go through it before handing over the file. If anything is off, fix it and check again.

### Card code

- [ ] The card code is as downloaded; only the JSON values changed.
- [ ] Fields are only those in the example JSON, the common fields in the rules, or that card's line in llms.txt.
- [ ] No amount over a limit, share, rank, change or total in the JSON, and amounts are raw values, not rounded or divided.
- [ ] No card was inserted with innerHTML or dangerouslySetInnerHTML.

### Data

- [ ] \`labels\` and \`values\` have the same length, and a period without a value has \`null\`.
- [ ] Lower-is-better metrics have \`"better": "down"\`.
- [ ] The \`limit\` of Bar Overflow is a limit not to cross. It is not used for a target, where more is better.
- [ ] Period names are short, and item names are in one language across the screen.

### Controls

- [ ] Every control has a \`label\` (the name screen readers read) and a \`name\` (the event name).
- [ ] Each control's \`theme\` matches the background it sits on.
- [ ] The first \`value\` of each control and the first JSON of the chart are for the same condition.
- [ ] Changing a value redraws the chart, and clearing everything and picking again brings it back.
- [ ] The \`target\` of Download Button is the \`data-vzb\` of the card to download.

### Screen

- [ ] No errors in the browser console, and no error message (\`.vzb-error\`) inside a card.
- [ ] Screenshots at 1280px and 390px show no clipped or overlapping text.
- [ ] Chart cards play once and stop. None is left repeating.
- [ ] The assumptions were shared with the user.

## Examples

A worked example that follows one request through the cards picked, the key JSON, the connecting script and the checks. It is written in Korean, but the judgments apply as they are.

${EXAMPLES.map((e) => `- [${e.title}](examples/${e.file})`).join('\n')}

Gallery: ${SITE}/ (Korean ${SITE}/ko/) · Source: ${REPO}
`;
mkdirSync(join(root, 'skills/vizney-blocks'), { recursive: true });
// SKILL.md (the entry agents and OpenDesign read) is English; SKILL.ko.md is the Korean edition it sends Korean work to.
writeFileSync(join(root, 'skills/vizney-blocks/SKILL.md'), skillEn);
writeFileSync(join(root, 'skills/vizney-blocks/SKILL.ko.md'), skill);
rmSync(join(root, 'skills/vizney-blocks/SKILL.en.md'), { force: true });
rmSync(join(root, 'skills/vizney-blocks/examples'), { recursive: true, force: true });
mkdirSync(join(root, 'skills/vizney-blocks/examples'), { recursive: true });
for (const e of EXAMPLES) copyFileSync(join(root, 'src/skill/examples', e.file), join(root, 'skills/vizney-blocks/examples', e.file));

// The same folder is an OpenDesign plugin (open-design.ai): open-design.json beside SKILL.md names the skill and the output
// surface, icon.svg is the card icon, and preview/index.html is a real output: the screen of the skill's steps (a filter bar
// over the charts) with the connecting script of CONNECT and full example data. Installed in OpenDesign with
// `od plugin install github:yehwanhwang/vizney-blocks/skills/vizney-blocks`; the community marketplace index
// (nexu-io/open-design, plugins/registry/community) points at this folder, so the manifest version follows VERSION.
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="13" height="13" rx="3" fill="#1b1b1b"/><rect x="17" y="2" width="13" height="13" rx="3" fill="#ff9500"/><rect x="2" y="17" width="13" height="13" rx="3" fill="#ffcc00"/><rect x="17" y="17" width="13" height="13" rx="3" fill="#ff2d55"/></svg>\n';
// No card counts here: OpenDesign's marketplace index copies this text, and the gallery grows one block at a time.
const PLUGIN_DESC = 'Copy-paste HTML cards for dashboards: charts read through their motion and the controls that filter them, built on the Vizney chart guide. Keep the card code, change only its JSON, and connect controls to charts with a short page script.';
const manifest = {
  $schema: 'https://open-design.ai/schemas/plugin.v1.json',
  specVersion: '1.0.0',
  name: 'vizney-blocks',
  title: 'Vizney Blocks',
  version: `${VERSION.slice(1)}.0`,
  description: PLUGIN_DESC,
  description_i18n: { ko: '대시보드에 붙여 쓰는 HTML 카드. 움직임으로 읽는 차트와 그 차트를 거르는 컨트롤을 Vizney 차트 가이드의 판단으로 만들었습니다. 카드 코드는 그대로 두고 JSON만 바꾸며, 컨트롤과 차트는 짧은 페이지 스크립트로 잇습니다.' },
  license: 'MIT',
  author: { name: 'Yehwan Hwang · Vizney', url: SITE },
  homepage: SITE,
  icon: './icon.svg',
  plugin: { repo: `${REPO}/tree/main/skills/vizney-blocks` },
  tags: ['create', 'dashboard', 'chart', 'motion', 'controls', 'data-visualization', 'html', 'cards', 'korean'],
  compat: { agentSkills: [{ path: './SKILL.md' }] },
  od: {
    kind: 'skill',
    taskKind: 'new-generation',
    mode: 'prototype',
    scenario: 'operation',
    preview: { type: 'html', entry: './preview/index.html', motion: 'static' },
    useCase: {
      query: {
        en: 'Build a single-page HTML dashboard with Vizney Blocks cards: charts read through their motion and the controls that filter them. Keep each card\'s code, change only its JSON data, and connect the controls to the charts with a short page script.',
        ko: 'Vizney Blocks 카드로 한 페이지 HTML 대시보드를 만든다. 움직임으로 읽는 차트와 그 차트를 거르는 컨트롤을 쓰고, 카드 코드는 그대로 둔 채 JSON 데이터만 바꾸며, 컨트롤과 차트는 짧은 페이지 스크립트로 잇는다.',
        'zh-CN': '用 Vizney Blocks 卡片构建单页 HTML 仪表盘：通过动效阅读的图表，以及筛选这些图表的控件。保留卡片代码，只修改其 JSON 数据，并用一小段页面脚本把控件和图表连接起来。',
      },
    },
    context: { skills: [{ path: './SKILL.md' }] },
    capabilities: ['prompt:inject'],
  },
};
writeFileSync(join(root, 'skills/vizney-blocks/open-design.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(root, 'skills/vizney-blocks/icon.svg'), ICON);

const skeleton = (body) => `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n${body}</body></html>`;
// The preview: the English cards with their example data, Filter Chips and Download Button in a filter bar, Bar Overflow
// redrawn from the chips by the CONNECT script (with the full data), then Waffle Flip and Bump Race.
const DEMO = {
  labels: JSON.parse(r(vp('bar-overflow', 'en.json'))).labels,
  spend: { Social: [8600, 16200, 9700, 9700, 11900, 9100, 12900, 13300, 10000, 14500, 10100, 10000, 16400], Search: [9500, 10300, 10100, 10400, 12800, 10100, 8500, 8600, 10600, 15300, 11000, 10900, 10700], Display: [5500, 6000, 3600, 3500, 7200, 5800, 4900, 5000, 3700, 5200, 6200, 6200, 6200], Video: [5300, 5900, 3500, 3600, 4300, 5600, 4800, 5000, 3700, 5200, 3700, 6000, 6100], Affiliate: [2800, 5000, 3000, 3100, 3800, 2900, 2500, 4200, 3200, 4500, 3200, 3200, 3100], Retargeting: [2500, 2700, 1600, 2700, 3400, 2700, 2200, 2300, 1700, 4000, 2900, 2900, 2800] },
  budget: { Social: 12000, Search: 11200, Display: 5600, Video: 4800, Affiliate: 3600, Retargeting: 2800 },
};
// The card code with some JSON fields changed (the rest of the card untouched), as an agent following the skill would write it.
const withData = (code, change) => code.replace(/(<script type="application\/json">\n)([\s\S]*?)(\n<\/script>)/, (m, a, body, b) => a + json(change(JSON.parse(body))) + b).replace(`${FONT_LINK}\n`, '');
const demoAll = Object.keys(DEMO.spend);
const demoPage = `${FONT_LINK}
<style>body{background:#f4f5f7}.vzb-demo{box-sizing:border-box;max-width:1120px;margin:0 auto;padding:24px}.vzb-demo h1{margin:0;font:700 22px/1.4 var(--vzb-font);color:var(--vzb-ink)}.vzb-demo .vzb-asof{margin:2px 0 16px;font:400 14px/1.5 var(--vzb-font);color:var(--vzb-muted)}.vzb-demo-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:16px 24px;margin-bottom:16px;padding:16px 20px;border-radius:16px;background:#ffffff}.vzb-demo-lab{margin-bottom:8px;font:500 12px/16px var(--vzb-font);color:var(--vzb-muted)}.vzb-demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px}@media (min-width:760px){.vzb-demo-grid{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}.vzb-demo-grid .is-wide{grid-column:1 / -1}}</style>
<div class="vzb-demo">
<h1>Ad spend</h1>
<p class="vzb-asof">Example data · pick channels to redraw Monthly Ad Spend; the download gets what is on screen</p>
<div class="vzb-demo-bar">
<div><div class="vzb-demo-lab">Channel</div>
${withData(ENL.byId['filter-chips'].code, (d) => ({ ...d, value: demoAll }))}</div>
<div>
${withData(ENL.byId['download-button'].code, (d) => ({ ...d, align: 'end' }))}</div>
</div>
<div class="vzb-demo-grid">
<div id="spend">
${withData(ENL.byId['bar-overflow'].code, (d) => ({ ...d, subtitle: 'All channels, against a $40K monthly budget' }))}</div>
<div>
${withData(ENL.byId['waffle-flip'].code, (d) => d)}</div>
<div class="is-wide">
${withData(ENL.byId['bump-race'].code, (d) => d)}</div>
</div>
</div>
<script>
// The full data the page holds: the period names, and the monthly spend and the monthly budget of each channel.
const LABELS = ${JSON.stringify(DEMO.labels)};
const SPEND = ${JSON.stringify(DEMO.spend)};
const BUDGET = ${JSON.stringify(DEMO.budget)};
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // the channels picked
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // nothing picked: an empty array, and the card draws its empty state
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  d.limit = picked.reduce((sum, c) => sum + BUDGET[c], 0);
  d.subtitle = !picked.length ? 'No channel picked' : (picked.length === ${demoAll.length} ? 'All channels' : picked.join(', ')) + ', against a $' + d.limit / 1000 + 'K monthly budget';
  src.textContent = JSON.stringify(d);   // the card redraws when this text changes
});
</script>
`;
mkdirSync(join(root, 'skills/vizney-blocks/preview'), { recursive: true });
writeFileSync(join(root, 'skills/vizney-blocks/preview/index.html'), skeleton(demoPage));

// Domain, Jekyll off, icon, font license, share image, sitemap.
writeFileSync(join(docs, 'CNAME'), 'blocks.vizney.com\n');
writeFileSync(join(docs, '.nojekyll'), '');
// Favicon: the Vizney icon of the blog (vizney_icon_b_v2.png), so a tab looks the same on every Vizney site.
for (const f of ['favicon.png', 'favicon.ico', 'apple-touch-icon.png']) copyFileSync(join(root, `page/${f}`), join(docs, f));
copyFileSync(join(root, 'tools/OFL.txt'), join(docs, 'OFL.txt'));
// Share images: English (og.png, the main site) and Korean (og-ko.png).
for (const f of ['og.png', 'og-ko.png']) if (existsSync(join(root, `tools/${f}`))) copyFileSync(join(root, `tools/${f}`), join(docs, f));
// The sitemap lists the home page of both languages and links each to its translation.
const alt = (p) => LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${l.lang}" href="${SITE}${l.base}${p}"/>`).join('');
writeFileSync(join(docs, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LOCALES.flatMap((L) => ['/'].map((p) => `<url><loc>${SITE}${L.base}${p}</loc>${alt(p)}</url>`)).join('\n')}
</urlset>
`);
writeFileSync(join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const kb = (p) => `${(readFileSync(join(docs, p)).length / 1024).toFixed(0)} KB`;
console.log(`docs/: home ${kb('index.html')} · ko ${kb('ko/index.html')}, ${variants.length} card pages and .txt files per language (${variants.map((v) => `${v.id} ${kb(`cards/${v.id}.txt`)}`).join(', ')}), llms.txt ${kb('llms.txt')}, fonts ${W.map((w) => `${(woff[w].length / 1024).toFixed(0)}`).join('/')} KB`);
console.log(`skills/vizney-blocks/SKILL.md: ${(skillEn.length / 1024).toFixed(0)} KB, ${EXAMPLES.length} example(s), preview ${(demoPage.length / 1024).toFixed(0)} KB`);
