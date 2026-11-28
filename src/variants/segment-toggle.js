  // Segment Toggle: 둘에서 다섯 가운데 하나만 고르는 컨트롤입니다(일 · 주 · 월, 매출 · 주문 수 · 고객 수). 카드 머리 없이 조작부만 그립니다.
  // 항목(options)은 같은 폭으로 한 줄에 나란히 놓이고, 늘 하나가 골라져 있습니다. value는 처음 고른 항목의 이름이고 비우면 첫 항목입니다.
  // 고른 자리는 글자색 알약이 덮습니다. 알약은 같은 이름을 카드 바탕색으로 적은 겹을 알약 모양으로 잘라 보여 주는 것이라,
  // 알약이 지나가는 동안 그 아래 글자는 알약이 닿은 만큼만 색이 뒤집힙니다.
  // 값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value: 고른 항목의 이름 })를 보내고, data-vzb-value에도 적습니다.
  // 움직임: 다른 항목을 누르면 알약이 그 자리로 미끄러져 살짝 넘쳤다 자리를 잡고(Settle), 빠르게 가는 동안은 조금 길어집니다. 누르는 동안은 알약이 살짝 줄었다가 놓으면 튑니다(Pop).
  // 알약을 잡고 끌면 손을 따라오고(Follow), 놓으면 가장 가까운 항목에 자리를 잡습니다. 값은 놓을 때 한 번만 바뀝니다.
  // 키보드: 좌우(위아래) 화살표로 옆 항목을 고르고, Home · End로 처음 · 끝 항목을 고릅니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 항목을 차례로 골라 보입니다.
  mount('segment-toggle', (card, d) => {
    const opts = [...new Set((Array.isArray(d.options) ? d.options : []).filter((o) => o != null && o !== '').map(String))], n = opts.length;
    if (n < 2 || n > 5) throw new Error(tx(d, 'options에 항목을 2~5개 적으세요.'));
    let at = Math.max(0, opts.indexOf(String(d.value)));
    const foot = el('div', 'vzb-sg'), track = el('div', 'vzb-sg-track'), top = el('div', 'vzb-sg-top'), say = el('p', 'vzb-sr');
    track.setAttribute('role', 'radiogroup');
    track.setAttribute('aria-label', d.label || d.title || tx(d, '필터'));   // 제목을 그리지 않으므로 화면 낭독기용 이름은 label에서 읽습니다
    track.setAttribute('data-vzb-input', '');
    track.style.setProperty('--vzb-sg-n', n);
    say.setAttribute('aria-live', 'polite');
    const segs = opts.map((o) => {
      const b = el('button', 'vzb-sg-seg');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.append(el('span', 'vzb-sg-tx', o));
      track.append(b);
      return b;
    });
    top.setAttribute('aria-hidden', 'true');
    opts.forEach((o) => { const c = el('span', 'vzb-sg-seg'); c.append(el('span', 'vzb-sg-tx', o)); top.append(c); });
    track.append(top);
    foot.append(track, say);
    card.append(foot);

    function paint() {
      segs.forEach((b, i) => {
        b.setAttribute('aria-checked', String(i === at));
        b.tabIndex = i === at ? 0 : -1;   // Tab은 고른 항목에만 서고, 그 안에서는 화살표로 옮깁니다
      });
    }
    function emit(quiet) {
      card.setAttribute('data-vzb-value', JSON.stringify(opts[at]));
      if (quiet) return;
      say.textContent = tx(d, '%s 고름', opts[at]);
      card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value: opts[at] } }));
    }

    // 알약의 자리(x: 왼쪽 끝, px)와 눌림(pz: 0~1)을 스프링으로 옮깁니다. 알약은 값이 아니라 손이 닿는 것이라 Settle · Follow · Pop을 씁니다.
    const M = motion(card), [SK, SC] = M.pair('settle'), [FK, FC] = M.pair('follow'), [PK, PC] = M.pair('pop'), PRESS = M.ms('press') || 1;
    const PAD = 3, sp = { x: 0, v: 0 }, pz = { x: 0, v: 0 };
    let W = 0, seg = 0, to = 0, R = 20, drag = null, down = false, raf = 0, stamp0 = 0, idle = 0;
    const clampX = (x) => Math.max(0, Math.min(W - seg, x)), near = (x) => Math.max(0, Math.min(n - 1, Math.round(x / seg)));
    function render() {
      if (!W) return;
      const stretch = Math.min(10, Math.abs(sp.v) * 0.012), pad = Math.max(1.5, PAD + 2 * pz.x);   // 빠르게 가는 동안 조금 길어지고, 누르는 동안 살짝 줄어듭니다
      const l = Math.max(pad, sp.x + pad - stretch / 2), r = Math.max(pad, W - (sp.x + seg) + pad - stretch / 2);
      top.style.clipPath = `inset(${pad.toFixed(2)}px ${r.toFixed(2)}px ${pad.toFixed(2)}px ${l.toFixed(2)}px round ${Math.max(0, R - pad).toFixed(2)}px)`;
    }
    const busy = () => !!drag || down || Math.abs(sp.x - to) > 0.2 || Math.abs(sp.v) > 4 || Math.abs(pz.x) > 0.01 || Math.abs(pz.v) > 0.05;
    function tick(stamp) {
      raf = 0;
      if (!card.isConnected) return;
      const dt = stamp0 ? Math.min(64, stamp - stamp0) : 16;
      stamp0 = stamp;
      if (drag && drag.moved) springTo(sp, to, FK, FC, dt); else springTo(sp, to, SK, SC, dt);
      if (down) pz.x = Math.min(1, pz.x + dt / PRESS); else springTo(pz, 0, PK, PC, dt);
      if (!busy()) { sp.x = to; sp.v = 0; pz.x = 0; pz.v = 0; stamp0 = 0; render(); return; }
      render();
      raf = requestAnimationFrame(tick);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    function pick(i) {
      to = i * seg;
      if (i !== at) { at = i; paint(); emit(); }
      kick();
    }
    onSize(track, (w) => {
      W = w; seg = w / n;
      R = Math.min(len(card, 'radius-control', 20), track.clientHeight / 2);
      to = at * seg;
      if (!drag) { sp.x = to; sp.v = 0; }
      render();
    });
    // 누르기와 끌기: 4px 넘게 움직이면 끌기로 보고 알약이 손을 따라옵니다. 놓은 자리에서 가장 가까운 항목을 고릅니다.
    track.addEventListener('pointerdown', (e) => {
      if (e.button || !W) return;
      const px = e.clientX - track.getBoundingClientRect().left;
      idle = performance.now() + 6000;
      down = true;
      drag = { id: e.pointerId, x0: e.clientX, moved: false, grab: near(px - seg / 2) === at ? px - sp.x : seg / 2 };
      track.setPointerCapture(e.pointerId);
      kick();
    });
    track.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) < 4) return;
      drag.moved = true;
      track.classList.add('is-drag');
      to = clampX(e.clientX - track.getBoundingClientRect().left - drag.grab);
      kick();
    });
    const drop = (e, cancel) => {
      if (!drag || e.pointerId !== drag.id) return;
      const px = e.clientX - track.getBoundingClientRect().left, i = cancel ? at : drag.moved ? near(to) : near(px - seg / 2);
      drag = null; down = false;
      track.classList.remove('is-drag');
      pick(i);
      if (!cancel) segs[at].focus({ preventScroll: true });
    };
    track.addEventListener('pointerup', (e) => drop(e, false));
    track.addEventListener('pointercancel', (e) => drop(e, true));
    // 키보드: 화살표 · Home · End는 옮기면서 바로 고릅니다(라디오 묶음의 관례). Space · Enter는 포커스한 항목을 고릅니다.
    track.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const i = step ? (at + step + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (i < 0) return;
      e.preventDefault();
      idle = performance.now() + 6000;
      pick(i);
      segs[at].focus({ preventScroll: true });
    });
    track.addEventListener('click', (e) => {
      const b = e.detail === 0 && e.target.closest('.vzb-sg-seg');   // 마우스 · 터치는 pointerup에서 골랐으므로, 키보드가 낸 click만 받습니다
      if (b && segs.includes(b)) pick(segs.indexOf(b));
    });
    paint();
    emit(true);

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 항목을 차례로 골라 보입니다.
    if (card.closest('[data-vzb-loop]')) {
      let seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!seen || drag || performance.now() < idle) return;
        down = true;
        kick();
        setTimeout(() => { down = false; pick((at + 1) % n); }, 110);
      }, 1700);
    }
  });
