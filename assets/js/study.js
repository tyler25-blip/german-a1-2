/* study.js — 全螢幕單字卡學習介面 */

const Study = (() => {
  const escapeHtml = App.escapeHtml;

  // session 內部狀態
  const state = {
    queue: [],            // 待出的卡（含 again 重排）
    seen: 0,              // 已正式評分過的卡（不含 again 重排）
    target: 0,            // 本輪目標題數（通常 20，池小於 20 就池大小）
    flipped: false,
    current: null,        // { id, chapter, source, de, plural, zh, dir }
    counts: { again: 0, hard: 0, good: 0, easy: 0 },
    settings: null,       // 從 sessionStorage 拿到的章節 / 方向 / 來源
  };

  const start = async () => {
    const session = Flashcards.popSession();
    const root = document.getElementById('study-root');
    if (!session || !session.settings) {
      root.innerHTML = `
        <div class="study-summary">
          <h1>沒有 session 資料</h1>
          <p>請從<a href="./flashcards.html">單字卡設定頁</a>開始。</p>
        </div>
      `;
      return;
    }
    state.settings = session.settings;

    // 重新組池與隊列
    let pool = await Flashcards.buildPool(session.settings.chapters, session.settings.sources, session.settings.direction);
    const sr = Flashcards.loadState();
    if (session.settings.hardOnly) {
      pool = pool.filter(c => Flashcards.isHard(c.id, sr));
    }
    if (pool.length === 0) {
      root.innerHTML = `
        <div class="study-summary">
          <h1>池內無卡</h1>
          <a href="./flashcards.html" class="primary">回設定</a>
        </div>
      `;
      return;
    }

    const queue = Flashcards.buildQueue(pool, sr);
    state.queue = queue;
    state.target = queue.length;
    state.seen = 0;
    state.counts = { again: 0, hard: 0, good: 0, easy: 0 };

    renderShell(root);
    nextCard();
  };

  const renderShell = (root) => {
    root.innerHTML = `
      <div class="study-page" id="study-page">
        <div class="study-progress-bar"><div id="study-progress-fill" style="width: 0%"></div></div>
        <div class="study-header">
          <button class="end-btn" id="end-btn" aria-label="結束">← 結束</button>
          <span class="progress-text"><span class="accent" id="progress-num">0</span> / ${state.target}</span>
        </div>
        <div class="flashcard-area" id="card-area"></div>
        <div class="rating-bar hidden" id="rating-bar">
          <button class="rate-btn" data-rating="again">Again <span class="interval" id="iv-again">—</span></button>
          <button class="rate-btn" data-rating="hard">Hard <span class="interval" id="iv-hard">—</span></button>
          <button class="rate-btn" data-rating="good">Good <span class="interval" id="iv-good">—</span></button>
          <button class="rate-btn" data-rating="easy">Easy <span class="interval" id="iv-easy">—</span></button>
        </div>
      </div>
    `;

    document.getElementById('end-btn').addEventListener('click', () => {
      if (state.seen === 0 || confirm('現在結束 session？已答的卡會保留進度。')) {
        finish();
      }
    });

    document.getElementById('card-area').addEventListener('click', () => {
      if (!state.flipped) flip();
    });

    document.getElementById('rating-bar').querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rate(btn.dataset.rating);
      });
    });

    // 鍵盤
    document.addEventListener('keydown', onKeyDown);
  };

  const onKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!state.flipped) flip();
    } else if (e.key === '1') { e.preventDefault(); state.flipped && rate('again'); }
      else if (e.key === '2') { e.preventDefault(); state.flipped && rate('hard'); }
      else if (e.key === '3') { e.preventDefault(); state.flipped && rate('good'); }
      else if (e.key === '4') { e.preventDefault(); state.flipped && rate('easy'); }
      else if (e.key === 'Escape') { e.preventDefault(); document.getElementById('end-btn')?.click(); }
  };

  const nextCard = () => {
    if (state.queue.length === 0 || state.seen >= state.target) {
      finish();
      return;
    }
    state.current = state.queue.shift();
    state.flipped = false;
    
    document.getElementById('progress-num').textContent = state.seen + 1;
    const pct = ((state.seen + 1) / state.target) * 100;
    const fill = document.getElementById('study-progress-fill');
    if (fill) fill.style.width = pct + '%';
    
    document.getElementById('rating-bar').classList.add('hidden');
    renderCard();
  };

  const renderCard = () => {
    const c = state.current;
    const area = document.getElementById('card-area');
    const dirIcon = c.dir === 'de2zh' ? 'DEUTSCH' : '中文';
    const backIcon = c.dir === 'de2zh' ? '中文' : 'DEUTSCH';

    const frontContent = c.dir === 'de2zh' 
      ? `<div class="card-word">${escapeHtml(c.de)}</div>${c.plural ? `<div class="card-plural">(${escapeHtml(c.plural)})</div>` : ''}`
      : `<div class="card-word">${escapeHtml(c.zh)}</div>`;
      
    const backContent = c.dir === 'de2zh'
      ? `<div class="card-word">${escapeHtml(c.zh)}</div>`
      : `<div class="card-word">${escapeHtml(c.de)}</div>${c.plural ? `<div class="card-plural">(${escapeHtml(c.plural)})</div>` : ''}`;

    const askQ = c.dir === 'de2zh'
      ? `「${c.de}」(${c.zh}) 的詳細用法是什麼？舉幾個 A1 程度的例句並解釋。`
      : `中文「${c.zh}」對應的德文「${c.de}」用法是什麼？舉幾個 A1 例句並解釋。`;

    area.innerHTML = `
      <div class="card-scene">
        <div id="flashcard" class="flashcard">
          <div class="card-face front">
            <span class="card-label">${dirIcon} · L ${c.chapter}</span>
            ${frontContent}
            <div class="flip-hint">點擊翻面</div>
          </div>
          <div class="card-face back">
            <span class="card-label">${backIcon} · L ${c.chapter}</span>
            ${backContent}
            <button class="ask-claude card-ask" data-q="${escapeHtml(askQ).replace(/\"/g, '&quot;')}">問 Claude</button>
          </div>
        </div>
      </div>
    `;

    area.querySelector('.card-ask').addEventListener('click', (e) => {
      e.stopPropagation();
      Chat.askWith(area.querySelector('.card-ask').dataset.q);
    });
  };

  const flip = () => {
    state.flipped = true;
    const card = document.getElementById('flashcard');
    if (card) card.classList.add('is-flipped');
    
    const c = state.current;
    const sr = Flashcards.loadState();
    const previews = Flashcards.previewIntervals(sr[c.id]);
    document.getElementById('iv-again').textContent = Flashcards.formatInterval(previews.again);
    document.getElementById('iv-hard').textContent  = Flashcards.formatInterval(previews.hard);
    document.getElementById('iv-good').textContent  = Flashcards.formatInterval(previews.good);
    document.getElementById('iv-easy').textContent  = Flashcards.formatInterval(previews.easy);

    document.getElementById('rating-bar').classList.remove('hidden');
  };

  const rate = (rating) => {
    if (!state.current || !state.flipped) return;
    const c = state.current;
    Flashcards.rate(c.id, rating);
    state.counts[rating]++;

    if (rating === 'again') {
      // 重排到隊列末端，但不增加 seen
      state.queue.push(c);
    } else {
      state.seen++;
    }

    nextCard();
  };

  const finish = () => {
    document.removeEventListener('keydown', onKeyDown);
    const root = document.getElementById('study-root');
    const total = state.counts.again + state.counts.hard + state.counts.good + state.counts.easy;
    const correct = state.counts.hard + state.counts.good + state.counts.easy;
    const accuracy = total ? Math.round(correct / total * 100) : 0;

    // 算下一輪預期的到期狀況
    let dueIn5min = state.counts.again;
    let dueIn1to2days = state.counts.hard + state.counts.good;
    let dueLater = state.counts.easy;

    root.innerHTML = `
      <div class="study-page">
        <div class="study-header">
          <a href="./index.html" class="end-btn" aria-label="回首頁"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></a>
          <span class="progress-text">完成 🎉</span>
        </div>
        <div class="study-summary">
          <h1>本輪結束！</h1>
          <p class="muted">本輪共評分 ${total} 次（含 Again 重做）</p>
          <div class="summary-stats">
            <div class="stat-card"><span class="num">${state.seen}</span><span class="label">完成題數</span></div>
            <div class="stat-card"><span class="num">${accuracy}%</span><span class="label">答對率</span></div>
            <div class="stat-card"><span class="num">${state.counts.again}</span><span class="label">Again 次數</span></div>
          </div>
          <div class="summary-due">
            ${dueIn5min ? `🔁 ${dueIn5min} 張在 5 分鐘後再出<br>` : ''}
            ${dueIn1to2days ? `📅 ${dueIn1to2days} 張在 1–2 天後到期<br>` : ''}
            ${dueLater ? `🌟 ${dueLater} 張在 4+ 天後到期` : ''}
          </div>
          <div class="summary-actions">
            <button class="primary" id="again-btn">🔁 再來一輪</button>
            <a href="./flashcards.html">改設定</a>
            <a href="./index.html">回首頁</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('again-btn').addEventListener('click', () => {
      // 把目前的 settings 重新塞回 session 然後跑 start()
      Flashcards.stashSession({ settings: state.settings });
      location.reload();
    });
  };

  return { start };
})();
