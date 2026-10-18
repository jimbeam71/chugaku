// 中学トップ・教科トップを作る: node tools/build.js  -> public/*.html
// カードの追加・直しは、このファイルの SUBJECTS / TOP を直して、もう一度実行する。
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'public');

const CSS = `
  /* layout: 1列の読み物。教科・サイトのカードを縦に並べ、広い画面では横並び。 */
  :root {
    --bg: #f6f5f1; --surface: #ffffff; --surface-2: #ecebe5;
    --fg: #23272d; --muted: #646b75; --line: #dcdad2;
    --rekishi: #a6502d; --rekishi-soft: #f6e6dc;
    --chiri: #2f6fb0; --chiri-soft: #e3eef9;
    --koumin: #3f7d34; --koumin-soft: #e5f1de;
    --rika: #1f7f86; --rika-soft: #e0f1f2;
    --shakai: #a6502d; --shakai-soft: #f6e6dc;
    --suugaku: #4a57b0; --suugaku-soft: #e6e8f8;
    --kokugo: #b04a63; --kokugo-soft: #f8e5ea;
    --eigo: #9a7418; --eigo-soft: #f5ecd3;
    --on-color: #ffffff;
    --font-display: "Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif;
    --font-body: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #17191c; --surface: #212429; --surface-2: #2b2f35;
      --fg: #e8e9eb; --muted: #a2a8b1; --line: #373c44;
      --rekishi: #e0976f; --rekishi-soft: #3a2a21;
      --chiri: #7db4e8; --chiri-soft: #1f2d3d;
      --koumin: #8cc971; --koumin-soft: #243420;
      --rika: #5fc4cb; --rika-soft: #1d3436;
      --shakai: #e0976f; --shakai-soft: #3a2a21;
      --suugaku: #9aa5f2; --suugaku-soft: #262a45;
      --kokugo: #e58aa0; --kokugo-soft: #3d242b;
      --eigo: #e0be5c; --eigo-soft: #3a3320;
      --on-color: #17191c; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #17191c; --surface: #212429; --surface-2: #2b2f35;
    --fg: #e8e9eb; --muted: #a2a8b1; --line: #373c44;
    --rekishi: #e0976f; --rekishi-soft: #3a2a21;
    --chiri: #7db4e8; --chiri-soft: #1f2d3d;
    --koumin: #8cc971; --koumin-soft: #243420;
    --rika: #5fc4cb; --rika-soft: #1d3436;
    --shakai: #e0976f; --shakai-soft: #3a2a21;
    --suugaku: #9aa5f2; --suugaku-soft: #262a45;
    --kokugo: #e58aa0; --kokugo-soft: #3d242b;
    --eigo: #e0be5c; --eigo-soft: #3a3320;
    --on-color: #17191c; color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font-body); font-size: 16px; line-height: 1.8; padding-inline: 16px; padding-block: 28px 56px; }
  .wrap { max-width: 880px; margin-inline: auto; display: flex; flex-direction: column; gap: 34px; }
  header { display: flex; flex-direction: column; gap: 10px; }
  .eyebrow { font-family: var(--font-display); font-weight: 700; font-size: .82rem; letter-spacing: .12em; color: var(--muted); margin: 0; }
  h1 { font-family: var(--font-display); font-weight: 900; font-size: clamp(1.9rem, 6vw, 2.7rem); line-height: 1.3; margin: 0; text-wrap: balance; }
  .lead { margin: 0; max-width: 34em; color: var(--muted); }
  .pts { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 0; padding: 0; list-style: none; }
  .pts li { font-size: .84rem; font-weight: 700; background: var(--surface-2); border-radius: 999px; padding: 3px 12px; }
  h2 { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; margin: 0 0 14px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  h2 small { font-size: .82rem; font-weight: 500; color: var(--muted); font-family: var(--font-body); }
  .crumb { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; font-family: var(--font-display); font-weight: 700; font-size: .95rem; }
  .crumb a { color: var(--c, var(--fg)); text-decoration: none; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; min-height: 40px; display: inline-flex; align-items: center; }
  .crumb a:hover { border-color: var(--c, var(--fg)); }
  .crumb a:focus-visible, .back:focus-visible { outline: 3px solid var(--c, var(--fg)); outline-offset: 2px; }
  .crumb span { color: var(--muted); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
  .card { display: flex; flex-direction: column; gap: 12px; min-width: 0; text-decoration: none; color: inherit; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; transition: transform .15s, border-color .15s; }
  a.card:hover { transform: translateY(-2px); border-color: var(--c); }
  a.card:focus-visible { outline: 3px solid var(--c); outline-offset: 2px; }
  .card.off { background: var(--surface-2); border-style: dashed; }
  .card.off .tile { background: var(--line); color: var(--muted); }
  .top { display: flex; align-items: center; gap: 12px; }
  .tile { flex: none; width: 52px; height: 52px; border-radius: 12px; background: var(--c); color: var(--on-color); display: grid; place-items: center; font-family: var(--font-display); font-weight: 900; font-size: 1.5rem; }
  .name { font-family: var(--font-display); font-weight: 900; font-size: 1.3rem; line-height: 1.3; }
  .count { font-size: .84rem; color: var(--muted); }
  .desc { margin: 0; font-size: .94rem; line-height: 1.75; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
  .tags li { font-size: .78rem; font-weight: 700; color: var(--c); background: var(--cs); border-radius: 6px; padding: 1px 8px; }
  .go { margin-top: auto; font-family: var(--font-display); font-weight: 700; color: var(--c); }
  .soon-tag { margin-top: auto; font-family: var(--font-display); font-weight: 700; color: var(--muted); }
  .rekishi { --c: var(--rekishi); --cs: var(--rekishi-soft); }
  .chiri { --c: var(--chiri); --cs: var(--chiri-soft); }
  .koumin { --c: var(--koumin); --cs: var(--koumin-soft); }
  .rika { --c: var(--rika); --cs: var(--rika-soft); }
  .shakai { --c: var(--shakai); --cs: var(--shakai-soft); }
  .suugaku { --c: var(--suugaku); --cs: var(--suugaku-soft); }
  .kokugo { --c: var(--kokugo); --cs: var(--kokugo-soft); }
  .eigo { --c: var(--eigo); --cs: var(--eigo-soft); }
  .back { align-self: flex-start; font-family: var(--font-display); font-weight: 700; color: var(--c, var(--fg)); text-decoration: none; padding: 8px 4px; min-height: 44px; display: inline-flex; align-items: center; }
  .howto { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 18px 18px 6px; }
  .howto ol { margin: 0 0 12px; padding-left: 1.4em; display: flex; flex-direction: column; gap: 8px; }
  .howto li::marker { font-weight: 700; color: var(--muted); }
  .toc { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 6px 18px; margin: 0; list-style: none; }
  .toc li { padding: 14px 0; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 4px; }
  .toc li:first-child { border-top: 0; }
  .toc .lv { font-family: var(--font-display); font-weight: 900; font-size: 1.05rem; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .toc .lv a { color: var(--c); text-decoration: none; }
  .toc .lv a:hover { text-decoration: underline; }
  .toc .st { font-size: .74rem; font-weight: 700; border-radius: 6px; padding: 1px 8px; background: var(--cs); color: var(--c); }
  .toc .st.plan { background: var(--surface-2); color: var(--muted); border: 1px dashed var(--line); }
  .toc .units { margin: 0; font-size: .9rem; line-height: 1.7; color: var(--fg); }
  .toc li.plan .lv { color: var(--muted); }
  footer { color: var(--muted); font-size: .84rem; }
  @media (prefers-reduced-motion: reduce) { .card { transition: none; } }
`;

