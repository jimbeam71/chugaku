// レベル11の問題データ生成: node gen11.js -> src/data.js
// 手書き10問（src/handmade.js）＋ 計算で作る問題。誤答は「よくあるまちがい」から作り、理由も一緒に付ける。
const fs = require('fs'), path = require('path');

let seed = 20261020;
function R() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const MINUS = '−';
const lab = v => (v < 0 ? MINUS + (-v) : String(v));
const T = v => String(v);
const fr = (n, d) => '\\dfrac{' + n + '}{' + d + '}';
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function lcmBrute(a, b) { for (let x = Math.max(a, b); ; x++) if (x % a === 0 && x % b === 0) return x; }
const key = v => (v == null ? 'null:' + Math.random() : Array.isArray(v) ? v.map(x => x.toFixed(9)).join(',') : v.toFixed(9));

/* 問題を組み立てる。truth={v,tex}, cands=[{v,tex,why}]（先のものほど優先） */
function build(o) {
  const unit = o.unit || '';
  const wrap = (tex, raw) => (raw ? tex : '$' + tex + '$' + unit);
  const seen = [o.truth.tex], seenV = [key(o.truth.v)], wrongs = [];
  for (const c of o.cands) {
    if (wrongs.length >= 3) break;
    if (seen.includes(c.tex)) continue;
    if (!c.same && seenV.includes(key(c.v))) continue;
    seen.push(c.tex); seenV.push(key(c.v)); wrongs.push(c);
  }
  if (wrongs.length < 3) throw new Error(o.id + ': 誤答の候補が足りない');
  const all = shuffle([{ t: wrap(o.truth.tex, o.truth.raw), v: o.truth.v, ok: true }].concat(wrongs.map(c => (c.same ? { t: wrap(c.tex, c.raw), v: c.v, why: c.why, same: true } : { t: wrap(c.tex, c.raw), v: c.v, why: c.why }))));
  const ans = all.findIndex(x => x.ok);
  all.forEach(x => delete x.ok);
  const q = { id: o.id, expr: o.expr, p: o.p, ch: all, ans, steps: o.steps, point: o.point };
  if (o.fig) q.fig = o.fig;
  if (o.figAfter) q.figAfter = o.figAfter;
  return q;
}

/* ---------- 共通の小物 ---------- */
const LT = a => a.join(',\\ ');                                  // 数のならび（TeX）
const dfmt = x => String(+x.toFixed(8));                         // 小数の表示
const divisors = n => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
const reduceF = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
const frT = (n, d) => (d === 1 ? String(n) : fr(n, d));           // 分母1なら整数で表示
const Fv = (n, d) => { const [a, b] = reduceF(n, d); return { v: n / d, tex: frT(a, b) }; };
const C = (n, d, why, same) => { const o = { v: n / d, tex: (n * d < 0 ? '-' : '') + frT(Math.abs(n), Math.abs(d)), why }; if (same) o.same = true; return o; };
const mixT = (w, n, d) => String(w) + fr(n, d);
function fracOfDec(x) { const s = Math.round(x * 10000); const g = gcd(s, 10000); return [s / g, 10000 / g]; }
const RAWQ = (id, p, truth, wrongs, steps, point, extra) => build(Object.assign({
  id, expr: '1', p, raw: true, truth: { v: 1, tex: truth, raw: true },
  cands: wrongs.map(([t, why]) => ({ v: null, raw: true, tex: t, why })), steps, point
}, extra || {}));
const lcmOf = (a, b) => a / gcd(a, b) * b;

/* ---------- 共通の小物（レベル11） ---------- */
const fp = n => (n < 0 ? '(' + n + ')' : String(n));       // かっこつきで表示
const sgnWord = s => (s < 0 ? 'マイナス' : 'プラス');
const cnt = a => a.filter(x => x < 0).length;


/* ---------- 文字式の道具 ---------- */
const D = s => (String(s).includes('$') || /[ぁ-んァ-ヶ一-龥]/.test(String(s)) ? s : '$' + s + '$');
// RQ: 4択（式が選択肢）。texはそのまま渡すと $…$ で包む
const RQ = (id, p, t, ws, steps, point, extra) => RAWQ(id, p, D(t), ws.map(([w, why]) => [D(w), why]), steps, point, extra);
// 1次式 a x + b を TeX に
const xt = (a, v) => (a === 1 ? v : a === -1 ? '-' + v : a + v);
const lin = (a, b, v) => { v = v || 'x'; if (a === 0) return String(b); let s = xt(a, v); if (b > 0) s += '+' + b; else if (b < 0) s += '-' + (-b); return s; };
const sgn = n => (n < 0 ? '-' + (-n) : '+' + n);
const num = n => String(n);
// 数値問題（答えがひとつの数）
const NQ = (id, p, t, ws, steps, point, unit) => build({ id, expr: String(t), p, truth: { v: t, tex: dfmt(t) }, cands: ws.map(([v, why]) => ({ v, tex: dfmt(v), why })), steps, point, unit });


