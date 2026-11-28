  // Heatmap Slice: 두 갈래(요일 × 시간대 같은 rows × cols)로 나눈 값을 칸의 진하기로 그리고, 짚은 칸의 행과 열을 막대로 세워 보여 주는 히트맵입니다.
  // 칸은 첫째 데이터 색을 값만큼 진하게 칠합니다(0에서 가장 큰 값까지). 색으로는 어디에 몰리는지를 읽고, 크기는 막대로 견줍니다.
  // 짚은 칸의 행은 그리드 위에 열마다 세로 막대로, 짚은 칸의 열은 그리드 오른쪽에 행마다 가로 막대로 섭니다. 두 막대는 같은 눈금(0에서 가장 큰 값)을 써서 서로 견줄 수 있습니다.
  // 짚은 행과 열에는 글자색 테두리를 두르고, 막대 가운데 짚은 칸의 막대만 글자색으로 칠합니다. 처음에는 focus(["행 이름", "열 이름"], 비우면 가장 높은 칸)가 짚여 있습니다.
  // 머리의 큰 숫자는 짚은 칸의 값이고, 뒤에 그 값이 전체 평균의 몇 배인지와 어느 칸인지(행 · 열 이름)를 적습니다(카드가 계산합니다).
  // 움직임: 칸에 마우스를 올리면 그 칸을 잠시 짚어 보이고, 누르거나(터치 포함) 포커스한 뒤 화살표를 누르면 그 칸에 짚은 자리가 머뭅니다. 마우스가 그래프를 벗어나면 머물던 칸으로 돌아갑니다. 테두리가 그 행과 열로 미끄러져 가고(Settle),
  // 막대는 새 행 · 열의 값으로 옮겨 갑니다(Move: 넘치지 않음). 행을 옮기면 위 막대가, 열을 옮기면 오른쪽 막대가 바뀌어 줄마다 모양이 어떻게 다른지 보입니다.
  // 화면에 보이면 막대가 바닥에서 한 번 자랍니다. 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 칸의 진하기와 막대가 화면에 있던 값에서 새 값으로 옮겨 가고, 짚은 칸은 이어 갑니다.
  // rows · cols나 카드 크기가 달라지면 옮겨 가지 않고 바로 그립니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 행마다 가장 높은 칸을 차례로 짚어 보입니다.
  mount('heatmap-slice', (card, d, f) => {
    // 걸러서 남은 것이 없을 때(rows · cols · values가 빈 배열)는 오류가 아니라 빈 화면입니다.
    const empty = (a) => Array.isArray(a) && !a.length;
    if (empty(d.rows) || empty(d.cols) || empty(d.values)) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-hl-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const rows = Array.isArray(d.rows) ? d.rows.map(String) : [], cols = Array.isArray(d.cols) ? d.cols.map(String) : [], R = rows.length, C = cols.length, N = R * C;
    if (!N || !Array.isArray(d.values) || d.values.length !== R || d.values.some((r) => !Array.isArray(r) || r.length !== C || r.some((v) => v != null && (!fin(v) || v < 0)))) throw new Error(tx(d, 'rows · cols와 values를 확인하세요.'));
    const vals = d.values.flatMap((r) => r.map((v) => (v == null ? null : +v))), nums = vals.filter((v) => v != null);
    if (!nums.length) throw new Error(tx(d, 'rows · cols와 values를 확인하세요.'));
    const vmax = Math.max(...nums), avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const frac = (v) => (v == null || vmax <= 0 ? 0 : v / vmax);
    const tone = (v) => (v == null ? 0 : 0.08 + 0.92 * Math.pow(frac(v), 0.9));   // 칸의 진하기(0~1). 색으로 바꾸는 식은 heatmap-slice.css에 있습니다
    // 칸에 진하기를 적습니다: --vzb-t는 진하기 그대로, --vzb-t2와 --vzb-u는 어두운 바탕(Vizney 노랑)에서 쓰는 첫째 색과 회색의 몫입니다.
    const shade = (node, a) => { node.style.setProperty('--vzb-t', a.toFixed(3)); node.style.setProperty('--vzb-t2', Math.pow(a, 2.2).toFixed(3)); node.style.setProperty('--vzb-u', (0.06 + 0.5 * a).toFixed(3)); };
    const toneTo = vals.map(tone), key = `${rows.join('\n')}\t${cols.join('\n')}`;
    const peak = vals.reduce((b, v, i) => (v != null && (b < 0 || v > vals[b]) ? i : b), -1), where = (i) => `${rows[Math.floor(i / C)]} · ${cols[i % C]}`;
    // 짚은 칸: 보는 사람이 짚던 칸(카드 요소의 data-vzb-focus)이 있으면 그것, 없으면 focus, 그것도 없으면 가장 높은 칸
    const find = (p) => { const r = Array.isArray(p) ? rows.indexOf(String(p[0])) : -1, c = Array.isArray(p) ? cols.indexOf(String(p[1])) : -1; return r < 0 || c < 0 ? -1 : r * C + c; };
    let saved = null;
    try { saved = JSON.parse(card.getAttribute('data-vzb-focus') || 'null'); } catch (e) { saved = null; }
    let at = find(saved);
    if (at < 0) at = find(d.focus);
    if (at < 0) at = Math.max(0, peak);
    let pin = at;   // 머무는 칸: 마우스를 올려 잠시 짚은 칸(at)은 그래프를 벗어나면 여기로 돌아옵니다

    // 머리: 제목 · 부제, 그 아래 짚은 칸의 값 · 평균 대비 · 어느 칸인지
    head(card, d, f, null);
    const fig = el('div', 'vzb-fig'), numEl = el('div', 'vzb-num vzb-hl-num'), numT = document.createTextNode(''), unitEl = el('span', 'vzb-unit');
    const dl = el('span', 'vzb-delta'), bd = el('span', 'vzb-badge vzb-flat'), vs = el('span', 'vzb-vs');
    numEl.append(numT, unitEl);
    dl.append(bd, vs);
    fig.append(numEl, dl);
    card.append(fig);
    const whole = nums.every(Number.isInteger);
    let figKey = '';
    function setFig(v) {
      const none = vals[at] == null, [a, u] = none ? [tx(d, '데이터 없음'), ''] : f.parts(whole ? Math.round(v) : v), times = none || avg <= 0 ? '' : tx(d, '평균의 %s배', num(v / avg, 1));
      const k = `${a}|${u}|${times}|${at}`;
      if (k === figKey) return;
      figKey = k;
      numT.nodeValue = a;
      unitEl.textContent = u;
      unitEl.style.display = u ? '' : 'none';
      bd.textContent = times;
      bd.style.display = times ? '' : 'none';
      vs.textContent = where(at);
    }

    const foot = el('div', 'vzb-foot vzb-fill vzb-hl');
    const plot = el('div', 'vzb-plot vzb-hl-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const svg = svgEl('svg', { class: 'vzb-hl-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    const say = el('span', 'vzb-sr');
    say.setAttribute('aria-live', 'polite');
    card.append(say);
    const told = (i) => (vals[i] == null ? `${where(i)} ${tx(d, '데이터 없음')}` : `${where(i)} ${show(f, vals[i])}${avg > 0 ? `, ${tx(d, '평균의 %s배', num(vals[i] / avg, 1))}` : ''}`);
    const describe = () => plot.setAttribute('aria-label', tx(d, '%1. %2. 화살표로 칸을 옮기면 그 행과 열의 값이 막대로 바뀝니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', told(at)));
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

    // 그림: 위 막대(짚은 행) · 칸 · 오른쪽 막대(짚은 열) · 짚은 행과 열의 테두리 · 행 이름(왼쪽) · 열 이름(아래) · 범례(오른쪽 아래)
    const baseT = svgEl('line', { class: 'vzb-hl-base' }), baseR = svgEl('line', { class: 'vzb-hl-base' }), cellsG = svgEl('g', {});
    const cells = vals.map((v) => { const c = svgEl('rect', { class: `vzb-hl-cell${v == null ? ' is-null' : ''}` }); cellsG.append(c); return c; });
    const topB = cols.map(() => svgEl('path', { class: 'vzb-hl-bar' })), sideB = rows.map(() => svgEl('path', { class: 'vzb-hl-bar' }));
    const rowBox = svgEl('rect', { class: 'vzb-hl-box' }), colBox = svgEl('rect', { class: 'vzb-hl-box' });
    const rowT = rows.map((name) => svgText(0, 0, name, 'vzb-hl-name', 'end')), colT = cols.map((name) => svgText(0, 0, name, 'vzb-hl-name', 'middle'));
    const topCap = svgText(0, 0, '', 'vzb-hl-name is-on', 'end'), sideCap = svgText(0, 0, '', 'vzb-hl-name is-on', 'middle');
    const STEPS = [0.08, 0.31, 0.54, 0.77, 1], legG = svgEl('g', {}), legLo = svgText(0, 0, tx(d, '적음'), 'vzb-hl-name', 'end'), legHi = svgText(0, 0, tx(d, '많음'), 'vzb-hl-name', 'start');
    const legB = STEPS.map((a) => { const b = svgEl('rect', { class: 'vzb-hl-cell', width: 10, height: 10 }); shade(b, a); return b; });
    legG.append(legLo, ...legB, legHi);
    svg.append(baseT, baseR, cellsG, ...topB, ...sideB, rowBox, colBox, ...rowT, ...colT, topCap, sideCap, legG);

    const fx = (v) => v.toFixed(1);
    foot.style.minHeight = `${R * 14 + 96}px`;   // 행 이름(12px)이 겹치지 않게 한 행은 14px 밑으로 내려가지 않습니다. 자리가 모자라면 카드가 그만큼 길어집니다
    // 칸의 진하기와 막대의 길이는 값이라 Move로 옮기고, 테두리의 자리는 값이 아니라 Settle로 미끄러집니다.
    const M = motion(card), [MK, MC] = M.pair('move'), [SK, SC] = M.pair('settle'), NAMEH = 20, LEGH = 20, GAP = 2;
    let W = 0, H = 0, GL = 0, cw = 1, ch = 1, RC = 2, RB = 3, every = 1, TOPH = 40, SIDEW = 60, gy = 0, sx = 0, wait = 0, idle = 0;
    // 스프링: 위 막대(열마다) · 오른쪽 막대(행마다)의 길이(0~1), 테두리의 자리(px), 머리의 숫자(값). 다시 그릴 때는 칸의 진하기(sa)도 옮깁니다.
    const tb = cols.map(() => ({ x: 0, v: 0 })), sb = rows.map(() => ({ x: 0, v: 0 })), bx = { x: 0, v: 0 }, by = { x: 0, v: 0 }, kv = { x: vals[at] || 0, v: 0 };
    let from = before(card), sa = null, grown = false, placed = false;
    const tbTo = (c) => (grown ? frac(vals[Math.floor(at / C) * C + c]) : 0), sbTo = (r) => (grown ? frac(vals[r * C + (at % C)]) : 0);
    // 열 이름: 몇 칸마다 하나씩 적되, 짚은 열의 이름은 늘 굵게 적고 그와 겹칠 이웃 이름은 뺍니다.
    function names() {
      const pr = Math.floor(at / C), pc = at % C;
      rowT.forEach((tn, r) => tn.classList.toggle('is-on', r === pr));
      colT.forEach((tn, c) => {
        tn.classList.toggle('is-on', c === pc);
        tn.setAttribute('opacity', c === pc || (c % every === 0 && Math.abs(c - pc) >= every) ? 1 : 0);
      });
      topB.forEach((b, c) => b.classList.toggle('is-on', c === pc));
      sideB.forEach((b, r) => b.classList.toggle('is-on', r === pr));
      topCap.textContent = rows[pr];
      sideCap.textContent = cols[pc];
    }
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const fam = getComputedStyle(card).fontFamily;
      GL = Math.ceil(Math.max(...rows.map((x) => textW(x, 700, fam, 12)))) + 8;
      const colW = Math.ceil(Math.max(...cols.map((x) => textW(x, 700, fam, 12))));
      SIDEW = Math.max(colW + 4, Math.min(96, Math.round(w * 0.14)));
      TOPH = Math.max(26, Math.min(64, Math.round(h * 0.2)));
      gy = TOPH + 8;
      cw = Math.max(4, (w - GL - 12 - SIDEW) / C);
      ch = Math.max(6, (h - gy - NAMEH - LEGH) / R);
      sx = GL + C * cw + 12;
      RC = Math.min(len(card, 'radius-mark', 3), Math.min(cw, ch) / 4);   // 칸의 모서리는 짧은 변의 1/4을 넘기지 않습니다(네모가 점으로 읽히지 않게)
      RB = len(card, 'radius-mark', 3);
      const g = Math.min(GAP, cw / 4, ch / 4);
      cells.forEach((c, i) => {
        c.setAttribute('x', fx(GL + (i % C) * cw + g / 2)); c.setAttribute('y', fx(gy + Math.floor(i / C) * ch + g / 2));
        c.setAttribute('width', fx(cw - g)); c.setAttribute('height', fx(ch - g));
        c.setAttribute('rx', fx(RC));
      });
      baseT.setAttribute('x1', GL); baseT.setAttribute('x2', fx(GL + C * cw)); baseT.setAttribute('y1', TOPH + 0.5); baseT.setAttribute('y2', TOPH + 0.5);
      baseR.setAttribute('x1', fx(sx - 0.5)); baseR.setAttribute('x2', fx(sx - 0.5)); baseR.setAttribute('y1', gy); baseR.setAttribute('y2', fx(gy + R * ch));
      rowBox.setAttribute('x', fx(GL - 1)); rowBox.setAttribute('width', fx(C * cw + 2)); rowBox.setAttribute('height', fx(ch + 2)); rowBox.setAttribute('rx', fx(RC + 1));
      colBox.setAttribute('y', fx(gy - 1)); colBox.setAttribute('width', fx(cw + 2)); colBox.setAttribute('height', fx(R * ch + 2)); colBox.setAttribute('rx', fx(RC + 1));
      rowT.forEach((tn, r) => { tn.setAttribute('x', GL - 8); tn.setAttribute('y', fx(gy + r * ch + ch / 2 + 4)); });
      every = Math.max(1, Math.ceil((colW + 10) / cw));
      colT.forEach((tn, c) => { tn.setAttribute('x', fx(GL + c * cw + cw / 2)); tn.setAttribute('y', fx(gy + R * ch + 15)); });
      topCap.setAttribute('x', GL - 8); topCap.setAttribute('y', TOPH - 2);
      sideCap.setAttribute('x', fx(sx + SIDEW / 2)); sideCap.setAttribute('y', fx(gy + R * ch + 15));
      // 범례: 오른쪽 아래에 적음 ▢▢▢▢▢ 많음
      const hiW = Math.ceil(textW(legHi.textContent, 400, fam, 12)), y = h - 11;
      let x = w - hiW - 6 - STEPS.length * 12;
      legLo.setAttribute('x', x - 6); legLo.setAttribute('y', y + 9);
      legB.forEach((b) => { b.setAttribute('x', x); b.setAttribute('y', y); b.setAttribute('rx', fx(Math.min(RC, 2))); x += 12; });
      legHi.setAttribute('x', x + 4); legHi.setAttribute('y', y + 9);
      if (from) { begin(from); from = null; }
      if (!placed && grown) { tb.forEach((sp, c) => { sp.x = tbTo(c); }); sb.forEach((sp, r) => { sp.x = sbTo(r); }); }   // 다시 그린 카드가 앞 장면을 못 받았으면 마지막 장면을 바로 그립니다
      if (!placed || !busy()) { bx.x = GL + (at % C) * cw; by.x = gy + Math.floor(at / C) * ch; bx.v = by.v = 0; placed = true; }
      names();
      render();
      kick();
    }
    // 앞 장면에서 시작합니다. rows · cols나 카드 크기가 달라졌으면 옮겨 가지 않고 마지막 장면을 바로 그립니다.
    function begin(prev) {
      if (!prev || !prev.inView || prev.W !== W || prev.H !== H || prev.key !== key || !Array.isArray(prev.a)) return;
      sa = toneTo.map((_, i) => ({ x: prev.a[i] || 0, v: (prev.av && prev.av[i]) || 0 }));
      tb.forEach((sp, c) => { sp.x = prev.tb[c] || 0; sp.v = (prev.tbv && prev.tbv[c]) || 0; });
      sb.forEach((sp, r) => { sp.x = prev.sb[r] || 0; sp.v = (prev.sbv && prev.sbv[r]) || 0; });
      bx.x = prev.bx; by.x = prev.by; bx.v = prev.bxv || 0; by.v = prev.byv || 0;
      if (prev.at === at && prev.kv != null) { kv.x = prev.kv; kv.v = prev.kvv || 0; }
      placed = true;
    }
    const near = (sp, to, eps, veps) => Math.abs(sp.x - to) <= eps && Math.abs(sp.v) <= veps;
    function busy() {
      const pr = Math.floor(at / C), pc = at % C;
      return wait > 0 || !!sa || !near(bx, GL + pc * cw, 0.2, 4) || !near(by, gy + pr * ch, 0.2, 4) || !near(kv, vals[at] || 0, (vmax || 1) * 0.0006, (vmax || 1) * 0.01)
        || tb.some((sp, c) => !near(sp, tbTo(c), 0.002, 0.02)) || sb.some((sp, r) => !near(sp, sbTo(r), 0.002, 0.02));
    }
    function step(dt) {
      const pr = Math.floor(at / C), pc = at % C;
      if (wait > 0) { wait -= dt; if (wait <= 0) grown = true; }
      tb.forEach((sp, c) => { springTo(sp, tbTo(c), MK, MC, dt); if (near(sp, tbTo(c), 0.002, 0.02)) { sp.x = tbTo(c); sp.v = 0; } });
      sb.forEach((sp, r) => { springTo(sp, sbTo(r), MK, MC, dt); if (near(sp, sbTo(r), 0.002, 0.02)) { sp.x = sbTo(r); sp.v = 0; } });
      const land = (sp, to, k, c, eps, veps) => { springTo(sp, to, k, c, dt); if (near(sp, to, eps, veps)) { sp.x = to; sp.v = 0; } };
      land(bx, GL + pc * cw, SK, SC, 0.2, 4);
      land(by, gy + pr * ch, SK, SC, 0.2, 4);
      land(kv, vals[at] || 0, MK, MC, (vmax || 1) * 0.0006, (vmax || 1) * 0.01);
      if (sa) {
        let moving = false;
        sa.forEach((sp, i) => { springTo(sp, toneTo[i], MK, MC, dt); if (near(sp, toneTo[i], 0.002, 0.02)) { sp.x = toneTo[i]; sp.v = 0; } else moving = true; });
        if (!moving) sa = null;
      }
    }
    function render() {
      if (!W) return;
      cells.forEach((c, i) => { const a = sa ? sa[i].x : toneTo[i]; if (c.vzbA !== a) { c.vzbA = a; shade(c, a); } });
      // 위 막대: 열 폭에 맞춰(최대 28px) 바닥선에서 위로. 오른쪽 막대: 행 높이에 맞춰(최대 18px) 왼쪽 선에서 오른쪽으로. 끝만 둥글립니다.
      const bw = Math.min(28, cw - Math.min(GAP, cw / 4)), bh = Math.min(18, ch - Math.min(GAP, ch / 4));
      topB.forEach((b, c) => {
        const hgt = Math.max(0, tb[c].x) * TOPH, x = GL + c * cw + (cw - bw) / 2, r = Math.min(RB, bw / 2, hgt);
        b.setAttribute('d', hgt < 0.3 ? '' : `M${fx(x)},${TOPH}V${fx(TOPH - hgt + r)}a${fx(r)},${fx(r)} 0 0 1 ${fx(r)},${fx(-r)}H${fx(x + bw - r)}a${fx(r)},${fx(r)} 0 0 1 ${fx(r)},${fx(r)}V${TOPH}Z`);
      });
      sideB.forEach((b, k) => {
        const wid = Math.max(0, sb[k].x) * SIDEW, y = gy + k * ch + (ch - bh) / 2, r = Math.min(RB, bh / 2, wid);
        b.setAttribute('d', wid < 0.3 ? '' : `M${fx(sx)},${fx(y)}H${fx(sx + wid - r)}a${fx(r)},${fx(r)} 0 0 1 ${fx(r)},${fx(r)}V${fx(y + bh - r)}a${fx(r)},${fx(r)} 0 0 1 ${fx(-r)},${fx(r)}H${fx(sx)}Z`);
      });
      rowBox.setAttribute('y', fx(by.x - 1));
      colBox.setAttribute('x', fx(bx.x - 1));
      setFig(kv.x);
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다.
    keep(card, () => {
      if (!W) return from;
      return {
        inView, W, H, key, at, a: sa ? sa.map((sp) => sp.x) : toneTo.slice(), av: sa ? sa.map((sp) => sp.v) : null,
        tb: tb.map((sp) => sp.x), tbv: tb.map((sp) => sp.v), sb: sb.map((sp) => sp.x), sbv: sb.map((sp) => sp.v),
        bx: bx.x, by: by.x, bxv: bx.v, byv: by.v, kv: kv.x, kvv: kv.v,
      };
    });

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 막대가 바닥에서 다시 자라지 않습니다
    let inView = false, seen = false, stamp0 = 0, raf = 0;
    function tick(stamp) {
      raf = 0;
      if (!card.isConnected || !inView) { stamp0 = 0; return; }
      const dt = stamp0 ? Math.min(100, stamp - stamp0) : 16;
      stamp0 = stamp;
      step(dt);
      render();
      if (busy()) raf = requestAnimationFrame(tick); else stamp0 = 0;
    }
    function kick() { if (!raf && W && inView && busy()) raf = requestAnimationFrame(tick); }
    // 칸 짚기: 테두리와 막대가 그 칸의 행과 열로 옮겨 갑니다. 짚은 칸은 카드 요소에 적어 두어, 데이터가 바뀌어 다시 그려도 이어 갑니다.
    function pick(i, quiet, stay) {
      if (i < 0 || i >= N) return;
      if (stay && i !== pin) { pin = i; card.setAttribute('data-vzb-focus', JSON.stringify([rows[Math.floor(i / C)], cols[i % C]])); }
      if (i === at) return;
      at = i;
      kv.x = vals[at] || 0; kv.v = 0;   // 다른 칸의 값이므로 세지 않고 바로 적습니다
      names();
      describe();
      if (!quiet) say.textContent = told(at);
      render();
      kick();
    }
    const cellAt = (e) => {
      const r = plot.getBoundingClientRect(), c = Math.floor((e.clientX - r.left - GL) / cw), w = Math.floor((e.clientY - r.top - gy) / ch);
      return c < 0 || c >= C || w < 0 || w >= R ? -1 : w * C + c;
    };
    const touch = () => { idle = performance.now() + 6000; };
    plot.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { touch(); pick(cellAt(e), true); } });
    plot.addEventListener('pointerdown', (e) => { touch(); pick(cellAt(e), true, true); });
    plot.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') pick(pin, true); });
    plot.addEventListener('keydown', (e) => {
      const pr = Math.floor(at / C), pc = at % C;
      const to = { ArrowLeft: pc > 0 ? at - 1 : -1, ArrowRight: pc < C - 1 ? at + 1 : -1, ArrowUp: pr > 0 ? at - C : -1, ArrowDown: pr < R - 1 ? at + C : -1, Home: pr * C, End: pr * C + C - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      touch();
      pick(to, false, true);
    });
    describe();

    if (live || !('IntersectionObserver' in window)) grown = true;
    if (from) inView = !!from.inView;
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보이면 뜸(Lead) 뒤에 막대가 바닥에서 자랍니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (inView && !seen) { seen = true; if (!grown) wait = M.ms('lead') || 1; }
        if (!inView && sa) { sa = null; render(); }   // 화면 밖에서는 옮겨 가기를 끝낸 장면으로 둡니다
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; }
    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 행마다 가장 높은 칸을 차례로 짚어 보입니다.
    if (card.closest('[data-vzb-loop]')) {
      const tops = rows.map((_, r) => { let b = -1; for (let c = 0; c < C; c++) { const i = r * C + c; if (vals[i] != null && (b < 0 || vals[i] > vals[b])) b = i; } return b; }).filter((i) => i >= 0);
      let k = Math.max(0, tops.indexOf(at));
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!inView || !grown || performance.now() < idle || tops.length < 2) return;
        k = (k + 1) % tops.length;
        pin = tops[k];   // 갤러리의 둘러보기는 카드 요소에 적지 않습니다
        pick(tops[k], true);
      }, M.ms('rest') || 2600);
    }
  });
