  // Line Cross: 두 항목의 기간별 값을 선 두 개로 잇고, 두 선이 엇갈린 자리(역전)를 고리로 짚습니다.
  // 짚을 항목(focus, 비우면 첫 항목)만 첫째 데이터 색이고 다른 선은 회색입니다. 선 끝에 이름을 적어 범례를 대신합니다.
  // 머리의 큰 숫자는 짚을 항목의 마지막 기간 값이고, 바로 뒤 배지는 다른 항목과의 차이입니다(카드가 계산합니다).
  // 세로 눈금은 0에서 시작하지 않고 값의 범위에 맞추되, 위아래에 범위의 25%를 비워 오르내림이 부풀어 보이지 않게 합니다(값이 모두 0 이상이면 0 밑으로 내려가지 않습니다).
  // 엇갈린 자리마다 고리를 그리고, 마지막으로 엇갈린 자리에는 위쪽 빈자리에 알약으로 언제 엇갈렸는지 적습니다(엇갈린 뒤 첫 기간).
  // 움직임: 화면에 보이면 두 선이 시간 순서로 함께 그어집니다. 선 끝의 이름과 머리의 숫자 · 배지가 선을 따라가고,
  // 마지막으로 엇갈리는 자리에서 잠깐 멈춰 고리가 튀어 오르며 알약이 뜬 뒤 끝까지 갑니다. 엇갈리는 동안 두 이름은 위아래 자리를 바꿉니다.
  // 선이나 이름을 누르면(키보드는 Enter) 그 항목이 짚을 항목이 되어 색과 머리의 숫자가 옮겨 갑니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 재생하지 않고, 화면에 있던 선의 점마다 높이(px)가 새 자리로 옮겨 갑니다(Move: 넘치지 않음).
  // 같은 이름의 항목이 같은 선입니다. 고리는 옮겨 가는 동안 화면의 두 선이 실제로 만나는 자리를 따라가고, 새로 생긴 엇갈림은 다 옮겨 간 뒤 한 번 튑니다.
  // 기간(labels)이나 카드 크기가 달라지면 옮겨 가지 않고 바로 그립니다. 재생하던 중이면 그 자리에서 마저 재생합니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('line-cross', (card, d, f) => {
    // 걸러서 남은 것이 없을 때(items나 labels가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if ((Array.isArray(d.items) && !d.items.length) || (Array.isArray(d.labels) && !d.labels.length)) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-lc-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], n = labels.length;
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (n < 2) throw new Error(tx(d, 'labels에 기간을 2개 이상 적으세요.'));
    if (list.length < 1 || list.length > 2) throw new Error(tx(d, 'items에 항목을 1~2개 적으세요.'));
    if (list.some((it) => !Array.isArray(it.values) || it.values.length !== n || it.values.some((v) => v != null && !fin(v)))) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    // 짚을 항목: 사용자가 눌러 고른 항목(카드 요소의 data-vzb-focus)이 있으면 그것, 없으면 focus, 그것도 없으면 첫 항목
    const picked = card.getAttribute('data-vzb-focus');
    let at = list.findIndex((it) => String(it.name) === picked);
    if (at < 0) at = list.findIndex((it) => String(it.name) === String(d.focus));
    const items = list.map((it, i) => ({ i, name: String(it.name), vals: it.values.map((v) => (fin(v) ? +v : null)), a: 1 }));
    const N = items.length, last = n - 1, all = items.flatMap((it) => it.vals.filter((v) => v != null));
    if (!all.length) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    let fo = items[Math.max(0, at)];
    const otherOf = (it) => items.find((x) => x !== it) || null;
    const whole = all.every(Number.isInteger);   // 값이 모두 정수면 선을 따라 세는 숫자도 정수로 적습니다
    // 세로 범위: 가장 작은 값과 큰 값에 범위의 25%씩 여유를 둡니다. 값이 모두 0 이상이면 0 밑으로 내려가지 않습니다.
    const vmin = Math.min(...all), vmax = Math.max(...all), R = vmax - vmin || Math.abs(vmax) * 0.2 || 1;
    const lo = vmin >= 0 ? Math.max(0, vmin - R * 0.25) : vmin - R * 0.25, hi = vmax + R * 0.25;
    // 선 끝: p(기간 순번, 소수는 기간 사이)까지 그었을 때 선 끝의 자리와 값. 기간 사이는 곧게 이어 읽고, 끊긴 뒤에는 마지막으로 그은 점입니다.
    const end = (arr, p) => {
      const K = Math.min(last, Math.floor(p + 1e-9));
      if (K < last && p > K && arr[K] != null && arr[K + 1] != null) return { p, v: arr[K] + (arr[K + 1] - arr[K]) * (p - K) };
      for (let k = K; k >= 0; k--) if (arr[k] != null) return { p: k, v: arr[k] };
      return null;
    };
    // 엇갈린 자리: 두 줄(값이나 화면의 높이)의 차이가 부호를 바꾸는 곳. p는 엇갈린 자리, to는 엇갈린 뒤 첫 기간입니다.
    // 같은 값으로 붙어 있다가 갈라지면 붙어 있던 구간의 가운데로 보고, 끊긴 기간을 건너서는 엇갈림으로 보지 않습니다.
    const crossings = (A, B) => {
      const out = [];
      let ps = 0, pk = -1;
      for (let k = 0; k < n; k++) {
        if (A[k] == null || B[k] == null) { ps = 0; continue; }
        const df = A[k] - B[k], sg = df > 0 ? 1 : df < 0 ? -1 : 0;
        if (!sg) continue;
        if (ps && sg !== ps) {
          const d0 = A[pk] - B[pk];
          out.push({ p: k - pk === 1 ? pk + d0 / (d0 - df) : (pk + k) / 2, to: k });
        }
        ps = sg; pk = k;
      }
      return out;
    };
    const vCross = N === 2 ? crossings(items[0].vals, items[1].vals) : [];
    const pillC = vCross.length ? vCross[vCross.length - 1] : null, pillTo = pillC ? pillC.to : -1;
    const pillText = pillC ? tx(d, '%s 역전', labels[pillTo]) : '';

    // 머리: 제목 · 부제, 그 아래 짚을 항목의 값과 다른 항목 대비 배지. 숫자는 선이 그어지는 동안 선 끝의 값을 따라 셉니다.
    head(card, d, f, null);
    const btn = el('button', 'vzb-lc-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-lc-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    card.querySelector('.vzb-hd').append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    const fig = el('div', 'vzb-fig'), numEl = el('div', 'vzb-num vzb-lc-num'), numT = document.createTextNode(''), unitEl = el('span', 'vzb-unit');
    const dl = el('span', 'vzb-delta'), bd = el('span', 'vzb-badge'), vs = el('span', 'vzb-vs');
    numEl.append(numT, unitEl);
    dl.append(bd, vs);
    fig.append(numEl, dl);
    card.append(fig);
    let figKey = null;
    function setFig(v, base, ot) {
      const [a, u] = v == null ? ['', ''] : f.parts(whole ? Math.round(v) : v);
      const dv = v != null && base != null && ot ? delta(f, v, base, d.better) : null;
      const key = `${a}|${u}|${dv ? `${dv.dir}|${dv.tone}|${dv.text}|${ot.name}` : ''}`;
      if (key === figKey) return;
      figKey = key;
      numT.nodeValue = a;
      unitEl.textContent = u;
      unitEl.style.display = u ? '' : 'none';
      dl.style.display = dv ? '' : 'none';
      if (!dv) return;
      bd.className = `vzb-badge vzb-${dv.tone}`;
      bd.replaceChildren(...(dv.dir ? [arrow(dv.dir), el('span', 'vzb-sr', tx(f, dv.dir > 0 ? '증가' : '감소'))] : []), dv.text);
      vs.textContent = tx(d, '%s 대비', ot.name);
    }

    const foot = el('div', 'vzb-foot vzb-fill vzb-lc');
    const plot = el('div', 'vzb-plot vzb-lc-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const svg = svgEl('svg', { class: 'vzb-lc-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    const say = el('span', 'vzb-sr');
    say.setAttribute('aria-live', 'polite');
    card.append(say);
    const describe = () => {
      const ot = otherOf(fo), a = end(fo.vals, last), b = ot && end(ot.vals, last);
      const text = a && b
        ? tx(d, '%1. %2 %3 %4, %5 %6. 좌우 화살표로 기간을 옮기고 Enter로 짚을 선을 바꿉니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', labels[last], fo.name, show(f, a.v), ot.name, show(f, b.v))
        : tx(d, '%1. %2 %3 %4. 좌우 화살표로 기간을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', labels[last], fo.name, a ? show(f, a.v) : tx(d, '데이터 없음'));
      plot.setAttribute('aria-label', pillText ? `${text} ${pillText}.` : text);
    };
    // 화면 낭독기용 표: 기간 · 항목별 값 · 차이
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '기간'), ...items.map((it) => it.name), ...(N === 2 ? [tx(d, '차이')] : [])].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    labels.forEach((name, k) => {
      const tr = el('tr'), vsK = items.map((it) => it.vals[k]);
      tr.append(el('th', null, name), ...vsK.map((v) => el('td', null, v == null ? tx(d, '데이터 없음') : show(f, v))));
      if (N === 2) tr.append(el('td', null, vsK[0] == null || vsK[1] == null ? '' : signed(f, vsK[0] - vsK[1])));
      table.append(tr);
    });
    sr.append(table);
    card.append(sr);

    // 그림: 가로 눈금선과 눈금 값 · 기간 이름 · 짚은 기간의 세로선 · 선 · 엇갈린 자리의 고리 · 알약과 이음선 · 선 끝 점과 이름
    const gridG = svgEl('g', {}), namesG = svgEl('g', {}), guide = svgEl('line', { class: 'vzb-lc-guide', opacity: 0 });
    const goneG = svgEl('g', {}), linesG = svgEl('g', {}), ringsG = svgEl('g', {}), noteG = svgEl('g', { class: 'vzb-lc-note', opacity: 0 }), topG = svgEl('g', {});
    const leader = svgEl('line', { class: 'vzb-lc-lead' }), pillG = svgEl('g', {}), pillBox = svgEl('path', { class: 'vzb-lc-pill' }), pillTx = svgText(0, 0, pillText, 'vzb-lc-pillt', 'middle');
    pillG.append(pillBox, pillTx);
    noteG.append(leader, pillG);
    const names = labels.map((name) => { const tn = svgText(0, 0, name, 'vzb-lc-name', 'middle'); namesG.append(tn); return tn; });
    items.forEach((it) => {
      it.g = svgEl('g', { class: 'vzb-lc-item' });
      it.path = svgEl('path', { class: 'vzb-lc-line' });
      it.dot = svgEl('circle', { class: 'vzb-lc-dot', r: 4, opacity: 0 });
      it.hd = svgEl('circle', { class: 'vzb-lc-head' });
      it.lab = svgText(0, 0, it.name, 'vzb-lc-lab', 'start');
      it.g.append(it.path, it.dot, it.hd, it.lab);
      it.lab.addEventListener('click', (e) => { e.stopPropagation(); setFocus(it); });
    });
    svg.append(gridG, namesG, guide, goneG, linesG, ringsG, noteG, topG);
    const rings = [];
    const ringAt = (i) => {
      if (!rings[i]) {
        rings[i] = { pulse: svgEl('circle', { class: 'vzb-lc-pulse' }), ring: svgEl('circle', { class: 'vzb-lc-ring' }) };
        ringsG.append(rings[i].pulse, rings[i].ring);
      }
      return rings[i];
    };
    // 짚을 항목의 선을 위에 그리고, 색 · 굵기 · 선 끝 점의 크기를 맞춥니다.
    const paint = () => {
      items.forEach((it) => {
        it.g.classList.toggle('is-focus', it === fo);
        it.hd.setAttribute('r', it === fo ? 5 : 4);
      });
      linesG.append(...items.filter((it) => it !== fo).map((it) => it.g), fo.g);
    };
    paint();
    describe();

    const fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 시간표(밀리초): 처음의 뜸(Lead) 뒤에 한 기간을 STEP에 긋고, 마지막으로 엇갈리는 자리에서 HOLD만큼 멈춥니다. 한 기간의 빠르기와 멈춤은 이 카드의 이야기 속도입니다.
    // 고리와 알약은 값이 아니므로 Pop으로 튀고, 이름은 Settle로 자리를 잡습니다. 선의 점은 값이라 Move로만 옮깁니다(넘치지 않음).
    const M = motion(card), [MK, MC] = M.pair('move'), [SK, SC] = M.pair('settle'), POP = M.curve('pop'), FADE = M.ms('fade') || 1;
    const T0 = M.ms('lead'), STEP = Math.max(70, Math.min(170, 1900 / last)), HOLD = pillC ? 420 : 0, TAIL = 260, FLASH = 700, NAMEH = 22, PILLH = 22, SEP = 20;
    const pc = pillC ? pillC.p : null, FULL = T0 + last * STEP + HOLD, TOTAL = FULL + TAIL;
    const pAt = (tt) => {
      const x = (tt - T0) / STEP;
      if (x <= 0) return 0;
      if (pc == null || x <= pc) return Math.min(last, x);
      return Math.min(last, Math.max(pc, x - HOLD / STEP));
    };
    const timeAt = (p) => T0 + p * STEP + (pc != null && p > pc ? HOLD : 0);
    const popAt = (age) => (age <= 0 ? 0 : age >= POP.dur ? 1 : POP.at(age));
    let W = 0, H = 0, GL = 0, PW = 1, y0 = 0, yT = 1, s = 1, hiC = hi, t = 0, pillW = 0, RPILL = 11, nowK = -2, hoverK = -1;
    const X = (p) => GL + (PW * p) / last, Y = (v) => y0 - (v - lo) * s;
    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 점마다 화면의 높이(sy, px)를, 머리의 숫자는 값(kv)을 같은 스프링(Move)으로 새 자리에 보냅니다.
    const fresh = new Set();
    let from = before(card), moving = false, flashT = FLASH, pillFresh = false, pillKept = true, gridA = 1, gone = [], labBusy = false;

    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      RPILL = Math.min(len(card, 'radius-mark', 11), PILLH / 2);
      const fam = getComputedStyle(card).fontFamily;
      y0 = h - NAMEH;
      // 알약이 놓일 위쪽 빈자리: 엇갈림이 있으면 가장 큰 값 위로 34px이 남도록 범위의 위 끝을 올립니다.
      const ph = Math.max(40, y0 - yT), room = Math.min(ph * 0.3, pillC ? PILLH + 12 : 8) / ph;
      hiC = Math.max(hi, (vmax - room * lo) / (1 - room));
      s = ph / (hiC - lo);
      // 눈금: 1 · 2 · 2.5 · 5로 끊어 두세 줄. 값이 0에서 시작하면 0도 적습니다.
      const span = hiC - lo, raw = span / (ph < 120 ? 2.4 : 3.4), mag = 10 ** Math.floor(Math.log10(raw));
      const st = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((x) => x >= raw * 0.999) || raw;
      const ticks = [];
      for (let i = Math.ceil((lo + (lo === 0 ? 0 : span * 0.03)) / st); i * st <= hiC - (pillC ? (PILLH + 6) / s : span * 0.06); i++) ticks.push(+(i * st).toPrecision(12));
      const tickText = (v) => { const [a, u] = f.parts(v); return (d.format && d.format !== 'count' ? withUnit(a, u) : a).replace(/(\d)\.0(?=\D*$)/, '$1'); };
      const texts = ticks.map(tickText);
      GL = texts.length ? Math.ceil(Math.max(...texts.map((x) => textW(x, 400, fam, 12)))) + 8 : 6;
      const GR = Math.ceil(Math.max(...items.map((it) => textW(it.name, 700, fam, 14)))) + 15;
      PW = Math.max(40, w - GL - GR);
      gridG.replaceChildren();
      ticks.forEach((v, i) => {
        const y = Math.round(Y(v)) + 0.5;
        gridG.append(svgEl('line', { class: 'vzb-lc-grid', x1: GL, x2: fx(GL + PW), y1: y, y2: y }), svgText(GL - 8, y + 4, texts[i], 'vzb-lc-tick', 'end'));
      });
      // 기간 이름: 다 들어가면 모두, 모자라면 몇 칸마다 하나씩(마지막 기간은 늘 적습니다)
      const slot = PW / last, nameW = Math.max(...labels.map((x) => textW(x, 700, fam, 12))) + 8, every = Math.max(1, Math.ceil(nameW / slot));
      names.forEach((tn, k) => {
        tn.setAttribute('x', fx(X(k)));
        tn.setAttribute('y', fx(y0 + 16));
        tn.setAttribute('opacity', (last - k) % every === 0 ? 1 : 0);
      });
      guide.setAttribute('y1', yT);
      guide.setAttribute('y2', y0);
      items.forEach((it) => { it.py = it.vals.map((v) => (v == null ? null : Y(v))); });
      pillW = pillText ? Math.ceil(textW(pillText, 700, fam, 12)) + 18 : 0;
      const hw = pillW / 2, r = Math.min(RPILL, hw);
      pillBox.setAttribute('d', `M${fx(-hw + r)},${-PILLH}H${fx(hw - r)}A${r},${r} 0 0 1 ${fx(hw)},${fx(-PILLH + r)}V${fx(-r)}A${r},${r} 0 0 1 ${fx(hw - r)},0H${fx(-hw + r)}A${r},${r} 0 0 1 ${fx(-hw)},${fx(-r)}V${fx(-PILLH + r)}A${r},${r} 0 0 1 ${fx(-hw + r)},${-PILLH}Z`);
      pillTx.setAttribute('y', -PILLH / 2 + 4);
      if (from) { begin(from); from = null; kick(); }
      render();
    }
    // 앞 장면에서 시작합니다. 같은 이름의 선은 점마다 있던 높이에서, 새 선은 제자리에서 나타나고, 빠진 선은 그 자리에 남겨 흐려지게 합니다.
    // 기간이나 카드 크기가 달라졌으면 옮겨 가지 않고, 앞 카드가 재생하던 중이었으면 그 자리에서 마저 재생합니다.
    function begin(prev) {
      if (!prev || !prev.inView || prev.W !== W || prev.H !== H || !Array.isArray(prev.items) || prev.labels !== labels.join('\n')) return;
      if (prev.p != null) { t = timeAt(prev.p); playing = true; seen = true; return; }
      const old = new Map(prev.items.map((q) => [q.name, q]));
      items.forEach((it) => {
        const q = old.get(it.name), e = end(it.vals, last);
        if (q) old.delete(it.name);
        it.sy = it.py.map((y, k) => (y == null ? null : q && q.ys[k] != null ? { x: q.ys[k], v: q.vs[k] || 0 } : { x: y, v: 0 }));
        it.kvTo = e ? e.v : null;
        it.kv = e ? { x: q && q.kv != null ? q.kv : e.v, v: q ? q.kvV || 0 : 0 } : null;
        it.a = q ? q.a : 0;
        if (q && q.ly != null) it.ly = { x: q.ly, v: q.lyV || 0 };
      });
      gone = [...old.values()].map((q) => {
        const g = { ys: q.ys, a: q.a, path: svgEl('path', { class: `vzb-lc-line vzb-lc-gone${q.focus ? ' is-focus' : ''}` }) };
        goneG.append(g.path);
        return g;
      });
      const was = new Set(prev.cross || []);
      vCross.forEach((c) => { if (!was.has(c.to)) fresh.add(c.to); });
      pillFresh = pillTo >= 0 && prev.pill !== pillTo;
      pillKept = !pillFresh;
      if (Math.abs(prev.lo - lo) > (hiC - lo) * 1e-6 || Math.abs(prev.hi - hiC) > (hiC - lo) * 1e-6) gridA = 0;   // 눈금이 달라졌으면 다 옮겨 간 뒤에 다시 긋습니다
      moving = true;
      flashT = FLASH;
      t = 1e9;
    }
    function settle() {
      moving = false;
      gone.forEach((g) => g.path.remove());
      gone = [];
      flashT = fresh.size || pillFresh ? 0 : FLASH;
    }
    function step(dt) {
      let busy = false;
      const go = (sp, to, span) => {
        springTo(sp, to, MK, MC, dt);
        if (Math.abs(sp.x - to) > span * 0.0006 || Math.abs(sp.v) > span * 0.01) busy = true; else { sp.x = to; sp.v = 0; }
      };
      items.forEach((it) => {
        it.sy.forEach((sp, k) => { if (sp) go(sp, it.py[k], H); });
        if (it.kv) go(it.kv, it.kvTo, hiC - lo);
        if (it.a < 1) { it.a = Math.min(1, it.a + dt / (FADE * 2)); busy = true; }
      });
      gone.forEach((g) => { g.a = Math.max(0, g.a - dt / FADE); if (g.a > 0) busy = true; });
      if (!busy) settle();
    }
    const pathTo = (ys, p) => {
      const K = Math.min(last, Math.floor(p + 1e-9));
      let out = '', pen = false;
      for (let k = 0; k <= K; k++) {
        if (ys[k] == null) { pen = false; continue; }
        out += `${pen ? 'L' : 'M'}${fx(X(k))},${fx(ys[k])}`;
        if (!pen && (k === last || ys[k + 1] == null)) out += 'h0';   // 앞뒤가 끊긴 기간은 점으로 남깁니다
        pen = true;
      }
      if (K < last && p > K && ys[K] != null && ys[K + 1] != null) out += `L${fx(X(p))},${fx(ys[K] + (ys[K + 1] - ys[K]) * (p - K))}`;
      return out;
    };
    // 선 끝의 이름: 선 끝 높이에 두되, 두 이름이 겹칠 만큼 가까우면 위아래로 벌립니다. 엇갈리면 자리를 바꿉니다(Settle).
    function stepLabels(dt) {
      labBusy = false;
      items.forEach((it) => {
        if (it.lt == null || !it.ly) return;
        springTo(it.ly, it.lt, SK, SC, dt);
        if (Math.abs(it.ly.x - it.lt) > 0.3 || Math.abs(it.ly.v) > 4) labBusy = true; else { it.ly.x = it.lt; it.ly.v = 0; }
      });
    }
    function render() {
      if (!W) return;
      const mv = moving, p = mv ? last : pAt(t);
      items.forEach((it) => {
        const ys = (it.ys = mv ? it.sy.map((sp) => (sp ? sp.x : null)) : it.py), e = (it.e = end(ys, p));
        it.path.setAttribute('d', pathTo(ys, p));
        it.g.setAttribute('opacity', fx(it.a));
        it.hd.setAttribute('opacity', e ? 1 : 0);
        it.lab.setAttribute('opacity', e ? 1 : 0);
        if (e) { it.hd.setAttribute('cx', fx(X(e.p))); it.hd.setAttribute('cy', fx(e.v)); it.lt = e.v; } else it.lt = null;
        if (hoverK >= 0 && ys[hoverK] != null) { it.dot.setAttribute('cx', fx(X(hoverK))); it.dot.setAttribute('cy', fx(ys[hoverK])); it.dot.setAttribute('opacity', 1); } else it.dot.setAttribute('opacity', 0);
      });
      gone.forEach((g) => { g.path.setAttribute('d', pathTo(g.ys, last)); g.path.setAttribute('opacity', fx(g.a)); });
      const [a, b] = items;
      if (b && a.e && b.e && Math.abs(a.e.v - b.e.v) < SEP) {
        const mid = (a.e.v + b.e.v) / 2, up = a.e.v < b.e.v || (a.e.v === b.e.v && a === fo) ? a : b, dn = up === a ? b : a;
        const c = Math.max(yT + 6 + SEP / 2, Math.min(y0 - 6 - SEP / 2, mid));
        up.lt = c - SEP / 2; dn.lt = c + SEP / 2;
      }
      items.forEach((it) => {
        if (it.lt == null) return;
        if (!it.ly) it.ly = { x: it.lt, v: 0 };
        it.lab.setAttribute('x', fx(X(it.e.p) + 10));
        it.lab.setAttribute('y', fx(it.ly.x + 5));
      });
      // 엇갈린 자리: 옮겨 가는 동안에는 화면의 두 선이 실제로 만나는 자리, 그 밖에는 값에서 구한 자리입니다. 선이 그 자리를 지난 뒤에 보입니다.
      const cs = !b ? [] : mv ? crossings(a.ys, b.ys) : vCross;
      let note = null;
      cs.forEach((c, i) => {
        const o = ringAt(i), e = end(a.ys, c.p), age = mv ? 1e9 : fresh.has(c.to) ? flashT : t - timeAt(c.p);
        const cx = X(c.p), cy = e ? e.v : 0, k = e ? popAt(age) : 0, u = age / 560;
        o.ring.setAttribute('cx', fx(cx)); o.ring.setAttribute('cy', fx(cy)); o.ring.setAttribute('r', fx(5 * k)); o.ring.setAttribute('opacity', k > 0 ? 1 : 0);
        o.pulse.setAttribute('cx', fx(cx)); o.pulse.setAttribute('cy', fx(cy)); o.pulse.setAttribute('r', fx(5 + 15 * clamp(u)));
        o.pulse.setAttribute('opacity', u > 0 && u < 1 ? fx(0.5 * (1 - u)) : 0);
        if (c.to === pillTo && e) note = { cx, cy, age: mv ? (pillKept ? 1e9 : -1) : pillFresh ? flashT : age };
      });
      for (let i = cs.length; i < rings.length; i++) { rings[i].ring.setAttribute('opacity', 0); rings[i].pulse.setAttribute('opacity', 0); }
      if (note && note.age > 0) {
        const k = popAt(note.age), px = Math.max(pillW / 2, Math.min(W - pillW / 2, note.cx)), top = yT + PILLH;
        noteG.setAttribute('opacity', fx(clamp(note.age / FADE)));
        pillG.setAttribute('transform', `translate(${fx(px)},${fx(top)}) scale(${k.toFixed(3)})`);
        leader.setAttribute('x1', fx(note.cx)); leader.setAttribute('x2', fx(note.cx));
        leader.setAttribute('y1', fx(top + 2)); leader.setAttribute('y2', fx(Math.max(top + 2, note.cy - 7)));
      } else noteG.setAttribute('opacity', 0);
      gridG.setAttribute('opacity', fx(gridA));
      // 머리의 숫자와 배지: 선 끝의 값을 그대로 셉니다. 숫자가 어느 기간의 값인지는 굵게 적은 기간 이름이 알려 줍니다.
      // 배지는 두 선 끝이 같은 기간에 있을 때만 적습니다(한쪽이 먼저 끊겼으면 다른 기간끼리 견주게 되므로 뺍니다).
      const ot = otherOf(fo), fe = end(fo.vals, p), oe = ot && end(ot.vals, p), same = fe && oe && fe.p === oe.p;
      setFig(mv ? fo.kv && fo.kv.x : fe && fe.v, same ? (mv ? ot.kv && ot.kv.x : oe.v) : null, ot);
      const nk = mv ? last : Math.min(last, Math.floor(p + 1e-6));
      if (nk !== nowK) { nowK = nk; names.forEach((tn, k) => tn.classList.toggle('is-now', k === nk)); }
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다.
    keep(card, () => {
      if (!W) return from;
      const mv = moving;
      return {
        inView, W, H, labels: labels.join('\n'), lo, hi: hiC, p: !mv && playing && t < FULL ? pAt(t) : null,
        cross: vCross.map((c) => c.to).filter((k) => !fresh.has(k)), pill: pillFresh ? -1 : pillTo,
        items: items.map((it) => {
          const e = end(it.vals, last);
          return {
            name: it.name, focus: it === fo, a: it.a, ys: mv ? it.sy.map((sp) => (sp ? sp.x : null)) : it.py.slice(), vs: mv ? it.sy.map((sp) => (sp ? sp.v : 0)) : [],
            kv: mv ? (it.kv ? it.kv.x : null) : e ? e.v : null, kvV: mv && it.kv ? it.kv.v : 0, ly: it.ly ? it.ly.x : null, lyV: it.ly ? it.ly.v : 0,
          };
        }),
      };
    });

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, stamp0 = 0, raf = 0;
    // 옮겨 가기와 그 뒤의 한 번 튐은 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const on = () => card.isConnected && inView && (moving || flashT < FLASH || gridA < 1 || labBusy || (playing && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { stamp0 = 0; return; }
      const dt = stamp0 ? Math.min(100, stamp - stamp0) : 16;
      stamp0 = stamp;
      if (moving) step(dt);
      else {
        if (flashT < FLASH) { flashT += dt; if (flashT >= FLASH) { fresh.clear(); pillFresh = false; } }
        if (gridA < 1) gridA = Math.min(1, gridA + dt / (FADE * 2));
        if (playing && !holds.size) {
          if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
          else { t = Math.min(TOTAL, t + dt); if (t >= TOTAL) { if (loop) rest = M.ms('rest'); else playing = false; } }
        }
      }
      stepLabels(dt);
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() {
      if (moving) settle();
      flashT = FLASH; fresh.clear(); pillFresh = false; gridA = 1;
      items.forEach((it) => { it.a = 1; it.ly = null; });
      t = 0; rest = 0; stamp0 = 0; playing = true;
      render();
      kick();
    }
    btn.addEventListener('click', play);
    // 짚을 항목 바꾸기: 색과 머리의 숫자가 그 항목으로 옮겨 갑니다. 고른 항목은 카드 요소에 적어 두어, 데이터가 바뀌어 다시 그려도 이어 갑니다.
    function setFocus(it) {
      if (!it || it === fo) return;
      fo = it;
      card.setAttribute('data-vzb-focus', it.name);
      paint();
      describe();
      say.textContent = tx(d, '%s 강조', it.name);
      render();
      if (api.at() >= 0) api.show(api.at());
      kick();
    }
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 기간을 짚으면 세로선과 두 선 위의 점으로 그 기간을 알리고, 두 항목의 값과 차이를 적습니다. 차이의 색은 머리의 배지와 같은 뜻입니다.
    const api = interact(plot, n,
      (cx) => Math.max(0, Math.min(last, Math.round(((cx - plot.getBoundingClientRect().left - GL) / PW) * last))),
      (k) => {
        const r = plot.getBoundingClientRect(), ot = otherOf(fo), a = fo.vals[k], b = ot ? ot.vals[k] : null;
        hoverK = k;
        guide.setAttribute('x1', fx(X(k)));
        guide.setAttribute('x2', fx(X(k)));
        guide.setAttribute('opacity', 1);
        names.forEach((tn, i) => tn.classList.toggle('is-on', i === k));
        render();
        const rows = [{ tone: 't1', value: a == null ? tx(d, '데이터 없음') : show(f, a), name: fo.name }];
        if (ot) rows.push({ tone: 't0', value: b == null ? tx(d, '데이터 없음') : show(f, b), name: ot.name });
        let note = null;
        if (ot && a != null && b != null) {
          const dv = delta(f, a, b, d.better);
          note = { text: `${signed(f, a - b)}${f.rel && b ? ` (${dv.text})` : ''} · ${tx(d, '%s 대비', ot.name)}`, tone: dv.tone === 'flat' ? null : dv.tone };
        }
        const tb = tipBody({ rows, note }, labels[k]);
        const ys = items.map((it) => it.ys && it.ys[k]).filter((y) => y != null);
        return { x: r.left + X(k), y: r.top + (ys.length ? ys.reduce((p, c) => p + c, 0) / ys.length : y0 / 2), label: labels[k], value: tb.node, text: tb.text, side: k > last / 2 ? 'left' : true };   // 오른쪽 절반에서는 왼쪽에 띄워 선 끝의 이름을 덮지 않습니다
      },
      () => { hoverK = -1; guide.setAttribute('opacity', 0); names.forEach((tn) => tn.classList.remove('is-on')); render(); });
    // 선 가까이를 누르면 그 선이, Enter나 스페이스를 누르면 다른 선이 짚을 항목이 됩니다.
    plot.addEventListener('click', (e) => {
      const k = api.at();
      if (k < 0 || N < 2) return;
      const y = e.clientY - plot.getBoundingClientRect().top;
      let best = null, gap = 26;
      items.forEach((it) => { const yy = it.ys && it.ys[k]; if (yy != null && Math.abs(yy - y) < gap) { gap = Math.abs(yy - y); best = it; } });
      setFocus(best);
    });
    plot.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && N === 2) { e.preventDefault(); setFocus(otherOf(fo)); } });

    if (live) t = 1e9;   // 마지막 장면에서 시작합니다(앞 장면을 받았으면 layout이 거기서 옮겨 가기를 시작합니다)
    if (from) inView = !!from.inView;   // 앞 카드가 화면에 보이고 있었으면 바로 움직입니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (!inView && (moving || flashT < FLASH)) { if (moving) settle(); flashT = FLASH; fresh.clear(); pillFresh = false; gridA = 1; render(); }   // 화면 밖에서는 옮겨 가기를 끝낸 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
