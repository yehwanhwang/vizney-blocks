  // Bump Race: 기간마다 값이 큰 순서로 순위(1위가 맨 위)를 매기고, 기간 사이를 S자 선으로 잇습니다.
  // 재생하면 기간을 하나씩 넘기며 선이 오른쪽으로 자라고, 선 끝의 이름표가 그 기간의 순위 자리로 오르내려 앞지르는 순간이 보입니다.
  // 짚을 항목(focus, 비우면 첫 항목) 하나만 첫째 데이터 색이고 나머지는 회색입니다. 이름표에는 지금 순위와 이름을 적습니다.
  // 선이나 이름표를 누르면(키보드는 위아래 화살표로 고른 뒤 Enter) 그 항목이 짚을 항목이 되어 색이 옮겨 갑니다.
  // 아래의 구간 막대가 시간 축입니다. 기간마다 눈금이 있고 손잡이 아래에 지금 기간을 적습니다. 끌거나 누르거나 좌우 화살표로 기간을 옮깁니다.
  // 구간 막대 오른쪽(이름표 열 아래)에 되감기 · 재생/일시정지 · 빨리 감기 단추를 둡니다. 재생은 멈춘 자리부터(끝에 있으면 처음부터),
  // 되감기와 빨리 감기는 한 번 누르면 한 기간씩, 누르고 있으면 계속 빠르게 옮겨 가다가 놓은 자리에서 가까운 기간에 멈춥니다.
  // 순위는 카드가 values로 매깁니다(better가 down이면 작은 값이 1위). 같은 값은 앞 기간 순위, 그다음 적은 순서를 따르고, 값이 null인 기간은 선을 끊습니다.
  // 움직임: 화면에 보이면 첫 기간에서 잠시 멈췄다가 끝까지 한 번 재생하고 멈춥니다. 그래프에 마우스를 올리거나 키보드로 포커스하면 잠시 멈춥니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 고른 기간(카드 요소의 data-vzb-period, 없으면 마지막)을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 처음으로 감았다가 다시 재생합니다. 손을 대면 되풀이를 멈춥니다.
  mount('bump-race', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    const none = () => { head(card, d, f, null); card.append(el('p', 'vzb-br-none', tx(d, '표시할 항목이 없습니다.'))); };
    if (Array.isArray(d.items) && !d.items.length) { none(); return; }
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], n = labels.length;
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (n < 2) throw new Error(tx(d, 'labels에 기간을 2개 이상 적으세요.'));
    if (list.length < 2 || list.length > 8) throw new Error(tx(d, 'items에 항목을 2~8개 적으세요.'));
    if (list.some((it) => !Array.isArray(it.values) || it.values.length !== n || it.values.some((v) => v != null && !fin(v)))) throw new Error(tx(d, 'labels와 values를 확인하세요.'));
    // 짚을 항목: 사용자가 눌러 고른 항목(카드 요소의 data-vzb-focus)이 있으면 그것, 없으면 focus, 그것도 없으면 첫 항목
    const picked = card.getAttribute('data-vzb-focus');
    let at = list.findIndex((it) => String(it.name) === picked);
    if (at < 0) at = list.findIndex((it) => String(it.name) === String(d.focus));
    const items = list.map((it, i) => ({ i, name: String(it.name), vals: it.values.map((v) => (fin(v) ? +v : null)), focus: i === Math.max(0, at) }));
    const N = items.length, down = d.better === 'down', last = n - 1;
    // 순위: 기간마다 값이 있는 항목만 큰 순서(down이면 작은 순서)로 매깁니다. 같은 값은 앞 기간 순위, 그다음 적은 순서입니다.
    items.forEach((it) => { it.rk = Array(n).fill(0); });
    for (let t = 0; t < n; t++) {
      items.filter((it) => it.vals[t] != null)
        .sort((a, b) => (down ? a.vals[t] - b.vals[t] : b.vals[t] - a.vals[t]) || (t ? (a.rk[t - 1] || N + 1) - (b.rk[t - 1] || N + 1) : 0) || a.i - b.i)
        .forEach((it, r) => { it.rk[t] = r + 1; });
    }
    if (items.every((it) => it.rk.every((r) => !r))) { none(); return; }
    let focus = items.find((it) => it.focus);
    const firstOf = (it) => it.rk.findIndex(Boolean), lastOf = (it) => { for (let t = last; t >= 0; t--) if (it.rk[t]) return t; return -1; };
    const rankText = (r) => (r ? tx(d, '%s위', r) : '–');

    head(card, d, f, null);
    // 재생 단추들: 되감기 · 재생/일시정지 · 빨리 감기. 구간 막대 오른쪽에 둡니다.
    const ctl = el('div', 'vzb-br-ctl');
    const mk = (cls, paths) => {
      const b = el('button', `vzb-br-btn ${cls}`);
      b.type = 'button';
      const ic = svgEl('svg', { class: 'vzb-br-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
      paths.forEach(([c, dd]) => ic.append(svgEl('path', { class: c, d: dd })));
      b.append(ic);
      ctl.append(b);
      return b;
    };
    const rew = mk('vzb-br-rew', [['vzb-br-play', 'M8 4.4v7.2L3.2 8zM13.6 4.4v7.2L8.8 8z']]);
    const btn = mk('vzb-br-main', [['vzb-br-play', 'M5.6 3.9v8.2l6.6-4.1z'], ['vzb-br-pause', 'M5.4 4v8M10.6 4v8']]);
    const ff = mk('vzb-br-ff', [['vzb-br-play', 'M2.4 4.4v7.2L7.2 8zM8 4.4v7.2L12.8 8z']]);
    rew.setAttribute('aria-label', tx(d, '되감기'));
    ff.setAttribute('aria-label', tx(d, '빨리 감기'));
    const foot = el('div', 'vzb-foot vzb-fill vzb-br');
    const plot = el('div', 'vzb-plot vzb-br-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const a0 = firstOf(focus), b0 = lastOf(focus);
    plot.setAttribute('aria-label', tx(d, '%1 순위 변화, %2–%3. %4: %5 → %6. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.',
      d.title || '', labels[0], labels[last], focus.name, rankText(focus.rk[a0]), rankText(focus.rk[b0])));
    const svg = svgEl('svg', { class: 'vzb-br-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    // 구간 막대: 시간 축이자 기간을 고르는 슬라이더입니다.
    const scrub = el('div', 'vzb-br-scrub');
    scrub.tabIndex = 0;
    scrub.setAttribute('role', 'slider');
    scrub.setAttribute('aria-label', tx(d, '기간'));
    scrub.setAttribute('aria-valuemin', '0');
    scrub.setAttribute('aria-valuemax', String(last));
    const ssvg = svgEl('svg', { class: 'vzb-br-ssvg', 'aria-hidden': 'true' });
    scrub.append(ssvg);
    const bar = el('div', 'vzb-br-bar');
    bar.append(scrub, ctl);
    foot.append(plot, bar);
    card.append(foot);
    // 화면 낭독기용 표: 항목(마지막 순위 순서) · 기간마다 순위와 값
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, tx(d, '항목')), ...labels.map((l) => el('th', null, l)));
    table.append(el('caption', null, tx(d, '%s 순위', d.title || '')), hr);
    items.slice().sort((a, b) => (a.rk[lastOf(a)] || N + 1) - (b.rk[lastOf(b)] || N + 1)).forEach((it) => {
      const tr = el('tr');
      tr.append(el('th', null, it.name), ...labels.map((_, t) => el('td', null, it.rk[t] ? `${rankText(it.rk[t])} (${show(f, it.vals[t])})` : '')));
      table.append(tr);
    });
    const say = el('div', 'vzb-sr');   // 짚을 항목을 바꾸면 읽어 줍니다
    say.setAttribute('aria-live', 'polite');
    sr.append(table);
    card.append(sr, say);

    // 그림: 회색 선 → 짚을 항목의 선 → 선 끝 점 → 이름표 순서로 쌓아, 이름표가 늘 선 위에 오게 합니다.
    const gLines = svgEl('g', {}), gHeads = svgEl('g', {}), gLabs = svgEl('g', {});
    items.forEach((it) => {
      const cls = it.focus ? ' is-focus' : '';
      it.line = svgEl('g', { class: `vzb-br-item${cls}` });
      it.path = svgEl('path', { class: 'vzb-br-line' });
      it.dots = labels.map(() => svgEl('circle', { class: 'vzb-br-dot', r: 2.5 }));
      it.line.append(it.path, ...it.dots);
      it.head = svgEl('circle', { class: `vzb-br-head${cls}`, r: it.focus ? 5 : 4 });
      it.lab = svgEl('text', { class: `vzb-br-lab${cls}` });
      it.labR = svgEl('tspan', { class: 'vzb-br-rk' });
      it.labN = svgEl('tspan', { class: 'vzb-br-nm', dx: 5 });
      it.labN.textContent = it.name;
      it.lab.append(it.labR, it.labN);
      gHeads.append(it.head);
      gLabs.append(it.lab);
    });
    items.filter((it) => !it.focus).concat(focus).forEach((it) => gLines.append(it.line));
    svg.append(gLines, gHeads, gLabs);
    // 구간 막대의 그림: 레일 · 지나온 구간 · 기간 눈금 · 손잡이 · 처음과 끝 기간 이름 · 손잡이 아래 지금 기간
    const track = svgEl('line', { class: 'vzb-br-track' }), fill = svgEl('line', { class: 'vzb-br-fill' });
    const ticks = labels.map(() => svgEl('circle', { class: 'vzb-br-tick', r: 1.5 }));
    const halo = svgEl('circle', { class: 'vzb-br-halo', r: 11 }), thumb = svgEl('circle', { class: 'vzb-br-thumb', r: 6 });
    const endA = svgText(0, 0, labels[0], 'vzb-br-end', 'start'), endB = svgText(0, 0, labels[last], 'vzb-br-end', 'end'), now = svgText(0, 0, '', 'vzb-br-now', 'middle');
    ssvg.append(track, fill, ...ticks, halo, thumb, endA, endB, now);

    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1);
    // 이름표 열과 지금 기간 글자의 폭: 글꼴이 늦게 실리면 처음에는 대체 글꼴로 재게 되므로, 글꼴이 실린 뒤 다시 잽니다(아래 fonts.ready).
    let nameW = 0, nowW = 0;
    const measure = () => {
      nameW = Math.max(...items.map((it) => textW(rankText(N), 700, fam) + 5 + textW(it.name, 700, fam)));   // 누구든 짚을 항목(굵게)이 될 수 있습니다
      nowW = Math.max(...labels.map((l) => textW(l, 700, fam)));
    };
    measure();
    let W = 0, H = 0, xs = [], Y = () => 0;
    // 선 한 칸: 앞 기간 점에서 뒤 기간 점까지 가로로 나갔다 들어오는 S자 곡선(조절점은 가로 가운데)입니다.
    // 시간이 같은 속도로 흐르도록, 가로로 간 몫 s에 맞는 곡선의 매개변수 u를 뉴턴법으로 찾아 그 자리에서 곡선을 자릅니다.
    const uOf = (s) => { let u = s; for (let k = 0; k < 6; k++) { const g = 1.5 * u - 1.5 * u * u + u * u * u - s, dg = 1.5 - 3 * u + 3 * u * u; u = Math.max(0, Math.min(1, u - g / dg)); } return u; };
    const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    function cut(x0, y0, x1, y1, u) {
      const mx = (x1 - x0) / 2, p0 = [x0, y0], p1 = [x0 + mx, y0], p2 = [x1 - mx, y1], p3 = [x1, y1];
      const q0 = lerp(p0, p1, u), q1 = lerp(p1, p2, u), q2 = lerp(p2, p3, u), r0 = lerp(q0, q1, u), r1 = lerp(q1, q2, u), e = lerp(r0, r1, u);
      return { d: `C${fx(q0[0])},${fx(q0[1])} ${fx(r0[0])},${fx(r0[1])} ${fx(e[0])},${fx(e[1])}`, e };
    }
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // 오른쪽에는 이름표 자리를 남깁니다. 위아래는 점 반지름만큼 띄웁니다.
      // 오른쪽 자리는 이름표와 재생 단추 가운데 넓은 쪽만큼 남깁니다.
      const L = 6, R = Math.max(L + 40, w - Math.max(nameW + 16, ctl.offsetWidth + 14)), top = 8, bottom = h - 8;
      xs = labels.map((_, t) => L + (t * (R - L)) / last);
      Y = (r) => (N < 2 ? (top + bottom) / 2 : top + ((r - 1) * (bottom - top)) / (N - 1));
      items.forEach((it) => it.dots.forEach((c, t) => { if (it.rk[t]) { c.setAttribute('cx', fx(xs[t])); c.setAttribute('cy', fx(Y(it.rk[t]))); } }));
      const sw = scrub.clientWidth;
      ssvg.setAttribute('width', sw);
      ssvg.setAttribute('height', 34);
      ssvg.setAttribute('viewBox', `0 0 ${sw} 34`);
      [track, fill].forEach((l) => { l.setAttribute('y1', 9); l.setAttribute('y2', 9); });
      track.setAttribute('x1', fx(xs[0]));
      track.setAttribute('x2', fx(xs[last]));
      fill.setAttribute('x1', fx(xs[0]));
      ticks.forEach((c, t) => { c.setAttribute('cx', fx(xs[t])); c.setAttribute('cy', 9); });
      endA.setAttribute('x', fx(Math.max(0, xs[0] - 6)));
      endB.setAttribute('x', fx(xs[last] + 6));
      [endA, endB, now].forEach((s) => s.setAttribute('y', 30));
      render();
    }
    // 지금 자리(p, 0~마지막 기간)를 그립니다. p의 정수 부분이 지나온 기간, 소수 부분이 다음 기간까지 간 몫입니다.
    function render() {
      if (!W) return;
      const i0 = Math.min(Math.floor(p), last - 1), s = Math.max(0, Math.min(1, p - i0)), u = uOf(s), cur = Math.round(p);
      const hx = xs[i0] + (xs[i0 + 1] - xs[i0]) * s;
      items.forEach((it) => {
        let dpath = '', prev = -1, hy = null;
        for (let t = 0; t <= i0; t++) {
          const r = it.rk[t];
          it.dots[t].style.display = r ? '' : 'none';
          if (!r) { prev = -1; continue; }
          dpath += prev >= 0 && prev === t - 1 ? cut(xs[t - 1], Y(it.rk[t - 1]), xs[t], Y(r), 1).d : `M${fx(xs[t])},${fx(Y(r))}`;
          prev = t;
        }
        for (let t = i0 + 1; t < n; t++) it.dots[t].style.display = t === i0 + 1 && s >= 1 && it.rk[t] ? '' : 'none';
        const ra = it.rk[i0], rb = it.rk[i0 + 1];
        if (ra && rb) {
          const c = cut(xs[i0], Y(ra), xs[i0 + 1], Y(rb), u);
          if (s > 0) dpath += c.d;
          hy = c.e[1];
        } else if (ra && s < 0.5) hy = Y(ra);   // 다음 기간에 값이 없으면 선은 여기서 끝나고 점은 가운데쯤 사라집니다
        else if (!ra && rb && s >= 0.5) hy = Y(rb);   // 다음 기간에 처음 나오는 항목은 가운데쯤 나타납니다
        const hxi = !ra && rb ? xs[i0 + 1] : ra && !rb ? xs[i0] : hx;
        it.path.setAttribute('d', dpath);
        it.hy = hy;
        const on = hy != null;
        it.head.style.display = on ? '' : 'none';
        it.lab.style.display = on ? '' : 'none';
        if (!on) return;
        it.head.setAttribute('cx', fx(hxi));
        it.head.setAttribute('cy', fx(hy));
        it.lab.setAttribute('x', fx(hxi + 10));
        it.lab.setAttribute('y', fx(hy + 4));
        const rt = rankText(it.rk[cur] || ra || rb);
        if (it.labR.textContent !== rt) it.labR.textContent = rt;
      });
      // 앞지르는 동안 두 이름표가 겹치면, 짚을 항목 · 지금 순위가 높은 항목의 이름표를 남기고 다른 쪽은 잠시 옅게 둡니다.
      const placed = [];
      items.filter((it) => it.hy != null).sort((a, b) => b.focus - a.focus || (a.rk[cur] || N + 1) - (b.rk[cur] || N + 1)).forEach((it) => {
        const clash = placed.some((y) => Math.abs(y - it.hy) < 13);
        it.lab.classList.toggle('is-clash', clash);
        if (!clash) placed.push(it.hy);
      });
      // 구간 막대: 손잡이는 선 끝과 같은 가로 자리입니다. 지금 기간 이름이 처음 · 끝 이름과 겹치면 그쪽 이름을 감춥니다.
      fill.setAttribute('x2', fx(hx));
      ticks.forEach((c, t) => c.classList.toggle('is-past', t <= p + 1e-6));
      thumb.setAttribute('cx', fx(hx));
      thumb.setAttribute('cy', 9);
      halo.setAttribute('cx', fx(hx));
      halo.setAttribute('cy', 9);
      if (now.textContent !== labels[cur]) now.textContent = labels[cur];
      const nw = nowW / 2 + 2, nx = Math.max(nw - 2, Math.min(scrub.clientWidth - nw, hx));
      now.setAttribute('x', fx(nx));
      const aw = textW(labels[0], 400, fam, 11), bw = textW(labels[last], 400, fam, 11);
      endA.style.opacity = nx - nw < Math.max(0, xs[0] - 6) + aw + 8 ? 0 : 1;
      endB.style.opacity = nx + nw > xs[last] + 6 - bw - 8 ? 0 : 1;
      scrub.setAttribute('aria-valuenow', String(cur));
      scrub.setAttribute('aria-valuetext', `${labels[cur]}: ${focus.name} ${rankText(focus.rk[cur])}`);
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 흐릅니다. 카드가 페이지에서 빠지면 멈춥니다.
    // 기간 하나를 넘기는 시간 STEP, 처음 첫 기간을 읽는 시간 LEAD. 구간 막대로 옮길 때는 짧게 미끄러집니다(seek).
    const STEP = 520, LEAD = 700;
    const live = card.hasAttribute('data-vzb-live'), loop = !!card.closest('[data-vzb-loop]');
    const kept = labels.indexOf(card.getAttribute('data-vzb-period'));
    const holds = new Set();
    let p = kept >= 0 ? kept : last, playing = false, wait = 0, rest = 0, seek = null, seen = false, inView = false, took = false, raf = 0, stamp0 = 0;
    const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    let scan = 0;
    const busy = () => playing || seek || scan || rest > 0;
    const on = () => busy() && inView && !holds.size && card.isConnected;
    function setBtn() {
      btn.classList.toggle('is-on', playing);
      btn.setAttribute('aria-label', playing ? tx(d, '일시정지') : tx(d, '재생'));
    }
    // 짚을 항목 바꾸기: 색 · 굵기 · 선 끝 점 크기를 옮기고 그 선을 맨 위로 올립니다. 다시 그려도 이어 가도록 카드 요소에 적어 둡니다.
    function setFocus(it) {
      if (!it || it === focus) return;
      focus = it;
      items.forEach((x) => {
        x.focus = x === it;
        [x.line, x.head, x.lab].forEach((n2) => n2.classList.toggle('is-focus', x.focus));
        x.head.setAttribute('r', x.focus ? 5 : 4);
      });
      gLines.append(it.line);
      card.setAttribute('data-vzb-focus', it.name);
      const a = firstOf(it), b = lastOf(it);
      plot.setAttribute('aria-label', tx(d, '%1 순위 변화, %2–%3. %4: %5 → %6. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.',
        d.title || '', labels[0], labels[last], it.name, rankText(it.rk[a]), rankText(it.rk[b])));
      say.textContent = tx(d, '%s 강조', it.name);
      render();
    }
    function tick(stamp) {
      raf = 0;
      if (!on()) { stamp0 = 0; return; }
      const dt = stamp0 ? Math.min(100, stamp - stamp0) : 16;
      stamp0 = stamp;
      if (seek) {
        seek.t = Math.min(seek.dur, seek.t + dt);
        p = seek.from + (seek.to - seek.from) * easeInOut(seek.t / seek.dur);
        if (seek.t >= seek.dur) { p = seek.to; const then = seek.then; seek = null; if (then) then(); }
      } else if (scan) {
        p = Math.max(0, Math.min(last, p + (scan * dt) / (STEP / 3)));   // 누르고 있는 동안 재생의 세 배 빠르기로
      } else if (rest > 0) {
        rest -= dt;
        if (rest <= 0) { rest = 0; glide(0, 900, () => { wait = 500; playing = true; setBtn(); }); }   // 갤러리: 처음으로 감고 다시 재생
      } else if (playing) {
        if (wait > 0) wait -= dt;
        else p = Math.min(last, p + dt / STEP);
        if (p >= last) { playing = false; setBtn(); if (took) card.setAttribute('data-vzb-period', labels[last]); else if (loop) rest = 2600; }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    // q 자리로 dur 동안 미끄러집니다. then은 다 간 뒤에 부릅니다.
    function glide(q, dur, then) {
      if (dur <= 0) { p = q; seek = null; render(); if (then) then(); return; }
      seek = { from: p, to: q, t: 0, dur, then };
      stamp0 = 0;
      kick();
    }
    function play() {
      took = true;
      rest = 0;
      if (playing) { pickAt(p, 200); return; }   // 멈추면 가까운 기간에 자리를 잡습니다
      const go = () => { playing = true; wait = 0; setBtn(); kick(); };
      if (p >= last - 1e-6) glide(0, 600, () => { wait = 300; go(); });   // 끝에 있으면 처음으로 감고 재생합니다
      else go();
    }
    btn.addEventListener('click', play);
    // 사용자가 고른 기간: 재생을 멈추고, 다시 그려도 이어 가도록 카드 요소에 적어 둡니다.
    function pickAt(q, dur) {
      took = true;
      rest = 0;
      playing = false;
      setBtn();
      const t = Math.max(0, Math.min(last, Math.round(q)));
      card.setAttribute('data-vzb-period', labels[t]);
      glide(t, dur);
    }
    // 되감기 · 빨리 감기: 누르면 한 기간, 누르고 있으면 계속. 키보드(Enter · Space)는 한 기간씩입니다.
    [[rew, -1], [ff, 1]].forEach(([b, dir]) => {
      let timer = 0;
      const stop = () => {
        clearTimeout(timer);
        timer = 0;
        if (scan) { scan = 0; pickAt(p, 180); }
      };
      b.addEventListener('pointerdown', (e) => {
        if (e.button) return;
        b.setPointerCapture(e.pointerId);
        pickAt((seek ? seek.to : Math.round(p)) + dir, 220);
        timer = setTimeout(() => { timer = 0; seek = null; scan = dir; stamp0 = 0; kick(); }, 380);
      });
      b.addEventListener('pointerup', stop);
      b.addEventListener('pointercancel', stop);
      b.addEventListener('lostpointercapture', stop);
      b.addEventListener('click', (e) => { if (e.detail === 0) pickAt((seek ? seek.to : Math.round(p)) + dir, 220); });
    });
    // 구간 막대: 누르면 그 기간으로 미끄러지고, 끄는 동안은 손을 따라 기간 사이도 그립니다. 놓으면 가까운 기간에 멈춥니다.
    const qAt = (cx) => { const r = scrub.getBoundingClientRect(), x = cx - r.left; return Math.max(0, Math.min(last, ((x - xs[0]) / Math.max(1, xs[last] - xs[0])) * last)); };
    let drag = null;
    scrub.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      took = true; rest = 0; playing = false; setBtn(); seek = null;
      drag = { id: e.pointerId, moved: false };
      scrub.setPointerCapture(e.pointerId);
      scrub.classList.add('is-drag');
      const q = Math.round(qAt(e.clientX));
      glide(q, Math.min(260, 80 + Math.abs(q - p) * 40));
    });
    scrub.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.moved = true;
      seek = null;
      p = qAt(e.clientX);
      render();
    });
    const drop = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      scrub.classList.remove('is-drag');
      pickAt(seek ? seek.to : p, 200);
    };
    scrub.addEventListener('pointerup', drop);
    scrub.addEventListener('pointercancel', drop);
    scrub.addEventListener('keydown', (e) => {
      const base = seek ? seek.to : Math.round(p);
      const q = { ArrowRight: base + 1, ArrowUp: base + 1, ArrowLeft: base - 1, ArrowDown: base - 1, PageUp: base + 3, PageDown: base - 3, Home: 0, End: last }[e.key];
      if (q == null) return;
      e.preventDefault();
      pickAt(q, 260);
    });
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { holds.add('hover'); render(); } });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) { holds.add('focus'); render(); } });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 선을 짚으면 그 기간(지나온 기간 가운데 가장 가까운 기간)의 순위 · 값 · 앞 기간 대비 오르내림을 보이고 그 항목만 진하게 남깁니다.
    // 키보드는 그래프에 포커스한 뒤 위아래 화살표로 지금 기간의 순위 순서대로 옮깁니다.
    let tipT = null, tipIt = null;
    const ranked = (t) => items.filter((it) => it.rk[t]).sort((a, b) => a.rk[t] - b.rk[t]);
    interact(plot, () => ranked(Math.round(p)).length,
      (cx, cy) => {
        const r = plot.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, upto = Math.max(0, Math.round(p));
        let t = 0;
        for (let k = 0; k <= upto; k++) if (Math.abs(xs[k] - x) < Math.abs(xs[t] - x)) t = k;
        const list2 = ranked(t);
        if (!list2.length) return -1;
        let best = 0;
        list2.forEach((it, k) => { if (Math.abs(Y(it.rk[t]) - y) < Math.abs(Y(list2[best].rk[t]) - y)) best = k; });
        tipT = t;
        return ranked(Math.round(p)).indexOf(list2[best]);
      },
      (k) => {
        const t = tipT != null ? tipT : Math.round(p), it = ranked(Math.round(p))[k] || ranked(t)[k];
        tipT = null;
        tipIt = it;
        svg.classList.add('is-hover');
        items.forEach((x) => [x.line, x.head, x.lab].forEach((n2) => n2.classList.toggle('is-on', x === it)));
        const r = plot.getBoundingClientRect(), rk = it.rk[t], pv = t > 0 ? it.rk[t - 1] : 0;
        const mv = rk && pv ? pv - rk : 0;
        const note = [`${labels[t]} · ${show(f, it.vals[t])}`];
        if (t > 0 && rk && pv) note.push(`${mv > 0 ? tx(d, '%s계단 오름', mv) : mv < 0 ? tx(d, '%s계단 내림', -mv) : tx(d, '그대로')} · ${tx(d, '%s 대비', labels[t - 1])}`);
        const tb = tipBody({ value: rankText(rk), note }, it.name);
        return { x: r.left + xs[t], y: r.top + Y(rk || 1) - 8, label: it.name, value: tb.node, text: tb.text };
      },
      () => { tipIt = null; svg.classList.remove('is-hover'); items.forEach((x) => [x.line, x.head, x.lab].forEach((n2) => n2.classList.remove('is-on'))); },
      true);
    plot.addEventListener('click', () => setFocus(tipIt));
    plot.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && tipIt) { e.preventDefault(); setFocus(tipIt); } });

    setBtn();
    const auto = !live;
    if (auto) p = 0;
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); if (W) layout(W, H); });
    // 화면에 처음 보일 때 첫 기간에서 잠시 멈췄다가 재생합니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (auto && !took) { playing = true; wait = LEAD; setBtn(); } } };
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
