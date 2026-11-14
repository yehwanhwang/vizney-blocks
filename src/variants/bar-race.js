  // Bar - Race: 기간마다 값이 큰 순서로 막대를 다시 세워, 순위가 바뀌는 과정을 움직임으로 보여줍니다(막대 경주).
  // labels(기간)와 items [{ name, values }]만 적으면 기간 사이의 값을 이어 그리고, 순위가 바뀌면 두 막대가 자리를 맞바꾸며 지나갑니다.
  // 위에서부터 max개(비우면 8개)만 보이고, 밀려난 항목은 아래로 사라졌다가 다시 올라오면 나타납니다. 막대 길이는 그 순간의 1위가 폭을 다 쓰는 비율입니다.
  // focus 항목만 첫째 색, 나머지는 회색입니다. 비우거나 맞는 이름이 없으면 첫 기간보다 순위가 가장 많이 오른 항목(같으면 마지막 순위가 높은 항목)을 고릅니다.
  // 카드가 화면에 보이면 한 번 재생하고 마지막 기간에서 멈춥니다(기간 하나에 step 밀리초, 비우면 900). 재생 단추로 다시 보고, 아래 막대로 기간을 고릅니다.
  // 막대에 마우스를 올리거나 그래프에 포커스하면 잠시 멈추고 툴팁을 띄우며, 위아래 화살표로 그 순간의 순위를 짚습니다.
  // 동작 줄이기 설정에서는 재생하지 않고 마지막 기간을 그립니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 되풀이합니다.
  mount('bar-race', (card, d, f) => {
    const labels = (d.labels || []).map(String), P = labels.length;
    const items = (d.items || []).filter((it) => it && it.name != null && Array.isArray(it.values)).map((it, i) => {
      const v = labels.map((_, p) => (fin(it.values[p]) ? +it.values[p] : null));
      // 빈 기간은 앞 기간 값으로, 앞이 없으면 뒤 기간 값으로 채웁니다.
      for (let p = 1; p < P; p++) if (v[p] == null) v[p] = v[p - 1];
      for (let p = P - 2; p >= 0; p--) if (v[p] == null) v[p] = v[p + 1];
      return { i, name: String(it.name), v: v.map((x) => (x == null ? 0 : x)) };
    });
    if (!P || !items.length) throw new Error(tx(d, 'labels와 items를 확인하세요.'));
    const N = Math.max(1, Math.min(items.length, fin(d.max) ? Math.round(+d.max) : 8));
    const STEP = fin(d.step) && +d.step >= 200 ? +d.step : 900;
    // 기간 하나를 네 칸으로 나눠 칸마다 순위를 매기고, 칸 사이에서 자리를 옮깁니다. 앞지르는 막대는 한 칸(약 0.2초) 동안 자리를 바꾸므로 이름이 겹쳐 보이는 때가 짧습니다.
    const S = 4, K = (P - 1) * S + 1;
    const at = (it, t) => { const p = Math.min(P - 1, Math.floor(t)), g = t - p; return p >= P - 1 ? it.v[P - 1] : it.v[p] + (it.v[p + 1] - it.v[p]) * g; };
    const ranks = Array.from({ length: K }, (_, k) => {
      const r = [];
      items.slice().sort((a, b) => at(b, k / S) - at(a, k / S) || a.i - b.i).forEach((it, j) => { r[it.i] = j; });
      return r;
    });
    // 움직이는 동안 숫자 폭이 흔들리지 않게 예시 값의 소수 자릿수(최대 2)로 반올림해 적습니다.
    const dp = Math.min(2, Math.max(0, ...items.flatMap((it) => it.v.map((x) => (String(x).split('.')[1] || '').length))));
    const round = (x) => Math.round(x * 10 ** dp) / 10 ** dp;
    const climb = (it) => ranks[K - 1][it.i] - ranks[0][it.i];
    const focus = items.find((it) => d.focus != null && it.name === String(d.focus))
      || items.slice().sort((a, b) => climb(a) - climb(b) || ranks[K - 1][a.i] - ranks[K - 1][b.i])[0];

    head(card, d, f, null);
    const foot = el('div', 'vzb-foot vzb-fill vzb-rc');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%s 막대 경주, %s–%s, 항목 %s개. 위아래 화살표로 지금 순위를 짚고, 아래 막대로 기간을 고릅니다. 모든 값은 이어지는 표에 있습니다.', d.title || '', labels[0], labels[P - 1], items.length));
    const svg = svgEl('svg', { class: 'vzb-rc-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    const ctl = el('div', 'vzb-rc-ctl'), btn = el('button', 'vzb-rc-btn'), range = el('input', 'vzb-rc-range');
    btn.type = 'button';
    const ic = svgEl('svg', { class: 'vzb-rc-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    btn.append(ic);
    range.type = 'range';
    range.min = '0';
    range.max = String(Math.max(0, P - 1));
    range.step = '0.01';
    range.setAttribute('aria-label', tx(d, '기간'));
    const now = el('span', 'vzb-rc-now');   // 지금 기간. 낭독기는 기간 막대의 값(aria-valuetext)으로 읽습니다
    now.setAttribute('aria-hidden', 'true');
    ctl.append(btn, range, now);
    foot.append(plot, ctl);
    card.append(foot);
    // 화면 낭독기용 표: 항목마다 기간별 값
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, tx(d, '이름')), ...labels.map((l) => el('th', null, l)));
    table.append(el('caption', null, d.title || ''), hr);
    items.forEach((it) => { const tr = el('tr'); tr.append(el('th', null, it.name), ...it.v.map((x) => el('td', null, show(f, x)))); table.append(tr); });
    sr.append(table);
    card.append(sr);

    // 막대 한 줄: 이름(왼쪽 칸, 오른쪽 맞춤) · 막대(끝만 둥글게) · 값(막대 끝 뒤). 줄 묶음을 세로로 옮기고, 맨 아래 칸 밖으로 나가면 흐리게 지웁니다.
    const rowsG = svgEl('g', {});
    items.forEach((it) => {
      it.g = svgEl('g', { class: `vzb-rc-row${it === focus ? ' is-focus' : ''}` });
      it.bar = svgEl('path', { class: `vzb-rc-bar vzb-${it === focus ? 'f1' : 'f0'}` });
      it.nm = svgText(0, 0, it.name, 'vzb-rc-name', 'end');
      it.val = svgText(0, 0, '', 'vzb-rc-val');
      it.num = document.createTextNode('');
      it.unit = svgEl('tspan', { class: 'vzb-rc-unit', dx: 2 });
      it.val.replaceChildren(it.num, it.unit);
      it.g.append(it.bar, it.nm, it.val);
      rowsG.append(it.g);
    });
    svg.append(rowsG);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1);
    const barPath = (x, len, h) => {
      if (len < 0.5) return '';
      const r = Math.min(4, len, h / 2);
      return `M${fx(x)},0H${fx(x + len - r)}A${r},${r} 0 0 1 ${fx(x + len)},${fx(r)}V${fx(h - r)}A${r},${r} 0 0 1 ${fx(x + len - r)},${fx(h)}H${fx(x)}Z`;
    };
    let W = 0, H = 0, x0 = 0, span = 0, rowH = 0, bh = 0, top = 1, t = 0, lastP = -1;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // 이름 칸은 가장 긴 이름, 값 칸은 가장 큰 값의 글자 폭(값 12px 500, 단위 11px)
      x0 = Math.ceil(Math.max(...items.map((it) => textW(it.name, it === focus ? 700 : 400, fam)))) + 10;
      const [bt, bu] = f.parts(round(Math.max(...items.flatMap((it) => it.v))));
      const valW = Math.ceil(textW(bt, 700, fam) + (bu ? textW(bu, 400, fam, 11) + 2 : 0)) + 8;
      span = Math.max(1, w - x0 - valW);
      rowH = h / N;
      bh = Math.max(4, Math.min(24, Math.round(rowH * 0.64)));
      now.style.minWidth = `${Math.ceil(Math.max(...labels.map((l) => textW(l, 700, fam, 13))))}px`;   // 기간 글자 폭이 바뀌어도 기간 막대가 흔들리지 않게
      render();
    }
    function render() {
      if (!W) return;
      const s = Math.min(K - 1, t * S), k = Math.max(0, Math.min(K - 2, Math.floor(s))), e = K > 1 ? s - k : 0, g = e * e * (3 - 2 * e);   // 자리 바꿈은 처음과 끝을 느리게
      const ra = ranks[k], rb = ranks[Math.min(K - 1, k + 1)];
      top = Math.max(...items.map((it) => at(it, t))) || 1;
      items.forEach((it) => {
        const a = Math.min(ra[it.i], N), b = Math.min(rb[it.i], N);
        it.pos = a + (b - a) * g;
        it.now = at(it, t);
        it.len = Math.max(0, (it.now / top) * span);
        it.g.setAttribute('transform', `translate(0,${fx(it.pos * rowH + (rowH - bh) / 2)})`);
        it.g.setAttribute('opacity', fx(Math.max(0, Math.min(1, N - it.pos))));
        it.bar.setAttribute('d', barPath(x0, it.len, bh));
        it.nm.setAttribute('x', x0 - 8);
        it.nm.setAttribute('y', fx(bh / 2 + 4));
        const [n, u] = f.parts(round(it.now));
        it.num.data = n;
        it.unit.textContent = u || '';
        it.val.setAttribute('x', fx(x0 + it.len + 6));
        it.val.setAttribute('y', fx(bh / 2 + 4));
      });
      const p = Math.min(P - 1, Math.round(t));
      range.value = String(t);
      range.style.setProperty('--vzb-p', `${(P > 1 ? t / (P - 1) : 1) * 100}%`);
      if (p !== lastP) {
        lastP = p;
        now.textContent = labels[p];
        const lead = items.find((it) => ranks[p * S][it.i] === 0);
        range.setAttribute('aria-valuetext', tx(d, '%1, 1위 %2', labels[p], lead ? lead.name : ''));
      }
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 움직입니다. 카드가 페이지에서 빠지면 멈춥니다.
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, rest = 0, last = 0, raf = 0;
    const live = () => playing && inView && !holds.size && card.isConnected;
    const PATH = { play: 'M5.4 3.6v8.8l7-4.4z', pause: 'M4.6 3.6h2.4v8.8H4.6zM9 3.6h2.4v8.8H9z' };
    function setPlay(on) {
      playing = Boolean(on) && P > 1;
      const end = t >= P - 1 - 1e-6, kind = playing ? 'pause' : end ? 'replay' : 'play';
      ic.replaceChildren(...(kind === 'replay'
        ? [svgEl('path', { class: 'is-line', d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { class: 'is-line', d: 'M4.6 2.6v2.6h2.6' })]
        : [svgEl('path', { d: PATH[kind] })]));
      btn.setAttribute('aria-label', tx(d, kind === 'pause' ? '일시정지' : kind === 'replay' ? '처음부터 다시' : '재생'));
      kick();
    }
    function tick(now) {
      raf = 0;
      if (!live()) { last = 0; return; }
      const dt = last ? Math.min(100, now - last) : 16;
      last = now;
      if (rest > 0) { rest -= dt; if (rest <= 0) t = 0; }
      else {
        t = Math.min(P - 1, t + dt / STEP);
        if (t >= P - 1) { if (loop) rest = 1800; else setPlay(false); }
      }
      render();
      if (live()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && live()) raf = requestAnimationFrame(tick); }
    btn.addEventListener('click', () => {
      if (playing) { setPlay(false); return; }
      if (t >= P - 1 - 1e-6) t = 0;
      rest = 0;
      render();
      setPlay(true);
    });
    // 기간 막대: 끌면 그 자리를 그리고, 놓으면 가까운 기간에 맞춥니다. 화살표는 한 기간, Page Up · Down은 세 기간, Home · End는 처음과 끝입니다.
    const seek = (v) => { rest = 0; setPlay(false); t = Math.max(0, Math.min(P - 1, v)); render(); };
    range.addEventListener('input', () => seek(+range.value));
    range.addEventListener('change', () => seek(Math.round(t)));
    range.addEventListener('keydown', (e) => {
      const by = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -3, PageUp: 3 }[e.key];
      const to = by ? (by < 0 ? Math.ceil(t - 1e-6) : Math.floor(t + 1e-6)) + by : e.key === 'Home' ? 0 : e.key === 'End' ? P - 1 : null;
      if (to == null) return;
      e.preventDefault();
      seek(to);
    });
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 지금 보이는 막대를 위에서부터 짚습니다. 값은 그 순간의 값, 순위는 가까운 기간의 순위입니다.
    const shown = () => items.filter((it) => it.pos < N - 0.5).sort((a, b) => a.pos - b.pos);
    interact(plot, () => shown().length,
      (cx, cy) => {
        const r = plot.getBoundingClientRect(), list = shown(), y = cy - r.top;
        const hit = list.find((it) => Math.abs(y - (it.pos + 0.5) * rowH) <= rowH / 2);
        return hit ? list.indexOf(hit) : -1;
      },
      (k) => {
        const it = shown()[k], r = plot.getBoundingClientRect(), p = Math.min(P - 1, Math.round(t));
        svg.classList.add('is-hover');
        items.forEach((x) => x.g.classList.toggle('is-on', x === it));
        const tb = tipBody({ value: show(f, round(it.now)), note: tx(d, '%s %s위', labels[p], ranks[p * S][it.i] + 1) }, it.name);
        return { x: r.left + x0 + it.len, y: r.top + it.pos * rowH + (rowH - bh) / 2, label: it.name, value: tb.node, text: tb.text, side: true };
      },
      () => { svg.classList.remove('is-hover'); items.forEach((x) => x.g.classList.remove('is-on')); },
      true, true);

    t = reduce ? P - 1 : 0;
    btn.hidden = reduce;
    setPlay(false);
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 재생합니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!reduce && P > 1) { t = 0; setPlay(true); } } };
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
