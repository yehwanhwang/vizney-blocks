  // Bar Overflow: 기간별(보통 월별) 값을 세로 막대로 세우고, 모든 기간에 같은 한도(limit, 예: 월 예산)를 가로선 하나로 긋습니다.
  // 선 아래는 회색, 선을 넘긴 구간만 빨강(--vzb-bad)입니다. 넘친 막대 위에는 넘친 양을 적고(칸이 모자라면 생략), 넘친 기간의 이름은 굵게 적습니다.
  // 아래 줄에는 넘친 기간 수와 넘친 양의 합을 카드가 계산해 적습니다. 비율 지표(pct)는 합을 적지 않습니다.
  // 움직임: 한도선이 먼저 그어져 있고, 막대가 왼쪽부터 하나씩 차오릅니다. 선을 넘는 순간부터 넘친 구간이 빨갛게 자라고,
  // 마지막 막대가 다 차면 넘친 구간만 세 번 깜빡이고 멈춥니다. 막대가 차기 전에는 막대 자리를 미리 그리지 않습니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 재생하지 않고, 화면에 있던 막대가 그 자리와 높이에서 새 값으로 옮겨 갑니다(Move: 넘치지 않음).
  // 같은 이름의 기간이 같은 막대입니다. 새로 생긴 기간은 바닥에서 자라고, 빠진 기간은 흐려지며 사라집니다.
  // 눈금(가장 큰 값)이 함께 바뀌어도 막대의 높이와 한도선은 화면에서 있던 자리에서 새 자리로 곧장 한 번에 갑니다. 값을 먼저 옮기고 눈금을 나중에 옮기면
  // 막대가 내려갔다가 다시 올라가 통통 튀어 보이기 때문입니다.
  // 옮겨 가는 동안 넘친 양과 아래 줄의 숫자는 화면의 막대를 그대로 세어 함께 바뀌고, 이번에 새로 한도를 넘은 막대만 다 옮겨 간 뒤 한 번 깜빡입니다.
  mount('bar-overflow', (card, d, f) => {
    // 걸러서 남은 기간이 없을 때(labels가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.labels) && !d.labels.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-bb-none', tx(d, '표시할 항목이 없습니다.')));
      keep(card, () => ({ inView: true, items: [] }));   // 빈 화면에서 다시 채워지면 막대가 바닥에서 자랍니다
      return;
    }
    // labels와 values는 같은 길이여야 합니다. 값이 null인 기간은 자리를 남기고 막대를 그리지 않습니다(기간을 빼면 시간 축이 어긋나기 때문입니다).
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], raw = Array.isArray(d.values) ? d.values : [];
    const seenName = {};
    const items = labels.map((name, k) => ({ k, name, key: `${name}\n${(seenName[name] = (seenName[name] || 0) + 1)}`, v: fin(raw[k]) ? Math.max(0, +raw[k]) : null }));
    const got = items.filter((it) => it.v != null);
    if (!got.length || raw.length !== labels.length) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    if (!fin(d.limit)) throw new Error(tx(d, 'limit에 한도를 숫자로 적으세요.'));
    const lim = Math.max(0, +d.limit), N = items.length;
    const limShow = show(f, lim).replace(/(\d)\.0(?=\D*$)/, '$1');   // 한도는 대개 딱 떨어지는 값이라 '$40.0K'를 '$40K'로 적습니다
    items.forEach((it) => { it.over = it.v == null ? 0 : Math.max(0, it.v - lim); });
    const label = d.limitLabel || tx(d, '한도');
    const inText = f.lang === 'en' ? label.toLowerCase() : label;   // 문장 안의 영어 이름은 소문자로
    const spill = items.filter((it) => it.over > 0);
    const sum = spill.reduce((a, it) => a + it.over, 0);
    const top = Math.max(lim, ...got.map((it) => it.v)) * 1.12 || 1;
    // 아래 줄: 넘친 기간 수와 넘친 양의 합. 옮겨 가는 동안에는 화면의 막대를 세어 적습니다.
    const sumOf = (n, total) => (!n ? tx(d, '모두 %s 이내', inText)
      : f.rel ? tx(d, '%1개 중 %2개 %3 초과 · +%4', got.length, n, inText, show(f, total))
        : tx(d, '%1개 중 %2개 %3 초과', got.length, n, inText));

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-bb');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. 항목 %2개 가운데 %3개가 %4 초과입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', got.length, spill.length, inText));
    const svg = svgEl('svg', { class: 'vzb-bb-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-bb-ctl'), btn = el('button', 'vzb-bb-btn'), sumEl = el('p', 'vzb-bb-sum');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-bb-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    let sumNow = null;
    const setSum = (n, total) => {
      const text = sumOf(n, total);
      if (text === sumNow) return;
      sumNow = text;
      sumEl.replaceChildren(...(n ? [el('i', 'vzb-bb-key')] : []), text);
    };
    setSum(spill.length, sum);
    ctl.append(sumEl);
    foot.append(plot, ctl);
    card.querySelector('.vzb-hd').append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    card.append(foot);
    // 화면 낭독기용 표: 기간 · 값 · 한도 · 차이
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '이름'), tx(d, '값'), label, tx(d, '차이')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), el('td', null, it.v == null ? tx(d, '데이터 없음') : show(f, it.v)), el('td', null, limShow), el('td', null, it.v == null ? '' : signed(f, it.v - lim))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 그림: 바닥선 · 막대(회색 아래, 빨강 위) · 기간 이름 · 넘친 양 · 한도선과 그 이름. 한도선은 막대 위에 그어 넘친 막대에서도 보이게 합니다.
    // 한도선의 이름과 값은 선의 오른쪽 끝, 막대 칸 밖에 늘 같은 자리로 붙입니다(이름은 선 위, 값은 선 아래). 막대 사이에서 빈자리를 찾아 옮겨 다니지 않게
    // 하기 위해서입니다. 그만큼 오른쪽에 자리(gut)를 비우고 막대는 그 왼쪽에 둡니다.
    const base = svgEl('line', { class: 'vzb-bb-base' }), goneG = svgEl('g', {}), barsG = svgEl('g', {}), limG = svgEl('g', { class: 'vzb-bb-limit' });
    const limLine = svgEl('line', { class: 'vzb-bb-line' }), limName = svgText(0, 0, label, 'vzb-bb-lim', 'start'), limVal = svgText(0, 0, limShow, 'vzb-bb-limv', 'start');
    limG.append(limLine, limName, limVal);
    items.forEach((it) => {
      it.g = svgEl('g', { class: 'vzb-bb-col' });
      it.fill = svgEl('path', { class: 'vzb-bb-fill' });
      it.red = svgEl('path', { class: 'vzb-bb-over' });
      it.nm = svgText(0, 0, it.name, 'vzb-bb-name', 'middle');
      it.ex = svgText(0, 0, signed(f, it.over), 'vzb-bb-ex', 'middle');
      it.g.append(it.fill, it.red, it.nm, it.ex);
      barsG.append(it.g);
    });
    svg.append(base, goneG, barsG, limG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 세로 막대: round가 참이면 위쪽 끝만 둥글게, 아니면 각지게(한도선에 닿는 끝). 모서리는 --vzb-radius-mark(비우면 4px)이고 layout에서 읽습니다.
    let RBAR = 4;
    const col = (x, yTop, w, yBottom, round) => {
      const h = yBottom - yTop;
      if (h < 0.5) return '';
      const r = round ? Math.min(RBAR, w / 2, h) : 0;
      return `M${fx(x)},${fx(yBottom)}V${fx(yTop + r)}A${r},${r} 0 0 1 ${fx(x + r)},${fx(yTop)}H${fx(x + w - r)}A${r},${r} 0 0 1 ${fx(x + w)},${fx(yTop + r)}V${fx(yBottom)}Z`;
    };
    // 시간표(밀리초): 한도선만 보이는 처음 · 막대 사이 간격 · 한 막대가 차는 시간 · 다 찬 뒤 쉬는 시간 · 깜빡임 한 번 · 깜빡이는 횟수
    // 처음의 뜸(Lead) · 차례의 전체 시간(Seq) · 되풀이 전의 쉼(Rest)과, 막대가 값으로 가는 움직임(Move: 넘치지 않음)은 움직임 값에서 읽습니다.
    const M = motion(card), MOVE = M.curve('move');
    const T0 = M.ms('lead'), STAG = Math.max(60, Math.min(140, M.ms('seq') / N)), DUR = MOVE.dur, WAIT = 260, BLINK = 440, TIMES = 3, GAP = 1.5, NAMEH = 22;
    let W = 0, H = 0, PW = 0, y0 = 0, s = 1, bw = 0, slot = 1, yl = 0, t = 0, FULL = 0, TOTAL = 0;
    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 막대의 높이(sh, px)와 한도선의 높이(sly, px), 막대의 자리(sx)와 굵기(sw)를 스프링(Move)으로 새 자리에 보냅니다.
    // 높이는 화면의 자리(px)로 옮기므로, 눈금이 함께 바뀌어도 막대와 한도선은 있던 자리와 새 자리 사이를 한 방향으로만 움직입니다.
    // 옮겨 가는 동안의 값은 그림에서 읽습니다: 한도선의 높이가 한도의 값(slv)이므로, 막대의 높이를 그 비율로 값으로 바꿉니다.
    // 막대의 자리는 막대 칸 폭(PW)에 대한 비율이라 카드 폭이 달라져도 이어집니다.
    const [MK, MC] = M.pair('move'), FADE = M.ms('fade') || 1, fresh = new Set();
    let from = before(card), moving = false, flash = BLINK, sly = null, slv = null, sw = null, gone = [];
    function layout(w, h) {
      W = w; H = h;
      RBAR = len(card, 'radius-mark', 4);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      y0 = h - NAMEH;
      s = Math.max(1, y0 - 4) / top;
      // 오른쪽 자리: 한도선 이름(12px)과 값(14px 굵게) 가운데 넓은 쪽에 선과의 틈 6px. 막대는 그 왼쪽(PW)에 둡니다.
      const gut = Math.ceil(Math.max(textW(label, 500, fam, 12), textW(limShow, 700, fam, 14))) + 8;
      PW = Math.max(w * 0.6, w - gut);
      slot = PW / N;
      bw = Math.max(4, Math.min(30, slot * 0.62));
      yl = y0 - lim * s;
      base.setAttribute('x1', 0);
      base.setAttribute('x2', fx(PW));
      base.setAttribute('y1', y0 + 0.5);
      base.setAttribute('y2', y0 + 0.5);
      limLine.setAttribute('x1', 0);
      limLine.setAttribute('x2', fx(PW + 2));
      // 기간 이름: 다 들어가면 모두, 모자라면 몇 칸마다 하나씩(마지막 칸은 늘 적습니다)
      const nameW = Math.max(...items.map((it) => textW(it.name, 400, fam, 12))) + 6;
      const every = Math.max(1, Math.ceil(nameW / slot));
      // 넘친 양: 14px로 적고, 이웃한 넘친 양끼리 겹치면 12px로 내립니다. 12px로도 겹치면 넘친 양이 큰 막대부터 자리를 잡고,
      // 자리를 못 잡은 막대만 적지 않습니다(그 막대는 툴팁이 넘친 양을 적고, 합은 요약 줄에 남습니다).
      // 글자는 제 칸 밖으로 나가도 되지만 그림 밖으로는 나가지 않게 안쪽으로 당깁니다.
      const spot = (it, size) => {
        const lw = textW(it.ex.textContent, 700, fam, size) + 4, cx = slot * (it.k + 0.5);
        it.exW = lw;
        it.exX = Math.max(lw / 2, Math.min(PW - lw / 2, cx));
      };
      const clear = (list) => list.every((it, k) => !k || it.exX - it.exW / 2 >= list[k - 1].exX + list[k - 1].exW / 2 + 4);
      let exSize = 14;
      spill.forEach((it) => spot(it, 14));
      if (!clear(spill)) { exSize = 12; spill.forEach((it) => spot(it, 12)); }
      const shown = new Set(spill);
      if (!clear(spill)) {
        shown.clear();
        [...spill].sort((a, b) => b.over - a.over).forEach((it) => {
          const near = [...shown, it].sort((a, b) => a.k - b.k);
          if (clear(near)) shown.add(it);
        });
      }
      items.forEach((it) => {
        it.cx = slot * (it.k + 0.5);
        it.x = it.cx - bw / 2;
        it.yv = y0 - (it.v || 0) * s;
        it.nm.setAttribute('y', fx(y0 + 15));
        it.nm.setAttribute('opacity', (N - 1 - it.k) % every === 0 ? 1 : 0);
        it.exOn = shown.has(it);
        it.exDx = it.exOn ? it.exX - it.cx : 0;   // 넘친 양의 글자가 막대 가운데에서 비켜난 만큼
        it.ex.style.fontSize = exSize === 12 ? '12px' : '';
        it.start = T0 + it.k * STAG;
      });
      // 한도선의 이름(위)과 값(아래)은 선 끝에서 6px 띄워 선을 가운데로 위아래에 둡니다(높이는 render가 한도선과 함께 잡습니다).
      limName.setAttribute('x', fx(PW + 8));
      limVal.setAttribute('x', fx(PW + 8));
      FULL = T0 + (N - 1) * STAG + DUR;
      TOTAL = FULL + (spill.length ? WAIT + BLINK * TIMES : 240);
      if (from) { begin(from); from = null; kick(); }
      render();
    }
    // 앞 장면에서 시작합니다. 같은 이름의 막대는 그 자리와 높이에서, 새 막대는 제자리의 바닥에서 출발하고, 빠진 막대는 그 자리에 남겨 흐려지게 합니다.
    function begin(prev) {
      if (!prev || !prev.inView || !Array.isArray(prev.items)) return;
      const old = new Map(prev.items.map((p) => [p.key, p]));
      items.forEach((it) => {
        const p = it.v == null ? null : old.get(it.key);
        if (p) old.delete(it.key);
        it.sh = { x: p ? p.h : 0, v: p ? p.hv : 0 };
        it.sx = { x: p ? p.x : it.cx / PW, v: p ? p.xv : 0 };
        it.exA = p ? p.exA : 0;
        if (it.over > 0 && (!p || !p.over || p.fresh)) fresh.add(it);
      });
      const had = prev.lpx > 0;
      sly = { x: had ? prev.lpx : lim * s, v: had ? prev.lpxV || 0 : 0 };
      slv = { x: had ? prev.lim : lim, v: had ? prev.limV || 0 : 0 };
      sw = { x: prev.bw > 0 ? prev.bw : bw, v: 0 };
      gone = [...old.values()].map((p) => {
        const g = { h: p.h, x: p.x, a: p.a == null ? 1 : p.a, g: svgEl('g', { class: 'vzb-bb-col' }), fill: svgEl('path', { class: 'vzb-bb-fill' }), red: svgEl('path', { class: 'vzb-bb-over' }), nm: svgText(0, 0, p.name, 'vzb-bb-name', 'middle') };
        g.nm.setAttribute('opacity', p.nameOn ? 1 : 0);
        g.g.append(g.fill, g.red, g.nm);
        goneG.append(g.g);
        return g;
      });
      moving = true;
      flash = BLINK;
      t = 1e9;
    }
    function settle() {
      moving = false;
      gone.forEach((g) => g.g.remove());
      gone = [];
      flash = fresh.size ? 0 : BLINK;
    }
    // 스프링을 dt만큼 옮기고, 모두 제자리에 닿았으면 끝냅니다.
    function step(dt) {
      let busy = false;
      const go = (sp, to, span) => {
        springTo(sp, to, MK, MC, dt);
        if (Math.abs(sp.x - to) > span * 0.0006 || Math.abs(sp.v) > span * 0.01) busy = true; else { sp.x = to; sp.v = 0; }
      };
      const hh = Math.max(1, y0);
      go(sly, lim * s, hh);
      go(slv, lim, top);
      go(sw, bw, 30);
      items.forEach((it) => {
        if (it.v == null) return;
        go(it.sh, it.v * s, hh);
        go(it.sx, it.cx / PW, 1);
      });
      gone.forEach((g) => { g.a = Math.max(0, g.a - dt / FADE); if (g.a > 0) busy = true; });
      const fadeBy = dt / FADE;
      items.forEach((it) => {
        const to = it.exOn && it.sh && it.sh.x > sly.x ? 1 : 0;
        if (it.exA !== to) { it.exA = to > it.exA ? Math.min(1, it.exA + fadeBy) : Math.max(0, it.exA - fadeBy); busy = true; }
      });
      if (!busy) settle();
    }
    function render() {
      if (!W) return;
      const mv = moving;
      const ylC = mv ? y0 - sly.x : yl, bwC = mv ? sw.x : bw;
      const unit = mv && sly.x > 0.5 ? slv.x / sly.x : 0;   // 옮겨 가는 동안 1px이 나타내는 값(한도선의 높이가 한도의 값)
      limLine.setAttribute('y1', fx(ylC));
      limLine.setAttribute('y2', fx(ylC));
      limName.setAttribute('y', fx(ylC - 4));
      limVal.setAttribute('y', fx(ylC + 15));
      // 깜빡임: 다 찬 뒤 넘친 구간만 옅어졌다 돌아오기를 되풀이하고, 진한 상태로 끝납니다. 멈춰서 값을 읽는 동안은 진하게 둡니다.
      // 옮겨 간 뒤에는 이번에 새로 한도를 넘은 막대만 한 번 깜빡입니다.
      const b = (t - FULL - WAIT) / BLINK, wave = (x) => 1 - 0.84 * (0.5 - 0.5 * Math.cos(2 * Math.PI * x));
      const glow = b <= 0 || b >= TIMES || holds.size ? 1 : wave(b);
      const glow2 = mv || flash >= BLINK || holds.size ? 1 : wave(flash / BLINK);
      const alert = t >= FULL + WAIT;
      let cnt = 0, tot = 0;
      // 막대 하나(yv: 막대 끝의 자리): 한도에 닿은 막대는 한도선 아래에서 각지게 끊고, 넘친 만큼은 선 위에서 빨강으로 잇습니다.
      const bar = (o, cx, yv, hit) => {
        const x = cx - bwC / 2, cut = hit && yv <= ylC + GAP;
        o.fill.setAttribute('d', col(x, cut ? ylC + GAP : yv, bwC, y0, !cut));
        o.red.setAttribute('d', hit && yv < ylC - GAP ? col(x, yv, bwC, ylC - GAP, true) : '');
      };
      gone.forEach((g) => {
        bar(g, g.x * PW, y0 - g.h, g.h >= sly.x && sly.x > 0);
        g.nm.setAttribute('x', fx(g.x * PW));
        g.nm.setAttribute('y', fx(y0 + 15));
        g.g.setAttribute('opacity', fx(g.a));
      });
      items.forEach((it) => {
        const cx = mv ? it.sx.x * PW : it.cx;
        it.nm.setAttribute('x', fx(cx));
        if (it.v == null) { it.fill.setAttribute('d', ''); it.red.setAttribute('d', ''); it.ex.setAttribute('opacity', 0); return; }
        const h = mv ? Math.max(0, it.sh.x) : it.v * clamp(MOVE.at(t - it.start)) * s, yv = y0 - h;
        bar(it, cx, yv, mv ? h >= sly.x : it.v >= lim);
        const overNow = mv ? Math.max(0, (h - sly.x) * unit) : it.over;
        if (mv && overNow > 0) { cnt++; tot += overNow; }
        it.red.setAttribute('opacity', fx(fresh.has(it) && !mv ? Math.min(glow, glow2) : glow));
        const exText = signed(f, overNow);
        if (it.exT !== exText) { it.exT = exText; it.ex.textContent = exText; }
        it.ex.setAttribute('x', fx(cx + (it.exDx || 0)));
        it.ex.setAttribute('y', fx(yv - 5));
        it.ex.setAttribute('opacity', mv ? fx(it.exA) : it.exOn ? fx(clamp((t - it.start - DUR) / 200)) : 0);
        it.g.classList.toggle('is-over', mv ? overNow > 0 : it.over > 0 && alert);
      });
      if (mv) setSum(cnt, tot); else setSum(spill.length, sum);
      sumEl.style.opacity = mv ? 1 : fx(clamp((t - (spill.length ? FULL + WAIT : FULL)) / 240));
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다. 아직 그리기 전이면 받은 장면을 그대로 넘깁니다.
    keep(card, () => {
      if (!W) return from;
      const mv = moving;
      return {
        inView, lpx: mv ? sly.x : lim * s, lpxV: mv ? sly.v : 0, lim: mv ? slv.x : lim, limV: mv ? slv.v : 0, bw: mv ? sw.x : bw,
        items: items.filter((it) => it.v != null).map((it) => ({
          key: it.key, name: it.name, nameOn: it.nm.getAttribute('opacity') === '1',
          h: mv ? Math.max(0, it.sh.x) : it.v * clamp(MOVE.at(t - it.start)) * s, hv: mv ? it.sh.v : 0,
          x: mv ? it.sx.x : it.cx / PW, xv: mv ? it.sx.v : 0,
          exA: mv ? it.exA : it.exOn ? clamp((t - it.start - DUR) / 200) : 0,
          over: it.over > 0, fresh: fresh.has(it) && (mv || flash < BLINK),
        })).concat(gone.map((g) => ({ key: `\n${g.x}`, name: g.nm.textContent, nameOn: g.nm.getAttribute('opacity') === '1', h: g.h, hv: 0, x: g.x, xv: 0, exA: 0, over: false, fresh: false, a: g.a }))),
      };
    });

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않습니다
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    // 옮겨 가기와 그 뒤의 한 번 깜빡임은 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const on = () => card.isConnected && inView && (moving || flash < BLINK || (playing && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { last = 0; return; }
      const dt = last ? Math.min(100, stamp - last) : 16;
      last = stamp;
      if (moving) step(dt);
      else if (flash < BLINK) { flash += dt; if (flash >= BLINK) fresh.clear(); }
      else if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = M.ms('rest'); else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { if (moving) settle(); flash = BLINK; fresh.clear(); t = 0; rest = 0; last = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 막대를 짚으면 값, 한도, 넘치거나 남은 양과 한도 대비 비율을 보여 주고 그 막대만 진하게 남깁니다.
    // 넘친 양의 글자는 숨기지 않고 그대로 두며(숫자가 사라지면 오류처럼 보이므로), 그 글자가 보이는 막대는 툴팁에 넘친 양을 되풀이하지 않습니다.
    interact(plot, N,
      (cx) => Math.max(0, Math.min(N - 1, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (k) => {
        const it = items[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        items.forEach((x) => x.g.classList.toggle('is-on', x === it));
        const note = [`${label} ${limShow}`];
        if (it.v != null) {
          const gap = show(f, Math.abs(it.v - lim)), share = lim > 0 ? num((it.v / lim) * 100, 0) : null;
          // 한도를 넘친 줄은 막대의 넘친 부분과 같은 빨강으로 적습니다.
          if (share == null) note.push({ text: tx(d, '%s 초과|한도', gap), tone: it.v > lim ? 'alert' : null });
          else if (it.v > lim && it.exOn) note.push({ text: tx(d, '%1의 %2', inText, `${share}%`), tone: 'alert' });
          else note.push(it.v > lim ? { text: tx(d, '%1 초과 · %2의 %3%', gap, inText, share), tone: 'alert' } : it.v < lim ? tx(d, '%1 남음 · %2의 %3%', gap, inText, share) : tx(d, '%1의 %2', inText, `${share}%`));
        }
        const tb = tipBody({ value: it.v == null ? tx(d, '데이터 없음') : show(f, it.v), note }, it.name);
        return { x: r.left + it.cx, y: r.top + Math.min(it.yv, yl) - 6, label: it.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); items.forEach((x) => x.g.classList.remove('is-on')); },
      false, true);

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
        if (!inView && (moving || flash < BLINK)) { if (moving) settle(); flash = BLINK; fresh.clear(); render(); }   // 화면 밖에서는 옮겨 가기를 끝낸 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
