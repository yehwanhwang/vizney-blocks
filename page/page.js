(() => {
  'use strict';
  const cats = window.VZB_CATS || [];
  const variants = cats.flatMap((c) => c.variants);
  const nav = document.getElementById('cats');
  const secs = document.getElementById('secs');
  const dlg = document.getElementById('dlg');
  const dlgTitle = document.getElementById('dlg-title');
  const dlgSub = document.getElementById('dlg-sub');
  const dlgCode = document.getElementById('dlg-code');
  const dlgCopy = document.getElementById('dlg-copy');
  const SUB = dlgSub.textContent;
  let current = null;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  // Backticks in the notes become <code>; everything else stays plain text.
  const rich = (tag, cls, text) => {
    const n = el(tag, cls);
    text.split('`').forEach((part, i) => n.append(i % 2 ? el('code', null, part) : part));
    return n;
  };

  // Same compact JSON as the build: flat arrays and small objects stay on one line.
  const pretty = (data) => JSON.stringify(data, null, 2)
    .replace(/\[\n\s+([^\[\]{}]*?)\n\s+\]/g, (m, inner) => `[${inner.split(/,\n\s+/).join(', ')}]`)
    .replace(/\{\n\s+([^\[\]{}]*?)\n\s+\}/g, (m, inner) => `{ ${inner.split(/,\n\s+/).join(', ')} }`);
  // Sets one field in the snippet's JSON, right after "format" (or "subtitle"); undefined removes it.
  function withField(code, field, value) {
    return code.replace(/(<script type="application\/json">\n)([\s\S]*?)(\n<\/script>)/, (m, a, body, b) => {
      const data = JSON.parse(body), out = {};
      const after = 'format' in data ? 'format' : 'subtitle';
      for (const k of Object.keys(data)) {
        if (k === field) continue;
        out[k] = data[k];
        if (k === after && value !== undefined) out[field] = value;
      }
      if (value !== undefined && !(field in out)) out[field] = value;
      return a + pretty(out) + b;
    });
  }

  // The page embeds the font itself, so the preview leaves out the snippet's font link.
  function mountSnippet(host, code) {
    const range = document.createRange();
    range.selectNodeContents(host);
    host.append(range.createContextualFragment(code.replace(/<link [^>]*spoqa[^>]*>\n?/, '')));
  }

  async function copyText(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
    if (!ok) {
      const ta = el('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      document.body.append(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    if (ok) {
      const label = btn.dataset.label || (btn.dataset.label = btn.textContent);
      btn.textContent = '복사됨';
      btn.classList.add('is-done');
      clearTimeout(btn.vzbTimer);
      btn.vzbTimer = setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); }, 1600);
      return;
    }
    // Clipboard refused: show the code selected so the reader can copy it by hand.
    openCode(current || variants.find((v) => v.code === text));
    dlgSub.textContent = '복사가 막혀 있습니다. 선택된 코드를 Ctrl+C(⌘+C)로 복사하세요.';
    const sel = window.getSelection();
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(dlgCode);
    sel.addRange(r);
  }

  function openCode(v) {
    current = v;
    dlgTitle.textContent = `${v.name} · ${v.id}`;
    dlgSub.textContent = SUB;
    dlgCode.textContent = v.code;
    if (!dlg.open) dlg.showModal();
    dlgCode.scrollTop = 0;
  }

  // A link to the Vizney chart guide post that explains the same chart.
  function guideLink(g) {
    const a = el('a', 'guide');
    a.href = g.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.append('차트 가이드 · ', el('b', null, g.name), el('span', null, ' ↗'));
    return a;
  }

  function item(v) {
    const node = el('article', 'item');
    node.setAttribute('aria-labelledby', `n-${v.id}`);
    const hd = el('div', 'item-hd');
    const h3 = el('h3');
    h3.id = `n-${v.id}`;
    h3.append(v.name, el('code', null, v.id));
    const acts = el('div', 'acts');
    const codeBtn = el('button', 'btn', '코드');
    codeBtn.type = 'button';
    codeBtn.setAttribute('aria-label', `${v.name} 코드 보기`);
    codeBtn.addEventListener('click', () => openCode(v));
    const copyBtn = el('button', 'btn', '복사');
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', `${v.name} 코드 복사`);
    copyBtn.addEventListener('click', () => { current = v; copyText(v.code, copyBtn); });
    acts.append(codeBtn, copyBtn);
    // 사이트(blocks.vizney.com)에서는 AI에 넘길 카드 코드 주소(.txt)를 복사하는 단추를 더합니다.
    if (window.VZB_SITE) {
      const linkBtn = el('button', 'btn', '링크');
      linkBtn.type = 'button';
      linkBtn.title = 'AI에 넘길 카드 코드 주소를 복사합니다';
      linkBtn.setAttribute('aria-label', `${v.name} 코드 주소 복사`);
      linkBtn.addEventListener('click', () => { current = v; copyText(`${window.VZB_SITE}/cards/${v.id}.txt`, linkBtn); });
      acts.append(linkBtn);
    }
    hd.append(h3, acts);

    const preview = el('div', 'item-preview');
    const notes = el('div', 'item-notes');
    notes.append(rich('p', 'when', v.when), el('p', 'rules-hd', '들어 있는 판단'));
    const rules = el('ul', 'rules');
    v.rules.forEach((r) => rules.append(rich('li', null, r)));
    notes.append(rules);
    if (v.guide) notes.append(guideLink(v.guide));
    node.append(hd, preview, notes);
    return { node, preview };
  }

  // One section per category; the bar above links to each and marks the one in view.
  const links = [];
  for (const c of cats) {
    const sec = el('section', 'sec');
    sec.id = `sec-${c.id}`;
    sec.setAttribute('aria-labelledby', `h-${c.id}`);
    const hd = el('div', 'sec-hd');
    const h2 = el('h2', null, c.name);
    h2.id = `h-${c.id}`;
    hd.append(h2, rich('p', null, c.intro));
    if (c.guide) hd.append(guideLink(c.guide));
    if (c.option) hd.append(optionBar(c));
    const gallery = el('div', 'gallery');
    sec.append(hd, gallery);
    secs.append(sec);
    let group = null;
    for (const v of c.variants) {
      // Categories with groups (vertical and horizontal bars) get a heading where the group changes.
      const g = (c.groups || []).find((x) => x.id === v.group);
      if (g && g !== group) {
        group = g;
        const gh = el('h3', 'grp', g.name);
        if (g.note) gh.append(el('span', null, g.note));
        gallery.append(gh);
      }
      const it = item(v);
      gallery.append(it.node);
      v.preview = it.preview;
      v.base = v.code;
      mountSnippet(it.preview, v.code);
    }
    const a = el('a', 'cat');
    a.href = `#${sec.id}`;
    a.append(c.name, ' ', el('em', null, String(c.variants.length)));
    a.addEventListener('click', (e) => { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    nav.append(a);
    links.push({ a, sec });
  }
  // A category option (line shape) re-renders that section's previews; copy and code follow the choice.
  function optionBar(c) {
    const o = c.option;
    const bar = el('div', 'opt');
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', o.label);
    bar.append(el('span', 'opt-label', o.label));
    const btns = o.choices.map((ch, k) => {
      const b = el('button', k ? 'btn' : 'btn is-primary', ch.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(!k));
      b.addEventListener('click', () => {
        btns.forEach((x) => { const on = x === b; x.classList.toggle('is-primary', on); x.setAttribute('aria-pressed', String(on)); });
        for (const v of c.variants) {
          v.code = withField(v.base, o.field, k ? ch.value : undefined);
          v.preview.replaceChildren();
          mountSnippet(v.preview, v.code);
        }
      });
      bar.append(b);
      return b;
    });
    return bar;
  }

  let shown = null;
  function spy() {
    let on = links[0];
    for (const l of links) if (l.sec.getBoundingClientRect().top <= 120) on = l;
    for (const l of links) {
      l.a.classList.toggle('is-on', l === on);
      if (l === on) l.a.setAttribute('aria-current', 'true'); else l.a.removeAttribute('aria-current');
    }
    // On phones the bar scrolls sideways; keep the current category in view without moving the page.
    if (on && on !== shown) {
      shown = on;
      if (nav.scrollWidth > nav.clientWidth) {
        const left = on.a.offsetLeft - nav.offsetLeft, right = left + on.a.offsetWidth;
        if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
      }
    }
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; spy(); });
  }, { passive: true });
  spy();

  dlgCopy.addEventListener('click', () => { if (current) copyText(current.code, dlgCopy); });
  document.getElementById('dlg-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
