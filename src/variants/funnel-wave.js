  // Funnel Wave: 단계(items)마다 그 단계까지 온 수를 물의 높이로 그리고, 단계마다 앞 단계에서 얼마나 넘어왔는지(전환율)를 적는 퍼널 차트입니다
  // (예: 장바구니 → 배송 정보 → 결제 수단 → 주문 확인 → 구매 완료).
  // 단계는 같은 폭의 칸으로 나란히 두고, 칸마다 물의 높이가 첫 단계 대비 비율입니다(바닥에서 재므로 칸끼리 높이를 바로 견줍니다).
  // 단계 경계에서는 물이 S자로 다음 단계의 높이까지 흘러내리고, 그 자리의 물 위에 전환율을 적은 알약이 떠 있습니다.
  // 머리 아래에 큰 숫자를 따로 두지 않습니다. 첫 단계에서 끝 단계까지의 전환율은 끝 단계의 물 위에 뜬 말풍선이 알리고, 칸 아래에는 단계의 값과 이름을 적습니다.
  // 움직임: 물이 왼쪽에서 흘러 들어와 경계를 지날 때마다 넘어간 만큼의 높이로 내려가며 오른쪽 끝까지 흐르고, 끝 벽에 부딪혀 찰랑이다 잔잔해집니다.
  // 물이 닿은 단계의 값이 0부터 세어지고 그 경계의 알약이 떠오르며, 끝 단계에 물이 차면 말풍선이 튀어나와 끝 단계의 값과 함께 전환율을 셉니다.
  // 단계에 마우스를 올리거나 키보드로 짚으면 그 단계의 물이 찰랑이고, 마우스를 움직이면 손으로 물을 미는 것처럼 물결이 일었다가 잦아듭니다.
  // 물결은 늘 잦아들어 멈추므로, 멈춘 장면의 물 높이는 늘 값 그대로입니다.
  // 카드가 화면에 보이면 한 번 흐르고, 다시 보기 단추로 되풀이합니다. 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고, 물이 빠진 뒤 다시 흐릅니다.
  mount('funnel-wave', (card, d, f) => {
    // 걸러서 남은 단계가 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-fw-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const src = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '' && fin(it.value)) : [];
    if (src.length < 2) throw new Error(tx(d, 'items에 단계를 두 개 이상 적으세요.'));
    const st = src.map((it, k) => ({ k, name: String(it.name), v: Math.max(0, +it.value) }));
    const N = st.length, v0 = st[0].v, vmax = Math.max(...st.map((s) => s.v)), lastS = st[N - 1];
    if (!(v0 > 0)) throw new Error(tx(d, '첫 단계의 값은 0보다 커야 합니다.'));
    st.forEach((s, k) => {
      s.cum = s.v / v0;                                              // 첫 단계 대비
      s.step = k ? (st[k - 1].v > 0 ? s.v / st[k - 1].v : 0) : 1;    // 앞 단계에서 넘어온 비율(전환율)
    });
    const whole = st.every((s) => Number.isInteger(s.v));
    const part = (b, e) => (e >= 1 ? b : whole ? Math.round(b * e) : b * e);
    const pct0 = (r) => `${num(r * 100, r * 100 < 9.95 && r > 0 ? 1 : 0)}%`;   // 알약: 10%보다 작을 때만 소수 한 자리
    const pct1 = (r) => `${num(r * 100, 1)}%`;                                 // 툴팁과 표: 소수 한 자리

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    const btn = el('button', 'vzb-fw-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-fw-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    hd.append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    const foot = el('div', 'vzb-foot vzb-fill vzb-fw');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3에서 %4 %5까지, 전환율 %6. 좌우 화살표로 단계를 옮깁니다. 모든 값은 이어지는 표에 있습니다.',
      d.title || '', st[0].name, show(f, v0), lastS.name, show(f, lastS.v), pct1(lastS.cum)));
    const svg = svgEl('svg', { class: 'vzb-fw-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);
    // 화면 낭독기용 표: 단계 · 값 · 앞 단계에서 넘어온 비율 · 첫 단계 대비
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(...[tx(d, '단계'), tx(d, '값'), tx(d, '앞 단계에서'), tx(d, '%s 대비', st[0].name)].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr);
    st.forEach((s) => {
      const tr = el('tr');
      tr.append(el('th', null, s.name), el('td', null, show(f, s.v)), el('td', null, s.k ? pct1(s.step) : '—'), el('td', null, pct1(s.cum)));
      table.append(tr);
    });
    sr.append(table);
    card.append(sr);

    // 그림(아래부터): 짚은 칸의 바탕 · 칸 사이 세로선 · 물 · 물결이 이는 동안만 보이는 겹물결 선 · 물 표면 선 · 전환율 알약 · 칸 아래 글자 · 끝 단계의 말풍선
    const band = svgEl('rect', { class: 'vzb-fw-band', y: 0 });
    const divs = svgEl('g', {}), water = svgEl('path', { class: 'vzb-fw-water' }), ghost = svgEl('path', { class: 'vzb-fw-ghost' }), line = svgEl('path', { class: 'vzb-fw-line' });
    const pillsG = svgEl('g', {}), labsG = svgEl('g', {});
    st.forEach((s, k) => {
      s.lab = svgEl('g', { class: 'vzb-fw-lab' });
      s.cnt = svgText(0, 0, '', 'vzb-fw-cnt', 'middle');
      s.cv = svgEl('tspan', {});
      s.cu = svgEl('tspan', { class: 'vzb-fw-u', dx: 1 });
      s.cnt.append(s.cv, s.cu);
      s.nm = svgText(0, 0, s.name, 'vzb-fw-name', 'middle');
      s.lab.append(s.cnt, s.nm);
      labsG.append(s.lab);
      if (!k) return;
      s.div = svgEl('line', { class: 'vzb-fw-div' });
      divs.append(s.div);
      s.pill = svgEl('g', { class: 'vzb-fw-pill' });
      s.pr = svgEl('rect', { rx: 11, height: 22, y: -11 });
      s.pt = svgText(0, 4, pct0(s.step), 'vzb-fw-pt', 'middle');
      s.pill.append(s.pr, s.pt);
      pillsG.append(s.pill);
    });
    // 끝 단계의 말풍선: 처음 → 끝 단계 이름(옅게)과 첫 단계에서 끝 단계까지의 전환율(굵고 크게, %는 작게). 꼬리는 끝 단계의 물 위를 가리킵니다.
    const bub = svgEl('g', { class: 'vzb-fw-bub' }), bubPath = svgEl('path', { class: 'vzb-fw-bb' });
    const bubName = svgText(0, 19, `${st[0].name} → ${lastS.name}`, 'vzb-fw-bn', 'middle');
    const bubBig = svgText(0, 41, '', 'vzb-fw-big', 'middle'), bubNum = svgEl('tspan', {}), bubPct = svgEl('tspan', { class: 'vzb-fw-bu', dx: 1 });
    bubPct.textContent = '%';
    bubBig.append(bubNum, bubPct);
    bub.append(bubPath, bubName, bubBig);
    svg.append(band, divs, water, ghost, line, pillsG, labsG, bub);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    const easeOut = (k) => 1 - (1 - k) ** 3;
    const fit = (s, size, maxW) => {
      if (textW(s, 400, fam, size) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, 400, fam, size) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };

    // 물의 쉬는 모양: 칸마다 평평하고, 경계(k · cw)를 가운데로 폭 tw 안에서 앞 칸의 높이에서 다음 칸의 높이까지 코사인 S자로 흘러내립니다.
    const TOP = 14;   // 물이 찰랑여도 그래프 위로 넘치지 않을 여유
    let W = 0, H = 0, cw = 1, y0 = 0, tw = 1, NOSE = 30, TOTAL = 1, BW = 80, showUnit = true;
    const BH = 50, TAIL = 6;   // 말풍선의 높이와 꼬리 길이
    function restAt(x) {
      const k = Math.max(0, Math.min(N - 1, Math.floor(x / cw))), lk = st[k].lv, bl = k * cw, br = bl + cw;
      if (k > 0 && x - bl < tw / 2) { const u = (x - bl + tw / 2) / tw; return st[k - 1].lv + (lk - st[k - 1].lv) * (1 - Math.cos(Math.PI * u)) / 2; }
      if (k < N - 1 && br - x < tw / 2) { const u = (x - br + tw / 2) / tw; return lk + (st[k + 1].lv - lk) * (1 - Math.cos(Math.PI * u)) / 2; }
      return lk;
    }
    // 물결: 물 표면을 약 3px 간격의 점으로 나누고, 점마다 높이(hs, 위로 +)와 속도(us)를 둡니다. 이웃한 점끼리 당겨 물결이 옆으로 퍼지고(빠르기 C),
    // 제자리로 돌아오려는 힘(K)과 감쇠(DAMP)로 잦아듭니다. 시간은 1/240초씩 고르게 나눠 진행해, 화면의 프레임 수와 상관없이 같은 물결이 됩니다.
    // 얕은 물(낮은 단계)은 덜 출렁이도록 물의 깊이에 따라 줄여 그립니다(dep).
    // 찰랑임: 짚은 단계의 물은 칸 안에서 왼쪽 절반이 오르면 오른쪽 절반이 내리는 출렁임을 SL_HZ로 되풀이하며 SL_T(초)마다 1/e로 잦아듭니다.
    // 칸의 양 끝은 움직이지 않아 이웃한 칸과 이어진 물이 끊기지 않습니다.
    const C = 240, K = 30, DAMP = 2.4, SUB = 1000 / 240, MAXH = 12, WAKE = 34, SPLASH = 90, STIR = 60, SH = 9;
    const SL_A = 10, SL_HZ = 1.5, SL_T = 0.7, SL_END = 3200;
    let sl = [];   // 찰랑이는 단계: { k, age(밀리초) }
    let M = 0, dx = 3, xs = [], rp = [], dep = [], hs = new Float32Array(0), us = new Float32Array(0), wet = new Uint8Array(0);
    let acc = 0, calm = true, energy = 0, ripple = 0;   // energy: 물결과 찰랑임을 더한 가장 큰 높이, ripple: 물결만
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cw = w / N;
      const tight = cw < 84, csz = tight ? 13 : 14, nsz = tight ? 11 : 12;
      svg.classList.toggle('is-tight', tight);
      y0 = h - (csz + nsz + 14);   // 물의 바닥. 그 아래에 값과 이름 두 줄
      // 물의 가장 높은 높이: 그림 높이에서 위 여유(TOP)를 뺀 만큼. 끝 단계가 높아 그 위에 말풍선이 들어갈 자리가 없으면 물 전체를 그만큼 낮춥니다.
      let HM = Math.max(24, y0 - TOP);
      const fl = lastS.v / vmax, need = BH + TAIL + 14;
      if (fl > 0 && y0 + TOP - fl * HM < need) HM = Math.max(24, (y0 + TOP - need) / fl);
      tw = Math.min(cw * 0.86, 170);
      NOSE = Math.max(18, Math.min(48, cw * 0.32));
      // 값 글자: 칸 폭에 다 들어가지 않으면 단위를 빼고, 그래도 넘치면 11px까지 한 단계씩 작게 씁니다(툴팁과 표에는 단위까지 남습니다).
      const cntW = (s, size, unitToo) => { const [a, u] = f.parts(s.v); return textW(a, 700, fam, size) + (unitToo && u ? 1 + textW(/^[A-Za-z]{2}/.test(u) ? ` ${u}` : u, 400, fam, 11) : 0); };
      let vsz = csz;
      showUnit = st.every((s) => cntW(s, vsz, true) <= cw - 6);
      if (!showUnit) while (vsz > 11 && !st.every((s) => cntW(s, vsz, false) <= cw - 6)) vsz -= 1;
      st.forEach((s, k) => {
        s.cnt.style.fontSize = vsz < csz ? `${vsz}px` : '';
        s.cu.style.display = showUnit ? '' : 'none';
        s.lv = s.v > 0 ? Math.max(3, (s.v / vmax) * HM) : 0;
        s.cx = (k + 0.5) * cw;
        s.lab.setAttribute('transform', `translate(${fx(s.cx)},${fx(y0)})`);
        s.cnt.setAttribute('y', 6 + csz);
        s.nm.setAttribute('y', 10 + csz + nsz);
        s.nm.textContent = fit(s.name, nsz, cw - 8);
        if (!k) return;
        const b = k * cw, pw = Math.ceil(textW(pct0(s.step), 700, fam, 12)) + 18;
        s.div.setAttribute('x1', fx(b));
        s.div.setAttribute('x2', fx(b));
        s.div.setAttribute('y1', 0);
        s.div.setAttribute('y2', fx(y0));
        s.pw = pw;
        s.pr.setAttribute('width', pw);
        s.pr.setAttribute('x', fx(-pw / 2));
      });
      band.setAttribute('width', fx(cw));
      band.setAttribute('height', fx(y0));
      // 말풍선의 크기: 이름(11px)과 전환율(18px) 가운데 넓은 쪽에 좌우 10px. 이름은 그림 폭의 절반을 넘으면 줄여 적습니다.
      const nameText = fit(`${st[0].name} → ${lastS.name}`, 11, Math.max(60, w * 0.5));
      bubName.textContent = nameText;
      BW = Math.ceil(Math.max(textW(nameText, 500, fam, 11), textW(`${num(lastS.cum * 100, 1)}%`, 700, fam, 18))) + 20;
      const m = Math.max(16, Math.round(w / 3)) + 1;
      if (m !== M) { M = m; hs = new Float32Array(M); us = new Float32Array(M); wet = new Uint8Array(M); calm = true; }
      dx = w / (M - 1);
      xs = Array.from({ length: M }, (_, i) => i * dx);
      rp = xs.map(restAt);
      dep = rp.map((l) => (l < 0.5 ? 0 : Math.max(0.3, Math.min(1, l / 36))));
      TOTAL = Math.max(T0 + FLOW, timeAt((N - 1) * cw + 8) + CNT) + 80;
      wetTo(frontAt(t), 0);
      render();
    }

    // 시간표(밀리초): 물이 흘러들기 시작하는 때 T0, 물의 앞머리가 왼쪽 끝에서 오른쪽 끝까지 가는 시간 FLOW(처음 20%는 빨라지고 그다음은 같은 빠르기),
    // 물이 닿은 단계의 값을 세는 시간 CNT, 알약이 떠오르는 시간 POP. 되풀이할 때는 끝에서 HOLD만큼 쉬고 DRAIN 동안 물이 빠집니다.
    const T0 = 240, FLOW = Math.max(1500, Math.min(2300, 1300 + 160 * N)), CNT = 520, POP = 280, HOLD = 2600, DRAIN = 520;
    const ACC = 0.2, VK = 1 / (1 - ACC / 2);
    const frontP = (p) => (p < ACC ? (0.5 * VK * p * p) / ACC : VK * (p - ACC / 2));
    const frontAt = (tt) => W * Math.min(1, frontP(clamp((tt - T0) / FLOW)));
    const speedAt = (tt) => { const p = (tt - T0) / FLOW; return p <= 0 || p >= 1 ? 0 : p < ACC ? p / ACC : 1; };   // 0~1
    const timeAt = (x) => { const q = clamp(x / (W || 1)), p = q < 0.5 * VK * ACC ? Math.sqrt((2 * ACC * q) / VK) : q / VK + ACC / 2; return T0 + p * FLOW; };
    let t = 0, dr = 1, idle = 0, splashed = false, hot = -1;

    // 앞머리가 새로 덮은 점에는 아래로 미는 속도를 주어, 앞머리 뒤로 물결이 끌려오게 합니다.
    function wetTo(F, sp) {
      for (let i = 0; i < M && xs[i] <= F; i++) {
        if (wet[i]) continue;
        wet[i] = 1;
        if (sp > 0 && dep[i] > 0) { us[i] -= WAKE * sp * dep[i]; calm = false; }
      }
    }
    // 오른쪽 끝 벽에 닿은 물이 벽을 타고 올랐다가 되돌아옵니다.
    function splash() {
      const R = Math.min(cw * 0.5, 70);
      for (let i = 0; i < M; i++) { const q = 1 - (W - xs[i]) / R; if (q > 0 && dep[i] > 0) us[i] += SPLASH * dep[i] * q * q; }
      calm = false;
    }
    // 짚은 단계의 물이 칸 안에서 좌우로 찰랑입니다. 같은 단계를 다시 짚으면 처음부터 다시 찰랑입니다.
    function slosh(k) {
      sl = sl.filter((o) => o.k !== k);
      sl.push({ k, age: 0 });
      calm = false;
      kick();
    }
    // 점 i에서 찰랑임이 더하는 높이: 칸 안의 자리 u(0~1)에서 2.6 · sin²(πu) · cos(πu) 모양(양 끝은 0, 왼쪽 30% 자리가 가장 높음)
    function sloshAt(i) {
      let v = 0;
      for (const o of sl) {
        const u = (xs[i] - o.k * cw) / cw;
        if (u <= 0 || u >= 1) continue;
        const a = o.age / 1000, su = Math.sin(Math.PI * u);
        v += SL_A * Math.exp(-a / SL_T) * Math.sin(2 * Math.PI * SL_HZ * a) * 2.6 * su * su * Math.cos(Math.PI * u);
      }
      return v;
    }
    // 마우스를 움직이면 손으로 물을 미는 것처럼, 움직이는 쪽 앞의 물은 올라가고 뒤의 물은 내려갑니다.
    function stir(px, vx) {
      const R = 18, a = Math.max(-1, Math.min(1, vx / 900)) * STIR;
      if (Math.abs(a) < 0.5) return;
      const i0 = Math.max(0, Math.floor((px - 3 * R) / dx)), i1 = Math.min(M - 1, Math.ceil((px + 3 * R) / dx));
      for (let i = i0; i <= i1; i++) {
        if (!wet[i]) continue;
        const z = (xs[i] - px) / R;
        us[i] += a * dep[i] * z * Math.exp(-z * z) * 2.33;
      }
      calm = false;
      kick();
    }
    function stepSim(ms) {
      if (calm || !M) { acc = 0; return; }
      sl.forEach((o) => { o.age += ms; });
      sl = sl.filter((o) => o.age < SL_END);
      acc += ms;
      const c2 = (C / dx) ** 2, dt = SUB / 1000;
      let n = 0;
      while (acc >= SUB && n++ < 40) {
        acc -= SUB;
        for (let i = 0; i < M; i++) {
          const l = hs[i > 0 ? i - 1 : 0], r = hs[i < M - 1 ? i + 1 : M - 1];
          us[i] += (c2 * (l + r - 2 * hs[i]) - K * hs[i] - DAMP * us[i]) * dt;
        }
        for (let i = 0; i < M; i++) {
          if (!wet[i] || !dep[i]) { hs[i] = 0; us[i] = 0; continue; }
          hs[i] = Math.max(-MAXH, Math.min(MAXH, hs[i] + us[i] * dt));
        }
      }
      let mh = 0, mu = 0;
      for (let i = 0; i < M; i++) { mh = Math.max(mh, Math.abs(hs[i])); mu = Math.max(mu, Math.abs(us[i])); }
      const ms2 = sl.reduce((m, o) => Math.max(m, SL_A * Math.exp(-o.age / 1000 / SL_T)), 0);
      ripple = mh;
      energy = mh + ms2;
      if (mh < 0.05 && mu < 0.8 && !sl.length) { hs.fill(0); us.fill(0); calm = true; energy = 0; ripple = 0; }
    }

    // x 자리(점 i)의 물 높이: 쉬는 높이 × 빠짐(dr). 흘러드는 동안은 앞머리(F) 앞이 비어 있고, 앞머리는 둥글게 바닥까지 내려오며,
    // 그 바로 뒤에 물마루가 솟습니다(빠르게 흐를수록 높게). 그 위에 물결(disp)을 깊이만큼 더합니다.
    function lvl(i, F, sp, crest, disp) {
      const x = xs[i];
      if (x > F) return 0;
      let v = rp[i] * dr;
      if (F < W) {
        if (x > F - NOSE) v *= Math.sqrt(Math.max(0, 1 - ((x - F + NOSE) / NOSE) ** 2));
        v += crest * sp * dep[i] * Math.exp(-(((x - (F - NOSE * 0.85)) / (NOSE * 0.75)) ** 2));
      }
      return Math.max(0, v + disp * dep[i] * dr);
    }
    // 물 표면: 왼쪽 끝에서 앞머리까지(흘러드는 동안은 앞머리가 바닥에 닿는 데까지). 물은 이 표면 아래를 바닥까지 채웁니다.
    function surface(F, sp, crest, dispAt) {
      if (F <= 0.5) return '';
      let p = '';
      for (let i = 0; i < M && xs[i] <= F; i++) p += `${p ? 'L' : 'M'}${fx(xs[i])},${fx(y0 - lvl(i, F, sp, crest, dispAt(i)))}`;
      return F < W ? `${p}L${fx(F)},${fx(y0)}` : p;
    }
    const disp = (i) => hs[i] + (sl.length ? sloshAt(i) : 0);
    const surfY = (i, F, sp) => y0 - lvl(i, F, sp, 7, disp(i));
    function render() {
      if (!W) return;
      const F = frontAt(t), sp = speedAt(t), flowing = F > 0 && F < W;
      const top = surface(F, sp, 7, disp);
      line.setAttribute('d', top);
      water.setAttribute('d', top ? `M0,${fx(y0)}L${top.slice(1)}L${fx(Math.min(W, F))},${fx(y0)}Z` : '');
      // 겹물결 선: 물결(흘러들 때의 물마루와 뒤따르는 물결, 벽에 부딪힌 물결, 마우스가 일으킨 물결)이 이는 동안에만 표면 위아래로 비치는 옅은 선.
      // 물결을 조금 옮겨 크게 그리고, 흘러드는 동안은 앞머리가 조금 앞섭니다. 짚은 단계의 찰랑임은 표면만 움직이고, 물결이 잦아들면 표면 선과 겹치며 사라집니다.
      const go = flowing ? 0.55 : 0.55 * clamp(ripple / 2);
      ghost.setAttribute('opacity', fx(go));
      ghost.setAttribute('d', go > 0.01 ? surface(flowing ? Math.min(W, F + 10 * sp) : F, sp, 10, (i) => hs[Math.min(M - 1, i + SH)] * 1.5) : '');
      // 단계 글자: 물의 앞머리가 그 칸에 들어서면 나타나 값을 0부터 셉니다. 알약은 앞머리가 경계를 지나면 떠올라 물 위에서 물결을 따라 오르내립니다.
      st.forEach((s, k) => {
        const tin = timeAt(k * cw + 8), e = clamp((t - tin) / CNT);
        s.lab.setAttribute('opacity', fx(clamp((t - tin + 40) / 200) * dr));
        const [text, unit] = f.parts(part(s.v, easeOut(e)));
        s.cv.textContent = text;
        s.cu.textContent = unit ? (/^[A-Za-z]{2}/.test(unit) ? ` ${unit}` : unit) : '';   // 영어 낱말 단위는 한 칸 띄웁니다
        if (!s.pill) return;
        const b = k * cw, tb = timeAt(b + 10), q = clamp((t - tb) / POP), i = Math.min(M - 1, Math.round(b / dx));
        s.pill.setAttribute('opacity', fx(q * dr));
        s.pill.setAttribute('transform', `translate(${fx(b)},${fx(Math.min(y0 - 11, surfY(i, F, sp)))}) scale(${fx(0.7 + 0.3 * easeOut(q))})`);
      });
      // 말풍선: 끝 단계에 물이 들어서면 꼬리 끝에서 튀어나와, 끝 단계의 값과 함께 전환율을 0부터 셉니다. 끝 단계의 물 위에 떠서 물결을 따라 오르내립니다.
      const tl = timeAt((N - 1) * cw + 8), eb = clamp((t - tl) / CNT), qb = clamp((t - tl) / POP);
      bubNum.textContent = num(lastS.cum * 100 * (eb >= 1 ? 1 : easeOut(eb)), 1);
      // 자리: 그림의 오른쪽 끝에 붙이고, 그 아래에 있는 물(쉬는 높이)과 알약보다 10px 위에 띄웁니다. 그림 위로는 TOP까지만 나갑니다.
      const bx = W - BW / 2, il = Math.min(M - 1, Math.round(lastS.cx / dx));
      let hi = 0;
      for (let i = Math.max(0, Math.floor((W - BW) / dx)); i < M; i++) hi = Math.max(hi, rp[i] * dr);
      st.forEach((o) => { if (o.pill && Math.abs(o.k * cw - bx) < (BW + o.pw) / 2 + 4) hi = Math.max(hi, Math.max(11, restAt(o.k * cw) * dr) + 11); });   // 알약은 바닥 위 11px보다 내려가지 않습니다
      const tipY = Math.min(y0, surfY(il, F, sp)) - 4;     // 꼬리 끝: 끝 단계의 물 위 4px
      const by = Math.max(-TOP, Math.min(tipY - TAIL - BH, y0 - hi - 10 - BH));
      const tx0 = Math.max(-BW / 2 + 12, Math.min(BW / 2 - 12, lastS.cx - bx)), ty = Math.max(BH, tipY - by), sc = 0.6 + 0.4 * easeOut(qb);
      bubPath.setAttribute('d', bubble(BW, BH, tx0, ty, 8));
      bub.setAttribute('opacity', fx(qb * dr));
      bub.setAttribute('transform', `translate(${fx(bx + tx0 * (1 - sc))},${fx(by + ty * (1 - sc))}) scale(${fx(sc)})`);   // 꼬리 끝을 가운데로 커집니다
    }
    // 말풍선 모양: 폭 bw, 높이 bh, 모서리 r. 아래 변의 tx 자리에서 꼬리가 ty(말풍선 위에서 잰 높이)까지 내려갑니다.
    function bubble(bw, bh, tx0, ty, r) {
      const x0 = -bw / 2, tw0 = 6;
      return `M${fx(x0 + r)},0H${fx(-x0 - r)}A${r},${r} 0 0 1 ${fx(-x0)},${r}V${fx(bh - r)}A${r},${r} 0 0 1 ${fx(-x0 - r)},${fx(bh)}`
        + `H${fx(tx0 + tw0)}L${fx(tx0)},${fx(ty)}L${fx(tx0 - tw0)},${fx(bh)}H${fx(x0 + r)}A${r},${r} 0 0 1 ${fx(x0)},${fx(bh - r)}V${r}A${r},${r} 0 0 1 ${fx(x0 + r)},0Z`;
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 흐름이 나아갑니다. 물결은 손을 댄 동안에도 잦아들 때까지 움직입니다.
    // 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let playing = false, seen = false, inView = false, raf = 0, lastStamp = 0;
    const busy = () => playing && !holds.size;
    function advance(dt) {
      if (idle > 0) {
        idle = Math.max(0, idle - dt);
        const q = clamp(idle / DRAIN);
        dr = q * q * (3 - 2 * q);   // 끝의 DRAIN 동안 물이 빠집니다
        if (!idle) restart();
        return;
      }
      t = Math.min(TOTAL, t + dt);
      const F = frontAt(t);
      wetTo(F, speedAt(t));
      if (F >= W && !splashed) { splashed = true; splash(); }
      if (t >= TOTAL) { if (loop) idle = HOLD + DRAIN; else playing = false; }
    }
    function tick(stamp) {
      raf = 0;
      if (!card.isConnected || !inView) { lastStamp = 0; return; }
      const dt = lastStamp ? Math.min(64, stamp - lastStamp) : 16;
      lastStamp = stamp;
      if (busy()) advance(dt);
      stepSim(dt);
      render();
      if (busy() || !calm) raf = requestAnimationFrame(tick); else lastStamp = 0;
    }
    function kick() { if (!raf && inView && card.isConnected && (busy() || !calm)) raf = requestAnimationFrame(tick); }
    function restart() {
      t = 0; dr = 1; idle = 0; splashed = false;
      hs.fill(0); us.fill(0); wet.fill(0); sl = []; calm = true; energy = 0; ripple = 0;
    }
    function play() { restart(); playing = true; lastStamp = 0; render(); kick(); }
    btn.addEventListener('click', play);
    let lastX = null, lastT = 0;   // 마우스가 지난 자리와 때(물을 미는 빠르기를 잽니다)
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); lastX = null; kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    plot.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = plot.getBoundingClientRect(), x = ((e.clientX - r.left) * W) / (r.width || 1);   // 카드가 확대 · 축소되어 있어도 그림의 좌표로 잽니다
      if (lastX != null && e.timeStamp > lastT) stir(x, ((x - lastX) / (e.timeStamp - lastT)) * 1000);
      lastX = x;
      lastT = e.timeStamp;
    });
    // 툴팁: 단계를 짚으면 그 단계의 물이 찰랑이고, 값 · 앞 단계에서 넘어온 비율 · 첫 단계 대비 비율을 보여 줍니다.
    // 그 단계로 들어오는 알약은 툴팁이 같은 비율을 보여 주므로 그동안 숨기고, 나머지 단계의 글자와 알약은 옅게 둡니다.
    interact(plot, N,
      (cx) => { const r = plot.getBoundingClientRect(); return Math.max(0, Math.min(N - 1, Math.floor(((cx - r.left) * N) / (r.width || 1)))); },
      (k) => {
        const s = st[k], r = plot.getBoundingClientRect();
        if (k !== hot) { hot = k; slosh(k); }
        svg.classList.add('is-hover');
        band.setAttribute('x', fx(k * cw));
        st.forEach((x) => { x.lab.classList.toggle('is-on', x === s); if (x.pill) x.pill.classList.toggle('is-on', x === s); });
        bub.classList.toggle('is-on', s === lastS);   // 끝 단계를 짚으면 툴팁이 같은 비율을 보여 주므로 말풍선을 숨깁니다
        const note = !k ? null : k > 1 ? [tx(d, '%1에서 %2', st[k - 1].name, pct1(s.step)), tx(d, '%1의 %2', st[0].name, pct1(s.cum))] : [tx(d, '%1에서 %2', st[0].name, pct1(s.step))];
        const tb = tipBody({ value: show(f, s.v), note }, s.name);
        const k2 = r.width / (W || 1);
        return { x: r.left + s.cx * k2, y: r.top + (y0 - restAt(s.cx) - 4) * k2, label: s.name, value: tb.node, text: tb.text };   // 그 단계의 물 위를 가리킵니다
      },
      () => { hot = -1; svg.classList.remove('is-hover'); bub.classList.remove('is-on'); st.forEach((x) => { x.lab.classList.remove('is-on'); if (x.pill) x.pill.classList.remove('is-on'); }); },
      false, true);

    if (live) t = 1e9;   // 마지막 장면에서 시작합니다
    onSize(plot, (w, h) => { layout(w, h); if (live) { t = TOTAL; render(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) layout(W, H); });
    // 화면에 처음 보일 때 흐릅니다. 화면 밖에 있는 동안은 멈춰 둡니다.
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
