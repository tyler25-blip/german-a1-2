/* progress.js — 練習作答記錄
 *
 * 結構：
 * { [chapterId]: { [exerciseId]: { correct: bool, attempts: n, ts: timestamp } } }
 */

const Progress = (() => {
  const KEY = 'ygt_progress_v1';

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  const record = (chapterId, exerciseId, correct) => {
    const data = load();
    if (!data[chapterId]) data[chapterId] = {};
    const prev = data[chapterId][exerciseId] || { attempts: 0, correct: false };
    data[chapterId][exerciseId] = {
      correct: correct || prev.correct, // 答對過就維持答對
      attempts: prev.attempts + 1,
      ts: Date.now(),
    };
    save(data);
  };

  const getChapter = (chapterId) => load()[chapterId] || {};

  const summary = () => {
    const data = load();
    let total = 0, correct = 0, chapters = 0;
    for (const ch of Object.keys(data)) {
      const exs = Object.values(data[ch]);
      if (exs.length) chapters++;
      total += exs.length;
      correct += exs.filter(e => e.correct).length;
    }
    return { total, correct, chapters };
  };

  const chapterStats = (chapterId, totalExercises) => {
    const ch = getChapter(chapterId);
    const answered = Object.keys(ch).length;
    const correct = Object.values(ch).filter(e => e.correct).length;
    return {
      answered,
      correct,
      total: totalExercises || answered,
      pct: totalExercises ? Math.round(answered / totalExercises * 100) : 0,
    };
  };

  const clearAll = () => save({});

  // 渲染進度頁
  const renderPage = async (root) => {
    const data = load();
    const index = await App.loadIndex();
    const totals = summary();
    const accuracy = totals.total ? Math.round(totals.correct / totals.total * 100) : 0;

    const summaryHtml = `
      <div class="progress-summary">
        <div class="stat-card"><span class="num">${totals.chapters}</span><span class="label">已開始章節</span></div>
        <div class="stat-card"><span class="num">${totals.total}</span><span class="label">已作答題數</span></div>
        <div class="stat-card"><span class="num">${totals.correct}</span><span class="label">答對題數</span></div>
        <div class="stat-card"><span class="num">${accuracy}<span style="font-size:1rem">%</span></span><span class="label">整體答對率</span></div>
      </div>
    `;

    const chapterRows = await Promise.all(index.map(async ch => {
      const chData = data[ch.id] || {};
      const answered = Object.keys(chData).length;
      const correct = Object.values(chData).filter(e => e.correct).length;
      let totalEx = 0;
      let totalVocab = 0;

      if (ch.available) {
        try {
          const res = await fetch(`./assets/data/chapters/ch${String(ch.id).padStart(2, '0')}.json`);
          if (res.ok) {
            const j = await res.json();
            (j.sections || []).forEach(s => {
              if (s.type === 'exercise') totalEx += (s.questions || []).length;
              if (s.type === 'vocabulary') totalVocab += (s.items || []).length;
            });
          }
        } catch {}
      }

      const accChapter = answered ? Math.round(correct / answered * 100) : 0;
      const pctDisplay = answered === 0 ? '-' : accChapter + '%';

      return `
        <tr>
          <td class="num-cell">${ch.id < 10 ? '0'+ch.id : ch.id}</td>
          <td>${pctDisplay}</td>
          <td>${totalVocab > 0 ? totalVocab : '-'}</td>
        </tr>
      `;
    }));

    root.innerHTML = `
      <h1>學習進度<div class="deco-dots"><span></span><span></span><span></span></div></h1>
      <p class="lead">你的作答記錄存在這台電腦的瀏覽器，不會上傳到雲端。</p>
      ${summaryHtml}
      
      <h2>DATA LAYOUT</h2>
      <table class="progress-table">
        <thead>
          <tr>
            <th>LEKTION</th>
            <th>CORRECT</th>
            <th>VOCAB</th>
          </tr>
        </thead>
        <tbody>
          ${chapterRows.join('')}
        </tbody>
      </table>
      
      <div class="section-block" style="margin-top: 48px;">
        <h3>清除進度</h3>
        <p class="muted">如果想重新作答所有題目，可以按下面的按鈕清空記錄。</p>
        <button id="clear-all-progress" class="btn secondary">清除所有作答記錄</button>
      </div>
    `;

    document.getElementById('clear-all-progress').addEventListener('click', () => {
      if (confirm('確定要清除所有作答記錄嗎？此動作無法還原。')) {
        clearAll();
        renderPage(root);
        toast('已清除');
      }
    });
  };

  return { record, getChapter, summary, chapterStats, clearAll, renderPage };
})();
