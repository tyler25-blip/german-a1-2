/* chat.js — 浮動 Claude 對話面板
 *
 * Phase 1：基本面板 UI 已存在，但若沒設 API key 會提示去設定
 *           可以本地測試送出訊息（Phase 2 完整啟用 streaming）
 */

const Chat = (() => {
  const STORE_KEY = 'ygt_chat_history_v1'; // sessionStorage
  let panel, fab;
  let messages = [];
  let pendingContext = null; // { chapter, section, prefill }
  let streaming = false;

  const sysPromptBase = `你是德文 A1.2 程度的家教，學生母語是繁體中文。
- 用淺顯的中文解釋，必要時保留德文術語（例如 Dativ、Akkusativ、der/die/das）
- 回答簡短、結構化，多舉例（德文例句 + 中譯）
- 學生問什麼就答什麼，不要扯太遠
- 文法表格用 markdown 表格`;

  const buildSystemPrompt = () => {
    const ctx = currentChapterContext();
    if (ctx) {
      return `${sysPromptBase}\n\n學生目前在 Lektion ${ctx.id}：${ctx.title_de}（${ctx.title_zh}），主題：${ctx.topic_zh}。`;
    }
    return sysPromptBase;
  };

  const currentChapterContext = () => {
    if (typeof Chapter !== 'undefined' && Chapter.current) {
      return Chapter.current();
    }
    return null;
  };

  const loadHistory = () => {
    try {
      messages = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
    } catch { messages = []; }
  };
  const saveHistory = () => sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));

  const init = () => {
    fab = document.getElementById('chat-fab');
    panel = document.getElementById('chat-panel');
    if (!fab || !panel) return;

    loadHistory();
    renderPanel();

    fab.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        renderPanel();
        focusInput();
      }
    });
  };

  const renderPanel = () => {
    if (!panel) return;
    const ctx = currentChapterContext();
    const ctxLabel = ctx ? `Lektion ${ctx.id}` : '';

    panel.innerHTML = `
      <div class="chat-header">
        <span>Ask Claude <span class="ctx-pill">${ctxLabel}</span></span>
        <span>
          <button id="chat-clear" title="清除對話"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          <button id="chat-close" title="關閉">×</button>
        </span>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-row">
        <textarea id="chat-input" placeholder="輸入問題後按 Enter 送出，Shift+Enter 換行" rows="2"></textarea>
        <div class="chat-actions-row">
          <span class="left">${Settings.apiKey() ? '已設定 API key' : '<a href="./settings.html">請先設定 API key</a>'}</span>
          <button id="chat-send">送出</button>
        </div>
      </div>
    `;

    document.getElementById('chat-close').addEventListener('click', () => panel.classList.remove('open'));
    document.getElementById('chat-clear').addEventListener('click', () => {
      if (confirm('清除這次的對話記錄？')) {
        messages = [];
        saveHistory();
        renderMessages();
      }
    });
    document.getElementById('chat-send').addEventListener('click', sendMessage);

    const $input = document.getElementById('chat-input');
    $input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 套用 pending 的 prefill
    if (pendingContext?.prefill) {
      $input.value = pendingContext.prefill;
      pendingContext = null;
    }

    renderMessages();
  };

  const focusInput = () => {
    const $input = document.getElementById('chat-input');
    if ($input) setTimeout(() => $input.focus(), 50);
  };

  const renderMessages = () => {
    const $msgs = document.getElementById('chat-messages');
    if (!$msgs) return;

    if (messages.length === 0) {
      const ctx = currentChapterContext();
      const suggestions = ctx
        ? [
            `這章 (${ctx.title_de}) 的重點是什麼？`,
            `Dativ 跟 Akkusativ 差在哪？舉例給我`,
            `再給我幾個練習句`,
          ]
        : ['Dativ 跟 Akkusativ 差在哪？', '德文的「der/die/das」要怎麼記？', '推薦三個 A1 學習方法'];

      $msgs.innerHTML = `
        <div class="chat-empty">
          <p>嗨！有什麼德文問題想問嗎？</p>
          <div class="suggestions">
            ${suggestions.map(s => `<button data-q="${escapeAttr(s)}">${escapeHtml(s)}</button>`).join('')}
          </div>
        </div>
      `;
      $msgs.querySelectorAll('button[data-q]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('chat-input').value = btn.dataset.q;
          sendMessage();
        });
      });
      return;
    }

    $msgs.innerHTML = messages.map(m => renderMsg(m)).join('');
    $msgs.scrollTop = $msgs.scrollHeight;
  };

  const renderMsg = (m) => {
    if (m.role === 'error') return `<div class="chat-msg error">${escapeHtml(m.text)}</div>`;
    const klass = m.role === 'user' ? 'user' : 'assistant';
    return `<div class="chat-msg ${klass}">${formatMarkdown(m.text)}</div>`;
  };

  // 極簡 markdown：粗體、斜體、code、換行
  const formatMarkdown = (txt) => {
    let h = escapeHtml(txt);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    return h;
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapeAttr = (s) => escapeHtml(s).replace(/"/g, '&quot;');

  const sendMessage = async () => {
    if (streaming) return;
    const $input = document.getElementById('chat-input');
    const text = $input.value.trim();
    if (!text) return;

    if (!Settings.apiKey()) {
      messages.push({ role: 'error', text: '尚未設定 API key — 請到「設定」頁填入' });
      renderMessages();
      return;
    }

    messages.push({ role: 'user', text });
    saveHistory();
    $input.value = '';
    renderMessages();

    // 占位 assistant 訊息
    const assistantIdx = messages.length;
    messages.push({ role: 'assistant', text: '' });
    renderMessages();

    streaming = true;
    document.getElementById('chat-send').disabled = true;

    const apiMessages = messages
      .filter((m, i) => m.role === 'user' || (m.role === 'assistant' && i < assistantIdx))
      .map(m => ({ role: m.role, content: m.text }));

    await Api.streamMessage({
      system: buildSystemPrompt(),
      messages: apiMessages,
      onChunk: (chunk) => {
        messages[assistantIdx].text += chunk;
        renderMessages();
      },
      onDone: () => {
        streaming = false;
        document.getElementById('chat-send').disabled = false;
        saveHistory();
      },
      onError: (err) => {
        messages[assistantIdx] = { role: 'error', text: '錯誤：' + err.message };
        streaming = false;
        document.getElementById('chat-send').disabled = false;
        saveHistory();
        renderMessages();
      },
    });
  };

  // 從章節頁的「問 Claude」按鈕呼叫，預填問題並打開面板
  const askWith = (prefillText) => {
    pendingContext = { prefill: prefillText };
    panel.classList.add('open');
    renderPanel();
    focusInput();
  };

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return { init, askWith };
})();
