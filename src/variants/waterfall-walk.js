  // Waterfall Walk: 시작 값(start)에서 출발해 요인(labels)마다의 증감(values)을 앞 알약이 끝난 높이에 이어 붙이고, 끝 값은 카드가 계산해 끝 알약으로 세웁니다.
  // 막대는 양 끝이 둥근 알약입니다. 시작과 끝은 바닥(0)에서 서는 글자색(--vzb-ink), 요인은 결과를 좋게 만든 쪽이 초록(--vzb-good), 나쁘게 만든 쪽이
  // 빨강(--vzb-bad)이고(better: up · down), neutral이면 모두 첫째 데이터 색입니다. 알약마다 도착한 쪽 끝(머리)에 카드 바탕색 점을 뚫어,
  // 점이 위면 늘었고 아래면 줄었음을 색 없이도 알립니다. 알약 사이를 잇는 선은 없고, 이웃한 알약의 끝 높이가 맞닿아 이어집니다.
  // 요인 값은 늘린 알약 위 · 줄인 알약 아래에 부호와 함께 적고, 이웃 값과 겹치면 작은 값부터 생략합니다(툴팁과 표에는 남습니다).
  // 값이 알약 굵기보다 작으면 길이를 부풀리지 않고 그 값만큼 납작하게 그립니다. 이름이 칸보다 길면 두 줄로 엇갈려 적고, 그래도 길면 줄여 적습니다.
  // 큰 숫자는 끝 값, 증감 배지는 시작 값 대비입니다.
  // 움직임: 시작 알약과 큰 숫자가 놓여 있다가, 앞 알약 머리의 점만 한 공이 다음 칸으로 건너가 그 높이에서 알약으로 늘어납니다(요인마다 왼쪽부터 하나씩).
  // 큰 숫자는 보이는 길이를 그대로 셉니다. 마지막 요인 뒤에는 공이 끝 칸으로 건너가 바닥까지 쏟아지고, 증감 배지가 붙은 뒤 멈춥니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('waterfall-walk', (card, d, f) => {
    // 걸러서 남은 요인이 없을 때(labels가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.labels) && !d.labels.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-ww-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], raw = Array.isArray(d.values) ? d.values : [];
    if (!labels.length || raw.length !== labels.length) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    if (!fin(d.start)) throw new Error(tx(d, 'start에 시작 값을 숫자로 적으세요.'));
    const v0 = +d.start, want = d.better === 'down' ? -1 : d.better === 'neutral' ? 0 : 1;
    const given = (s) => s != null && s !== '';
    const startName = given(d.startLabel) ? String(d.startLabel) : tx(d, '시작'), endName = given(d.endLabel) ? String(d.endLabel) : tx(d, '끝');
    // 칸: 시작 · 요인들 · 끝. 요인은 앞 알약이 끝난 높이(from)에서 출발해 증감만큼 오르내립니다(to). 값이 null인 요인은 높이를 그대로 넘깁니다.
    let level = v0;
    const steps = labels.map((name, i) => {
      const v = fin(raw[i]) ? +raw[i] : null, from = level;
      if (v != null) level += v;
      return { kind: 'step', name, v, from, to: level };
    });
    const v1 = level;
    const cols = [{ kind: 'start', name: startName, v: v0, from: 0, to: v0 }, ...steps, { kind: 'end', name: endName, v: v1, from: 0, to: v1 }];
    const N = cols.length, S = steps.length;
    cols.forEach((c, k) => {
      c.k = k;
      c.bar = c.v != null && c.v !== 0;
      c.tone = c.kind !== 'step' ? 'total' : !c.bar ? 'none' : want === 0 ? 'plain' : Math.sign(c.v) === want ? 'good' : 'bad';
    });

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 큰 숫자: 끝 값. 움직이는 동안은 지금 보이는 높이를 그대로 세고, 끝 알약이 다 차면 증감 배지와 '시작 대비'가 붙습니다.
    // 시작 값이 0 이하이면 비율이 뜻을 잃으므로 배지에 차이를 적습니다.
    const fig = el('div', 'vzb-fig vzb-ww-fig'), numEl = figure(f, live ? v1 : v0), nowText = numEl.firstChild;
    let unitEl = numEl.querySelector('.vzb-unit');
    const bd = badge(f, v1, v0, d.better), vs = el('span', 'vzb-vs', tx(d, '%s 대비', startName));
    if (!(v0 > 0)) bd.lastChild.textContent = show(f, Math.abs(v1 - v0));
    bd.hidden = vs.hidden = !live;
    fig.append(numEl, bd, vs);
    card.append(fig);
    const btn = el('button', 'vzb-ww-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-ww-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    hd.append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    const foot = el('div', 'vzb-foot vzb-fill vzb-ww');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3 → %4 %5, %6. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', startName, show(f, v0), endName, show(f, v1), signed(f, v1 - v0)));
    const svg = svgEl('svg', { class: 'vzb-ww-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 표: 이름 · 값(요인은 증감) · 누계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), tx(d, '누계')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    const valText = (c) => (c.kind !== 'step' ? show(f, c.v) : c.v == null ? tx(d, '데이터 없음') : signed(f, c.v));
    cols.forEach((c) => { const tr = el('tr'); tr.append(el('th', null, c.name), el('td', null, valText(c)), el('td', null, show(f, c.to))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 그림: 바닥선(0) · 알약 · 머리의 점 · 값 · 이름. 알약은 출발한 높이(꼬리)에서 도착한 높이(머리)까지이고, 머리 쪽에 카드 바탕색 점을 뚫어
    // 어느 쪽으로 움직였는지를 색 없이도 알립니다(점이 위면 늘었고, 아래면 줄었습니다). 합계 알약은 바닥에서 서고 머리가 값입니다.
    const base = svgEl('line', { class: 'vzb-ww-base' }), barsG = svgEl('g', {});
    cols.forEach((c) => {
      c.g = svgEl('g', { class: `vzb-ww-col is-${c.tone}` });
      c.pill = svgEl('rect', { class: 'vzb-ww-bar' });
      c.dot = svgEl('circle', { class: 'vzb-ww-dot' });
      c.val = svgText(0, 0, valText(c), 'vzb-ww-val', 'middle');
      c.nm = svgText(0, 0, c.name, 'vzb-ww-name', 'middle');
      c.g.append(c.pill, c.dot, c.val, c.nm);
      barsG.append(c.g);
    });
    svg.append(base, barsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 이름을 maxW 안에 줄여 적습니다(끝에 …). 툴팁과 표에는 온전한 이름이 있습니다.
    const fit = (s, maxW) => {
      if (textW(s, 400, fam, 11) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, 400, fam, 11) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };
    // 시간표(밀리초): 시작 알약을 읽는 시간 · 요인 하나에 쓰는 시간(다음 칸으로 건너가기 HOP + 그 자리에서 늘어나기 GROW) · 끝 알약이 바닥까지 쏟아지는 시간 · 배지가 붙는 시간
    const T0 = 520, STEP = Math.max(340, Math.min(560, 3000 / Math.max(1, S))), HOP = Math.round(STEP * 0.42), GROW = STEP - HOP - 20, POUR = 480, BADGE = 240, ARC = 6;
    const easeOut = (k) => 1 - (1 - k) ** 3, easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    cols.forEach((c) => {
      c.at = c.kind === 'start' ? -1e9 : T0 + (c.k - 1) * STEP;   // 앞 칸의 머리에서 이 칸으로 건너오기 시작하는 때
      c.dur = c.kind === 'end' ? POUR : GROW;
      c.done = c.at + HOP + c.dur;
    });
    const DONE = cols[N - 1].done, TOTAL = DONE + 60 + BADGE;
    let W = 0, H = 0, y = (v) => v, slot = 1, bw = 0, dotR = 0, t = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      slot = w / N;
      // 이름: 한 줄에 다 들어가면 한 줄, 아니면 두 줄로 엇갈려(이웃 칸까지 써서) 적고, 그래도 넘치면 줄여 적습니다.
      const nameW = Math.max(...cols.map((c) => textW(c.name, c.kind === 'step' ? 400 : 500, fam, 11))) + 6;
      const two = nameW > slot, NAMEH = two ? 36 : 22, room = (two ? 2 * slot : slot) - 6;
      // 높이: 0과 모든 알약의 양 끝이 들어가게 하고, 위아래에 값을 적을 자리를 남깁니다.
      const lvls = [0, ...cols.flatMap((c) => [c.from, c.to])], lo = Math.min(...lvls), hi = Math.max(...lvls), span = hi - lo || 1;
      // 아래쪽 자리는 내려간 알약의 값이나 0 아래의 합계가 이름 줄에 닿을 때만 남깁니다.
      const PADT = 16, yb = h - NAMEH, scale = (padb) => Math.max(1, yb - PADT - padb) / span;
      const s0 = scale(0), low = cols.some((c) => c.bar && c.to < c.from && PADT + (hi - c.to) * s0 + 17 > yb);
      const s = scale(low || lo < 0 ? 16 : 0);
      y = (v) => PADT + (hi - v) * s;
      // 알약 굵기: 칸의 60%, 30px까지. 증감이 합계에 비해 작아 알약이 짧으면(요인 길이의 가운데 값 기준) 굵기도 줄여, 절반 넘는 알약이 굵기보다 길게 합니다.
      const lens = steps.filter((c) => c.bar).map((c) => Math.abs(c.v) * s).sort((a, b) => a - b);
      const mid = lens.length ? (lens[(lens.length - 1) >> 1] + lens[lens.length >> 1]) / 2 : 1e9;
      bw = Math.max(Math.min(12, slot * 0.6), Math.min(30, slot * 0.6, mid / 1.3));
      dotR = Math.max(2, bw * 0.22);
      const y0 = y(0);
      base.setAttribute('x1', 0);
      base.setAttribute('x2', w);
      base.setAttribute('y1', fx(Math.round(y0) + 0.5));
      base.setAttribute('y2', fx(Math.round(y0) + 0.5));
      cols.forEach((c) => {
        c.cx = slot * (c.k + 0.5);
        c.yT = y(c.from);                      // 꼬리 끝(출발한 높이)
        c.yH = y(c.to);                        // 머리 끝(도착한 높이)
        c.len = Math.abs(c.yH - c.yT);
        c.dir = c.yH < c.yT ? -1 : 1;          // 머리가 위(-1)인지 아래(1)인지
        c.h0 = Math.min(bw, c.len);            // 건너올 때의 크기: 알약 굵기만 한 공. 값이 그보다 작으면 값만큼만
        c.hy = c.bar ? c.yH - c.dir * c.h0 / 2 : c.yH;   // 머리의 가운데(점이 놓이는 자리)
        c.nm.textContent = fit(c.name, room);
        c.nm.setAttribute('x', fx(c.cx));
        c.nm.setAttribute('y', fx(yb + 15 + (two && c.k % 2 ? 14 : 0)));
        // 값: 올라간 알약(과 바닥 위의 합계)은 머리 위에, 내려간 알약은 머리 아래에 적습니다.
        const down = c.to < c.from, tw = textW(c.val.textContent, c.kind === 'step' ? 500 : 700, fam, 11) + 4;
        c.vy = down ? c.yH + 14 : c.yH - 6;
        c.vx = Math.max(tw / 2, Math.min(w - tw / 2, c.cx));
        c.box = [c.vx - tw / 2, c.vx + tw / 2, down ? c.yH + 3 : c.yH - 16, down ? c.yH + 16 : c.yH - 3];
        c.val.setAttribute('x', fx(c.vx));
        c.val.setAttribute('y', fx(c.vy));
      });
      // 건너오는 공이 떠나는 자리: 앞쪽에서 가장 가까운, 알약이 있는 칸의 머리입니다.
      cols.forEach((c) => { let p = cols[c.k - 1]; while (p && !p.bar && p.k > 0) p = cols[p.k - 1]; c.src = p || c; });
      // 겹치는 값은 합계부터, 그다음 큰 증감부터 자리를 차지하고 나머지는 생략합니다.
      const placed = [];
      [...cols].sort((a, b) => (a.kind === 'step') - (b.kind === 'step') || Math.abs(b.v || 0) - Math.abs(a.v || 0)).forEach((c) => {
        c.valOn = c.kind !== 'step' || c.v != null;
        if (!c.valOn) return;
        const [l, r, tp, bt] = c.box;
        if (placed.some(([l2, r2, t2, b2]) => l < r2 && r > l2 && tp < b2 && bt > t2)) { c.valOn = false; return; }
        placed.push(c.box);
      });
      render();
    }
    // 한 칸의 진행: hop은 앞 칸의 머리에서 이 칸으로 건너온 정도, grow는 그 자리에서 늘어난 정도입니다. 시작 알약은 처음부터 다 서 있습니다.
    const phase = (c) => (c.kind === 'start' ? [1, 1] : [easeInOut(clamp((t - c.at) / HOP)), (c.kind === 'end' ? easeInOut : easeOut)(clamp((t - c.at - HOP) / c.dur))]);
    // 지금 보이는 높이(큰 숫자): 출발한 요인 가운데 마지막 요인의 알약이 지금 보이는 길이만큼입니다. 끝 알약이 쏟아지는 동안은 도착한 높이 그대로입니다.
    function shown() {
      let v = v0;
      steps.forEach((c) => {
        if (c.v == null || t < c.at) return;
        const [hop, grow] = phase(c);
        v = c.from + c.v * (c.len > 0 ? (hop * c.h0 + (c.len - c.h0) * grow) / c.len : grow);
      });
      return v;
    }
    const pillAt = (c, x, top, w, h, dx, dy, r) => {
      c.pill.setAttribute('x', fx(x));
      c.pill.setAttribute('y', fx(top));
      c.pill.setAttribute('width', fx(w));
      c.pill.setAttribute('height', fx(h));
      c.pill.setAttribute('rx', fx(Math.min(w, h) / 2));
      c.dot.setAttribute('cx', fx(dx));
      c.dot.setAttribute('cy', fx(dy));
      c.dot.setAttribute('r', fx(Math.max(0, r)));
    };
    let badgeOn = live;
    function render() {
      if (!W) return;
      cols.forEach((c) => {
        const [hop, grow] = phase(c), onAir = c.bar && t >= c.at;
        c.pill.setAttribute('opacity', onAir ? 1 : 0);
        c.dot.setAttribute('opacity', onAir ? 1 : 0);
        if (onAir && hop < 1) {
          // 건너오는 중: 앞 칸 머리의 점만 한 공이 이 칸의 색으로 떠나, 알약 굵기만큼 커지며 살짝 뛰어 건너옵니다.
          const land = c.kind === 'end' ? c.hy : c.yT + c.dir * c.h0 / 2;
          const sw = 2 * dotR + (bw - 2 * dotR) * hop, sh = Math.min(sw, c.h0);
          const sx = c.src.cx + (c.cx - c.src.cx) * hop, sy = c.src.hy + (land - c.src.hy) * hop - ARC * Math.sin(Math.PI * hop);
          pillAt(c, sx - sw / 2, sy - sh / 2, sw, sh, sx, sy, Math.min(dotR, sh / 2 - 2.5) * hop);
        } else if (onAir) {
          // 늘어나는 중: 요인은 꼬리를 출발한 높이에 둔 채 머리가 도착한 높이로 가고, 끝 알약은 머리를 도착한 높이에 둔 채 바닥까지 쏟아집니다.
          const hh = c.h0 + (c.len - c.h0) * grow, rr = Math.min(bw, hh) / 2;
          const top = c.kind === 'end' ? (c.dir < 0 ? c.yH : c.yH - hh) : (c.dir < 0 ? c.yT - hh : c.yT);
          const headY = c.kind === 'end' ? c.hy : c.yT + c.dir * (hh - rr);
          pillAt(c, c.cx - bw / 2, top, bw, hh, c.cx, headY, Math.min(dotR, rr - 2.5));
        }
        c.val.setAttribute('opacity', c.valOn ? fx(c.kind === 'start' ? 1 : clamp((t - c.done + 120) / 200)) : 0);
      });
      const [txt, unit] = f.parts(t >= DONE ? v1 : shown());
      nowText.data = txt;
      if (unit && !unitEl) { unitEl = el('span', 'vzb-unit'); numEl.append(unitEl); }
      if (unitEl) unitEl.textContent = unit || '';
      const ready = t >= DONE + 60;
      if (ready !== badgeOn) {
        badgeOn = ready;
        bd.hidden = vs.hidden = !ready;
        bd.classList.toggle('vzb-ww-in', ready);
        vs.classList.toggle('vzb-ww-in', ready);
      }
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    const on = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!on()) { last = 0; return; }
      const dt = last ? Math.min(100, stamp - last) : 16;
      last = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = 2600; else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; last = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 알약을 짚으면 값을, 요인은 증감과 누계(앞 → 뒤)를, 끝 알약은 시작 대비 증감을 보여 주고 그 알약만 진하게 남깁니다.
    interact(plot, N,
      (cx) => Math.max(0, Math.min(N - 1, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (k) => {
        const c = cols[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        cols.forEach((x) => x.g.classList.toggle('is-on', x === c));
        const note = c.kind === 'step' ? (c.v == null ? null : tx(d, '누계 %1 → %2', show(f, c.from), show(f, c.to)))
          : c.kind === 'end' ? `${signed(f, v1 - v0)} · ${tx(d, '%s 대비', startName)}` : null;
        const tb = tipBody({ value: valText(c), note }, c.name);
        return { x: r.left + c.cx, y: r.top + Math.min(c.yT, c.yH) - 6, label: c.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); cols.forEach((x) => x.g.classList.remove('is-on')); },
      false, true);

    if (live) t = 1e9;   // 마지막 장면에서 시작합니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
