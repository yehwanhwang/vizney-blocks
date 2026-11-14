(() => {
  'use strict';
  // window.VZB: mode('site' | 'one'), page('home' | 'cat' | 'one' | 'none'), site(공개 주소), base(언어별 페이지 경로: 영어 '' · 한국어 '/ko'), files(카드 코드 경로: 영어 '' · 한국어 '/ko'), t(이 스크립트가 적는 문구),
  // cats([{ id, name }]), retired({ 내린 카드 id: 대신 쓸 카드 주소 }), index([{ id, name, cat, catName, when, tags(목적 색인의 목적과 조건), url }]),
  // code({ 카드 id: 코드 }), prompt({ 카드 id: 프롬프트 복사에서 코드 앞에 붙는 머리말 }), example([{ id, wide }]).
  const V = window.VZB || {};
  const code = V.code || {};
  const index = V.index || [];
  const SITE = V.site || 'https://blocks.vizney.com';
  const BASE = V.base || '';
  const FILES = V.files || '';
  const T = Object.assign({ copied: '복사됨', linkCopied: '링크 복사됨', promptCopied: '프롬프트 복사됨', sub: '<b>주황 줄</b>의 데이터(JSON)만 바꾸면 됩니다. 나머지는 그대로 둡니다.', blocked: '복사가 막혀 있습니다. 코드를 선택해 두었으니 Ctrl+C(⌘+C)로 복사하세요.', none: '찾는 카드가 없습니다.', exampleTitle: '영업 현황 예시', exampleSub: '', exampleComment: '' }, V.t || {});
  const current = {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // 목록에서 내린 카드의 옛 주소(/bar/#bar-grouped, /#n-bar-grouped)는 대신 쓸 카드로 보냅니다.
  if (V.mode === 'site') {
    const gone = () => {
      const to = (V.retired || {})[location.hash.replace(/^#(n-)?/, '')];
      if (to) location.replace(to);
      return Boolean(to);
    };
    if (gone()) return;
    window.addEventListener('hashchange', gone);
  }

  // 옛 한 페이지 갤러리 주소(#sec-bar, #n-bar-basic)는 새 차트 페이지로 보냅니다.
  if (V.mode === 'site' && V.page === 'home') {
    const moved = () => {
      const sec = location.hash.match(/^#sec-([\w-]+)$/), one = location.hash.match(/^#n-([\w-]+)$/);
      const hit = sec ? (V.cats || []).some((c) => c.id === sec[1]) && `${BASE}/${sec[1]}/` : one && (index.find((x) => x.id === one[1]) || {}).url;
      if (hit) location.replace(hit);
      return Boolean(hit);
    };
    if (moved()) return;
    window.addEventListener('hashchange', moved);
  }

  // 탭 줄의 높이: 화면 위에 붙어 있으므로 옆 목록과 앵커 이동이 그만큼 아래에서 시작합니다.
  const tabs = $('.tabs');
  const topH = () => {
    const h = tabs && getComputedStyle(tabs).position === 'sticky' ? tabs.offsetHeight : 0;
    document.documentElement.style.setProperty('--top-h', `${h}px`);
  };
  topH();
  window.addEventListener('resize', topH, { passive: true });

  // Vizney 공통 머리글(블로그 머리글과 같은 동작). 768px 이상: 메뉴 줄에 다 들어가지 않는 항목은 블로그(Ghost)처럼
  // 오른쪽 끝의 … 버튼 아래로 옮깁니다. 767px 이하: 햄버거가 전체 화면 메뉴를 엽니다.
  const head = $('.vz-head');
  if (head) {
    const menu = $('.vz-menu', head), nav = $('.vz-nav', head), more = $('.vz-more', head), drop = $('.vz-drop', head);
    const moreBtn = more && $('button', more), burger = $('.vz-burger', head);
    const wide = window.matchMedia('(min-width: 768px)');
    const items = $$(':scope > li:not(.vz-more)', nav);
    const setMore = (open) => { if (!more) return; more.classList.toggle('is-open', open); moreBtn.setAttribute('aria-expanded', String(open)); };
    const fit = () => {
      if (!more) return;
      setMore(false);
      items.forEach((li) => nav.insertBefore(li, more));
      more.hidden = true;
      if (!wide.matches) return;
      const room = () => nav.scrollWidth <= menu.clientWidth;
      if (room()) return;
      more.hidden = false;
      for (let k = items.length - 1; k > 0 && !room(); k--) drop.prepend(items[k]);
    };
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => { e.stopPropagation(); setMore(!more.classList.contains('is-open')); });
      document.addEventListener('click', (e) => { if (!more.contains(e.target)) setMore(false); });
      more.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMore(false); moreBtn.focus(); } });
    }
    const setOpen = (open) => {
      document.body.classList.toggle('vz-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    if (burger) {
      burger.addEventListener('click', () => setOpen(!document.body.classList.contains('vz-open')));
      head.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('vz-open')) { setOpen(false); burger.focus(); } });
    }
    const onWidth = () => { if (wide.matches) setOpen(false); fit(); };
    wide.addEventListener('change', onWidth);
    window.addEventListener('resize', fit, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
  }

  // 카드 찾기 창: 머리글의 돋보기나 ⌘K(Ctrl K)로 엽니다.
  const qdlg = $('#q-dlg'), qbtn = $('.vz-search');
  const openSearch = () => {
    if (!qdlg || qdlg.open) return;
    document.body.classList.remove('vz-open');
    qdlg.showModal();
    const q = $('#q');
    q.focus();
    q.select();
  };
  if (qdlg) {
    if (qbtn) qbtn.addEventListener('click', openSearch);
    qdlg.addEventListener('click', (e) => { if (e.target === qdlg) qdlg.close(); });
    qdlg.addEventListener('close', () => { const q = $('#q'); q.value = ''; q.dispatchEvent(new Event('input')); if (qbtn) qbtn.focus(); });
  }

  // 카드 그리기: 페이지가 글꼴을 직접 넣으므로 코드의 Spoqa 링크는 빼고 붙입니다.
  function mount(host, src) {
    host.replaceChildren();
    const range = document.createRange();
    range.selectNodeContents(host);
    host.append(range.createContextualFragment(src.replace(/<link [^>]*spoqa[^>]*>\n?/, '')));
  }
  $$('[data-mount]').forEach((host) => {
    const id = host.dataset.mount;
    if (!code[id]) return;
    current[id] = current[id] || code[id];
    mount(host, current[id]);
  });

  // 카드 JSON의 한 필드만 바꿉니다(선 모양). 값이 없으면 필드를 빼 기본값으로 둡니다.
  const pretty = (data) => JSON.stringify(data, null, 2)
    .replace(/\[\n\s+([^\[\]{}]*?)\n\s+\]/g, (m, inner) => `[${inner.split(/,\n\s+/).join(', ')}]`)
    .replace(/\{\n\s+([^\[\]{}]*?)\n\s+\}/g, (m, inner) => `{ ${inner.split(/,\n\s+/).join(', ')} }`);
  function withField(src, field, value) {
    return src.replace(/(<script type="application\/json">\n)([\s\S]*?)(\n<\/script>)/, (m, a, body, b) => {
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
  $$('[data-opt]').forEach((bar) => {
    const field = bar.dataset.opt, scope = bar.closest('.cat') || document;
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-val]');
      if (!b) return;
      $$('button', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $$('.item-preview[data-mount]:not([data-fixed])', scope).forEach((host) => {
        const id = host.dataset.mount;
        current[id] = withField(code[id], field, b.dataset.val || undefined);
        mount(host, current[id]);
      });
    });
  });

  // 복사
  const say = $('#say');
  const announce = (text) => { if (say) { say.textContent = ''; setTimeout(() => { say.textContent = text; }, 30); } };
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 아래 방식으로 */ }
    const ta = el('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function done(btn, label) {
    announce(label);
    if (!btn) return;
    if (!btn.dataset.html) btn.dataset.html = btn.innerHTML;
    btn.textContent = label;
    btn.classList.add('is-done');
    clearTimeout(btn.vzbTimer);
    btn.vzbTimer = setTimeout(() => { btn.innerHTML = btn.dataset.html; btn.classList.remove('is-done'); }, 1500);
  }
  const linkOf = (id) => `${SITE}${FILES}/cards/${id}.txt`;
  const nameOf = (id) => (index.find((x) => x.id === id) || {}).name || id;

  // 복사 메뉴: 카드 코드 복사, 프롬프트 복사(규칙과 쓰는 법을 앞에 붙인 카드 코드), AI용 링크 복사
  let menu = null;
  function closeMenu(focus) {
    if (!menu) return;
    menu.box.hidden = true;
    menu.btn.setAttribute('aria-expanded', 'false');
    if (focus) menu.btn.focus();
    menu = null;
  }
  function openMenu(btn) {
    const box = btn.nextElementSibling;
    if (menu && menu.btn === btn) { closeMenu(); return; }
    closeMenu();
    box.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    menu = { btn, box };
    const first = $('button', box);
    if (first) first.focus();
  }

  // 코드 창: 줄 번호를 달고, 데이터 JSON 줄은 옅은 주황 바탕에 색을 넣고, 나머지는 옅게 둡니다.
  const dlg = $('#dlg'), dlgTitle = $('#dlg-title'), dlgSub = $('#dlg-sub'), dlgCode = $('#dlg-code');
  const dlgLink = $('[data-act="dlg-link"]');
  let dlgId = null, dlgText = '';
  const escH = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const colorJson = (s) => s.replace(/("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g,
    (m, str, colon, n, lit) => (str ? (colon ? `<b class="k">${str}</b>${colon}` : `<span class="s">${str}</span>`) : `<span class="n">${n || lit}</span>`));
  function paint(text) {
    let inData = false, first = -1;
    dlgCode.innerHTML = text.split('\n').map((line, i) => {
      let cls = 'ln', body = escH(line);
      if (inData && /^<\/script>/.test(line)) inData = false;
      if (inData) {
        cls += ' is-data';
        if (first < 0) first = i;
        body = colorJson(body);
      } else if (i < 4 && /^\s*<!-{2}|^\s{5}\S/.test(line)) cls += ' is-head';   // `<!-{2}`: 한 페이지 갤러리는 이 파일을 인라인 스크립트로 넣으므로, 소스에 HTML 주석 여는 기호가 그대로 있으면 파서가 닫는 태그를 놓칩니다
      if (/<script type="application\/json">\s*$/.test(line)) inData = true;
      return `<span class="${cls}"><i>${i + 1}</i>${body}</span>`;
    }).join('');
    return first;
  }
  function show({ title, id, sub, text, link }) {
    dlgId = link ? id : null;
    dlgText = text;
    dlgTitle.replaceChildren(title);
    if (id) dlgTitle.append(el('code', null, id));
    dlgSub.innerHTML = sub;
    if (dlgLink) dlgLink.hidden = !link;
    const first = paint(text);
    if (!dlg.open) dlg.showModal();
    const line = first >= 0 ? dlgCode.children[first] : null;
    dlgCode.scrollTop = line ? Math.max(0, line.offsetTop - 56) : 0;
  }
  function openCode(id, blocked) {
    show({ title: nameOf(id), id, sub: blocked ? T.blocked : T.sub, text: current[id] || code[id] || '', link: true });
    if (blocked) {
      const sel = window.getSelection(), r = document.createRange();
      r.selectNodeContents(dlgCode);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }
  function exampleCode() {
    const list = (V.example || []).filter((x) => code[x.id]);
    const cell = (x) => `<div${x.wide ? ' style="grid-column: span 2;"' : ''}>\n${current[x.id] || code[x.id]}</div>`;
    return `${T.exampleComment}\n<div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px;">\n${list.map(cell).join('\n')}\n</div>\n`;
  }

  document.addEventListener('click', async (e) => {
    if (menu && !e.target.closest('.copy')) closeMenu();
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const id = t.dataset.id, act = t.dataset.act;
    if (act === 'code') openCode(id);
    else if (act === 'copy') openMenu(t);
    else if (act === 'copy-code' || act === 'copy-prompt' || act === 'copy-link') {
      const inMenu = Boolean(t.closest('.menu'));   // 갤러리 타일의 버튼은 메뉴 없이 바로 복사합니다
      const btn = inMenu ? menu && menu.btn : t;
      if (inMenu) closeMenu(true);
      const body = current[id] || code[id];
      const ok = await copyText(act === 'copy-code' ? body : act === 'copy-prompt' ? (V.prompt || {})[id] + body : linkOf(id));
      if (ok) done(btn, act === 'copy-code' ? T.copied : act === 'copy-prompt' ? T.promptCopied : T.linkCopied);
      else if (act === 'copy-code') openCode(id, true);
    } else if (act === 'example') {
      show({ title: T.exampleTitle, sub: T.exampleSub, text: exampleCode(), link: false });
    } else if (act === 'dlg-copy') {
      if (await copyText(dlgText)) done(t, T.copied);
    } else if (act === 'dlg-link') {
      if (dlgId && await copyText(linkOf(dlgId))) done(t, T.linkCopied);
    } else if (act === 'dlg-close') dlg.close();
  });
  if (dlg) dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('keydown', (e) => {
    if (menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const items = $$('button', menu.box), k = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(k + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    } else if (menu && e.key === 'Escape') {
      e.preventDefault();
      closeMenu(true);
    } else if (menu && e.key === 'Tab') closeMenu();
    else if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      if (qdlg) { e.preventDefault(); openSearch(); }
    }
  });

  // 카드 찾기: 이름 · id · 차트 이름 · 목적 색인의 목적과 조건 · 쓰임 설명에서 찾고, 이름이 맞는 카드를 먼저 둡니다.
  const q = $('#q'), pop = $('#q-pop');
  if (q && pop) {
    const kbd = $('.search kbd');
    if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbd.textContent = 'Ctrl K';
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s\-·_]/g, '');
    const rows = index.map((x) => ({ x, n: norm(x.name), i: norm(x.id), c: norm(x.catName), t: norm(x.tags), w: norm(x.when) }));
    let hits = [], sel = -1;
    const find = (s) => {
      const t = norm(s);
      if (!t) return [];
      const rank = (r) => (r.n.startsWith(t) || r.i.startsWith(t) ? 0 : r.n.includes(t) || r.i.includes(t) ? 1 : r.c.includes(t) ? 2 : r.t.includes(t) ? 3 : r.w.includes(t) ? 4 : 9);
      return rows.map((r) => [rank(r), r]).filter(([k]) => k < 9).sort((a, b) => a[0] - b[0]).slice(0, 8).map(([, r]) => r.x);
    };
    const close = () => { pop.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); };
    const go = (url) => { close(); if (qdlg && qdlg.open) qdlg.close(); location.href = url; };
    const render = () => {
      pop.replaceChildren(...(hits.length ? hits.map((r, k) => {
        const li = el('li');
        li.id = `q-${k}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(k === sel));
        const a = el('a');
        a.href = r.url;
        a.tabIndex = -1;
        a.append(el('b', null, r.name), el('span', null, r.catName), el('small', null, r.when));
        a.addEventListener('mousedown', (ev) => ev.preventDefault());
        a.addEventListener('click', (ev) => { ev.preventDefault(); go(r.url); });
        li.append(a);
        return li;
      }) : [el('li', 'none', T.none)]));
      pop.hidden = false;
      q.setAttribute('aria-expanded', 'true');
      if (sel >= 0) q.setAttribute('aria-activedescendant', `q-${sel}`); else q.removeAttribute('aria-activedescendant');
    };
    q.addEventListener('input', () => { hits = find(q.value); sel = hits.length ? 0 : -1; if (q.value.trim()) render(); else close(); });
    q.addEventListener('focus', () => { if (q.value.trim()) render(); });
    q.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && hits.length) {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
        render();
        const on = $(`#q-${sel}`);
        if (on) on.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0) {
        e.preventDefault();
        go(hits[sel].url);
      } else if (e.key === 'Escape' && !pop.hidden && q.value) { e.preventDefault(); q.value = ''; close(); }
    });
  }

  // 한 페이지 갤러리: 옆 목록이 지금 보이는 차트를 짚고, 휴대폰의 가로 목록은 그 차트가 보이게 옮깁니다.
  if (V.page === 'one') {
    const side = $('.side');
    const links = $$('.side a[data-cat]').map((a) => ({ a, sec: document.getElementById(`cat-${a.dataset.cat}`) })).filter((l) => l.sec);
    let ticking = false, shown = null;
    const spy = () => {
      ticking = false;
      let on = null;
      for (const l of links) if (l.sec.getBoundingClientRect().top <= 160) on = l;
      links.forEach((l) => l.a.classList.toggle('is-on', l === on));
      if (on && on !== shown) {
        shown = on;
        if (side && side.scrollWidth > side.clientWidth) {
          const sr = side.getBoundingClientRect(), ar = on.a.getBoundingClientRect();
          if (ar.left < sr.left || ar.right > sr.right) side.scrollBy({ left: ar.left - sr.left - 16, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }
})();
