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
        toast(ok ? 'API key 有效' : 'Key 無效或無權限');
      } catch (e) {
        toast('連線失敗：' + e.message);
      } finally {
        $test.disabled = false;
        $test.textContent = '測試 API key';
      }
    });

    $clear.addEventListener('click', () => {
      if (confirm('確定要清除所有課本作答記錄嗎？此動作無法還原。')) {
        Progress.clearAll();
        renderStats();
        toast('已清除課本練習記錄');
      }
    });

    // 單字卡記錄
    const $clearFc = document.getElementById('clear-flashcards');
    const $fcStats = document.getElementById('flashcard-stats');
    $clearFc?.addEventListener('click', () => {
      if (typeof Flashcards === 'undefined') return;
      if (confirm('確定要清除所有單字卡的記憶曲線資料嗎？此動作無法還原。')) {
        Flashcards.clearAllFlashcards();
        renderStats();
        toast('已清除單字卡記錄');
      }
    });

    // 匯出
    document.getElementById('export-data')?.addEventListener('click', () => {
      if (typeof Flashcards === 'undefined') return;
      const data = Flashcards.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `german-a1-2-backup-${ts}.json?v=5`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('已匯出備份');
    });

    // 匯入
    document.getElementById('import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.flashcards) throw new Error('檔案不像 a1.2 備份檔');
        const mode = confirm(
          '要怎麼匯入？\n\n' +
          '【確定】= 合併（保留兩邊較新的進度）\n' +
          '【取消】= 取消匯入\n\n' +
          '若要完全覆蓋目前資料，請按取消後重試（將提示是否覆蓋）。'
        ) ? 'merge' : null;
        if (!mode) {
          // 第二次確認：要覆蓋嗎？
          if (confirm('要「完全覆蓋」目前的單字卡與練習進度嗎？此動作無法還原。')) {
            Flashcards.importData(data, 'replace');
            renderStats();
            toast('已覆蓋匯入');
          }
        } else {
          Flashcards.importData(data, 'merge');
          renderStats();
          toast('已合併匯入');
        }
      } catch (err) {
        toast('匯入失敗：' + err.message);
      } finally {
        e.target.value = ''; // 清空 input 讓下次同檔可重選
      }
    });

    const renderStats = () => {
      const s = Progress.summary();
      $stats.textContent = `${s.correct} 答對 / ${s.total} 已作答（${s.chapters} 章節有進度）`;
      if ($fcStats && typeof Flashcards !== 'undefined') {
        const cardCount = Object.keys(Flashcards.loadState()).length;
        const logCount = Flashcards.loadLog().length;
        const hardCount = Flashcards.countHardCards();
        $fcStats.textContent = `${cardCount} 張卡有進度，累積 ${logCount} 次評分，${hardCount} 張困難`;
      }
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
