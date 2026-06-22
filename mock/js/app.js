// =============================================
// js/app.js — 積みゲー・コンシェルジュ モック
// =============================================

// ----- ゲームデータ（ランダム選択用） -----
const GAMES = [
  {
    title: 'ゼルダの伝説<br>ティアーズ オブ ザ キングダム',
    reason: '「2時間あれば続きから充分楽しめます。前回は第3の祠をクリアしたところ。操作はすぐ思い出せますよ！」',
    tags: ['🎮 Switch', '⚔️ アドベンチャー', '🕐 残り約60h', '📌 序盤で放置'],
  },
  {
    title: 'ペルソナ5 ロイヤル',
    reason: '「中盤まで進んでいましたね。あの続きが気になりませんか？BGMも最高です🎵」',
    tags: ['🎮 Switch', '🎭 JRPG', '🕐 残り約80h', '📌 中断中'],
  },
  {
    title: 'スプラトゥーン3',
    reason: '「すでにプレイ中ですね！今日はサーモンランに挑んでみましょう🐟」',
    tags: ['🎮 Switch', '🎯 シューター', '✅ プレイ中'],
  },
  {
    title: 'モンスターハンター<br>ワイルズ',
    reason: '「まだ未開封ですが、今こそ開封のとき！チュートリアルは約30分で終わります🐉」',
    tags: ['🎮 PS5', '🐉 アクションRPG', '📦 未開封', '🕐 クリア目安100h+'],
  },
  {
    title: 'あつまれ どうぶつの森',
    reason: '「ゆったりしたい気分のときにぴったり。島の住民があなたを待っています🌿」',
    tags: ['🎮 Switch', '🌸 シミュレーション', '📌 序盤で放置'],
  },
];

// AIチャットの返答一覧
const AI_RESPONSES = [
  'なるほど！その気分ならリストからぴったりの1本をお選びします🎮',
  '承知いたしました。いくつか候補がございます。最近プレイしていないゲームも含めてご提案しましょうか？',
  'よい選択です！操作方法の一覧も一緒に表示しますか？',
  '2時間でしたら「スプラトゥーン3」のサーモンランがおすすめです🐟',
  'ぴったりの1本が見つかりましたね！ぜひ楽しんできてください✨',
  'もちろんです。あらすじを要約しますので、少々お待ちください📖',
];
let resIdx = 0;
let heroIdx = 0;

// =============================================
// タブ切り替え（モバイルボトムナビ & PCサイドバー共通）
// =============================================
function switchTab(tabId) {
  // タブパネル切り替え
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');

  // モバイル ボトムナビのアクティブ更新
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // PC サイドバーのアクティブ更新
  document.querySelectorAll('.pc-nav-btn[data-pc-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pcTab === tabId);
  });

  // スクロールをトップに戻す
  const wrapper = document.querySelector('.app-wrapper');
  if (wrapper) wrapper.scrollTop = 0;
}

// モバイル ボトムナビ
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// PC サイドバーナビ
document.querySelectorAll('.pc-nav-btn[data-pc-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.pcTab));
});

// PC チャットフォーカスボタン（右パネルのinputへフォーカス）
document.getElementById('pc-chat-focus-btn')?.addEventListener('click', () => {
  document.getElementById('pc-chat-input')?.focus();
});

// =============================================
// フィルターチップ（リストタブ）
// =============================================
document.querySelectorAll('.filter-bar').forEach(bar => {
  bar.querySelectorAll('.f-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.f-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

// =============================================
// ペルソナチップ（チャット画面）
// =============================================
document.querySelectorAll('.persona-bar').forEach(bar => {
  bar.querySelectorAll('.p-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.p-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

// =============================================
// ヒーローカード更新
// =============================================
function updateHero(game) {
  const titleEl  = document.getElementById('hero-title');
  const reasonEl = document.getElementById('hero-reason');
  const tagsEl   = document.getElementById('hero-tags');
  if (titleEl)  titleEl.innerHTML  = game.title;
  if (reasonEl) reasonEl.textContent = game.reason;
  if (tagsEl)   tagsEl.innerHTML   = game.tags.map(t => `<span class="h-tag">${t}</span>`).join('');
}

// ランダムボタン（スマホ・PC共通）
function randomGame() {
  heroIdx = (heroIdx + 1) % GAMES.length;
  updateHero(GAMES[heroIdx]);
}
document.getElementById('rand-btn')?.addEventListener('click', randomGame);
document.getElementById('rand-btn-pc')?.addEventListener('click', randomGame);

// スキップボタン
document.getElementById('skip-btn')?.addEventListener('click', () => {
  heroIdx = (heroIdx + 1) % GAMES.length;
  updateHero(GAMES[heroIdx]);
  const btn = document.getElementById('skip-btn');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="act-icon">✓</span><span>スキップ済み</span><span class="act-sub">次の候補へ</span>';
  setTimeout(() => { btn.innerHTML = orig; }, 1200);
});

// 今すぐプレイボタン
document.getElementById('play-btn')?.addEventListener('click', () => {
  const btn = document.getElementById('play-btn');
  const orig = btn.innerHTML;
  const origBg = btn.style.background;
  btn.innerHTML = '<span class="act-icon">🎮</span><span>楽しんでね！</span><span class="act-sub">よいゲームライフを</span>';
  btn.style.background = '#059669';
  setTimeout(() => {
    btn.innerHTML = orig;
    btn.style.background = origBg;
  }, 2000);
});

// =============================================
// チャット送信
// =============================================
function setupChat(inputId, sendId, msgsId) {
  const input = document.getElementById(inputId);
  const send  = document.getElementById(sendId);
  const msgs  = document.getElementById(msgsId);
  if (!input || !send || !msgs) return;

  function sendMsg() {
    const text = input.value.trim();
    if (!text) return;

    // ユーザーバブル追加
    const userBubble = document.createElement('div');
    userBubble.className = 'msg msg-user';
    userBubble.style.fontSize = '11px';
    userBubble.textContent = text;
    msgs.appendChild(userBubble);
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    // AI返答（0.7秒後）
    setTimeout(() => {
      const aiBubble = document.createElement('div');
      aiBubble.className = 'msg msg-ai';
      aiBubble.style.fontSize = '11px';
      aiBubble.textContent = AI_RESPONSES[resIdx % AI_RESPONSES.length];
      resIdx++;
      msgs.appendChild(aiBubble);
      msgs.scrollTop = msgs.scrollHeight;
    }, 700);
  }

  send.addEventListener('click', sendMsg);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
}

// クイックリプライチップ（おすすめを input に入れて送信）
function quickReply(btn, inputId, sendId, msgsId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = btn.textContent;
    document.getElementById(sendId)?.click();
  }
}

// チャット初期化（3箇所）
setupChat('mini-chat-input', 'mini-chat-send', 'chat-mini-msgs');
setupChat('chat-input',      'chat-send',      'chat-full-msgs');
setupChat('pc-chat-input',   'pc-chat-send',   'pc-chat-msgs');
