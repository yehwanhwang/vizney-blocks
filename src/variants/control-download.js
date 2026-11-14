  // Download Button: 화면에 있는 차트 카드(target)의 데이터를 CSV로 내려받는 단추입니다. 컨트롤로 거른 뒤의 JSON을 읽으므로 보이는 그대로 받습니다.
  // target에는 카드의 종류(data-vzb, 예: bar-budget)를 적습니다. 페이지에서 처음 만나는 그 카드의 items(없으면 JSON에서 처음 나오는 객체 배열)를
  // 행으로, 그 안의 숫자 · 글자 필드를 열로 씁니다. 엑셀에서 한글이 깨지지 않게 파일 앞에 BOM을 붙입니다.
  // 받기 전에 카드에서 vzb-download 이벤트(bubbles, cancelable, detail: { name, target, filename, rows })를 보냅니다. 페이지가
  // preventDefault()를 부르면 카드는 파일을 만들지 않습니다(서버에서 원본을 받는 화면 등).
  // 움직임(control-download.css): 누르면 단추가 눌렸다 튀고, 화살표가 받침으로 떨어져 체크로 바뀌며 받침이 눌렸다 펴지고, 작은 점들이 터집니다.
  // 이름은 done으로 흐려지며 바뀌고, 옆의 파일 이름 자리에는 받은 행 수가 굴러 올라왔다가 1.8초 뒤 돌아옵니다. 받을 행이 없으면 단추가 좌우로 떱니다.
  // shortcut(예: shift+d, mod+shift+e. mod는 Mac의 ⌘, 그 밖의 Ctrl)을 적으면 단추 안에 키캡을 그리고, 그 키를 누르면 키캡이 눌리며 받습니다.
  // 입력 칸에 쓰는 중에는 shift만 붙은 단축키를 듣지 않습니다. 동작 줄이기 설정에서는 움직임 없이 글자만 바뀝니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 파일은 만들지 않고 받는 모습만 되풀이합니다.
  mount('control-download', (card, d, f) => {
    head(card, d, f, null);
    const label = d.label || tx(d, 'CSV 내려받기'), done = d.done || tx(d, '받았습니다'), none = tx(d, '데이터 없음');
    const filename = d.filename || 'data.csv';
    const foot = el('div', 'vzb-foot vzb-dl'), row = el('div', 'vzb-dl-row'), btn = el('button', 'vzb-dl-btn'), say = el('p', 'vzb-sr');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    say.setAttribute('aria-live', 'polite');
    // 아이콘: 화살표 · 체크 · 받침과, 받았을 때 터지는 점 여덟 개(데이터 색 넷을 두 번씩)
    const ic = el('span', 'vzb-dl-ic'), burst = el('span', 'vzb-dl-burst');
    for (let i = 0; i < 8; i++) {
      const dot = el('i', `vzb-dl-c${(i % 4) + 1}`);
      dot.style.setProperty('--vzb-a', `${i * 45 + 12}deg`);
      dot.style.setProperty('--vzb-r', `${i % 2 ? 26 : 20}px`);
      burst.append(dot);
    }
    const svg = svgEl('svg', { class: 'vzb-dl-svg', viewBox: '0 0 20 20', 'aria-hidden': 'true' }), arrow = svgEl('g', { class: 'vzb-dl-arrow' });
    arrow.append(svgEl('path', { d: 'M10 3.2v8.6' }), svgEl('path', { d: 'M6.6 8.6l3.4 3.4 3.4-3.4' }));
    svg.append(arrow, svgEl('path', { class: 'vzb-dl-check', d: 'M6.4 9.6l2.5 2.5 4.8-5.2' }), svgEl('path', { class: 'vzb-dl-tray', d: 'M3.6 13.4v1.6a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6v-1.6' }));
    ic.append(burst, svg);
    const words = el('span', 'vzb-dl-words');
    words.setAttribute('aria-hidden', 'true');
    words.append(el('span', 'vzb-dl-w is-idle', label), el('span', 'vzb-dl-w is-done', done), el('span', 'vzb-dl-w is-none', none));
    btn.append(ic, words);
    // 단축키: mod · ctrl · alt · shift와 키 하나를 +로 잇습니다. 키캡은 Mac에서 기호(⌘ ⇧ 등), 그 밖에서 글자(Ctrl · Alt · Shift)로 적습니다.
    const parts = String(d.shortcut || '').toLowerCase().split('+').map((s) => s.trim()).filter(Boolean);
    const MODS = ['mod', 'ctrl', 'alt', 'shift'], mods = MODS.filter((m) => parts.includes(m)), key = parts.find((p) => !MODS.includes(p));
    const mac = /mac|iphone|ipad|ipod/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '');
    const caps = [];
    if (key) {
      // Control(\u2303)과 Option(\u2325) 기호는 카드 글꼴에 없어 시스템 글꼴로 그립니다.
      const name = { mod: mac ? '⌘' : 'Ctrl', ctrl: mac ? '\u2303' : 'Ctrl', alt: mac ? '\u2325' : 'Alt', shift: mac ? '⇧' : 'Shift' };
      const aria = { mod: mac ? 'Meta' : 'Control', ctrl: 'Control', alt: 'Alt', shift: 'Shift' };
      const keys = el('span', 'vzb-dl-keys');
      keys.setAttribute('aria-hidden', 'true');
      [...mods, key].forEach((k) => { const cap = el('kbd', 'vzb-dl-key', name[k] || (k.length === 1 ? k.toUpperCase() : k)); cap.dataset.k = k; caps.push(cap); keys.append(cap); });
      btn.append(keys);
      btn.setAttribute('aria-keyshortcuts', [...mods.map((m) => aria[m]), key.length === 1 ? key.toUpperCase() : key].join('+'));
    }
    btn.classList.toggle('no-keys', !key);
    const meta = el('span', 'vzb-dl-meta'), file = el('span', 'vzb-dl-file', filename), got = el('span', 'vzb-dl-got'), count = el('span', 'vzb-rl'), unit = el('span', 'vzb-dl-unit');
    got.append(count, unit);
    got.setAttribute('aria-hidden', 'true');
    meta.append(file, got);
    row.append(btn, meta);
    foot.append(row, say);
    card.append(foot);

    // 받을 행: target 카드의 JSON에서 items, 없으면 처음 나오는 객체 배열
    const isRows = (a) => Array.isArray(a) && a.length > 0 && a.every((r) => r && typeof r === 'object' && !Array.isArray(r));
    function rowsOf() {
      const t = d.target ? document.querySelector(`.vzb-card[data-vzb="${String(d.target).replace(/["\\]/g, '')}"]`) : null;
      const src = t && t.querySelector('script[type="application/json"]');
      if (!src) return null;
      let data;
      try { data = JSON.parse(src.textContent); } catch (e) { return null; }
      if (isRows(data.items)) return data.items;
      return Object.values(data).find(isRows) || null;
    }
    // CSV: 행마다 숫자 · 글자 필드를 처음 나온 순서대로 열로 둡니다. 쉼표 · 따옴표 · 줄바꿈이 든 칸은 따옴표로 감쌉니다.
    function csv(rows) {
      const cols = [];
      rows.forEach((r) => Object.keys(r).forEach((k) => { if (!cols.includes(k) && (r[k] == null || typeof r[k] !== 'object')) cols.push(k); }));
      const cell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      return `\ufeff${[cols.map(cell).join(','), ...rows.map((r) => cols.map((k) => cell(r[k])).join(','))].join('\r\n')}\r\n`;
    }
    function save(text) {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), a = el('a');
      a.href = url;
      a.download = filename;
      a.hidden = true;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    // 상태: '' 처음, 'done' 받음, 'none' 받을 행 없음. 같은 상태를 다시 줘도 움직임이 처음부터 다시 돌도록 클래스를 지웠다 붙입니다.
    let back = 0;
    function mark(state, n) {
      clearTimeout(back);
      foot.classList.remove('is-done', 'is-none');
      if (!state) return;
      void foot.offsetWidth;
      foot.classList.add(`is-${state}`);
      if (state === 'done') {
        unit.textContent = (d.lang === 'en' ? ' ' : '') + tx(d, n === 1 ? '행|1' : '행');
        roll(count, '0');
        requestAnimationFrame(() => roll(count, String(n)));
      }
      back = setTimeout(() => { if (card.isConnected) foot.classList.remove('is-done', 'is-none'); }, state === 'done' ? 1800 : 1200);
    }
    function run(demo) {
      const rows = rowsOf();
      if (demo) { mark('done', rows ? rows.length : 6); return; }
      if (!rows) { mark('none'); say.textContent = tx(d, '받을 데이터가 없습니다.'); return; }
      const ev = new CustomEvent('vzb-download', { bubbles: true, cancelable: true, detail: { name: d.name || '', target: d.target || '', filename, rows } });
      if (card.dispatchEvent(ev)) save(csv(rows));
      mark('done', rows.length);
      say.textContent = rows.length === 1 ? tx(d, '%s로 1행을 받았습니다.', filename) : tx(d, '%1로 %2행을 받았습니다.', filename, rows.length);
    }
    let idle = 0;
    btn.addEventListener('click', () => { idle = performance.now() + 8000; run(false); });

    // 단축키: 페이지 어디서든 듣고, 키캡은 그 키가 눌린 동안 내려앉습니다. 카드가 페이지에서 빠지면 듣기를 풉니다.
    if (key) {
      const isKey = (e) => (e.key || '').toLowerCase() === key || e.code === `Key${key.toUpperCase()}` || e.code === `Digit${key}`;
      const held = (e, k) => (k === 'mod' ? (mac ? e.metaKey : e.ctrlKey) : k === 'ctrl' ? e.ctrlKey : k === 'alt' ? e.altKey : k === 'shift' ? e.shiftKey : null);
      const exact = (e) => isKey(e) && e.metaKey === (mods.includes('mod') && mac) && e.ctrlKey === (mods.includes('ctrl') || (mods.includes('mod') && !mac))
        && e.altKey === mods.includes('alt') && e.shiftKey === mods.includes('shift');
      const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const sink = (e, down) => caps.forEach((c) => c.classList.toggle('is-down', c.dataset.k === key ? down && isKey(e) : !!held(e, c.dataset.k)));
      const off = () => { document.removeEventListener('keydown', onDown); document.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur); };
      const onDown = (e) => {
        if (!card.isConnected) { off(); return; }
        if (!mods.some((m) => m !== 'shift') && typing(e.target)) return;
        sink(e, true);
        if (!e.repeat && exact(e)) { e.preventDefault(); idle = performance.now() + 8000; run(false); }
      };
      const onUp = (e) => { if (!card.isConnected) { off(); return; } sink(e, false); };
      const onBlur = () => caps.forEach((c) => c.classList.remove('is-down'));
      document.addEventListener('keydown', onDown);
      document.addEventListener('keyup', onUp);
      window.addEventListener('blur', onBlur);
    }

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 8초 뒤부터 키캡을 눌러 받는 모습을 되풀이합니다(파일은 만들지 않습니다).
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!reduce && card.closest('[data-vzb-loop]')) {
      let seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!seen || performance.now() < idle) return;
        caps.forEach((c) => c.classList.add('is-down'));
        btn.classList.add('is-press');
        setTimeout(() => { caps.forEach((c) => c.classList.remove('is-down')); btn.classList.remove('is-press'); run(true); }, 160);
      }, 3600);
    }
  });
