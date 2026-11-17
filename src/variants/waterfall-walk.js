  // Waterfall Walk: 첫 항목의 값에서 출발해 항목(items)마다의 증감(value)을 앞 막대가 끝난 높이에 이어 붙이고, total로 표시한 항목에는 그때까지의 누계를
  // 카드가 계산해 합계 막대로 세웁니다(예: 연초 회원 수 → 신규 가입 · 지인 추천 · 재가입 → 해지 · 만료 → 연말 회원 수).
  // 합계 막대(첫 항목과 total 항목)는 바닥(0)에서 서는 회색(--vzb-base)입니다. 증감 막대는 앞 막대가 끝난 높이에서 떠서, 결과를 좋게 만든 쪽이
  // 초록(--vzb-good), 나쁘게 만든 쪽이 빨강(--vzb-bad)이고(better: up · down), neutral이면 모두 첫째 데이터 색입니다.
  // 막대 사이는 앞 막대가 끝난 높이를 점선(점 하나하나)으로 잇습니다. 점은 막대와 막대 사이를 같은 간격으로 채웁니다.
  // 이름과 값은 막대의 도착한 끝 바로 밖에 함께 적습니다(늘린 항목과 합계는 위, 줄인 항목은 아래 · 증감에는 부호). 축 아래에 따로 이름을 두지 않아,
  // 막대를 보는 자리에서 무엇이 얼마나 늘고 줄었는지 읽힙니다. 이웃 글자나 막대와 겹치면 옆으로 조금 밀거나 막대에서 더 띄우고,
  // 그래도 자리가 없으면 이름을, 그다음 값을 생략합니다(툴팁과 표에는 남습니다).
  // 큰 숫자는 마지막 항목까지의 누계이고, 그 옆에 첫 항목 대비 증감 배지(compare: share면 첫 항목의 몇 %인지)를 적습니다.
  // 움직임: 첫 막대와 큰 숫자가 놓여 있다가 왼쪽부터 한 항목씩, ① 앞 막대가 끝난 높이에서 점이 하나씩 찍히며 다음 칸으로 걸어가고
  // ② 그 높이에서 막대가 오르내리며, 막대 끝에 붙은 이름과 값이 함께 따라가고 값과 큰 숫자가 보이는 만큼을 셉니다
  // ③ 합계 칸에서는 도착한 높이가 막대로 쏟아져 바닥까지 찹니다. 마지막 칸 뒤에 증감 배지가 붙고 멈춥니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('waterfall-walk', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-ww-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const src = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (!src.length) throw new Error(tx(d, 'items에 항목을 적으세요.'));
    if (src[0].total === true || !fin(src[0].value)) throw new Error(tx(d, '첫 항목에 시작 값을 숫자로 적으세요.'));
    const want = d.better === 'down' ? -1 : d.better === 'neutral' ? 0 : 1;
    // 칸: 첫 항목과 total 항목은 바닥에서 서는 합계(0 → 누계)이고, 나머지는 앞 막대가 끝난 높이(from)에서 증감만큼 움직입니다(to).
    // 값이 null인 항목은 자리만 두고 높이를 그대로 넘깁니다.
    let level = 0;
    const cols = src.map((it, k) => {
      const total = k > 0 && it.total === true, v = total ? null : fin(it.value) ? +it.value : null, from = level;
      if (v != null) level += v;
      const kind = k === 0 || total ? 'total' : 'step', c = { k, name: String(it.name), kind, v, from: kind === 'total' ? 0 : from, to: level };
      c.bar = kind === 'total' ? c.to !== 0 : v != null && v !== 0;   // 그릴 막대가 있는지
      c.below = kind === 'total' ? c.to < 0 : v < 0;                   // 글자를 막대 아래에 적는지(줄인 항목과 0 아래의 합계)
      c.tone = kind === 'total' ? 'total' : !c.bar ? 'none' : want === 0 ? 'plain' : Math.sign(v) === want ? 'good' : 'bad';
      return c;
    });
    const N = cols.length, first = cols[0], last = cols[N - 1], v0 = first.to, v1 = last.to;
    // 움직이는 동안의 숫자: 값이 모두 정수면 정수로 셉니다(소수 자리가 깜빡이지 않게).
    const whole = cols.every((c) => c.v == null || Number.isInteger(c.v));
    const part = (v, e) => (e >= 1 ? v : whole ? Math.round(v * e) : v * e);
    const pct = (v) => `${v < 0 ? '−' : ''}${num(Math.abs(v / v0) * 100, 1)}%`;   // 첫 항목의 몇 %인지

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 큰 숫자: 마지막 항목까지의 누계. 움직이는 동안은 지금 보이는 높이를 그대로 세고, 마지막 칸이 끝나면 옆에 증감 배지가 붙습니다.
    // 배지는 첫 항목 대비 증감입니다(시작 값이 0 이하이면 비율 대신 차이). compare가 share면 배지 대신 첫 항목의 몇 %인지 적습니다(손익의 이익률처럼).
    const fig = el('div', 'vzb-fig vzb-ww-fig'), numEl = figure(f, live ? v1 : v0), nowText = numEl.firstChild, after = [];
    let unitEl = numEl.querySelector('.vzb-unit');
    if (N > 1 && d.compare === 'share') {
      if (v0 > 0) {
        const share = el('span', 'vzb-vs'), [a, b] = tx(d, '%1의 %2', first.name, '\u0001').split('\u0001');
        share.append(a, el('b', null, pct(v1)), b);
        after.push(share);
      }
    } else if (N > 1) {
      const bd = badge(f, v1, v0, d.better);
      if (!(v0 > 0)) bd.lastChild.textContent = show(f, Math.abs(v1 - v0));
      after.push(bd, el('span', 'vzb-vs', tx(d, '%s 대비', first.name)));
    }
    after.forEach((n) => { n.hidden = !live; });
    fig.append(numEl, ...after);
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
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3 → %4 %5. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', first.name, show(f, v0), last.name, show(f, v1)));
    const svg = svgEl('svg', { class: 'vzb-ww-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 표: 이름 · 값(증감은 부호와 함께, 합계는 누계) · 누계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), tx(d, '누계')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    const valText = (c) => (c.kind === 'total' ? show(f, c.to) : c.v == null ? tx(d, '데이터 없음') : signed(f, c.v));
    cols.forEach((c) => { const tr = el('tr'); tr.append(el('th', null, c.name), el('td', null, valText(c)), el('td', null, show(f, c.to))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 그림: 바닥선(0) · 잇는 점 · 막대 · 막대 끝의 글자(이름과 값). 잇는 점은 막대 아래에 둡니다.
    const base = svgEl('line', { class: 'vzb-ww-base' }), dotsG = svgEl('g', { class: 'vzb-ww-conns' }), colsG = svgEl('g', {});
    cols.forEach((c) => {
      c.g = svgEl('g', { class: `vzb-ww-col is-${c.tone}` });
      c.path = svgEl('path', { class: 'vzb-ww-bar' });
      c.lab = svgEl('g', { class: 'vzb-ww-lab' });
      c.nm = svgText(0, 0, c.name, 'vzb-ww-name', 'middle');
      c.val = svgText(0, 0, valText(c), 'vzb-ww-val', 'middle');
      c.said = c.val.textContent;
      c.lab.append(c.nm, c.val);
      c.g.append(c.path, c.lab);
      colsG.append(c.g);
      if (c.k < N - 1) { c.dots = svgEl('g', { class: 'vzb-ww-dots' }); dotsG.append(c.dots); }
    });
    svg.append(base, dotsG, colsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 세로 막대: yA는 출발하는 끝(바닥이나 앞 막대의 높이, 각지게), yB는 도착하는 끝(4px 둥글게)입니다. 올라가면 위가, 내려가면 아래가 둥급니다.
    const barPath = (x, yA, yB, w) => {
      const h = Math.abs(yB - yA);
      if (h < 0.5) return '';
      const r = Math.min(4, w / 2, h), up = yB < yA;
      return up
        ? `M${fx(x)},${fx(yA)}V${fx(yB + r)}A${r},${r} 0 0 1 ${fx(x + r)},${fx(yB)}H${fx(x + w - r)}A${r},${r} 0 0 1 ${fx(x + w)},${fx(yB + r)}V${fx(yA)}Z`
        : `M${fx(x)},${fx(yA)}V${fx(yB - r)}A${r},${r} 0 0 0 ${fx(x + r)},${fx(yB)}H${fx(x + w - r)}A${r},${r} 0 0 0 ${fx(x + w)},${fx(yB - r)}V${fx(yA)}Z`;
    };
    // 이름을 maxW 안에 줄여 적습니다(끝에 …). 툴팁과 표에는 온전한 이름이 있습니다.
    const fit = (s, size, maxW) => {
      if (textW(s, 400, fam, size) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, 400, fam, size) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };
    // 시간표(밀리초): 첫 막대를 읽는 시간 T0, 한 항목의 간격 STEP, 점이 다음 칸으로 걸어가는 시간 WALK, 막대가 움직이기 시작할 때까지 LAG,
    // 막대가 오르내리는 시간 GROW, 합계 막대가 바닥까지 차는 시간 POUR, 배지가 붙는 시간 BADGE
    const T0 = 500, STEP = N > 1 ? Math.max(380, Math.min(540, 2900 / (N - 1))) : 0, WALK = Math.round(STEP * 0.5), LAG = Math.round(WALK * 0.85), GROW = Math.round(STEP * 0.68), POUR = 520, BADGE = 240;
    const easeOut = (k) => 1 - (1 - k) ** 3, easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    cols.forEach((c) => {
      c.at = c.k ? T0 + (c.k - 1) * STEP : -1e9;   // 앞 막대에서 이 칸으로 점이 걸어오기 시작하는 때
      c.dur = c.kind === 'total' ? POUR : GROW;
      c.done = c.k ? c.at + LAG + c.dur : 0;
    });
    const DONE = last.done, TOTAL = DONE + 60 + BADGE;
    let W = 0, H = 0, y = (v) => v, slot = 1, bw = 0, DOT = 1.5, t = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      slot = w / N;
      bw = Math.min(32, slot * 0.62);
      // 글자 크기: 이름 11px · 값 12px, 칸이 좁으면 10px · 11px. LBL은 막대 끝에서 이름 줄 바깥까지, VAL은 값 줄 바깥까지의 길이입니다.
      const tight = slot < 56, nsz = tight ? 10 : 11, vsz = tight ? 11 : 12, LBL = nsz + vsz + 8, VAL = vsz + 6;
      svg.classList.toggle('is-tight', tight);
      DOT = tight ? 1.25 : 1.5;
      // 높이: 0과 모든 막대의 양 끝이 들어가게 하고, 위에는 글자 두 줄의 자리를 남깁니다. 아래에는 줄인 항목의 글자가 그림 밖으로 나갈 때만 남깁니다.
      const lvls = [0, ...cols.flatMap((c) => [c.from, c.to])], lo = Math.min(...lvls), hi = Math.max(...lvls), span = hi - lo || 1;
      const PADT = LBL + 4, room = (pb) => Math.max(1, h - 1 - PADT - pb) / span;
      const fits = (pb) => cols.every((c) => !c.below || PADT + (hi - c.to) * room(pb) + LBL + 2 <= h);
      let PADB = 0;
      if (lo < 0) PADB = LBL + 4;
      else if (!fits(0)) { let a = 0, b = LBL + 4; for (let i = 0; i < 8; i++) { const m = (a + b) / 2; if (fits(m)) b = m; else a = m; } PADB = b; }
      const s = room(PADB);
      y = (v) => PADT + (hi - v) * s;
      const y0 = y(0);
      base.setAttribute('x1', 0);
      base.setAttribute('x2', w);
      base.setAttribute('y1', fx(Math.round(y0) + 0.5));
      base.setAttribute('y2', fx(Math.round(y0) + 0.5));
      cols.forEach((c) => {
        c.cx = slot * (c.k + 0.5);
        c.x = c.cx - bw / 2;
        c.yA = y(c.from);
        c.yB = y(c.to);
        // 글자: 값은 막대 끝 바로 밖에, 이름은 그 바깥 줄에. 이름이 너무 길면 줄여 적습니다.
        c.nm.textContent = fit(c.name, nsz, Math.max(44, slot * 1.6));
        c.vw = textW(valText(c), c.kind === 'step' ? 600 : 700, fam, vsz) + 4;
        c.lw = Math.max(c.vw, textW(c.nm.textContent, c.kind === 'step' ? 400 : 500, fam, nsz) + 4);
        c.val.setAttribute('y', c.below ? vsz + 2 : -6);
        c.nm.setAttribute('y', c.below ? vsz + nsz + 4 : -(vsz + 8));
      });
      // 잇는 점: 이 막대가 끝난 높이에서 다음 막대까지, 두 막대 사이를 같은 간격으로 채웁니다.
      const conns = [], pitch = tight ? 5 : 7;
      cols.forEach((c) => {
        if (!c.dots) return;
        const x1 = c.x + bw + 3, x2 = cols[c.k + 1].x - 3, len = x2 - x1, n = len > 2 ? Math.max(1, Math.round(len / pitch)) : 0;
        c.dots.textContent = '';
        c.dotEls = [];
        for (let i = 0; i < n; i++) {
          const dot = svgEl('circle', { cx: fx(x1 + ((i + 0.5) * len) / n), cy: fx(c.yB), r: 0 });
          c.dots.append(dot);
          c.dotEls.push(dot);
        }
        if (n) conns.push([x1, x2, c.yB - 3, c.yB + 3, null]);
      });
      // 글자 자리 잡기: 이웃 글자 · 이웃 막대 · 잇는 점과 겹치면 옆으로 조금 밀거나 막대에서 더 띄웁니다. 합계부터, 그다음 큰 증감부터 자리를 잡고,
      // 끝내 자리가 없으면 이름을, 그다음 값을 생략합니다.
      const hits = (a, b) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
      const walls = [...conns];
      cols.forEach((c) => { if (c.bar) walls.push([c.x - 1, c.x + bw + 1, Math.min(c.yA, c.yB), Math.max(c.yA, c.yB), c]); });
      const taken = [];
      const free = (c, b) => b[0] >= -14 && b[1] <= w + 14 && b[2] >= -12 && b[3] <= h + 12 && !taken.some((o) => hits(o, b)) && !walls.some((o) => o[4] !== c && hits(o, b));
      const moves = [];
      [0, 4, 8, 12, 16, 22, 28].forEach((dy) => [0, 4, -4, 8, -8, 12, -12].forEach((dx) => moves.push([dx, dy])));
      moves.sort((a, b) => Math.abs(a[0]) + a[1] * 1.2 - (Math.abs(b[0]) + b[1] * 1.2));
      [...cols].sort((a, b) => (a.kind === 'step') - (b.kind === 'step') || Math.abs(b.v || 0) - Math.abs(a.v || 0)).forEach((c) => {
        const dir = c.below ? 1 : -1;
        const boxOf = (lw, ext, [dx, dy]) => { const x0 = c.cx + dx - lw / 2, ye = c.yB + dir * dy; return c.below ? [x0, x0 + lw, ye + 3, ye + ext] : [x0, x0 + lw, ye - ext, ye - 3]; };
        let pick = moves.find((m) => free(c, boxOf(c.lw, LBL, m)));
        c.nameOn = !!pick;
        if (!pick) pick = moves.find((m) => free(c, boxOf(c.vw, VAL, m)));   // 이름 없이 값만
        c.labOn = !!pick;
        c.dx = pick ? pick[0] : 0;
        c.dy = pick ? dir * pick[1] : 0;
        if (pick) taken.push(boxOf(c.nameOn ? c.lw : c.vw, c.nameOn ? LBL : VAL, pick));
        c.nm.setAttribute('opacity', c.nameOn ? 1 : 0);
      });
      render();
    }
    // 한 칸의 진행(0~1): 합계 칸은 도착한 높이에서 바닥까지 찬 정도, 증감 칸은 막대가 오르내린 정도입니다. 첫 막대는 처음부터 다 서 있습니다.
    const grown = (c) => (c.k ? (c.kind === 'total' ? easeInOut : easeOut)(clamp((t - c.at - LAG) / c.dur)) : 1);
    // 지금 보이는 높이(큰 숫자): 움직이기 시작한 증감 칸 가운데 마지막 칸이 지금 닿은 높이입니다. 합계 막대가 차는 동안은 그 높이 그대로입니다.
    function shown() {
      let v = v0;
      cols.forEach((c) => { if (c.kind === 'step' && c.v != null && t >= c.at + LAG) v = c.from + part(c.v, grown(c)); });
      return v;
    }
    let afterOn = live;
    function render() {
      if (!W) return;
      cols.forEach((c) => {
        const e = grown(c);
        // 합계 막대는 도착한 높이(위 끝)에 붙은 채 바닥 쪽으로 찹니다. 증감 막대는 출발한 높이에서 도착하는 쪽으로 자랍니다.
        const tip = c.kind === 'total' ? c.yB : c.yA + (c.yB - c.yA) * e;
        c.path.setAttribute('d', !c.bar ? '' : c.kind === 'total' ? barPath(c.x, c.yB + (c.yA - c.yB) * e, c.yB, bw) : barPath(c.x, c.yA, tip, bw));
        // 글자는 막대 끝에 붙어 함께 움직이고, 증감 값은 지금 보이는 만큼을 셉니다. 점이 다 걸어올 즈음 나타납니다.
        c.lab.setAttribute('transform', `translate(${fx(c.cx + c.dx)},${fx(tip + c.dy)})`);
        c.lab.setAttribute('opacity', c.labOn ? fx(c.k ? clamp((t - c.at - LAG + 80) / 160) : 1) : 0);
        const now = c.kind === 'step' && c.v ? part(c.v, e) : 0;   // 0에서 시작할 때도 부호를 붙여, 늘 항목인지 줄 항목인지 먼저 알립니다
        const say = c.kind === 'step' && c.v ? (now ? signed(f, now) : `${c.v > 0 ? '+' : '−'}${show(f, 0)}`) : c.said;
        if (say !== c.said) { c.said = say; c.val.textContent = say; }
        // 잇는 점: 다음 칸의 차례가 오면 앞에서부터 하나씩 찍힙니다.
        if (c.dotEls) {
          const nx = cols[c.k + 1], n = c.dotEls.length;
          c.dotEls.forEach((dot, i) => dot.setAttribute('r', fx(DOT * easeOut(clamp((t - nx.at - (i / n) * WALK) / 110)))));
        }
      });
      const [txt, unit] = f.parts(t >= DONE ? v1 : shown());
      nowText.data = txt;
      if (unit && !unitEl) { unitEl = el('span', 'vzb-unit'); numEl.append(unitEl); }
      if (unitEl) unitEl.textContent = unit || '';
      const ready = t >= DONE + 60;
      if (ready !== afterOn) {
        afterOn = ready;
        after.forEach((n) => { n.hidden = !ready; n.classList.toggle('vzb-ww-in', ready); });
      }
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, lastStamp = 0, raf = 0;
    const on = () => playing && inView && !holds.size && card.isConnected;
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(100, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = 2600; else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; lastStamp = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 막대를 짚으면 값을, 증감 막대는 누계(앞 → 뒤)를, 합계 막대는 첫 항목 대비 증감(compare: share면 첫 항목의 몇 %인지)을 보여 주고
    // 그 막대만 진하게 남깁니다.
    interact(plot, N,
      (cx) => Math.max(0, Math.min(N - 1, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (k) => {
        const c = cols[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        cols.forEach((x) => x.g.classList.toggle('is-on', x === c));
        const note = c.kind === 'step' ? (c.v == null ? null : tx(d, '누계 %1 → %2', show(f, c.from), show(f, c.to)))
          : !c.k ? null : d.compare === 'share' ? (v0 > 0 ? tx(d, '%1의 %2', first.name, pct(c.to)) : null) : `${signed(f, c.to - v0)} · ${tx(d, '%s 대비', first.name)}`;
        const tb = tipBody({ value: valText(c), note }, c.name);
        return { x: r.left + c.cx, y: r.top + Math.min(c.yA, c.yB) - 6, label: c.name, value: tb.node, text: tb.text };
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
