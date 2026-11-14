// Share images (tools/og.png English, tools/og-ko.png Korean), in the format of the Vizney blog's post images:
// ink background, the Vizney yellow (#ffcc00) as the one accent, the white Vizney wordmark at the bottom center. The right side shows real
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
const card = (lang, id) => readFileSync(join(root, `docs${lang === 'ko' ? '/ko' : ''}/cards/${id}.txt`), 'utf8')
  .replace(/<link rel="stylesheet"[^>]*>\n?/, '');

const T = {
  ko: { title: '만들기 까다로운 차트를<br><em>붙여 넣기 한 번으로</em>', sub: '생키 · 범프 · 퍼널 · 워터폴을<br>HTML 조각 하나로 복사해 씁니다', facts: '설치할 라이브러리 없음 · MIT 라이선스' },
  en: { title: 'Hard-to-build charts<br><em>in a single paste</em>', sub: 'Sankey, bump, funnel and waterfall,<br>each in one HTML snippet', facts: 'Nothing to install · MIT License' },
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
.foot { position: absolute; left: 0; right: 0; bottom: 44px; display: flex; justify-content: center; }
.foot img { display: block; width: 117px; height: 40px; }
.facts { margin: 28px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.58); }
.cards { position: absolute; left: 652px; top: 72px; width: 600px; display: grid; grid-template-columns: 360px 360px; align-items: start; gap: 18px; }
.cards > * { box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.6); }
.cards .b { margin-top: 120px; }
</style></head><body>
<div class="copy"><span class="line">Vizney Blocks</span><h1>${T[lang].title}</h1><p>${T[lang].sub}</p><div class="facts">${T[lang].facts}</div></div>
<div class="cards"><div>${card(lang, 'sankey-levels')}</div><div class="b">${card(lang, 'bump-basic')}</div></div>
<div class="foot"><img src="${WORDMARK}" alt="Vizney"></div>
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
