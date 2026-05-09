/* grammar.js — 文法手冊渲染 */

const Grammar = (() => {
  const escapeHtml = App.escapeHtml;
  let data = null;

  const load = async () => {
    const root = document.getElementById('grammar-content');
    try {
      const res = await fetch('./assets/data/grammar/reference.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
      render(root);
    } catch (e) {
      root.innerHTML = `
        <div class="section-block">
          <h2>❌ 載入失敗</h2>
          <p>${escapeHtml(e.message)}</p>
          <p class="muted small">如果你是直接用瀏覽器打開 <code>file://</code>，請改用本地 server。</p>
        </div>
      `;
    }
  };

  const render = (root) => {
    const toc = `
      <nav class="grammar-toc">
        <strong>跳到主題：</strong>
        ${data.topics.map(t => `<a href="#${t.id}">${escapeHtml(t.title_zh)}</a>`).join(' · ')}
      </nav>
    `;

    const sections = data.topics.map(t => renderTopic(t)).join('');
    root.innerHTML = `
      <h1>${escapeHtml(data.title_zh)}</h1>
      <p class="lead">${escapeHtml(data.subtitle_zh)}</p>
      ${toc}
      ${sections}
    `;

    // 平滑滾動
    root.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // 「問 Claude」按鈕
    root.querySelectorAll('button.ask-claude').forEach(btn => {
      btn.addEventListener('click', () => Chat.askWith(btn.dataset.q));
    });
  };

  const renderTopic = (t) => {
    const blocks = (t.blocks || []).map(b => renderBlock(b)).join('');
    const seeChapters = (t.see_chapters || []).length
      ? `<p class="muted small">📖 相關章節：${t.see_chapters.map(n => `<a href="./chapter.html?ch=${n}">Lektion ${n}</a>`).join('、')}</p>`
      : '';
    const askBtn = `<button class="ask-claude" data-q="${escapeAttr('我想要更詳細了解 ' + t.title_de + '（' + t.title_zh + '），可以舉幾個例句並解釋嗎？')}">🤔 問 Claude</button>`;

    return `
      <section class="section-block grammar-topic" id="${escapeHtml(t.id)}">
        ${askBtn}
        <h2>📐 ${escapeHtml(t.title_de)} <span class="muted small">${escapeHtml(t.title_zh)}</span></h2>
        <p>${escapeHtml(t.summary_zh)}</p>
        ${seeChapters}
        ${blocks}
      </section>
    `;
  };

  const renderBlock = (b) => {
    switch (b.type) {
      case 'table': return renderTable(b);
      case 'examples': return renderExamples(b);
      case 'tip': return `<div class="tip">${escapeHtml(b.text)}</div>`;
      default: return '';
    }
  };

  const renderTable = (b) => {
    const head = b.headers ? `<thead><tr>${b.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>` : '';
    const body = `<tbody>${(b.rows || []).map(r => {
      if (Array.isArray(r)) {
        return `<tr>${r.map((cell, i) => {
          const cls = i === 0 ? 'case-label' : '';
          const isDe = /\b(der|die|das|dem|den|des|ein|eine|einem|einen|einer|eines|kein|keine|keinem|keinen|keiner|keines|mein|meine|meinem|meinen|meiner|sein|seine|seinem|seinen|seiner|ihr|ihre|ihrem|ihren|ihrer)\b/i.test(cell) || /[äöüß]/.test(cell);
          return `<td class="${cls} ${isDe ? 'de' : ''}">${escapeHtml(cell)}</td>`;
        }).join('')}</tr>`;
      }
      return '';
    }).join('')}</tbody>`;
    return `${b.title ? `<h4>${escapeHtml(b.title)}</h4>` : ''}<table class="gtable">${head}${body}</table>`;
  };

  const renderExamples = (b) => `
    ${b.title ? `<h4>${escapeHtml(b.title)}</h4>` : ''}
    <ul class="examples">
      ${(b.items || []).map(ex => `
        <li>
          <span class="de">${escapeHtml(ex.de)}</span>
          <span class="zh">${escapeHtml(ex.zh || '')}</span>
        </li>
      `).join('')}
    </ul>
  `;

  const escapeAttr = (s) => escapeHtml(s).replace(/"/g, '&quot;');

  return { load };
})();
