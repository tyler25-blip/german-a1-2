/* keyboard.js — 全站鍵盤快捷鍵
 *
 *  J / →  下一章
 *  K / ←  上一章
 *  /      開啟 Claude 對話框
 *  Esc    關閉對話框
 *  ?      顯示快捷鍵說明
 */

(() => {
  const isTyping = () => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  };

  const goToChapter = (delta) => {
    const params = new URLSearchParams(location.search);
    const cur = parseInt(params.get('ch'), 10);
    if (!cur) return;
    const next = cur + delta;
    if (next < 1 || next > 10) return;
    location.href = `./chapter.html?ch=${next}`;
  };

  const openChat = () => {
    const panel = document.getElementById('chat-panel');
    const fab = document.getElementById('chat-fab');
    if (panel && !panel.classList.contains('open')) {
      fab?.click();
    } else {
      // 已經開了 → focus input
      document.getElementById('chat-input')?.focus();
    }
  };

  const closeChat = () => {
    const panel = document.getElementById('chat-panel');
    if (panel?.classList.contains('open')) {
      panel.classList.remove('open');
      return true;
    }
    return false;
  };

  const showHelp = () => {
    const msg = `🎹 鍵盤快捷鍵

  J 或 →   下一章
  K 或 ←   上一章
  /        開啟 Claude 對話框
  Esc      關閉對話框
  ?        顯示這份說明`;
    alert(msg);
  };

  document.addEventListener('keydown', (e) => {
    // Esc 永遠生效
    if (e.key === 'Escape') {
      if (closeChat()) e.preventDefault();
      return;
    }

    if (isTyping()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const onChapter = location.pathname.endsWith('/chapter.html') || location.pathname.endsWith('chapter.html');

    switch (e.key) {
      case 'j':
      case 'ArrowRight':
        if (onChapter) { e.preventDefault(); goToChapter(1); }
        break;
      case 'k':
      case 'ArrowLeft':
        if (onChapter) { e.preventDefault(); goToChapter(-1); }
        break;
      case '/':
        e.preventDefault();
        openChat();
        break;
      case '?':
        e.preventDefault();
        showHelp();
        break;
    }
  });
})();