const card = c => {
  const inner =
    '<div class="top"><span class="tile" aria-hidden="true">' + c.tile + '</span><div><div class="name">' + c.name + '</div><div class="count">' + c.count + '</div></div></div>' +
    '<p class="desc">' + c.desc + '</p>' +
    (c.tags ? '<ul class="tags">' + c.tags.map(t => '<li>' + t + '</li>').join('') + '</ul>' : '') +
    (c.href ? '<span class="go">' + c.go + ' →</span>' : '<span class="soon-tag">準備中</span>');
  return c.href
    ? '<a class="card ' + c.cls + '" href="' + c.href + '">' + inner + '</a>'
    : '<div class="card off ' + c.cls + '">' + inner + '</div>';
};
const W = s => 'https://' + s + '.senta1111.workers.dev/';

/* ---- 教科ごとのカード ---- */
const SUBJECTS = {
  shakai: {
    file: 'shakai.html', cls: 'shakai', title: '社会', lead: '歴史・地理・公民から、好きなものを選べます。どれから始めてもOKです。',
    cards: [
      { cls: 'rekishi', tile: '歴', name: '歴史', count: '全29話＋復習＋総復習', desc: '縄文時代から現代まで、時代の流れをひとつながりで。年号の丸暗記より、「なぜそうなったか」を大事にします。', tags: ['時代の流れ', '復習4回'], href: W('chugaku-rekishi'), go: '歴史をひらく' },
      { cls: 'chiri', tile: '地', name: '地理', count: '全27話＋復習＋総復習', desc: '世界の国々から日本の各地方まで。47都道府県の位置や県庁所在地は、地図をタップして覚えられます。', tags: ['地図でおぼえる', '復習4回'], href: W('chugaku-chiri'), go: '地理をひらく' },
      { cls: 'koumin', tile: '公', name: '公民', count: '全24話＋復習＋総復習', desc: '選挙、税金、契約、仕事、年金。大人になってからも役立つ内容です。各話に記述問題の「上位ねらい」つき。', tags: ['記述対策', '復習3回'], href: W('chugaku-koumin'), go: '公民をひらく' },
      { cls: 'chiri', tile: '記', name: '社会 しあげ（記述式）', count: '余裕があれば記述式に挑戦！　全48問', desc: '歴史・地理・公民の「理由を書く問題」。書いた答えをその場でチェックして、模範解答と見くらべられます。', tags: ['記述式', '自動チェック'], href: W('chugaku-shakai-kijutsu'), go: '記述式にちょうせんする' }
    ]
  },
  rika: {
    file: 'rika.html', cls: 'rika', title: '理科', lead: 'レベル0から、じゅんばんに進められます。記述式のしあげもあります。',
    cards: [
      { cls: 'rika', tile: '理', name: '理科 レベル0', count: 'ひきょうな裏技 34本＋全問チャレンジ', desc: '勉強が苦手でも点をひろえる、答えの決め打ちと語呂合わせ。図とコントで覚えて、さいごはランダムの全問チャレンジ。', tags: ['決め打ち', '語呂合わせ'], href: W('chugaku-rika0'), go: '理科レベル0をひらく' },
      { cls: 'rika', tile: '理', name: '理科 レベル1', count: '全20話＋復習＋総復習', desc: '生物・化学・物理・地学を、基礎のことばから1話ずつ。図とクイズで、テストによく出る用語をおさえます。', tags: ['基礎のことば', '復習3回'], href: W('chugaku-rika1'), go: '理科レベル1をひらく' },
      { cls: 'rika', tile: '理', name: '理科 レベル2', count: '全20話＋復習＋総復習', desc: 'テストに出る定番の基本問題を、1話ずつ。細胞・分解・音・化石・血液・回路・天体など、図とクイズでしっかり練習します。', tags: ['定番の基本問題', '復習3回'], href: W('chugaku-rika2'), go: '理科レベル2をひらく' },
      { cls: 'rika', tile: '理', name: '理科 レベル3', count: '全16話＋復習＋総復習', desc: '理科は暗記で点が取れます。実験の結果や式を丸ごと覚え、計算は1回だけ。順番を並べかえる問題も出ます。', tags: ['暗記とやさしい計算', '復習3回'], href: W('chugaku-rika3'), go: '理科レベル3をひらく' },
      { cls: 'rika', tile: '理', name: '理科 レベル4', count: '全12話＋復習＋総復習', desc: '上位をねらう人の編。遺伝・イオン・中和の計算、電磁誘導・陰極線、湿度・露点、地震の計算など、入試レベルの問題に型で挑戦します。', tags: ['上位ねらい（入試レベル）', '復習3回'], href: W('chugaku-rika4'), go: '理科レベル4をひらく' },
      { cls: 'rika', tile: '理', name: '理科 しあげ（記述式）', count: '余裕があれば記述式に挑戦！　全48問', desc: '理由を文章で書く問題。書いた答えをその場でチェックして、模範解答と見くらべられます。定番32問と、表やグラフから書く16問。', tags: ['記述式', '自動チェック'], href: W('chugaku-rika5'), go: '記述式にちょうせんする' }
    ]
  },
  suugaku: {
    file: 'suugaku.html', cls: 'suugaku', title: '数学', lead: '小学校のやりなおし（レベル0）から、マイナスの数や通分、かけ算・わり算、文字の入り口（レベル2）、文字式と方程式（レベル3）、比例・反比例とグラフ（レベル4）まで。つまずいたところから、やりなおせます。',
    toc: [
      { lv: 'レベル0　小学校のやりなおし', href: W('chugaku-suugaku0'), units: '倍数と約数 ／ 小数と分数 ／ 分数の計算 ／ 割合・比・速さ' },
      { lv: 'レベル1　正負の数・通分', href: W('chugaku-suugaku'), units: '数直線とマイナス ／ 足し算・引き算 ／ かっこのルール ／ 分数と通分' },
      { lv: 'レベル2　かけ算・わり算と文字の入り口', href: W('chugaku-suugaku2'), units: '負の数のかけ算・わり算 ／ 累乗と計算の順序 ／ ＝の意味と逆算 ／ 文字式のはじめ' },
      { lv: 'レベル3　文字式と方程式', href: W('chugaku-suugaku3'), units: '文字式のきまり ／ 式の計算 ／ 一次方程式 ／ 方程式の文章題' },
      { lv: 'レベル4　比例・反比例とグラフ', href: W('chugaku-suugaku4'), units: '座標 ／ 比例 ／ 反比例 ／ グラフの読み書き' },
      { lv: 'レベル5　平面図形（中1）', href: W('chugaku-suugaku5'), units: '単位換算 ／ 角度と内角の和 ／ 面積 ／ 円とおうぎ形 ／ 作図 ／ 図形の移動' },
      { lv: 'レベル6　空間図形（中1）', href: W('chugaku-suugaku6'), units: '立体の名前と展開図 ／ 直線と平面の位置 ／ 表面積 ／ 体積 ／ 球 ／ 回転体' },
      { lv: 'レベル7　データの活用（中1・中2）', href: W('chugaku-suugaku7'), units: '代表値（平均・中央値・最頻値） ／ 度数分布とヒストグラム ／ 相対度数 ／ 四分位数と箱ひげ図' },
      { lv: 'レベル8　式の計算と連立方程式（中2）', href: W('chugaku-suugaku8'), units: '単項式・多項式の計算 ／ 文字式の利用・等式の変形 ／ 連立方程式 ／ 連立方程式の文章題' },
      { lv: 'レベル9　一次関数（中2）', href: W('chugaku-suugaku9'), units: '変化の割合 ／ 一次関数の式とグラフ ／ 式の求め方 ／ 方程式とグラフ ／ 利用' },
      { lv: 'レベル10　図形の性質と確率（中2）', href: W('chugaku-suugaku10'), units: '平行線と角 ／ 多角形の角 ／ 合同 ／ 証明のかたち ／ 二等辺三角形・平行四辺形 ／ 確率' },
      { lv: 'レベル11　展開・因数分解・平方根（中3）', href: W('chugaku-suugaku11'), units: '多項式の展開 ／ 因数分解 ／ 平方根 ／ 根号をふくむ計算' },
      { lv: 'レベル12　二次方程式と関数 y＝ax²（中3）', href: W('chugaku-suugaku12'), units: '二次方程式の解き方 ／ 解の公式 ／ 関数 y＝ax² ／ 変化の割合と利用' },
      { lv: 'レベル13　相似・円周角・三平方・標本調査（中3）', href: W('chugaku-suugaku13'), units: '相似な図形 ／ 平行線と比 ／ 円周角 ／ 三平方の定理 ／ 標本調査' }
    ],
    cards: [
      { cls: 'suugaku', tile: '数', name: '数学 レベル0', count: '小学校のやりなおし　全22ステップ', desc: '約数・倍数、小数と分数（0.1＝1/10 を反射で）、分数のかけ算・わり算、割合・比・速さ。中学数学の土台を、1ステップ6問前後で練習します。', tags: ['約数と倍数', '小数と分数', '分数の計算', '割合・速さ'], href: W('chugaku-suugaku0'), go: '数学レベル0をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル1', count: '正負の数・分数と通分　全14ステップ', desc: '数直線と図で、マイナスの意味から戻ります。かっこをはずすルールや、答えの書き方まで、1ステップ6問前後で練習します。', tags: ['数直線', 'かっこのルール', '通分'], href: W('chugaku-suugaku'), go: '数学レベル1をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル2', count: 'かけ算・わり算・累乗・文字の入り口　全14ステップ', desc: '負の数のかけ算・わり算（符号のルール）、累乗と計算の順序、＝の意味と逆算、文字式のはじめ。1ステップ6問前後で練習します。', tags: ['符号のルール', '累乗', '計算の順序', '文字の入り口'], href: W('chugaku-suugaku2'), go: '数学レベル2をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル3', count: '文字式・式の計算・一次方程式　全16ステップ', desc: '×や÷のはぶき方、同類項、かっこのはずし方から、移項、分数の方程式、文章題まで。1ステップ6問前後で練習します。', tags: ['文字式', '式の計算', '一次方程式', '文章題'], href: W('chugaku-suugaku3'), go: '数学レベル3をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル4', count: '座標・比例・反比例とグラフ　全13ステップ', desc: '座標と象限から、比例と反比例の式・値・グラフ、そして利用の問題まで。座標平面の図を見ながら、1ステップ6問前後で練習します。', tags: ['座標', '比例', '反比例', 'グラフ'], href: W('chugaku-suugaku4'), go: '数学レベル4をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル5', count: '平面図形　全7ステップ', desc: '単位・角度・面積から、円とおうぎ形、作図と図形の移動まで。作図は図を見ながら、手順をおぼえます。', tags: ['角度', '面積', '円', '作図'], href: W('chugaku-suugaku5'), go: '数学レベル5をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル6', count: '空間図形　全7ステップ', desc: '立体の名前と展開図から、表面積・体積、球、回転体まで。立体の図を見ながら、公式をおぼえます。', tags: ['展開図', '表面積', '体積', '球'], href: W('chugaku-suugaku6'), go: '数学レベル6をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル7', count: 'データの活用　全7ステップ', desc: '平均・中央値から、度数分布表、ヒストグラム、箱ひげ図まで。ヒストグラムと箱ひげ図を結びつける問題もあります。', tags: ['代表値', 'ヒストグラム', '箱ひげ図'], href: W('chugaku-suugaku7'), go: '数学レベル7をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル8', count: '式の計算と連立方程式　全7ステップ', desc: '同類項・単項式の計算から、連立方程式（加減法・代入法）と文章題まで。ミスしやすいところを、ひとつずつたしかめます。', tags: ['式の計算', '連立方程式', '文章題'], href: W('chugaku-suugaku8'), go: '数学レベル8をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル9', count: '一次関数　全5ステップ', desc: '変化の割合から、グラフ、式の求め方、2直線の交点、利用の問題まで。座標平面の図を見ながら、身につけます。', tags: ['一次関数', 'グラフ', '変化の割合'], href: W('chugaku-suugaku9'), go: '数学レベル9をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル10', count: '図形の性質と確率　全7ステップ', desc: '平行線と角、多角形の角、合同条件から、証明のかたち、二等辺三角形・平行四辺形、確率まで。図を見て条件をたしかめます。', tags: ['平行線と角','合同・証明','確率'], href: W('chugaku-suugaku10'), go: '数学レベル10をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル11', count: '展開・因数分解・平方根　全6ステップ', desc: '多項式の展開と乗法公式、因数分解から、平方根の意味、根号の計算、有理化まで。公式をつかって計算します。', tags: ['展開・因数分解','平方根','有理化'], href: W('chugaku-suugaku11'), go: '数学レベル11をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル12', count: '二次方程式と関数 y＝ax²　全6ステップ', desc: '因数分解・平方根・解の公式による二次方程式と、放物線のグラフ、変化の割合、利用の問題まで。', tags: ['二次方程式','解の公式','y＝ax²'], href: W('chugaku-suugaku12'), go: '数学レベル12をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 レベル13', count: '相似・円周角・三平方・標本調査　全7ステップ', desc: '相似と平行線と比、面積比・体積比から、円周角、三平方の定理、標本調査まで。図を見ながら進めます。', tags: ['相似','円周角・三平方','標本調査'], href: W('chugaku-suugaku13'), go: '数学レベル13をひらく' },
      { cls: 'suugaku', tile: '数', name: '数学 公式テスト', count: '中1〜中3の公式まとめ　全10ステップ', desc: '計算・関数・図形・立体・データの公式を、まとめて見て、テストで確認します。テスト前の総ざらいに。', tags: ['公式まとめ','テスト','総ざらい'], href: W('chugaku-suugaku-koushiki'), go: '数学の公式テストをひらく' }
    ]
  }
};

