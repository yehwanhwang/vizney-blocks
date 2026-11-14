  /* 굴러가는 숫자(컨트롤 공통): 숫자 한 자리마다 0–9를 세로로 쌓은 칸을 두고 새 값의 자리로 굴립니다(구독 수가 오르는 단추처럼).
     roll(box, text): box 안의 글자를 text로 바꿉니다. 자리 수와 쉼표 자리가 그대로면 칸이 제자리에서 구르고, 바뀌면 칸을 새로 만들어
     0에서 굴러 올라옵니다. 움직임은 roll.css의 transition이 그리고, box는 화면 낭독기에 읽히지 않으므로 값은 부르는 쪽이 따로 알립니다. */
  function roll(box, text) {
    const chars = [...String(text)], shape = chars.map((c) => (/\d/.test(c) ? '0' : c)).join('');
    box.setAttribute('aria-hidden', 'true');
    if (box.dataset.shape !== shape) {
      box.dataset.shape = shape;
      box.replaceChildren(...chars.map((c) => {
        if (!/\d/.test(c)) return el('span', 'vzb-rl-ch', c);
        const col = el('span', 'vzb-rl-col'), strip = el('span', 'vzb-rl-strip');
        for (let k = 0; k < 10; k++) strip.append(el('span', null, String(k)));
        col.append(strip);
        return col;
      }));
      box.getBoundingClientRect();   // 새 칸은 0에 선 채로 그려진 뒤 굴러갑니다
    }
    [...box.children].forEach((node, i) => { if (node.classList.contains('vzb-rl-col')) node.firstChild.style.transform = `translateY(${-10 * +chars[i]}%)`; });
  }