/* ---------- 座標グラフの図（SVG） ---------- */
const GR = 6, GS = 22, GC = 150;
const gx = x => GC + GS * x, gy = y => GC - GS * y;
function graph(o) {
  o = o || {};
  const st = (s) => ' style="' + s + '"';
  let s = '<svg viewBox="0 0 300 300" role="img" aria-label="座標平面"' + st('width:100%;max-width:340px;height:auto;display:block;margin:8px auto') + '>';
  for (let i = -GR; i <= GR; i++) {
    if (i === 0) continue;
    s += '<line x1="' + gx(i) + '" y1="' + gy(-GR) + '" x2="' + gx(i) + '" y2="' + gy(GR) + '"' + st('stroke:var(--line);stroke-width:1') + '/>';
    s += '<line x1="' + gx(-GR) + '" y1="' + gy(i) + '" x2="' + gx(GR) + '" y2="' + gy(i) + '"' + st('stroke:var(--line);stroke-width:1') + '/>';
  }
  s += '<line x1="' + gx(-GR - .4) + '" y1="' + GC + '" x2="' + gx(GR + .4) + '" y2="' + GC + '"' + st('stroke:var(--fg);stroke-width:2') + '/>';
  s += '<line x1="' + GC + '" y1="' + gy(-GR - .4) + '" x2="' + GC + '" y2="' + gy(GR + .4) + '"' + st('stroke:var(--fg);stroke-width:2') + '/>';
  const tx = 'font:700 10px sans-serif;fill:var(--muted);text-anchor:middle';
  for (let i = -GR; i <= GR; i++) {
    if (i === 0) continue;
    s += '<text x="' + gx(i) + '" y="' + (GC + 13) + '"' + st(tx) + '>' + i + '</text>';
    s += '<text x="' + (GC - 9) + '" y="' + (gy(i) + 3.5) + '"' + st(tx) + '>' + i + '</text>';
  }
  s += '<text x="' + (GC - 8) + '" y="' + (GC + 13) + '"' + st(tx) + '>O</text>';
  s += '<text x="' + gx(GR + .4) + '" y="' + (GC + 24) + '"' + st('font:700 12px sans-serif;fill:var(--fg);text-anchor:end') + '>x</text>';
  s += '<text x="' + (GC + 10) + '" y="' + (gy(GR + .4) + 8) + '"' + st('font:700 12px sans-serif;fill:var(--fg)') + '>y</text>';
  (o.lines || []).forEach(a => {                       // y = a x
    const xm = Math.min(GR, GR / Math.abs(a));
    s += '<line x1="' + gx(-xm) + '" y1="' + gy(-a * xm) + '" x2="' + gx(xm) + '" y2="' + gy(a * xm) + '"' + st('stroke:var(--neg);stroke-width:2.5;stroke-linecap:round') + '/>';
  });
  (o.hyper || []).forEach(a => {                       // y = a / x
    [1, -1].forEach(sg => {
      let pts = [];
      for (let x = Math.abs(a) / GR; x <= GR + 1e-9; x += 0.05) pts.push(gx(sg * x).toFixed(1) + ',' + gy(a / (sg * x)).toFixed(1));
      s += '<polyline points="' + pts.join(' ') + '" fill="none"' + st('stroke:var(--neg);stroke-width:2.5;stroke-linecap:round') + '/>';
    });
  });
  (o.pts || []).forEach(p => {
    s += '<circle cx="' + gx(p.x) + '" cy="' + gy(p.y) + '" r="4.5"' + st('fill:var(--pos);stroke:var(--card);stroke-width:1.5') + '/>';
    if (p.l) s += '<text x="' + (gx(p.x) + 7) + '" y="' + (gy(p.y) - 6) + '"' + st('font:700 13px sans-serif;fill:var(--pos)') + '>' + p.l + '</text>';
  });
  return { type: 'svg', html: s + '</svg>' };
}
const ct = (x, y) => '(' + x + ',' + y + ')';
const rdc = (n, d) => { const g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return [n, d]; };
const slope = (n, d) => { [n, d] = rdc(n, d); return d === 1 ? (n === 1 ? '' : n === -1 ? '-' : String(n)) + 'x' : (n < 0 ? '-' : '') + '\\dfrac{' + Math.abs(n) + '}{' + d + '}x'; };
const yEq = (n, d) => 'y=' + slope(n, d);
const hyEq = a => 'y=' + (a < 0 ? '-' : '') + '\\dfrac{' + Math.abs(a) + '}{x}';
const QN = ['第1象限', '第2象限', '第3象限', '第4象限'];

const PI = n => (n === 1 ? '\\pi' : n + '\\pi');