/* ---- 中学トップのカード（5教科） ---- */
const TOP = [
  { cls: 'kokugo', tile: '国', name: '国語', count: '準備中', desc: '説明文・論説文の読み方など、じゅんびしています。', tags: null, href: null },
  { cls: 'suugaku', tile: '数', name: '数学', count: 'レベル0〜13（小学校のやりなおし・正負の数・方程式・比例反比例・平面図形・空間図形・データの活用・式の計算と連立方程式・一次関数・図形の性質と確率・展開因数分解平方根・二次方程式と関数・相似円周角三平方標本調査）', desc: '約数・小数・分数から、マイナスや通分、方程式、比例・反比例まで。つまずいたところから、図でやりなおします。', tags: ['やりなおし'], href: 'suugaku.html', go: '数学をひらく' },
  { cls: 'eigo', tile: '英', name: '英語', count: '準備中', desc: '単語と文の読み方から、じゅんびしています。', tags: null, href: null },
  { cls: 'rika', tile: '理', name: '理科', count: 'レベル0〜4 ＋ しあげ（記述式）', desc: 'ひきょうな裏技から入試レベルまで。レベルをじゅんばんに進められます。', tags: ['全6サイト', '記述式あり'], href: 'rika.html', go: '理科をひらく' },
  { cls: 'shakai', tile: '社', name: '社会', count: '歴史・地理・公民 ＋ しあげ（記述式）', desc: '時代の流れ、地図、くらしのしくみ。3つの教科と、理由を書く記述式があります。', tags: ['全4サイト', '記述式あり'], href: 'shakai.html', go: '社会をひらく' }
];

