/* chapter.js — 章節頁渲染 */

const Chapter = (() => {
  let state = { id: null, data: null, indexEntry: null };
  const escapeHtml = App.escapeHtml;

  const load = async () => {
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get('ch') || '1', 10);
    state.id = id;

    const root = document.getElementById('chapter-content');
    try {
      const index = await App.loadIndex();
      state.indexEntry = index.find(c => c.id === id);
      if (!state.indexEntry) throw new Error(`找不到章節 ${id}`);

      if (!state.indexEntry.available) {
        renderStub(root);
        return;
      }

      const res = await fetch(`./assets/data/chapters/ch${String(id).padStart(2, '0')}.json`);
      if (!res.ok) throw new Error(`無法載入 ch${id} 內容：HTTP ${res.status}`);
      state.data = await res.json();

      render(root);
    } catch (e) {
      root.innerHTML = `
        <div class="section-block">
          <h2>❌ 載入失敗</h2>
          <p>${escapeHtml(e.message)}</p>
          <p class="muted small">如果你是直接用瀏覽器打開 <code>file://</code>，請改用本地 server：<br>
          <code>cd "/Users/tyler/Documents/Cloud/德文" && python3 -m http.server 8080</code><br>
          再開 <code>http://localhost:8080</code></p>
          <p><a href="./index.html">← 回章節列表</a></p>
        </div>
      `;
    }
  };

  const renderStub = (root) => {
    const e = state.indexEntry;
    root.innerHTML = `
      ${navHtml()}
      <h1>Lektion ${e.id}: ${escapeHtml(e.title_zh)}</h1>
      <p class="lead">${escapeHtml(e.title_de)} — ${escapeHtml(e.topic_zh)}</p>

      <div class="section-block">
        <h2>🚧 此章節尚未編寫</h2>
        <p>這一章的內容（文法、單字、對話、練習題）會在後續 phase 由 Claude 從 PDF 整理出來。</p>
        <p>暫時可以：</p>
        <ul>
          <li>翻 <code>A1.2_YGT_Kurs-_und_Arbeitsbuch_-_Digital.pdf</code>，章節 ${e.id}</li>
          <li>用右下角的 💬 直接問 Claude 關於 <strong>${escapeHtml(e.grammar?.join('、') || '')}</strong> 的內容</li>
          <li><a href="./chapter.html?ch=1">回章節 1</a></li>
        </ul>
      </div>
    `;
  };

  const render = (root) => {
    const d = state.data;
    const e = state.indexEntry;

    // 收集所有 exercise 題目（為了綁事件 + 進度計算）
    const allQuestions = {};
    let totalQs = 0;
    (d.sections || []).forEach((sec, sIdx) => {
      if (sec.type === 'exercise') {
        (sec.questions || []).forEach((q, qIdx) => {
          const qid = q.id || `${state.id}-s${sIdx}-q${qIdx}`;
          q.id = qid;
          allQuestions[qid] = q;
          totalQs++;
        });
      }
    });

    const sectionsHtml = (d.sections || []).map(sec => renderSection(sec)).join('');

    const stats = Progress.chapterStats(state.id, totalQs);
    const pct = totalQs ? Math.round(stats.answered / totalQs * 100) : 0;

    root.innerHTML = `
      ${navHtml()}
      <div class="chapter-progress" title="${stats.answered} / ${totalQs} 已作答"><div style="width:${pct}%"></div></div>
      <h1>Lektion ${d.id}: ${escapeHtml(d.title_zh)}</h1>
      <p class="lead">${escapeHtml(d.title_de)} — ${escapeHtml(d.topic_zh)}</p>
      ${sectionsHtml}
      ${navHtml()}
    `;

    Exercises.bindAll(root, allQuestions);
    bindAskClaudeButtons(root);
  };

  const navHtml = () => {
    const id = state.id;
    const prev = id > 1 ? `<a href="./chapter.html?ch=${id-1}">← 上一章</a>` : '<span class="muted">← 上一章</span>';
    const next = id < 10 ? `<a href="./chapter.html?ch=${id+1}">下一章 →</a>` : '<span class="muted">下一章 →</span>';
    return `
      <div class="chapter-nav">
        ${prev}
        <span class="center"><a href="./index.html">所有章節</a></span>
        ${next}
      </div>
    `;
  };

  const renderSection = (sec) => {
    switch (sec.type) {
      case 'intro': return renderIntro(sec);
      case 'grammar': return renderGrammar(sec);
      case 'vocabulary': return renderVocab(sec);
      case 'dialogue': return renderDialogue(sec);
      case 'phrases': return renderPhrases(sec);
      case 'exercise': return renderExercise(sec);
      default: return `<div class="section-block muted">未知 section 類型：${escapeHtml(sec.type)}</div>`;
    }
  };

  const renderIntro = (sec) => `
    <div class="section-block intro">
      ${sec.title_zh ? `<h3>${escapeHtml(sec.title_zh)}</h3>` : ''}
      <p>${escapeHtml(sec.zh || sec.text || '')}</p>
    </div>
  `;

  const renderGrammar = (sec) => {
    const tables = (sec.tables || []).map(t => renderTable(t)).join('');
    const examples = sec.examples ? `
      <h4>例句</h4>
      <ul class="examples">
        ${sec.examples.map(ex => `
          <li>
            <span class="de">${escapeHtml(ex.de)}</span>
            <span class="zh">${escapeHtml(ex.zh || '')}</span>
          </li>
        `).join('')}
      </ul>
    ` : '';
    const tips = sec.tips_zh ? `<div class="tip">${escapeHtml(sec.tips_zh)}</div>` : '';
    const askBtn = `<button class="ask-claude" data-q="${escapeAttr('再多舉幾個 ' + (sec.title_de || sec.title_zh) + ' 的德文例句，並用淺顯中文解釋')}">🤔 問 Claude</button>`;

    return `
      <div class="section-block">
        ${askBtn}
        <h2>📐 ${escapeHtml(sec.title_de || sec.title_zh)} <span class="muted small">${sec.title_de && sec.title_zh ? escapeHtml(sec.title_zh) : ''}</span></h2>
        ${sec.explanation_zh ? `<p>${escapeHtml(sec.explanation_zh)}</p>` : ''}
        ${tables}
        ${examples}
        ${tips}
      </div>
    `;
  };

  const renderTable = (t) => {
    const head = t.headers ? `<thead><tr>${t.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>` : '';
    const body = `<tbody>${(t.rows || []).map(r => {
      // r 可以是 array of strings，第一個 cell 標記為 case-label
      if (Array.isArray(r)) {
        return `<tr>${r.map((cell, i) => {
          const cls = i === 0 ? 'case-label' : '';
          // 偵測是否是德文（很簡單的啟發式：含 der/die/das/dem/...）
          const isDe = /\b(der|die|das|dem|den|des|ein|eine|einem|einen|einer|eines|kein|keine|keinem|keinen|keiner|keines|mein|meine|meinem|meinen|meiner|sein|seine|seinem|seinen|seiner|ihr|ihre|ihrem|ihren|ihrer)\b/i.test(cell) || /[äöüß]/.test(cell);
          return `<td class="${cls} ${isDe ? 'de' : ''}">${escapeHtml(cell)}</td>`;
        }).join('')}</tr>`;
      }
      return '';
    }).join('')}</tbody>`;
    return `${t.title ? `<h4>${escapeHtml(t.title)}</h4>` : ''}<table class="gtable">${head}${body}</table>`;
  };

  const renderVocab = (sec) => {
    const items = (sec.items || []).map(it => `
      <div class="vocab-item">
        <span><span class="de">${escapeHtml(it.de)}</span>${it.plural ? `<span class="pl">(${escapeHtml(it.plural)})</span>` : ''}</span>
        <span class="zh">${escapeHtml(it.zh)}</span>
      </div>
    `).join('');
    return `
      <div class="section-block">
        <h2>📖 單字 <span class="muted small">${escapeHtml(sec.title_zh || '')}</span></h2>
        ${sec.title_de ? `<p class="muted">${escapeHtml(sec.title_de)}</p>` : ''}
        <div class="vocab-grid">${items}</div>
      </div>
    `;
  };

  const renderDialogue = (sec) => {
    const lines = (sec.lines || []).map(l => `
      <div class="line">
        <span class="speaker">${escapeHtml(l.speaker || '·')}</span>
        <span>
          <span class="de">${escapeHtml(l.de)}</span>
          ${l.zh ? `<span class="zh">${escapeHtml(l.zh)}</span>` : ''}
        </span>
      </div>
    `).join('');
    return `
      <div class="section-block">
        <h2>💬 對話 <span class="muted small">${escapeHtml(sec.title_zh || '')}</span></h2>
        <div class="dialogue">${lines}</div>
      </div>
    `;
  };

  const renderPhrases = (sec) => {
    const groups = (sec.groups || []).map(g => `
      <h4>${escapeHtml(g.title_zh)} <span class="muted small">${escapeHtml(g.title_de || '')}</span></h4>
      <div class="vocab-grid">
        ${(g.items || []).map(it => `
          <div class="vocab-item">
            <span class="de">${escapeHtml(it.de)}</span>
            <span class="zh">${escapeHtml(it.zh)}</span>
          </div>
        `).join('')}
      </div>
    `).join('');
    return `
      <div class="section-block">
        <h2>🗝️ 重點短句與單字 <span class="muted small">${escapeHtml(sec.title_zh || 'Important phrases & vocabulary')}</span></h2>
        ${groups}
      </div>
    `;
  };

  const renderExercise = (sec) => {
    const askBtn = `<button class="ask-claude" data-q="${escapeAttr('我想做更多關於「' + (sec.title_zh || '') + '」的練習，再給我 3 題')}">🤔 問 Claude</button>`;
    return `
      <div class="section-block">
        ${askBtn}
        <h2>✏️ ${escapeHtml(sec.title_zh)}</h2>
        ${Exercises.renderBlock(sec, state.id)}
      </div>
    `;
  };

  const escapeAttr = (s) => escapeHtml(s).replace(/"/g, '&quot;');

  const bindAskClaudeButtons = (root) => {
    root.querySelectorAll('button.ask-claude').forEach(btn => {
      btn.addEventListener('click', () => Chat.askWith(btn.dataset.q));
    });
  };

  // 給 chat.js 取得當前章節 context
  const current = () => state.data ? {
    id: state.data.id,
    title_de: state.data.title_de,
    title_zh: state.data.title_zh,
    topic_zh: state.data.topic_zh,
  } : (state.indexEntry ? {
    id: state.indexEntry.id,
    title_de: state.indexEntry.title_de,
    title_zh: state.indexEntry.title_zh,
    topic_zh: state.indexEntry.topic_zh,
  } : null);

  return { load, current };
})();
