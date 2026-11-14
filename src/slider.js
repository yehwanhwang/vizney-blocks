  /* 범위 슬라이더(컨트롤 공통): 손잡이 둘로 범위를 고릅니다. 값은 손잡이 위 말풍선에 늘 적혀 있고, 두 말풍선이 겹칠 만큼
     가까워지면 '시작 – 끝' 하나로 합쳐집니다. 손잡이는 용수철로 값을 따라가고, 말풍선은 움직이는 쪽으로 기웁니다.
     cfg: { n: 칸 수(자리는 0…n), text(i): 그 자리의 글자, value(i): 이벤트로 보내는 값, start: [앞, 뒤] 자리, aria: [앞 손잡이 이름, 뒤 손잡이 이름] }
     값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value: [시작, 끝] })를 보내고, 카드의 data-vzb-value에 같은 값을 적습니다.
     조작: 손잡이를 끌거나, 트랙을 눌러 가까운 손잡이를 옮기거나, 손잡이에 포커스한 뒤 화살표(한 칸) · Page Up/Down(열 칸쯤) · Home/End로 옮깁니다.
     두 손잡이는 같은 칸까지 만날 수 있고, 겹쳐 있을 때는 끄는 방향의 손잡이가 움직입니다.
     동작 줄이기 설정에서는 용수철 없이 바로 옮깁니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 몇 가지 범위를 차례로 보여 줍니다. */
  function slider(card, d, f, cfg) {
    head(card, d, f, null);
    const n = cfg.n, R = 10;   // R: 손잡이 반지름. 손잡이가 카드 안쪽에 머물도록 트랙 양 끝에서 그만큼 들어옵니다.
    let lo = cfg.start[0], hi = cfg.start[1];
    const foot = el('div', 'vzb-foot vzb-sl'), area = el('div', 'vzb-sl-area'), ends = el('div', 'vzb-sl-ends');
    area.setAttribute('data-vzb-input', '');
    const bubble = () => { const b = el('span', 'vzb-sl-tip'); b.setAttribute('aria-hidden', 'true'); return b; };
    const knob = (name) => {
      const k = el('span', 'vzb-sl-thumb');
      k.tabIndex = 0;
      k.setAttribute('role', 'slider');
      k.setAttribute('aria-label', name);
      k.setAttribute('aria-valuemin', 0);
      k.setAttribute('aria-valuemax', n);
      return k;
    };
    const ta = bubble(), tb = bubble(), tm = bubble(), A = knob(cfg.aria[0]), B = knob(cfg.aria[1]);
    const fill = el('span', 'vzb-sl-fill');
    ends.append(el('span', null, cfg.text(0)), el('span', null, cfg.text(n)));
    area.append(ta, tb, tm, el('span', 'vzb-sl-track'), fill, A, B);
    foot.append(area, ends);
    card.append(foot);

    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // 용수철 셋: 앞 손잡이 · 뒤 손잡이의 가로 자리(px)와 말풍선이 합쳐진 정도(0…1). k는 세기, c는 잦아드는 힘입니다.
    const spring = (k, c) => ({ x: 0, v: 0, t: 0, k, c });
    const sa = spring(320, 24), sb = spring(320, 24), sm = spring(340, 30), all = [sa, sb, sm];
    const held = (s) => { s.k = 1000; s.c = 63; };   // 끄는 동안: 넘치지 않고 손가락에 붙습니다
    const freed = (s) => { s.k = 320; s.c = 24; };    // 놓은 뒤 · 키보드: 한 번 살짝 넘쳤다 자리를 잡습니다
    let W = 0, wa = 0, wb = 0, wm = 0, drag = null, raf = 0, last = 0, idle = 0;
    const pos = (i) => R + (i / n) * Math.max(1, W - 2 * R);
    const at = (x) => Math.round(((x - R) / Math.max(1, W - 2 * R)) * n);
    const mid = (w, x) => Math.max(w / 2, Math.min(W - w / 2, x));   // 말풍선 가운데는 카드 안쪽에 머뭅니다

    function emit(quiet) {
      const value = [cfg.value(lo), cfg.value(hi)];
      card.setAttribute('data-vzb-value', JSON.stringify(value));
      if (!quiet) card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value } }));
    }
    function write() {
      const a = cfg.text(lo), b = cfg.text(hi);
      ta.textContent = a;
      tb.textContent = b;
      tm.textContent = lo === hi ? a : `${a} – ${b}`;
      wa = ta.offsetWidth; wb = tb.offsetWidth; wm = tm.offsetWidth;
      A.setAttribute('aria-valuenow', lo);
      A.setAttribute('aria-valuetext', a);
      B.setAttribute('aria-valuenow', hi);
      B.setAttribute('aria-valuetext', b);
    }
    function set(a, b) {
      if (a === lo && b === hi) return;
      lo = a; hi = b;
      write();
      emit();
    }
    const place = (node, w, x, v, o, k) => {
      const lean = Math.max(-10, Math.min(10, -v * 0.018));   // 빠를수록 움직이는 쪽으로 기웁니다
      node.style.opacity = o.toFixed(3);
      node.style.transform = `translateX(${(mid(w, x) - w / 2).toFixed(2)}px) rotate(${lean.toFixed(2)}deg) scale(${k.toFixed(3)})`;
    };
    function draw() {
      const xa = sa.x, xb = sb.x, m = Math.max(0, Math.min(1, sm.x)), c = (xa + xb) / 2;
      A.style.transform = `translateX(${xa.toFixed(2)}px)`;
      B.style.transform = `translateX(${xb.toFixed(2)}px)`;
      fill.style.transform = `translateX(${xa.toFixed(2)}px) scaleX(${Math.max(0, xb - xa).toFixed(2)})`;
      // 따로 있던 두 말풍선은 가운데로 모이며 옅어지고, 합친 말풍선이 그 자리에서 커집니다.
      place(ta, wa, xa + (c - xa) * m, sa.v, 1 - m, 1 - 0.2 * m);
      place(tb, wb, xb + (c - xb) * m, sb.v, 1 - m, 1 - 0.2 * m);
      place(tm, wm, c, (sa.v + sb.v) / 2, m, 0.8 + 0.2 * m);
    }
    // 두 말풍선이 서로 닿을 만큼 가까우면 합칩니다(카드 끝에 걸려 밀린 자리까지 따집니다).
    const near = () => mid(wb, sb.x) - mid(wa, sa.x) < (wa + wb) / 2 + 6;
    function frame(now) {
      raf = 0;
      if (!card.isConnected) return;
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016) / 4;
      last = now;
      sm.t = near() ? 1 : 0;
      for (let i = 0; i < 4; i++) all.forEach((s) => { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt; s.x += s.v * dt; });
      draw();
      if (drag || Math.abs(sa.x - sa.t) > 0.05 || Math.abs(sb.x - sb.t) > 0.05 || Math.abs(sm.x - sm.t) > 0.004 || Math.abs(sa.v) + Math.abs(sb.v) > 1) raf = requestAnimationFrame(frame);
      else { jump(); last = 0; }
    }
    function jump() {   // 용수철 없이 제자리에
      sa.x = sa.t; sb.x = sb.t; sa.v = sb.v = sm.v = 0;
      sm.x = sm.t = near() ? 1 : 0;
      draw();
    }
    const wake = () => { if (reduce) jump(); else if (!raf) raf = requestAnimationFrame(frame); };
    function rest() {   // 손을 뗀 뒤와 키보드: 고른 칸의 자리로 돌아갑니다
      freed(sa); freed(sb);
      sa.t = pos(lo); sb.t = pos(hi);
      wake();
    }

    // 끌기: 조작 영역 어디를 눌러도 가까운 손잡이가 따라옵니다. 두 손잡이가 같은 자리면 끄는 방향으로 정합니다.
    const local = (e) => e.clientX - area.getBoundingClientRect().left;
    function move(x) {
      if (!drag.who) {
        if (Math.abs(x - drag.x) < 2) return;
        drag.who = x > drag.x ? B : A;
      }
      const first = drag.who === A, s = first ? sa : sb;
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
      drag.off = Math.min(da, db) <= R ? x - (da <= db ? sa.t : sb.t) : 0;   // 손잡이를 잡았으면 잡은 자리를 지키고, 트랙을 눌렀으면 손잡이가 그리로 옵니다
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
      if (first) set(Math.max(0, Math.min(hi, v)), hi); else set(lo, Math.max(lo, Math.min(n, v)));
      rest();
    };
    A.addEventListener('keydown', keys(true));
    B.addEventListener('keydown', keys(false));

    write();
    emit(true);
    onSize(area, (w) => { W = w; sa.t = pos(lo); sb.t = pos(hi); jump(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) { write(); jump(); } });

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 몇 가지 범위를 차례로 보여 줍니다.
    if (!reduce && card.closest('[data-vzb-loop]')) {
      const s0 = [lo / n, hi / n], plan = [[0.38, 0.5], [0.42, 0.58], [0.08, 0.46], [0.52, 0.92], s0];
      let k = 0, seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (drag || !seen || !W || performance.now() < idle) return;
        const p = plan[k++ % plan.length];
        set(Math.round(p[0] * n), Math.max(Math.round(p[0] * n), Math.round(p[1] * n)));
        rest();
      }, 1700);
    }
  }