const FONT = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap">';
const page = (title, body) => '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>' + title + '</title>\n' + FONT + '\n<style>' + CSS + '</style>\n</head>\n<body>\n<div class="wrap">\n' + body + '\n</div>\n</body>\n</html>\n';
const NOTE = '<footer>やった記録は、この端末のブラウザにだけ保存されます。別の端末では引き継がれません。</footer>';

/* 中学トップ */
const topBody =
  '  <header>\n    <p class="eyebrow">無料・登録なし・スマホでOK</p>\n    <h1>中学自習サイト</h1>\n    <p class="lead">学校に行けない日も、授業がわからなくなった日も。1話ずつ、やさしい言葉で、ひとりで進められる教材です。平均点をめざす人も、その先をねらう人も使えます。</p>\n    <ul class="pts">\n      <li>音読と4択で定着</li>\n      <li>各話に「裏話」つき</li>\n      <li>記録はこの端末に保存</li>\n    </ul>\n  </header>\n\n' +
  '  <section aria-labelledby="kyoka">\n    <h2 id="kyoka">教科をえらぶ <small>どの教科から始めてもOKです</small></h2>\n    <div class="grid">\n' + TOP.map(c => '      ' + card(c)).join('\n') + '\n    </div>\n  </section>\n\n' +
  '  <section class="howto" aria-labelledby="how">\n    <h2 id="how">つかいかた</h2>\n    <ol>\n      <li>教科をえらんで、「1話」から順に進めます。</li>\n      <li>本文を声に出して3回読み、問題をときます。まちがえても大丈夫です。</li>\n      <li>同じ話を、何も見ずに全問正解できるまで、くり返します。目安は5回です。</li>\n    </ol>\n  </section>\n\n  ' + NOTE;
