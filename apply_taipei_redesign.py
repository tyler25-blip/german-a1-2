import os
import re

css_content = '''/* === 德文 A1.2 - Taipei Sans & Solid Layout === */

@font-face {
  font-family: 'Taipei Sans TC Beta';
  src: url('../fonts/TaipeiSansTCBeta-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'Taipei Sans TC Beta';
  src: url('../fonts/TaipeiSansTCBeta-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Taipei Sans TC Beta';
  src: url('../fonts/TaipeiSansTCBeta-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
}

:root {
  --bg: #F0EFED;
  --surface: #FFFFFF;
  --text-main: #141414;
  --text-muted: #8A8A8A;
  --border: rgba(0, 0, 0, 0.07);
  
  --accent-1: #E8704A; /* Orange-Red */
  --accent-2: #F4A454; /* Warm Orange */
  --accent-3: #9C8FC4; /* Lavender Purple */
  
  --de: #4f46e5;
  --good: #10b981;
  --bad: #E8704A;
  
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --maxw: 800px;
  --fs: 16px;
}

* { box-sizing: border-box; }
html { font-size: var(--fs); }

body {
  margin: 0;
  font-family: "Taipei Sans TC Beta", sans-serif;
  background: var(--bg);
  color: var(--text-main);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

/* Hero Background */
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40vh;
  z-index: -1;
  background: radial-gradient(ellipse at 50% 10%, var(--accent-1) 0%, var(--accent-2) 30%, var(--accent-3) 60%, var(--bg) 80%);
  opacity: 0.15; /* Subtle sunset feel */
  pointer-events: none;
}

/* Typography */
a { color: var(--accent-1); text-decoration: none; transition: color 0.2s; }
a:hover { color: var(--text-main); }
p { margin: 12px 0; }
.lead { color: var(--text-muted); font-size: 1.05rem; line-height: 1.5; margin-bottom: 32px; }
.muted { color: var(--text-muted); }
.small { font-size: 0.85rem; }
.de { color: var(--text-main); font-weight: 700; }
.zh { color: var(--text-muted); }

h1 {
  font-size: 2.8rem;
  margin: 16px 0 8px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main);
  line-height: 1.1;
}

h2 {
  font-size: 0.85rem;
  margin: 48px 0 16px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
}

h3 {
  font-size: 1.4rem;
  margin: 0 0 8px;
  font-weight: 700;
  color: var(--text-main);
}

/* Layout */
main {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 32px 24px 140px;
  position: relative;
}

/* Header */
.site-header {
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  background: transparent;
}
.site-header-inner {
  max-width: var(--maxw);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.site-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}
.site-title a { color: var(--text-main); }
.site-nav {
  display: flex;
  gap: 24px;
}
.site-nav a {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.site-nav a:hover { color: var(--text-main); }

/* Solid Cards */
.section-block, .stat-card, .fc-summary, .grammar-toc, .flashcard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 32px;
  margin-bottom: 24px;
}

/* Homepage Chapter List (New) */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
}
.chapter-row {
  display: grid;
  grid-template-columns: 80px 1fr 140px;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
  color: var(--text-main);
  transition: opacity 0.2s;
}
.chapter-row:hover { opacity: 0.7; }
.chapter-row.stub { opacity: 0.4; pointer-events: none; }
.chapter-row .ch-num {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-main);
}
.chapter-row .ch-info h3 {
  font-size: 1.2rem;
  margin: 0 0 4px 0;
}
.chapter-row .ch-info .topic {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}
.chapter-row .ch-progress {
  text-align: right;
}
.chapter-row .ch-progress .pct {
  font-size: 1rem;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}
.chapter-row .bar {
  width: 100%;
  height: 6px;
  background: rgba(0,0,0,0.06);
  border-radius: 99px;
  overflow: hidden;
}
.chapter-row .bar > div {
  height: 100%;
  background: var(--accent-1);
  border-radius: 99px;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.tool-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  text-decoration: none;
  color: var(--text-main);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s;
}
.tool-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
.tool-card .label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent-1);
  margin-bottom: 8px;
}
.tool-card h3 { font-size: 1.1rem; margin: 0 0 8px; }
.tool-card p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }

/* Progress Layout (New) */
.progress-table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--border);
}
.progress-table th, .progress-table td {
  padding: 20px 24px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.progress-table th {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  background: #fafafa;
}
.progress-table td {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-main);
}
.progress-table td.num-cell {
  font-size: 2rem;
}

.stat-card .num {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 8px;
}
.stat-card .label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
}
.progress-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin: 32px 0;
}

/* Forms & Buttons */
.form-row { margin: 24px 0; }
.form-row label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 8px;
}
input[type="text"], input[type="password"], select, textarea {
  width: 100%;
  padding: 16px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: 1rem;
  color: var(--text-main);
  transition: border-color 0.2s;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--text-main);
}
button.btn {
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 16px 24px;
  border: none;
  background: var(--text-main);
  color: #fff;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
button.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
button.btn.secondary {
  background: var(--bg);
  color: var(--text-main);
  border: 1px solid var(--border);
  box-shadow: none;
}
button.btn.secondary:hover { background: #e5e5e5; }

/* Chat FAB & Panel */
.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: var(--text-main);
  color: #fff;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.chat-fab:hover { transform: scale(1.05); }

.chat-panel {
  position: fixed;
  right: 24px;
  bottom: 100px;
  width: 380px;
  max-width: calc(100vw - 48px);
  height: 500px;
  max-height: calc(100vh - 140px);
  background: var(--surface) !important;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 48px rgba(0,0,0,0.12) !important;
  display: flex;
  flex-direction: column;
  z-index: 95;
  transform: translateY(20px);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-panel.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.chat-header {
  background: #fafafa;
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-msg {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 85%;
}
.chat-msg.user {
  background: var(--text-main);
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.chat-msg.assistant {
  background: var(--bg);
  color: var(--text-main);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.chat-input-row {
  padding: 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
.chat-input-row textarea {
  padding: 12px;
  min-height: 48px;
  margin-bottom: 12px;
  border-radius: 8px;
}

/* Mobile Bottom Nav */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(240, 239, 237, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  z-index: 90;
  padding-bottom: env(safe-area-inset-bottom);
}
.mobile-bottom-nav .nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.mobile-bottom-nav .nav-item:hover,
.mobile-bottom-nav .nav-item:active {
  color: var(--text-main);
}
.mobile-bottom-nav .icon {
  margin-bottom: 4px;
  display: flex;
}
.mobile-bottom-nav .icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

@media (max-width: 640px) {
  .site-nav { display: none; }
  .mobile-bottom-nav { display: flex; }
  main { padding: 24px 16px 120px; }
  .chapter-row { grid-template-columns: 60px 1fr; }
  .chapter-row .ch-progress { grid-column: 1 / -1; text-align: left; }
  .chat-fab { bottom: calc(85px + env(safe-area-inset-bottom)); }
  .chat-panel { bottom: calc(160px + env(safe-area-inset-bottom)); }
}

/* Utilities */
.deco-dots {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-left: 12px;
  vertical-align: middle;
}
.deco-dots span { width: 6px; height: 6px; border-radius: 50%; }
.deco-dots span:nth-child(1) { background: var(--accent-1); }
.deco-dots span:nth-child(2) { background: var(--accent-2); }
.deco-dots span:nth-child(3) { background: var(--accent-3); }

/* Exercise Specific */
.exercise-question {
  padding: 24px;
  margin: 16px 0;
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}
.choice-options label {
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  cursor: pointer;
  margin-bottom: 8px;
  display: block;
}
.choice-options label.selected {
  background: var(--text-main);
  color: #fff;
}
table.gtable { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95rem; }
table.gtable th, table.gtable td { border: 1px solid var(--border); padding: 12px 16px; text-align: left; }
table.gtable th { background: var(--bg); font-weight: 700; }
.examples { margin: 16px 0; padding: 0; list-style: none; }
.examples li {
  padding: 16px;
  border-left: 3px solid var(--accent-1);
  background: var(--bg);
  margin: 8px 0;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
'''
with open('assets/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

# HTML Updates
html_files = ['index.html', 'grammar.html', 'progress.html', 'settings.html', 'flashcards.html', 'study.html', 'chapter.html']
for hfile in html_files:
    if not os.path.exists(hfile): continue
    with open(hfile, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Remove google fonts
    html = re.sub(r'<link rel="preconnect" href="https://fonts.googleapis.com" />.*?<link href="https://fonts.googleapis.com/css2.*? />', '', html, flags=re.DOTALL)
    
    # Add hero-bg
    if '<div class="hero-bg"></div>' not in html:
        html = html.replace('<header class="site-header">', '<div class="hero-bg"></div>\n  <header class="site-header">')
    
    # Clean index html grid layout
    if hfile == 'index.html':
        html = re.sub(r'<div class="chapter-grid">.*?</div>', 
'''<div class="tools-grid">
      <a href="./flashcards.html" class="tool-card">
        <span class="label">Flashcards</span>
        <h3>單字卡</h3>
        <p>記憶曲線排程，每輪 20 題</p>
      </a>
      <a href="./grammar.html" class="tool-card">
        <span class="label">Grammar</span>
        <h3>文法手冊</h3>
        <p>A1.2 全套文法重點整理</p>
      </a>
      <a href="./progress.html" class="tool-card">
        <span class="label">Progress</span>
        <h3>學習進度</h3>
        <p>查看章節答對率、單字量</p>
      </a>
      <a href="./settings.html" class="tool-card">
        <span class="label">Settings</span>
        <h3>設定</h3>
        <p>設定 Anthropic API key</p>
      </a>
    </div>''', html, count=1, flags=re.DOTALL)
        
        # Replace the first chapter grid container
        html = html.replace('<div id="chapter-grid" class="chapter-grid">', '<div id="chapter-grid" class="chapter-list">')
    
    with open(hfile, 'w', encoding='utf-8') as f:
        f.write(html)

# JS Updates - app.js
with open('assets/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()
js = re.sub(r'return `\s*<a href="\${href}".*?</a>\s*`;', 
'''// Progress is handled mostly by progress.js, but we mock it simply here or just show static UI. 
        // Actual dynamic % logic would be great, but keeping it simple for app.js render:
        let pctHtml = '<span class="pct">-</span><div class="bar"><div></div></div>';
        try {
            // we will let progress.js inject the exact percentages if possible, or just leave it empty here.
        } catch(e){}
        return `
          <a href="${href}" class="chapter-row ${stub}">
            <span class="ch-num">${ch.id < 10 ? '0'+ch.id : ch.id}</span>
            <div class="ch-info">
              <h3>${escapeHtml(ch.title_de)} <span class="muted small">· ${escapeHtml(ch.title_zh)}</span></h3>
              <p class="topic">${escapeHtml(ch.topic_zh)}</p>
            </div>
            <div class="ch-progress" id="idx-prog-${ch.id}">
              <!-- Progress injected later or static -->
              <span class="pct" style="color:var(--text-muted); font-size: 0.8rem;">Click to start</span>
            </div>
          </a>
        `;''', js, flags=re.DOTALL)
with open('assets/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

# JS Updates - progress.js
with open('assets/js/progress.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace renderPage completely
new_render_page = '''const renderPage = async (root) => {
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
  };'''

js = re.sub(r'const renderPage = async \(root\) => \{.*?\};\n', new_render_page + '\n', js, flags=re.DOTALL)
with open('assets/js/progress.js', 'w', encoding='utf-8') as f:
    f.write(js)

# JS Updates - study.js (rating buttons colors)
with open('assets/js/study.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace hardcoded colors with neutral tones
js = js.replace("background: #ef4444", "background: #52525B") # red to neutral gray
js = js.replace("background: #f59e0b", "background: #71717A") # orange to neutral gray
js = js.replace("background: #10b981", "background: #27272A") # green to dark gray
js = js.replace("background: #3b82f6", "background: #18181B") # blue to blackish

with open('assets/js/study.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Applied massive Taipei Sans Redesign script.")
