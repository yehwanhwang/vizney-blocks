  // Heatmap Sweep: 두 갈래(요일 × 시간대 같은 rows × cols)로 나눈 값을 칸의 진하기로 그리고, 가장 높은 칸을 첫째 데이터 색으로 짚는 히트맵입니다.
  // 칸은 글자색을 값만큼 진하게 깐 회색 단계입니다(0에서 가장 큰 값까지를 7~78%로). 색은 가장 높은 칸 하나에만 씁니다. 강조는 색 하나로 하기 때문입니다.
  // 머리의 큰 숫자는 가장 높은 칸의 값이고, 뒤에 그 칸이 전체 평균의 몇 배인지와 어느 칸인지(행 · 열 이름)를 적습니다(카드가 계산합니다).
  // 움직임: 화면에 보이면 왼쪽 열부터 오른쪽으로 쓸고 지나가며 칸이 칠해집니다. 그때까지의 가장 높은 칸이 첫째 색으로 짚이고,
  // 더 높은 칸이 나오면 색이 그 칸으로 건너가며 튀고(Pop) 머리의 숫자가 굴러 올라갑니다. 끝까지 쓸고 나면 전체에서 가장 높은 칸에 서 있습니다.
  // 칸에 마우스를 올리거나 포커스한 뒤 화살표를 누르면 그 칸의 값과 평균 대비를 보여 줍니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 쓸지 않고, 칸마다 화면에 있던 진하기에서 새 진하기로 옮겨 갑니다(Move: 넘치지 않음).
  // 가장 높은 칸이 달라지면 색은 바로 그 칸으로 건너가 한 번 튑니다. rows · cols나 카드 크기가 달라지면 옮겨 가지 않고 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('heatmap-sweep', (card, d, f) => {
    // 걸러서 남은 것이 없을 때(rows · cols · values가 빈 배열)는 오류가 아니라 빈 화면입니다.
    const empty = (a) => Array.isArray(a) && !a.length;
    if (empty(d.rows) || empty(d.cols) || empty(d.values)) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-hs-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const rows = Array.isArray(d.rows) ? d.rows.map(String) : [], cols = Array.isArray(d.cols) ? d.cols.map(String) : [], R = rows.length, C = cols.length, N = R * C;
    if (!N || !Array.isArray(d.values) || d.values.length !== R || d.values.some((r) => !Array.isArray(r) || r.length !== C || r.some((v) => v != null && (!fin(v) || v < 0)))) throw new Error(tx(d, 'rows · cols와 values를 확인하세요.'));
    const vals = d.values.flatMap((r) => r.map((v) => (v == null ? null : +v))), nums = vals.filter((v) => v != null);
    if (!nums.length) throw new Error(tx(d, 'rows · cols와 values를 확인하세요.'));
    const vmax = Math.max(...nums), avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const tone = (v) => (v == null ? 0 : vmax > 0 ? 0.07 + 0.71 * Math.pow(v / vmax, 0.9) : 0.07);   // 칸의 진하기(글자색의 불투명도)
    const toneTo = vals.map(tone);
    // 열을 왼쪽부터 쓸 때, 그 열까지에서 가장 높은 칸(run[c]). 값이 같으면 먼저 나온 칸입니다. 값이 모두 0이면 짚지 않습니다.
    const run = [];
    let best = -1;
    for (let c = 0; c < C; c++) {
      for (let r = 0; r < R; r++) { const i = r * C + c; if (vals[i] != null && vals[i] > 0 && (best < 0 || vals[i] > vals[best])) best = i; }
      run.push(best);
    }
    const peak = best, where = (i) => `${rows[Math.floor(i / C)]} · ${cols[i % C]}`;

    // 머리: 제목 · 부제와 다시 보기 단추, 그 아래 가장 높은 칸의 값(굴러가는 숫자) · 평균 대비 · 어느 칸인지
    head(card, d, f, null);
    const btn = el('button', 'vzb-hs-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-hs-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    card.querySelector('.vzb-hd').append(btn);
    const fig = el('div', 'vzb-fig'), numEl = el('div', 'vzb-num'), rl = el('span', 'vzb-rl'), unitEl = el('span', 'vzb-unit');
    const dl = el('span', 'vzb-delta'), bd = el('span', 'vzb-badge vzb-flat'), vs = el('span', 'vzb-vs');
    rl.setAttribute('aria-hidden', 'true');
    numEl.append(rl, unitEl);
    dl.append(bd, vs);
    fig.append(numEl, dl);
    card.append(fig);
    let figAt = -2, figText = '';
    // 다시 그린 카드는 앞 카드가 보이던 숫자에서 굴러가게, 그 숫자를 움직임 없이 먼저 세워 둡니다(0에서 다시 굴러 올라오지 않게).
    const seed = (text) => {
      roll(rl, text);
      const strips = [...rl.querySelectorAll('.vzb-rl-strip')];
      strips.forEach((x) => { x.style.transition = 'none'; });
      rl.getBoundingClientRect();
      strips.forEach((x) => { x.style.transition = ''; });
    };
    function setFig(i) {
      if (i === figAt) return;
      figAt = i;
      const [a, u] = f.parts(i < 0 ? 0 : vals[i]);
      figText = a;
      roll(rl, a);
      unitEl.textContent = u;
      unitEl.style.display = u ? '' : 'none';
      dl.style.display = i < 0 ? 'none' : '';
      if (i < 0) return;
      bd.textContent = tx(d, '평균의 %s배', num(avg > 0 ? vals[i] / avg : 0, 1));
      vs.textContent = where(i);
    }

    const foot = el('div', 'vzb-foot vzb-fill vzb-hs');
    const plot = el('div', 'vzb-plot vzb-hs-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', peak < 0
      ? tx(d, '%s. 화살표로 칸을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '')
      : tx(d, '%1. 가장 높은 칸은 %2의 %3입니다. 화살표로 칸을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', where(peak), show(f, vals[peak])));
    const svg = svgEl('svg', { class: 'vzb-hs-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 표
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, ''), ...cols.map((c) => el('th', null, c)));
    table.append(el('caption', null, d.title || ''), hr);
    rows.forEach((name, r) => {
      const tr = el('tr');
      tr.append(el('th', null, name), ...cols.map((_, c) => { const v = vals[r * C + c]; return el('td', null, v == null ? tx(d, '데이터 없음') : show(f, v)); }));
      table.append(tr);
    });
    sr.append(table);
    card.append(sr);

    // 그림: 쓸고 지나가는 띠 · 칸 · 짚은 칸의 테두리 · 가장 높은 칸이 바뀔 때 퍼지는 테두리 · 행 이름(왼쪽) · 열 이름(아래) · 범례(오른쪽 아래)
    const scan = svgEl('rect', { class: 'vzb-hs-scan', opacity: 0 }), cellsG = svgEl('g', {}), pulse = svgEl('rect', { class: 'vzb-hs-pulse', opacity: 0 }), ring = svgEl('rect', { class: 'vzb-hs-ring', opacity: 0 });
    const cells = vals.map((v) => { const c = svgEl('rect', { class: `vzb-hs-cell${v == null ? ' is-null' : ''}` }); cellsG.append(c); return c; });
    const rowT = rows.map((name) => svgText(0, 0, name, 'vzb-hs-name', 'end')), colT = cols.map((name) => svgText(0, 0, name, 'vzb-hs-name', 'middle'));
    const STEPS = [0.07, 0.25, 0.43, 0.6, 0.78], legG = svgEl('g', {}), legLo = svgText(0, 0, tx(d, '적음'), 'vzb-hs-name', 'end'), legHi = svgText(0, 0, tx(d, '많음'), 'vzb-hs-name', 'start');
    const legB = STEPS.map((a) => svgEl('rect', { class: 'vzb-hs-cell', width: 10, height: 10, 'fill-opacity': a }));
    legG.append(legLo, ...legB, legHi);
    svg.append(scan, cellsG, pulse, ring, ...rowT, ...colT, legG);

    foot.style.minHeight = `${R * 14 + 52}px`;   // 행 이름(12px)이 겹치지 않게 한 행은 14px 밑으로 내려가지 않습니다. 자리가 모자라면 카드가 그만큼 길어집니다
    const fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 시간표(밀리초): 처음의 뜸(Lead) 뒤에 한 열을 STEP마다 씁니다(전체는 Seq의 1.4배를 열 수로 나누고, 한 열은 30~120ms). 쓰는 빠르기는 이 카드의 이야기 속도입니다.
    // 칸의 진하기는 값이라 Move로만 옮기고, 가장 높은 칸이 바뀔 때의 튐과 퍼지는 테두리는 값이 아니라 Pop입니다.
    const M = motion(card), [MK, MC] = M.pair('move'), POP = M.curve('pop'), FADE = M.ms('fade') || 1;
    const T0 = M.ms('lead'), STEP = Math.max(30, Math.min(120, (M.ms('seq') * 1.4) / C)), FULL = T0 + C * STEP + FADE, TOTAL = FULL + 300, FLASH = 620, NAMEH = 20, LEGH = 20, GAP = 2;
    let W = 0, H = 0, GL = 0, cw = 1, ch = 1, RC = 2, every = 1, t = 0, shown = -2, popT = FLASH, hot = -1;
    const cx = (i) => GL + (i % C) * cw, cy = (i) => Math.floor(i / C) * ch;
    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 칸마다 화면의 진하기(sa)를 새 진하기로 보냅니다.
    let from = before(card), moving = false, sa = null, was = null;
    // 열 이름: 몇 칸마다 하나씩 적되, 짚은 열의 이름은 늘 굵게 적고 그와 겹칠 이웃 이름은 잠시 뺍니다.
    function nameCols(on) {
      colT.forEach((tn, c) => {
        tn.classList.toggle('is-on', c === on);
        tn.setAttribute('opacity', c === on || (c % every === 0 && (on < 0 || Math.abs(c - on) >= every)) ? 1 : 0);
      });
    }
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const fam = getComputedStyle(card).fontFamily;
      GL = Math.ceil(Math.max(...rows.map((x) => textW(x, 700, fam, 12)))) + 8;
      cw = Math.max(4, (w - GL) / C);
      ch = Math.max(6, (h - NAMEH - LEGH) / R);
      RC = Math.min(len(card, 'radius-mark', 3), Math.min(cw, ch) / 4);   // 칸의 모서리는 짧은 변의 1/4을 넘기지 않습니다(네모가 점으로 읽히지 않게)
      const g = Math.min(GAP, cw / 4, ch / 4);
      cells.forEach((c, i) => {
        c.setAttribute('x', fx(cx(i) + g / 2)); c.setAttribute('y', fx(cy(i) + g / 2));
        c.setAttribute('width', fx(cw - g)); c.setAttribute('height', fx(ch - g));
        c.setAttribute('rx', fx(RC));
      });
      [ring, pulse].forEach((o) => o.setAttribute('rx', fx(RC + 1)));
      scan.setAttribute('y', 0); scan.setAttribute('height', fx(R * ch)); scan.setAttribute('width', fx(cw)); scan.setAttribute('rx', fx(RC));
      rowT.forEach((tn, r) => { tn.setAttribute('x', GL - 8); tn.setAttribute('y', fx(r * ch + ch / 2 + 4)); });
      // 열 이름: 다 들어가면 모두, 모자라면 몇 칸마다 하나씩(첫 열부터)
      every = Math.max(1, Math.ceil((Math.max(...cols.map((x) => textW(x, 700, fam, 12))) + 10) / cw));
      colT.forEach((tn, c) => { tn.setAttribute('x', fx(GL + c * cw + cw / 2)); tn.setAttribute('y', fx(R * ch + 15)); });
      nameCols(hot < 0 ? -1 : hot % C);
      // 범례: 오른쪽 아래에 적음 ▢▢▢▢▢ 많음
      const hiW = Math.ceil(textW(legHi.textContent, 400, fam, 12)), y = h - 11;
      let x = w - hiW - 6 - STEPS.length * 12;
      legLo.setAttribute('x', x - 6); legLo.setAttribute('y', y + 9);
      legB.forEach((b) => { b.setAttribute('x', x); b.setAttribute('y', y); b.setAttribute('rx', fx(Math.min(RC, 2))); x += 12; });
      legHi.setAttribute('x', x + 4); legHi.setAttribute('y', y + 9);
      if (from) { begin(from); from = null; kick(); }
      render();
    }
    // 앞 장면에서 시작합니다. rows · cols나 카드 크기가 달라졌으면 옮겨 가지 않고, 앞 카드가 쓸던 중이었으면 그 자리에서 마저 씁니다.
    function begin(prev) {
      if (!prev || !prev.inView || prev.W !== W || prev.H !== H || prev.key !== `${rows.join('\n')}\t${cols.join('\n')}` || !Array.isArray(prev.a)) return;
      if (prev.t != null) { t = prev.t; playing = true; seen = true; shown = -2; return; }
      sa = toneTo.map((_, i) => ({ x: prev.a[i] || 0, v: (prev.v && prev.v[i]) || 0 }));
      moving = true;
      t = 1e9;
      was = prev.peak;   // 가장 높은 칸이 달라졌으면 색이 건너가며 한 번 튑니다
      if (prev.num) seed(prev.num);
    }
    function step(dt) {
      let busy = false;
      sa.forEach((sp, i) => {
        springTo(sp, toneTo[i], MK, MC, dt);
        if (Math.abs(sp.x - toneTo[i]) > 0.002 || Math.abs(sp.v) > 0.02) busy = true; else { sp.x = toneTo[i]; sp.v = 0; }
      });
      if (!busy) { moving = false; sa = null; }
    }
    function setPeak(i) {
      if (i === shown) return;
      if (shown >= 0) { cells[shown].classList.remove('is-peak'); cells[shown].removeAttribute('transform'); }
      const first = shown === -2;
      shown = i;
      if (i >= 0) { cells[i].classList.add('is-peak'); cellsG.append(cells[i]); }
      popT = i >= 0 && (first ? was != null && was !== i : true) ? 0 : FLASH;   // 다시 그린 카드의 첫 장면은 가장 높은 칸이 앞 장면과 다를 때만 튑니다
      setFig(i);
    }
    function render() {
      if (!W) return;
      const col = moving || t >= FULL ? C - 1 : Math.floor((t - T0) / STEP);
      cells.forEach((c, i) => {
        const a = moving ? sa[i].x : toneTo[i] * clamp((t - T0 - (i % C) * STEP) / FADE);
        c.setAttribute('fill-opacity', a.toFixed(3));
      });
      const sweeping = !moving && t > T0 && t < T0 + C * STEP;
      scan.setAttribute('opacity', sweeping ? 1 : 0);
      if (sweeping) scan.setAttribute('x', fx(GL + ((t - T0) / STEP - 0.5) * cw));
      setPeak(col < 0 ? -1 : run[Math.min(C - 1, col)]);
      if (shown >= 0 && popT < FLASH) {
        const k = popT >= POP.dur ? 1 : 0.55 + 0.45 * POP.at(popT), u = popT / 520, x = cx(shown) + cw / 2, y = cy(shown) + ch / 2, e = 1 + 7 * clamp(u);
        cells[shown].setAttribute('transform', `translate(${fx(x)},${fx(y)}) scale(${k.toFixed(3)}) translate(${fx(-x)},${fx(-y)})`);
        pulse.setAttribute('x', fx(cx(shown) - e)); pulse.setAttribute('y', fx(cy(shown) - e));
        pulse.setAttribute('width', fx(cw + 2 * e)); pulse.setAttribute('height', fx(ch + 2 * e));
        pulse.setAttribute('opacity', u < 1 ? fx(0.6 * (1 - u)) : 0);
      } else { pulse.setAttribute('opacity', 0); if (shown >= 0) cells[shown].removeAttribute('transform'); }
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다.
    keep(card, () => {
      if (!W) return from;
      const mid = !moving && playing && t < FULL;
      return {
        inView, W, H, key: `${rows.join('\n')}\t${cols.join('\n')}`, t: mid ? t : null, peak: shown, num: figText,
        a: moving ? sa.map((sp) => sp.x) : toneTo.slice(), v: moving ? sa.map((sp) => sp.v) : null,
      };
    });

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 쓸지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, stamp0 = 0, raf = 0;
    // 옮겨 가기와 가장 높은 칸의 튐은 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const on = () => card.isConnected && inView && (moving || popT < FLASH || (playing && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { stamp0 = 0; return; }
      const dt = stamp0 ? Math.min(100, stamp - stamp0) : 16;
      stamp0 = stamp;
      if (popT < FLASH) popT += dt;
      if (moving) step(dt);
      else if (playing && !holds.size) {
        if (rest > 0) { rest -= dt; if (rest <= 0) { t = 0; shown = shown >= 0 ? (cells[shown].classList.remove('is-peak'), -1) : -1; figAt = -2; } }
        else { t = Math.min(TOTAL, t + dt); if (t >= TOTAL) { if (loop) rest = M.ms('rest'); else playing = false; } }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() {
      moving = false; sa = null;
      if (shown >= 0) { cells[shown].classList.remove('is-peak'); cells[shown].removeAttribute('transform'); }
      shown = -1; figAt = -2; popT = FLASH;
      t = 0; rest = 0; stamp0 = 0; playing = true;
      render();
      kick();
    }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 위아래 화살표는 한 행씩 옮기고, 아무 칸도 짚지 않았을 때의 첫 화살표는 가장 높은 칸에서 시작합니다(좌우는 interact가 옮깁니다).
    plot.addEventListener('keydown', (e) => {
      if (!/^Arrow/.test(e.key)) return;
      const i = api.at(), j = i < 0 ? Math.max(0, peak) : e.key === 'ArrowUp' ? i - C : e.key === 'ArrowDown' ? i + C : -1;
      if (j < 0 || j >= N) { if (i >= 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      api.show(j);
    }, true);
    // 툴팁: 짚은 칸에 테두리를 두르고 그 행 · 열의 이름을 굵게 적습니다. 값과, 그 값이 전체 평균의 몇 배인지 적습니다.
    const api = interact(plot, N,
      (px, py) => {
        const r = plot.getBoundingClientRect(), c = Math.floor((px - r.left - GL) / cw), w = Math.floor((py - r.top) / ch);
        return c < 0 || c >= C || w < 0 || w >= R ? -1 : w * C + c;
      },
      (i) => {
        const r = plot.getBoundingClientRect(), v = vals[i];
        hot = i;
        ring.setAttribute('x', fx(cx(i))); ring.setAttribute('y', fx(cy(i))); ring.setAttribute('width', fx(cw)); ring.setAttribute('height', fx(ch)); ring.setAttribute('opacity', 1);
        rowT.forEach((tn, k) => tn.classList.toggle('is-on', k === Math.floor(i / C)));
        nameCols(i % C);
        const tb = tipBody(v == null ? { value: tx(d, '데이터 없음') } : { value: show(f, v), big: true, note: avg > 0 ? { text: tx(d, '평균의 %s배', num(v / avg, 1)) } : null }, where(i));
        return { x: r.left + cx(i) + cw / 2, y: r.top + cy(i), label: where(i), value: tb.node, text: tb.text };
      },
      () => { hot = -1; ring.setAttribute('opacity', 0); rowT.forEach((tn) => tn.classList.remove('is-on')); nameCols(-1); });

    if (live) t = 1e9;   // 마지막 장면에서 시작합니다(앞 장면을 받았으면 layout이 거기서 옮겨 가기를 시작합니다)
    if (from) inView = !!from.inView;
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (!inView && (moving || popT < FLASH)) { moving = false; sa = null; popT = FLASH; render(); }   // 화면 밖에서는 옮겨 가기를 끝낸 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