const PU = (n, u) => '$' + PI(n) + '$ ' + u;
const S_ = s => ' style="' + s + '"';
const svgW = (h, inner) => '<svg viewBox="0 0 260 ' + h + '" role="img" aria-label="図"' + S_('width:100%;max-width:320px;height:auto;display:block;margin:8px auto') + '>' + inner + '</svg>';
const ln = (x1, y1, x2, y2, c, w, dash) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + S_('stroke:var(' + c + ');stroke-width:' + (w || 2) + ';stroke-linecap:round' + (dash ? ';stroke-dasharray:5 4' : '')) + '/>';
const tx = (x, y, t, a) => '<text x="' + x + '" y="' + y + '"' + S_('font:700 13px sans-serif;fill:var(--fg);text-anchor:' + (a || 'middle')) + '>' + t + '</text>';
const circ = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--card)"' + S_('stroke:var(--fg);stroke-width:2.5') + '/>';
const TT = s => '$' + s + '$';
const pf = terms => { let s = ''; terms.forEach(([c, v]) => { if (!c) return; const a = Math.abs(c); const body = v === '' ? String(a) : (a === 1 ? v : a + v); s += s === '' ? (c < 0 ? '-' : '') + body : (c < 0 ? '-' : '+') + body; }); return s || '0'; };
const P2 = (a, b, c) => pf([[a, 'x^2'], [b, 'x'], [c, '']]);
const fc = (a, b) => '(x' + sgn(a) + ')(x' + sgn(b) + ')';
const RTV = rows => '<table class="rtab">' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
const SQ = n => '\\sqrt{' + n + '}';
const cell = (x, y, w, h, t) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + S_('fill:var(--card);stroke:var(--fg);stroke-width:2') + '/>' + tx(x + w / 2, y + h / 2 + 5, t);
function figRect() {
  let s = cell(40, 20, 100, 80, 'x²') + cell(140, 20, 60, 80, '3x') + cell(40, 100, 100, 50, '2x') + cell(140, 100, 60, 50, '6');
  s += tx(90, 14, 'x') + tx(170, 14, '3') + tx(26, 64, 'x', 'end') + tx(26, 130, '2', 'end');
  return { type: 'svg', html: svgW(165, s) };
}
function figSq() {
  const s = '<rect x="80" y="20" width="100" height="100"' + S_('fill:var(--card);stroke:var(--neg);stroke-width:3') + '/>' + tx(130, 76, '面積 20') + tx(130, 140, '一辺 ＝ ？') + tx(194, 74, '？', 'start');
  return { type: 'svg', html: svgW(150, s) };
}

