/* exercises.js — 練習題渲染與評分
 *
 * 支援題型（type）：
 *  - fill-blank：單格填空，answer 為字串或字串陣列（任一即可）
 *  - multi-blank：一句多空格，prompt_md 用 ___ 標示空格，answer 為陣列（每個空格的可接受答案；每個元素可以是 string 或 string array）
 *  - choice：單選，options 陣列，answer 為正解字串
 *  - table-fill：表格填空，rows = [{ cells: [{ text } | { input, answer }] }]
 *  - match：配對，pairs = [{ left, right }]，左欄固定、右欄變成下拉
 *  - free：自由作答，answer_zh 顯示參考答案，使用者自己評
 */

const Exercises = (() => {

  // 將「ABC」、「abc 」這類差異消除
  const normalize = (s) =>
    String(s || '')
      .normalize('NFC')
      .replace(/[„""'']/g, '"')
      .replace(/[‘’]/g, "'")
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]+$/, '')
      .replace(/\s+/g, ' ');

  const matchAny = (user, accepted) => {
    if (!Array.isArray(accepted)) accepted = [accepted];
    const u = normalize(user);
    return accepted.some(a => normalize(a) === u);
  };

  const escapeHtml = App.escapeHtml;

  // === 渲染整題練習區塊 ===
  const renderBlock = (sec, chapterId) => {
    const qs = (sec.questions || []).map((q, idx) => renderQuestion(q, chapterId, idx)).join('');
    return `
      <div class="exercise">
        ${sec.instruction_zh ? `<p class="instr"><strong>說明：</strong>${escapeHtml(sec.instruction_zh)}</p>` : ''}
        ${sec.instruction_de ? `<p class="instr muted small">${escapeHtml(sec.instruction_de)}</p>` : ''}
        ${qs}
      </div>
    `;
  };

  const renderQuestion = (q, chapterId, idx) => {
    const id = q.id || `${chapterId}-q${idx}`;
    let body = '';
    switch (q.type) {
      case 'fill-blank': body = renderFillBlank(q, id); break;
      case 'multi-blank': body = renderMultiBlank(q, id); break;
      case 'choice': body = renderChoice(q, id); break;
      case 'table-fill': body = renderTableFill(q, id); break;
      case 'match': body = renderMatch(q, id); break;
      case 'free': body = renderFree(q, id); break;
      default: body = `<p class="muted">未知題型：${escapeHtml(q.type)}</p>`;
    }
    const label = q.label ? `<div><strong>${escapeHtml(q.label)}</strong></div>` : '';
    return `
      <div class="exercise-question" data-qid="${escapeHtml(id)}" data-type="${escapeHtml(q.type)}" data-chapter="${chapterId}">
        ${label}
        ${body}
        ${q.hint_zh ? `<div class="q-hint">提示：${escapeHtml(q.hint_zh)}</div>` : ''}
        <div class="q-actions">
          <button class="primary q-check">對答案</button>
          <button class="q-reveal">直接看答案</button>
          <button class="q-ask" title="把這題帶到 Claude 對話框">🤔 問 Claude</button>
        </div>
        <div class="feedback" hidden></div>
      </div>
    `;
  };

  // === 各題型 ===

  // fill-blank: prompt_md 用 ___ 表示空格
  const renderFillBlank = (q, id) => {
    const prompt = (q.prompt_md || '').replace(
      /___+/g,
      `<input type="text" class="q-input" data-blank="0" autocomplete="off" />`
    );
    return `<div class="q-prompt">${prompt}</div>`;
  };

  const renderMultiBlank = (q, id) => {
    let i = 0;
    const prompt = (q.prompt_md || '').replace(/___+/g, () => {
      const idx = i++;
      return `<input type="text" class="q-input" data-blank="${idx}" autocomplete="off" />`;
    });
    return `<div class="q-prompt">${prompt}</div>`;
  };

  const renderChoice = (q, id) => {
    const opts = (q.options || []).map((opt, i) => `
      <label data-val="${escapeHtml(opt)}">
        <input type="radio" name="${id}" value="${escapeHtml(opt)}" />
        ${escapeHtml(opt)}
      </label>
    `).join('');
    return `
      <div class="q-prompt">${escapeHtml(q.prompt_de || q.prompt_md || '')}</div>
      <div class="choice-options">${opts}</div>
    `;
  };

  const renderTableFill = (q, id) => {
    const headers = q.headers || [];
    const trHead = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    let blankIdx = 0;
    const trRows = (q.rows || []).map(row => {
      const tds = row.cells.map(cell => {
        if (cell.input) {
          const idx = blankIdx++;
          return `<td><input type="text" class="q-input" data-blank="${idx}" autocomplete="off" /></td>`;
        }
        return `<td>${escapeHtml(cell.text || '')}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `
      <div class="q-prompt">${escapeHtml(q.prompt || '')}</div>
      <table class="tf-table"><thead>${trHead}</thead><tbody>${trRows}</tbody></table>
    `;
  };

  const renderMatch = (q, id) => {
    const rights = (q.pairs || []).map(p => p.right);
    const shuffled = [...new Set(rights)].sort(() => Math.random() - 0.5);
    const optionsHtml = shuffled.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
    const rows = (q.pairs || []).map((p, i) => `
      <div class="left">${escapeHtml(p.left)}</div>
      <div>
        <select data-blank="${i}">
          <option value="">— 選擇 —</option>
          ${optionsHtml}
        </select>
      </div>
    `).join('');
    return `
      <div class="q-prompt">${escapeHtml(q.prompt || '請配對：')}</div>
      <div class="match-pairs">${rows}</div>
    `;
  };

  const renderFree = (q, id) => {
    return `
      <div class="q-prompt">${escapeHtml(q.prompt_md || q.prompt_de || '')}</div>
      <textarea class="q-input" data-blank="0" placeholder="自己試著寫看看…"></textarea>
    `;
  };

  // === 評分 ===

  const checkQuestion = (qEl, qData) => {
    const inputs = qEl.querySelectorAll('.q-input');
    const fb = qEl.querySelector('.feedback');

    let userAns;
    let correct = false;
    let detail = '';

    switch (qData.type) {
      case 'fill-blank': {
        userAns = inputs[0]?.value || '';
        correct = matchAny(userAns, qData.answer);
        detail = `正解：<strong>${formatAnswers(qData.answer)}</strong>`;
        break;
      }
      case 'multi-blank': {
        const userArr = Array.from(inputs).map(i => i.value);
        const accepted = qData.answer || [];
        const results = accepted.map((a, i) => matchAny(userArr[i], a));
        correct = results.every(Boolean);
        detail = `正解：${accepted.map(a => `<strong>${formatAnswers(a)}</strong>`).join(' / ')}`;
        break;
      }
      case 'choice': {
        const sel = qEl.querySelector('input[type="radio"]:checked');
        userAns = sel?.value || '';
        correct = matchAny(userAns, qData.answer);
        detail = `正解：<strong>${formatAnswers(qData.answer)}</strong>`;
        break;
      }
      case 'table-fill': {
        const userArr = Array.from(inputs).map(i => i.value);
        const accepted = qData.answer || [];
        const results = accepted.map((a, i) => matchAny(userArr[i], a));
        correct = results.every(Boolean);
        detail = `正解：${accepted.map(a => `<code>${escapeHtml(Array.isArray(a) ? a[0] : a)}</code>`).join(' · ')}`;
        break;
      }
      case 'match': {
        const selects = qEl.querySelectorAll('select');
        const userArr = Array.from(selects).map(s => s.value);
        const accepted = (qData.pairs || []).map(p => p.right);
        const results = accepted.map((a, i) => normalize(userArr[i]) === normalize(a));
        correct = results.every(Boolean);
        detail = `正解：${accepted.map(a => `<code>${escapeHtml(a)}</code>`).join(' · ')}`;
        break;
      }
      case 'free': {
        // 自由題：直接顯示參考答案，使用者自評
        const ref = qData.answer_zh || qData.answer || '(無參考答案)';
        showFeedback(qEl, fb, null, `📖 參考答案：${formatAnswers(ref)}<br>${qData.explanation_zh ? '<small class="muted">' + escapeHtml(qData.explanation_zh) + '</small>' : ''}`);
        return;
      }
    }

    showFeedback(qEl, fb, correct, detail);
    Progress.record(qEl.dataset.chapter, qEl.dataset.qid, correct);
  };

  const formatAnswers = (a) => {
    if (Array.isArray(a)) return a.map(x => `<code>${escapeHtml(x)}</code>`).join(' 或 ');
    return `<code>${escapeHtml(a)}</code>`;
  };

  const showFeedback = (qEl, fb, correct, detail) => {
    qEl.classList.remove('correct', 'wrong');
    if (correct === true) qEl.classList.add('correct');
    else if (correct === false) qEl.classList.add('wrong');

    const prefix = correct === true ? '✅ 答對了！'
                  : correct === false ? '❌ 答錯了。'
                  : '';
    fb.innerHTML = (prefix ? `<strong>${prefix}</strong> ` : '') + detail;
    fb.hidden = false;
  };

  const revealAnswer = (qEl, qData) => {
    const fb = qEl.querySelector('.feedback');
    let detail = '';
    if (qData.type === 'free') {
      detail = `📖 參考答案：${formatAnswers(qData.answer_zh || qData.answer || '')}`;
    } else if (qData.type === 'match') {
      detail = (qData.pairs || []).map(p => `${escapeHtml(p.left)} → <code>${escapeHtml(p.right)}</code>`).join('<br>');
    } else if (qData.type === 'multi-blank' || qData.type === 'table-fill') {
      detail = (qData.answer || []).map(a => `<code>${escapeHtml(Array.isArray(a) ? a[0] : a)}</code>`).join(' · ');
    } else {
      detail = formatAnswers(qData.answer);
    }
    fb.innerHTML = `📖 答案：${detail}`;
    fb.hidden = false;
  };

  // === 綁定全章節練習題的事件 ===
  const bindAll = (rootEl, sectionsLookup) => {
    rootEl.querySelectorAll('.exercise-question').forEach(qEl => {
      const qid = qEl.dataset.qid;
      const qData = sectionsLookup[qid];
      if (!qData) return;

      qEl.querySelector('.q-check')?.addEventListener('click', () => checkQuestion(qEl, qData));
      qEl.querySelector('.q-reveal')?.addEventListener('click', () => revealAnswer(qEl, qData));
      qEl.querySelector('.q-ask')?.addEventListener('click', () => {
        const promptText = qData.prompt_md || qData.prompt_de || qData.prompt || '';
        const ans = qData.answer ? `（正解：${Array.isArray(qData.answer) ? qData.answer[0] : qData.answer}）` : '';
        Chat.askWith(`這題我不太懂，可以解釋嗎？\n\n題目：${promptText}\n${ans}`);
      });

      // 選擇題的 label 點擊高亮
      if (qData.type === 'choice') {
        qEl.querySelectorAll('.choice-options label').forEach(lbl => {
          lbl.addEventListener('click', () => {
            qEl.querySelectorAll('.choice-options label').forEach(l => l.classList.remove('selected'));
            lbl.classList.add('selected');
          });
        });
      }

      // 填空題按 Enter 直接對答案
      qEl.querySelectorAll('input.q-input').forEach(inp => {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkQuestion(qEl, qData);
          }
        });
      });
    });
  };

  return { renderBlock, bindAll };
})();
