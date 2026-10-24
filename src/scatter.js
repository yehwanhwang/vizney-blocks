  /* 스캐터 공통: 두 측정값을 가로 · 세로축에 두고 항목마다 점을 찍습니다. 축마다 끝수 없는 눈금 3–5개와 옅은 실선 격자를 두고,
     축 이름과 단위는 축에 붙여 세로축은 그래프 왼쪽 위(↑), 가로축은 눈금 아래 오른쪽 끝(→)에 적습니다. 점은 지름 9px에 흰 테두리 2px입니다.
     마우스는 28px 안에서 가장 가까운 점을, 키보드는 좌우 화살표로 가로값 순서(path면 적은 순서)를 따라 옮깁니다.
     cfg: toneOf(p) · rankGroups(groups) 색을 줄 묶음 순서 · label(p, 순번) 이름을 적을 점 · ref { x, y, xText } 기준선 · quadrants [왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래]
          path(적은 순서로 잇기) · radius(p, 순번) · fade(p, 순번) 점의 옅기 · yText(p) 툴팁 값 · note(p) 툴팁 덧붙임 · legend */
  function scatterCard(card, d, f, cfg) {
    const ax = d.x || {}, ay = d.y || {}, fx = format(ax), fy = format(ay);
    const pts = (d.points || []).filter((p) => p && fin(p.x) && fin(p.y)).map((p) => Object.assign({}, p, { x: +p.x, y: +p.y }));
    // 달러(usd) 축은 가장 큰 값으로 K · M · B 하나를 골라 눈금은 나눈 값으로, 축 이름에는 $K 같은 단위를 적습니다.
    const scaleOf = (fa, vals) => { const top = Math.max(0, ...vals.map(Math.abs)); return !fa.usd ? [1, ''] : top >= 1e9 ? [1e9, '$B'] : top >= 1e6 ? [1e6, '$M'] : top >= 1e3 ? [1e3, '$K'] : [1, '$']; };
    const sx = scaleOf(fx, pts.map((p) => p.x)), sy = scaleOf(fy, pts.map((p) => p.y));
    const unitOfAxis = (a, fa) => (fa.usd ? (a === ax ? sx : sy)[1] : fa.parts(0)[1]) || '';
    const nameOf = (a, fa, fallback) => `${a.label || fallback}${unitOfAxis(a, fa) ? `(${unitOfAxis(a, fa)})` : ''}`;
    // 묶음(group)이 있으면 점 수가 많은 세 묶음만 주황 · 분홍빨강 · 파랑으로, 나머지는 회색으로 칠합니다(같은 수면 먼저 나온 묶음이 앞).
    const groups = [];
    pts.forEach((p) => { if (p.group == null) return; const g = groups.find((x) => x.name === p.group); if (g) g.count += 1; else groups.push({ name: p.group, count: 1 }); });
    const ranked = cfg.rankGroups ? cfg.rankGroups(groups) : groups.slice().sort((a, b) => b.count - a.count);
    ranked.forEach((g, i) => { g.tone = ['f1', 'f2', 't3'][i] || 'f0'; });
    const groupOf = (p) => groups.find((x) => x.name === p.group);
    const toneOf = (p) => (cfg.toneOf ? cfg.toneOf(p) : (groupOf(p) || {}).tone || 'f1');
    const rest = ranked.slice(3);
    const legend = cfg.legend || (ranked.length > 1 ? ranked.slice(0, 3).map((g) => ({ name: g.name, tone: g.tone, dot: true })).concat(rest.length ? [{ name: rest.length === 1 ? rest[0].name : '기타', tone: 'f0', dot: true }] : []) : null);
    head(card, d, f, null);
    if (legend) card.append(legendEl(legend));
    const foot = el('div', 'vzb-foot vzb-fill vzb-ax vzb-sc');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', `${d.title || ''} 산점도, 점 ${pts.length}개. 좌우 화살표로 점을 옮깁니다. 모든 값은 이어지는 표에 있습니다.`);
    const svg = svgEl('svg', { class: 'vzb-ax-svg vzb-sc-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 값 표
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, '이름'), el('th', null, nameOf(ax, fx, '가로값')), el('th', null, nameOf(ay, fy, '세로값')));
    table.append(el('caption', null, d.title || ''), hr);
    pts.forEach((p) => { const tr = el('tr'); tr.append(el('th', null, p.name || ''), el('td', null, show(fx, p.x)), el('td', null, show(fy, p.y))); table.append(tr); });
    sr.append(table);
    card.append(sr);
    const order = pts.map((_, i) => i);
    if (!cfg.path) order.sort((a, b) => pts[a].x - pts[b].x || pts[a].y - pts[b].y);
    const fam = getComputedStyle(card).fontFamily;
    let X = null, Y = null, dots = [], front = null, lastW = 0, lastH = 0;
    // 값 범위에 8% 여유를 두고, 0 이상인 값은 0 아래로 내려가지 않게 합니다.
    const span = (vals) => {
      const lo0 = Math.min(...vals), hi0 = Math.max(...vals), pad = (hi0 - lo0 || Math.abs(hi0) || 1) * 0.08;
      return [lo0 >= 0 && lo0 - pad < 0 ? 0 : lo0 - pad, hi0 + pad];
    };
    // 축 범위는 여유를 둔 값 범위 그대로 쓰고, 눈금은 그 안의 끝수 없는 값(1 · 2 · 2.5 · 5 단위)에만 긋습니다.
    // 눈금은 most개를 넘지 않는 한 많이 두되, 2.5 단위는 다른 간격으로 셋 이상 둘 수 없을 때만 씁니다.
    const ticksOf = (lo, hi, most) => {
      let best = null;
      const e0 = Math.floor(Math.log10((hi - lo) / most)) - 1;
      for (let e = e0; e <= e0 + 3; e++) {
        for (const m of [1, 2, 2.5, 5]) {
          const step = m * Math.pow(10, e), a = Math.ceil(lo / step - 1e-9), b = Math.floor(hi / step + 1e-9), cnt = b - a + 1;
          if (cnt < 2 || cnt > most) continue;
          const score = cnt - (m === 2.5 ? 2.5 : 0);
          if (!best || score > best.score) best = { step, a, cnt, score };
        }
      }
      if (!best) return { list: [lo, hi], dec: 1 };
      const dec = stepDec(best.step);
      return { list: Array.from({ length: best.cnt }, (_, k) => +((best.a + k) * best.step).toFixed(dec)), dec };
    };
    const tickTxt = (v, dec, sc) => num(v / sc[0], Math.max(0, dec - Math.round(Math.log10(sc[0])))).replace(/^-/, '−');
    function draw(w, h) {
      lastW = w; lastH = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      dots = [];
      if (!pts.length) return;
      const ref = cfg.ref || {};
      const [xl, xh] = span(pts.map((p) => p.x).concat(fin(ref.x) ? [ref.x] : []));
      const [yl, yh] = span(pts.map((p) => p.y).concat(fin(ref.y) ? [ref.y] : []));
      // 위에는 세로축 이름, 아래에는 가로 눈금과 가로축 이름이 한 줄씩 들어갑니다.
      const top = 26, bottom = h - 40;
      const yt = ticksOf(yl, yh, Math.max(3, Math.min(4, Math.floor((bottom - top) / 40) + 1)));
      const gut = Math.ceil(Math.max(...yt.list.map((v) => textW(tickTxt(v, yt.dec, sy), 400, fam)))) + 10;
      const right = w - 8;
      const xt = ticksOf(xl, xh, Math.max(3, Math.min(5, Math.floor((right - gut) / 64) + 1)));
      svg.append(svgText(0, 12, `↑ ${nameOf(ay, fy, '세로값')}`, 'vzb-sc-name'), svgText(right, h - 3, `${nameOf(ax, fx, '가로값')} →`, 'vzb-sc-name', 'end'));
      X = (v) => gut + ((v - xl) / (xh - xl || 1)) * (right - gut);
      Y = (v) => bottom - ((v - yl) / (yh - yl || 1)) * (bottom - top);
      // 그래프 바깥 테두리: 아래와 왼쪽은 축선, 위와 오른쪽은 격자와 같은 옅은 선
      svg.append(svgEl('rect', { x: gut + 0.5, y: top + 0.5, width: Math.max(0, right - gut - 1), height: Math.max(0, bottom - top - 1), class: 'vzb-sc-frame' }));
      yt.list.forEach((v) => {
        const y = Math.round(Y(v)) + 0.5;
        svg.append(svgEl('line', { x1: gut, x2: right, y1: y, y2: y, class: v === 0 ? 'vzb-ax-zero' : 'vzb-ax-grid' }), svgText(gut - 8, y + 4, tickTxt(v, yt.dec, sy), 'vzb-ax-label', 'end'));
      });
      xt.list.forEach((v) => {
        const x = Math.round(X(v)) + 0.5;
        svg.append(svgEl('line', { x1: x, x2: x, y1: top, y2: bottom, class: v === 0 ? 'vzb-ax-zero' : 'vzb-ax-grid' }), svgText(x, bottom + 18, tickTxt(v, xt.dec, sx), 'vzb-ax-label', 'middle'));
      });
      // 이미 적은 글자의 자리(기준선 이름 · 구역 이름 · 점 이름). 점 이름은 이 자리와 겹치지 않는 곳을 찾습니다.
      const taken = [];
      const boxAt = (tx, ty, txt, anchor) => { const w = textW(txt, 500, fam), l = anchor === 'end' ? tx - w : anchor === 'middle' ? tx - w / 2 : tx; return [l - 2, ty - 11, l + w + 2, ty + 3]; };
      // 기준선(평균 등)과 사분면 이름
      if (fin(ref.x)) {
        const x = Math.round(X(ref.x)) + 0.5;
        svg.append(svgEl('line', { x1: x, x2: x, y1: top, y2: bottom, class: 'vzb-sc-ref' }));
        if (ref.xText) { svg.append(svgText(x + 6, top + 12, ref.xText, 'vzb-ax-note')); taken.push(boxAt(x + 6, top + 12, ref.xText, 'start')); }
      }
      if (fin(ref.y)) {
        const y = Math.round(Y(ref.y)) + 0.5;
        svg.append(svgEl('line', { x1: gut, x2: right, y1: y, y2: y, class: 'vzb-sc-ref' }));
      }
      if (cfg.quadrants) {
        const q = cfg.quadrants, at = [[gut + 8, top + 30, 'start'], [right - 8, top + 30, 'end'], [gut + 8, bottom - 10, 'start'], [right - 8, bottom - 10, 'end']];
        q.forEach((name, k) => { if (name) { svg.append(svgText(at[k][0], at[k][1], name, 'vzb-sc-quad', at[k][2])); taken.push(boxAt(at[k][0], at[k][1], name, at[k][2])); } });
      }
      // 이어 그리기: 묶음이 있으면 구간마다 도착점의 묶음 색으로, 없으면 주황 한 가지로 잇습니다.
      if (cfg.path && groups.length) {
        pts.slice(1).forEach((p, k) => svg.append(svgEl('line', { x1: X(pts[k].x), y1: Y(pts[k].y), x2: X(p.x), y2: Y(p.y), class: `vzb-sc-seg vzb-${toneOf(p)}` })));
      } else if (cfg.path) svg.append(svgEl('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(''), class: 'vzb-sc-path' }));
      // 회색 묶음을 먼저 찍어 색 있는 점이 위에 오게 합니다.
      const drawOrder = pts.map((_, i) => i).sort((a, b) => (toneOf(pts[a]) === 'f0' ? 0 : 1) - (toneOf(pts[b]) === 'f0' ? 0 : 1));
      dots = new Array(pts.length);
      drawOrder.forEach((i) => {
        const p = pts[i];
        const dot = svgEl('circle', { cx: X(p.x).toFixed(1), cy: Y(p.y).toFixed(1), r: cfg.radius ? cfg.radius(p, i) : 4.5, class: `vzb-sc-dot vzb-${toneOf(p)}` });
        if (cfg.fade) dot.style.fillOpacity = cfg.fade(p, i);
        svg.append(dot);
        dots[i] = dot;
      });
      // 이름은 고른 점에만 적습니다. 점 오른쪽 · 왼쪽 · 위 · 아래 순서로, 그래프 안이면서 구역 이름이나 먼저 적은 이름과 겹치지 않는 자리에 둡니다.
      const hit = (b) => taken.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
      const inside = (b) => b[0] >= gut && b[2] <= right && b[1] >= top - 6 && b[3] <= bottom + 6;
      pts.forEach((p, i) => {
        if (!(cfg.label ? cfg.label(p, i) : p.label)) return;
        const x = X(p.x), y = Y(p.y), txt = String(p.name || '');
        const spots = [[x + 9, y + 4, 'start'], [x - 9, y + 4, 'end'], [x, y - 10, 'middle'], [x, y + 18, 'middle']];
        const pick = spots.find((sp) => { const b = boxAt(sp[0], sp[1], txt, sp[2]); return inside(b) && !hit(b); }) || spots.find((sp) => inside(boxAt(sp[0], sp[1], txt, sp[2]))) || spots[0];
        taken.push(boxAt(pick[0], pick[1], txt, pick[2]));
        svg.append(svgText(pick[0], pick[1], txt, 'vzb-ax-note', pick[2]));
      });
      front = svgEl('g', {});
      svg.append(front);
    }
    onSize(plot, draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (lastW) draw(lastW, lastH); });
    interact(plot, () => order.length,
      (cx, cy) => {
        if (!X) return -1;
        const r = plot.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
        let best = -1, bd = 28 * 28;
        order.forEach((i, k) => { const dx = X(pts[i].x) - x, dy = Y(pts[i].y) - y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = k; } });
        return best;
      },
      (k) => {
        const i = order[k], p = pts[i];
        svg.classList.add('is-hover');
        dots.forEach((c, j) => c.classList.toggle('is-on', j === i));
        front.replaceChildren(svgEl('circle', { cx: X(p.x), cy: Y(p.y), r: 7.5, class: `vzb-sc-ring vzb-${toneOf(p)}` }));
        const r = plot.getBoundingClientRect();
        const note = [p.group != null ? String(p.group) : '', `${ax.label || '가로값'} ${show(fx, p.x)}`, cfg.note ? cfg.note(p) : ''].filter(Boolean).join(' · ');
        const t = tipBody({ value: cfg.yText ? cfg.yText(p) : show(fy, p.y), note }, p.name || '');
        return { x: r.left + X(p.x), y: r.top + Y(p.y) - 8, label: p.name || '', value: t.node, text: t.text };
      },
      () => { svg.classList.remove('is-hover'); dots.forEach((c) => c.classList.remove('is-on')); if (front) front.replaceChildren(); });
  }
