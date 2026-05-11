/* app.js — 全站共用 */

const App = (() => {
  let chapterIndex = null;

  // 載入章節索引（首頁 / 章節頁都會用到）
  const loadIndex = async () => {
    if (chapterIndex) return chapterIndex;
    const res = await fetch('./assets/data/chapters/index.json');
    if (!res.ok) throw new Error('無法載入章節索引：' + res.status);
    chapterIndex = (await res.json()).chapters;
    return chapterIndex;
  };

  // 渲染首頁的章節卡片
  const renderChapterGrid = async (container) => {
    try {
      const chapters = await loadIndex();
      container.innerHTML = chapters.map(ch => {
        const stub = ch.available ? '' : 'stub';
        const href = ch.available ? `./chapter.html?ch=${ch.id}` : '#';
        return `
          <a href="${href}" class="chapter-card ${stub}">
            <span class="num">Lektion ${ch.id}</span>
            <h3>${escapeHtml(ch.title_zh)}<span class="muted small"> · ${escapeHtml(ch.title_de)}</span></h3>
            <p class="topic">${escapeHtml(ch.topic_zh)}</p>
            <div class="grammar-tags">
              ${(ch.grammar || []).map(g => `<span class="tag">${escapeHtml(g)}</span>`).join('')}
            </div>
          </a>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = `
        <div class="section-block" style="grid-column: 1 / -1;">
          <p>錯誤：載入章節索引失敗：${escapeHtml(e.message)}</p>
          <p class="muted small">如果你是直接用瀏覽器打開 <code>file://</code>，請改用本地 server：<br>
          <code>cd "/Users/tyler/Documents/Cloud/德文" && python3 -m http.server 8080</code><br>
          再開 <code>http://localhost:8080</code></p>
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
