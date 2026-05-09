/* settings.js — localStorage 包裝、設定頁的 UI 綁定 */

const Settings = (() => {
  const KEY_API = 'ygt_api_key';
  const KEY_MODEL = 'ygt_model';
  const KEY_FS = 'ygt_font_size';

  const get = (k, fallback = '') => localStorage.getItem(k) ?? fallback;
  const set = (k, v) => localStorage.setItem(k, v);

  const apiKey = () => get(KEY_API, '');
  const model = () => get(KEY_MODEL, 'claude-sonnet-4-6');
  const fontSize = () => get(KEY_FS, '16');

  const setApiKey = (v) => set(KEY_API, v);
  const setModel = (v) => set(KEY_MODEL, v);
  const setFontSize = (v) => {
    set(KEY_FS, v);
    document.documentElement.style.setProperty('--fs', v + 'px');
  };

  // 套用字級到所有頁面
  const applyFontSize = () => {
    const fs = fontSize();
    document.documentElement.style.setProperty('--fs', fs + 'px');
  };

  // 設定頁專用 UI 綁定
  const bindUI = () => {
    const $key = document.getElementById('api-key');
    const $model = document.getElementById('model');
    const $fs = document.getElementById('font-size');
    const $save = document.getElementById('save-settings');
    const $test = document.getElementById('test-key');
    const $clear = document.getElementById('clear-progress');
    const $stats = document.getElementById('progress-stats');

    $key.value = apiKey();
    $model.value = model();
    $fs.value = fontSize();

    $fs.addEventListener('change', () => setFontSize($fs.value));

    $save.addEventListener('click', () => {
      setApiKey($key.value.trim());
      setModel($model.value);
      setFontSize($fs.value);
      toast('已儲存設定');
    });

    $test.addEventListener('click', async () => {
      const k = $key.value.trim();
      if (!k) return toast('請先填入 API key');
      $test.disabled = true;
      $test.textContent = '測試中…';
      try {
        const ok = await Api.testKey(k);
        toast(ok ? '✅ API key 有效' : '❌ Key 無效或無權限');
      } catch (e) {
        toast('❌ 連線失敗：' + e.message);
      } finally {
        $test.disabled = false;
        $test.textContent = '測試 API key';
      }
    });

    $clear.addEventListener('click', () => {
      if (confirm('確定要清除所有作答記錄嗎？此動作無法還原。')) {
        Progress.clearAll();
        renderStats();
        toast('已清除');
      }
    });

    const renderStats = () => {
      const s = Progress.summary();
      $stats.textContent = `${s.correct} 答對 / ${s.total} 已作答（${s.chapters} 章節有進度）`;
    };
    renderStats();
  };

  // 初始化字級
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyFontSize);
    } else {
      applyFontSize();
    }
  }

  return { apiKey, model, fontSize, setApiKey, setModel, setFontSize, bindUI };
})();

// Toast 共用
function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}
