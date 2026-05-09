/* api.js — Anthropic API 包裝
 *
 * Phase 1：先寫 stub，testKey 真的會打 API（讓設定頁可用）
 * 串流訊息在 Phase 2 啟用
 */

const Api = (() => {
  const ENDPOINT = 'https://api.anthropic.com/v1/messages';
  const VERSION = '2023-06-01';

  const headers = (key) => ({
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  });

  // 簡單的 key 驗證：呼叫 1-token 的請求
  const testKey = async (key) => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    return res.ok;
  };

  // 串流發送（Phase 2 用）
  const streamMessage = async ({ system, messages, model, onChunk, onDone, onError }) => {
    const key = Settings.apiKey();
    if (!key) {
      onError && onError(new Error('尚未設定 API key，請到設定頁填入'));
      return;
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: headers(key),
        body: JSON.stringify({
          model: model || Settings.model(),
          max_tokens: 1024,
          stream: true,
          system,
          messages,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}：${txt.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // 留下未完整的最後一行

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              onChunk && onChunk(evt.delta.text);
            } else if (evt.type === 'message_stop') {
              onDone && onDone();
            } else if (evt.type === 'error') {
              throw new Error(evt.error?.message || 'unknown error');
            }
          } catch (e) {
            // 略過解析錯誤的行
          }
        }
      }
      onDone && onDone();
    } catch (e) {
      onError && onError(e);
    }
  };

  return { testKey, streamMessage };
})();