/* ===== パートA: 展開と因数分解 ===== */
function genTenkai() {
  return [
    RQ('te-1', '$3x(x+4)$ を展開すると？', P2(3, 12, 0), [[P2(3, 4, 0).replace('4x', '4'), '後ろの 4 にも $3x$ をかける。'], [P2(3, 0, 12), '$3x\\times4=12x$。$x$ が消えない。'], ['3x+12', '$3x\\times x=3x^2$。']], ['分配法則：$3x\\times x+3x\\times4$。', '$=3x^2+12x$。'], '単項式×多項式は、分配法則で、すべての項にかける。'),
    RQ('te-2', '$-2x(x-5)$ を展開すると？', P2(-2, 10, 0), [[P2(-2, -10, 0), '$-2x\\times(-5)=+10x$。マイナス×マイナスはプラス。'], [P2(2, 10, 0), '$-2x\\times x=-2x^2$。'], [P2(-2, 0, -5), '$-5$ にも $-2x$ をかける。']], ['$-2x\\times x=-2x^2$。', '$-2x\\times(-5)=+10x$。'], '符号に注意して、1項ずつかける。'),
    Object.assign(RQ('te-3', '$(x+2)(x+3)$ を展開すると？（図の面積の考え方）', P2(1, 5, 6), [[P2(1, 0, 6), '中の項 $2x+3x=5x$ を忘れている。'], [P2(1, 5, 5), '$2\\times3=6$。'], [P2(1, 6, 5), '$x$ の項は $3x+2x=5x$。']], ['$x^2+3x+2x+6$。', '$x$ の項をまとめて $x^2+5x+6$。'], '多項式×多項式は、すべての項どうしをかけて、同類項をまとめる。'), { fig: figRect() }),
    RQ('te-4', '$(x+4)(x-3)$ を展開すると？', P2(1, 1, -12), [[P2(1, -1, -12), '$x$ の項は $-3x+4x=+x$。'], [P2(1, 7, -12), '$4+3$ ではなく、$4+(-3)$。'], [P2(1, 1, 12), '$4\\times(-3)=-12$。']], ['$x^2-3x+4x-12$。', '$=x^2+x-12$。'], '同類項をまとめるときの符号に注意。'),
    RQ('te-5', '$(2x+1)(x+3)$ を展開すると？', P2(2, 7, 3), [[P2(2, 0, 3), '中の項を忘れている。'], [P2(2, 6, 3), '$x$ の項は $6x+x=7x$。'], [P2(2, 4, 3), '$x$ の項は、係数を足すのではなく、$2x\\times3+1\\times x$。']], ['$2x^2+6x+x+3$。', '$=2x^2+7x+3$。'], '$x$ の係数のかけ算を忘れずに。'),
    RQ('te-6', '$(x-2)(x-5)$ を展開すると？', P2(1, -7, 10), [[P2(1, -7, -10), '$(-2)\\times(-5)=+10$。'], [P2(1, 7, 10), '$x$ の項は $-5x-2x=-7x$。'], [P2(1, -3, 10), '$x$ の項は、$-5-2=-7$。']], ['$x^2-5x-2x+10$。', '$=x^2-7x+10$。'], 'マイナス×マイナスはプラス。'),
    RQ('te-7', '$2(x+3)-(x-1)$ を計算すると？', 'x+7', [['x+5', '$-(x-1)=-x+1$。$-1$ ではない。'], ['x+6', '$-(x-1)$ の $+1$ を忘れている。'], ['3x+7', '$2x-x=x$。']], ['$2x+6-x+1$。', '$=x+7$。'], 'マイナスのかっこは、すべての符号が変わる。')
  ];
}
function genKoushiki() {
  return [
    RQ('ko-1', '$(x+5)^2$ を展開すると？', P2(1, 10, 25), [[P2(1, 0, 25), '中の項 $2\\times5\\times x=10x$ を忘れている。'], [P2(1, 5, 25), '中の項は、$5$ の2倍。$10x$。'], [P2(1, 10, 10), '最後は $5^2=25$。']], ['$(a+b)^2=a^2+2ab+b^2$。', '$x^2+10x+25$。'], '乗法公式：$(a+b)^2=a^2+2ab+b^2$。'),
    RQ('ko-2', '$(x-3)^2$ を展開すると？', P2(1, -6, 9), [[P2(1, 0, -9), '$(x-3)^2$ は、$(x+3)(x-3)$ ではない。'], [P2(1, -6, -9), '最後の $b^2$ は、いつもプラス。'], [P2(1, -3, 9), '中の項は $-2\\times3x=-6x$。']], ['$(a-b)^2=a^2-2ab+b^2$。', '$x^2-6x+9$。'], '乗法公式：$(a-b)^2=a^2-2ab+b^2$。'),
    RQ('ko-3', '$(x+7)(x-7)$ を展開すると？', P2(1, 0, -49), [[P2(1, 0, 49), '$(a+b)(a-b)=a^2-b^2$。マイナス。'], [P2(1, -14, -49), '中の項は、きえる。'], [P2(1, -14, 49), 'それは、$(x-7)^2$ の展開。']], ['$(a+b)(a-b)=a^2-b^2$。', '$x^2-49$。'], '乗法公式：$(a+b)(a-b)=a^2-b^2$。'),
    RQ('ko-4', '$(2x+3)^2$ を展開すると？', '4x^2+12x+9', [['4x^2+9', '中の項 $2\\times2x\\times3=12x$ を忘れている。'], ['2x^2+12x+9', '$(2x)^2=4x^2$。'], ['4x^2+6x+9', '中の項は、$2\\times2x\\times3=12x$。']], ['$a=2x$、$b=3$。', '$(2x)^2+2\\times2x\\times3+3^2=4x^2+12x+9$。'], '$2x$ のかたまりを $a$ とみて、公式を使う。'),
    RQ('ko-5', '$(3x-1)(3x+1)$ を展開すると？', '9x^2-1', [['3x^2-1', '$(3x)^2=9x^2$。'], ['9x^2+1', '$(a+b)(a-b)=a^2-b^2$。マイナス。'], ['9x^2-6x+1', 'それは、$(3x-1)^2$ の展開。']], ['$a=3x$、$b=1$。', '$(3x)^2-1^2=9x^2-1$。'], '$(a+b)(a-b)=a^2-b^2$。'),
    NQ('ko-6', '乗法公式を使って、$99^2$ を計算すると？（$99=100-1$）', 9801, [[9999, '中の項 $-2\\times100\\times1=-200$ を忘れている。'], [10201, 'それは、$101^2$。'], [9799, '最後の $1^2$ は、プラスの 1。']], ['$(100-1)^2=100^2-2\\times100\\times1+1^2$。', '$=10000-200+1=9801$。'], '計算がらくになる数に分けて、公式を使う。'),
    NQ('ko-7', '$x=10$ のとき、$(x+3)(x-3)$ の値は？', 91, [[109, '$x^2-9$。$+9$ ではない。'], [100, '$-9$ を忘れている。'], [94, '$b^2=3^2=9$。6 ではない。']], ['$(x+3)(x-3)=x^2-9$。', '$100-9=91$。'], '展開してから、数をあてはめると、らく。')
  ];
}
function genBunkai() {
  return [
    RQ('bu-1', '$6x+12$ を因数分解すると？', '6(x+2)', [['6(x+12)', '12 も 6 でわる。$12\\div6=2$。'], ['3(2x+4)', 'まだ共通因数 2 が残っている。いちばん大きい 6 でくくる。'], ['2(3x+6)', 'まだ共通因数 3 が残っている。いちばん大きい 6 でくくる。']], ['共通因数は 6。', '$6(x+2)$。'], '共通因数は、いちばん大きいものでくくる。'),
    RQ('bu-2', '$x^2+5x$ を因数分解すると？', 'x(x+5)', [['x^2(x+5)', '展開すると $x^3+5x^2$。'], ['(x+5)^2', '展開すると $x^2+10x+25$。'], ['x(5x+1)', '展開すると $5x^2+x$。']], ['共通因数は $x$。', '$x(x+5)$。'], '共通因数でくくる。'),
    RQ('bu-3', '$x^2+7x+12$ を因数分解すると？', fc(3, 4), [[fc(2, 6), '足して 7、かけて 12 になる2数をさがす。$2+6=8$。'], [fc(1, 12), '足して 7 になる必要がある。$1+12=13$。'], [fc(-3, -4), '足して $+7$ になるのは、$+3$ と $+4$。']], ['かけて 12、足して 7 の2数は、3 と 4。', '$(x+3)(x+4)$。'], '$x^2+(a+b)x+ab=(x+a)(x+b)$。'),
    RQ('bu-4', '$x^2-x-6$ を因数分解すると？', fc(-3, 2), [[fc(3, -2), '足して $-1$。$3+(-2)=+1$ になる。'], [fc(-6, 1), '足して $-1$。$-6+1=-5$ になる。'], [fc(-3, -2), 'かけて $-6$。$(-3)\\times(-2)=+6$ になる。']], ['かけて $-6$、足して $-1$ の2数は、$-3$ と $+2$。', '$(x-3)(x+2)$。'], 'かけて定数項、足して $x$ の係数。'),
    RQ('bu-5', '$x^2-9$ を因数分解すると？', fc(3, -3), [['(x-3)^2', '展開すると $x^2-6x+9$。'], ['(x+3)^2', '展開すると $x^2+6x+9$。'], [fc(-9, 1), '展開すると $x^2-8x-9$。']], ['$a^2-b^2=(a+b)(a-b)$。', '$x^2-3^2=(x+3)(x-3)$。'], '$a^2-b^2=(a+b)(a-b)$。'),
    RQ('bu-6', '$x^2+6x+9$ を因数分解すると？', '(x+3)^2', [['(x-3)^2', '展開すると $x^2-6x+9$。'], [fc(3, -3), '展開すると $x^2-9$。'], ['(x+9)^2', '展開すると $x^2+18x+81$。']], ['$9=3^2$、$6=2\\times3$。', '$(x+3)^2$。'], '$a^2+2ab+b^2=(a+b)^2$。'),
    RQ('bu-7', '$2x^2-8$ を因数分解すると？', '2(x+2)(x-2)', [['2(x^2-4)', 'まだ $x^2-4$ が因数分解できる。'], ['2(x-2)^2', '展開すると $2x^2-8x+8$。'], ['(x+2)(x-2)', '共通因数 2 を忘れている。展開すると $x^2-4$。']], ['まず 2 でくくる：$2(x^2-4)$。', '$2(x+2)(x-2)$。'], '共通因数でくくってから、公式を使う。')
  ];
}
/* ===== パートB: 平方根 ===== */
function genHeihou() {
  return [
    RQ('hh-1', '25 の平方根は？', '$5$ と $-5$', [['$5$ だけ', '平方根は、正と負の2つある。'], ['$\\sqrt{5}$ と $-\\sqrt{5}$', '$5^2=25$。25 の平方根は、$\\pm5$。'], ['$12.5$ と $-12.5$', '$12.5$ は、25 を 2 でわった数。']], ['2乗して 25 になる数をさがす。', '$5^2=25$、$(-5)^2=25$。'], '正の数の平方根は、正と負の2つ。'),
    RQ('hh-2', '$\\sqrt{49}$ の値は？', '$7$', [['$\\pm7$', '記号 √ は、正のほうだけをあらわす。'], ['$49$', '$\\sqrt{49}$ は、2乗して 49 になる正の数。'], ['$\\sqrt{7}$', '$7^2=49$ なので、$\\sqrt{49}=7$。']], ['$7^2=49$。', '$\\sqrt{49}=7$。'], '$\\sqrt{a}$ は、$a$ の平方根の、正のほう。'),
    RQ('hh-3', '$3$、$\\sqrt{8}$、$\\sqrt{10}$ のうち、いちばん大きい数は？', '$\\sqrt{10}$', [['$3$', '$3=\\sqrt{9}$。$\\sqrt{10}$ のほうが大きい。'], ['$\\sqrt{8}$', '$\\sqrt{8}<\\sqrt{9}=3$。'], ['どれも同じ', '根号の中が大きいほど、大きい。']], ['$3=\\sqrt{9}$ と書ける。', '$\\sqrt{8}<\\sqrt{9}<\\sqrt{10}$。'], '根号の中が大きいほど、大きい数。'),
    RQ('hh-4', '無理数はどれ？', '$\\sqrt{7}$', [['$\\sqrt{16}$', '$\\sqrt{16}=4$。整数（有理数）。'], ['$0.25$', '$0.25=\\dfrac{1}{4}$。分数で書ける。'], ['$\\dfrac{3}{7}$', '分数で書ける数は、有理数。']], ['整数や分数で表せない数が、無理数。', '$\\sqrt{7}$ は、小数がずっと続く。'], '無理数：分数で表せない数（$\\sqrt{2}$ など）。'),
    RQ('hh-5', '$\\sqrt{30}$ は、どの2つの整数の間？', '5 と 6', [['4 と 5', '$4^2=16$、$5^2=25$。30 はもっと大きい。'], ['3 と 4', '$3^2=9$、$4^2=16$。30 はもっと大きい。'], ['6 と 7', '$6^2=36$。30 は、36 より小さい。']], ['$5^2=25$、$6^2=36$。', '$25<30<36$。'], '2乗した数ではさんで、大きさを見つける。'),
    NQ('hh-6', '$\\sqrt{0.09}$ の値は？', 0.3, [[0.03, '$0.03^2=0.0009$。'], [0.9, '$0.9^2=0.81$。'], [3, '$3^2=9$。0.09 ではない。']], ['$0.3^2=0.09$。'], '小数の平方根は、2乗して確かめる。'),
    NQ('hh-7', '10 以下の自然数 $n$ のうち、$\\sqrt{n}$ が整数になる $n$ は、何個？', 3, [[2, '1、4 のほかに、9 もある。'], [4, '16 は、10 より大きい。'], [1, '1 のほかに、4 と 9 もある。']], ['$n=1,\\ 4,\\ 9$。', '$\\sqrt{1}=1$、$\\sqrt{4}=2$、$\\sqrt{9}=3$。'], '平方数（1、4、9、16、…）をおぼえておく。', '個')
  ];
}
function genKeisan() {
  return [
    RQ('ke-1', '$\\sqrt{2}\\times\\sqrt{3}$ を計算すると？', SQ(6), [['6', '根号は、そのまま残る。$\\sqrt{6}$。'], [SQ(5), 'かけ算は、根号の中どうしをかける。'], [SQ(23), '「2 と 3 をならべる」のではなく、かける。']], ['$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$。', '$\\sqrt{6}$。'], '$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$。'),
    RQ('ke-2', '$\\sqrt{12}$ を、$a\\sqrt{b}$ の形になおすと？', '2\\sqrt{3}', [['3\\sqrt{2}', '$3^2\\times2=18$。$\\sqrt{12}$ ではない。'], ['4\\sqrt{3}', '$4^2\\times3=48$。$\\sqrt{12}$ ではない。'], ['6', '$6^2=36$。$\\sqrt{12}$ ではない。']], ['$12=4\\times3$。', '$\\sqrt{12}=\\sqrt{4}\\times\\sqrt{3}=2\\sqrt{3}$。'], '平方数（4、9、…）をさがして、外に出す。'),
    RQ('ke-3', '$3\\sqrt{2}+5\\sqrt{2}$ を計算すると？', '8\\sqrt{2}', [['8\\sqrt{4}', '根号の中は足さない。$\\sqrt{2}$ はそのまま。'], ['15\\sqrt{2}', '足し算では、係数を足す。'], ['2\\sqrt{2}', 'ひき算ではなく、足し算。']], ['$\\sqrt{2}$ を文字のように考える。', '$(3+5)\\sqrt{2}=8\\sqrt{2}$。'], '同じ根号どうしは、同類項のように、係数を足す。'),
    RQ('ke-4', '$\\sqrt{18}-\\sqrt{2}$ を計算すると？', '2\\sqrt{2}', [[SQ(16), '根号の中を、ひいてはいけない。'], ['2', '$\\sqrt{2}$ は、そのまま残る。'], ['3\\sqrt{2}', '$\\sqrt{18}=3\\sqrt{2}$ のあと、$\\sqrt{2}$ もひく。']], ['$\\sqrt{18}=3\\sqrt{2}$。', '$3\\sqrt{2}-\\sqrt{2}=2\\sqrt{2}$。'], 'まず、根号の中を簡単にしてから、足し算・ひき算。'),
    NQ('ke-5', '$\\sqrt{3}\\times\\sqrt{12}$ を計算すると？', 6, [[36, '$\\sqrt{36}=6$。根号をはずす。'], [15, '$3+12$ ではなく、$3\\times12$。'], [2, '$\\sqrt{12\\div3}$ ではなく、かけ算。']], ['$\\sqrt{3\\times12}=\\sqrt{36}=6$。'], 'かけてから、平方数なら、根号をはずす。'),
    NQ('ke-6', '$(\\sqrt{5})^2$ を計算すると？', 5, [[25, '$(\\sqrt{5})^2$ は、$\\sqrt{5}\\times\\sqrt{5}=5$。'], [10, '$5+5$ ではない。2乗すると、根号がなくなって 5 になる。'], [2.5, '2 でわってはいけない。']], ['$(\\sqrt{a})^2=a$。'], '$(\\sqrt{a})^2=a$。'),
    RQ('ke-7', '$\\sqrt{6}\\div\\sqrt{2}$ を計算すると？', SQ(3), [['3', '根号は、そのまま残る。$\\sqrt{3}$。'], [SQ(4), '$\\sqrt{6-2}$ ではなく、わり算。'], [SQ(12), '$6\\times2$ ではなく、$6\\div2$。']], ['$\\sqrt{6\\div2}=\\sqrt{3}$。'], '$\\sqrt{a}\\div\\sqrt{b}=\\sqrt{a\\div b}$。')
  ];
}
function genYuuri() {
  return [
    RQ('yu-1', '$\\dfrac{6}{\\sqrt{3}}$ の分母を有理化すると？', '2\\sqrt{3}', [['2', '分母・分子に $\\sqrt{3}$ をかける。$\\sqrt{3}$ は残る。'], ['6\\sqrt{3}', '$\\dfrac{6\\sqrt{3}}{3}$。3 でわるのを忘れている。'], ['\\dfrac{\\sqrt{3}}{2}', '$\\dfrac{6}{3}=2$ を、逆にしている。']], ['分母・分子に $\\sqrt{3}$ をかける。', '$\\dfrac{6\\sqrt{3}}{3}=2\\sqrt{3}$。'], '分母の根号を、分母・分子に同じ数をかけて、なくす（有理化）。'),
    RQ('yu-2', '$\\dfrac{1}{\\sqrt{2}}$ の分母を有理化すると？', '\\dfrac{\\sqrt{2}}{2}', [['\\sqrt{2}', '分母にも $\\sqrt{2}$ をかける。'], ['\\dfrac{1}{2}', '分子にも $\\sqrt{2}$ をかける。'], ['2\\sqrt{2}', '分母は $\\sqrt{2}\\times\\sqrt{2}=2$。']], ['分母・分子に $\\sqrt{2}$。', '$\\dfrac{\\sqrt{2}}{2}$。'], '分母・分子に同じ数をかけるのは、値を変えない。'),
    RQ('yu-3', '$\\sqrt{2}(\\sqrt{2}+3)$ を計算すると？', '2+3\\sqrt{2}', [['5', '$3\\sqrt{2}$ の根号が残る。'], ['4\\sqrt{2}', '$\\sqrt{2}\\times\\sqrt{2}=2$。'], ['2+\\sqrt{6}', '$\\sqrt{2}\\times3=3\\sqrt{2}$。']], ['分配法則。', '$\\sqrt{2}\\times\\sqrt{2}+\\sqrt{2}\\times3=2+3\\sqrt{2}$。'], '$(\\sqrt{a})^2=a$ を使う。'),
    NQ('yu-4', '$(\\sqrt{3}+1)(\\sqrt{3}-1)$ を計算すると？', 2, [[4, '$3+1$ ではなく、$3-1$。'], [8, '$3^2-1$ ではなく、$(\\sqrt{3})^2-1^2$。'], [0, '$(\\sqrt{3})^2=3$。$3-1=2$。']], ['$(a+b)(a-b)=a^2-b^2$。', '$3-1=2$。'], '公式は、根号があっても使える。'),
    RQ('yu-5', '$(\\sqrt{2}+1)^2$ を計算すると？', '3+2\\sqrt{2}', [['3', '中の項 $2\\sqrt{2}$ を忘れている。'], ['3+\\sqrt{2}', '中の項は、$2\\times\\sqrt{2}\\times1=2\\sqrt{2}$。'], ['1+2\\sqrt{2}', '$(\\sqrt{2})^2=2$。$2+1=3$。']], ['$(a+b)^2=a^2+2ab+b^2$。', '$2+2\\sqrt{2}+1=3+2\\sqrt{2}$。'], '乗法公式は、根号にも使える。'),
    Object.assign(RQ('yu-6', '面積が $20$ cm² の正方形の、1辺の長さは？', TT('2\\sqrt{5}') + ' cm', [[TT('10') + ' cm', '$10^2=100$。20 ではない。'], [TT('5') + ' cm', '$5^2=25$。20 ではない。'], [TT('4\\sqrt{5}') + ' cm', '$(4\\sqrt{5})^2=80$。20 ではない。']], ['1辺 $=\\sqrt{20}$。', '$\\sqrt{20}=\\sqrt{4\\times5}=2\\sqrt{5}$。'], '正方形の1辺 ＝ $\\sqrt{\\text{面積}}$。'), { fig: figSq() }),
    NQ('yu-7', '$\\sqrt{2}=1.414$ として、$\\sqrt{8}$ の近似値は？', 2.828, [[4.242, '$\\sqrt{8}=2\\sqrt{2}$。3倍ではない。'], [2.414, '$\\sqrt{8}=2\\sqrt{2}$。1 を足すのではない。'], [5.656, '$\\sqrt{8}=2\\sqrt{2}$。4倍ではなく、2倍。']], ['$\\sqrt{8}=2\\sqrt{2}$。', '$2\\times1.414=2.828$。'], '$\\sqrt{}$ を簡単にして、近似値を使う。')
  ];
}
const RT = RTV;
const I = {
  te: '<b>展開</b>：かっこをはずして、ひとつの式にすること。<br>すべての項どうしをかけて、<b>同類項</b>をまとめる。<br>$(x+2)(x+3)=x^2+3x+2x+6=x^2+5x+6$。' + figRect().html,
  ko: '<b>乗法公式</b><br>① $(x+a)(x+b)=x^2+(a+b)x+ab$<br>② $(a+b)^2=a^2+2ab+b^2$<br>③ $(a-b)^2=a^2-2ab+b^2$<br>④ $(a+b)(a-b)=a^2-b^2$<br>中の項（$2ab$）を忘れないこと。',
  bu: '<b>因数分解</b>：展開の逆。式を、かけ算のかたちにすること。<br>① まず<b>共通因数</b>でくくる。<br>② $x^2+(a+b)x+ab=(x+a)(x+b)$：かけて $ab$、足して $a+b$ の2数をさがす。<br>③ $a^2\\pm2ab+b^2=(a\\pm b)^2$、$a^2-b^2=(a+b)(a-b)$。',
  hh: '2乗して $a$ になる数を、$a$ の<b>平方根</b>という。正の数の平方根は、正と負の2つ（$\\pm$）。<br>$\\sqrt{a}$ は、正のほう。$\\sqrt{25}=5$。<br>$\\sqrt{}$ の中が大きいほど、大きい数。<br><b>無理数</b>：分数で表せない数（$\\sqrt{2}=1.41421356\\cdots$）。',
  ke: '$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$、$\\sqrt{a}\\div\\sqrt{b}=\\sqrt{a\\div b}$。<br>$\\sqrt{12}=\\sqrt{4\\times3}=2\\sqrt{3}$（平方数を外に出す）。<br>足し算・ひき算は、同じ根号どうしで係数を計算：$3\\sqrt{2}+5\\sqrt{2}=8\\sqrt{2}$。<br>$(\\sqrt{a})^2=a$。',
  yu: '分母に根号があるとき、分母・分子に同じ数をかけて、分母の根号をなくす（<b>有理化</b>）。<br>$\\dfrac{1}{\\sqrt{2}}=\\dfrac{\\sqrt{2}}{2}$。<br>乗法公式は、根号のある式にも使える。' + figSq().html
};
const ABOUT = {
  tenkai: [
    { p: '<b>展開</b>と<b>因数分解</b>は、逆の計算。' },
    { p: RT([['$(x+a)(x+b)$', '⇔', '$x^2+(a+b)x+ab$'], ['$(a+b)^2$', '⇔', '$a^2+2ab+b^2$'], ['$(a+b)(a-b)$', '⇔', '$a^2-b^2$']]) },
    { cap: '公式は、左右どちら向きにも使う。' }
  ],
  heihou: [
    { p: '<b>平方根</b>は、2乗すると、もとの数になる数。' },
    { p: RT([['$\\sqrt{12}$', '→', '$2\\sqrt{3}$'], ['$\\sqrt{a}\\times\\sqrt{b}$', '→', '$\\sqrt{ab}$'], ['$\\dfrac{1}{\\sqrt{2}}$', '→', '$\\dfrac{\\sqrt{2}}{2}$']]) },
    { cap: '平方数（4、9、16、25…）を見つけよう。' }
  ]
};
const PARTS = [
  {
    id: 'tenkai', title: '展開と因数分解', sub: '乗法公式・因数分解', about: ABOUT.tenkai, aboutTitle: 'まず見てみよう：展開と因数分解', aboutSub: '逆の計算',
    steps: [
      { id: 'tenkai-1', title: '多項式の展開', sub: '分配法則', intro: I.te, qs: genTenkai() },
      { id: 'tenkai-2', title: '乗法公式', sub: '4つの公式', intro: I.ko, qs: genKoushiki() },
      { id: 'tenkai-3', title: '因数分解', sub: '共通因数・公式', intro: I.bu, qs: genBunkai() }
    ]
  },
  {
    id: 'heihou', title: '平方根', sub: '意味・計算・有理化', about: ABOUT.heihou, aboutTitle: 'まず見てみよう：平方根', aboutSub: '2乗すると、もとの数になる数',
    steps: [
      { id: 'heihou-1', title: '平方根の意味', sub: '平方根・大小・無理数', intro: I.hh, qs: genHeihou() },
      { id: 'heihou-2', title: '根号の計算', sub: 'かけ算・わり算・足し算', intro: I.ke, qs: genKeisan() },
      { id: 'heihou-3', title: '有理化と利用', sub: '分母の有理化・公式', intro: I.yu, qs: genYuuri() }
    ]
  }
];
const RBM = { '乗法公式': 'じょうほうこうしき', '共通因数': 'きょうつういんすう', '因数分解': 'いんすうぶんかい', '平方根': 'へいほうこん', '平方数': 'へいほうすう', '無理数': 'むりすう', '有理化': 'ゆうりか', '近似値': 'きんじち', '同類項': 'どうるいこう', '展開': 'てんかい', '根号': 'こんごう', '分配法則': 'ぶんぱいほうそく', '有理数': 'ゆうりすう' };
const RBR = new RegExp(Object.keys(RBM).sort((a, b) => b.length - a.length).join('|'), 'g');
const RB = s => s.replace(RBR, w => '<ruby>' + w + '<rt>' + RBM[w] + '</rt></ruby>');
const ruby = o => typeof o === 'string' ? o.split(/(<svg[\s\S]*?<\/svg>)/).map((t, k) => k % 2 ? t : RB(t)).join('')
  : Array.isArray(o) ? o.map(ruby) : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, (k === 'expr' || k === 'id' || k === 'html') ? v : ruby(v)])) : o;
const out = '// 自動生成（node gen11.js）。手で直すときは gen11.js を直す。\nconst PARTS = ' + JSON.stringify(ruby(PARTS)) + ';\nif (typeof module !== \'undefined\') module.exports = PARTS;\n';
fs.writeFileSync(path.join(__dirname, 'src/data.js'), out);
let n = 0; PARTS.forEach(P => P.steps.forEach(s => { n += s.qs.length; }));
console.log('src/data.js を作成：' + n + '問、' + (out.length / 1024).toFixed(0) + 'KB');
