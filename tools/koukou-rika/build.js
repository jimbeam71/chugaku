// 高校理科サイトを作る。使い方: node tools/koukou-rika/build.js
// 単元を足すとき: kagaku-kiso/ にデータファイル（mol.js と同じ形）を置き、下の KAGAKU_KISO に1行足して実行。
var fs = require('fs'), path = require('path');
var OUT = path.join(__dirname, '..', '..', 'public', 'koukou-rika');

// 化学基礎の単元（上から順に表示）。file があれば公開済み、なければ「じゅんびちゅう」。
var KAGAKU_KISO = [
  { title: '物質量と化学反応式', sub: '原子量・mol計算・反応式のつくり方・量の計算', file: 'mol' },
  { title: '酸と塩基の反応', sub: '酸・塩基の性質、pH、中和反応、中和滴定', file: 'sanenki' }
  // ここに足す例： { title: '酸化還元反応', sub: '…', file: 'sankakangen' },
];
// 今後追加予定（表示だけ）。作ったら上の KAGAKU_KISO に移す。
var COMING = ['物質の構成と元素', '原子の構造と周期表', '化学結合', '酸化還元反応'];

var tpl = fs.readFileSync(path.join(__dirname, 'unit.template.html'), 'utf8');
fs.mkdirSync(path.join(OUT, 'kagaku-kiso'), { recursive: true });

KAGAKU_KISO.forEach(function (u) {
  if (!u.file) return;
  var data = require('./kagaku-kiso/' + u.file + '.js');
  var json = JSON.stringify(data).replace(/</g, '\\u003c');
  var html = tpl.replace('{{TITLE}}', function () { return data.title; }).replace('{{DATA}}', function () { return json; });
  fs.writeFileSync(path.join(OUT, 'kagaku-kiso', u.file + '.html'), html);
  var n = 0; data.steps.forEach(function (s) { n += s.qs.length; });
  u.count = n;
  console.log('built kagaku-kiso/' + u.file + '.html  (' + n + '問)');
});

var cards = KAGAKU_KISO.map(function (u) {
  return u.file
    ? '<a class="unit" href="kagaku-kiso/' + u.file + '.html"><span class="ut">' + u.title + '</span><span class="us">' + u.sub + '</span><span class="uc">' + u.count + '問 →</span></a>'
    : '';
}).join('') + COMING.map(function (n) { return '<div class="unit soon"><span class="ut">' + n + '</span><span class="us">じゅんびちゅう</span></div>'; }).join('');

var top = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>高校理科</title>' +
'<link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet"><style>' +
':root{--bg:#f1f6f4;--grid:rgba(48,120,110,.11);--card:#fff;--fg:#1d2a35;--muted:#55677a;--line:#d3dfe1;--ink:#1f6f7a;--font-head:"Zen Maru Gothic","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;--font-body:"BIZ UDPGothic","Hiragino Sans","Yu Gothic","Meiryo",sans-serif}' +
'@media (prefers-color-scheme:dark){:root{--bg:#121a21;--grid:rgba(150,205,215,.07);--card:#1b2630;--fg:#e8eef3;--muted:#9fb2c1;--line:#2d3d4a;--ink:#7fd0d8;color-scheme:dark}}' +
'*{box-sizing:border-box}body{margin:0;background-color:var(--bg);color:var(--fg);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:24px 24px;font-family:var(--font-body);font-size:17px;line-height:1.75;padding:20px 16px 56px}' +
'main{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:16px}h1,h2{font-family:var(--font-head);margin:0;line-height:1.35}h1{font-size:1.8rem}h2{font-size:1.25rem}p{margin:0}' +
'.kicker{font-family:var(--font-head);font-weight:700;font-size:.85rem;letter-spacing:.12em;color:var(--muted)}.lead{color:var(--muted);margin-top:6px}' +
'.units{display:flex;flex-direction:column;gap:10px}.unit{display:flex;flex-direction:column;gap:2px;padding:14px 16px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--fg);text-decoration:none}' +
'a.unit:hover{border-color:var(--ink)}.ut{font:700 1.1rem var(--font-head)}.us{font-size:.85rem;color:var(--muted)}.uc{font:700 .95rem var(--font-head);color:var(--ink);align-self:flex-end}.soon{opacity:.6;border-style:dashed}</style></head><body><main>' +
'<header><p class="kicker">高校理科</p><h1>高校理科 自習サイト</h1><p class="lead">1問ずつ、答えたあとに「なぜそうなるか」が出ます。まちがえた選択肢の理由も見られます。</p></header>' +
'<section><h2>化学基礎</h2><div class="units" style="margin-top:10px">' + cards + '</div></section>' +
'</main></body></html>';
fs.writeFileSync(path.join(OUT, 'index.html'), top);
console.log('built index.html');
