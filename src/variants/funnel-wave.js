  // Funnel Wave: 단계(items)마다 그 단계까지 온 수를 물의 높이로 그리고, 처음 단계를 100으로 볼 때 단계마다 얼마가 남았는지(첫 단계 대비 비율)를 적는 퍼널 차트입니다
  // (예: 리드 → 유효 리드 → 제안 → 협상 → 계약).
  // 단계는 같은 폭의 칸으로 나란히 두고, 칸마다 물의 높이가 첫 단계 대비 비율입니다(바닥에서 재므로 칸끼리 높이를 바로 견줍니다).
  // 칸마다 물의 톤이 다릅니다. 첫째 색 하나를 흰색에 섞는 정도만 달리해, 첫 단계가 가장 옅고 끝 단계가 가장 진합니다(전환된 끝이 먼저 보입니다).
  // 단계 경계에서는 물이 S자로 다음 단계의 높이까지 흘러내리고, 칸마다 물 위에 첫 단계 대비 비율을 적은 알약이 떠 있습니다(100% → 55% → 26% …).
  // 머리 아래에 큰 숫자를 따로 두지 않습니다. 끝 단계는 알약 대신 말풍선이 첫 단계에서 끝 단계까지의 전환율을 크게 알리고, 칸 아래에는 단계의 값과 이름을 적습니다.
  // 앞 단계에서 넘어온 비율(단계별 전환율)은 툴팁과 표에 적습니다. 퍼널은 보통 처음 100 가운데 얼마가 끝까지 왔는지로 읽기 때문입니다.
  // 움직임: 물이 왼쪽에서 흘러 들어와 경계를 지날 때마다 넘어간 만큼의 높이로 내려가며 오른쪽 끝까지 흐르고, 끝 벽에 부딪혀 찰랑이다 잔잔해집니다.
  // 물이 닿은 단계의 값이 0부터 세어지고 그 칸의 알약이 떠오르며, 끝 단계에 물이 차면 말풍선이 튀어나와 끝 단계의 값과 함께 전환율을 셉니다.
  // 단계를 마우스나 키보드로 짚으면 그 칸의 물이 세 겹으로 잔잔하게 일렁이고, 그 알약(끝 단계는 말풍선)은 그대로 둔 채 채워 강조하며,
  // 툴팁이 그 비율을 이루는 값(첫 단계 값 → 이 단계 값)과 앞 단계에서 넘어온 비율을 알약 옆에 보여 줍니다.
  // 마우스를 움직이면 손으로 물을 미는 것처럼 물결이 일었다가 잦아듭니다. 물결은 늘 잦아들어 멈추므로, 멈춘 장면의 물 높이는 늘 값 그대로입니다.
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
    // 톤: 첫째 색을 흰색에 섞는 비율(%). 첫 단계 34%에서 끝 단계 100%까지 고르게 짙어집니다. 뒤의 두 겹은 같은 단계에서 한 겹마다 더 옅습니다.
    st.forEach((s, k) => {
      s.cum = s.v / v0;                                              // 첫 단계 대비
      s.step = k ? (st[k - 1].v > 0 ? s.v / st[k - 1].v : 0) : 1;    // 앞 단계에서 넘어온 비율(전환율)
      s.tone = Math.round(34 + (66 * k) / (N - 1));
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
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3에서 %4 %5까지, 첫 단계 대비 %6. 좌우 화살표로 단계를 옮깁니다. 모든 값은 이어지는 표에 있습니다.',
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

    // 그림(아래부터): 짚은 두 칸의 바탕 · 칸 사이 세로선 · 물의 뒤 두 겹 · 물 · 물 표면 선 · 전환율 알약 · 칸 아래 글자 · 끝 단계의 말풍선
    // 물과 뒤 겹은 단계마다 따로 그린 칸이라, 칸마다 톤이 다르고 경계에서 톤이 바뀝니다.
    const band = svgEl('rect', { class: 'vzb-fw-band', y: 0 });
    const divs = svgEl('g', {}), line = svgEl('path', { class: 'vzb-fw-line' });
    const layers = [2, 1, 0].map((m) => {
      const g = svgEl('g', { class: `vzb-fw-l${m}` });
      const paths = st.map((s) => {
        const p = svgEl('path', { class: 'vzb-fw-water' });
        p.style.setProperty('--vzb-fw-p', `${Math.round(s.tone * [1, 0.62, 0.38][m])}%`);
        g.append(p);
        return p;
      });
      return { m, g, paths };
    });
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
      if (k) { s.div = svgEl('line', { class: 'vzb-fw-div' }); divs.append(s.div); }
      if (k === N - 1) return;   // 끝 단계는 말풍선이 알립니다
      // 알약: 바깥 g는 자리(물 위)를, 안쪽 g는 짚었을 때 살짝 커지는 움직임을 맡습니다.
      s.pill = svgEl('g', { class: 'vzb-fw-pill' });
      const pin = svgEl('g', { class: 'vzb-fw-pin' });
      s.pr = svgEl('rect', { rx: 12, height: 24, y: -12 });
      s.pt = svgText(0, 5, pct0(s.cum), 'vzb-fw-pt', 'middle');
      pin.append(s.pr, s.pt);
      s.pill.append(pin);
      pillsG.append(s.pill);
    });
    // 끝 단계의 말풍선: 처음 → 끝 단계 이름(12px, 옅게)과 첫 단계에서 끝 단계까지의 전환율(18px 굵게, %는 12px). 꼬리는 끝 단계의 물 위를 가리킵니다.
    const bub = svgEl('g', { class: 'vzb-fw-bub' }), bubPath = svgEl('path', { class: 'vzb-fw-bb' });
    const bubName = svgText(0, 19, `${st[0].name} → ${lastS.name}`, 'vzb-fw-bn', 'middle');
    const bubBig = svgText(0, 41, '', 'vzb-fw-big', 'middle'), bubNum = svgEl('tspan', {}), bubPct = svgEl('tspan', { class: 'vzb-fw-bu', dx: 1 });
    bubPct.textContent = '%';
    bubBig.append(bubNum, bubPct);
    bub.append(bubPath, bubName, bubBig);
    svg.append(band, divs, ...layers.map((l) => l.g), line, pillsG, labsG, bub);
    const fam = getComputedStyle(card).fontFamily, fx = (v) => v.toFixed(1), clamp = (v) => Math.max(0, Math.min(1, v));
    const easeOut = (k) => 1 - (1 - k) ** 3;
    const fit = (s, size, maxW) => {
      if (textW(s, 400, fam, size) <= maxW) return s;
      let lo = 0, hi = s.length;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(`${s.slice(0, m)}…`, 400, fam, size) <= maxW) lo = m; else hi = m - 1; }
      return `${s.slice(0, Math.max(1, lo))}…`;
    };

    // 물의 쉬는 모양: 칸마다 평평하고, 경계(k · cw)를 가운데로 폭 tw 안에서 앞 칸의 높이에서 다음 칸의 높이까지 코사인 S자로 흘러내립니다.
    const TOP = 14;   // 물이 물결쳐도 그래프 위로 넘치지 않을 여유
    const BH = 50, TAIL = 6;   // 말풍선의 높이와 꼬리 길이
    let bubX = 0, bubY = 0;   // 말풍선의 자리(툴팁이 말풍선 옆에 붙을 때 씁니다)
    let W = 0, H = 0, cw = 1, y0 = 0, tw = 1, NOSE = 30, TOTAL = 1, BW = 80, showUnit = true;
    function restAt(x) {
      const k = Math.max(0, Math.min(N - 1, Math.floor(x / cw))), lk = st[k].lv, bl = k * cw, br = bl + cw;
      if (k > 0 && x - bl < tw / 2) { const u = (x - bl + tw / 2) / tw; return st[k - 1].lv + (lk - st[k - 1].lv) * (1 - Math.cos(Math.PI * u)) / 2; }
      if (k < N - 1 && br - x < tw / 2) { const u = (x - br + tw / 2) / tw; return lk + (st[k + 1].lv - lk) * (1 - Math.cos(Math.PI * u)) / 2; }
      return lk;
    }
    // 물결(흘러들 때와 마우스로 민 물결): 물 표면을 약 3px 간격의 점으로 나누고, 점마다 높이(hs, 위로 +)와 속도(us)를 둡니다.
    // 이웃한 점끼리 당겨 물결이 옆으로 퍼지고(빠르기 C), 제자리로 돌아오려는 힘(K)과 감쇠(DAMP)로 잦아듭니다.
    // 시간은 1/240초씩 고르게 나눠 진행해, 화면의 프레임 수와 상관없이 같은 물결이 됩니다. 얕은 물(낮은 단계)은 덜 출렁이도록 깊이에 따라 줄입니다(dep).
    const C = 240, K = 30, DAMP = 3.2, SUB = 1000 / 240, MAXH = 5, WAKE = 16, SPLASH = 40, STIR = 24, SH = 9;
    // 겹물결(전환율을 짚었을 때): 겹마다 높이(a, px) · 물결 길이(l, 칸 폭의 배) · 빠르기(v, px/초) · 처음 위상(p)이 달라 서로 엇갈리며 오른쪽(흐르는 쪽)으로 흐릅니다.
    // 짚은 칸과 양옆 1/4칸 안에서 고르게 일고(그 바깥 끝 15%에서만 잦아들어 다른 단계의 물은 잔잔함), 0.3초쯤 커졌다가 2초 남짓에 잦아듭니다.
    // 물 높이가 곧 단계의 값이므로, 물결은 높이를 읽는 데 지장이 없게 몇 px 안에서만 일렁입니다(가장 높은 물마루도 쉬는 높이에서 5px 안).
    // 물결이 이는 동안 뒤 겹은 한 겹마다 LIFT만큼 더 솟아 겹이 보이고, 잔잔해지면 물 뒤로 숨습니다.
    const HV = [{ a: 1.6, l: 1.1, v: 34, p: 0 }, { a: 2, l: 1.5, v: 22, p: 1.9 }, { a: 2.4, l: 0.85, v: 46, p: 3.8 }];
    const LIFT = 2.5, HV_END = 3000;
    const envOf = (ms) => { const a = ms / 1000; return Math.min(1, ((1 - Math.exp(-a / 0.18)) * Math.exp(-a / 0.9)) / 0.66); };
    const winOf = (u) => (u <= 0 || u >= 1 ? 0 : Math.min(1, u / 0.15, (1 - u) / 0.15) ** 2 * (3 - 2 * Math.min(1, u / 0.15, (1 - u) / 0.15)));   // 물결이 이는 폭의 바깥 끝 15%만 부드럽게 0으로
    let M = 0, dx = 3, xs = [], rp = [], dep = [], room = [], hs = new Float32Array(0), us = new Float32Array(0), wet = new Uint8Array(0);
    let acc = 0, calm = true, ripple = 0, hv = [];   // ripple: 물결의 가장 큰 높이, hv: 물결치는 단계 { j(단계), age(밀리초) }
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cw = w / N;
      const tight = cw < 84, csz = tight ? 12 : 14, nsz = csz;
      svg.classList.toggle('is-tight', tight);
      y0 = h - (csz + nsz + 14);   // 물의 바닥. 그 아래에 값과 이름 두 줄
      // 물의 가장 높은 높이: 그림 높이에서 위 여유(TOP)를 뺀 만큼. 끝 단계가 높아 그 위에 말풍선이 들어갈 자리가 없으면 물 전체를 그만큼 낮춥니다.
      let HM = Math.max(24, y0 - TOP);
      const fl = lastS.v / vmax, need = BH + TAIL + 14;
      if (fl > 0 && y0 + TOP - fl * HM < need) HM = Math.max(24, (y0 + TOP - need) / fl);
      tw = Math.min(cw * 0.86, 170);
      NOSE = Math.max(18, Math.min(48, cw * 0.32));
      // 값 글자: 칸 폭에 다 들어가지 않으면 단위를 빼고, 그래도 넘치면 12px로 씁니다(툴팁과 표에는 단위까지 남습니다).
      const cntW = (s, size, unitToo) => { const [a, u] = f.parts(s.v); return textW(a, 700, fam, size) + (unitToo && u ? 1 + textW(/^[A-Za-z]{2}/.test(u) ? ` ${u}` : u, 400, fam, 12) : 0); };
      let vsz = csz;
      showUnit = st.every((s) => cntW(s, vsz, true) <= cw - 6);
      if (!showUnit && vsz > 12 && !st.every((s) => cntW(s, vsz, false) <= cw - 6)) vsz = 12;
      st.forEach((s, k) => {
        s.cnt.style.fontSize = vsz < csz ? `${vsz}px` : '';
        s.cu.style.display = showUnit ? '' : 'none';
        s.lv = s.v > 0 ? Math.max(3, (s.v / vmax) * HM) : 0;
        s.cx = (k + 0.5) * cw;
        s.lab.setAttribute('transform', `translate(${fx(s.cx)},${fx(y0)})`);
        s.cnt.setAttribute('y', 6 + csz);
        s.nm.setAttribute('y', 10 + csz + nsz);
        s.nm.textContent = fit(s.name, nsz, cw - 8);
        if (k) {
          s.div.setAttribute('x1', fx(k * cw));
          s.div.setAttribute('x2', fx(k * cw));
          s.div.setAttribute('y1', 0);
          s.div.setAttribute('y2', fx(y0));
        }
        if (!s.pill) return;
        const pw = Math.ceil(textW(pct0(s.cum), 700, fam, 14)) + 20;
        s.pw = pw;
        s.pr.setAttribute('width', pw);
        s.pr.setAttribute('x', fx(-pw / 2));
      });
      band.setAttribute('width', fx(cw));
      band.setAttribute('height', fx(y0));
      // 말풍선의 크기: 이름(12px)과 전환율(18px) 가운데 넓은 쪽에 좌우 10px. 이름은 그림 폭의 절반을 넘으면 줄여 적습니다.
      const nameText = fit(`${st[0].name} → ${lastS.name}`, 12, Math.max(60, w * 0.5));
      bubName.textContent = nameText;
      BW = Math.ceil(Math.max(textW(nameText, 500, fam, 12), textW(`${num(lastS.cum * 100, 1)}%`, 700, fam, 18))) + 20;
      const m = Math.max(16, Math.round(w / 3)) + 1;
      if (m !== M) { M = m; hs = new Float32Array(M); us = new Float32Array(M); wet = new Uint8Array(M); calm = true; }
      dx = w / (M - 1);
      xs = Array.from({ length: M }, (_, i) => i * dx);
      rp = xs.map(restAt);
      dep = rp.map((l) => (l < 0.5 ? 0 : Math.max(0.3, Math.min(1, l / 36))));
      room = rp.map((l) => Math.max(0.3, Math.min(1, (y0 - l - 4) / 28)));   // 물 위에 남은 자리: 위가 막힌 높은 단계는 겹물결을 그만큼 낮춰 그림 위로 넘치지 않게 합니다
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
    // 단계 j를 짚으면 그 칸이 물결칩니다. 같은 단계를 다시 짚으면 처음부터 다시 물결칩니다.
    function wave(j) {
      hv = hv.filter((o) => o.j !== j);
      hv.push({ j, age: 0 });
      calm = false;
      kick();
    }
    // 점 i에서 겹 m의 겹물결 높이와, 물결이 이는 정도(0~1, 뒤 겹이 솟는 정도)
    function hvAt(i, m) {
      let v = 0;
      const x = xs[i];
      for (const o of hv) {
        const u = (x - (o.j - 0.25) * cw) / (1.5 * cw);
        if (u <= 0 || u >= 1) continue;
        const e = envOf(o.age) * winOf(u), c = HV[m];
        v += e * c.a * Math.sin((2 * Math.PI * (x - (c.v * o.age) / 1000)) / (c.l * cw) + c.p);
      }
      return v;
    }
    function hvAct(i) {
      let v = 0;
      const x = xs[i];
      for (const o of hv) { const u = (x - (o.j - 0.25) * cw) / (1.5 * cw); v += envOf(o.age) * winOf(u); }
      return Math.min(1, v);
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
      hv.forEach((o) => { o.age += ms; });
      hv = hv.filter((o) => o.age < HV_END);
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
      ripple = mh;
      if (mh < 0.05 && mu < 0.8 && !hv.length) { hs.fill(0); us.fill(0); calm = true; ripple = 0; }
    }

    // 겹 m의 점 i 높이: 쉬는 높이 × 빠짐(dr). 흘러드는 동안은 앞머리(F) 앞이 비어 있고, 앞머리는 둥글게 바닥까지 내려오며 그 바로 뒤에 물마루가 솟습니다.
    // 그 위에 물결(흘러들 때 · 마우스로 민 물결, 뒤 겹은 조금 옮긴 물결)과 겹물결을 깊이만큼 더하고, 뒤 겹은 물결이 이는 만큼 한 겹마다 더 솟습니다.
    function level(i, m, F, sp) {
      const x = xs[i], lead = m * 6 * sp;
      if (x > F + lead) return 0;
      let v = rp[i] * dr;
      if (F < W) {
        const Fm = F + lead;
        if (x > Fm - NOSE) v *= Math.sqrt(Math.max(0, 1 - ((x - Fm + NOSE) / NOSE) ** 2));
        v += (3 + m) * sp * dep[i] * Math.exp(-(((x - (Fm - NOSE * 0.85)) / (NOSE * 0.75)) ** 2));
      }
      const simV = m ? hs[Math.min(M - 1, i + m * SH)] * (1 + 0.3 * m) : hs[i];
      const hvV = hv.length ? hvAt(i, m) * room[i] : 0;
      let lift = 0;
      if (m) {
        const act = Math.min(1, (hv.length ? hvAct(i) : 0) + Math.abs(hs[i]) / 3 + (F < W ? sp * Math.exp(-(((x - (F - NOSE)) / (NOSE * 1.6)) ** 2)) : 0));
        lift = m * LIFT * act * room[i];
      }
      return Math.max(0, v + ((simV + hvV) * dep[i] + lift) * dr);
    }
    // 단계 k의 칸에 담긴 물(겹 m): 칸의 왼쪽 끝에서 오른쪽 끝(흘러드는 동안은 앞머리)까지의 표면과 바닥으로 둘러쌉니다.
    function cellPath(k, lv, xe) {
      const x0 = k * cw, x1 = Math.min((k + 1) * cw, xe);
      if (x1 <= x0 + 0.1) return '';
      const at = (x) => { const q = x / dx, a = Math.max(0, Math.min(M - 1, Math.floor(q))), b = Math.min(M - 1, a + 1); return lv[a] + (lv[b] - lv[a]) * (q - a); };
      let p = `M${fx(x0)},${fx(y0)}L${fx(x0)},${fx(y0 - at(x0))}`;
      for (let i = Math.ceil(x0 / dx + 1e-6); i < M && xs[i] < x1; i++) p += `L${fx(xs[i])},${fx(y0 - lv[i])}`;
      return `${p}L${fx(x1)},${fx(y0 - at(x1))}L${fx(x1)},${fx(y0)}Z`;
    }
    const lvBuf = [new Float32Array(0), new Float32Array(0), new Float32Array(0)];
    function render() {
      if (!W) return;
      const F = frontAt(t), sp = speedAt(t), flowing = F > 0 && F < W;
      // 뒤 겹은 물결이 이는 동안(흘러들 때, 물결이 남아 있을 때, 겹물결이 일 때)에만 그립니다. 잔잔하면 물과 같은 높이라 지워 둡니다.
      const showBack = flowing || ripple > 0.15 || hv.length > 0;
      layers.forEach(({ m, paths }) => {
        if (lvBuf[m].length !== M) lvBuf[m] = new Float32Array(M);
        if (m && !showBack) { paths.forEach((p) => p.setAttribute('d', '')); return; }
        const lv = lvBuf[m];
        for (let i = 0; i < M; i++) lv[i] = level(i, m, F, sp);
        const xe = F >= W ? W : Math.min(W, F + m * 6 * sp + 0.5);
        paths.forEach((p, k) => p.setAttribute('d', F > 0.5 ? cellPath(k, lv, xe) : ''));
      });
      // 물 표면 선: 맨 앞 겹(물)의 표면. 흘러드는 동안은 앞머리를 따라 바닥까지 내려옵니다.
      let top = '';
      if (F > 0.5) {
        const lv = lvBuf[0];
        for (let i = 0; i < M && xs[i] <= F; i++) top += `${top ? 'L' : 'M'}${fx(xs[i])},${fx(y0 - lv[i])}`;
        if (F < W) top += `L${fx(F)},${fx(y0)}`;
      }
      line.setAttribute('d', top);
      // 단계 글자: 물의 앞머리가 그 칸에 들어서면 나타나 값을 0부터 셉니다. 알약은 앞머리가 칸의 가운데를 지나면 떠올라 물 위에서 물결을 따라 오르내립니다.
      st.forEach((s, k) => {
        const tin = timeAt(k * cw + 8), e = clamp((t - tin) / CNT);
        s.lab.setAttribute('opacity', fx(clamp((t - tin + 40) / 200) * dr));
        const [text, unit] = f.parts(part(s.v, easeOut(e)));
        s.cv.textContent = text;
        s.cu.textContent = unit ? (/^[A-Za-z]{2}/.test(unit) ? ` ${unit}` : unit) : '';   // 영어 낱말 단위는 한 칸 띄웁니다
        if (!s.pill) return;
        const b = s.cx, tb = timeAt(b + 10), q = clamp((t - tb) / POP), i = Math.min(M - 1, Math.round(b / dx));
        s.pill.setAttribute('opacity', fx(q * dr));
        s.pill.setAttribute('transform', `translate(${fx(b)},${fx(Math.min(y0 - 12, y0 - lvBuf[0][i]))}) scale(${fx(0.7 + 0.3 * easeOut(q))})`);
      });
      // 말풍선: 끝 단계에 물이 들어서면 꼬리 끝에서 튀어나와, 끝 단계의 값과 함께 전환율을 0부터 셉니다. 끝 단계의 물 위에 떠서 물결을 따라 오르내립니다.
      const tl = timeAt((N - 1) * cw + 8), eb = clamp((t - tl) / CNT), qb = clamp((t - tl) / POP);
      bubNum.textContent = num(lastS.cum * 100 * (eb >= 1 ? 1 : easeOut(eb)), 1);
      // 자리: 그림의 오른쪽 끝에 붙이고, 그 아래에 있는 물(쉬는 높이)과 알약보다 10px 위에 띄웁니다. 그림 위로는 TOP까지만 나갑니다.
      const bx = W - BW / 2, il = Math.min(M - 1, Math.round(lastS.cx / dx));
      let hi = 0;
      for (let i = Math.max(0, Math.floor((W - BW) / dx)); i < M; i++) hi = Math.max(hi, rp[i] * dr);
      st.forEach((o) => { if (o.pill && Math.abs(o.cx - bx) < (BW + o.pw) / 2 + 4) hi = Math.max(hi, Math.max(12, restAt(o.cx) * dr) + 12); });   // 알약은 바닥 위 12px보다 내려가지 않습니다
      const tipY = Math.min(y0, y0 - lvBuf[0][il]) - 4;    // 꼬리 끝: 끝 단계의 물 위 4px
      const by = Math.max(-TOP, Math.min(tipY - TAIL - BH, y0 - hi - 10 - BH));
      const tx0 = Math.max(-BW / 2 + 12, Math.min(BW / 2 - 12, lastS.cx - bx)), ty = Math.max(BH, tipY - by), sc = 0.6 + 0.4 * easeOut(qb);
      bubX = bx; bubY = by;
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
      hs.fill(0); us.fill(0); wet.fill(0); hv = []; calm = true; ripple = 0;
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
    // 짚는 자리: 단계(칸). 마우스는 그 칸을 짚고, 키보드는 좌우 화살표로 옮깁니다.
    // 짚으면 그 칸이 잔잔하게 물결치고, 그 알약(끝 단계는 말풍선)은 그대로 둔 채 채워 강조합니다. 짚은 알약을 숨기면 숫자가 사라져 오류처럼 보이기 때문입니다.
    // 툴팁은 알약의 비율을 되풀이하지 않고, 그 비율을 이루는 값('첫 단계 값 → 이 단계 값')과 앞 단계에서 넘어온 비율(단계별 전환율)을 알약 옆에 적습니다.
    // 나머지 알약 · 단계 글자 · 말풍선은 옅게 둡니다.
    interact(plot, N,
      (cx) => { const r = plot.getBoundingClientRect(); return Math.max(0, Math.min(N - 1, Math.floor(((cx - r.left) * N) / (r.width || 1)))); },
      (j) => {
        const s = st[j], a = st[0], p = st[j - 1], r = plot.getBoundingClientRect(), k2 = r.width / (W || 1);
        if (j !== hot) { hot = j; wave(j); }
        svg.classList.add('is-hover');
        band.setAttribute('x', fx(j * cw));
        st.forEach((x) => { x.lab.classList.toggle('is-on', x === s); if (x.pill) x.pill.classList.toggle('is-on', x === s); });
        bub.classList.toggle('is-on', j === N - 1);
        const tb = tipBody(j ? {
          flow: [{ name: a.name, value: show(f, a.v) }, { name: s.name, value: show(f, s.v) }],
          note: tx(d, '%1에서 %2 넘어옴', p.name, pct1(s.step)),
        } : { note: tx(d, '퍼널의 시작') }, s.name);
        // 툴팁 자리: 짚은 알약(끝 단계는 말풍선)의 위. 그 위에 들어갈 자리(120px)가 없으면 옆(왼쪽 절반은 오른쪽, 오른쪽 절반은 왼쪽)에 둡니다.
        let ax = s.cx, ay, hw;
        if (s.pill) { ay = Math.min(y0 - 12, y0 - restAt(s.cx)) - 14; hw = s.pw / 2 + 6; }
        else { ax = bubX; ay = bubY - 4; hw = BW / 2 + 6; }
        const side = ay < 120 ? (ax < W / 2 ? 'right' : 'left') : null;
        const sx = side === 'right' ? ax + hw : side === 'left' ? ax - hw : ax;
        return { x: r.left + sx * k2, y: r.top + (side ? Math.max(ay + 14, 60) : ay) * k2, side, label: s.name, value: tb.node, text: tb.text };
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
