  // Waterfall Walk: 첫 항목의 값에서 출발해 항목(items)마다의 증감(value)을 앞 칸이 끝난 높이에 이어 붙이고, total로 표시한 항목에는 그때까지의 누계를
  // 카드가 계산해 합계 막대로 세웁니다(예: 매출액 → 매출원가 · 판관비 → 영업이익 → 영업외손익 · 법인세 → 당기순이익).
  // 합계 막대(첫 항목과 total 항목)는 바닥(0)에서 서는 글자색(--vzb-ink)입니다. 증감 칸은 앞 칸에서 넘어온 금액 가운데 남는 부분을 옅은 회색(--vzb-track)으로
  // 깔고, 그 위 끝에 늘거나 준 만큼을 색 면으로 얹습니다. 색은 결과를 좋게 만든 쪽이 초록(--vzb-good), 나쁘게 만든 쪽이 빨강(--vzb-bad)이고
  // (better: up · down), neutral이면 모두 첫째 데이터 색입니다. 그래서 칸의 위 끝은 앞 칸이 끝난 높이와, 회색의 위 끝은 다음 칸이 시작할 높이와 맞닿습니다
  // (칸 사이를 잇는 선은 없습니다). 색 면 안에는 움직인 방향을 꺾쇠(∨ · ∧)로 그려 색 없이도 읽히게 합니다.
  // 값은 칸 위에 적고(증감에는 부호), 이웃 값과 겹치면 작은 증감부터 생략합니다(툴팁과 표에는 남습니다). 이름이 칸보다 길면 두 줄로 엇갈려 적습니다.
  // 큰 숫자는 마지막 항목까지의 누계이고, 그 옆에 첫 항목의 몇 %인지(compare: change면 첫 항목 대비 증감 배지)를 적습니다.
  // 움직임: 첫 막대와 큰 숫자가 놓여 있다가 왼쪽부터 한 칸씩, ① 앞 칸에 남은 금액이 옆 칸으로 넘어오고 ② 증감 칸은 그 위 끝에서 준 만큼 깎여 내려가거나
  // 는 만큼 올라가며 큰 숫자가 함께 바뀌고 ③ 합계 칸은 넘어온 금액이 위에서부터 글자색으로 굳습니다. 마지막 칸 뒤에 비율(배지)이 붙고 멈춥니다.
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
    // 칸: 첫 항목과 total 항목은 바닥에서 서는 합계(0 → 누계)이고, 나머지는 앞 칸이 끝난 높이(from)에서 증감만큼 움직입니다(to).
    // 값이 null인 항목은 자리만 두고 높이를 그대로 넘깁니다.
    let level = 0;
    const cols = src.map((it, k) => {
      const total = k > 0 && it.total === true, v = total ? null : fin(it.value) ? +it.value : null, from = level;
      if (v != null) level += v;
      const kind = k === 0 || total ? 'total' : 'step', moved = kind === 'step' && v != null && v !== 0;
      return { k, name: String(it.name), kind, v, from: kind === 'total' ? 0 : from, to: level,
        tone: kind === 'total' ? 'total' : !moved ? 'none' : want === 0 ? 'plain' : Math.sign(v) === want ? 'good' : 'bad' };
    });
    const N = cols.length, first = cols[0], last = cols[N - 1], v0 = first.to, v1 = last.to;
    cols.forEach((c) => { c.prev = cols[c.k - 1] || c; });
    const pct = (v) => `${v < 0 ? '−' : ''}${num(Math.abs(v / v0) * 100, 1)}%`;   // 첫 항목의 몇 %인지

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 큰 숫자: 마지막 항목까지의 누계. 움직이는 동안은 지금 보이는 높이를 그대로 세고, 마지막 칸이 끝나면 옆에 비율이나 증감 배지가 붙습니다.
    // 비율: 첫 항목의 몇 %인지(손익이면 매출액 대비 이익률). compare가 change면 첫 항목 대비 증감 배지를 답니다(시작 값이 0 이하이면 차이를 적습니다).
    const fig = el('div', 'vzb-fig vzb-ww-fig'), numEl = figure(f, live ? v1 : v0), nowText = numEl.firstChild, after = [];
    let unitEl = numEl.querySelector('.vzb-unit');
    if (N > 1 && d.compare === 'change') {
      const bd = badge(f, v1, v0, d.better);
      if (!(v0 > 0)) bd.lastChild.textContent = show(f, Math.abs(v1 - v0));
      after.push(bd, el('span', 'vzb-vs', tx(d, '%s 대비', first.name)));
    } else if (N > 1 && v0 > 0) {
      const share = el('span', 'vzb-vs'), [a, b] = tx(d, '%1의 %2', first.name, '\u0001').split('\u0001');
      share.append(a, el('b', null, pct(v1)), b);
      after.push(share);
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

    // 그림: 바닥선(0)과 칸. 칸마다 둥근 윤곽(clip) 안에 남는 금액(회색)과 색 면(증감)이나 합계 면을 그리고, 그 위에 꺾쇠 · 값 · 이름을 둡니다.
    // 윤곽의 id는 카드마다 새로 지어, 같은 카드 두 장이 한 페이지에 있어도 겹치지 않습니다.
    const uid = Math.random().toString(36).slice(2, 8);
    const base = svgEl('line', { class: 'vzb-ww-base' }), colsG = svgEl('g', {});
    cols.forEach((c) => {
      const cid = `vzb-ww-${uid}-${c.k}`, cp = svgEl('clipPath', {});
      cp.setAttribute('id', cid);
      c.g = svgEl('g', { class: `vzb-ww-col is-${c.tone}` });
      c.clip = svgEl('rect', {});
      cp.append(c.clip);
      c.body = svgEl('g', { 'clip-path': `url(#${cid})` });
      c.ghost = svgEl('rect', { class: 'vzb-ww-ghost' });
      c.bar = svgEl('rect', { class: 'vzb-ww-bar' });
      c.body.append(c.ghost, c.bar);
      c.mark = svgEl('path', { class: 'vzb-ww-mark' });
      c.val = svgText(0, 0, valText(c), 'vzb-ww-val', 'middle');
      c.nm = svgText(0, 0, c.name, 'vzb-ww-name', 'middle');
      c.g.append(cp, c.body, c.mark, c.val, c.nm);
      // 합계 막대 안의 비율(첫 항목의 몇 %인지): 큰 숫자 옆에 비율을 적는 카드에서, 첫 항목 뒤의 합계에만 둡니다.
      if (c.kind === 'total' && c.k && v0 > 0 && d.compare !== 'change') { c.rt = svgText(0, 0, pct(c.to), 'vzb-ww-ratio', 'middle'); c.g.append(c.rt); }
    });
    // 앞 칸이 위에 오도록 뒤 칸부터 놓습니다. 옆 칸으로 넘어가는 금액이 앞 칸의 뒤에서 나옵니다.
    [...cols].reverse().forEach((c) => colsG.append(c.g));
    svg.append(base, colsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    // 이름을 maxW 안에 줄여 적습니다(끝에 …). 툴팁과 표에는 온전한 이름이 있습니다.
    const fit = (s, weight, maxW) => {
      if (textW(s, weight, fam, 11) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, weight, fam, 11) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };
    // 시간표(밀리초): 첫 막대를 읽는 시간 T0, 한 칸에 쓰는 시간 STEP = 옆 칸으로 넘어오기 CARRY + 깎이거나 굳기 MAIN + 쉼, 비율이 붙는 시간 BADGE
    const T0 = 500, STEP = N > 1 ? Math.max(380, Math.min(600, 3300 / (N - 1))) : 0, CARRY = Math.round(STEP * 0.32), MAIN = Math.max(1, STEP - CARRY - 40), BADGE = 240, GAP = 2;
    const easeOut = (k) => 1 - (1 - k) ** 3, easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    cols.forEach((c) => { c.at = c.k ? T0 + (c.k - 1) * STEP : -1e9; c.done = c.k ? c.at + CARRY + MAIN : 0; });
    const DONE = last.done, TOTAL = DONE + 60 + BADGE;
    let W = 0, H = 0, y = (v) => v, slot = 1, bw = 0, R = 0, t = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      slot = w / N;
      bw = Math.min(60, slot * 0.62);          // 칸의 62%, 60px까지
      R = Math.min(8, bw * 0.22);              // 바닥에서 먼 끝의 둥글기
      const tight = slot < 46, vsz = tight ? 10 : 11;   // 칸이 좁으면 값을 10px로 적습니다
      svg.classList.toggle('is-tight', tight);
      // 이름: 한 줄에 다 들어가면 한 줄, 아니면 두 줄로 엇갈려(이웃 칸까지 써서) 적고, 그래도 넘치면 줄여 적습니다.
      // 엇갈린 줄에서는 같은 줄의 이웃(두 칸 옆) 이름이 쓰고 남은 자리까지 쓰고, 양 끝 이름은 카드 여백으로 12px까지 넘어갑니다.
      const wOf = (c) => (c.kind === 'total' ? 500 : 400), nw = cols.map((c) => textW(c.name, wOf(c), fam, 11));
      const two = Math.max(...nw) + 6 > slot, NAMEH = two ? 36 : 22;
      const side = (j) => (cols[j] ? 2 * slot - Math.min(nw[j], 2 * slot - 6) / 2 - 6 : Infinity);
      const roomOf = (c) => (two ? 2 * Math.min(side(c.k - 2), side(c.k + 2), Math.min(slot * (c.k + 0.5), w - slot * (c.k + 0.5)) + 12) : slot - 6);
      // 높이: 0과 모든 칸의 양 끝이 들어가게 하고, 위에 값을 적을 자리를 남깁니다. 0 아래로 내려가는 칸이 있으면 아래에도 남깁니다.
      const lvls = [0, ...cols.flatMap((c) => [c.from, c.to])], lo = Math.min(...lvls), hi = Math.max(...lvls), span = hi - lo || 1;
      const PADT = 18, PADB = lo < 0 ? 18 : 0, yb = h - NAMEH, s = Math.max(1, yb - PADT - PADB) / span;
      y = (v) => PADT + (hi - v) * s;
      const y0 = y(0);
      base.setAttribute('x1', 0);
      base.setAttribute('x2', w);
      base.setAttribute('y1', fx(Math.round(y0) + 0.5));
      base.setAttribute('y2', fx(Math.round(y0) + 0.5));
      cols.forEach((c) => {
        c.cx = slot * (c.k + 0.5);
        c.x = c.cx - bw / 2;
        c.topY = y(Math.max(0, c.from, c.to));   // 다 그린 칸의 위 끝과 아래 끝
        c.botY = y(Math.min(0, c.from, c.to));
        c.nm.textContent = fit(c.name, wOf(c), roomOf(c));
        c.nm.setAttribute('x', fx(c.cx));
        c.nm.setAttribute('y', fx(yb + 15 + (two && c.k % 2 ? 14 : 0)));
        // 값: 칸 위에 적습니다. 칸이 모두 0 아래에 있으면 칸 아래에 적습니다.
        c.up = c.topY < y0 - 0.5 || c.botY <= y0 + 0.5;
        const tw = textW(c.val.textContent, c.kind === 'step' ? 500 : 700, fam, vsz) + 3;
        c.vx = Math.max(tw / 2, Math.min(w - tw / 2, c.cx));
        c.vy = c.up ? c.topY - 6 : c.botY + (tight ? 13 : 14);
        c.box = [c.vx - tw / 2, c.vx + tw / 2, c.vy - 10, c.vy + 3];
        c.val.setAttribute('x', fx(c.vx));
        // 합계 막대 안의 비율: 막대가 글자보다 넉넉히 클 때만 가운데에 적습니다.
        if (c.rt) {
          c.rtOn = c.botY - c.topY >= 20 && bw >= textW(c.rt.textContent, 500, fam, vsz) + 8;
          c.rt.setAttribute('x', fx(c.cx));
          c.rt.setAttribute('y', fx((c.topY + c.botY) / 2 + 4));
        }
      });
      // 값이 이웃 값이나 이웃 칸과 겹치면 한 줄 올려 적고(아래에 적는 값은 내려 적고), 그래도 겹치면 생략합니다. 합계부터, 그다음 큰 증감부터 자리를 잡습니다.
      const placed = [];
      const hit = (c, b) => placed.some(([l, r, tp, bt]) => b[0] < r && b[1] > l && b[2] < bt && b[3] > tp) || cols.some((o) => o !== c && b[0] < o.x + bw && b[1] > o.x && b[2] < o.botY && b[3] > o.topY);
      [...cols].sort((a, b) => (a.kind === 'step') - (b.kind === 'step') || Math.abs(b.v || 0) - Math.abs(a.v || 0)).forEach((c) => {
        c.valOn = c.kind === 'total' || c.v != null;
        if (!c.valOn) return;
        let box = c.box, vy = c.vy;
        if (hit(c, box)) { const dy = c.up ? -13 : 13; box = [box[0], box[1], box[2] + dy, box[3] + dy]; vy += dy; }
        if (hit(c, box)) { c.valOn = false; return; }
        placed.push(box);
        c.val.setAttribute('y', fx(vy));
      });
      render();
    }
    // 한 칸의 진행: carry는 앞 칸에 남은 금액이 이 칸으로 넘어온 정도, main은 증감 칸이 깎이거나 올라간 정도(합계 칸은 굳은 정도)입니다.
    const phase = (c) => (c.k ? [easeInOut(clamp((t - c.at) / Math.max(1, CARRY))), (c.kind === 'total' ? easeInOut : easeOut)(clamp((t - c.at - CARRY) / MAIN))] : [1, 1]);
    // 지금 보이는 높이(큰 숫자): 출발한 증감 칸 가운데 마지막 칸이 지금 닿은 높이입니다. 합계 칸이 굳는 동안은 그 높이 그대로입니다.
    function shown() {
      let v = v0;
      cols.forEach((c) => { if (c.kind === 'step' && c.v != null && t >= c.at) v = c.from + c.v * phase(c)[1]; });
      return v;
    }
    const rect = (n, x, a, b) => {
      n.setAttribute('x', fx(x));
      n.setAttribute('y', fx(a));
      n.setAttribute('width', fx(bw));
      n.setAttribute('height', fx(Math.max(0, b - a)));
    };
    let afterOn = live;
    function render() {
      if (!W) return;
      const y0 = y(0), cw = Math.max(3.5, Math.min(6, bw * 0.11));   // 꺾쇠의 반폭
      cols.forEach((c) => {
        const [carry, main] = phase(c), vis = !c.k || t >= c.at;
        c.body.setAttribute('opacity', vis ? 1 : 0);
        const shownIn = vis ? (c.k ? clamp((t - c.done + 100) / 200) : 1) : 0;   // 칸이 다 그려질 무렵 값이 나타납니다
        c.val.setAttribute('opacity', c.valOn ? fx(shownIn) : 0);
        if (c.rt) c.rt.setAttribute('opacity', c.rtOn ? fx(shownIn) : 0);
        c.mark.setAttribute('opacity', 0);
        if (!vis) return;
        const x = c.prev.x + (c.x - c.prev.x) * carry;                       // 앞 칸의 자리에서 이 칸의 자리로
        const carried = c.kind === 'total' ? c.to : c.from;                  // 앞 칸에서 넘어온 높이
        const cur = c.kind === 'total' ? c.to : c.from + (c.v || 0) * main;  // 지금 닿은 높이
        const yC = y(carried), yN = y(cur), top = Math.min(y0, yC, yN), bot = Math.max(y0, yC, yN);
        // 윤곽: 바닥에서 먼 끝만 둥급니다. 바닥 쪽은 R만큼 더 늘여 둥근 모서리를 그림 밖으로 보냅니다.
        rect(c.clip, x, top < y0 ? top : y0 - R, bot > y0 ? bot : y0 + R);
        c.clip.setAttribute('rx', fx(R));
        if (c.kind === 'total') {
          // 합계: 넘어온 금액(회색)이 도착한 높이에서 바닥 쪽으로 글자색으로 굳습니다.
          const end = yN + (y0 - yN) * (c.k ? main : 1);
          rect(c.ghost, x, top, bot);
          rect(c.bar, x, Math.min(yN, end), Math.max(yN, end));
          return;
        }
        // 증감: 남는 금액(회색)은 바닥에서, 넘어온 높이와 지금 높이 가운데 바닥에 가까운 쪽까지. 색 면은 그 사이이고, 둘을 2px 띄웁니다.
        const blockH = Math.abs(yN - yC), keep = carried * cur > 0 ? (Math.abs(carried) < Math.abs(cur) ? yC : yN) : y0, gap = blockH >= 0.5 ? GAP : 0;
        if (keep < y0) rect(c.ghost, x, keep + gap, y0); else rect(c.ghost, x, y0, keep - gap);
        rect(c.bar, x, Math.min(yC, yN), Math.max(yC, yN));
        // 꺾쇠: 색 면이 움직여 간 쪽 끝 가까이에, 그 방향으로. 면이 낮거나 칸이 좁으면 그리지 않습니다.
        const dir = yN > yC ? 1 : -1, on = bw >= 16 ? clamp((blockH - 14) / 6) : 0;
        if (on > 0) {
          const mx = x + bw / 2, tip = yN - dir * 7;
          c.mark.setAttribute('d', `M${fx(mx - cw)},${fx(tip - dir * cw * 0.9)}L${fx(mx)},${fx(tip)}L${fx(mx + cw)},${fx(tip - dir * cw * 0.9)}`);
          c.mark.setAttribute('opacity', fx(on));
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
    // 툴팁: 칸을 짚으면 값을, 증감 칸은 누계(앞 → 뒤)를, 합계 칸은 첫 항목의 몇 %인지를 보여 주고 그 칸만 진하게 남깁니다.
    interact(plot, N,
      (cx) => Math.max(0, Math.min(N - 1, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (k) => {
        const c = cols[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        cols.forEach((x) => x.g.classList.toggle('is-on', x === c));
        const note = c.kind === 'step' ? (c.v == null ? null : tx(d, '누계 %1 → %2', show(f, c.from), show(f, c.to)))
          : c.k && v0 > 0 ? tx(d, '%1의 %2', first.name, pct(c.to)) : null;
        const tb = tipBody({ value: valText(c), note }, c.name);
        return { x: r.left + c.cx, y: r.top + c.topY - 6, label: c.name, value: tb.node, text: tb.text };
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
