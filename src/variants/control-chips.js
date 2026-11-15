  // Filter Chips: 정해 둔 항목(options) 가운데 여러 개를 칩으로 고르는 컨트롤입니다(채널 · 지역 · 상품군 필터). 카드 머리 없이 칩만 그립니다.
  // 고른 칩은 글자색으로 채우고 체크가 그려집니다. 맨 앞의 전체 칩(all, 비우면 '전체', 빈 글자면 없음)은 고른 수를 굴러가는 숫자로 보여 주고,
  // 누르면 모두 고르거나 이미 모두 골랐으면 모두 풉니다. value는 처음 고른 항목이고 비우면 모두입니다.
  // 값이 바뀌면 카드에서 vzb-change 이벤트(bubbles, detail: { name, value: 고른 항목을 options 순서대로 })를 보내고, data-vzb-value에도 적습니다.
  // 칩은 누르면 살짝 눌렸다 튀어 오르고, 고르면 체크가 그려지며 칩이 넓어집니다(control-chips.css). 동작 줄이기 설정에서는 바로 바뀝니다.
  // 칩이 두 줄을 넘으면 한 줄로 두고 가로로 밀어 봅니다. 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 손을 대기 전까지 고르기를 차례로 보여 줍니다.
  mount('control-chips', (card, d, f) => {
    const opts = [...new Set((Array.isArray(d.options) ? d.options : []).filter((o) => o != null && o !== '').map(String))];
    if (!opts.length) throw new Error(tx(d, 'options를 확인하세요.'));
    const sel = new Set(Array.isArray(d.value) ? d.value.map(String).filter((v) => opts.includes(v)) : opts);
    const foot = el('div', 'vzb-ch'), list = el('div', 'vzb-ch-list'), say = el('p', 'vzb-sr');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', d.label || d.title || tx(d, '필터'));   // 제목을 그리지 않으므로 화면 낭독기용 이름은 label에서 읽습니다
    list.setAttribute('data-vzb-input', '');
    say.setAttribute('aria-live', 'polite');
    const tick = () => {
      const s = svgEl('svg', { class: 'vzb-ch-ck', viewBox: '0 0 12 12', 'aria-hidden': 'true' });
      s.append(svgEl('path', { d: 'M2.2 6.4l2.5 2.5 5.1-5.6' }));
      return s;
    };
    const chip = (label) => {
      const b = el('button', 'vzb-ch-chip');
      b.type = 'button';
      b.append(tick(), el('span', 'vzb-ch-tx', label));
      return b;
    };
    const allLabel = d.all == null ? tx(d, '전체') : String(d.all);
    let all = null, count = null;
    if (allLabel) {
      all = chip(allLabel);
      all.classList.add('is-all');
      count = el('span', 'vzb-rl vzb-ch-count');
      all.append(count);
      list.append(all);
    }
    const chips = opts.map((o) => { const b = chip(o); list.append(b); return b; });
    foot.append(list, say);
    card.append(foot);

    const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function paint() {
      chips.forEach((b, i) => b.setAttribute('aria-pressed', String(sel.has(opts[i]))));
      if (all) {
        all.setAttribute('aria-pressed', String(sel.size === opts.length));
        all.setAttribute('aria-label', tx(d, '%1, %2개 중 %3개 고름', allLabel, opts.length, sel.size));
        roll(count, String(sel.size));
      }
    }
    function emit(quiet) {
      const value = opts.filter((o) => sel.has(o));
      card.setAttribute('data-vzb-value', JSON.stringify(value));
      if (quiet) return;
      say.textContent = tx(d, '%1개 중 %2개 고름', opts.length, sel.size);
      card.dispatchEvent(new CustomEvent('vzb-change', { bubbles: true, detail: { name: d.name || '', value } }));
    }
    // 두 줄을 넘으면 한 줄로 두고 가로로 밉니다. 모든 칩에 체크가 그려졌을 때(가장 넓을 때)로 재므로, 고를 때마다 줄 모양이 바뀌지 않습니다.
    // 가로로 밀 때는 오른쪽 끝을 흐리게 해 칩이 더 있음을 알리고, 끝까지 밀면 흐림을 거둡니다.
    const fit = () => {
      list.classList.remove('is-scroll');
      list.classList.add('is-measure');
      const first = list.firstElementChild, over = !!first && list.scrollHeight > first.offsetHeight * 2 + 12;
      list.classList.remove('is-measure');
      list.classList.toggle('is-scroll', over);
      ends();
    };
    const ends = () => list.classList.toggle('is-end', list.scrollLeft + list.clientWidth >= list.scrollWidth - 2);
    list.addEventListener('scroll', ends, { passive: true });
    function toggle(i) {   // i: 항목 번호, -1은 전체 칩
      if (i < 0) { if (sel.size === opts.length) sel.clear(); else opts.forEach((o) => sel.add(o)); }
      else if (sel.has(opts[i])) sel.delete(opts[i]);
      else sel.add(opts[i]);
      paint();
      emit();
    }
    let idle = 0;
    list.addEventListener('click', (e) => {
      const b = e.target.closest('.vzb-ch-chip');
      if (!b) return;
      idle = performance.now() + 6000;
      toggle(b === all ? -1 : chips.indexOf(b));
    });
    paint();
    emit(true);
    onSize(list, fit);

    // 갤러리(data-vzb-loop): 화면에 보이는 동안, 손을 대기 전과 손을 뗀 지 6초 뒤부터 칩을 차례로 눌러 보입니다.
    if (!reduce && card.closest('[data-vzb-loop]')) {
      const plan = [3, 4, -1, 5, 4];   // 한 바퀴 돌면 처음 고른 넷으로 돌아옵니다
      let k = 0, seen = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; }).observe(card);
      const timer = setInterval(() => {
        if (!card.isConnected) { clearInterval(timer); return; }
        if (!seen || performance.now() < idle) return;
        const i = plan[k++ % plan.length], b = i < 0 ? all : chips[i % chips.length];
        if (!b) return;
        b.classList.add('is-press');
        setTimeout(() => b.classList.remove('is-press'), 120);
        toggle(i < 0 ? -1 : i % chips.length);
      }, 1300);
    }
  });
