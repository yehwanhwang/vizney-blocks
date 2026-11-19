  // Select Menu: 항목이 많아 칩으로 다 늘어놓기 어려울 때(국가 · 지역 · 매장 · 상품 필터), 목록을 펼쳐 검색하고 고르는 컨트롤입니다.
  // 가만히 있을 때는 지금 고른 것을 적은 단추 하나이고, 누르면 그 아래에 검색칸과 목록이 떠오릅니다. 카드 머리 없이 조작부만 그립니다.
  // options는 이름 글자이거나 { name, count }이고, count를 주면 줄마다 그 항목의 데이터 양을 작은 막대와 숫자로 보여 줍니다
  // (목록이 펼쳐질 때 막대가 0에서 자라, 어느 항목에 데이터가 몰려 있는지 고르기 전에 보입니다).
  // 여럿을 고르는 것이 기본이고(value는 options 순서대로 담은 배열, 비우면 모두), "mode": "one"이면 하나만 고릅니다(value는 이름 하나, 고르면 닫힘).
  // 검색칸에 치면 맞는 항목만 남고(맞지 않는 줄은 접히며 사라짐) 맞는 글자가 드러납니다. 한글은 초성으로도 찾습니다(ㄱ → 경기 · 강원 …).
  // 값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value })를 보내고, data-vzb-value에도 적습니다.
  // 키보드: 단추에서 Enter · Space · 아래 화살표로 열고, 검색칸에서 위아래 화살표로 항목을 옮기고 Enter로 고릅니다. Esc는 검색어를 지우고, 비어 있으면 닫습니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 열고 · 검색하고 · 고르는 흐름을 차례로 보여 줍니다.
  mount('select-menu', (card, d, f) => {
    const opts = [], seen = new Set();
    (Array.isArray(d.options) ? d.options : []).forEach((o) => {
      const nm = o && typeof o === 'object' ? o.name : o;
      if (nm == null || nm === '' || seen.has(String(nm))) return;
      seen.add(String(nm));
      const c = o && typeof o === 'object' && o.count !== null && o.count !== '' && isFinite(+o.count) ? Math.max(0, +o.count) : null;
      opts.push({ name: String(nm), count: c });
    });
    if (!opts.length) throw new Error(tx(d, 'options를 확인하세요.'));
    const names = opts.map((o) => o.name), one = d.mode === 'one';
    const sel = new Set();
    if (one) { const v = Array.isArray(d.value) ? d.value[0] : d.value; sel.add(names.includes(String(v)) ? String(v) : names[0]); }
    else (Array.isArray(d.value) ? d.value.map(String).filter((v) => names.includes(v)) : names).forEach((v) => sel.add(v));
    const hasCount = opts.some((o) => o.count != null), cmax = Math.max(1, ...opts.map((o) => o.count || 0));
    const name = d.label || tx(d, '항목');   // 제목을 그리지 않으므로 화면 낭독기용 이름은 label에서 읽습니다
    const allLabel = d.all == null || d.all === '' ? tx(d, '전체') : String(d.all);
    const uid = `vzb-sm-${Math.random().toString(36).slice(2, 8)}`;

    // 단추: 목록 아이콘 · 지금 고른 것 · 고른 수(여럿 고를 때, 굴러가는 숫자) · 펼침 표시
    const root = el('div', 'vzb-sm'), anchorEl = el('div', 'vzb-sm-anchor'), say = el('p', 'vzb-sr');
    say.setAttribute('aria-live', 'polite');
    root.setAttribute('data-vzb-input', '');
    root.classList.toggle('is-end', d.align === 'end');
    const btn = el('button', 'vzb-sm-btn');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const ic = svgEl('svg', { class: 'vzb-sm-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M6 4h7.5M6 8h7.5M6 12h7.5' }), svgEl('circle', { cx: '2.75', cy: '4', r: '1' }), svgEl('circle', { cx: '2.75', cy: '8', r: '1' }), svgEl('circle', { cx: '2.75', cy: '12', r: '1' }));
    const val = el('span', 'vzb-sm-val'), txt = el('span', 'vzb-sm-tx');
    val.append(txt);
    const cnt = el('span', 'vzb-sm-n'), cntNum = el('span', 'vzb-rl');
    cnt.setAttribute('aria-hidden', 'true');
    cnt.append(cntNum);
    const chev = svgEl('svg', { class: 'vzb-sm-chev', viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    chev.append(svgEl('path', { d: 'M3 4.6l3 3 3-3' }));
    btn.append(ic, val, ...(one ? [] : [cnt]), chev);

    // 펼친 목록: 검색칸, (여럿 고를 때) 모두 고르기 · 모두 풀기와 고른 수, 항목 줄, 맞는 항목이 없을 때의 안내
    const pop = el('div', 'vzb-sm-pop');
    const sbox = el('div', 'vzb-sm-search'), sic = svgEl('svg', { class: 'vzb-sm-sic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    sic.append(svgEl('circle', { cx: '7', cy: '7', r: '4.5' }), svgEl('path', { d: 'M10.5 10.5l3 3' }));
    const input = el('input', 'vzb-sm-in');
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = tx(d, '검색');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', `${uid}-list`);
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-label', tx(d, '%s 검색', name));
    const wipe = el('button', 'vzb-sm-wipe');
    wipe.type = 'button';
    wipe.tabIndex = -1;
    wipe.setAttribute('aria-label', tx(d, '검색어 지우기'));
    const wx = svgEl('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    wx.append(svgEl('path', { d: 'M3.5 3.5l5 5M8.5 3.5l-5 5' }));
    wipe.append(wx);
    sbox.append(sic, input, wipe);
    const bar = el('div', 'vzb-sm-bar'), allB = el('button', 'vzb-sm-act', tx(d, '모두 고르기')), noneB = el('button', 'vzb-sm-act', tx(d, '모두 풀기')), tally = el('span', 'vzb-sm-tally');
    allB.type = noneB.type = 'button';
    bar.append(allB, noneB, tally);
    const list = el('div', 'vzb-sm-list');
    list.id = `${uid}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', name);
    if (!one) list.setAttribute('aria-multiselectable', 'true');
    const tick = () => {
      const s = svgEl('svg', { class: 'vzb-sm-ck', viewBox: '0 0 12 12', 'aria-hidden': 'true' });
      s.append(svgEl('path', { d: 'M2.4 6.3l2.4 2.4 4.9-5.4' }));
      return s;
    };
    const rows = opts.map((o, i) => {
      const r = el('div', 'vzb-sm-opt');
      r.id = `${uid}-${i}`;
      r.setAttribute('role', 'option');
      const box = el('span', 'vzb-sm-box');
      box.append(tick());
      const nm = el('span', 'vzb-sm-nm', o.name);
      r.append(box, nm);
      if (hasCount) {
        const q = el('span', 'vzb-sm-q'), b = el('span', 'vzb-sm-qb'), n = el('span', 'vzb-sm-qn', o.count == null ? '' : num(o.count));
        b.style.setProperty('--vzb-w', `${((o.count || 0) / cmax) * 100}%`);
        q.append(b, n);
        r.append(q);
        if (o.count != null) r.setAttribute('aria-label', `${o.name}, ${num(o.count)}${d.noun ? ` ${d.noun}` : ''}`);
      }
      list.append(r);
      return { r, nm, name: o.name, low: o.name.toLowerCase(), cho: initials(o.name), on: true };
    });
    const empty = el('p', 'vzb-sm-empty');
    empty.hidden = true;
    pop.append(sbox, ...(one ? [] : [bar]), list, empty);
    anchorEl.append(btn, pop);
    root.append(anchorEl, say);
    card.append(root);

    // 한글 초성: 가(0xAC00)부터 588자마다 초성이 바뀝니다. 초성 글자(0x3131…)만 친 검색어는 이름의 초성과 견줍니다.
    function initials(s) {
      const CHO = [0x3131, 0x3132, 0x3134, 0x3137, 0x3138, 0x3139, 0x3141, 0x3142, 0x3143, 0x3145, 0x3146, 0x3147, 0x3148, 0x3149, 0x314a, 0x314b, 0x314c, 0x314d, 0x314e];
      return [...s].map((c) => { const k = c.charCodeAt(0) - 0xac00; return k >= 0 && k < 11172 ? String.fromCharCode(CHO[Math.floor(k / 588)]) : c.toLowerCase(); }).join('');
    }
    const isCho = (q) => q.length > 0 && [...q].every((c) => { const k = c.charCodeAt(0); return k >= 0x3131 && k <= 0x314e; });
    // 맞는 자리: [시작, 끝] 또는 null. 초성 검색이면 초성 글자열에서, 아니면 이름에서 대소문자 없이 찾습니다(두 글자열의 자리는 글자마다 같습니다).
    const hit = (row, q) => {
      if (!q) return [0, 0];
      const at = (isCho(q) ? row.cho : row.low).indexOf(q.toLowerCase());
      return at < 0 ? null : [at, at + q.length];
    };

    let q = '', active = -1;
    function filter() {
      let n = 0;
      rows.forEach((row) => {
        const h = hit(row, q);
        row.on = !!h;
        row.r.classList.toggle('is-gone', !h);
        row.r.setAttribute('aria-hidden', String(!h));
        if (h) n += 1;
        // 맞는 글자를 드러냅니다(밑줄이 왼쪽에서 그어지며 굵어짐). 검색어가 없으면 이름만 둡니다.
        if (h && q) row.nm.replaceChildren(row.name.slice(0, h[0]), el('mark', 'vzb-sm-hit', row.name.slice(h[0], h[1])), row.name.slice(h[1]));
        else row.nm.textContent = row.name;
      });
      empty.hidden = n > 0;
      empty.textContent = n ? '' : tx(d, '"%s"와 맞는 항목이 없습니다.', q);
      sbox.classList.toggle('has-q', !!q);
      const vis = visible();
      if (!vis.includes(active)) setActive(vis.length ? vis[0] : -1);
      if (q) say.textContent = n ? tx(d, '%s개 찾음', n) : empty.textContent;
      list.scrollTop = 0;
    }
    const visible = () => rows.map((row, i) => (row.on ? i : -1)).filter((i) => i >= 0);
    function setActive(i, scroll) {
      active = i;
      rows.forEach((row, k) => row.r.classList.toggle('is-active', k === i));
      if (i >= 0) input.setAttribute('aria-activedescendant', rows[i].r.id); else input.removeAttribute('aria-activedescendant');
      if (scroll && i >= 0) {
        const r = rows[i].r, top = r.offsetTop, bot = top + r.offsetHeight;
        if (top < list.scrollTop) list.scrollTop = top;
        else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight;
      }
    }

    // 단추 글자: 모두 고르면 all, 하나도 안 고르면 '고른 항목 없음', 아니면 고른 이름을 options 순서대로 잇고 넘치면 '+남은 수'로 줄입니다.
    const picked = () => names.filter((v) => sel.has(v));
    function fitText() {
      const p = picked();
      if (!one && p.length === names.length) { txt.textContent = allLabel; return; }
      if (!p.length) { txt.textContent = tx(d, '고른 항목 없음'); return; }
      for (let k = p.length; k >= 1; k--) {
        txt.textContent = p.slice(0, k).join(', ') + (k < p.length ? ` +${p.length - k}` : '');
        if (val.scrollWidth <= val.clientWidth + 1 || k === 1) break;
      }
    }
    function valueText() {
      const p = picked();
      if (one) return p[0];
      if (p.length === names.length) return `${allLabel}, ${tx(d, '%1개 중 %2개 고름', names.length, p.length)}`;
      return `${p.length ? p.join(', ') : tx(d, '고른 항목 없음')}, ${tx(d, '%1개 중 %2개 고름', names.length, p.length)}`;
    }
    function paint() {
      rows.forEach((row) => row.r.setAttribute('aria-selected', String(sel.has(row.name))));
      root.classList.toggle('is-none', !sel.size);
      if (!one) {
        roll(cntNum, String(sel.size));
        tally.textContent = tx(d, '%1개 중 %2개 고름', names.length, sel.size);
        const vis = visible();
        allB.disabled = vis.every((i) => sel.has(rows[i].name));
        noneB.disabled = vis.every((i) => !sel.has(rows[i].name));
      }
      fitText();
      btn.setAttribute('aria-label', `${name}: ${valueText()}`);
    }
    function emit(quiet) {
      const value = one ? picked()[0] : picked();
      card.setAttribute('data-vzb-value', JSON.stringify(value));
      if (quiet) return;
      say.textContent = valueText();
      card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value } }));
    }

    // 열고 닫기: 아래에 목록이 들어갈 자리가 없고 위가 더 넓으면 위로 엽니다. 닫을 때 검색어를 지웁니다.
    let open = false, closeT = 0;
    const loop = !!card.closest('[data-vzb-loop]');
    function place() {
      const r = btn.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      const below = vh - r.bottom - 8, above = r.top - 8;
      root.classList.toggle('is-up', below < pop.offsetHeight + 8 && above > below);
    }
    function setOpen(v, focus) {
      clearTimeout(closeT);
      if (open === v) return;
      open = v;
      if (v) {
        place();
        const first = names.findIndex((x) => sel.has(x));
        setActive(first >= 0 ? first : 0);
        list.scrollTop = 0;
        if (active >= 0) setActive(active, true);
      } else if (q) { q = ''; input.value = ''; filter(); }
      root.classList.toggle('is-open', v);
      btn.setAttribute('aria-expanded', String(v));
      if (v && focus) input.focus({ preventScroll: true });
    }
    function toggle(i) {
      if (i < 0) return;
      const nm = rows[i].name;
      if (one) {
        const changed = !sel.has(nm);
        sel.clear();
        sel.add(nm);
        paint();
        if (changed) emit();
        if (!loop) closeT = setTimeout(() => { const inside = root.contains(document.activeElement); setOpen(false); if (inside) btn.focus(); }, 180);
        return;
      }
      if (sel.has(nm)) sel.delete(nm); else sel.add(nm);
      paint();
      emit();
    }
    function bulk(on) {   // 모두 고르기 · 모두 풀기: 검색 중이면 맞는 항목에만 씁니다
      const before = sel.size;
      visible().forEach((i) => { if (on) sel.add(rows[i].name); else sel.delete(rows[i].name); });
      if (sel.size === before) return;
      paint();
      emit();
    }

    // 손으로 하는 조작
    let idle = 0;
    const touch = () => { idle = performance.now() + 6000; };
    root.addEventListener('pointerdown', touch);
    root.addEventListener('keydown', touch);
    btn.addEventListener('click', () => setOpen(!open, true));
    btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true, true); } });
    input.addEventListener('input', () => { q = input.value.trim(); filter(); paint(); });
    input.addEventListener('keydown', (e) => {
      const vis = visible(), k = vis.indexOf(active);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!vis.length) return;
        const j = k < 0 ? 0 : Math.max(0, Math.min(vis.length - 1, k + (e.key === 'ArrowDown' ? 1 : -1)));
        setActive(vis[j], true);
      } else if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault();
        if (!vis.length) return;
        const j = Math.max(0, Math.min(vis.length - 1, (k < 0 ? 0 : k) + (e.key === 'PageDown' ? 5 : -5)));
        setActive(vis[j], true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0 && rows[active].on) toggle(active);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (q) { q = ''; input.value = ''; filter(); paint(); return; }
        setOpen(false);
        btn.focus();
      }
    });
    wipe.addEventListener('click', () => { q = ''; input.value = ''; filter(); paint(); input.focus(); });
    list.addEventListener('pointerdown', (e) => e.preventDefault());   // 누르는 동안 검색칸의 포커스를 지킵니다
    list.addEventListener('click', (e) => { const r = e.target.closest('.vzb-sm-opt'); if (r) toggle(rows.findIndex((x) => x.r === r)); });
    list.addEventListener('pointermove', (e) => { const r = e.target.closest('.vzb-sm-opt'); const i = r ? rows.findIndex((x) => x.r === r) : -1; if (i >= 0 && i !== active) setActive(i); });
    // 모두 고르기 · 모두 풀기를 누르면 그 단추가 쓸 수 없게 바뀌어 포커스를 잃으므로, 포커스를 검색칸으로 돌려 Esc · 화살표가 이어지게 합니다.
    allB.addEventListener('click', () => { bulk(true); input.focus({ preventScroll: true }); });
    noneB.addEventListener('click', () => { bulk(false); input.focus({ preventScroll: true }); });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !open) return;
      e.preventDefault();
      setOpen(false);
      btn.focus();
    });
    root.addEventListener('focusout', (e) => { if (open && e.relatedTarget && !root.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('pointerdown', function away(e) {
      if (!card.isConnected) { document.removeEventListener('pointerdown', away, true); return; }
      if (open && !root.contains(e.target)) setOpen(false);
    }, true);

    filter();
    paint();
    emit(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (card.isConnected) fitText(); });
    onSize(val, () => fitText());

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 열기 → 검색어를 한 글자씩 치기 → 맞는 항목 둘을 고르기 →
    // 검색어 지우기 → 둘을 다시 풀기 → 닫기를 차례로 보여 줍니다(한 바퀴 돌면 처음 고른 것으로 돌아옵니다).
    // 검색어는 데이터에서 고릅니다: 한글 이름이면 첫 글자의 초성, 아니면 두 글자 가운데 맞는 항목이 넷에 가장 가까운 것.
    if (loop) {
      const cands = new Map();
      rows.forEach((row) => {
        const c0 = row.cho[0];
        if (isCho(c0)) cands.set(c0, 0);
        else for (let k = 0; k + 2 <= row.low.length; k++) if (!/\s/.test(row.low.slice(k, k + 2))) cands.set(row.low.slice(k, k + 2), 0);
      });
      let word = '', best = Infinity;
      cands.forEach((_, w) => { const n = rows.filter((row) => hit(row, w)).length; const s = Math.abs(n - 4) + (n < 2 ? 9 : 0); if (s < best) { best = s; word = w; } });
      const press = (node) => { if (!node) return; node.classList.add('is-press'); setTimeout(() => node.classList.remove('is-press'), 140); };
      const typeTo = (s) => { input.value = s; q = s; filter(); paint(); };
      let picks = [];
      const steps = [];
      [...word].forEach((_, k) => steps.push(() => typeTo(word.slice(0, k + 1))));
      steps.push(() => { picks = visible().filter((i) => !sel.has(rows[i].name)).slice(0, one ? 1 : 2); if (picks[0] != null) { setActive(picks[0], true); press(rows[picks[0]].r); toggle(picks[0]); } });
      if (!one) steps.push(() => { if (picks[1] != null) { setActive(picks[1], true); press(rows[picks[1]].r); toggle(picks[1]); } });
      steps.push(() => { press(wipe); typeTo(''); });
      if (!one) steps.push(() => { picks.forEach((i) => { if (sel.has(rows[i].name)) toggle(i); }); });
      steps.push(() => setOpen(false));
      const first = names.find((x) => sel.has(x));
      let k = 0;
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!seen || performance.now() < idle) return;
        if (!open) {
          if (one && first && !sel.has(first)) { sel.clear(); sel.add(first); paint(); emit(true); }
          setOpen(true);
          k = 0;
          return;
        }
        steps[k++ % steps.length]();
      }, 1100);
      let seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
    }
  });
