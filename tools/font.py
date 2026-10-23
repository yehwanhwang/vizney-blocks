"""Subset Spoqa Han Sans Neo to the characters a page uses and rename it "VZ Sans".

SIL OFL 1.1: a modified (subset) font must not keep the original family name, and the
copyright notice stays. Usage: font.py <font-dir> <text-file> <out-dir>

<font-dir> is Original/SpoqaHanSansNeo of github.com/spoqa/spoqa-han-sans. The fonts in its
Subset folder (the ones the Spoqa CDN serves) leave out kerning (GPOS) and a few signs the pages
use (© – — − ⌘), and turn off USE_TYPO_METRICS: Windows then lays lines out with the taller
win metrics (1100/310) instead of the typo metrics (970/282) that macOS and the installed font
use, and every line of text sits 1-3px lower. The flag is set again below whatever the source,
so VZ Sans keeps the original's line metrics on every system.
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

font_dir, text_file, out_dir = (Path(a) for a in sys.argv[1:4])
text = text_file.read_text(encoding='utf-8')
out_dir.mkdir(parents=True, exist_ok=True)

for style, weight in (('Regular', 400), ('Medium', 500), ('Bold', 700)):
    font = TTFont(font_dir / f'SpoqaHanSansNeo-{style}.ttf')
    cmap = font.getBestCmap()
    missing = sorted({c for c in text if ord(c) not in cmap and not c.isspace()})
    if missing:
        print(f'warning: SpoqaHanSansNeo-{style}.ttf has no glyph for {"".join(missing)}; '
              'these fall back to the next font. Use the Original folder.', file=sys.stderr)
    options = subset.Options()
    options.layout_features = ['*']
    options.hinting = False
    options.desubroutinize = True
    options.name_IDs = ['*']
    sub = subset.Subsetter(options)
    sub.populate(text=text)
    sub.subset(font)

    name = font['name']
    copyright_ = (name.getDebugName(0) or 'Copyright 2020 Spoqa').replace('\\', '')
    values = {
        0: f'{copyright_}. Modified (subset and renamed) from Spoqa Han Sans Neo.',
        1: 'VZ Sans' if style == 'Regular' or style == 'Bold' else f'VZ Sans {style}',
        2: 'Bold' if style == 'Bold' else 'Regular',
        3: f'VZ Sans {style}; subset of Spoqa Han Sans Neo 1.100',
        4: f'VZ Sans {style}',
        6: f'VZSans-{style}',
        16: 'VZ Sans',
        17: style,
    }
    # Drop every record that still carries the original family name, then write ours.
    name.names = [r for r in name.names if r.nameID not in (1, 2, 3, 4, 6, 7, 16, 17, 18, 21, 22)]
    for nid, value in values.items():
        name.setName(value, nid, 3, 1, 0x409)
        name.setName(value, nid, 1, 0, 0)

    # Line metrics: USE_TYPO_METRICS (fsSelection bit 7, OS/2 version 4 and up) makes Windows use the
    # typo values, which equal hhea here, so lines sit the same on Windows, macOS and the installed font.
    os2 = font['OS/2']
    os2.version = max(os2.version, 4)
    os2.fsSelection |= 1 << 7
    hhea = font['hhea']
    if (os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap) != (hhea.ascent, hhea.descent, hhea.lineGap):
        print(f'warning: typo and hhea metrics differ in SpoqaHanSansNeo-{style}.ttf', file=sys.stderr)

    font.flavor = 'woff'
    out = out_dir / f'vz-sans-{weight}.woff'
    font.save(out)
    print(f'{out.name}: {out.stat().st_size // 1024} KB, {len(font.getGlyphOrder())} glyphs, '
          f'kerning {"yes" if "GPOS" in font else "no"}')
