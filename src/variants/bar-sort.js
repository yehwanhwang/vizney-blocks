  // Bar - Sort: 항목을 큰 순서로 다시 세우고 한 항목을 짚어 "누가 가장 높은가 · 낮은가"에 답합니다.
  // ask에 질문의 종류(highest · lowest)를 적으면 카드가 값에서 그 항목을 찾아 첫째 색으로 짚습니다. 누구인지를 적지 않으므로 답이 데이터와 어긋날 수 없습니다.
  // 계산으로 정해지지 않는 항목은 focus에 이름을 적습니다(ask보다 먼저 봅니다). 이름이 items에 없으면 그리지 않고 오류를 보입니다. 둘 다 비우면 정렬만 합니다.
  // 움직임은 받은 순서 → 정렬 → 짚기와 평균 점선 → 답 한 줄 순서로 약 2.5초입니다. 한 번에 하나만 움직여 무엇이 바뀌는지 따라갈 수 있게 합니다.
  // 답 한 줄(순위와 평균과의 차이)은 카드가 계산합니다. 비율 지표(pct)의 차이는 %p입니다. 나머지 항목은 회색으로 남겨 읽는 사람이 답을 확인할 수 있습니다.
  // 항목이 max(비우면 8)개를 넘으면 정렬한 뒤 짚은 항목 쪽 max개만 남깁니다. 성장률처럼 음수가 섞인 값은 0선을 긋고 왼쪽으로 그립니다.
  // 카드가 화면에 보이면 한 번 움직이고 답이 적힌 마지막 장면에서 멈춥니다. 다시 보기 단추로 되풀이합니다.
  // 동작 줄이기 설정에서는 움직이지 않고 마지막 장면을 그립니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('bar-sort', (card, d, f) => {
    const items = (d.items || []).filter((it) => it && it.name != null && fin(it.value)).map((it, i) => ({ i, name: String(it.name), v: +it.value }));
    const n = items.length;
    if (!n) throw new Error(tx(d, 'items를 확인하세요.'));
    if (d.ask != null && d.ask !== 'highest' && d.ask !== 'lowest') throw new Error(tx(d, 'ask에는 highest나 lowest를 적으세요.'));
    const sorted = items.slice().sort((a, b) => b.v - a.v || a.i - b.i);
    sorted.forEach((it, k) => { it.rank = k; });
    let focus = null;
    if (d.focus != null) {
      focus = items.find((it) => it.name === String(d.focus));
      if (!focus) throw new Error(tx(d, 'focus의 이름이 items에 없습니다: %s', d.focus));
    } else if (d.ask === 'highest') focus = sorted[0];
    else if (d.ask === 'lowest') focus = sorted[n - 1];
    const N = Math.max(1, Math.min(n, fin(d.max) && +d.max >= 1 ? Math.round(+d.max) : 8));
    // 항목이 N개를 넘으면 정렬한 뒤 짚은 항목이 들어가는 N줄만 남깁니다.
    const win0 = !focus ? 0 : Math.max(0, Math.min(n - N, focus.rank - (focus.rank === 0 ? 0 : focus.rank === n - 1 ? N - 1 : Math.floor(N / 2))));
    const avg = items.reduce((s, it) => s + it.v, 0) / n;
    // 막대는 0에서 시작합니다. 음수가 있으면 0선을 가운데 두고 양쪽으로 그립니다.
    const lo = Math.min(0, ...items.map((it) => it.v)), hi = Math.max(0, ...items.map((it) => it.v)), range = hi - lo || 1;

    // 답 한 줄: 순위와 평균과의 차이. 모두 카드가 계산합니다.
    let answer = '';
    if (focus) {
      const diff = focus.v - avg, same = Math.abs(diff) < 1e-9;
      const place = n > 1 && focus === sorted[0] ? tx(d, '%s개 중 가장 높음', n)
        : n > 1 && focus.v === sorted[n - 1].v ? tx(d, '%s개 중 가장 낮음', n)
          : tx(d, '%1개 중 %2번째', n, focus.rank + 1);
      // 차이: 비율 지표는 %p, 그 밖에는 평균 대비 %. 평균이 0 이하면(음수가 섞인 값) 비율이 뜻을 잃으므로 차이 값을 그대로 적습니다.
      const gap = !f.rel ? tx(f, '%s%p', pp(f, diff)) : avg > 0 && lo >= 0 ? `${num(Math.abs(diff / avg) * 100, 1)}%` : show(f, Math.abs(diff));
      answer = `${place} · ${same ? tx(d, '평균과 같음') : tx(d, diff > 0 ? '평균보다 %s 높음' : '평균보다 %s 낮음', gap)}`;
    }

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-st');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%s. %s 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', focus ? `${focus.name}: ${show(f, focus.v)}, ${answer}.` : ''));
    const svg = svgEl('svg', { class: 'vzb-st-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-st-ctl'), btn = el('button', 'vzb-st-btn'), ans = el('p', 'vzb-st-ans');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-st-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    if (answer) ans.append(el('i', 'vzb-st-key vzb-f1'), answer);
    ctl.append(btn, ans);
    foot.append(plot, ctl);
    card.append(foot);
    // 화면 낭독기용 표: 큰 순서로 이름과 값
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, tx(d, '이름')), el('th', null, tx(d, '값')));
    table.append(el('caption', null, d.title || ''), hr);
    sorted.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), el('td', null, show(f, it.v))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 막대 한 줄: 이름(왼쪽 칸, 오른쪽 맞춤) · 막대(끝만 둥글게) · 값(막대 끝 뒤). 짚는 줄은 회색 막대 위에 첫째 색 막대를 겹쳐 서서히 드러냅니다.
    // 막대와 글자를 다른 층에 둡니다. 평균 점선이 막대 위, 글자 아래로 지나가 숫자를 가리지 않습니다.
    const rowsG = svgEl('g', {}), labelsG = svgEl('g', {});
    items.forEach((it) => {
      it.g = svgEl('g', { class: 'vzb-st-row' });
      it.lg = svgEl('g', { class: 'vzb-st-row' });
      it.bar = svgEl('path', { class: 'vzb-st-bar vzb-f0' });
      it.g.append(it.bar);
      if (it === focus) { it.on = svgEl('path', { class: 'vzb-st-bar vzb-f1' }); it.g.append(it.on); }
      it.nm = svgText(0, 0, it.name, 'vzb-st-name', 'end');
      it.val = svgText(0, 0, '', 'vzb-st-val');
      const [t, u] = f.parts(it.v);
      it.val.append(t);
      if (u) { const s = svgEl('tspan', { class: 'vzb-st-unit', dx: 2 }); s.textContent = u; it.val.append(s); }
      it.lg.append(it.nm, it.val);
      rowsG.append(it.g);
      labelsG.append(it.lg);
    });
    // 평균: 세로 점선과 이름표. 짚는 순간에 위에서 아래로 그어집니다.
    const avgLine = svgEl('line', { class: 'vzb-st-avg' }), avgText = svgText(0, 0, `${tx(d, '평균')} ${show(f, avg)}`, 'vzb-st-avg-t', 'middle');
    const zero = svgEl('line', { class: 'vzb-st-zero' });
    svg.append(zero, rowsG, avgLine, avgText, labelsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1);
    // 0선에서 시작해 끝만 둥근 막대. len이 음수면 왼쪽으로 그립니다.
    const barPath = (x, len, h) => {
      const a = Math.abs(len), g = len < 0 ? -1 : 1;
      if (a < 0.5) return '';
      const r = Math.min(4, a, h / 2), sw = g > 0 ? 1 : 0;
      return `M${fx(x)},0H${fx(x + len - g * r)}A${r},${r} 0 0 ${sw} ${fx(x + len)},${fx(r)}V${fx(h - r)}A${r},${r} 0 0 ${sw} ${fx(x + len - g * r)},${fx(h)}H${fx(x)}Z`;
    };
    // 시간표(밀리초): 받은 순서로 잠깐 → 정렬 → 짚기 → 답
    const T = { sort: 700, sorted: 1500, mark: 1700, marked: 2200, end: 2500 };
    const PAD = 16;   // 평균 이름표 자리
    const ease = (e) => e * e * (3 - 2 * e), clamp = (v) => Math.max(0, Math.min(1, v));
    let W = 0, H = 0, x0 = 0, zx = 0, span = 0, rowH = 0, bh = 0, t = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // 이름 칸은 가장 긴 이름, 값 칸은 가장 긴 값의 글자 폭(값 12px, 단위 11px)
      x0 = Math.ceil(Math.max(...items.map((it) => textW(it.name, it === focus ? 700 : 400, fam)))) + 10;
      const valW = Math.ceil(Math.max(...items.map((it) => { const [a, u] = f.parts(it.v); return textW(a, 700, fam) + (u ? textW(u, 400, fam, 11) + 2 : 0); }))) + 8;
      // 음수 막대의 값은 막대 왼쪽에 적으므로 그 자리를 따로 둡니다.
      const left = lo < 0 ? valW : 0;
      span = Math.max(1, w - x0 - left - valW);
      zx = x0 + left + (-lo / range) * span;
      rowH = (h - PAD) / N;
      bh = Math.max(4, Math.min(24, Math.round(rowH * 0.64)));
      items.forEach((it) => {
        const len = (it.v / range) * span;
        it.len = len;
        it.bar.setAttribute('d', barPath(zx, len, bh));
        if (it.on) it.on.setAttribute('d', barPath(zx, len, bh));
        it.nm.setAttribute('x', x0 - 8);
        it.nm.setAttribute('y', fx(bh / 2 + 4));
        it.val.setAttribute('text-anchor', it.v < 0 ? 'end' : 'start');
        it.val.setAttribute('x', fx(zx + len + (it.v < 0 ? -6 : 6)));
        it.val.setAttribute('y', fx(bh / 2 + 4));
      });
      zero.setAttribute('x1', fx(zx));
      zero.setAttribute('x2', fx(zx));
      zero.setAttribute('y1', PAD);
      zero.setAttribute('y2', h);
      zero.setAttribute('opacity', lo < 0 ? 1 : 0);
      const ax = zx + (avg / range) * span, tw = textW(avgText.textContent, 400, fam, 11) / 2;
      avgLine.setAttribute('x1', fx(ax));
      avgLine.setAttribute('x2', fx(ax));
      avgLine.setAttribute('y1', PAD - 2);
      avgText.setAttribute('x', fx(Math.max(tw, Math.min(w - tw, ax))));
      avgText.setAttribute('y', 9);
      render();
    }
    function render() {
      if (!W) return;
      const p1 = ease(clamp((t - T.sort) / (T.sorted - T.sort))), p2 = clamp((t - T.mark) / (T.marked - T.mark)), p3 = clamp((t - T.marked) / (T.end - T.marked));
      items.forEach((it) => {
        it.pos = it.i + (it.rank - win0 - it.i) * p1;
        const at = `translate(0,${fx(PAD + it.pos * rowH + (rowH - bh) / 2)})`, op = fx(clamp(Math.min(it.pos + 1, N - it.pos)));
        [it.g, it.lg].forEach((g) => { g.setAttribute('transform', at); g.setAttribute('opacity', op); });
        if (it.on) { it.on.setAttribute('opacity', fx(p2)); it.lg.classList.toggle('is-focus', p2 > 0.5); }
      });
      const show2 = focus ? p2 : p1;   // 짚을 항목이 없으면 평균은 정렬과 함께 나타납니다
      avgLine.setAttribute('y2', fx(PAD - 2 + (H - PAD + 2) * ease(show2)));
      avgLine.setAttribute('opacity', fx(show2));
      avgText.setAttribute('opacity', fx(show2));
      ans.style.opacity = fx(p3);
      ans.style.transform = `translateY(${fx((1 - p3) * 4)}px)`;
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    const live = () => playing && inView && !holds.size && card.isConnected;
    function tick(now) {
      raf = 0;
      if (!live()) { last = 0; return; }
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(T.end, t + dt);
        if (t >= T.end) { if (loop) rest = 2800; else playing = false; }
      }
      render();
      if (live()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && live()) raf = requestAnimationFrame(tick); }
    function play() { t = 0; rest = 0; last = 0; playing = true; render(); kick(); }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 지금 보이는 막대를 위에서부터 짚습니다.
    const shown = () => items.filter((it) => it.pos > -0.5 && it.pos < N - 0.5).sort((a, b) => a.pos - b.pos);
    interact(plot, () => shown().length,
      (cx, cy) => {
        const r = plot.getBoundingClientRect(), list = shown(), y = cy - r.top - PAD;
        const hit = list.find((it) => Math.abs(y - (it.pos + 0.5) * rowH) <= rowH / 2);
        return hit ? list.indexOf(hit) : -1;
      },
      (k) => {
        const it = shown()[k], r = plot.getBoundingClientRect();
        svg.classList.add('is-hover');
        items.forEach((x) => [x.g, x.lg].forEach((g) => g.classList.toggle('is-on', x === it)));
        const tb = tipBody({ value: show(f, it.v), note: tx(d, '%1개 중 %2번째', n, it.rank + 1) }, it.name);
        return { x: r.left + zx + it.len, y: r.top + PAD + it.pos * rowH + (rowH - bh) / 2, label: it.name, value: tb.node, text: tb.text, side: true };
      },
      () => { svg.classList.remove('is-hover'); items.forEach((x) => [x.g, x.lg].forEach((g) => g.classList.remove('is-on'))); },
      true, true);

    t = reduce ? T.end : 0;
    btn.hidden = reduce;
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!reduce) play(); } };
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
