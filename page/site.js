(() => {
  'use strict';
  // window.VZB: site(공개 주소), base(언어별 경로: 영어 '' · 한국어 '/ko'), t(이 스크립트가 적는 문구),
  // index([{ id, name, catName(차트 종류), when, url(첫 화면의 그 카드 타일) }]), code({ 카드 id: 코드 }),
  // prompt({ 카드 id: 프롬프트 복사에서 코드 앞에 붙는 머리말 }).
  const V = window.VZB || {};
  const code = V.code || {};
  const index = V.index || [];
  const SITE = V.site || 'https://blocks.vizney.com';
  const BASE = V.base || '';
  const T = Object.assign({ copied: '복사됨', linkCopied: '링크 복사됨', promptCopied: '프롬프트 복사됨', toLight: '밝은 바탕으로 보기', toDark: '어두운 바탕으로 보기', sub: '<b>주황 줄</b>의 데이터(JSON)만 바꾸면 됩니다. 나머지는 그대로 둡니다.', blocked: '복사가 막혀 있습니다. 코드를 선택해 두었으니 Ctrl+C(⌘+C)로 복사하세요.', none: '찾는 카드가 없습니다.' }, V.t);
  const current = {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

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

  // 카드 JSON의 한 필드만 바꿉니다(바탕). 값이 없으면 필드를 빼 기본값으로 둡니다.
  const pretty = (data) => JSON.stringify(data, null, 2)
    .replace(/\[\n\s+([^\[\]{}]*?)\n\s+\]/g, (m, inner) => `[${inner.split(/,\n\s+/).join(', ')}]`)
    .replace(/\{\n\s+([^\[\]{}]*?)\n\s+\}/g, (m, inner) => `{ ${inner.split(/,\n\s+/).join(', ')} }`);
  function withField(src, field, value) {
    return src.replace(/(<script type="application\/json">\n)([\s\S]*?)(\n<\/script>)/, (m, a, body, b) => {
      const data = JSON.parse(body), out = {};
      // 이미 있는 필드는 제자리에서 값만 바꾸고, 없는 필드는 format(없으면 subtitle) 뒤에 넣습니다.
      if (field in data && value !== undefined) { data[field] = value; return a + pretty(data) + b; }
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
  // 갤러리 타일: 카드는 복사되는 그대로(예시 데이터의 제목과 부제) 그립니다. 바탕은 어둡게(Vizney 검정) 시작하고
  // 카드 오른쪽 위 단추로 타일마다 밝게 바꿀 수 있습니다. 복사하는 코드는 예시 데이터 그대로에 보이는 바탕만 따라갑니다("theme": "dark").
  // 카드 이름은 카드 아래에 있습니다.
  function setTheme(tile, dark) {
    const id = tile.dataset.gal, host = $('[data-mount]', tile), btn = $('[data-act="theme"]', tile);
    tile.classList.toggle('is-dark', dark);
    current[id] = dark ? withField(code[id], 'theme', 'dark') : code[id];
    mount(host, current[id]);
    fitTile(tile);
    btn.setAttribute('aria-label', dark ? T.toLight : T.toDark);
    btn.title = dark ? T.toLight : T.toDark;
  }
  // 갤러리 타일에서만 컨트롤을 보기 좋게 가운데에 둡니다(복사하는 코드와는 상관없습니다).
  // Range Slider: 레일 위에 뜨는 분포 창까지 한 덩어리로 보고 가운데에 두도록, 창 높이만큼 위를 비웁니다.
  // Download Button: 펼쳐진 단추 전체가 가운데에 오도록, 펼칠 때 아이콘을 늘어나는 폭의 절반만큼 반대쪽으로 옮깁니다(site.css).
  // Date Picker: 닫혀 있을 때는 단추만 타일 가운데에 두고, 달력이 열리면 달력 높이만큼 아래를 비워 단추가 달력과 함께 위로 올라가게 합니다(site.css).
  // 열림은 카드의 .vzb-dp.is-open으로 알고, 비울 높이는 --gt-dp-pad에 적어 둡니다. 실제 화면에 붙인 카드는 제자리에서 열립니다.
  function fitTile(tile) {
    const host = $('[data-mount]', tile);
    const fit = () => {
      const pop = $('.vzb-sl-pop', host), menu = $('.vzb-dl-menu', host), cal = $('.vzb-dp-pop', host);
      host.style.paddingTop = pop ? `${pop.offsetHeight + 6}px` : '';
      if (cal) host.style.setProperty('--gt-dp-pad', `${cal.offsetHeight + 8}px`); else host.style.removeProperty('--gt-dp-pad');
      if (menu) tile.style.setProperty('--gt-dl-shift', `${Math.max(0, menu.scrollWidth - menu.offsetHeight) / 2}px`);
    };
    requestAnimationFrame(fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  $$('.gt[data-gal]').forEach((tile) => {
    if (!code[tile.dataset.gal]) return;
    setTheme(tile, tile.classList.contains('is-dark'));
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
  const linkOf = (id) => `${SITE}${BASE}/cards/${id}.txt`;
  const nameOf = (id) => (index.find((x) => x.id === id) || {}).name || id;

  // 코드 창: 복사가 막힌 곳에서 코드 복사를 누르면 코드를 골라 둔 채 엽니다. 줄 번호를 달고, 데이터 JSON 줄은 옅은 주황 바탕에 색을 넣고, 나머지는 옅게 둡니다.
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
      } else if (i < 4 && /^\s*<!-{2}|^\s{5}\S/.test(line)) cls += ' is-head';   // 카드 코드 맨 위의 주석(버전 · 주소 · 붙이는 법)
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

  // 타일의 단추: 바탕 전환, 프롬프트 복사(규칙과 쓰는 법을 앞에 붙인 카드 코드), 코드 복사. 코드 창의 단추: 복사, AI용 링크, 닫기.
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const id = t.dataset.id, act = t.dataset.act;
    if (act === 'copy-llms') {   // 제목 옆 단추: llms.txt 주소를 복사한다. 복사가 막히면 링크대로 그 파일을 연다.
      e.preventDefault();
      t.style.minWidth = `${t.offsetWidth}px`;
      if (await copyText(`${SITE}${BASE}/llms.txt`)) done(t, T.linkCopied); else location.href = t.href;
      return;
    }
    if (act === 'theme') { const tile = t.closest('.gt'); setTheme(tile, !tile.classList.contains('is-dark')); }
    else if (act === 'copy-code' || act === 'copy-prompt') {
      const body = current[id] || code[id];
      const ok = await copyText(act === 'copy-code' ? body : (V.prompt || {})[id] + body);
      if (ok) done(t, act === 'copy-code' ? T.copied : T.promptCopied);
      else if (act === 'copy-code') openCode(id, true);
    } else if (act === 'dlg-copy') {
      if (await copyText(dlgText)) done(t, T.copied);
    } else if (act === 'dlg-link') {
      if (dlgId && await copyText(linkOf(dlgId))) done(t, T.linkCopied);
    } else if (act === 'dlg-close') dlg.close();
  });
  if (dlg) dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k' && qdlg) { e.preventDefault(); openSearch(); }
  });

  // 카드 찾기: 이름 · id · 차트 종류 · 쓰임 설명에서 찾고, 이름이 맞는 카드를 먼저 둡니다. 고르면 첫 화면의 그 카드 타일로 갑니다.
  const q = $('#q'), pop = $('#q-pop');
  if (q && pop) {
    const kbd = $('.search kbd');
    if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) kbd.textContent = 'Ctrl K';
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s\-·_]/g, '');
    const rows = index.map((x) => ({ x, n: norm(x.name), i: norm(x.id), c: norm(x.catName), w: norm(x.when) }));
    let hits = [], sel = -1;
    const find = (s) => {
      const t = norm(s);
      if (!t) return [];
      const rank = (r) => (r.n.startsWith(t) || r.i.startsWith(t) ? 0 : r.n.includes(t) || r.i.includes(t) ? 1 : r.c.includes(t) ? 2 : r.w.includes(t) ? 3 : 9);
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
})();
