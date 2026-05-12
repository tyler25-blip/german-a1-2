/* app.js — 全站共用 */

const App = (() => {
  let chapterIndex = null;

  // 載入章節索引（首頁 / 章節頁都會用到）
  const loadIndex = async () => {
    if (chapterIndex) return chapterIndex;
    const res = await fetch('./assets/data/chapters/index.json?v=5');
    if (!res.ok) throw new Error('無法載入章節索引：' + res.status);
    chapterIndex = (await res.json()).chapters;
    return chapterIndex;
  };

  // 渲染首頁章節列表
  const renderChapterGrid = async (container) => {
    try {
      const chapters = await loadIndex();
      const progressData = (typeof Progress !== 'undefined') ? Progress : null;

      const chapterRows = await Promise.all(chapters.map(async ch => {
        const stub = ch.available ? '' : 'stub';
        const href = ch.available ? `./chapter.html?ch=${ch.id}` : '#';
        
        let pct = 0;
        let answered = 0;
        if (progressData && ch.available) {
          const chData = progressData.getChapter(ch.id);
          answered = Object.keys(chData).length;
          let totalEx = 0;
          try {
            const res = await fetch(`./assets/data/chapters/ch${String(ch.id).padStart(2, '0')}.json?v=5`);
            if (res.ok) {
              const j = await res.json();
              (j.sections || []).forEach(s => {
                if (s.type === 'exercise') totalEx += (s.questions || []).length;
              });
            }
            if (totalEx > 0) pct = Math.round((answered / totalEx) * 100);
          } catch(e) {}
        }
        
        const pctDisplay = answered > 0 ? `${pct}%` : '<span style="font-size:0.8rem;color:var(--text-muted);font-weight:400;">–</span>';
        const barWidth = answered > 0 ? pct : 0;

        return `
          <a href="${href}" class="chapter-row ${stub}">
            <span class="ch-num">${ch.id < 10 ? '0'+ch.id : ch.id}</span>
            <div class="ch-info">
              <h3>${escapeHtml(ch.title_de)} <span class="muted small">· ${escapeHtml(ch.title_zh)}</span></h3>
              <p class="topic">${escapeHtml(ch.topic_zh)}</p>
            </div>
            <div class="ch-progress">
              <span class="pct">${pctDisplay}</span>
              <div class="bar"><div style="width: ${barWidth}%"></div></div>
            </div>
          </a>
        `;
      }));
      container.innerHTML = chapterRows.join('');
    } catch (e) {
      container.innerHTML = `
        <div style="padding: 20px;">
          <p>錯誤：載入章節索引失敗：${escapeHtml(e.message)}</p>
          <p class="muted small">請用本地 server：<code>python3 -m http.server 8080</code></p>
        </div>
      `;
    }
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return { loadIndex, renderChapterGrid, escapeHtml };
})();
