  // Date Picker: 달력으로 기간(시작일과 끝일)이나 날짜 하나를 고르는 컨트롤입니다(주문일 · 기준일 필터). 카드 머리 없이 지금 기간을 적은 단추만 그립니다.
  // 단추를 누르면 그 아래(아래에 자리가 없으면 위)에 한 달 달력이 옆 내용 위로 겹쳐 떠오릅니다. 단추와 달력은 늘 같은 폭(300px, 놓인 자리가 더 좁으면 그 폭)이라
  // 기간이 바뀌어도 단추가 늘고 줄지 않습니다. 기간 글자가 단추에 다 들어가지 않으면 기준일과 같은 해의 기간은 연도를 빼고,
  // 그래도 길면 숫자 날짜(26. 10. 17. / 10/17/26)로 줄여 적습니다(화면 낭독기는 늘 연도까지 읽습니다).
  // 날짜 둘을 차례로 누르면 기간이 됩니다. 첫 날짜를 누른 뒤에는 마우스나 포커스가 닿은 날짜까지 옅은 띠와 일수가 따라오고,
  // 두 번째 날짜를 누르면 띠가 시작일에서 끝일까지 한 번에 그어지며(처음엔 빠르고 끝에서 느려집니다), 단추의 기간이 살짝 떠오르며 바뀌고 일수가 굴러갑니다.
  // 달력은 늘 6주를 그리고, 그 달 앞뒤의 칸은 앞 · 다음 달의 날짜로 흐리게 채웁니다. 달마다 높이가 같고, 기간이 달을 넘어 이어지는 것이 보입니다.
  // 달을 넘기면 달력이 시간의 방향(다음 달은 왼쪽, 이전 달은 오른쪽)으로 밀려납니다.
  // min · max(YYYY-MM-DD) 밖의 날짜는 흐리게 두고 고를 수 없습니다(데이터가 있는 날짜만 고르게 합니다).
  // presets(last7 · last30 · month · lastmonth · quarter · year · all)는 달력 아래에 칩으로 두고 max(비우면 오늘)를 기준으로 계산하며,
  // 지금 기간과 같은 칩은 글자색으로 채웁니다. value는 처음 기간 ["시작", "끝"]이고 비우면 기준일까지 30일입니다.
  // "mode": "day"면 날짜 하나("YYYY-MM-DD")를 고릅니다(띠 · 일수 · presets 없음).
  // 값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value })를 보내고, data-vzb-value에도 적습니다.
  // 키보드: 단추에서 Enter · Space · 아래 화살표로 열고, 달력에서 화살표(하루 · 한 주) · Page Up/Down(한 달, Shift면 한 해) · Home/End(주의 처음 · 끝)로
  // 옮기고 Enter · Space로 고릅니다. Esc는 고르던 것을 버리고 닫습니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 달력을 연 채로, 손을 대기 전과 손을 뗀 지 6초 뒤부터 고르기를 차례로 보여 줍니다.
  mount('date-picker', (card, d, f) => {
    const DAY = 864e5, en = d.lang === 'en', loc = en ? 'en-US' : 'ko-KR';
    // 날짜는 1970-01-01부터 센 날 수(정수)로 다룹니다. 시간대와 상관없이 같은 날짜가 되도록 UTC로 셉니다.
    const parse = (s) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s == null ? '' : s).trim());
      if (!m) return null;
      const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
      return new Date(t).getUTCDate() === +m[3] ? t / DAY : null;
    };
    const iso = (n) => new Date(n * DAY).toISOString().slice(0, 10);
    const at = (y, m, dd) => Date.UTC(y, m, dd) / DAY;
    const parts = (n) => { const t = new Date(n * DAY); return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), w: t.getUTCDay() }; };
    const monthOf = (n) => { const p = parts(n); return p.y * 12 + p.m; };
    const D = (n) => new Date(n * DAY);
    const has = (k) => d[k] != null && d[k] !== '';
    const one = d.mode === 'day';
    const min = has('min') ? parse(d.min) : -Infinity, max = has('max') ? parse(d.max) : Infinity;
    if (min == null || max == null || min > max) throw new Error(tx(d, 'min과 max를 확인하세요.'));
    const now = new Date(), anchor = isFinite(max) ? max : Math.max(min, at(now.getFullYear(), now.getMonth(), now.getDate()));   // 기준일: max, 없으면 오늘
    const clamp = (n) => Math.max(min, Math.min(max, n));
    let lo, hi;
    if (one) {
      const v = has('value') ? parse(d.value) : anchor;
      if (v == null) throw new Error(tx(d, 'value의 날짜를 YYYY-MM-DD로 적으세요.'));
      lo = hi = clamp(v);
    } else {
      const v = Array.isArray(d.value) ? d.value.map(parse) : null;
      if (d.value != null && (!v || v.length !== 2 || v.some((x) => x == null))) throw new Error(tx(d, 'value의 날짜를 YYYY-MM-DD로 적으세요.'));
      [lo, hi] = v ? [Math.min(...v), Math.max(...v)] : [anchor - 29, anchor];
      lo = clamp(lo);
      hi = clamp(hi);
    }
    // 빠른 선택: 기준일에서 계산하고 min · max 안으로 줄입니다.
    const PRE = {
      last7: () => [anchor - 6, anchor],
      last30: () => [anchor - 29, anchor],
      month: () => { const p = parts(anchor); return [at(p.y, p.m, 1), anchor]; },
      lastmonth: () => { const p = parts(anchor); return [at(p.y, p.m - 1, 1), at(p.y, p.m, 0)]; },
      quarter: () => { const p = parts(anchor); return [at(p.y, p.m - (p.m % 3), 1), anchor]; },
      year: () => { const p = parts(anchor); return [at(p.y, 0, 1), anchor]; },
      all: () => (isFinite(min) && isFinite(max) ? [min, max] : null),
    };
    const NAMES = { last7: tx(d, '최근 7일'), last30: tx(d, '최근 30일'), month: tx(d, '이번 달'), lastmonth: tx(d, '지난달'), quarter: tx(d, '이번 분기'), year: tx(d, '올해'), all: tx(d, '전체') };
    const pre = one ? [] : (Array.isArray(d.presets) ? d.presets : []).map(String).filter((k) => PRE[k]).map((k) => {
      const r = PRE[k]();
      if (!r) return null;
      const a = clamp(r[0]), b = clamp(r[1]);
      return a <= b ? { k, a, b } : null;
    }).filter(Boolean);

    // 날짜 글자: 브라우저의 날짜 표기(Intl)로 적습니다. 영어는 Oct 1 – 31, 2026, 한국어는 2026년 10월 1일~31일.
    const fmt = new Intl.DateTimeFormat(loc, { year: 'numeric', month: en ? 'short' : 'long', day: 'numeric', timeZone: 'UTC' });
    const monthFmt = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long', timeZone: 'UTC' });
    const fullFmt = new Intl.DateTimeFormat(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const wkFmt = new Intl.DateTimeFormat(loc, { weekday: 'narrow', timeZone: 'UTC' });
    const noYear = new Intl.DateTimeFormat(loc, { month: en ? 'short' : 'long', day: 'numeric', timeZone: 'UTC' });
    const short = new Intl.DateTimeFormat(loc, { year: '2-digit', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
    // 기간 글자. 한국어 물결표 앞뒤 띄어쓰기는 브라우저마다 달라 늘 한 칸씩 띄웁니다.
    const spanText = (f, a, b) => (a === b ? f.format(D(a)) : f.formatRange ? f.formatRange(D(a), D(b)) : `${f.format(D(a))} – ${f.format(D(b))}`).replace(/\s*~\s*/, ' ~ ');
    const rangeText = (a, b) => spanText(fmt, a, b);
    const unitOf = (n) => tx(d, n === 1 ? '일간|1' : '일간');
    const daysText = (n) => withUnit(num(n, 0), unitOf(n));
    const valueText = () => (one ? fmt.format(D(lo)) : `${rangeText(lo, hi)}, ${daysText(hi - lo + 1)}`);
    const name = d.label || tx(d, '기간');   // 제목을 그리지 않으므로 화면 낭독기용 이름은 label에서 읽습니다

    // 단추: 달력 아이콘 · 지금 기간 · 일수 · 펼침 표시
    const root = el('div', 'vzb-dp'), anchorEl = el('div', 'vzb-dp-anchor'), say = el('p', 'vzb-sr');
    say.setAttribute('aria-live', 'polite');
    root.setAttribute('data-vzb-input', '');
    root.classList.toggle('is-end', d.align === 'end');   // 화면 오른쪽 끝에 둘 때: 단추를 오른쪽에 붙이고 달력도 오른쪽 끝에 맞춥니다
    const btn = el('button', 'vzb-dp-btn');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    const ic = svgEl('svg', { class: 'vzb-dp-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('rect', { x: '2.25', y: '3.25', width: '11.5', height: '10.5', rx: '2.25' }), svgEl('path', { d: 'M2.25 6.75h11.5M5.5 1.75v3M10.5 1.75v3' }));
    const val = el('span', 'vzb-dp-val'), txt = el('span', 'vzb-dp-tx');
    val.append(txt);
    const cnt = el('span', 'vzb-dp-n'), cntNum = el('span', 'vzb-rl'), cntUnit = el('span', 'vzb-dp-unit');
    cnt.setAttribute('aria-hidden', 'true');
    cnt.append(cntNum, cntUnit);
    const chev = svgEl('svg', { class: 'vzb-dp-chev', viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    chev.append(svgEl('path', { d: 'M3 4.6l3 3 3-3' }));
    btn.append(ic, val, ...(one ? [] : [cnt]), chev);

    // 달력: 달 이름과 이전 · 다음 단추, 요일, 날짜 칸(6주), 빠른 선택 칩. 고르는 동안 일수 말풍선이 따라옵니다.
    const pop = el('div', 'vzb-dp-pop');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', name);
    const hd = el('div', 'vzb-dp-hd'), title = el('span', 'vzb-dp-title');
    title.setAttribute('aria-live', 'polite');
    const navBtn = (dir) => {
      const b = el('button', 'vzb-dp-nav');
      b.type = 'button';
      b.setAttribute('aria-label', tx(d, dir < 0 ? '이전 달' : '다음 달'));
      const s = svgEl('svg', { viewBox: '0 0 14 14', 'aria-hidden': 'true' });
      s.append(svgEl('path', { d: dir < 0 ? 'M8.6 3.2L4.8 7l3.8 3.8' : 'M5.4 3.2L9.2 7l-3.8 3.8' }));
      b.append(s);
      return b;
    };
    const prevB = navBtn(-1), nextB = navBtn(1);
    hd.append(title, prevB, nextB);
    const wk = el('div', 'vzb-dp-wk'), SUN = at(2000, 0, 2);   // 2000-01-02는 일요일
    wk.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 7; i++) wk.append(el('span', null, wkFmt.format(D(SUN + i))));
    const view = el('div', 'vzb-dp-view'), tip = el('span', 'vzb-dp-tip');
    tip.setAttribute('aria-hidden', 'true');
    pop.append(hd, wk, view, tip);
    let chips = [], chipBox = null;
    const chipEnds = () => { if (chipBox) { chipBox.classList.toggle('is-scroll', chipBox.scrollWidth > chipBox.clientWidth + 1); chipBox.classList.toggle('is-end', chipBox.scrollLeft + chipBox.clientWidth >= chipBox.scrollWidth - 2); } };
    if (pre.length) {
      const box = el('div', 'vzb-dp-pre');
      chipBox = box;
      box.addEventListener('scroll', chipEnds, { passive: true });
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', tx(d, '빠른 선택'));
      chips = pre.map((p) => {
        const c = el('button', 'vzb-dp-chip', NAMES[p.k]);
        c.type = 'button';
        box.append(c);
        return c;
      });
      pop.append(box);
    }
    anchorEl.append(btn, pop);
    root.append(anchorEl, say);
    card.append(root);

    // 한 달의 날짜 칸: 6주 × 7일. 그 달 앞뒤의 칸은 앞 · 다음 달의 날짜로 흐리게 채웁니다(마우스로는 고를 수 있고,
    // 키보드와 화면 낭독기는 그 달의 칸에서만 고릅니다. 화살표로 달 밖으로 나가면 달이 넘어갑니다).
    function build(month) {
      const y = Math.floor(month / 12), m = month - y * 12, first = at(y, m, 1), last = at(y, m + 1, 0), g0 = first - parts(first).w;
      const g = el('div', 'vzb-dp-grid'), list = [];
      g.setAttribute('role', 'grid');
      g.setAttribute('aria-label', monthFmt.format(D(first)));
      for (let r = 0; r < 6; r++) {
        const row = el('div', 'vzb-dp-row');
        row.setAttribute('role', 'row');
        for (let c = 0; c < 7; c++) {
          const n = g0 + r * 7 + c, inM = n >= first && n <= last, cell = el('span', 'vzb-dp-cell'), b = el('button', 'vzb-dp-day', String(parts(n).d));
          cell.setAttribute('role', 'gridcell');
          b.type = 'button';
          b.tabIndex = -1;
          b.dataset.n = n;
          if (inM) b.setAttribute('aria-label', fullFmt.format(D(n)));
          else { cell.classList.add('is-out'); b.setAttribute('aria-hidden', 'true'); }
          if (n < min || n > max) { b.disabled = true; cell.classList.add('is-off'); }
          cell.append(b);
          row.append(cell);
          list.push({ n, cell, b, inM });
        }
        g.append(row);
      }
      return { g, list, first, last, g0, g1: g0 + 41, month };
    }

    // 칠하기: 정한 기간(또는 고르는 중인 시작일 ~ 닿은 날짜)의 띠와 양 끝. sweep이면 띠의 앞머리가 시작일에서 끝일까지 한 줄로 달려가며(처음엔 빠르고
    // 끝에서 느려집니다) 띠를 긋고, 앞머리가 닿을 때 양 끝이 튀어 오릅니다. 칸마다 앞머리가 머무는 시간만큼 늦게 시작해 그만큼 동안 그어집니다.
    let cur = null, pend = null, hov = null, fday = hi, clearT = 0;
    const POP = [{ transform: 'scale(0.72)' }, { transform: 'scale(1.1)', offset: 0.6 }, { transform: 'scale(1)' }];
    function paint(mode) {
      if (!cur) return;
      const pv = pend != null, a = pv ? Math.min(pend, hov == null ? pend : hov) : lo, b = pv ? Math.max(pend, hov == null ? pend : hov) : hi;
      const sweep = mode === 'sweep', calm = mode === 'calm' || !cur.g.isConnected;
      if (sweep) {   // 띠를 지운 채로 한 번 그린 뒤 다시 켜야 처음부터 그어집니다
        cur.g.classList.add('is-still');
        cur.list.forEach((x) => x.cell.classList.remove('is-in'));
        void cur.g.offsetWidth;
        cur.g.classList.remove('is-still');
      }
      const span = cur.list.filter((x) => x.n >= a && x.n <= b).length, T = Math.min(640, 240 + span * 12);
      const when = (i) => Math.round(T * (1 - Math.cbrt(1 - Math.min(1, i / Math.max(1, span)))));   // 앞머리가 i번째 칸에 닿는 때(ease-out의 역)
      let k = 0;
      const focusN = cur.list.some((x) => x.inM && x.n === fday && !x.b.disabled) ? fday : (cur.list.find((x) => x.inM && !x.b.disabled) || {}).n;
      cur.list.forEach((x) => {
        const cl = x.cell.classList, inR = !one && b > a && x.n >= a && x.n <= b;
        const pick = pv ? x.n === pend : x.n === a || x.n === b, ring = pv && hov != null && hov !== pend && x.n === hov;
        if (inR && sweep) { x.cell.style.setProperty('--vzb-d', `${when(k)}ms`); x.cell.style.setProperty('--vzb-t', `${when(k + 1) - when(k)}ms`); k += 1; }
        else { x.cell.style.setProperty('--vzb-d', '0ms'); x.cell.style.setProperty('--vzb-t', '0ms'); }
        cl.toggle('is-in', inR);
        cl.toggle('is-pv', pv && inR);
        cl.toggle('is-lo', inR && x.n === a);
        cl.toggle('is-hi', inR && x.n === b);
        cl.toggle('is-cl', inR && x.n === cur.g0 && a < cur.g0);   // 띠가 달력 앞에서 이어 옴
        cl.toggle('is-cr', inR && x.n === cur.g1 && b > cur.g1);   // 띠가 달력 뒤로 이어 감
        cl.toggle('is-ring', ring);
        if (pick && (!cl.contains('is-pick') || sweep) && !calm && x.b.animate) x.b.animate(POP, { duration: 360, delay: sweep && x.n === b ? when(span - 1) : 0, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' });
        cl.toggle('is-pick', pick);
        x.cell.setAttribute('aria-selected', String(inR || pick));
        x.b.tabIndex = x.inM && x.n === focusN ? 0 : -1;
      });
      if (sweep) {
        clearTimeout(clearT);
        clearT = setTimeout(() => { if (cur) cur.list.forEach((x) => { x.cell.style.setProperty('--vzb-d', '0ms'); x.cell.style.setProperty('--vzb-t', '0ms'); }); }, T + 120);
      }
      chips.forEach((c, i) => c.setAttribute('aria-pressed', String(!pv && pre[i].a === lo && pre[i].b === hi)));
      if (chipBox && chipBox.scrollWidth > chipBox.clientWidth + 1) {   // 넘치면 지금 기간의 칩이 보이게 밉니다
        const on = chips.find((c) => c.getAttribute('aria-pressed') === 'true');
        if (on && open) chipBox.scrollTo({ left: Math.max(0, on.offsetLeft - chipBox.offsetLeft - 8), behavior: mode === 'calm' ? 'auto' : 'smooth' });
      }
      chipEnds();
      tipOn();
    }
    // 일수 말풍선: 고르는 중에 닿은 날짜 위에 시작일부터의 일수를 띄웁니다.
    function tipOn() {
      const x = pend != null && hov != null && cur ? cur.list.find((c) => c.n === hov) : null;
      if (!x) { tip.classList.remove('is-on'); return; }
      tip.textContent = daysText(Math.abs(hov - pend) + 1);
      const jump = !tip.classList.contains('is-on');   // 처음 뜰 때는 옛 자리에서 미끄러져 오지 않고 그 자리에서 떠오릅니다
      if (jump) tip.style.transition = 'none';
      tip.style.left = `${x.cell.offsetLeft + x.cell.offsetWidth / 2 + view.offsetLeft}px`;
      tip.style.top = `${x.cell.offsetTop + view.offsetTop + 2}px`;
      if (jump) { void tip.offsetWidth; tip.style.transition = ''; }
      tip.classList.add('is-on');
    }
    // 달 넘기기: 새 달을 그리고, 옛 달과 새 달을 한 띠처럼 시간의 방향으로 한 칸 밀어 바꿉니다(다음 달은 오른쪽에서 들어옵니다).
    function turn(month, dir) {
      const nx = build(month), old = cur;
      nx.g.classList.add('is-still');
      view.append(nx.g);
      cur = nx;
      paint('calm');
      requestAnimationFrame(() => nx.g.classList.remove('is-still'));
      if (old) {
        if (dir && nx.g.animate) {
          const w = view.offsetWidth + 16, ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
          old.g.classList.add('is-gone');
          old.g.animate([{ transform: 'none' }, { transform: `translateX(${-dir * w}px)` }], { duration: 380, easing: ease, fill: 'forwards' }).onfinish = () => old.g.remove();
          nx.g.animate([{ transform: `translateX(${dir * w}px)` }, { transform: 'none' }], { duration: 380, easing: ease });
        } else old.g.remove();
      }
      title.textContent = monthFmt.format(D(nx.first));
      if (dir && title.animate) title.animate([{ opacity: 0, transform: `translateX(${dir * 10}px)`, filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 260, easing: 'ease-out' });
      prevB.disabled = nx.first - 1 < min;
      nextB.disabled = nx.last + 1 > max;
    }
    const goMonth = (n) => { const mo = monthOf(n); if (!cur || mo !== cur.month) turn(mo, cur ? Math.sign(mo - cur.month) : 0); };

    // 단추의 글자: 바뀌면 흐려지며 바뀌고, 단추 폭이 새 글자에 맞춰 용수철처럼 늘고 줄며, 일수가 굴러갑니다.
    // 단추의 글자: 폭이 정해진 단추에 들어가는 가장 긴 표기를 고릅니다(연도까지 → 기준일과 같은 해면 연도 없이 → 숫자 날짜).
    function fitText() {
      const yr = parts(anchor).y, tries = [spanText(fmt, lo, hi)];
      if (parts(lo).y === yr && parts(hi).y === yr) tries.push(spanText(noYear, lo, hi));
      tries.push(spanText(short, lo, hi));
      for (const t of tries) {
        txt.textContent = t;
        if (!val.clientWidth || val.scrollWidth <= val.clientWidth) break;   // 마지막 표기도 넘치면 말줄임표로 줄입니다
      }
    }
    // 기간이 바뀌면 새 기간이 살짝 떠오르며 나타나고 일수가 굴러갑니다. 단추의 폭과 색은 그대로라 글자는 늘 바탕과 대비됩니다.
    function label(anim) {
      const n = hi - lo + 1;
      btn.setAttribute('aria-label', `${name}: ${valueText()}`);
      if (!one) { roll(cntNum, num(n, 0)); cntUnit.textContent = en ? ` ${unitOf(n)}` : unitOf(n); }
      fitText();   // 일수의 자릿수가 바뀌면 글자 자리도 바뀌므로 일수를 먼저 적습니다
      if (anim && val.animate) val.animate([{ opacity: 0.4, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });   // 투명에서 시작하지 않아 어느 순간에도 글자가 읽힙니다
    }
    function emit(quiet) {
      const value = one ? iso(lo) : [iso(lo), iso(hi)];
      card.setAttribute('data-vzb-value', JSON.stringify(value));
      if (quiet) return;
      say.textContent = tx(d, '%s 고름', valueText());
      card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value } }));
    }

    // 열고 닫기: 아래에 달력이 들어갈 자리가 없고 위가 더 넓으면 위로 엽니다(달력은 단추와 같은 폭이라 옆으로 넘치지 않습니다).
    let open = false, closeT = 0;
    const loop = !!card.closest('[data-vzb-loop]');
    function place() {
      const r = btn.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      const ph = pop.offsetHeight;
      const below = vh - r.bottom - 8, above = r.top - 8;
      root.classList.toggle('is-up', below < ph + 8 && above > below);
    }
    function setOpen(v, focusDay) {
      clearTimeout(closeT);
      if (open !== v) {
        open = v;
        if (v) { fday = hi; if (cur.month !== monthOf(hi)) turn(monthOf(hi), 0); place(); }   // 끝일이 든 달을 엽니다
        else { pend = null; hov = null; }
        root.classList.toggle('is-open', v);
        btn.setAttribute('aria-expanded', String(v));
        paint(v ? 'sweep' : null);
      }
      if (v && focusDay) focusOn(fday);
    }
    function focusOn(n) {
      n = clamp(n);
      goMonth(n);
      fday = n;
      if (pend != null) hov = n;
      paint();
      const x = cur.list.find((c) => c.n === n && c.inM);
      if (x) x.b.focus();
    }
    function commit(a, b) {
      const changed = a !== lo || b !== hi;
      lo = a;
      hi = b;
      pend = null;
      hov = null;
      fday = hi;
      paint('sweep');
      label(changed);
      if (changed) emit();
      if (!loop) closeT = setTimeout(() => { const inside = root.contains(document.activeElement); setOpen(false); if (inside) btn.focus(); }, 560);   // 띠가 다 그어진 뒤 닫습니다
    }
    function pick(n) {
      if (one) { commit(n, n); return; }
      if (pend == null) { pend = n; hov = n; paint(); return; }
      commit(Math.min(pend, n), Math.max(pend, n));
    }
    function usePreset(i) {
      const p = pre[i];
      if (!p) return;
      pend = null;
      hov = null;
      goMonth(p.b);
      commit(p.a, p.b);
    }
    function nav(dir) {
      if (!cur || (dir < 0 ? prevB : nextB).disabled) return;
      turn(cur.month + dir, dir);
    }

    // 손으로 하는 조작
    let idle = 0;
    const touch = () => { idle = performance.now() + 6000; };
    root.addEventListener('pointerdown', touch);
    root.addEventListener('keydown', touch);
    btn.addEventListener('click', (e) => { setOpen(!open, e.detail === 0); });   // detail 0: 키보드로 누름
    btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true, true); } });
    prevB.addEventListener('click', () => nav(-1));
    nextB.addEventListener('click', () => nav(1));
    chips.forEach((c, i) => c.addEventListener('click', () => usePreset(i)));
    view.addEventListener('click', (e) => {
      const b = e.target.closest('.vzb-dp-day');
      if (!b || b.disabled) return;
      fday = +b.dataset.n;
      pick(+b.dataset.n);
    });
    view.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.vzb-dp-day');
      if (!b || b.disabled || pend == null || hov === +b.dataset.n) return;
      hov = +b.dataset.n;
      paint();
    });
    view.addEventListener('focusin', (e) => {
      const b = e.target.closest('.vzb-dp-day');
      if (!b || pend == null || hov === +b.dataset.n) return;
      hov = +b.dataset.n;
      paint();
    });
    view.addEventListener('keydown', (e) => {
      const b = e.target.closest('.vzb-dp-day');
      if (!b) return;
      const n = +b.dataset.n, p = parts(n);
      let to = null;
      if (e.key === 'ArrowLeft') to = n - 1;
      else if (e.key === 'ArrowRight') to = n + 1;
      else if (e.key === 'ArrowUp') to = n - 7;
      else if (e.key === 'ArrowDown') to = n + 7;
      else if (e.key === 'Home') to = n - p.w;
      else if (e.key === 'End') to = n + 6 - p.w;
      else if (e.key === 'PageUp' || e.key === 'PageDown') {
        const k = (e.key === 'PageUp' ? -1 : 1) * (e.shiftKey ? 12 : 1);
        to = Math.min(at(p.y, p.m + k, 1) + p.d - 1, at(p.y, p.m + k + 1, 0));
      } else return;
      e.preventDefault();
      focusOn(to);
    });
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

    goMonth(hi);
    label(false);
    emit(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (card.isConnected) label(false); });
    onSize(val, () => fitText());   // 놓인 자리가 좁아지거나 일수의 자릿수가 바뀌어 글자 자리가 줄면 표기를 다시 고릅니다

    // 갤러리(data-vzb-loop): 화면에 보이는 동안 달력을 연 채로 두고, 손을 대기 전과 손을 뗀 지 6초 뒤부터 고르기를 차례로 보여 줍니다.
    // 닫힌 단추에서 시작해 달력을 열고 → (연 달이 시작일의 달과 다르면) 다음 달 → 시작일을 누르고 → 끝일까지 띠가 따라오다 누르고 →
    // 빠른 선택 → 이전 달 → 마지막 빠른 선택 → 닫기. 갤러리는 닫힌 단추를 타일 가운데에 두고, 열면 달력과 함께 위로 올라가게 그립니다(사이트 CSS).
    if (loop) {
      let seen = true, k = 0, walkT = 0;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const press = (node) => { if (!node) return; node.classList.add('is-press'); setTimeout(() => node.classList.remove('is-press'), 140); };
      const dayB = (n) => (cur && (cur.list.find((x) => x.n === n) || {}).b) || null;
      const s0 = clamp(anchor - 13), s1 = clamp(anchor - 2);
      const steps = [];
      // 달력은 끝일이 든 달로 열리므로, 시작일이 다른 달에 있으면 그 달로 넘기는 것부터 보여 줍니다(같은 달이면 한 박자 쉽니다).
      steps.push(() => { const to = monthOf(s0); if (cur && cur.month !== to) { const dir = Math.sign(to - cur.month); press(dir > 0 ? nextB : prevB); nav(dir); } });
      if (!one && s1 > s0) {
        steps.push(() => { goMonth(s0); press(dayB(s0)); fday = s0; pick(s0); });
        steps.push(() => {
          let n = s0;
          clearInterval(walkT);
          walkT = setInterval(() => {
            if (!card.isConnected || performance.now() < idle || pend == null) { clearInterval(walkT); return; }
            if (n >= s1) { clearInterval(walkT); press(dayB(s1)); pick(s1); return; }
            n += 1;
            hov = n;
            paint();
          }, 60);
        });
      } else steps.push(() => { const n = clamp(anchor - 3); goMonth(n); press(dayB(n)); pick(n); });
      if (pre.length > 1) steps.push(() => { press(chips[1]); usePreset(1); });
      steps.push(() => { press(prevB); nav(-1); });
      if (pre.length) steps.push(() => { const i = pre.length - 1; press(chips[i]); usePreset(i); });
      steps.push(() => setOpen(false));   // 닫았다가 다음 박자에 다시 엽니다
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); clearInterval(walkT); return; }
        if (!seen || performance.now() < idle) return;
        if (!open) { setOpen(true); return; }
        steps[k++ % steps.length]();
      }, 1500);
    }
  });
