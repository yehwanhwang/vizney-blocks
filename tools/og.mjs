// Share images (tools/og.png English, tools/og-ko.png Korean), in the format of the Vizney blog's post images:
// ink background, the Vizney yellow as the one accent, the white Vizney wordmark at the bottom. The right side shows real
// cards from docs/, so run it after a build:
//   (cd docs && python3 -m http.server 8765) &   node tools/og.mjs
// Needs Playwright (require('playwright') with Chromium). build.mjs copies the two files into docs/.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = new URL('..', import.meta.url).pathname;
const BASE = process.env.OG_BASE || 'http://localhost:8765';
const WORDMARK = `data:image/png;base64,${readFileSync(join(root, 'page/vizney-wordmark.png')).toString('base64')}`;

// The card code as published, without the CDN font link (the page loads VZ Sans from docs/assets instead).
const card = (lang, id) => readFileSync(join(root, `docs${lang === 'en' ? '/en' : ''}/cards/${id}.txt`), 'utf8')
  .replace(/<link rel="stylesheet"[^>]*>\n?/, '');

const T = {
  ko: { title: '분석가의 판단을 담은<br><em>대시보드 카드</em>', sub: '복사해 붙이고 JSON만 바꾸는<br>HTML 대시보드 카드 모음', facts: '카드 37종 · 차트 14가지 · MIT 라이선스' },
  en: { title: 'Dashboard cards with<br><em>an analyst’s judgment</em>', sub: 'Copy-paste HTML dashboard cards:<br>keep the code, change only the JSON', facts: '37 cards · 14 chart types · MIT License' },
};

const page = (lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${[400, 500, 700].map((w) => `@font-face{font-family:'VZ Sans';font-weight:${w};src:url(${BASE}/assets/fonts/vz-sans-${w}.woff) format('woff');}`).join('\n')}
:root { --vzb-font: 'VZ Sans', sans-serif; }
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #1b1b1b; }
body { position: relative; font-family: 'VZ Sans', sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased; word-break: keep-all; }
.copy { position: absolute; left: 72px; top: 72px; width: 520px; }
.line { display: inline-block; padding: 7px 14px; border-radius: 999px; background: #ffcc00; color: #1b1b1b; font-size: 17px; font-weight: 700; line-height: 1.2; }
h1 { margin: 30px 0 0; font-size: ${lang === 'en' ? 50 : 54}px; line-height: 1.24; font-weight: 700; letter-spacing: -0.03em; }
h1 em { font-style: normal; color: #ffcc00; }
p { margin: 26px 0 0; font-size: 22px; line-height: 1.6; color: rgba(255, 255, 255, 0.72); }
.foot { position: absolute; left: 72px; bottom: 56px; display: flex; align-items: center; gap: 16px; }
.foot img { display: block; width: 117px; height: 40px; }
.foot span { padding-left: 16px; border-left: 1px solid rgba(255, 255, 255, 0.28); font-size: 18px; font-weight: 500; color: rgba(255, 255, 255, 0.72); }
.facts { position: absolute; right: 56px; bottom: 60px; font-size: 16px; color: rgba(255, 255, 255, 0.58); z-index: 2; }
.cards { position: absolute; left: 652px; top: 72px; width: 600px; display: grid; grid-template-columns: 360px 360px; align-items: start; gap: 18px; }
.cards > * { box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.6); }
.cards .b { margin-top: 120px; }
</style></head><body>
<div class="copy"><span class="line">Vizney Blocks</span><h1>${T[lang].title}</h1><p>${T[lang].sub}</p></div>
<div class="cards"><div>${card(lang, 'kpi-line')}</div><div class="b">${card(lang, 'bar-ranking')}</div></div>
<div class="foot"><img src="${WORDMARK}" alt="Vizney"><span>Blocks</span></div>
<div class="facts">${T[lang].facts}</div>
</body></html>`;

const browser = await chromium.launch();
for (const lang of ['ko', 'en']) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.route('**/og-page', (route) => route.fulfill({ contentType: 'text/html', body: page(lang) }));
  await p.goto(`${BASE}/og-page`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800); // card entry animations
  await p.screenshot({ path: join(root, `tools/${lang === 'ko' ? 'og-ko' : 'og'}.png`) });
  await p.close();
}
await browser.close();
console.log('tools/og.png, tools/og-ko.png');
