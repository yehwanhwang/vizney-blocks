// Share images (tools/og.png English, tools/og-ko.png Korean, 1200 × 660), in the format of the Vizney blog's post images
// (the Figma covers): a tag, the title and one line at the left, the logo and two squares under them. The right side shows real
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

// The card code as published, without the CDN font link (the page loads VZ Sans from docs/assets instead).
const card = (lang, id) => readFileSync(join(root, `docs${lang === 'ko' ? '/ko' : ''}/cards/${id}.txt`), 'utf8')
  .replace(/<link rel="stylesheet"[^>]*>\n?/, '');

// Words: a tag, a title of up to two lines and one line under it, as on a post image.
const T = {
  ko: { title: '만들기 까다로운<br>차트', sub: '붙여 넣기 한 번으로' },
  en: { title: 'Hard-to-build<br>Charts', sub: 'in a single paste' },
};

// The layout of a Vizney blog post image, with the values of its Figma source (file "Draft", page "Cover", 1200 × 660):
// a frame with 160px side and 120px top and bottom padding and a 20px gap; the tag (white, 2px ink border, radius 24px, padding
// 10px 18px, a 36px icon, Regular 28px uppercase, tracking 0.84px); the title (Bold 64px, line height 1.28, tracking -1.92px);
// one line under it (Medium 36px, line height 1.28, tracking -1.08px); the logo (136 × 51) on the bottom padding; two 48px
// squares with a 2px ink border at 80, 551 and 48, 517.
// Two things differ from a post image: the background is ink (#1b1b1b) with white words and the white logo, and the place of
// the chart holds two real cards in their frames, without the white rectangles of the upper and lower right corners. The tag icon is the Blocks mark (2 × 2).
const LOGO = `data:image/png;base64,${readFileSync(join(root, 'page/vizney-logo.png')).toString('base64')}`;
const page = (lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
${[400, 500, 700].map((w) => `@font-face{font-family:'VZ Sans';font-weight:${w};src:url(${BASE}/assets/fonts/vz-sans-${w}.woff) format('woff');}`).join('\n')}
:root { --vzb-font: 'VZ Sans', sans-serif; }
html, body { margin: 0; width: 1200px; height: 660px; overflow: hidden; background: #1b1b1b; }
body { position: relative; font-family: 'VZ Sans', sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased; word-break: keep-all; font-feature-settings: "cv05" 1; }
.frame { position: absolute; inset: 0; box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; gap: 20px; padding: 120px 160px; }
.tag { box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 10px 18px; border: 2px solid #1b1b1b; border-radius: 24px; background: #ffffff; color: #1b1b1b; font-size: 28px; font-weight: 400; line-height: 1.3; letter-spacing: 0.84px; text-transform: uppercase; white-space: nowrap; }
.tag svg { display: block; flex: none; width: 36px; height: 36px; }
h1 { margin: 0; font-size: 64px; line-height: 1.28; font-weight: 700; letter-spacing: -1.92px; }
p { flex: 1 0 0; min-height: 1px; margin: 0; font-size: 36px; line-height: 1.28; font-weight: 500; letter-spacing: -1.08px; }
.logo { display: block; flex: none; width: 136px; height: 51px; }
.box { position: absolute; box-sizing: border-box; background: #ffffff; border: 2px solid #1b1b1b; }
.box.a { left: 80px; top: 551px; width: 48px; height: 48px; }
.box.b { left: 48px; top: 517px; width: 48px; height: 48px; }
.cards { position: absolute; left: 652px; top: 87px; width: 600px; display: grid; grid-template-columns: 360px 360px; align-items: start; gap: 18px; }
.cards > * { box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.6); }
.cards .b { margin-top: 120px; }
</style></head><body>
<div class="frame"><div class="tag"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="13" height="13" rx="3" fill="#1b1b1b"/><rect x="17" y="2" width="13" height="13" rx="3" fill="#ff9500"/><rect x="2" y="17" width="13" height="13" rx="3" fill="#ffcc00"/><rect x="17" y="17" width="13" height="13" rx="3" fill="#ff2d55"/></svg>Blocks</div><h1>${T[lang].title}</h1><p>${T[lang].sub}</p><img class="logo" src="${LOGO}" alt="Vizney"></div>
<div class="cards"><div>${card(lang, 'sankey-levels')}</div><div class="b">${card(lang, 'bump-basic')}</div></div>
<span class="box a"></span><span class="box b"></span>
</body></html>`;

const browser = await chromium.launch();
for (const lang of ['ko', 'en']) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 660 }, deviceScaleFactor: 1 });
  await p.route('**/og-page', (route) => route.fulfill({ contentType: 'text/html', body: page(lang) }));
  await p.goto(`${BASE}/og-page`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800); // card entry animations
  await p.screenshot({ path: join(root, `tools/${lang === 'ko' ? 'og-ko' : 'og'}.png`) });
  await p.close();
}
await browser.close();
console.log('tools/og.png, tools/og-ko.png');
