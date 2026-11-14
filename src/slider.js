  /* 범위 슬라이더(컨트롤 공통): 손잡이 둘로 범위를 고릅니다. 위 줄에 고른 범위를 적고, 분포(hist)를 주면 트랙 위에 막대로 그려
     고른 범위 안의 막대만 글자색으로 채우고, 안에 든 개수를 굴러가는 숫자로 적습니다. 손잡이가 지나가며 막대가 범위에 들어오면
     살짝 솟았다 내려앉고 나가면 살짝 꺼져, 끄는 동안 어느 구간의 데이터가 들어오고 나가는지 보입니다.
     cfg: { n: 칸 수(자리는 0…n), text(i): 그 자리의 글자, value(i): 이벤트로 보내는 값, start: [앞, 뒤] 자리, aria: [앞 손잡이 이름, 뒤 손잡이 이름],
            hist: { counts: min~max를 같은 폭으로 나눈 칸마다의 개수, min, max, noun: 개수 뒤에 붙는 말 } }(hist가 있으면 value(i)는 숫자)
     값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value: [시작, 끝] })를 보내고, 카드의 data-vzb-value에 같은 값을 적습니다.
     조작: 손잡이를 끌거나, 막대 · 트랙을 눌러 가까운 손잡이를 옮기거나, 손잡이에 포커스한 뒤 화살표(한 칸) · Page Up/Down(열 칸쯤) · Home/End로 옮깁니다.
     두 손잡이는 같은 칸까지 만날 수 있고, 겹쳐 있을 때는 끄는 방향의 손잡이가 움직입니다. 손잡이는 용수철로 따라갑니다.
     동작 줄이기 설정에서는 바로 옮기고 막대도 솟지 않습니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 몇 가지 범위를 차례로 보여 줍니다. */
  function slider(card, d, f, cfg) {
    head(card, d, f, null);
    const n = cfg.n, R = 8, hist = cfg.hist && cfg.hist.counts.length ? cfg.hist : null;   // R: 손잡이 반지름. 트랙과 막대는 양 끝에서 그만큼 들어옵니다.
    let lo = cfg.start[0], hi = cfg.start[1];
    const foot = el('div', 'vzb-foot vzb-sl'), read = el('div', 'vzb-sl-read'), val = el('span', 'vzb-sl-val'), say = el('p', 'vzb-sr');
    say.setAttribute('aria-live', 'polite');
    read.append(val);
    let count = null, countSr = null;   // 굴러가는 숫자는 화면 낭독기에서 숨기고, 같은 개수를 글자로 따로 둡니다
    if (hist) {
      const c = el('span', 'vzb-sl-count'), noun = el('span', null, hist.noun ? (f.lang === 'en' ? ' ' : '') + hist.noun : '');
      count = el('span', 'vzb-rl');
      countSr = el('span', 'vzb-sr');
      noun.setAttribute('aria-hidden', 'true');
      c.append(countSr, count, noun);
      read.append(c);
    }
    const area = el('div', 'vzb-sl-area');
    area.setAttribute('data-vzb-input', '');
    let bars = [];
    if (hist) {
      const box = el('div', 'vzb-sl-hist'), peak = Math.max(1, ...hist.counts);
      box.setAttribute('aria-hidden', 'true');
      bars = hist.counts.map((c) => { const b = el('i', 'vzb-sl-bar'); b.style.height = `${Math.max(6, (Math.max(0, +c || 0) / peak) * 100)}%`; box.append(b); return b; });
      area.append(box);
    }
    const knob = (name) => {
      const k = el('span', 'vzb-sl-thumb');
      k.tabIndex = 0;
      k.setAttribute('role', 'slider');
      k.setAttribute('aria-label', name);
      k.setAttribute('aria-valuemin', 0);
      k.setAttribute('aria-valuemax', n);
      return k;
    };
    const rail = el('div', 'vzb-sl-rail'), fill = el('span', 'vzb-sl-fill'), A = knob(cfg.aria[0]), B = knob(cfg.aria[1]);
    rail.append(el('span', 'vzb-sl-track'), fill, A, B);
    area.append(rail);
    foot.append(read, area);
    if (!hist) {
      const ends = el('div', 'vzb-sl-ends');
      ends.append(el('span', null, cfg.text(0)), el('span', null, cfg.text(n)));
      foot.append(ends);
    }
    foot.append(say);
    card.append(foot);

    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // 막대가 범위에 드는지와 범위 안의 개수: 칸이 범위에 걸친 만큼 나눠 셉니다(step을 칸 폭에 맞추면 정확히 셉니다).
    const width = hist ? (hist.max - hist.min) / bars.length : 1;
    const inRange = (i, a, b) => { const c = hist.min + width * (i + 0.5); return c >= a && c <= b; };
    const counted = (a, b) => hist.counts.reduce((s, c, i) => {
      const x0 = hist.min + width * i, x1 = x0 + width;
      return s + (Math.max(0, +c || 0) * Math.max(0, Math.min(x1, b) - Math.max(x0, a))) / width;
    }, 0);
    let mover = null;   // 막 움직인 손잡이: 막대가 그 손잡이에서 가까운 차례로 솟습니다
    function paintBars(first) {
      const a = cfg.value(lo), b = cfg.value(hi), changed = [];
      bars.forEach((bar, i) => {
        const on = inRange(i, a, b);
        if (bar.classList.contains('is-in') !== on) { bar.classList.toggle('is-in', on); changed.push([bar, on, i]); }
      });
      if (first || reduce || !bars[0] || !bars[0].animate) return;
      const from = mover === A ? lo : hi;
      changed.sort((p, q) => Math.abs(p[2] - (from / n) * bars.length) - Math.abs(q[2] - (from / n) * bars.length))
        .forEach(([bar, on], k) => bar.animate(on ? [{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.22)' }, { transform: 'scaleY(1)' }] : [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.82)' }, { transform: 'scaleY(1)' }],
          { duration: on ? 340 : 260, delay: Math.min(220, k * 24), easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }));
    }
    let sayT = 0;
    function write(first) {
      const a = cfg.text(lo), b = cfg.text(hi), words = lo === hi ? a : `${a} – ${b}`;
      val.textContent = words;
      A.setAttribute('aria-valuenow', lo);
      A.setAttribute('aria-valuetext', a);
      B.setAttribute('aria-valuenow', hi);
      B.setAttribute('aria-valuetext', b);
      let tail = '';
      if (hist) {
        const c = num(Math.round(counted(cfg.value(lo), cfg.value(hi))), 0);
        roll(count, c);
        tail = `, ${c}${hist.noun ? (f.lang === 'en' ? ' ' : '') + hist.noun : ''}`;
        countSr.textContent = tail.slice(2);
        paintBars(first);
      }
      if (first) return;
      clearTimeout(sayT);
      sayT = setTimeout(() => { say.textContent = words + tail; }, 500);
    }
    function emit(quiet) {
      const value = [cfg.value(lo), cfg.value(hi)];
      card.setAttribute('data-vzb-value', JSON.stringify(value));
      if (!quiet) card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value } }));
    }
    function set(a, b) {
      if (a === lo && b === hi) return;
      lo = a; hi = b;
      write();
      emit();
    }

    // 손잡이의 가로 자리(px)는 용수철 둘이 따라갑니다. k는 세기, c는 잦아드는 힘입니다.
    const spring = (k, c) => ({ x: 0, v: 0, t: 0, k, c });
    const sa = spring(340, 26), sb = spring(340, 26), both = [sa, sb];
    const held = (s) => { s.k = 1000; s.c = 63; };   // 끄는 동안: 넘치지 않고 손가락에 붙습니다
    const freed = (s) => { s.k = 340; s.c = 26; };    // 놓은 뒤 · 키보드: 살짝 넘쳤다 자리를 잡습니다
    let W = 0, drag = null, raf = 0, last = 0, idle = 0;
    const pos = (i) => R + (i / n) * Math.max(1, W - 2 * R);
    const at = (x) => Math.round(((x - R) / Math.max(1, W - 2 * R)) * n);
    function draw() {
      A.style.transform = `translateX(${sa.x.toFixed(2)}px)`;
      B.style.transform = `translateX(${sb.x.toFixed(2)}px)`;
      fill.style.transform = `translateX(${sa.x.toFixed(2)}px) scaleX(${Math.max(0, sb.x - sa.x).toFixed(2)})`;
    }
    function frame(now) {
      raf = 0;
      if (!card.isConnected) return;
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016) / 4;
      last = now;
      for (let i = 0; i < 4; i++) both.forEach((s) => { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt; s.x += s.v * dt; });
      draw();
      if (drag || both.some((s) => Math.abs(s.x - s.t) > 0.05 || Math.abs(s.v) > 1)) raf = requestAnimationFrame(frame);
      else { jump(); last = 0; }
    }
    function jump() { both.forEach((s) => { s.x = s.t; s.v = 0; }); draw(); }
    const wake = () => { if (reduce) jump(); else if (!raf) raf = requestAnimationFrame(frame); };
    function rest() { freed(sa); freed(sb); sa.t = pos(lo); sb.t = pos(hi); wake(); }

    // 끌기: 조작 영역 어디를 눌러도 가까운 손잡이가 따라옵니다. 두 손잡이가 같은 자리면 끄는 방향으로 정합니다.
    const local = (e) => e.clientX - area.getBoundingClientRect().left;
    function move(x) {
      if (!drag.who) {
        if (Math.abs(x - drag.x) < 2) return;
        drag.who = x > drag.x ? B : A;
      }
      const first = drag.who === A, s = first ? sa : sb;
      mover = drag.who;
      if (!drag.held) { drag.held = true; held(s); }
      const px = Math.max(R, Math.min(W - R, x - drag.off));
      s.t = first ? Math.min(px, sb.t) : Math.max(px, sa.t);
      if (first) set(Math.min(at(s.t), hi), hi); else set(lo, Math.max(at(s.t), lo));
      wake();
    }
    area.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      const x = local(e), da = Math.abs(x - sa.t), db = Math.abs(x - sb.t);
      drag = { x, who: da < db ? A : db < da ? B : x > sb.t ? B : x < sa.t ? A : null };
      drag.off = Math.min(da, db) <= R + 2 ? x - (da <= db ? sa.t : sb.t) : 0;   // 손잡이를 잡았으면 잡은 자리를 지키고, 막대 · 트랙을 눌렀으면 손잡이가 그리로 옵니다
      idle = Infinity;
      area.classList.add('is-drag');
      area.setPointerCapture(e.pointerId);
      move(x);
    });
    area.addEventListener('pointermove', (e) => { if (drag) move(local(e)); });
    const drop = () => {
      if (!drag) return;
      drag = null;
      idle = performance.now() + 6000;
      area.classList.remove('is-drag');
      rest();
    };
    area.addEventListener('pointerup', drop);
    area.addEventListener('pointercancel', drop);
    // 키보드: 화살표는 한 칸, Page Up · Down은 열 칸쯤, Home · End는 갈 수 있는 끝(다른 손잡이를 넘지 않습니다)
    const keys = (first) => (e) => {
      const big = Math.max(1, Math.round(n / 10));
      const by = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: big, PageDown: -big }[e.key];
      let v = first ? lo : hi;
      if (by) v += by; else if (e.key === 'Home') v = first ? 0 : lo; else if (e.key === 'End') v = first ? hi : n; else return;
      e.preventDefault();
      idle = performance.now() + 6000;
      mover = first ? A : B;
      if (first) set(Math.max(0, Math.min(hi, v)), hi); else set(lo, Math.max(lo, Math.min(n, v)));
      rest();
    };
    A.addEventListener('keydown', keys(true));
    B.addEventListener('keydown', keys(false));

    write(true);
    emit(true);
    onSize(rail, (w) => { W = w; sa.t = pos(lo); sb.t = pos(hi); jump(); });

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 몇 가지 범위를 차례로 보여 줍니다.
    if (!reduce && card.closest('[data-vzb-loop]')) {
      const s0 = [lo / n, hi / n], plan = [[0.08, 0.36], [0.24, 0.72], [0.04, 0.52], [0.44, 0.92], s0];
      let k = 0, seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (drag || !seen || !W || performance.now() < idle) return;
        const p = plan[k++ % plan.length], a = Math.round(p[0] * n), b = Math.max(a, Math.round(p[1] * n));
        mover = Math.abs(a - lo) >= Math.abs(b - hi) ? A : B;
        set(a, b);
        rest();
      }, 1800);
    }
  }
