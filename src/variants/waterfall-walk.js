  // Waterfall Walk: 첫 항목의 값에서 출발해 항목(items)마다의 증감(value)을 앞 막대가 끝난 높이에 이어 붙이고, total로 표시한 항목에는 그때까지의 누계를
  // 카드가 계산해 합계 막대로 세웁니다(예: 연초 회원 수 → 신규 가입 · 지인 추천 · 재가입 → 해지 · 만료 → 연말 회원 수).
  // 합계 막대(첫 항목과 total 항목)는 바닥(0)에서 서는 회색(--vzb-base)입니다. 증감 막대는 앞 막대가 끝난 높이에서 떠서, 결과를 좋게 만든 쪽이
  // 초록(--vzb-good), 나쁘게 만든 쪽이 빨강(--vzb-bad)이고(better: up · down), neutral이면 모두 첫째 데이터 색입니다.
  // 막대 사이는 앞 막대가 끝난 높이를 점선(점 하나하나)으로 잇습니다. 점은 막대와 막대 사이를 같은 간격으로 채웁니다.
  // 이름과 값은 막대의 도착한 끝 바로 밖에 함께 적습니다(늘린 항목과 합계는 위, 줄인 항목은 아래 · 증감에는 부호). 축 아래에 따로 이름을 두지 않아,
  // 막대를 보는 자리에서 무엇이 얼마나 늘고 줄었는지 읽힙니다. 이웃 글자나 막대와 겹치면 옆으로 조금 밀거나 막대에서 더 띄우고,
  // 그래도 자리가 없으면 이름을, 그다음 값을 생략합니다(툴팁과 표에는 남습니다).
  // 머리 아래에 큰 숫자를 따로 두지 않습니다. 끝 값은 끝 막대(마지막 total 항목)에서 나온 말풍선이 이름 · 끝 값 · 첫 항목 대비 증감
  // (compare: share면 첫 항목의 몇 %인지)과 함께 알려, 같은 숫자를 두 번 적지 않고 그 높이를 그래프가 씁니다.
  // 움직임: 첫 막대가 놓여 있다가 왼쪽부터 한 항목씩, ① 앞 막대가 끝난 높이에서 점이 하나씩 찍히며 다음 칸으로 걸어가고
  // ② 그 높이에서 막대가 오르내리며, 막대 끝에 붙은 이름과 값이 함께 따라가고 값이 보이는 만큼을 셉니다
  // ③ 합계 칸에서는 도착한 높이가 막대로 쏟아져 바닥까지 찹니다. 끝 막대가 다 차면 말풍선이 막대에서 튀어나오고 멈춥니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 걷지 않고, 막대마다 닿아 있던 높이에서 새 높이로 옮겨 갑니다(Move: 넘치지 않음).
  // 증감 막대는 앞 막대가 끝난 높이에 붙은 채 함께 움직이고, 잇는 점 · 막대 끝의 이름과 값 · 끝 막대의 말풍선이 따라가며, 값과 말풍선의 증감은 화면의 막대를 그대로 셉니다.
  // 같은 자리의 같은 이름이 같은 항목입니다. 항목의 수가 달라지면 옮겨 가지 않고 마지막 장면을 바로 그립니다.
  // 눈금이 바뀔 때는 값과 눈금을 차례로 옮깁니다(좁아질 때는 값 먼저, 넓어져야 할 때는 눈금 먼저). 가던 중에 값이 또 바뀐 것이면 함께 옮깁니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('waterfall-walk', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-ww-none', tx(d, '표시할 항목이 없습니다.')));
      keep(card, () => ({ inView: true, items: [] }));   // 빈 화면에서 다시 채워지면 막대가 바닥에서 자랍니다
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
    const pct = (v) => `${v < 0 ? '-' : ''}${num(Math.abs(v / v0) * 100, 1)}%`;   // 첫 항목의 몇 %인지

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 끝 막대의 말풍선에 적을 것: 첫 항목 대비 증감(시작 값이 0 이하이면 비율 대신 차이). compare가 share면 첫 항목의 몇 %인지(손익의 이익률처럼).
    const end = N > 1 && last.kind === 'total' ? last : null;
    // a0에서 a1로 갔을 때 말풍선에 적을 증감(옮겨 가는 동안에는 화면의 막대가 나타내는 값으로 다시 셉니다)
    const chgOf = (a1, a0) => {
      if (!end) return null;
      if (d.compare === 'share') return a0 > 0 ? { dir: 0, tone: 'flat', text: tx(d, '%1의 %2', first.name, `${a1 < 0 ? '-' : ''}${num(Math.abs(a1 / a0) * 100, 1)}%`) } : null;
      const dl = delta(f, a1, a0, d.better);
      return { dir: dl.dir, tone: dl.tone, text: a0 > 0 ? dl.text : show(f, Math.abs(a1 - a0)) };
    };
    const chg = chgOf(v1, v0);
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
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3 → %4 %5(%6). 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', first.name, show(f, v0), last.name, show(f, v1), signed(f, v1 - v0)));
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
      if (c === end) {
        // 끝 막대의 말풍선: 이름 · 끝 값(굵고 크게) · 증감(화살표와 좋고 나쁨의 색)
        c.bub = svgEl('path', { class: 'vzb-ww-bub' });
        c.nm.setAttribute('class', 'vzb-ww-bn');
        c.val.setAttribute('class', 'vzb-ww-big');
        c.lab.prepend(c.bub);
        if (chg) {
          c.chg = svgEl('g', { class: `vzb-ww-chg is-${chg.tone}` });
          if (chg.dir) { c.arw = svgEl('path', { class: 'vzb-ww-arw', d: chg.dir > 0 ? 'M1.5 8l6-6M3 2h4.5v4.5' : 'M1.5 2l6 6M7.5 3.5v4.5h-4.5' }); c.chg.append(c.arw); }
          c.chgText = svgText(0, 0, chg.text, null, 'start');
          c.chg.append(c.chgText);
          c.lab.append(c.chg);
        }
      }
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
    // 막대가 오르내리는 시간 GROW, 합계 막대가 바닥까지 차는 시간 POUR, 말풍선이 튀어나오는 시간 POP
    const M = motion(card), T0 = M.ms('lead'), STEP = N > 1 ? Math.max(380, Math.min(540, 2900 / (N - 1))) : 0, WALK = Math.round(STEP * 0.5), LAG = Math.round(WALK * 0.85), GROW = Math.round(STEP * 0.68), POUR = 520, POPC = M.curve('pop'), POP = POPC.dur;
    const easeOut = (k) => 1 - (1 - k) ** 3, easeInOut = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
    cols.forEach((c) => {
      c.at = c.k ? T0 + (c.k - 1) * STEP : -1e9;   // 앞 막대에서 이 칸으로 점이 걸어오기 시작하는 때
      c.dur = c.kind === 'total' ? POUR : GROW;
      c.done = c.k ? c.at + LAG + c.dur : 0;
    });
    const DONE = last.done, TOTAL = DONE + (end ? POP : 0) + 60;
    let W = 0, H = 0, y = (v) => v, slot = 1, bw = 0, DOT = 1.5, t = 0;
    // 옮겨 가기(데이터가 바뀌어 다시 그릴 때): 막대마다 닿은 높이(누계, st)와 눈금(0의 자리 sa · 값 1의 길이 ss)을 스프링(Move)으로 새 값에 보냅니다.
    // 눈금은 y = A - 값 × S 입니다. SPAN은 값의 폭, LB는 말풍선과 글자의 치수(옮겨 가는 동안 글자가 바뀌면 다시 자리를 잡는 데 씁니다).
    const [MK, MC] = M.pair('move');
    let from = before(card), moving = false, rush = false, sa = null, ss = null, A = 0, S = 1, SPAN = 1, LB = null, bubKey = null;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      slot = w / N;
      bw = Math.min(32, slot * 0.62);
      // 글자 크기: 이름 · 값 14px, 칸이 좁으면 12px. LBL은 막대 끝에서 이름 줄 바깥까지, VAL은 값 줄 바깥까지의 길이입니다.
      const tight = slot < 64, nsz = tight ? 12 : 14, vsz = nsz, LBL = nsz + vsz + 8, VAL = vsz + 6;
      svg.classList.toggle('is-tight', tight);
      DOT = tight ? 1.25 : 1.5;
      // 말풍선의 크기: 넓으면 이름 아래에 끝 값과 증감을 한 줄로, 좁으면 세 줄로 쌓습니다. 이름은 말풍선 안에 온전히 적습니다(그림 폭을 넘으면 줄입니다).
      // 말풍선의 이름과 증감은 큰 숫자에 붙는 설명이라 12px, 끝 값은 18px(좁으면 14px)입니다.
      const big = tight ? 14 : 18, csz = 12, bsz = 12, px = tight ? 7 : 10, py = 6, TAIL = 5, row = !tight;
      let B = null;
      if (end) {
        end.nm.textContent = fit(end.name, bsz, Math.min(160, w - 2 * px - 8));
        const nW = textW(end.nm.textContent, 500, fam, bsz), vW = textW(valText(end), 700, fam, big), cW = chg ? (chg.dir ? 11 : 0) + textW(chg.text, 500, fam, csz) : 0;
        const l2 = row && chg ? vW + 7 + cW : vW, bwid = Math.max(nW, l2, row ? 0 : cW) + 2 * px;
        B = { vW, cW, l2, bwid, bh: 2 * py + (bsz + 2) + (big + 2) + (chg && !row ? csz + 3 : 0) };
        B.ext = 4 + TAIL + B.bh;
      }
      // 높이: 0과 모든 막대의 양 끝이 들어가게 하고, 막대 끝 밖의 글자(끝 막대는 말풍선)가 그림 안에 들어가도록 위아래 여백을 늘려 갑니다.
      const lvls = [0, ...cols.flatMap((c) => [c.from, c.to])], lo = Math.min(...lvls), hi = Math.max(...lvls), span = hi - lo || 1;
      const extOf = (c) => (c === end ? B.ext : LBL) + 2;
      let PADT = LBL + 4, PADB = lo < 0 ? LBL + 4 : 0, s = 1;
      for (let i = 0; i < 8; i++) {
        s = Math.max(1, h - 1 - PADT - PADB) / span;
        let addT = 0, addB = 0;
        cols.forEach((c) => {
          const yy = PADT + (hi - c.to) * s;
          if (c.below) addB = Math.max(addB, yy + extOf(c) - (h - 1)); else addT = Math.max(addT, extOf(c) - yy);
        });
        if (addT < 0.5 && addB < 0.5) break;
        PADT += Math.max(0, addT);
        PADB += Math.max(0, addB);
      }
      s = Math.max(1, h - 1 - PADT - PADB) / span;
      S = s; A = PADT + hi * s; SPAN = span;
      LB = { w, vsz, nsz, big, csz, bsz, px, py, TAIL, row, bh: B ? B.bh : 0 };
      bubKey = null;
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
        if (c !== end) c.nm.textContent = fit(c.name, nsz, Math.max(44, slot * 1.6));
        c.vw = textW(valText(c), c.kind === 'step' ? 600 : 700, fam, vsz) + 4;
        c.lw = Math.max(c.vw, textW(c.nm.textContent, c.kind === 'step' ? 400 : 500, fam, nsz) + 4);
        c.ext = LBL;
        c.off = 0;
        if (c !== end) {
          side(c, c.below);
          return;
        }
        // 말풍선: 꼬리는 막대 가운데를 가리키고, 몸은 그림 밖으로 나가지 않게 옆으로 옮깁니다.
        const { vW, cW, l2, bwid, bh } = B;
        c.off = Math.max(-(bwid / 2 - 10), Math.min(bwid / 2 - 10, Math.max(bwid / 2 - 10 - c.cx, Math.min(w + 10 - c.cx - bwid / 2, 0))));
        const top = c.below ? 4 + TAIL : -(4 + TAIL + bh);
        B.top = top;
        c.nm.setAttribute('x', fx(c.off));
        c.nm.setAttribute('y', fx(top + py + bsz - 1));
        const yv = top + py + bsz + 2 + big - 1, xl = c.off - l2 / 2;
        c.val.setAttribute('text-anchor', row && chg ? 'start' : 'middle');
        c.val.setAttribute('x', fx(row && chg ? xl : c.off));
        c.val.setAttribute('y', fx(yv));
        if (c.chg) {
          const cx0 = row ? xl + vW + 7 : c.off - cW / 2, cy = row ? yv - 1 : yv + csz + 4;
          if (c.arw) c.arw.setAttribute('transform', `translate(${fx(cx0)},${fx(cy - 9)})`);
          c.chgText.setAttribute('x', fx(cx0 + (chg.dir ? 11 : 0)));
          c.chgText.setAttribute('y', fx(cy));
        }
        c.lw = bwid;
        c.ext = B.ext;
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
      // 끝내 자리가 없으면 이름을, 그다음 값을 생략합니다. 말풍선이 가장 먼저 자리를 잡습니다.
      const hits = (a, b) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
      const walls = [...conns];
      cols.forEach((c) => { if (c.bar) walls.push([c.x - 1, c.x + bw + 1, Math.min(c.yA, c.yB), Math.max(c.yA, c.yB), c]); });
      const taken = [];
      const free = (c, b) => b[0] >= -14 && b[1] <= w + 14 && b[2] >= -12 && b[3] <= h + 12 && !taken.some((o) => hits(o, b)) && !walls.some((o) => o[4] !== c && hits(o, b));
      const moves = [];
      [0, 4, 8, 12, 16, 22, 28].forEach((dy) => [0, 4, -4, 8, -8, 12, -12].forEach((dx) => moves.push([dx, dy])));
      moves.sort((a, b) => Math.abs(a[0]) + a[1] * 1.2 - (Math.abs(b[0]) + b[1] * 1.2));
      [...cols].sort((a, b) => (b === end) - (a === end) || (a.kind === 'step') - (b.kind === 'step') || Math.abs(b.v || 0) - Math.abs(a.v || 0)).forEach((c) => {
        const dir = c.below ? 1 : -1;
        const boxOf = (lw, ext, [dx, dy]) => { const x0 = c.cx + c.off + dx - lw / 2, ye = c.yB + dir * dy; return c.below ? [x0, x0 + lw, ye + 3, ye + ext] : [x0, x0 + lw, ye - ext, ye - 3]; };
        let pick = moves.find((m) => free(c, boxOf(c.lw, c.ext, m)));
        if (!pick && c === end) pick = moves[0];   // 말풍선은 늘 둡니다
        c.nameOn = !!pick;
        if (!pick) pick = moves.find((m) => free(c, boxOf(c.vw, VAL, m)));   // 이름 없이 값만
        c.labOn = !!pick;
        c.dx = pick ? pick[0] : 0;
        c.dy = pick ? dir * pick[1] : 0;
        if (c === end) {
          // 말풍선을 옮겼으면 꼬리를 그만큼 늘여, 꼬리 끝이 늘 막대 끝 4px 앞을 가리키게 합니다.
          const { bwid, bh, top } = B, x0 = c.off - bwid / 2, r = 7, edge = c.below ? top : top + bh, tipY = (c.below ? 4 : -4) - c.dy;
          const tx0 = Math.max(x0 + r + 5, Math.min(x0 + bwid - r - 5, -c.dx));
          c.bub.setAttribute('d', `M${fx(x0 + r)},${fx(top)}h${fx(bwid - 2 * r)}a${r},${r} 0 0 1 ${r},${r}v${fx(bh - 2 * r)}a${r},${r} 0 0 1 ${-r},${r}h${fx(-(bwid - 2 * r))}a${r},${r} 0 0 1 ${-r},${-r}v${fx(-(bh - 2 * r))}a${r},${r} 0 0 1 ${r},${-r}Z`
            + `M${fx(tx0 - 5)},${fx(edge)}L${fx(-c.dx)},${fx(tipY)}L${fx(tx0 + 5)},${fx(edge)}Z`);
        }
        if (pick) taken.push(boxOf(c.nameOn ? c.lw : c.vw, c.nameOn ? c.ext : VAL, pick));
        c.nm.setAttribute('opacity', c.nameOn ? 1 : 0);
      });
      if (from) { begin(from); from = null; kick(); }
      render();
    }
    // 이름과 값을 막대의 어느 쪽에 적는지(below: 아래). 옮겨 가는 동안 증감의 부호가 바뀌면 글자도 그쪽으로 옮깁니다.
    function side(c, below) {
      c.side = below;
      c.val.setAttribute('y', below ? LB.vsz + 2 : -6);
      c.nm.setAttribute('y', below ? LB.vsz + LB.nsz + 4 : -(LB.vsz + 8));
    }
    const TONES = ['total', 'none', 'plain', 'good', 'bad'];
    function tone(c, name) {
      if (c.toneNow === name) return;
      c.toneNow = name;
      TONES.forEach((n) => c.g.classList.toggle(`is-${n}`, n === name));
    }
    // 옮겨 가는 동안의 말풍선: 끝 값과 증감의 글자가 바뀌면 폭과 자리를 그 글자에 맞춰 다시 잡습니다(다 옮겨 가면 layout이 마지막 모양으로 되돌립니다).
    function bubble(valStr, ch) {
      const c = end, key = `${valStr}|${ch ? ch.text + ch.dir + ch.tone : ''}`;
      if (key === bubKey) return;
      bubKey = key;
      const { w, big, csz, bsz, px, py, TAIL, row, bh } = LB;
      c.val.textContent = valStr;
      if (c.chg) {
        if (ch) c.chg.removeAttribute('opacity'); else c.chg.setAttribute('opacity', 0);
        if (ch) {
          c.chg.setAttribute('class', `vzb-ww-chg is-${ch.tone}`);
          c.chgText.textContent = ch.text;
          if (c.arw) { if (ch.dir) { c.arw.removeAttribute('opacity'); c.arw.setAttribute('d', ch.dir > 0 ? 'M1.5 8l6-6M3 2h4.5v4.5' : 'M1.5 2l6 6M7.5 3.5v4.5h-4.5'); } else c.arw.setAttribute('opacity', 0); }
        }
      }
      const has = !!(ch && c.chg), arw = has && ch.dir && c.arw ? 11 : 0;
      const nW = textW(c.nm.textContent, 500, fam, bsz), vW = textW(valStr, 700, fam, big), cW = has ? arw + textW(ch.text, 500, fam, csz) : 0;
      const l2 = row && has ? vW + 7 + cW : vW, bwid = Math.max(nW, l2, row ? 0 : cW) + 2 * px;
      const off = Math.max(-(bwid / 2 - 10), Math.min(bwid / 2 - 10, Math.max(bwid / 2 - 10 - c.cx, Math.min(w + 10 - c.cx - bwid / 2, 0))));
      const top = c.below ? 4 + TAIL : -(4 + TAIL + bh);
      c.nm.setAttribute('x', fx(off));
      const yv = top + py + bsz + 2 + big - 1, xl = off - l2 / 2;
      c.val.setAttribute('text-anchor', row && has ? 'start' : 'middle');
      c.val.setAttribute('x', fx(row && has ? xl : off));
      if (has) {
        const cx0 = row ? xl + vW + 7 : off - cW / 2, cy = row ? yv - 1 : yv + csz + 4;
        if (c.arw) c.arw.setAttribute('transform', `translate(${fx(cx0)},${fx(cy - 9)})`);
        c.chgText.setAttribute('x', fx(cx0 + arw));
        c.chgText.setAttribute('y', fx(cy));
      }
      const x0 = off - bwid / 2, r = 7, edge = c.below ? top : top + bh, tipY = (c.below ? 4 : -4) - c.dy;
      const tx0 = Math.max(x0 + r + 5, Math.min(x0 + bwid - r - 5, -c.dx));
      c.bub.setAttribute('d', `M${fx(x0 + r)},${fx(top)}h${fx(bwid - 2 * r)}a${r},${r} 0 0 1 ${r},${r}v${fx(bh - 2 * r)}a${r},${r} 0 0 1 ${-r},${r}h${fx(-(bwid - 2 * r))}a${r},${r} 0 0 1 ${-r},${-r}v${fx(-(bh - 2 * r))}a${r},${r} 0 0 1 ${r},${-r}Z`
        + `M${fx(tx0 - 5)},${fx(edge)}L${fx(-c.dx)},${fx(tipY)}L${fx(tx0 + 5)},${fx(edge)}Z`);
    }
    // 앞 장면에서 시작합니다. 같은 자리의 같은 이름은 닿아 있던 높이에서, 이름이 바뀐 자리는 앞 막대가 끝난 높이(합계는 바닥)에서 출발합니다.
    // 항목의 수가 달라졌으면 옮겨 가지 않습니다.
    function begin(prev) {
      if (!prev || !prev.inView || !Array.isArray(prev.items) || (prev.items.length && prev.items.length !== N)) return;
      let lv = 0;
      cols.forEach((c, k) => {
        const p = prev.items[k], same = !!p && p.name === c.name && p.kind === c.kind;
        c.st = { x: same ? p.to : c.kind === 'total' ? 0 : lv, v: same ? p.tv : 0 };
        lv = c.st.x;
      });
      sa = { x: prev.s > 0 ? prev.a : A, v: prev.s > 0 ? prev.av || 0 : 0 };
      ss = { x: prev.s > 0 ? prev.s : S, v: prev.s > 0 ? prev.sv || 0 : 0 };
      moving = true;
      rush = !!prev.moving;
      playing = false;
      t = 1e9;
    }
    // 스프링을 dt만큼 옮깁니다. 눈금이 넓어져야 하면(값 1의 길이가 줄면) 눈금이 먼저, 좁아지거나 0의 자리만 옮겨 가면 값이 먼저 갑니다.
    // 함께 옮기면 값이 줄어든 막대가 화면에서는 커지는 순간이 생기기 때문입니다. 차이가 작거나(2% 안) 가던 중에 값이 또 바뀐 것이면 함께 갑니다.
    function stepMove(dt) {
      let more = false, valErr = 0;
      cols.forEach((c) => { valErr = Math.max(valErr, Math.abs(c.st.x - c.to)); });
      const scaleErr = Math.max(Math.abs(ss.x - S) / S, Math.abs(sa.x - A) / Math.max(1, H));
      const both = rush || scaleErr < 0.02, out = S < ss.x;
      const runScale = both || out || valErr < SPAN * 0.02, runVals = both || !out;
      const go = (sp, to, span, run) => {
        springTo(sp, run ? to : sp.x, MK, MC, dt);
        if (Math.abs(sp.x - to) > span * 0.0006 || Math.abs(sp.v) > span * 0.01) more = true; else { sp.x = to; sp.v = 0; }
      };
      go(ss, S, S, runScale);
      go(sa, A, Math.max(1, H), runScale);
      cols.forEach((c) => go(c.st, c.to, SPAN, runVals));
      if (!more) settle();
    }
    // 다 옮겨 갔습니다: 옮겨 가는 동안 바꿔 둔 색 · 글자 · 말풍선을 마지막 모양으로 되돌리고 다시 그립니다.
    function settle() {
      moving = false;
      cols.forEach((c) => {
        tone(c, c.tone);
        if (c.kind === 'total') { c.said = valText(c); c.val.textContent = c.said; }
      });
      if (end && end.chg) {
        end.chg.removeAttribute('opacity');
        end.chg.setAttribute('class', `vzb-ww-chg is-${chg.tone}`);
        end.chgText.textContent = chg.text;
        if (end.arw) { end.arw.removeAttribute('opacity'); end.arw.setAttribute('d', chg.dir > 0 ? 'M1.5 8l6-6M3 2h4.5v4.5' : 'M1.5 2l6 6M7.5 3.5v4.5h-4.5'); }
      }
      layout(W, H);
    }
    // 옮겨 가는 동안의 한 장면: 눈금과 높이는 스프링의 값이고, 글자는 화면의 막대가 나타내는 값입니다.
    function renderMove() {
      const yv = (v) => sa.x - v * ss.x, rd = (v) => (whole ? Math.round(v) : v);
      base.setAttribute('y1', fx(sa.x));
      base.setAttribute('y2', fx(sa.x));
      cols.forEach((c) => {
        const fromV = c.kind === 'total' ? 0 : cols[c.k - 1].st.x, toV = c.st.x, yA = yv(fromV), yB = yv(toV), dv = rd(toV - fromV);
        c.path.setAttribute('d', barPath(c.x, yA, yB, bw));
        // 증감의 부호가 바뀌는 동안에는 색과 글자의 자리도 화면의 막대를 따릅니다.
        const below = c.kind === 'total' ? (toV < 0 || (toV === 0 && c.below)) : dv ? dv < 0 : c.below;
        if (c.kind === 'step') tone(c, !dv ? c.tone : want === 0 ? 'plain' : Math.sign(dv) === want ? 'good' : 'bad');
        if (c !== end && c.side !== below) side(c, below);
        c.lab.setAttribute('transform', `translate(${fx(c.cx + c.dx)},${fx(yB + (c === end || below === c.below ? c.dy : 0))})`);
        c.lab.setAttribute('opacity', c.labOn ? 1 : 0);
        if (c === end) bubble(show(f, rd(toV)), chgOf(rd(toV), rd(cols[0].st.x)));
        else {
          const say = c.kind === 'total' ? show(f, rd(toV)) : dv ? signed(f, dv) : c.v ? `${c.v > 0 ? '+' : '-'}${show(f, 0)}` : valText(c);
          if (say !== c.said) { c.said = say; c.val.textContent = say; }
        }
        if (c.dotEls) c.dotEls.forEach((dot) => { dot.setAttribute('cy', fx(yB)); dot.setAttribute('r', fx(DOT)); });
      });
    }
    // 지금 화면의 장면: 데이터가 바뀌어 카드를 갈아 끼울 때 새 카드에 넘깁니다. 걷는 중이면 막대마다 지금 닿은 높이를 넘깁니다.
    keep(card, () => {
      if (!W) return from;
      let lv = 0;
      return {
        inView, moving, a: moving ? sa.x : A, av: moving ? sa.v : 0, s: moving ? ss.x : S, sv: moving ? ss.v : 0,
        items: cols.map((c) => {
          if (moving) return { name: c.name, kind: c.kind, to: c.st.x, tv: c.st.v };
          const e = grown(c);
          lv = c.kind === 'total' ? (e > 0 ? c.to : lv) : lv + (c.to - c.from) * e;
          return { name: c.name, kind: c.kind, to: lv, tv: 0 };
        }),
      };
    });
    // 한 칸의 진행(0~1): 합계 칸은 도착한 높이에서 바닥까지 찬 정도, 증감 칸은 막대가 오르내린 정도입니다. 첫 막대는 처음부터 다 서 있습니다.
    const grown = (c) => (c.k ? (c.kind === 'total' ? easeInOut : easeOut)(clamp((t - c.at - LAG) / c.dur)) : 1);
    function render() {
      if (!W) return;
      if (moving) { renderMove(); return; }
      cols.forEach((c) => {
        const e = grown(c);
        // 합계 막대는 도착한 높이(위 끝)에 붙은 채 바닥 쪽으로 찹니다. 증감 막대는 출발한 높이에서 도착하는 쪽으로 자랍니다.
        const tip = c.kind === 'total' ? c.yB : c.yA + (c.yB - c.yA) * e;
        c.path.setAttribute('d', !c.bar ? '' : c.kind === 'total' ? barPath(c.x, c.yB + (c.yA - c.yB) * e, c.yB, bw) : barPath(c.x, c.yA, tip, bw));
        // 글자는 막대 끝에 붙어 함께 움직이고, 증감 값은 지금 보이는 만큼을 셉니다. 점이 다 걸어올 즈음 나타납니다.
        // 끝 막대의 말풍선은 막대가 다 찰 즈음 꼬리 끝에서부터 튀어나옵니다.
        const pop = c === end ? clamp((t - c.done + 100) / POP) : 1;   // 말풍선은 Pop 스프링으로 튀어나옵니다(값이 아닌 이름표라 넘쳐도 됩니다)
        c.lab.setAttribute('transform', `translate(${fx(c.cx + c.dx)},${fx(tip + c.dy)})${pop < 1 ? ` scale(${Math.max(0.01, POPC.at(t - c.done + 100)).toFixed(3)})` : ''}`);
        c.lab.setAttribute('opacity', c.labOn ? fx(c === end ? clamp((t - c.done + 100) / 90) : c.k ? clamp((t - c.at - LAG + 80) / 160) : 1) : 0);
        const now = c.kind === 'step' && c.v ? part(c.v, e) : 0;   // 0에서 시작할 때도 부호를 붙여, 늘 항목인지 줄 항목인지 먼저 알립니다
        const say = c.kind === 'step' && c.v ? (now ? signed(f, now) : `${c.v > 0 ? '+' : '-'}${show(f, 0)}`) : c.said;
        if (say !== c.said) { c.said = say; c.val.textContent = say; }
        // 잇는 점: 다음 칸의 차례가 오면 앞에서부터 하나씩 찍힙니다.
        if (c.dotEls) {
          const nx = cols[c.k + 1], n = c.dotEls.length;
          c.dotEls.forEach((dot, i) => dot.setAttribute('r', fx(DOT * easeOut(clamp((t - nx.at - (i / n) * WALK) / 110)))));
        }
      });
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, lastStamp = 0, raf = 0;
    // 옮겨 가기는 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const on = () => card.isConnected && inView && (moving || (playing && !holds.size));
    function tick(stamp) {
      raf = 0;
      if (!on()) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(100, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (moving) stepMove(dt);
      else if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(TOTAL, t + dt);
        if (t >= TOTAL) { if (loop) rest = M.ms('rest'); else playing = false; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    function play() { if (moving) settle(); t = 0; rest = 0; lastStamp = 0; playing = true; render(); kick(); }
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
        // 짚은 막대의 이름 · 값 · 말풍선은 숨기지 않고 그대로 둡니다(숫자가 사라지면 오류처럼 보이므로). 툴팁은 그 값을 되풀이하지 않고 값이 어떻게 이루어졌는지 적습니다:
        // 증감 막대는 누계가 어디서 어디로 옮겨 갔는지, 첫 막대는 시작 값이라는 것, 합계 막대는 '첫 항목 → 이 합계'와 첫 항목 대비(끝 막대는 말풍선이 적으므로 뺍니다).
        // 툴팁의 증감은 막대와 같은 색으로 적습니다(좋음 초록 · 나쁨 빨강).
        const dv = c.to - v0, ntone = want === 0 || !dv ? null : Math.sign(dv) === want ? 'good' : 'bad';
        let spec;
        // 자리가 없어 값 글자를 생략한 막대(labOn 거짓)는 툴팁이 값도 적습니다.
        const own = c.labOn ? {} : { value: valText(c), tone: c.tone === 'good' || c.tone === 'bad' ? c.tone : null };
        if (c.kind === 'step') spec = c.v == null ? { value: valText(c) } : { ...own, note: tx(d, '누계 %1 → %2', show(f, c.from), show(f, c.to)) };
        else if (!c.k) spec = { ...own, note: tx(d, '시작 값') };
        else spec = {
          flow: [{ name: first.name, value: show(f, v0) }, { name: c.name, value: show(f, c.to) }],
          note: c === end ? null : d.compare === 'share' ? (v0 > 0 ? tx(d, '%1의 %2', first.name, pct(c.to)) : null) : { text: `${signed(f, dv)} · ${tx(d, '%s 대비', first.name)}`, tone: ntone },
        };
        const tb = tipBody(spec, c.name);
        // 툴팁 자리: 막대와 그 이름 · 값 위. 끝 막대는 말풍선 왼쪽에 둡니다. 남겨 둔 레이블을 툴팁이 덮지 않게 하기 위해서입니다.
        const lr = c.labOn ? c.lab.getBoundingClientRect() : null;
        if (c === end && lr) return { x: lr.left, y: lr.top + lr.height / 2, side: 'left', label: c.name, value: tb.node, text: tb.text };
        return { x: r.left + c.cx, y: Math.min(r.top + Math.min(c.yA, c.yB), lr && lr.height ? lr.top : Infinity) - 6, label: c.name, value: tb.node, text: tb.text };
      },
      () => { svg.classList.remove('is-hover'); cols.forEach((x) => x.g.classList.remove('is-on')); },
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
        if (!inView && moving) settle();   // 화면 밖에서는 다 옮겨 간 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
