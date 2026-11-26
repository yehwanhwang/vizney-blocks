  // Butterfly Fold: 가운데 열에 항목 이름을 두고, 왼쪽 그룹(첫째 데이터 색)과 오른쪽 그룹(둘째 데이터 색)의 막대를 양쪽으로 뻗어 항목마다 두 그룹을 견주는 버터플라이 차트입니다
  // (예: 여성 · 남성 회원의 카테고리별 주문 수). 두 날개는 같은 눈금이고, 가운데에는 이름만 두어 두 날개를 가까이 붙입니다(이름 열이 나비의 몸통). 값은 제 막대 끝에 적습니다.
  // 색: 밝은 바탕은 왼쪽 분홍빨강 · 오른쪽 파랑, 어두운 바탕은 왼쪽 노랑 · 오른쪽 흰색입니다.
  // 견주기: 항목을 짚으면 그 줄의 적은 쪽 막대 끝에서 많은 쪽의 길이까지, 반대쪽 막대의 색으로 점선을 긋고 끝에 짧은 마감을 세웁니다(간트 차트의 구간처럼, 반대쪽 막대를 접어 포갰을 때 닿는 데까지).
  // 점선의 길이가 두 그룹의 차이이고, 그 색이 많은 쪽입니다. 점선은 막대의 아래 가장자리 높이에 그어 막대 끝의 값과 겹치지 않습니다.
  // 움직임: 화면에 보이면 접혀 있던 두 날개가 좌우로 펼쳐지고(값 그대로의 막대), 한 번 접어 맞닿았다가 다시 펼칩니다. 맞닿은 날개는 서로의 색을 옮겨 받아,
  // 다시 펼칠 때 모든 줄에 점선이 잠깐 보였다가 사라집니다(짚으면 다시 보인다는 예고). 날개는 경첩(이름 열의 가장자리)을 축으로 접히고, 두 날개는 거울처럼 함께 움직입니다.
  // 날갯짓처럼 부드럽게: 움직임은 멈춤과 출발이 느린 진자 같은 곡선을 따르고, 날개는 뿌리가 먼저 움직이고 끝이 조금 늦게 따라오며 휘어집니다. 막대의 길이는 값이므로 펼친 자리를 지나치지 않습니다.
  // 줄마다 조금씩 늦게 움직여 위에서 아래로 물결이 지나가고(파도타기), 같은 줄의 좌우 막대는 늘 함께 움직입니다.
  // 움직이는 동안 막대는 원근으로 짧아 보이고, 멈춘 장면의 길이는 값 그대로입니다.
  // 값은 날개에 붙어 함께 움직이며 접힐수록 옅어지고, 이름은 움직이지 않습니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 마우스를 올리거나 키보드로 포커스하면 움직임을 잠시 멈춥니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 처음부터 접고 펴지 않고, 펼친 날개에서 막대가 있던 길이와 자리에서 새 길이와 자리로 옮겨 갑니다(같은 이름의 항목이 같은 줄).
  // 새 항목은 경첩에서 자라고 빠진 항목은 흐려지며 사라집니다. 앞 카드가 접고 펴던 중이었거나 그룹 · 카드 크기가 달라지면 옮겨 가지 않고 펼친 날개를 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고, 날개를 접었다가 처음부터 다시 펼칩니다.
  mount('butterfly-fold', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-bf-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const groups = Array.isArray(d.groups) ? d.groups.map(String) : [];
    if (groups.length !== 2) throw new Error(tx(d, 'groups에 왼쪽과 오른쪽 그룹의 이름 2개를 적으세요.'));
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (list.length < 2 || list.length > 10) throw new Error(tx(d, 'items에 항목을 2~10개 적으세요.'));
    const okv = (v) => v == null || (fin(v) && v >= 0);
    if (list.some((it) => !okv(it.left) || !okv(it.right))) throw new Error(tx(d, 'items의 left와 right에 0 이상의 값을 적으세요.'));
    const items = list.map((it) => ({ name: String(it.name), v: [it.left, it.right].map((x) => (fin(x) ? +x : null)) }));
    const N = items.length;
    const vmax = Math.max(0, ...items.flatMap((it) => it.v.filter((x) => x != null))) || 1;
    const tot = [0, 1].map((s) => items.reduce((a, it) => a + (it.v[s] || 0), 0));
    // 항목마다 두 그룹의 차이: lead는 많은 쪽(0 왼쪽, 1 오른쪽), 같으면 -1, 한쪽 값이 없으면 null입니다.
    items.forEach((it) => {
      const [a, b] = it.v;
      it.lead = a == null || b == null ? null : a > b ? 0 : b > a ? 1 : -1;
      it.gap = it.lead == null ? 0 : Math.abs(a - b);
    });
    const bare = (v) => f.parts(v)[0];   // 막대 끝의 값은 숫자만, 단위는 위쪽 줄과 툴팁에 적습니다
    const pct1 = (r) => `${num(r * 100, 1)}%`;
    const fx = (v) => v.toFixed(1);
    const gapText = (it) => (it.lead == null ? '–' : it.lead < 0 ? tx(d, '같음') : `${groups[it.lead]} ${signed(f, it.gap)}`);

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    const btn = el('button', 'vzb-bf-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-bf-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    hd.append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    // 위쪽 줄: 왼쪽 끝에 왼쪽 그룹, 오른쪽 끝에 오른쪽 그룹(견본 · 이름 · 합계). 범례를 대신합니다.
    const keys = el('div', 'vzb-bf-keys');
    // 합계의 글자: 만들 때와 옮겨 가는 동안 같은 모양으로 적습니다.
    function setTot(b, v) {
      const [a, u] = f.parts(v);
      if (b.key === a + '|' + u) return;
      b.key = a + '|' + u;
      b.replaceChildren(el('span', null, a));
      if (u) b.append(el('span', 'vzb-bf-u', u));
    }
    const gk = [0, 1].map((s) => {
      const k = el('span', `vzb-bf-key ${s ? 'is-right' : 'is-left'}`), b = el('b', 'vzb-bf-tot');
      k.tot = b;
      setTot(b, tot[s]);
      k.append(el('i', `vzb-key is-box vzb-bf-k${s}`), el('span', null, groups[s]), b);
      return k;
    });
    keys.append(gk[0], gk[1]);
    const foot = el('div', 'vzb-foot vzb-fill vzb-bf');
    const plot = el('div', 'vzb-plot vzb-bf-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3, %4 %5. 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.',
      d.title || '', groups[0], show(f, tot[0]), groups[1], show(f, tot[1])));
    const svg = svgEl('svg', { class: 'vzb-bf-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(keys, plot);
    card.append(foot);
    // 화면 낭독기용 표: 항목 · 두 그룹의 값 · 차이, 맨 아래에 합계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr0 = el('tr');
    hr0.append(...[tx(d, '항목'), groups[0], groups[1], tx(d, '차이')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr0);
    items.forEach((it) => {
      const tr = el('tr');
      tr.append(el('th', null, it.name), ...it.v.map((v) => el('td', null, v == null ? '–' : show(f, v))), el('td', null, gapText(it)));
      table.append(tr);
    });
    const trT = el('tr');
    trT.append(el('th', null, tx(d, '합계')), ...tot.map((v) => el('td', null, show(f, v))), el('td', null, ''));
    table.append(trT);
    sr.append(table);
    card.append(sr);

    // 그림(아래부터): 짚은 줄의 띠 · 점선과 그 끝의 마감 · 막대 · 이름과 값
    const band = svgEl('rect', { class: 'vzb-bf-band' });
    let RBAR = 4;   // 막대 바깥 끝과 띠의 모서리(--vzb-radius-mark)
    const gTail = svgEl('g', {}), gBar = svgEl('g', {}), gTxt = svgEl('g', {});
    const draw = (it) => {
      it.bar = [0, 1].map((s) => svgEl('path', { class: `vzb-bf-bar ${s ? 'is-r' : 'is-l'}` }));
      it.tail = [0, 1].map((s) => svgEl('path', { class: `vzb-bf-tail ${s ? 'is-r' : 'is-l'}` }));
      it.cap = [0, 1].map((s) => svgEl('path', { class: `vzb-bf-cap ${s ? 'is-r' : 'is-l'}` }));
      it.nm = svgText(0, 0, it.name, 'vzb-bf-nm', 'middle');
      it.lab = [0, 1].map((s) => svgText(0, 0, it.v[s] == null ? '–' : bare(it.v[s]), 'vzb-bf-val', s ? 'start' : 'end'));   // 값은 제 막대의 바깥 끝에 붙입니다
      gTail.append(...it.tail, ...it.cap);
      gBar.append(...it.bar);
      gTxt.append(it.nm, ...it.lab);
    };
    items.forEach(draw);
    svg.append(band, gTail, gBar, gTxt);

    // 가운데 열과 값의 폭(짚으면 굵어지므로 굵은 글자로 잽니다). 글꼴이 늦게 실리면 실린 뒤 다시 잽니다(아래 fonts.ready).
    const fam = getComputedStyle(card).fontFamily;
    let nameW = 0, valW = 0;
    const measure = () => {
      nameW = Math.max(...items.map((it) => textW(it.name, 700, fam, 14)));
      items.forEach((it) => { it.lw = it.lab.map((l) => textW(l.textContent, 700, fam, 14)); });
      valW = Math.max(...items.flatMap((it) => it.lw));
    };
    measure();
    // 가운데 열은 가장 긴 이름에 양옆 10px이고, 그 가장자리가 경첩입니다. 날개는 경첩에서 값 자리(6px + 가장 긴 값)를 남기고 카드 끝까지 뻗습니다.
    // 막대 두께는 줄 간격의 72%(최대 32px)입니다.
    let W = 0, H = 0, cx = 0, hl = 0, hr = 0, span = 1, pitch = 1, hh0 = 1, ym = 0, PD = 1;
    const PK = 11;   // 원근: 보는 눈이 가장 긴 날개 길이의 11배 떨어져 있습니다(접힌 날개 끝이 위아래로 10%쯤만 벌어집니다)
    const sc = (v) => (v > 0 ? (v / vmax) * span : 0);
    const rowY = (r) => pitch * (r + 0.5);
    // 옮겨 가기: 앞 카드가 맡긴 장면(scene)에서 시작해, 줄의 높이 · 막대의 길이(px) · 값 · 합계 · 가운데 열의 폭 · 막대 두께를 스프링(Move: 넘치지 않음)으로 옮깁니다.
    // it.sy가 줄의 높이, it.sl[s]가 막대의 길이, it.sn[s]가 막대 끝에 적는 값이고, lost가 빠져서 흐려지는 항목입니다.
    const [MK, MC] = motion(card).pair('move');
    let scene = before(card), moving = false, lost = [], m0 = 0, sB = null, sH = null, sT = null, T_BODY = 0, T_HH = 0;
    function layout(w, h) {
      W = w; H = h;
      RBAR = len(card, 'radius-mark', 4);
      band.setAttribute('rx', RBAR);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cx = w / 2;
      const body = nameW / 2 + 10;
      hl = cx - body;
      hr = cx + body;
      span = Math.max(12, w / 2 - body - 6 - valW - 2);
      pitch = h / N;
      hh0 = Math.max(3, Math.min(16, pitch * 0.36));
      ym = h / 2;
      PD = span * PK;
      T_BODY = body; T_HH = hh0;
      if (moving) settle();   // 옮겨 가는 중에 크기가 바뀌면 새 크기의 마지막 장면으로 둡니다
      items.forEach((it, r) => { it.nm.setAttribute('x', fx(cx)); it.nm.setAttribute('y', fx(rowY(r) + 5)); });
      band.setAttribute('x', 0);
      band.setAttribute('width', fx(w));
      band.setAttribute('height', fx(Math.max(0, pitch - 2)));
      if (scene) { const prev = scene; scene = null; begin(prev); }
      render();
    }

    // 날개의 모양: 날개는 뻣뻣한 판이 아니라 뿌리(경첩)가 먼저 움직이고 끝이 조금 늦게 따라오는 부드러운 날개입니다(끝이 LAG만큼 늦습니다).
    // 날개를 S마디로 나눠 마디마다 들린 각(TH)을 구하고, 경첩에서부터 이어 붙여 마디 끝의 가로 자리(X)와 화면 앞으로 나온 깊이(Z)를 셉니다.
    // 깊이 z에 있는 점은 g = PD / (PD - z)배로 멀리 보여, 들린 날개의 끝은 경첩 쪽으로 다가옵니다.
    const A_MAX = 1.42;   // 접힘은 81°: 날개가 아주 사라지지 않고 경첩 옆에 짧은 띠(길이의 15%쯤)로 남습니다
    const S = 24, LAG = 130;
    const TH = new Float64Array(S + 1), X = new Float64Array(S + 1), Z = new Float64Array(S + 1);
    let flat = true;
    // 줄마다 조금씩 늦게 움직여(ROW) 위에서 아래로 물결이 지나갑니다. 맨 위와 맨 아래 줄의 차이는 0.25초를 넘지 않아 날개가 한 장으로 읽힙니다.
    // 처음의 뜸(Lead) · 차례의 전체 시간(Seq) · 되풀이 전의 쉼(Rest) · 투명도의 시간(Fade)은 움직임 값에서 읽습니다. 접고 펴는 시간표는 이 카드의 이야기 속도입니다.
    const M = motion(card), LEAD = M.ms('lead'), REST = M.ms('rest'), FADE = M.ms('fade');
    const ROW = Math.min(45, 250 / Math.max(1, N - 1), M.ms('seq') / N), WAVE = ROW * (N - 1);
    function shape(row) {
      const ds = span / S, t0 = tau - ROW * row;
      flat = true;
      for (let i = 0; i <= S; i++) { TH[i] = A_MAX * curve(t0 - (LAG * i) / S); if (Math.abs(TH[i]) > 1e-4) flat = false; }
      X[0] = 0; Z[0] = 0;
      for (let i = 1; i <= S; i++) { const a = (TH[i - 1] + TH[i]) / 2; X[i] = X[i - 1] + ds * Math.cos(a); Z[i] = Z[i - 1] + ds * Math.sin(a); }
    }
    // 경첩에서 r만큼 떨어진 점의 자리(날개 끝 밖은 끝 마디의 방향으로 잇습니다)
    function proj(hx, dir, r, y) {
      const ds = span / S, q = r / ds, i = Math.max(0, Math.min(S - 1, Math.floor(q))), k = q - i, over = r > span ? r - span : 0;
      const x = over ? X[S] + over * Math.cos(TH[S]) : X[i] + (X[i + 1] - X[i]) * k, z = over ? Z[S] + over * Math.sin(TH[S]) : Z[i] + (Z[i + 1] - Z[i]) * k;
      const g = PD / (PD - z);
      return [hx + dir * x * g, y];   // 줄마다 제자리에서 가로로만 접힙니다(위아래로 벌어지면 줄마다 각이 달라 비뚤어져 보입니다)
    }
    const angleAt = (r) => TH[Math.max(0, Math.min(S, Math.round((r / span) * S)))];
    // 날개 위의 막대 한 조각(경첩에서 r0부터 r1까지): 날개가 휘어 있으면 마디마다 꺾어 그리고, 바깥 끝만 둥급니다.
    // 바깥 끝과 짚은 줄의 띠는 --vzb-radius-mark(비우면 4px)를 따릅니다(RBAR, layout에서 읽습니다).
    const pts = (a) => a.map((q) => `${fx(q[0])},${fx(q[1])}`).join('L');
    function slab(hx, dir, r0, r1, yc, ins = 0) {
      if (r1 - r0 < 0.5) return '';
      const hh = hh0 - ins, rr = Math.min(RBAR, (r1 - r0) / 2, hh), rs = [r0], ds = span / S;
      if (!flat) for (let i = Math.floor(r0 / ds) + 1; i * ds < r1 - rr - 0.5; i++) rs.push(i * ds);
      rs.push(r1 - rr);
      const top = rs.map((r) => proj(hx, dir, r, yc - hh)), bot = rs.map((r) => proj(hx, dir, r, yc + hh)).reverse();
      const B = proj(hx, dir, r1, yc - hh), C = proj(hx, dir, r1, yc + hh);
      if (Math.abs(B[0] - top[0][0]) < 0.3) return '';
      const rv = Math.min(rr, (C[1] - B[1]) / 2);
      return `M${pts(top)}Q${fx(B[0])},${fx(B[1])} ${fx(B[0])},${fx(B[1] + rv)}L${fx(C[0])},${fx(C[1] - rv)}Q${fx(C[0])},${fx(C[1])} ${pts(bot)}Z`;
    }
    // 움직임의 시간표: [밀리초, 접힌 정도(1 접힘, 0 펼침)]. 점 사이는 코사인 곡선으로 이어, 점마다 속도가 0이 되는 진자 같은 움직임입니다. 펼친 자리를 지나치지 않습니다.
    // 펼침 → 숨 고르기 → 접음(맞닿는 순간 서로의 자리를 옮겨 받음) → 다시 펼침(점선과 함께)
    const KEYS = [[0, 1], [700, 0], [1000, 0], [1620, 1], [2360, 0]];
    const T_FOLDED = 1620, END = 2360, CLOSE = 560;
    const blend = (a, b, k) => a + ((b - a) * (1 - Math.cos(Math.PI * k))) / 2;
    function pose(t) {
      if (t <= 0) return 1;
      if (t >= END) return 0;
      let i = 1;
      while (KEYS[i][0] < t) i++;
      return blend(KEYS[i - 1][1], KEYS[i][1], (t - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]));
    }
    // 상태: mode가 'play'면 시간표를, 'close'면 다시 보기 전에 날개를 접는 움직임(c0에서 접힘까지)을 따릅니다. tau는 그 움직임의 시각,
    let mode = 'play', tau = live ? 1e9 : -LEAD, c0 = 0, hot = -1;
    // 점선이 보이는 정도: 짚은 줄은 늘 보이고, 재생할 때는 그 줄이 접힌 순간부터 다시 펼친 뒤 LINGER 동안 보였다가 Fade의 시간에 사라집니다.
    const LINGER = 1300;
    const ghost = (r) => {
      if (r === hot) return 1;
      if (mode !== 'play' || tau - ROW * r < T_FOLDED + LAG / 2) return 0;
      return Math.max(0, Math.min(1, 1 - (tau - (END + LAG + WAVE + LINGER)) / FADE));
    };
    const curve = (x) => (mode === 'play' ? pose(x) : x <= 0 ? c0 : x >= CLOSE ? 1 : blend(c0, 1, x / CLOSE));
    function render() {
      if (!W) return;
      const fk = moving ? fadeK() : 1;
      items.concat(lost).forEach((it, r) => {
        const yc = it.sy ? it.sy.x : rowY(r), ga = it.lost ? 0 : ghost(r), fading = moving && (it.lost || it.o0 < 1), op = fading ? oOf(it, fk) : 1;
        shape(it.lost ? 0 : r);
        if (it.sy) it.nm.setAttribute('y', fx(yc + 5));
        if (fading) it.nm.style.opacity = op.toFixed(3);
        [0, 1].forEach((s) => {
          const dir = s ? 1 : -1, hx = s ? hr : hl, v = it.v[s], o = it.v[1 - s], len = it.sl ? it.sl[s].x : sc(v || 0);
          it.bar[s].setAttribute('d', v == null && !(it.sl && len > 0.5) ? '' : slab(hx, dir, 0, len, yc));
          if (fading) it.bar[s].style.opacity = op.toFixed(3);
          if (it.sn && it.sn[s]) { const tv = bare(whole(it.sn[s].x, it.v[s])); if (it.lab[s].textContent !== tv) it.lab[s].textContent = tv; }
          // 점선: 적은 쪽 막대 끝에서 3px 띄우고 많은 쪽의 길이까지, 막대의 아래 가장자리 높이에 긋습니다. 끝에는 값의 글자에 닿지 않는 짧은 마감을 세웁니다.
          const r0 = len > 0.5 ? len + 3 : 1, r1 = it.sl ? it.sl[1 - s].x : sc(o || 0), less = v != null && o != null && o > v && r1 - r0 >= 3 && ga > 0;
          const ly = yc + hh0 - 1, tick = Math.max(3, Math.min(6, hh0 - 7)), ds = span / S, rs = [r0];
          if (less && !flat) for (let i = Math.floor(r0 / ds) + 1; i * ds < r1 - 0.5; i++) rs.push(i * ds);
          rs.push(r1);
          it.tail[s].setAttribute('d', less ? `M${pts(rs.map((r) => proj(hx, dir, r, ly)))}` : '');
          it.cap[s].setAttribute('d', less ? `M${pts([proj(hx, dir, r1, ly - tick), proj(hx, dir, r1, ly)])}` : '');
          it.tail[s].style.opacity = it.cap[s].style.opacity = ga.toFixed(3);
          // 값: 제 막대 끝에서 6px 밖에 두고, 날개를 따라 움직입니다. 그 자리의 날개가 접힐수록 옅어집니다.
          const off = 6, P = proj(hx, dir, len + off, yc), lab = it.lab[s];
          lab.setAttribute('x', fx(P[0]));
          lab.setAttribute('y', fx(P[1] + 5));
          lab.style.opacity = (op * Math.max(0, Math.min(1, (Math.cos(angleAt(len + off)) - 0.3) / 0.45))).toFixed(3);
        });
      });
      band.style.display = hot < 0 ? 'none' : '';
      if (hot >= 0) band.setAttribute('y', fx(rowY(hot) - pitch / 2 + 1));
    }

    // 앞 장면에서 시작합니다. 같은 이름의 항목이 같은 줄입니다. 앞 카드가 접고 펴던 중이었거나, 그룹이나 카드 크기가 다르면 옮겨 가지 않습니다.
    const fadeK = () => Math.max(0, Math.min(1, (performance.now() - m0) / FADE));
    const oOf = (it, k) => (it.lost ? it.o0 * (1 - k) : it.o0 + (1 - it.o0) * k);
    const near = (a, b, e) => Math.abs(a - b) <= e;
    const whole = (x, to) => (Number.isInteger(to) ? Math.round(x) : x);   // 정수로 가는 값은 가는 동안에도 정수로 적습니다
    function begin(prev) {
      if (!prev || !prev.inView || !prev.flat || prev.W !== W || prev.H !== H || !Array.isArray(prev.items)) return;
      if (!Array.isArray(prev.groups) || prev.groups[0] !== groups[0] || prev.groups[1] !== groups[1]) return;
      const now = performance.now(), old = new Map(prev.items.map((q) => [q.name, q]));
      let any = false;
      items.forEach((it, r) => {
        const q = old.get(it.name);
        old.delete(it.name);
        it.o0 = q ? q.o : 0;
        if (q) {
          it.sy = { x: q.y, v: q.yv || 0 };
          it.sl = [0, 1].map((s) => ({ x: q.len[s], v: q.lv[s] || 0 }));
          it.sn = [0, 1].map((s) => (it.v[s] != null && q.val[s] != null ? { x: q.val[s], v: q.vv[s] || 0 } : null));
        } else {   // 새 항목: 제 줄에서 경첩부터 자라며 나타납니다
          it.sy = { x: rowY(r), v: 0 };
          it.sl = [0, 1].map(() => ({ x: 0, v: 0 }));
          it.sn = [0, 1].map((s) => (it.v[s] != null ? { x: 0, v: 0 } : null));
        }
        if (it.o0 < 1 || !near(it.sy.x, rowY(r), 0.1) || Math.abs(it.sy.v) > 1) any = true;
        [0, 1].forEach((s) => {
          if (!near(it.sl[s].x, sc(it.v[s] || 0), 0.1) || Math.abs(it.sl[s].v) > 1) any = true;
          if (it.sn[s] && !near(it.sn[s].x, it.v[s], vmax * 1e-6)) any = true;
        });
      });
      // 빠진 항목: 있던 자리와 길이 그대로 그려 두고 흐려지게 합니다.
      old.forEach((q) => {
        if (!(q.o > 0.01)) return;
        const g = { name: q.name, lost: true, o0: q.o, v: [null, null], sy: { x: q.y, v: 0 }, sl: q.len.map((x) => ({ x, v: 0 })), sn: null };
        draw(g);
        g.lab.forEach((l, s) => { l.textContent = q.txt[s]; });
        g.nm.setAttribute('x', fx(cx));
        lost.push(g);
        any = true;
      });
      if (!near(prev.body, T_BODY, 0.05) || !near(prev.hh, T_HH, 0.05) || tot.some((v, s) => !near(prev.tot[s], v, 1e-9))) any = true;
      if (!any) { items.forEach((it) => { it.sy = it.sl = it.sn = null; it.o0 = 1; }); return; }
      sB = { x: prev.body, v: prev.bv || 0 };
      sH = { x: prev.hh, v: prev.hv || 0 };
      sT = [0, 1].map((s) => ({ x: prev.tot[s], v: (prev.tv && prev.tv[s]) || 0 }));
      moving = true;
      m0 = now;
      stepMove(Math.min(100, Math.max(0, now - (prev.at || now))));   // 끄는 동안처럼 그릴 틈 없이 갈아 끼워져도, 그 사이 흐른 시간만큼 나아갑니다
      kick();
    }
    // 스프링을 dt만큼 옮기고, 모두 제자리에 닿고 다 나타나거나 사라졌으면 끝냅니다.
    function stepMove(dt) {
      let more = false;
      const go = (sp, to, unit) => {
        springTo(sp, to, MK, MC, dt);
        if (Math.abs(sp.x - to) > unit * 0.0006 || Math.abs(sp.v) > unit * 0.01) more = true; else { sp.x = to; sp.v = 0; }
      };
      const px = Math.max(1, span), tmax = Math.max(1, tot[0], tot[1], sT[0].x, sT[1].x);
      items.forEach((it, r) => {
        if (!it.sy) return;
        go(it.sy, rowY(r), px);
        [0, 1].forEach((s) => { go(it.sl[s], sc(it.v[s] || 0), px); if (it.sn[s]) go(it.sn[s], it.v[s], vmax); });
      });
      go(sB, T_BODY, px);
      go(sH, T_HH, px);
      [0, 1].forEach((s) => { go(sT[s], tot[s], tmax); setTot(gk[s].tot, whole(sT[s].x, tot[s])); });
      if (fadeK() < 1 && (lost.length || items.some((it) => it.o0 < 1))) more = true;
      if (!more) { settle(); return; }
      hl = cx - sB.x; hr = cx + sB.x; hh0 = sH.x;
    }
    // 다 옮겨 갔습니다: 옮겨 가는 동안 둔 것(높이 · 길이 · 값 · 투명도 · 사라지던 항목)을 걷어 내, 처음부터 그린 장면과 같게 합니다.
    function settle() {
      moving = false;
      hl = cx - T_BODY; hr = cx + T_BODY; hh0 = T_HH;
      const clear = (n2) => { n2.style.removeProperty('opacity'); if (!n2.getAttribute('style')) n2.removeAttribute('style'); };
      items.forEach((it, r) => {
        if (it.o0 < 1) [it.nm, ...it.bar].forEach(clear);
        it.sy = it.sl = it.sn = null;
        it.o0 = 1;
        it.nm.setAttribute('y', fx(rowY(r) + 5));
        it.lab.forEach((l, s) => { const tv = it.v[s] == null ? '–' : bare(it.v[s]); if (l.textContent !== tv) l.textContent = tv; });
      });
      lost.forEach((g) => [g.nm, ...g.bar, ...g.tail, ...g.cap, ...g.lab].forEach((n2) => n2.remove()));
      lost = [];
      if (sT) [0, 1].forEach((s) => setTot(gk[s].tot, tot[s]));
      sB = sH = sT = null;
    }
    keep(card, () => {
      if (!W) return scene;
      const k = moving ? fadeK() : 1;
      const one = (it, r) => ({
        name: it.name, o: moving && (it.lost || it.o0 < 1) ? oOf(it, k) : 1, txt: it.lab.map((l) => l.textContent),
        y: it.sy ? it.sy.x : rowY(r), yv: it.sy ? it.sy.v : 0,
        len: [0, 1].map((s) => (it.sl ? it.sl[s].x : sc(it.v[s] || 0))), lv: [0, 1].map((s) => (it.sl ? it.sl[s].v : 0)),
        val: [0, 1].map((s) => (it.sn && it.sn[s] ? it.sn[s].x : it.v[s])), vv: [0, 1].map((s) => (it.sn && it.sn[s] ? it.sn[s].v : 0)),
      });
      return {
        at: performance.now(), inView, W, H, groups, flat: mode === 'play' && tau - WAVE >= END + LAG,
        body: sB ? sB.x : T_BODY, bv: sB ? sB.v : 0, hh: sH ? sH.x : T_HH, hv: sH ? sH.v : 0,
        tot: sT ? sT.map((q) => q.x) : tot, tv: sT ? sT.map((q) => q.v) : [0, 0],
        items: items.map(one).concat(lost.map((g) => Object.assign(one(g, 0), { gone: true }))),
      };
    });

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 나아갑니다. 카드가 페이지에서 빠지면 멈춥니다.
    // 옮겨 가기는 데이터가 바뀐 데 대한 답이라, 마우스가 올라가 있어도 끝까지 갑니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let idle = 0, playing = false, seen = false, inView = false, raf = 0, last = 0;
    const busy = () => playing && !holds.size;
    const fold = () => { c0 = curve(tau - WAVE / 2); mode = 'close'; tau = 0; };   // 지금 자리에서 접기 시작합니다
    function advance(dt) {
      if (idle > 0) { idle = Math.max(0, idle - dt); if (!idle) fold(); return; }   // 갤러리: 쉬고 난 뒤 날개를 접고, 처음부터 다시 펼칩니다
      tau += dt;
      if (mode === 'close') { if (tau >= CLOSE + LAG + WAVE) { mode = 'play'; tau = 0; } return; }
      if (tau >= END + LAG + WAVE + LINGER + FADE) { tau = 1e9; if (loop) idle = Math.max(200, REST - LINGER); else playing = false; }
    }
    function tick(stamp) {
      raf = 0;
      if (!card.isConnected || !inView) { last = 0; return; }
      const dt = last ? Math.min(64, stamp - last) : 16;
      last = stamp;
      if (moving) stepMove(dt);
      if (busy()) advance(dt);
      render();
      if (moving || busy()) raf = requestAnimationFrame(tick); else last = 0;
    }
    function kick() { if (!raf && inView && card.isConnected && (moving || busy())) raf = requestAnimationFrame(tick); }
    // 다시 보기: 날개가 펼쳐져 있으면 그 자리에서 접은 뒤 처음부터 펼칩니다(접힌 날개로 건너뛰지 않습니다).
    function play() {
      idle = 0;
      playing = true;
      last = 0;
      if (moving) settle();   // 옮겨 가던 중에 다시 보기를 누르면 새 값의 장면에서 접습니다
      if (mode === 'play' && tau > 0) fold();
      render();
      kick();
    }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 짚는 자리: 항목(줄). 마우스는 그 줄을 짚고, 키보드는 위아래 화살표로 옮깁니다.
    // 짚으면 그 줄에 옅은 띠를 깔고 이름과 두 값을 굵게 두며, 적은 쪽에 반대쪽 색의 점선이 나타납니다(값은 숨기지 않습니다). 툴팁은 두 값을 되풀이하지 않고,
    // 어느 쪽이 얼마나 많은지(차이와 배수)와, 두 그룹의 색 견본과 함께 각 그룹 합계에서 차지하는 비중을 적습니다.
    // 툴팁은 날개 바깥에 자리가 있으면 그 줄 옆에 두어 다른 줄의 값과 합계를 덮지 않고, 자리가 없으면 그 줄 위, 많은 쪽 날개 쪽에 둡니다.
    interact(plot, N,
      (x0, y0) => { const r = plot.getBoundingClientRect(); return Math.max(0, Math.min(N - 1, Math.floor(((y0 - r.top) * N) / (r.height || 1)))); },
      (k) => {
        const it = items[k], r = plot.getBoundingClientRect(), k2 = r.width / (W || 1);
        hot = k;
        svg.classList.add('is-hover');
        items.forEach((x, q) => [x.nm, ...x.lab].forEach((n2) => n2.classList.toggle('is-on', q === k)));
        render();
        const note = [];
        if (it.lead != null && it.lead >= 0 && it.v[1 - it.lead] > 0) note.push(tx(d, '%1의 %2배', groups[1 - it.lead], num(it.v[it.lead] / it.v[1 - it.lead], 1)));
        // 두 그룹의 색 견본과 함께, 이 항목이 각 그룹 합계에서 차지하는 비중을 적습니다(많은 쪽을 위에).
        const rows = [0, 1].filter((z) => it.v[z] != null && tot[z] > 0).map((z) => ({ tone: `bf-k${z}`, box: true, value: pct1(it.v[z] / tot[z]), name: tx(d, '%s 합계에서', groups[z]) }));
        if (it.lead === 1) rows.reverse();
        const tb = tipBody({ value: gapText(it), big: true, rows, note }, it.name);
        const s = it.lead === 1 ? 1 : 0, m = Math.max(sc(it.v[0] || 0), sc(it.v[1] || 0));
        const x = it.lead == null || it.lead < 0 ? cx : (s ? hr : hl) + (s ? 1 : -1) * Math.max(24, m / 2);
        // 날개 바깥(값이 끝나는 곳 밖)에 툴팁이 들어갈 자리(250px)가 있으면 그 줄 옆에 둡니다. 많은 쪽을 먼저 쓰고, 없으면 반대쪽을 씁니다.
        const edge = [0, 1].map((z) => Math.max(...items.map((x) => Math.max(sc(x.v[0] || 0), sc(x.v[1] || 0)) + 6 + x.lw[z] + 4)));
        const outL = r.left + (hl - edge[0]) * k2, outR = r.left + (hr + edge[1]) * k2;
        const roomL = outL >= 250, roomR = window.innerWidth - outR >= 250, right = s ? roomR || !roomL : !roomL && roomR;
        if (roomL || roomR) return { x: right ? outR : outL, y: r.top + rowY(k) * k2, side: right ? 'right' : 'left', label: it.name, value: tb.node, text: tb.text };
        return { x: r.left + x * k2, y: r.top + (rowY(k) - pitch / 2 + 2) * k2, label: it.name, value: tb.node, text: tb.text };
      },
      () => { hot = -1; svg.classList.remove('is-hover'); items.forEach((x) => [x.nm, ...x.lab].forEach((n2) => n2.classList.remove('is-on'))); render(); },
      true);

    if (scene) inView = !!scene.inView;   // 앞 카드가 화면에 보이고 있었으면 바로 움직입니다
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (!inView && moving) { settle(); render(); }   // 화면 밖에서는 다 옮겨 간 장면으로 둡니다
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
