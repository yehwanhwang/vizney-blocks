  // Download Button: 화면에 있는 차트 카드(target)의 데이터를 내려받는 단추입니다. 카드 머리 없이 단추만 그립니다. 처음에는 내려받기 아이콘만 있고, 마우스를 올리거나
  // 키보드로 들어오거나 아이콘을 누르면 단추가 옆으로 늘어나며 받을 형식(formats: csv · json · png, 비우면 셋 다)이 하나씩 나옵니다.
  // 늘어난 단추는 옆 내용 위로 겹쳐 떠서 자리를 밀어내지 않고, 오른쪽에 펼칠 자리가 없으면 아이콘은 그대로 둔 채 왼쪽으로 펼칩니다(align: end면 왼쪽부터).
  // csv · json은 target 카드의 지금 JSON(컨트롤로 거른 뒤)에서 표를 만들어 받습니다: items(객체 배열), 없으면 labels와 values(한도
  // limit · 목표 target이 있으면 열로 더함), labels와 series, 그 밖에는 JSON에서 처음 나오는 객체 배열입니다. csv 앞에는 엑셀용 BOM을 붙입니다.
  // png는 target 카드를 보이는 그대로 그림으로 받습니다(글꼴은 기기에 설치된 것으로 그려질 수 있습니다).
  // 받기 전에 카드에서 vzb-download 이벤트(bubbles, cancelable, detail: { name, target, format, filename, rows })를 보냅니다. 페이지가
  // preventDefault()를 부르면 카드는 파일을 만들지 않습니다(서버에서 원본을 받는 화면 등).
  // 움직임(download-button.css): 형식은 늘어나는 단추 안에서 차례로 나오고, 받으면 단추가 접히며 화살표가 받침으로 떨어져 체크로 바뀌고
  // 작은 점들이 터집니다. 옆에는 받은 형식과 행 수가 굴러 올라왔다가 1.8초 뒤 사라집니다. 받을 데이터가 없으면 단추가 좌우로 떱니다.
  // 열린 상태에서 아이콘을 다시 누르면 첫 형식으로 받습니다. Esc는 닫고, 좌우 화살표는 형식 사이를 옮깁니다.
  // 동작 줄이기 설정에서는 움직임 없이 상태만 바뀝니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 파일은 만들지 않고 고르는 모습만 되풀이합니다.
  mount('download-button', (card, d, f) => {
    const FORMATS = ['csv', 'json', 'png'];
    const formats = (Array.isArray(d.formats) ? d.formats.map((x) => String(x).toLowerCase()).filter((x) => FORMATS.includes(x)) : FORMATS);
    const list = formats.length ? formats : FORMATS;
    const base = String(d.filename || 'data').replace(/\.(csv|json|png)$/i, '');
    const label = d.label || tx(d, '내려받기');
    const foot = el('div', 'vzb-dl'), row = el('div', 'vzb-dl-row'), menu = el('div', 'vzb-dl-menu'), say = el('p', 'vzb-sr');
    menu.setAttribute('role', 'group');
    menu.setAttribute('aria-label', label);
    menu.setAttribute('data-vzb-input', '');
    say.setAttribute('aria-live', 'polite');
    const btn = el('button', 'vzb-dl-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-expanded', 'false');
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
    btn.append(ic);
    const opts = el('span', 'vzb-dl-opts');
    const items = list.map((fmt, i) => {
      const o = el('button', 'vzb-dl-opt', fmt.toUpperCase());
      o.type = 'button';
      o.tabIndex = -1;
      o.dataset.fmt = fmt;
      o.style.setProperty('--vzb-i', i);
      o.setAttribute('aria-label', tx(d, '%s로 받기', fmt.toUpperCase()));
      opts.append(o);
      return o;
    });
    menu.append(btn, opts);
    const meta = el('span', 'vzb-dl-meta'), got = el('span', 'vzb-dl-got'), what = el('span', 'vzb-dl-what'), count = el('span', 'vzb-rl'), unit = el('span', 'vzb-dl-unit');
    got.append(what, count, unit);
    got.setAttribute('aria-hidden', 'true');
    meta.append(got);
    const anchor = el('div', 'vzb-dl-anchor');   // 아이콘 자리(44px). 늘어난 단추는 이 자리에서 옆 내용 위로 겹쳐 뜹니다
    anchor.append(menu);
    row.append(anchor, meta);
    const alignEnd = d.align === 'end';   // 화면 오른쪽 위처럼 오른쪽 끝에 둘 때: 아이콘을 오른쪽 끝에 붙이고 왼쪽으로 펼칩니다
    foot.classList.toggle('is-end', alignEnd);
    foot.append(row, say);
    card.append(foot);

    // 열고 닫기: 마우스를 올리면 열고, 내리면 잠시 뒤 닫습니다. 키보드로 아이콘에 들어오거나 아이콘을 눌러도 엽니다.
    let open = false, shut = 0, since = 0, hush = false;   // hush: Esc로 닫고 아이콘에 포커스를 돌려줄 때는 다시 열지 않습니다
    // 펼칠 방향: 아이콘 오른쪽(왼쪽 맞춤이면)이나 왼쪽(align end면)으로 화면 안에 다 들어가면 그쪽, 아니면 반대쪽입니다. 아이콘은 그 자리에 있습니다.
    function side() {
      const r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth || window.innerWidth, need = 44 + opts.scrollWidth;
      const right = vw - 8 - r.left, left = r.right - 8;
      return alignEnd ? left >= need || right < need : right < need && left > right;
    }
    function setOpen(v) {
      clearTimeout(shut);
      if (open === v) return;
      if (v) foot.classList.toggle('is-left', side());
      open = v;
      since = performance.now();
      foot.classList.toggle('is-open', v);
      btn.setAttribute('aria-expanded', String(v));
      items.forEach((o) => { o.tabIndex = v ? 0 : -1; });
    }
    menu.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { idle = performance.now() + 8000; setOpen(true); } });
    menu.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !menu.contains(document.activeElement)) shut = setTimeout(() => setOpen(false), 280); });
    btn.addEventListener('focus', () => { if (hush) hush = false; else if (btn.matches(':focus-visible')) setOpen(true); });
    menu.addEventListener('focusout', (e) => { if (!menu.contains(e.relatedTarget)) shut = setTimeout(() => setOpen(false), 120); });
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setOpen(false); if (document.activeElement !== btn) { hush = true; btn.focus(); } return; }
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const all = [btn, ...items], i = all.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      setOpen(true);
      all[Math.max(0, Math.min(all.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))].focus();
    });
    document.addEventListener('pointerdown', function away(e) {
      if (!card.isConnected) { document.removeEventListener('pointerdown', away, true); return; }
      if (open && !menu.contains(e.target)) setOpen(false);
    }, true);

    // 받을 표: target 카드의 지금 JSON에서 만듭니다.
    const target = () => (d.target ? document.querySelector(`.vzb-card[data-vzb="${String(d.target).replace(/["\\]/g, '')}"]`) : null);
    const isRows = (a) => Array.isArray(a) && a.length > 0 && a.every((r) => r && typeof r === 'object' && !Array.isArray(r));
    function rowsOf(t) {
      const src = t && t.querySelector('script[type="application/json"]');
      if (!src) return null;
      let data;
      try { data = JSON.parse(src.textContent); } catch (e) { return null; }
      if (isRows(data.items)) return data.items;
      if (Array.isArray(data.labels) && data.labels.length && Array.isArray(data.values)) {
        return data.labels.map((l, i) => {
          const r = { label: l, value: data.values[i] };
          ['limit', 'target'].forEach((k) => { if (fin(data[k])) r[k] = +data[k]; });
          return r;
        });
      }
      if (Array.isArray(data.labels) && data.labels.length && isRows(data.series)) {
        return data.labels.map((l, i) => Object.assign({ label: l }, ...data.series.map((s) => ({ [s.name]: Array.isArray(s.values) ? s.values[i] : null }))));
      }
      return Object.values(data).find(isRows) || null;
    }
    // CSV: 행마다 숫자 · 글자 필드를 처음 나온 순서대로 열로 둡니다. 쉼표 · 따옴표 · 줄바꿈이 든 칸은 따옴표로 감쌉니다.
    function csv(rows) {
      const cols = [];
      rows.forEach((r) => Object.keys(r).forEach((k) => { if (!cols.includes(k) && (r[k] == null || typeof r[k] !== 'object')) cols.push(k); }));
      const cell = (v) => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      return `\ufeff${[cols.map(cell).join(','), ...rows.map((r) => cols.map((k) => cell(r[k])).join(','))].join('\r\n')}\r\n`;
    }
    // PNG: 카드를 보이는 그대로 복제해 계산된 스타일을 글자로 옮기고, SVG 그림 안에 넣어 캔버스에 그립니다(외부 라이브러리 없이).
    function png(t) {
      const r = t.getBoundingClientRect(), w = Math.ceil(r.width), h = Math.ceil(r.height), clone = t.cloneNode(true);
      const from = [t, ...t.querySelectorAll('*')], to = [clone, ...clone.querySelectorAll('*')];
      from.forEach((node, i) => {
        const out = to[i];
        if (!out || !out.setAttribute) return;
        if (node.tagName === 'SCRIPT' || node.closest('button')) { out.setAttribute('style', 'visibility:hidden'); return; }   // 단추(다시 보기 등)는 자리만 남기고 그리지 않습니다
        const cs = getComputedStyle(node);
        let css = '';
        for (let k = 0; k < cs.length; k++) css += `${cs[k]}:${cs.getPropertyValue(cs[k])};`;
        out.setAttribute('style', css);
      });
      clone.querySelectorAll('script').forEach((s) => s.remove());
      clone.style.margin = '0';
      const xml = new XMLSerializer().serializeToString(clone);
      const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`)}`;
      return new Promise((done, fail) => {
        const img = new Image();
        img.onload = () => {
          try {
            const k = 2, c = document.createElement('canvas');
            c.width = w * k;
            c.height = h * k;
            const g = c.getContext('2d');
            g.scale(k, k);
            g.drawImage(img, 0, 0);
            c.toBlob((b) => (b ? done({ blob: b, w: w * k, h: h * k }) : fail(new Error('png'))), 'image/png');
          } catch (e) { fail(e); }
        };
        img.onerror = fail;
        img.src = src;
      });
    }
    function save(blob, name) {
      const url = URL.createObjectURL(blob), a = el('a');
      a.href = url;
      a.download = name;
      a.hidden = true;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    // 상태: '' 처음, 'done' 받음, 'none' 받을 데이터 없음. 같은 상태를 다시 줘도 움직임이 처음부터 다시 돌도록 클래스를 지웠다 붙입니다.
    let back = 0;
    function mark(state, fmt, n, px) {
      clearTimeout(back);
      foot.classList.remove('is-done', 'is-none');
      if (!state) return;
      void foot.offsetWidth;
      foot.classList.add(`is-${state}`);
      if (state === 'done') {
        what.textContent = `${fmt.toUpperCase()} · `;
        if (px) { roll(count, '0'); requestAnimationFrame(() => roll(count, String(px[0]))); unit.textContent = `×${px[1]}px`; }
        else { unit.textContent = (d.lang === 'en' ? ' ' : '') + tx(d, n === 1 ? '행|1' : '행'); roll(count, '0'); requestAnimationFrame(() => roll(count, num(n, 0))); }
      } else {
        what.textContent = tx(d, '데이터 없음');
        count.replaceChildren();
        unit.textContent = '';
      }
      back = setTimeout(() => { if (card.isConnected) foot.classList.remove('is-done', 'is-none'); }, state === 'done' ? 1800 : 1400);
    }
    async function run(fmt, demo) {
      setOpen(false);
      const t = target(), rows = rowsOf(t);
      if (demo) { mark('done', fmt, rows ? rows.length : 13, fmt === 'png' && t ? [Math.ceil(t.offsetWidth * 2), Math.ceil(t.offsetHeight * 2)] : null); return; }
      if (!t || (fmt !== 'png' && !rows)) { mark('none'); say.textContent = tx(d, '받을 데이터가 없습니다.'); return; }
      const name = `${base}.${fmt}`;
      const ev = new CustomEvent('vzb-download', { bubbles: true, cancelable: true, detail: { name: d.name || '', target: d.target || '', format: fmt, filename: name, rows: rows || [] } });
      const go = card.dispatchEvent(ev);
      if (fmt === 'png') {
        try {
          const p = await png(t);
          if (go) save(p.blob, name);
          mark('done', fmt, 0, [p.w, p.h]);
          say.textContent = tx(d, '%s로 받았습니다.', name);
        } catch (e) { mark('none'); say.textContent = tx(d, '받을 데이터가 없습니다.'); }
        return;
      }
      if (go) save(new Blob([fmt === 'csv' ? csv(rows) : JSON.stringify(rows, null, 2)], { type: fmt === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }), name);
      mark('done', fmt, rows.length);
      say.textContent = rows.length === 1 ? tx(d, '%s로 1행을 받았습니다.', name) : tx(d, '%1로 %2행을 받았습니다.', name, rows.length);
    }
    let idle = 0;
    btn.addEventListener('click', () => {
      idle = performance.now() + 8000;
      if (!open) setOpen(true);
      else if (performance.now() - since > 250) run(list[0]);   // 열린 상태에서 아이콘을 다시 누르면 첫 형식으로 받습니다
    });
    items.forEach((o) => o.addEventListener('click', () => { idle = performance.now() + 8000; run(o.dataset.fmt); }));

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 8초 뒤부터 열어서 형식을 고르는 모습을 되풀이합니다(파일은 만들지 않습니다).
    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!reduce && card.closest('[data-vzb-loop]')) {
      let seen = true, k = 0;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!seen || performance.now() < idle || open) return;
        const o = items[k++ % items.length];
        setOpen(true);
        setTimeout(() => { if (performance.now() >= idle) o.classList.add('is-pick'); }, 700);
        setTimeout(() => { o.classList.remove('is-pick'); if (performance.now() >= idle) run(o.dataset.fmt, true); }, 1150);
      }, 4200);
    }
  });
