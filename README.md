# 德文 A1.2 自學網站

依照 `A1.2_YGT_Kurs- und Arbeitsbuch` 與 `eBook_A1.2_Grammatik` 兩本 PDF 製作的個人化學習網站，含：

- 10 章節分頁，逐章淺顯講解
- 每章文法整理 + 表格 + 例句
- 完整單字表（含陰陽中性、複數）
- 對話原文 + 中譯
- 互動練習題（填空、選擇、配對、自由作答），即時對答案
- 浮動 Claude 對話框，隨時可問問題

---

## 啟動方式（**重要**）

直接用瀏覽器打開 `index.html` 會失敗（CORS 擋住了 JSON 檔），必須跑本地 server。

開啟終端機，進入這個資料夾：

```sh
cd "/Users/tyler/Documents/Cloud/德文"
python3 -m http.server 8080
```

然後在瀏覽器打開 → http://localhost:8080

關閉時：在終端機按 `Ctrl+C`。

> 也可以用 Node：`npx serve -p 8080`，或任何靜態 server。

---

## 設定 Claude 對話功能

1. 到 https://console.anthropic.com/settings/keys 建立一支 API key（格式：`sk-ant-...`）
2. 開網站後點右上角「設定」→ 貼上 key → 按「儲存」
3. 之後每頁右下角的 💬 按鈕就會啟用

> ⚠️ Key 只存在你電腦的 `localStorage`，不會傳到任何伺服器（除了 Anthropic 自己）。但別把整個資料夾連同瀏覽器資料分享出去。也別把 key 放進 git。

---

## 完成內容

- ✅ 10 章節完整內容（Lektion 1–10）：對話、文法、單字、共 **255 題互動練習**
- ✅ 文法手冊（11 個主題：Dativ、Satzbau、Imperativ、Modalverben、Possessivartikel、Komparativ & Superlativ、Präteritum、Daten、Spezialthemen、Tipps & Tricks、Vokabular）
- ✅ Claude 對話框（streaming），章節頁的「🤔 問 Claude」按鈕
- ✅ 學習進度頁（每章答對率、清除記錄）
- ✅ 鍵盤快捷鍵（J/K 切章、/ 開對話、? 看說明）

## 鍵盤快捷鍵

| 鍵 | 功能 |
|---|---|
| `J` 或 `→` | 下一章 |
| `K` 或 `←` | 上一章 |
| `/` | 開啟 Claude 對話框 |
| `Esc` | 關閉對話框 |
| `?` | 顯示快捷鍵說明 |

---

## 檔案結構

```
德文/
├── index.html              首頁（10 章節卡片）
├── chapter.html            章節通用模板（用 ?ch=N 載入內容）
├── grammar.html            文法手冊（Phase 5）
├── settings.html           設定頁
├── README.md               本檔
├── A1.2_*.pdf              原始教材（不要刪）
└── assets/
    ├── css/style.css       單一樣式表
    ├── js/
    │   ├── app.js          全站共用、章節索引載入
    │   ├── chapter.js      章節渲染器
    │   ├── exercises.js    練習題渲染與評分
    │   ├── grammar.js      文法手冊渲染器
    │   ├── chat.js         Claude 浮動對話框
    │   ├── api.js          Anthropic API 包裝（含 streaming）
    │   ├── settings.js     localStorage：API key、字級、模型
    │   ├── progress.js     localStorage：作答記錄、進度頁渲染
    │   └── keyboard.js     全站鍵盤快捷鍵
    └── data/
        ├── chapters/
        │   ├── index.json  10 章節索引
        │   └── ch01–10.json
        └── grammar/
            └── reference.json  文法手冊 11 主題
```

---

## 怎麼新增 / 修改章節內容？

每章內容都在 `assets/data/chapters/chXX.json`，**不用碰 HTML/JS**。

支援的 section type：
- `intro` — 章節導讀
- `grammar` — 文法解釋（含 explanation_zh、tables、examples、tips_zh）
- `vocabulary` — 單字表（每筆有 de / plural / zh）
- `dialogue` — 對話（speaker / de / zh）
- `phrases` — 重點短句（分組）
- `exercise` — 練習題（含多種題型）

支援的 exercise question type：
- `fill-blank` — 一格填空，`answer` 為字串或字串陣列
- `multi-blank` — 多格填空，`answer` 為陣列（每格可放 `["可接受答1","可接受答2"]`）
- `choice` — 單選（options + answer）
- `table-fill` — 填表（headers + rows，cell 是 `{text}` 或 `{input:true, answer}`）
- `match` — 配對（pairs: 左右兩欄）
- `free` — 自由作答，顯示參考答案

讓 `chXX.json` 對應的章節從 stub 變成可進入：把 `assets/data/chapters/index.json` 該章的 `available` 改成 `true`。

---

## 隱私與成本

- **API key**：只存在你瀏覽器的 localStorage，沒有任何伺服器在中間。
- **API 成本**：Sonnet 4.6 每千個 token 約 $0.003 輸入 / $0.015 輸出，問一次大約 $0.001–0.005。Haiku 4.5 更便宜。
- **學習資料**：練習答題記錄只存在 localStorage（用設定頁的「清除作答記錄」可重設）。
