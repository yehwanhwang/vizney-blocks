"""Subset Spoqa Han Sans Neo to the characters a page uses and rename it "VZ Sans".

SIL OFL 1.1: a modified (subset) font must not keep the original family name, and the
copyright notice stays. Usage: font.py <font-dir> <text-file> <out-dir>
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
    options = subset.Options()
    options.layout_features = ['*']
    options.hinting = False
    options.desubroutinize = True
    options.name_IDs = ['*']
    sub = subset.Subsetter(options)
    sub.populate(text=text)
    sub.subset(font)

    name = font['name']
    copyright_ = name.getDebugName(0) or 'Copyright 2020 Spoqa'
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
    font.flavor = 'woff'
    out = out_dir / f'vz-sans-{weight}.woff'
    font.save(out)
    print(f'{out.name}: {out.stat().st_size // 1024} KB, {len(font.getGlyphOrder())} glyphs')
