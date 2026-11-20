// Prints the CSS transition time (-t) and curve (-e) of each spring in src/tokens.css, worked out by springCss() in src/core.js.
// Run it after changing --vzb-settle, --vzb-pop or --vzb-move, and paste the six lines into tokens.css and tokens.en.css:
//   node tools/motion.mjs
// The guard (guard.mjs, check 11) fails the build when the two disagree.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const core = readFileSync(join(root, 'src/core.js'), 'utf8'), tokens = readFileSync(join(root, 'src/tokens.css'), 'utf8');
const fn = (name) => { const i = core.indexOf(`  function ${name}(`), j = core.indexOf('\n  }\n', i); return core.slice(i, j + 4); };
const springCss = new Function(`${fn('springAt')}\n${fn('springCss')}\nreturn springCss;`)();
for (const n of ['settle', 'pop', 'move']) {
  const [k, c] = tokens.match(new RegExp(`--vzb-${n}:\\s*([^;]+);`))[1].trim().split(/\s+/).map(Number);
  const [t, e] = springCss(k, c);
  console.log(`  --vzb-${n}-t: ${t};\n  --vzb-${n}-e: ${e};`);
}