fs.writeFileSync(path.join(OUT, 'index.html'), page('中学自習サイト', topBody));

/* 教科トップ */
Object.keys(SUBJECTS).forEach(k => {
  const S = SUBJECTS[k];
  const body =
    '  <header class="' + S.cls + '">\n    <p class="crumb"><a href="index.html">中学トップ</a><span aria-hidden="true">›</span><span>' + S.title + '</span></p>\n    <h1>' + S.title + '</h1>\n    <p class="lead">' + S.lead + '</p>\n  </header>\n\n' +
    (S.toc ? '  <section aria-labelledby="toc">\n    <h2 id="toc">もくじ <small>' + S.title + 'の全体のながれ（予定をふくむ）</small></h2>\n    <ol class="toc">\n' + S.toc.map(t => '      <li class="' + (t.href ? '' : 'plan') + '"><div class="lv">' + (t.href ? '<a href="' + t.href + '">' + t.lv + '</a><span class="st">公開中</span>' : t.lv + '<span class="st plan">じゅんびちゅう</span>') + '</div><p class="units">' + t.units + '</p></li>').join('\n') + '\n    </ol>\n  </section>\n\n' : '') +
    '  <section aria-label="' + S.title + 'のサイト">\n    <div class="grid">\n' + S.cards.map(c => '      ' + card(c)).join('\n') + '\n    </div>\n  </section>\n\n' +
    '  <a class="back ' + S.cls + '" href="index.html">← 中学トップへもどる</a>\n\n  ' + NOTE;
  fs.writeFileSync(path.join(OUT, S.file), page('中学' + S.title, body));
});
console.log('作成:', ['index.html'].concat(Object.keys(SUBJECTS).map(k => SUBJECTS[k].file)).join(', '));
