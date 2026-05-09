/* flashcards.js — 單字卡核心邏輯
 *
 *  - buildPool(chapters, sources, direction): 從 chapter JSON 抽出全部卡
 *  - rate(cardId, rating): 套用修改版 SM-2，回傳新 SrState
 *  - buildQueue(pool, state, sessionSize): 組單輪 20 張
 *  - formatInterval(ms): 給按鈕用「<1分 / 1日 / 4日」
 *  - load/saveState、load/saveSettings: localStorage 包裝
 *  - renderSetupPage(root): 設定頁渲染
 */

const Flashcards = (() => {
  const STATE_KEY = 'ygt_flashcards_v1';
  const SETTINGS_KEY = 'ygt_flashcards_settings_v1';
  const SESSION_KEY = 'ygt_flashcards_session_v1'; // 跨頁傳資料用
  const SESSION_SIZE = 20;
  const DAY_MS = 86400000;
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const escapeHtml = App.escapeHtml;

  // === Pool ===

  // 從章節 JSON 抽卡：[{ chapter, source, de, plural, zh }]
  const extractRawCards = async (chapterIds, sources) => {
    const cards = [];
    const wantVocab = sources.includes('vocabulary');
    const wantPhrases = sources.includes('phrases');
    for (const id of chapterIds) {
      const res = await fetch(`./assets/data/chapters/ch${String(id).padStart(2, '0')}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const sec of data.sections || []) {
        if (sec.type === 'vocabulary' && wantVocab) {
          for (const item of sec.items || []) {
            if (!item.de || !item.zh) continue;
            cards.push({ chapter: id, source: 'vocab', de: item.de, plural: item.plural || '', zh: item.zh });
          }
        } else if (sec.type === 'phrases' && wantPhrases) {
          for (const g of sec.groups || []) {
            for (const item of g.items || []) {
              if (!item.de || !item.zh) continue;
              cards.push({ chapter: id, source: 'phrase', de: item.de, plural: '', zh: item.zh });
            }
          }
        }
      }
    }
    return cards;
  };

  // 把 raw cards 依方向展開為卡片池（每張有唯一 id）
  const buildPool = async (chapterIds, sources, direction) => {
    const raw = await extractRawCards(chapterIds, sources);
    const pool = [];
    for (const r of raw) {
      const baseId = `${r.chapter}:${r.source}:${r.de}`;
      const dirs = direction === 'both' ? ['de2zh', 'zh2de']
                  : direction === 'de2zh' ? ['de2zh']
                  : ['zh2de'];
      for (const d of dirs) {
        pool.push({
          id: `${baseId}:${d}`,
          chapter: r.chapter,
          source: r.source,
          de: r.de,
          plural: r.plural,
          zh: r.zh,
          dir: d,
        });
      }
    }
    return pool;
  };

  // === SR State (localStorage) ===

  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveState = (s) => localStorage.setItem(STATE_KEY, JSON.stringify(s));

  const loadSettings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        chapters: raw.chapters ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        direction: raw.direction ?? 'both',
        sources: raw.sources ?? ['vocabulary', 'phrases'],
      };
    } catch {
      return { chapters: [1,2,3,4,5,6,7,8,9,10], direction: 'both', sources: ['vocabulary','phrases'] };
    }
  };
  const saveSettings = (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));

  // session 跨頁傳遞
  const stashSession = (data) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  const popSession = () => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };
  const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

  // === SR Algorithm ===

  const newCardState = () => ({
    ease: 2.5,
    interval: 0,
    due: 0,
    reps: 0,
    lapses: 0,
    lastReview: 0,
  });

  // rating: 'again' | 'hard' | 'good' | 'easy'
  // 回傳 { newState, intervalDays }
  const computeNext = (oldState, rating) => {
    const s = oldState ? { ...oldState } : newCardState();
    const isNew = s.reps === 0;
    let interval;

    if (isNew) {
      switch (rating) {
        case 'again': interval = 0;          s.lapses++; break;
        case 'hard':  interval = 1;                       break;
        case 'good':  interval = 2;                       break;
        case 'easy':  interval = 4;                       break;
      }
    } else {
      switch (rating) {
        case 'again':
          interval = 1;
          s.ease = Math.max(1.3, s.ease - 0.20);
          s.lapses++;
          s.reps = 0; // 視同重新開始
          break;
        case 'hard':
          interval = Math.max(1, Math.round(s.interval * 1.2));
          s.ease = Math.max(1.3, s.ease - 0.15);
          break;
        case 'good':
          interval = Math.max(1, Math.round(s.interval * s.ease));
          break;
        case 'easy':
          interval = Math.max(1, Math.round(s.interval * s.ease * 1.3));
          s.ease = s.ease + 0.15;
          break;
      }
    }

    if (rating !== 'again' || !isNew) s.reps = (s.reps || 0) + 1;

    s.interval = interval;
    s.lastReview = Date.now();

    if (interval === 0) {
      // Again on a new card — 5 分鐘後再出
      s.due = Date.now() + FIVE_MIN_MS;
    } else {
      s.due = Date.now() + interval * DAY_MS;
    }

    return { newState: s, intervalDays: interval };
  };

  // 預覽四種按鈕的下次間隔（不寫 state）
  const previewIntervals = (oldState) => {
    const r = (rating) => computeNext(oldState, rating).intervalDays;
    return {
      again: r('again'),
      hard: r('hard'),
      good: r('good'),
      easy: r('easy'),
    };
  };

  // 0 = 5 分鐘後；其他是天數
  const formatInterval = (days) => {
    if (days === 0) return '<5分';
    if (days === 1) return '1日';
    if (days < 30) return `${days}日`;
    if (days < 365) return `${Math.round(days / 30)}月`;
    return `${(days / 365).toFixed(1)}年`;
  };

  // 套用評分到 state（會 mutate 並儲存）
  const rate = (cardId, rating) => {
    const state = loadState();
    const old = state[cardId];
    const { newState, intervalDays } = computeNext(old, rating);
    state[cardId] = newState;
    saveState(state);
    return { newState, intervalDays };
  };

  // === Queue building ===

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 把幾組陣列交錯混合（盡量平均分布）
  const interleave = (arr, gap = 3) => {
    return shuffle(arr); // 簡化：直接洗牌即可，不刻意分組
  };

  // 組單輪隊列
  // 優先序：① 已到期 (最多 14 張) ② 新卡 (最多 6 張) ③ 還沒滿就再補到期的
  const buildQueue = (pool, state, sessionSize = SESSION_SIZE) => {
    const now = Date.now();
    const dueCards = pool.filter(c => state[c.id]?.due && state[c.id].due <= now);
    const newCards = pool.filter(c => !state[c.id] || !state[c.id].reps);

    const dueQuota = Math.min(dueCards.length, Math.max(sessionSize - 6, sessionSize - newCards.length));
    const newQuota = Math.min(newCards.length, sessionSize - dueQuota);

    const shuffledDue = shuffle(dueCards);
    const shuffledNew = shuffle(newCards);

    const picked = [
      ...shuffledDue.slice(0, dueQuota),
      ...shuffledNew.slice(0, newQuota),
    ];

    return shuffle(picked);
  };

  // === 設定頁渲染 ===

  const renderSetupPage = async (root) => {
    const settings = loadSettings();
    const index = await App.loadIndex();

    // 計算每章的 vocab + phrases 數量
    const counts = await Promise.all(index.map(async (ch) => {
      try {
        const res = await fetch(`./assets/data/chapters/ch${String(ch.id).padStart(2, '0')}.json`);
        if (!res.ok) return { id: ch.id, vocab: 0, phrase: 0 };
        const d = await res.json();
        let vocab = 0, phrase = 0;
        for (const s of d.sections || []) {
          if (s.type === 'vocabulary') vocab += (s.items || []).length;
          else if (s.type === 'phrases') {
            phrase += (s.groups || []).reduce((acc, g) => acc + (g.items || []).length, 0);
          }
        }
        return { id: ch.id, vocab, phrase };
      } catch { return { id: ch.id, vocab: 0, phrase: 0 }; }
    }));
    const countById = Object.fromEntries(counts.map(c => [c.id, c]));

    const chapterRows = index.map(ch => {
      const c = countById[ch.id];
      const checked = settings.chapters.includes(ch.id) ? 'checked' : '';
      return `
        <label class="fc-chapter-row">
          <input type="checkbox" class="fc-chapter" value="${ch.id}" ${checked} />
          <span class="ch-num">L ${ch.id}</span>
          <span class="ch-name">${escapeHtml(ch.title_zh)} <span class="muted small">${escapeHtml(ch.title_de)}</span></span>
          <span class="ch-count">${c.vocab + c.phrase}</span>
        </label>
      `;
    }).join('');

    root.innerHTML = `
      <h1>📇 單字卡</h1>
      <p class="lead">採用記憶曲線排程，每輪 20 題。手機友好。</p>

      <div class="flashcard-setup">
        <div class="fc-section">
          <h3>選擇章節</h3>
          <div class="fc-chapter-list">${chapterRows}</div>
          <div class="fc-quick-actions">
            <button id="fc-all">全選</button>
            <button id="fc-none">全不選</button>
          </div>
        </div>

        <div class="fc-section">
          <h3>學習方向</h3>
          <div class="fc-radio-group">
            <label><input type="radio" name="direction" value="de2zh" ${settings.direction==='de2zh'?'checked':''}/> 德 → 中（看德文回想中文）</label>
            <label><input type="radio" name="direction" value="zh2de" ${settings.direction==='zh2de'?'checked':''}/> 中 → 德（看中文寫德文，較難）</label>
            <label><input type="radio" name="direction" value="both"  ${settings.direction==='both'?'checked':''}/> 隨機雙向（推薦）</label>
          </div>
        </div>

        <div class="fc-section">
          <h3>卡片來源</h3>
          <div class="fc-checkbox-group">
            <label><input type="checkbox" class="fc-source" value="vocabulary" ${settings.sources.includes('vocabulary')?'checked':''}/> 單字（vocabulary）</label>
            <label><input type="checkbox" class="fc-source" value="phrases"    ${settings.sources.includes('phrases')?'checked':''}/> 短句（phrases）</label>
          </div>
        </div>

        <div class="fc-summary" id="fc-summary">
          <div><span class="num" id="sm-pool">—</span><span class="label">整體池</span></div>
          <div><span class="num" id="sm-due">—</span><span class="label">到期</span></div>
          <div><span class="num" id="sm-new">—</span><span class="label">未學</span></div>
        </div>

        <button class="fc-start-btn" id="fc-start" disabled>🚀 載入中…</button>

        <p class="muted small" style="text-align: center;">
          記憶曲線資料只存在你的瀏覽器，可在<a href="./settings.html">設定頁</a>清除。
        </p>
      </div>
    `;

    let currentPool = [];

    const collectSettings = () => {
      const chapters = Array.from(root.querySelectorAll('input.fc-chapter:checked')).map(i => parseInt(i.value, 10));
      const direction = root.querySelector('input[name="direction"]:checked')?.value || 'both';
      const sources = Array.from(root.querySelectorAll('input.fc-source:checked')).map(i => i.value);
      return { chapters, direction, sources };
    };

    const refresh = async () => {
      const s = collectSettings();
      saveSettings(s);
      const startBtn = root.querySelector('#fc-start');
      const $pool = root.querySelector('#sm-pool');
      const $due = root.querySelector('#sm-due');
      const $new = root.querySelector('#sm-new');

      if (s.chapters.length === 0 || s.sources.length === 0) {
        currentPool = [];
        $pool.textContent = '0';
        $due.textContent = '0';
        $new.textContent = '0';
        startBtn.disabled = true;
        startBtn.textContent = '請先勾選章節 / 來源';
        return;
      }

      startBtn.disabled = true;
      startBtn.textContent = '計算中…';

      currentPool = await buildPool(s.chapters, s.sources, s.direction);
      const state = loadState();
      const now = Date.now();
      const dueCount = currentPool.filter(c => state[c.id]?.due && state[c.id].due <= now).length;
      const newCount = currentPool.filter(c => !state[c.id] || !state[c.id].reps).length;

      $pool.textContent = currentPool.length;
      $due.textContent = dueCount;
      $new.textContent = newCount;

      const sessionSize = Math.min(SESSION_SIZE, currentPool.length);
      startBtn.disabled = currentPool.length === 0;
      startBtn.textContent = currentPool.length === 0 ? '池內無卡' : `🚀 開始 ${sessionSize} 題`;
    };

    // 綁定
    root.querySelectorAll('input.fc-chapter, input[name="direction"], input.fc-source').forEach(el => {
      el.addEventListener('change', refresh);
    });
    root.querySelector('#fc-all').addEventListener('click', () => {
      root.querySelectorAll('input.fc-chapter').forEach(i => i.checked = true);
      refresh();
    });
    root.querySelector('#fc-none').addEventListener('click', () => {
      root.querySelectorAll('input.fc-chapter').forEach(i => i.checked = false);
      refresh();
    });
    root.querySelector('#fc-start').addEventListener('click', () => {
      const s = collectSettings();
      stashSession({ settings: s });
      location.href = './study.html';
    });

    await refresh();
  };

  return {
    buildPool, loadState, saveState, loadSettings, saveSettings,
    stashSession, popSession, clearSession,
    rate, computeNext, previewIntervals, formatInterval, buildQueue,
    renderSetupPage,
    SESSION_SIZE, DAY_MS, FIVE_MIN_MS,
  };
})();
