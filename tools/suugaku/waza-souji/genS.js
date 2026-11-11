// 確率の裏技の問題データ生成: node genP.js -> src/data.js
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

/* ---------- 共通の小物（確率の裏技） ---------- */
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
const S_ = s => ' style="' + s + '"';
const svgW = (h, inner) => '<svg viewBox="0 0 260 ' + h + '" role="img" aria-label="図"' + S_('width:100%;max-width:320px;height:auto;display:block;margin:8px auto') + '>' + inner + '</svg>';
const ln = (x1, y1, x2, y2, c, w, dash) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + S_('stroke:var(' + c + ');stroke-width:' + (w || 2) + ';stroke-linecap:round' + (dash ? ';stroke-dasharray:5 4' : '')) + '/>';
const tx = (x, y, t, a) => '<text x="' + x + '" y="' + y + '"' + S_('font:700 13px sans-serif;fill:var(--fg);text-anchor:' + (a || 'middle')) + '>' + t + '</text>';
const circ = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--card)"' + S_('stroke:var(--fg);stroke-width:2.5') + '/>';
const TT = s => '$' + s + '$';
const RT = rows => '<table class="rtab">' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</table>';
const txc = (x, y, t, c, a) => '<text x="' + x + '" y="' + y + '"' + S_('font:700 14px sans-serif;fill:var(' + (c || '--fg') + ');text-anchor:' + (a || 'middle')) + '>' + t + '</text>';
const isU = t => /[x?]/.test(String(t));
const RA = (a, b) => TT(a + ':' + b);

/* ===== 図形ツール ===== */
const near = (a, b, m) => { if (Math.abs(a - b) > 1e-9) throw new Error('検算ちがい ' + m + ' ' + a + ' vs ' + b); };
const areaP = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const rr = (a, b) => { const g = gcd(a, b); return (a / g) + ':' + (b / g); };
/* 汎用の図：pts={名前:[x,y]}, fill=[[名前…,色]], segs=[[a,b,'d'?]], len=[[a,b,文字]] */
function figGeo(o) {
  const nm = Object.keys(o.pts), xs = nm.map(n => o.pts[n][0]), ys = nm.map(n => o.pts[n][1]);
  const minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
  const sc = Math.min(210 / (maxx - minx || 1), 130 / (maxy - miny || 1));
  const ox = (260 - (maxx - minx) * sc) / 2 - minx * sc, oy = 24;
  const P = n => [+(ox + o.pts[n][0] * sc).toFixed(1), +(oy + (maxy - o.pts[n][1]) * sc).toFixed(1)];
  const cx = nm.map(n => P(n)[0]).reduce((a, b) => a + b, 0) / nm.length, cy = nm.map(n => P(n)[1]).reduce((a, b) => a + b, 0) / nm.length;
  const out = (x, y, d) => { const vx = x - cx, vy = y - cy, l = Math.hypot(vx, vy) || 1; return [x + vx / l * d, y + vy / l * d]; };
  let s = '';
  (o.fill || []).forEach(f => { const col = f[f.length - 1], names = f.slice(0, -1); s += '<polygon points="' + names.map(n => P(n).join(',')).join(' ') + '" fill="var(' + col + ')" fill-opacity=".25"' + S_('stroke:none') + '/>'; });
  (o.segs || []).forEach(g => { const a = P(g[0]), b = P(g[1]); s += ln(a[0], a[1], b[0], b[1], g[2] === 'd' ? '--muted' : '--fg', g[2] === 'd' ? 1.6 : 2.4, g[2] === 'd'); });
  (o.len || []).forEach(l => { const a = P(l[0]), b = P(l[1]), m = out((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 12); s += txc(m[0], m[1] + 4, l[2], '--pos'); });
  (o.show || nm).forEach(n => { const p = P(n), q = out(p[0], p[1], 13); s += txc(q[0], q[1] + 5, n, '--fg'); });
  (o.tags || []).forEach(g => { const t = g[g.length - 1], ns = g.slice(0, -1), q = ns.map(P); s += txc(q.reduce((a, b) => a + b[0], 0) / q.length, q.reduce((a, b) => a + b[1], 0) / q.length + 5, t, '--neg'); });
  (o.dots || []).forEach(n => { const p = P(n); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="var(--pos)"/>'; });
  return { type: 'svg', html: svgW(190, s) };
}
/* 三角形 ABC に D(AB上)、E(AC上) */
const TA = [2.2, 5], TB = [0, 0], TC = [6, 0];
function triADE(a, b, c, d, extra) {
  const D = lerp(TA, TB, a / (a + b)), E = lerp(TA, TC, c / (c + d));
  return { D, E, fig: figGeo(Object.assign({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['A', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], len: [['A', 'D', a], ['D', 'B', b], ['A', 'E', c], ['E', 'C', d]] }, extra || {})) };
}
/* 台形 ABCD（AD∥BC, AD=a, BC=b）と対角線の交点 O */
function trap(a, b, col) {
  const k = 1.4, B = [0, 0], C = [b * k, 0], A = [(b - a) * k / 2 + 0.3, 4], D = [A[0] + a * k, 4], O = lerp(A, C, a / (a + b));
  return figGeo({ pts: { A, B, C, D, O }, fill: col || [['A', 'O', 'D', '--pos'], ['B', 'O', 'C', '--neg']], segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C'], ['B', 'D']], show: ['A', 'B', 'C', 'D', 'O'], len: [['A', 'D', a], ['B', 'C', b]] });
}
const WQ = (id, p, t, ws, steps, point, fig, unit) => Object.assign(NQ(id, p, t, ws.map(c => [Math.round(c[0] * 1e6) / 1e6, c[1]]).filter(c => Number.isInteger(c[0]) && c[0] > 0), steps, point, unit || ''), fig ? { fig } : {});
const WR = (id, p, t, ws, steps, point, fig) => Object.assign(RQ(id, p, t, ws, steps, point), fig ? { fig } : {});
const U = ' cm²';


/* ---- ⓪ ふつうに解くと大変 ---- */
function figDC(a, b, c, d) { const D = lerp(TA, TB, a / (a + b)), E = lerp(TA, TC, c / (c + d)); return figGeo({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['A', 'D', 'E', '--pos'], ['D', 'E', 'C', '--neg']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['D', 'C', 'd']], len: [['A', 'D', a], ['D', 'B', b], ['A', 'E', c], ['E', 'C', d]] }); }
function sHard() {
  const F = (n, d) => '\\dfrac{' + n + '}{' + d + '}';
  const mkF = (id, p, a, b, why, fig, steps, point) => WR(id, p, F(a, a + b), [[F(1, 3), why[0]], [F(b, a + b), why[1]], [F(a, b), why[2]], [F(1, 4), why[3]], [F(1, 2), '半分ではない。AD:AB で決まる。'], [F(2, 3), '$\\dfrac{2}{3}$ ではない。AD:AB で決まる。']].filter(c => c[0] !== F(a, a + b)), steps, point, fig);
  const qs = [];
  qs.push(mkF('ft-1', '【ふつうの解き方】△ABC の辺 AB 上に D（AD:DB $=1:1$）、辺 AC 上に E（AE:EC $=3:1$）。まず補助線 DC を引く。△ADC は、△ABC の何分の何？', 1, 1, ['AD:AB $=1:2$ なので、$\\dfrac{1}{3}$ ではない。', 'DB 側の三角形になっている。', '部分の比ではなく、全体 AB との比。', '$\\dfrac{1}{4}$ ではない。AD:AB $=1:2$。'], figDC(1, 1, 3, 1), ['C から AB へ高さが同じ → 面積比 ＝ 底辺の比。', 'AD:AB $=1:2$ → △ADC ＝ △ABC の $\\dfrac{1}{2}$。'], '補助線を引く → 同じ高さで比を使う（1回目）。'));
  qs.push(WQ('ft-2', '【つづき】△ABC ＝ $32\\ \\mathrm{cm}^2$ なので △ADC ＝ $16\\ \\mathrm{cm}^2$。AE:EC $=3:1$ のとき、△ADE の面積は？', 12, [[4, '△DEC の面積。△ADE は、AE の側で $\\dfrac{3}{4}$。'], [8, '$\\dfrac{1}{2}$ ではない。AE:AC $=3:4$。'], [16, '△ADC の面積。E で分けると、△ADE はその $\\dfrac{3}{4}$。'], [24, '$16\\times\\dfrac{3}{2}$ ではない。$16\\times\\dfrac{3}{4}$。']], ['D から AC へ高さが同じ → △ADE : △DEC ＝ AE : EC ＝ $3:1$。', '△ADE ＝ △ADC $\\times\\dfrac{3}{4}=12$。（2回目）'], '補助線のあと、もう一度比を使う。', figDC(1, 1, 3, 1), U));
  qs.push(mkF('ft-3', '【別の問題】AD:DB $=1:3$、AE:EC $=1:2$。補助線 DC を引くと、△ADC は △ABC の何分の何？', 1, 3, ['AD:AB $=1:4$ なので、$\\dfrac{1}{3}$ ではない。', 'DB 側の三角形になっている。', '部分の比ではなく、全体 AB との比。', ''], figDC(1, 3, 1, 2), ['AD:AB $=1:4$。', '△ADC ＝ △ABC の $\\dfrac{1}{4}$。（1回目）'], '補助線を引いて、比を使う。'));
  qs.push(WQ('ft-4', '【つづき】△ABC ＝ $48\\ \\mathrm{cm}^2$ なので △ADC ＝ $12\\ \\mathrm{cm}^2$。AE:EC $=1:2$ のとき、△ADE の面積は？', 4, [[8, '△DEC の面積。△ADE は AE の側で $\\dfrac{1}{3}$。'], [6, '$\\dfrac{1}{2}$ ではない。AE:AC $=1:3$。'], [12, '△ADC の面積。E で分けると、△ADE はその $\\dfrac{1}{3}$。'], [3, '$12\\times\\dfrac{1}{4}$ ではない。$12\\times\\dfrac{1}{3}$。']], ['△ADE : △DEC ＝ AE : EC ＝ $1:2$。', '△ADE ＝ △ADC $\\times\\dfrac{1}{3}=4$。（2回目）'], '2段階で、やっと答え。', figDC(1, 3, 1, 2), U));
  qs.push(WQ('ft-5', '【もう1問】AD:DB $=2:3$、AE:EC $=1:1$、△ABC ＝ $50\\ \\mathrm{cm}^2$。補助線 DC を引いたとき、△ADC の面積は？', 20, [[30, '△DBC の面積。△ADC は AD の側で $\\dfrac{2}{5}$。'], [25, '半分ではない。AD:AB $=2:5$。'], [10, '$\\dfrac{1}{5}$ ではない。$\\dfrac{2}{5}$。']], ['AD:AB $=2:5$。△ADC ＝ $50\\times\\dfrac{2}{5}=20$。（1回目）'], '補助線のあとの面積を、まず出す。', figDC(2, 3, 1, 1), U));
  qs.push(WQ('ft-6', '【つづき】△ADC ＝ $20\\ \\mathrm{cm}^2$。AE:EC $=1:1$ のとき、△ADE の面積は？', 10, [[20, '△ADC の面積。E は AC の中点なので、半分。'], [5, '$\\dfrac{1}{4}$ ではない。AE:AC $=1:2$。'], [15, '$20\\times\\dfrac{3}{4}$ ではない。$20\\times\\dfrac{1}{2}$。']], ['E は AC の中点。△ADE ＝ △ADC の $\\dfrac{1}{2}=10$。（2回目）'], '正攻法は、補助線 → 2回の比 → 答え。', figDC(2, 3, 1, 1), U));
  qs.push(WR('ft-7', '【裏技なら】△ABC の辺 AB 上に D、辺 AC 上に E があるとき、△ADE の面積は、△ABC に何をかけるだけで出る？', '\\dfrac{AD}{AB}\\times\\dfrac{AE}{AC}', [['\\dfrac{AD}{DB}\\times\\dfrac{AE}{EC}', '部分の比（AD:DB）ではなく、全体（AB、AC）との比。'], ['\\dfrac{AD}{AB}', '$\\dfrac{AE}{AC}$ の比もかける。'], ['\\dfrac{AD+AE}{AB+AC}', '足し算ではなく、かけ算。']], ['補助線もいらない。', '△ADE ＝ △ABC $\\times\\dfrac{AD}{AB}\\times\\dfrac{AE}{AC}$。1回の計算で出る。'], '裏技は、補助線なし・比をかけるだけ。', figDC(1, 1, 3, 1)));
  return qs;
}
/* ---- ① 相似比 → 面積比・体積比 ---- */
function twoTri(m, n) { const s1 = m, s2 = n, f = (ox, s) => ({ x: ox, s });
  const T = (x0, s) => [[x0, 0], [x0 + 4 * s, 0], [x0 + 1.5 * s, 3 * s]];
  const a = T(0, m), b = T(4 * m + 1.2, n); // 横に並べる
  return figGeo({ pts: { A: a[2], B: a[0], C: a[1], D: b[2], E: b[0], F: b[1] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D']], fill: [['A', 'B', 'C', '--pos'], ['D', 'E', 'F', '--neg']] }); }
function sSim() {
  const R = (id, m, n, kind, gnd) => { const e = kind === 'v' ? 3 : 2, t = rr(Math.pow(m, e), Math.pow(n, e)), w = kind === 'v' ? '体積' : '面積';
    return WR(id, (kind === 'v' ? '相似な2つの立体 P、Q の相似比が $' + m + ':' + n + '$。体積の比は？' : '相似な △ABC と △DEF の相似比が $' + m + ':' + n + '$。面積の比は？'), t,
      [[rr(m, n), '相似比そのまま。面積比は、2乗する。'], [rr(Math.pow(m, 3), Math.pow(n, 3)), '3乗は体積比。面積比は2乗。'], [rr(m * m, n), '片方だけ2乗している。両方を2乗する。'], [rr(m, n * n), '片方だけ2乗している。両方を2乗する。'], [rr(Math.pow(m, 2), Math.pow(n, 3)), '2乗と3乗がまざっている。'], [rr(m * 2, n * n), '2乗ではなく、2倍にしている。']].filter(c => c[0] !== t),
      ['相似比 $' + m + ':' + n + '$。', w + '比 ＝ 相似比の' + (kind === 'v' ? '3' : '2') + '乗。', '$' + m + '^' + e + ':' + n + '^' + e + '=' + t + '$。'], kind === 'v' ? '体積比 ＝ 相似比の3乗。' : '面積比 ＝ 相似比の2乗。', kind === 'v' ? null : twoTri(m, n)); };
  const qs = [R('sm-1', 2, 3), R('sm-2', 3, 5), R('sm-3', 1, 4)];
  qs.push(WR('sm-4', '相似な2つの三角形の面積比が $4:25$。相似比は？', '2:5', [['4:25', '面積比そのまま。相似比は、$\\sqrt{}$（平方根）をとる。'], ['16:625', '2乗する向きがぎゃく。面積比から相似比は、ルートをとる。'], ['2:25', '片方だけルートをとっている。両方ルートをとる。'], ['8:125', '3乗の比。面積比からは、ルート。']], ['面積比 ＝ 相似比の2乗。', '相似比 ＝ $\\sqrt{4}:\\sqrt{25}=2:5$。'], '面積比から相似比は、$\\sqrt{}$ をとる。'));
  qs.push(WQ('sm-5', '相似な △ABC と △DEF の相似比が $2:3$。△ABC の面積が $12\\ \\mathrm{cm}^2$ のとき、△DEF の面積は？', 27, [[18, '$\\dfrac{3}{2}$ 倍ではない。面積は 2乗で $\\dfrac{9}{4}$ 倍。'], [24, '$12\\times2$ ではない。面積は 2乗の比 $4:9$。'], [108, '$12\\times9$ ではない。$4:9$ なので $12\\div4\\times9$。'], [81, '3乗の比（体積）で計算している。面積は2乗。']], ['面積比 ＝ $2^2:3^2=4:9$。', '$12:□=4:9$ より $□=12\\div4\\times9=27$。'], '相似比を2乗して、比の1を出す。', twoTri(2, 3), U));
  qs.push(WQ('sm-6', '相似な2つの立体の相似比が $2:3$。小さい立体の体積が $16\\ \\mathrm{cm}^3$ のとき、大きい立体の体積は？', 54, [[24, '$\\dfrac{3}{2}$ 倍ではない。体積は 3乗で $\\dfrac{27}{8}$ 倍。'], [36, '$\\dfrac{9}{4}$ 倍は面積。体積は3乗。'], [144, '$16\\times9$ ではない。体積比は $8:27$。'], [108, '$16\\times\\dfrac{27}{4}$ ではない。$16\\div8\\times27$。']], ['体積比 ＝ $2^3:3^3=8:27$。', '$16\\div8\\times27=54$。'], '体積比 ＝ 相似比の3乗。', null, ' cm³'));
  qs.push(WR('sm-7', '相似な2つの円錐 P、Q の高さの比が $1:3$。表面積の比は？', '1:9', [['1:3', '表面積は、面積の仲間。2乗する。'], ['1:27', '3乗は体積比。表面積は面積なので2乗。'], ['1:6', '$1:3$ の2倍ではない。2乗は $1:9$。']], ['相似比（高さの比）$=1:3$。', '表面積は面積 → 2乗。$1:9$。'], '表面積 ＝ 面積 → 2乗。体積 → 3乗。'));
  return qs;
}
/* ---- ② 同じ高さ・同じ底辺 ---- */
function triBD(a, b, extra) { const D = lerp(TB, TC, a / (a + b)); return { D, fig: figGeo(Object.assign({ pts: { A: TA, B: TB, C: TC, D }, fill: [['A', 'B', 'D', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'D', 'd']], len: [['B', 'D', a], ['D', 'C', b]] }, extra || {})) }; }
function sBase() {
  const chk = (a, b) => { const D = lerp(TB, TC, a / (a + b)); near(areaP([TA, TB, D]) / areaP([TA, TB, TC]), a / (a + b), 'bd'); };
  const T = (id, a, b, S) => { chk(a, b); const t = S * a / (a + b), g = triBD(a, b);
    return WQ(id, '△ABC の辺 BC 上に点 D があり、BD:DC $=' + a + ':' + b + '$。△ABC の面積が $' + S + '\\ \\mathrm{cm}^2$ のとき、△ABD の面積は？', t, [[S * b / (a + b), 'BD の側が △ABD。DC の側（△ADC）の面積になっている。'], [S * a / b, '$a:b$ は全体ではなく部分の比。全体は $a+b$。'], [S / 2, '半分ではない。比は $' + a + ':' + b + '$。'], [S * (a + b) / a, '全体より大きくなってしまう。']], ['△ABD と △ADC は、高さ（A から BC まで）が同じ。', '面積比 ＝ 底辺の比 ＝ $' + a + ':' + b + '$。', '△ABD ＝ $' + S + '\\times\\dfrac{' + a + '}{' + (a + b) + '}=' + t + '$。'], '高さが同じ → 面積比 ＝ 底辺の比。', g.fig, U); };
  const qs = [];
  qs.push((() => { chk(2, 3); const g = triBD(2, 3); return WR('bs-1', '△ABC の辺 BC 上に点 D があり、BD:DC $=2:3$。△ABD と △ADC の面積の比は？', '2:3', [['3:2', 'BD と DC の順番がぎゃく。△ABD は BD 側。'], ['4:9', '2乗は相似のとき。この問題は高さが同じなので、底辺の比そのまま。'], ['2:5', '$2:5$ は、△ABD と △ABC の比。'], ['3:5', '$3:5$ は、△ADC と △ABC の比。']], ['高さ（A から BC）が同じ。', '面積比 ＝ 底辺の比 ＝ BD:DC $=2:3$。'], '高さが同じ → 面積比 ＝ 底辺の比。', g.fig); })());
  qs.push(T('bs-2', 1, 2, 24), T('bs-3', 3, 2, 50));
  qs.push((() => { const g = figGeo({ pts: { A: TA, B: TB, C: TC, M: [3, 0] }, fill: [['A', 'B', 'M', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'M', 'd']], len: [['B', 'M', 1], ['M', 'C', 1]] });
    return WQ('bs-4', '△ABC の辺 BC の中点を M とする。△ABC の面積が $20\\ \\mathrm{cm}^2$ のとき、△ABM の面積は？', 10, [[20, '全体の面積。M は中点なので、半分。'], [5, '$\\dfrac{1}{4}$ ではない。BM:MC $=1:1$ なので、$\\dfrac{1}{2}$。'], [40, '2倍になっている。半分にする。']], ['BM:MC $=1:1$。', '△ABM ＝ △ABC の半分 ＝ $10$。'], '中点 → 面積は半分ずつ。', g, U); })());
  const trapF = trap(2, 3, [['A', 'B', 'C', '--pos']]);
  qs.push(RAWQ('bs-5', '台形 ABCD（AD∥BC）で、△ABC と面積が等しい三角形は？', '△DBC', [['△ABD', 'BC と AD は平行だが、△ABD の底辺は AD。△ABC とは、底辺が別。'], ['△OBC', 'O は対角線の交点。△OBC は △ABC の一部で、小さい。'], ['△ACD', '底辺 AD の三角形。△ABC とは底辺がちがう。']], ['AD∥BC なので、A と D は BC から同じ高さ。', '底辺 BC が共通で、高さが同じ → △ABC ＝ △DBC。'], '平行線 → 同じ底辺・同じ高さ → 面積が等しい。', { fig: trap(2, 3, [['A', 'B', 'C', '--pos'], ['D', 'B', 'C', '--neg']]) }));
  qs[4].fig = qs[4].fig && qs[4].fig.type ? qs[4].fig : trap(2, 3, [['A', 'B', 'C', '--pos'], ['D', 'B', 'C', '--neg']]);
  qs.push(RAWQ('bs-6', '台形 ABCD（AD∥BC）で、対角線の交点を O とする。△ABO と面積が等しい三角形は？', '△DCO', [['△AOD', '△AOD は、△ABO と、辺の長さがちがう。等しいとは限らない。'], ['△BOC', '△BOC は、△ABO より大きい（BC が長いとき）。'], ['△ABC', '△ABC は、△ABO を含む大きな三角形。']], ['△ABD ＝ △ACD（底辺 AD が共通で、高さが同じ）。', 'どちらからも △AOD を引くと、△ABO ＝ △DCO。'], '台形の対角線 → △ABO ＝ △DCO（はさんだ2つ）。', { fig: trap(2, 3, [['A', 'B', 'O', '--pos'], ['D', 'C', 'O', '--neg']]) }));
  qs.push((() => { const a = 1, b = 3, S = 32; const D = lerp(TB, TC, a / (a + b)), E = lerp(TA, D, 0.5); near(areaP([TB, D, E]) / areaP([TA, TB, TC]), (1 / 4) * 0.5, 'bs7');
    const g = figGeo({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['B', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'D', 'd'], ['B', 'E', 'd']], len: [['B', 'D', 1], ['D', 'C', 3]], dots: [] });
    return WQ('bs-7', '△ABC の辺 BC 上に D があり、BD:DC $=1:3$。AD の中点を E とする。△ABC の面積が $32\\ \\mathrm{cm}^2$ のとき、△BDE の面積は？', 4, [[8, '△ABD の面積。E は AD の中点なので、さらに半分。'], [16, '半分の半分ではない。△ABD ＝ $\\dfrac{1}{4}$、その半分が △BDE。'], [2, '$\\dfrac{1}{16}$ ではない。$\\dfrac{1}{4}\\times\\dfrac{1}{2}=\\dfrac{1}{8}$。']], ['△ABD ＝ $32\\times\\dfrac{1}{4}=8$。', 'E は AD の中点 → △BDE ＝ △ABD の半分 ＝ $4$。'], '同じ高さの三角形を、2回使う。', g, U); })());
  return qs;
}
/* ---- ③ 辺の比の積 ---- */
function sProd() {
  const L = [[1, 2, 1, 1, 36], [2, 1, 1, 2, 18], [1, 1, 3, 1, 32], [1, 3, 1, 2, 48], [2, 3, 1, 1, 50]];
  const qs = L.map(([a, b, c, d, S], i) => { const t = S * a * c / ((a + b) * (c + d)); const g = triADE(a, b, c, d); near(areaP([TA, g.D, g.E]) / areaP([TA, TB, TC]), a * c / ((a + b) * (c + d)), 'pr');
    return WQ('pr-' + (i + 1), '△ABC の辺 AB 上に D、辺 AC 上に E があり、AD:DB $=' + a + ':' + b + '$、AE:EC $=' + c + ':' + d + '$。△ABC の面積が $' + S + '\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？', t,
      [[S * a / (a + b), 'AD:AB の比だけを使っている。AE:AC の比もかける。'], [S * a * c / (b * d), 'AD:DB と AE:EC（部分の比）をかけている。全体 AB、AC を使う。'], [S * (a / (a + b) + c / (c + d)) / 2, '比は、足して平均ではない。かけ算。'], [S * c / (c + d), 'AE:AC の比だけを使っている。AD:AB の比もかける。'], [S * b * d / ((a + b) * (c + d)), 'DB と EC の側の三角形。D・E の側（A に近い方）が △ADE。']],
      ['AD:AB $=' + a + ':' + (a + b) + '$、AE:AC $=' + c + ':' + (c + d) + '$。', '△ADE ＝ △ABC $\\times\\dfrac{' + a + '}{' + (a + b) + '}\\times\\dfrac{' + c + '}{' + (c + d) + '}$。', '$=' + S + '\\times\\dfrac{' + a * c + '}{' + (a + b) * (c + d) + '}=' + t + '$。'], '△ADE ＝ △ABC $\\times\\dfrac{AD}{AB}\\times\\dfrac{AE}{AC}$。分母は全体。', g.fig, U); });
  const a = 1, b = 2, c = 1, d = 2, S = 27, g = triADE(a, b, c, d, { fill: [['A', 'D', 'E', '--pos'], ['D', 'B', 'C', 'E', '--neg']] });
  qs.push(WQ('pr-6', '△ABC の辺 AB 上に D、辺 AC 上に E があり、AD:DB $=1:2$、AE:EC $=1:2$。△ABC の面積が $27\\ \\mathrm{cm}^2$ のとき、四角形 DBCE の面積は？', 24, [[3, '△ADE の面積。四角形 DBCE は、全体から引いた残り。'], [18, '$27\\times\\dfrac{2}{3}$ ではない。$\\dfrac{1}{9}$ を引いた残り。'], [9, '$27\\times\\dfrac{1}{3}$ ではない。$27-3$ を計算する。']], ['△ADE ＝ $27\\times\\dfrac{1}{3}\\times\\dfrac{1}{3}=3$。', '四角形 DBCE ＝ $27-3=24$。'], '残りは、全体 − △ADE。', g.fig, U));
  const g7 = triADE(1, 2, 1, 1);
  qs.push(WQ('pr-7', '△ABC の辺 AB 上に D、辺 AC 上に E があり、AD:DB $=1:2$、AE:EC $=1:1$。△ADE の面積が $6\\ \\mathrm{cm}^2$ のとき、△ABC の面積は？', 36, [[12, '$6\\times2$ ではない。$\\dfrac{1}{3}\\times\\dfrac{1}{2}=\\dfrac{1}{6}$ なので、$6\\times6$。'], [18, '$6\\times3$ ではない。2つの比をかけて $\\dfrac{1}{6}$。'], [9, '$6\\times1.5$ ではない。$\\dfrac{1}{6}$ の逆数 $6$ をかける。']], ['△ADE ＝ △ABC $\\times\\dfrac{1}{3}\\times\\dfrac{1}{2}=$ △ABC $\\times\\dfrac{1}{6}$。', '△ABC ＝ $6\\times6=36$。'], '逆にするときは、$\\times$（比の逆数）。', g7.fig, U));
  return qs;
}
/* ---- ④ 台形の対角線 ---- */
function sTrap() {
  const chk = (a, b) => { const B = [0, 0], C = [b, 0], A = [0.3, 4], D = [0.3 + a, 4], O = lerp(A, C, a / (a + b)); const k = areaP([A, O, D]) / (a * a);
    near(areaP([A, B, O]), k * a * b, 'tz1'); near(areaP([D, C, O]), k * a * b, 'tz2'); near(areaP([B, O, C]), k * b * b, 'tz3'); };
  const qs = [];
  chk(1, 2); qs.push(WQ('tz-1', '台形 ABCD（AD∥BC）で AD:BC $=1:2$。対角線の交点を O とする。△AOD の面積が $3\\ \\mathrm{cm}^2$ のとき、△COB の面積は？', 12, [[6, 'これは △AOB（辺の比 $1:2$ のとき、$ab$ の部分）。△COB は $b^2$。'], [9, '$3\\times3$ ではない。$1^2:2^2=1:4$。'], [24, '$3\\times8$ ではない。$a^2:b^2=1:4$ なので $3\\times4$。'], [27, '$3\\times9$ ではない。$1:2$ を2乗して $1:4$。']], ['△AOD ∽ △COB（相似比 $1:2$）。', '面積比 ＝ $1^2:2^2=1:4$。', '△COB ＝ $3\\times4=12$。'], '△AOD : △COB ＝ $a^2:b^2$。', trap(1, 2), U));
  chk(2, 3); qs.push(WQ('tz-2', '台形 ABCD（AD∥BC）で AD:BC $=2:3$。対角線の交点を O とする。△AOD の面積が $4\\ \\mathrm{cm}^2$ のとき、△AOB の面積は？', 6, [[9, 'これは △COB（$b^2$ の部分）。△AOB は $ab$。'], [4, '△AOD と同じではない。$ab=6$ の部分。'], [12, '$ab$ は $2\\times3=6$ の部分。$4\\times3$ ではない。'], [8, '$4\\times2$ ではない。$a^2:ab=4:6$。']], ['4つの三角形：$a^2:ab:ab:b^2=4:6:6:9$。', '△AOD が 4 なら、△AOB は 6。'], '4つの三角形の面積は、$a^2$、$ab$、$ab$、$b^2$。', trap(2, 3, [['A', 'O', 'D', '--pos'], ['A', 'B', 'O', '--neg']]), U));
  chk(1, 3); qs.push(WQ('tz-3', '台形 ABCD（AD∥BC）で AD:BC $=1:3$。△AOD の面積が $2\\ \\mathrm{cm}^2$ のとき、台形 ABCD の面積は？', 32, [[18, '$2\\times9$ は △COB だけ。4つの合計が台形。'], [8, '$2\\times4$ ではない。台形は 4つ全部の合計 $(a+b)^2=16$ 倍。'], [16, '$(a+b)^2=16$ を、$2$ にかけていない。'], [24, '4つの合計は $1+3+3+9=16$。$2\\times16$。']], ['$a^2:ab:ab:b^2=1:3:3:9$。合計 ＝ $16$（$=(a+b)^2$）。', '△AOD ＝ 1 が $2\\ \\mathrm{cm}^2$ なので、台形 ＝ $2\\times16=32$。'], '台形全体 ＝ $(a+b)^2$（$a^2+2ab+b^2$）。', trap(1, 3, [['A', 'B', 'C', 'D', '--pos']]), U));
  chk(3, 2); qs.push(WQ('tz-4', '台形 ABCD（AD∥BC）で AD:BC $=3:2$。△COB の面積が $8\\ \\mathrm{cm}^2$ のとき、△AOB の面積は？', 12, [[18, '△AOD の面積（$a^2$ の部分）。△AOB は $ab$。'], [6, '$ab=6$ は比の数。$8\\div4\\times6$。'], [8, '△COB と同じではない。$ab$ の部分。'], [16, '$8\\times2$ ではない。$b^2:ab=4:6$。']], ['$a^2:ab:ab:b^2=9:6:6:4$。', '△COB ＝ 4 が $8\\ \\mathrm{cm}^2$ なので、1 ＝ 2。△AOB ＝ $6\\times2=12$。'], '比の1つ分を出して、かける。', trap(3, 2, [['B', 'O', 'C', '--pos'], ['A', 'B', 'O', '--neg']]), U));
  qs.push(WR('tz-5', '台形 ABCD（AD∥BC）で、△AOB の面積が $6\\ \\mathrm{cm}^2$、△AOD の面積が $4\\ \\mathrm{cm}^2$。AD:BC は？', '2:3', [['4:6', '約分すると $2:3$。同じ比なので、別の答えとして並べない（答えは $2:3$）。'], ['3:2', 'AD と BC がぎゃく。$a^2:ab=a:b$ なので △AOD:△AOB ＝ AD:BC。'], ['4:9', '$a^2:b^2$ になっている。△AOD:△AOB は、$a:b$。'], ['16:36', '面積比の2乗にしてはいけない。$a^2:ab=a:b$。']].filter(c => c[0] !== '4:6'), ['$a^2:ab=a:b$ だから、△AOD : △AOB ＝ AD : BC。', '$4:6=2:3$。'], '△AOD : △AOB ＝ $a^2:ab=a:b$ ＝ AD:BC。', trap(2, 3, [['A', 'O', 'D', '--pos'], ['A', 'B', 'O', '--neg']])));
  qs.push(WQ('tz-6', '台形 ABCD（AD∥BC）で、対角線の交点を O とする。△AOD ＝ $4\\ \\mathrm{cm}^2$、△COB ＝ $9\\ \\mathrm{cm}^2$。△AOB の面積は？', 6, [[13, '$4+9=13$ ではない。$ab=\\sqrt{a^2\\times b^2}=\\sqrt{4\\times9}$。'], [36, '$4\\times9=36$ は、$(ab)^2$。ルートをとる。'], [5, '$9-4$ ではない。$\\sqrt{4\\times9}=6$。'], [7, '$(4+9)\\div2$ ではない。かけ算のルート（相乗平均）。']], ['$a^2k=4$、$b^2k=9$ → $abk=\\sqrt{4\\times9}=6$。'], '△AOB ＝ $\\sqrt{\\text{△AOD}\\times\\text{△COB}}$。', trap(2, 3), U));
  chk(2, 3); qs.push(WQ('tz-7', '台形 ABCD（AD∥BC）で AD:BC $=2:3$、台形の面積が $50\\ \\mathrm{cm}^2$。対角線の交点を O とするとき、△AOD の面積は？', 8, [[20, '△AOB（$ab$）や △DOC の面積ではない。$a^2$ の部分は $\\dfrac{4}{25}$。'], [10, '$50\\times\\dfrac{1}{5}$ ではない。$a^2=4$、合計 $25$。'], [12, '$50\\times\\dfrac{6}{25}$ は △AOB。△AOD は $\\dfrac{4}{25}$。'], [18, '$50\\times\\dfrac{9}{25}$ は △COB。']], ['$a^2:ab:ab:b^2=4:6:6:9$。合計 ＝ $25$。', '△AOD ＝ $50\\times\\dfrac{4}{25}=8$。'], '全体 ÷ $(a+b)^2$ × $a^2$。', trap(2, 3), U));
  return qs;
}
/* ---- ⑤ DE∥BC ---- */
function sPar() {
  const chk = (m, k) => { const g = triADE(m, k, m, k); near(areaP([TA, g.D, g.E]) / areaP([TA, TB, TC]), m * m / ((m + k) * (m + k)), 'pl'); };
  const mk = (m, k, extra) => { chk(m, k); const D = lerp(TA, TB, m / (m + k)), E = lerp(TA, TC, m / (m + k)); return figGeo(Object.assign({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['A', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], len: [['A', 'D', m], ['D', 'B', k]] }, extra || {})); };
  const qs = [];
  qs.push(WR('pl-1', '△ABC の辺 AB、AC 上に D、E があり、DE∥BC、AD:DB $=1:2$。△ADE と △ABC の面積の比は？', '1:9', [['1:3', '相似比そのまま。面積比は2乗する。'], ['1:2', 'AD:DB の比のまま。全体 AB は $1+2=3$。相似比 $1:3$、面積比 $1:9$。'], ['1:8', '$1:8$ は、△ADE と台形 DBCE の比。△ABC との比は $1:9$。'], ['1:6', '$1:3$ の2倍ではない。2乗は $1:9$。']], ['AD:AB $=1:3$（DE∥BC なので △ADE∽△ABC、相似比 $1:3$）。', '面積比 ＝ $1^2:3^2=1:9$。'], 'DE∥BC → 相似。面積比 ＝ 相似比の2乗。', mk(1, 2)));
  qs.push((() => { return WQ('pl-2', 'DE∥BC、AD:DB $=1:2$。△ADE の面積が $4\\ \\mathrm{cm}^2$ のとき、△ABC の面積は？', 36, [[12, '$4\\times3$ ではない。面積比は $1:9$。'], [8, '$4\\times2$ ではない。面積比は $1:9$。'], [24, '$4\\times6$ ではない。$4\\times9$。'], [16, '$4\\times4$ ではない。$1:9$ の「9」。']], ['AD:AB $=1:3$。面積比 $=1:9$。', '△ABC ＝ $4\\times9=36$。'], '△ABC ＝ △ADE × （全体÷部分）$^2$。', mk(1, 2), U); })());
  qs.push(WQ('pl-3', 'DE∥BC、AD:DB $=1:2$。△ADE の面積が $2\\ \\mathrm{cm}^2$ のとき、台形 DBCE の面積は？', 16, [[18, '△ABC の面積。台形は、△ABC から △ADE を引く。'], [4, '$2\\times2$ ではない。台形は $9-1=8$ にあたる。'], [8, '$2\\times4$ ではない。$1:9$ なので、台形は $8$ 倍。'], [14, '$18-4$ ではない。$18-2=16$。']], ['面積比 △ADE : △ABC ＝ $1:9$。', '台形 DBCE ＝ $9-1=8$ にあたる。$2\\times8=16$。'], '台形 ＝ （全体 − 小さい三角形）。比で $n^2-m^2$。', mk(1, 2, { fill: [['A', 'D', 'E', '--pos'], ['D', 'B', 'C', 'E', '--neg']] }), U));
  qs.push(WQ('pl-4', 'DE∥BC、AD:DB $=2:3$。△ABC の面積が $50\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？', 8, [[20, '$50\\times\\dfrac{2}{5}$ ではない。面積は2乗で $\\dfrac{4}{25}$。'], [18, '$50\\times\\dfrac{9}{25}$ は、$DB$ 側の相似比で計算している。'], [10, '$50\\times\\dfrac{1}{5}$ ではない。$\\dfrac{4}{25}$。'], [32, '台形の面積（$50-18$）になっている。△ADE は、$\\dfrac{4}{25}$。']], ['AD:AB $=2:5$。面積比 $=4:25$。', '△ADE ＝ $50\\times\\dfrac{4}{25}=8$。'], '相似比 $2:5$ → 面積比 $4:25$。', mk(2, 3), U));
  qs.push(WQ('pl-5', 'DE∥BC、AD:DB $=2:1$。△ABC の面積が $36\\ \\mathrm{cm}^2$ のとき、台形 DBCE の面積は？', 20, [[16, '△ADE の面積。台形は残り。'], [12, '$36\\times\\dfrac{1}{3}$ ではない。$\\dfrac{5}{9}$。'], [24, '$36\\times\\dfrac{2}{3}$ ではない。△ADE は $\\dfrac{4}{9}$。'], [18, '半分ではない。$36-16$。']], ['AD:AB $=2:3$。面積比 $=4:9$。', '△ADE ＝ $36\\times\\dfrac{4}{9}=16$。', '台形 ＝ $36-16=20$。'], '台形 ＝ 全体 −（相似の三角形）。', mk(2, 1, { fill: [['A', 'D', 'E', '--pos'], ['D', 'B', 'C', 'E', '--neg']] }), U));
  qs.push(WR('pl-6', 'DE∥BC、AD:DB $=1:1$。△ADE と台形 DBCE の面積の比は？', '1:3', [['1:1', 'AD:DB の比のまま。面積は2乗。$1:4$ が △ABC との比。'], ['1:2', '$1:2$ ではない。$\\triangle ADE:\\triangle ABC=1:4$、台形は $4-1=3$。'], ['1:4', '$1:4$ は、△ADE と △ABC の比。台形はそこから引く。'], ['1:8', '$1:8$ は、AD:DB $=1:2$ のとき。']], ['AD:AB $=1:2$、面積比（△ADE:△ABC）$=1:4$。', '台形 ＝ $4-1=3$。△ADE : 台形 ＝ $1:3$。'], '三角形 : 台形 ＝ $m^2:(n^2-m^2)$。', mk(1, 1, { fill: [['A', 'D', 'E', '--pos'], ['D', 'B', 'C', 'E', '--neg']] })));
  qs.push(WQ('pl-7', 'DE∥BC、AD:AB $=2:5$。△ADE の面積が $12\\ \\mathrm{cm}^2$ のとき、台形 DBCE の面積は？', 63, [[75, '△ABC の面積（$12\\times\\dfrac{25}{4}$）。台形は、そこから引く。'], [30, '$12\\times2.5$ ではない。面積比 $4:25$。台形は $21$。'], [52, '$75-12-\\ldots$ ではない。$75-12=63$。'], [18, '$12\\times\\dfrac{3}{2}$ ではない。台形は $25-4=21$ にあたる。']], ['相似比 $2:5$。面積比 $4:25$。', '台形 ＝ $25-4=21$ にあたる。△ADE ＝ 4 が 12 なので、1 ＝ 3。$3\\times21=63$。'], '比の1つ分を出す → 台形の分をかける。', mk(2, 3, { fill: [['A', 'D', 'E', '--pos'], ['D', 'B', 'C', 'E', '--neg']] }), U));
  return qs;
}

function figMid() { const D = lerp(TA, TB, 0.5), E = lerp(TA, TC, 0.5); return figGeo({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['A', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], tags: [['A', 'D', 'E', '小']] }); }
function figG3() { const M = lerp(TB, TC, 0.5), G = [(TA[0] + TB[0] + TC[0]) / 3, (TA[1] + TB[1] + TC[1]) / 3]; return figGeo({ pts: { A: TA, B: TB, C: TC, M, G }, fill: [['G', 'B', 'C', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'M', 'd']], tags: [['G', 'B', 'C', '⅓']], dots: ['G'], show: ['A', 'B', 'C', 'M', 'G'] }); }
/* ---- ⑥ 重心 ---- */
function sCent() {
  const M = lerp(TB, TC, 0.5), G = [(TA[0] + TB[0] + TC[0]) / 3, (TA[1] + TB[1] + TC[1]) / 3];
  near(areaP([G, TB, TC]) / areaP([TA, TB, TC]), 1 / 3, 'gc');
  const gf = (fill, len) => figGeo({ pts: { A: TA, B: TB, C: TC, M, G }, fill: fill || [], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'M', 'd'], ['B', [(TA[0] + TC[0]) / 2, (TA[1] + TC[1]) / 2], 'd']].slice(0, 4), len: len || [], dots: ['G'] });
  const full = () => { const N = [(TA[0] + TC[0]) / 2, (TA[1] + TC[1]) / 2], L = [(TA[0] + TB[0]) / 2, (TA[1] + TB[1]) / 2]; return figGeo({ pts: { A: TA, B: TB, C: TC, M, G, N, L }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'M', 'd'], ['B', 'N', 'd'], ['C', 'L', 'd']], dots: ['G'], show: ['A', 'B', 'C', 'M', 'G'] }); };
  const qs = [];
  qs.push(WR('gc-1', '△ABC の辺 BC の中点を M とし、重心を G とする。AG : GM は？', '2:1', [['1:2', '順番がぎゃく。重心は、頂点 A に近い方が長い。'], ['1:1', '1:1 は中点の比。重心は、頂点側が 2。'], ['3:1', '$3:1$ は、AM 全体と GM の比。AG:GM は $2:1$。']], ['重心は、中線を $2:1$ に分ける。', '頂点側が 2、辺の側が 1。'], '重心 → 頂点から $2:1$。', full()));
  qs.push(WQ('gc-2', '△ABC の重心を G とする。△ABC の面積が $18\\ \\mathrm{cm}^2$ のとき、△GBC の面積は？', 6, [[9, '$\\dfrac{1}{2}$ ではない。△GBC は全体の $\\dfrac{1}{3}$。'], [3, '$\\dfrac{1}{6}$ は、3本の中線で分けた6個の1つ。△GBC は2つ分。'], [12, '$\\dfrac{2}{3}$ は、△GBC 以外の部分。']], ['重心 G と各頂点を結ぶと、△ABC は3等分される。', '△GBC ＝ $18\\div3=6$。'], '△GBC ＝ △GCA ＝ △GAB ＝ 全体の $\\dfrac{1}{3}$。', gf([['G', 'B', 'C', '--pos']]), U));
  qs.push(WQ('gc-3', '△ABC の3本の中線を引くと、△ABC は6つの三角形に分かれ、面積はすべて等しい。△ABC の面積が $36\\ \\mathrm{cm}^2$ のとき、1つの面積は？', 6, [[12, '$\\dfrac{1}{3}$ は、△GBC のような2つ分。1つは $\\dfrac{1}{6}$。'], [9, '$\\dfrac{1}{4}$ ではない。6つに分かれる。'], [18, '$\\dfrac{1}{2}$ ではない。6つに分かれる。']], ['3本の中線で、6等分される。', '$36\\div6=6$。'], '中線3本 → 6等分。', full(), U));
  qs.push(WQ('gc-4', '△ABC の重心を G とする。△GAB の面積が $10\\ \\mathrm{cm}^2$ のとき、△ABC の面積は？', 30, [[20, '$10\\times2$ ではない。△GAB は全体の $\\dfrac{1}{3}$ なので $\\times3$。'], [40, '$10\\times4$ ではない。$\\times3$。'], [60, '$10\\times6$ は、1つが $10$ のとき（6等分）。△GAB は2つ分。']], ['△GAB ＝ 全体の $\\dfrac{1}{3}$。', '△ABC ＝ $10\\times3=30$。'], '△G○○ ＝ 全体の $\\dfrac{1}{3}$。', gf([['G', 'A', 'B', '--pos']]), U));
  const D = lerp(TA, TB, 0.5), E = lerp(TA, TC, 0.5); near(areaP([TA, D, E]) / areaP([TA, TB, TC]), 0.25, 'mp');
  qs.push(WQ('gc-5', '△ABC の辺 AB、AC の中点をそれぞれ D、E とする。△ABC の面積が $40\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？', 10, [[20, '$\\dfrac{1}{2}$ ではない。相似比 $1:2$ なので、面積比は $1:4$。'], [5, '$\\dfrac{1}{8}$ ではない。$1:4$。'], [30, '台形 DBCE の面積。△ADE は $\\dfrac{1}{4}$。']], ['DE∥BC、DE ＝ $\\dfrac{1}{2}$BC（中点連結）。相似比 $1:2$。', '面積比 $1:4$。$40\\div4=10$。'], '中点連結 → 小さい三角形は全体の $\\dfrac{1}{4}$。', figMid(), U));
  qs.push(WQ('gc-6', '△ABC の辺 BC の中点を M、重心を G とする。△ABC の面積が $24\\ \\mathrm{cm}^2$ のとき、△GBM の面積は？', 4, [[8, '$\\dfrac{1}{3}$ は △GBC。△GBM は、その半分。'], [12, '$\\dfrac{1}{2}$ は △ABM。△GBM は、さらに小さい。'], [6, '$\\dfrac{1}{4}$ ではない。6等分の1つ。']], ['△GBC ＝ $\\dfrac{1}{3}$ ＝ 8。M は BC の中点 → △GBM ＝ その半分。', '△GBM ＝ $4$。'], '中線で6等分 → △GBM は $\\dfrac{1}{6}$。', gf([['G', 'B', 'M', '--pos']]), U));
  qs.push(WQ('gc-7', '△ABC の重心を G とし、AG の延長が BC と交わる点を M とする。AM $=12\\ \\mathrm{cm}$ のとき、AG の長さは？', 8, [[6, 'AM の半分ではない。AG:GM $=2:1$ なので、$\\dfrac{2}{3}$。'], [4, 'GM の長さ。AG は GM の2倍。'], [9, '$\\dfrac{3}{4}$ ではない。$\\dfrac{2}{3}$。']], ['AG:GM $=2:1$。AG は AM の $\\dfrac{2}{3}$。', 'AG ＝ $12\\times\\dfrac{2}{3}=8$。'], '重心 → 頂点から $\\dfrac{2}{3}$。', full(), ' cm'));
  return qs;
}
/* ---- ⑦ 総合 ---- */
function sSogo() {
  const E1 = lerp(TB, TC, 0.5), D1 = lerp(TA, TB, 2 / 5); near(areaP([TA, D1, E1]) / areaP([TA, TB, TC]), 0.2, 'sg1');
  const qs = [];
  qs.push(WQ('sg-1', '△ABC の辺 AB 上に D（AD:DB $=2:3$）、辺 BC の中点を E とする。△ABC の面積が $60\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？', 12, [[24, '△ABD の面積。△ADE は、△ABE（$\\dfrac{1}{2}$）の $\\dfrac{2}{5}$。'], [30, '△ABE の面積。D は AB 上の点なので、さらに $\\dfrac{2}{5}$。'], [20, '$\\dfrac{1}{3}$ ではない。$\\dfrac{1}{2}\\times\\dfrac{2}{5}=\\dfrac{1}{5}$。']], ['△ABE ＝ 60 の半分 ＝ 30（E は BC の中点）。', '△ADE ＝ △ABE $\\times\\dfrac{AD}{AB}=30\\times\\dfrac{2}{5}=12$。'], '同じ高さの三角形を、順番に使う。', figGeo({ pts: { A: TA, B: TB, C: TC, D: D1, E: E1 }, fill: [['A', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['A', 'E', 'd'], ['D', 'E']], len: [['A', 'D', 2], ['D', 'B', 3]] }), U));
  qs.push(WQ('sg-2', 'DE∥BC、AD:DB $=2:1$。台形 DBCE の面積が $20\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？', 16, [[36, '△ABC の面積。△ADE は、$\\dfrac{4}{9}$。'], [4, '$\\dfrac{1}{9}$ ではない。台形が $9-4=5$ にあたる。'], [8, '$20\\times\\dfrac{2}{5}$ ではない。$20\\div5\\times4$。'], [10, '$20\\div2$ ではない。比 $4:5$。']], ['AD:AB $=2:3$。面積比 $4:9$。台形 ＝ $9-4=5$ にあたる。', '5 が $20$ なので、1 ＝ $4$。△ADE ＝ $4\\times4=16$。'], '台形から逆算 → 比の差を使う。', (() => { const D = lerp(TA, TB, 2 / 3), E = lerp(TA, TC, 2 / 3); return figGeo({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['D', 'B', 'C', 'E', '--neg']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], len: [['A', 'D', 2], ['D', 'B', 1]] }); })(), U));
  qs.push(WQ('sg-3', '台形 ABCD（AD∥BC）で AD $=4\\ \\mathrm{cm}$、BC $=6\\ \\mathrm{cm}$。対角線の交点を O とし、△AOD の面積が $8\\ \\mathrm{cm}^2$ のとき、台形 ABCD の面積は？', 50, [[40, '$8\\times5$ ではない。$a:b=2:3$ なので、全体は $25$。'], [45, '$8\\times5.6$ ではない。$4:6=2:3$ の $(2+3)^2=25$。'], [36, '$8\\times4.5$ ではない。$8\\div4\\times25$。'], [32, '$8\\times4$ ではない。$a^2=4$、全体 $25$。']], ['AD:BC $=4:6=2:3$。$a^2:ab:ab:b^2=4:6:6:9$。合計 $25$。', '△AOD ＝ 4 が $8$ なので、1 ＝ 2。台形 ＝ $25\\times2=50$。'], '長さの比にしてから、4つの面積比 → 合計 $(a+b)^2$。', trap(4, 6), U));
  qs.push(WQ('sg-4', '相似な2つの円錐 P、Q の高さの比が $2:3$。P の側面積が $12\\ \\mathrm{cm}^2$ のとき、Q の側面積は？', 27, [[18, '$\\dfrac{3}{2}$ 倍ではない。面積は2乗で $\\dfrac{9}{4}$ 倍。'], [36, '$12\\times3$ ではない。$4:9$。'], [81, '$12\\times\\dfrac{27}{4}$ は、体積の比で計算している。'], [48, '$12\\times4$ ではない。$12\\div4\\times9$。']], ['相似比 $2:3$。側面積は面積 → $4:9$。', '$12\\div4\\times9=27$。'], '側面積・表面積 → 2乗。', null, U));
  const par = [[0, 0], [8, 0], [10, 4], [2, 4]], Ee = [9, 2]; near(areaP([par[0], par[1], Ee]) / areaP(par), 0.25, 'pa');
  qs.push(WQ('sg-5', '平行四辺形 ABCD の面積が $48\\ \\mathrm{cm}^2$。辺 BC の中点を E とするとき、△ABE の面積は？', 12, [[24, '△ABC の面積。E は BC の中点なので、さらに半分。'], [6, '$\\dfrac{1}{8}$ ではない。△ABC ＝ $\\dfrac{1}{2}$、その半分で $\\dfrac{1}{4}$。'], [16, '$\\dfrac{1}{3}$ ではない。$\\dfrac{1}{4}$。']], ['対角線 AC で、△ABC ＝ 平行四辺形の半分 ＝ 24。', 'E は BC の中点 → △ABE ＝ 24 の半分 ＝ 12。'], '平行四辺形 → 対角線で半分。中点 → さらに半分。', figGeo({ pts: { A: [2, 4], B: [0, 0], C: [8, 0], D: [10, 4], E: [4, 0] }, fill: [['A', 'B', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C', 'd']], len: [['B', 'E', 1], ['E', 'C', 1]] }), U));
  qs.push(WQ('sg-6', '△ABC の辺 AB 上に D（AD:DB $=1:1$）、辺 AC 上に E（AE:EC $=1:2$）がある。△ADE の面積が $5\\ \\mathrm{cm}^2$ のとき、△ABC の面積は？', 30, [[15, '$5\\times3$ ではない。$\\dfrac{1}{2}\\times\\dfrac{1}{3}=\\dfrac{1}{6}$ の逆数 $6$。'], [10, '$5\\times2$ ではない。$\\times6$。'], [60, '$5\\times12$ ではない。AD:AB と AE:AC を使う。'], [20, '$5\\times4$ ではない。$\\times6$。']], ['△ADE ＝ △ABC $\\times\\dfrac{1}{2}\\times\\dfrac{1}{3}=$ △ABC $\\times\\dfrac{1}{6}$。', '△ABC ＝ $5\\times6=30$。'], '辺の比の積 → 逆算は、逆数。', triADE(1, 1, 1, 2).fig, U));
  qs.push(WQ('sg-7', 'DE∥BC、AD:DB $=3:2$。△ADE の面積が $18\\ \\mathrm{cm}^2$ のとき、△ABC の面積は？', 50, [[30, '$18\\times\\dfrac{5}{3}$ ではない。面積は2乗で $\\dfrac{25}{9}$ 倍。'], [45, '$18\\times2.5$ ではない。$18\\div9\\times25$。'], [32, '台形の面積（$50-18$）。△ABC は $18\\times\\dfrac{25}{9}$。'], [90, '$18\\times5$ ではない。$18\\div9\\times25$。']], ['AD:AB $=3:5$。面積比 $9:25$。', '$18\\div9\\times25=50$。'], '相似比 → 2乗 → 比の1つ分。', (() => { const D = lerp(TA, TB, 3 / 5), E = lerp(TA, TC, 3 / 5); return figGeo({ pts: { A: TA, B: TB, C: TC, D, E }, fill: [['A', 'D', 'E', '--pos']], segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], len: [['A', 'D', 3], ['D', 'B', 2]] }); })(), U));
  return qs;
}
const I = {
  h: '<b>まず、ふつうに解いてみよう</b>：△ABC の辺 AB 上に D（AD:DB $=1:1$）、辺 AC 上に E（AE:EC $=3:1$）。△ABC ＝ $32\\ \\mathrm{cm}^2$ のとき、△ADE の面積は？<br>【ふつうの解き方】<br>① 補助線 DC を引く。<br>② △ADC ＝ △ABC の $\\dfrac{1}{2}$ ＝ $16$（高さが同じ → 底辺の比）。<br>③ △ADE ＝ △ADC の $\\dfrac{3}{4}$ ＝ $12$（もう一度、高さが同じ）。<br>補助線を引いて、2回の比で、やっと答え。ここで、手がとまる子が多い。<br><b>裏技なら</b>：$32\\times\\dfrac{1}{2}\\times\\dfrac{3}{4}=12$。<b>1行</b>。補助線もいらない。' + figDC(1, 1, 3, 1).html,
  s: '<b>裏技①</b>：相似な図形の比<br>・面積比 ＝ 相似比の<b>2乗</b>　$m^2:n^2$<br>・体積比 ＝ 相似比の<b>3乗</b>　$m^3:n^3$<br>例：相似比 $2:3$ → 面積比 $4:9$、体積比 $8:27$。' + twoTri(2, 3).html,
  b: '<b>裏技②</b>：<b>高さが同じ</b>三角形は、面積比 ＝ <b>底辺の比</b>。<br>△ABD : △ADC ＝ BD : DC（高さは、A から BC までで同じ）。<br>底辺が同じなら、面積比 ＝ 高さの比。' + triBD(2, 3).fig.html + '<b>中点</b> → 面積は半分ずつ。',
  p: '<b>裏技③</b>：頂点 A を共有する三角形<br>△ADE ＝ △ABC $\\times\\dfrac{AD}{AB}\\times\\dfrac{AE}{AC}$<br>分母は、AD+DB（全体）。<br>' + triADE(1, 2, 1, 1).fig.html + '図の数字は、線分の比。',
  t: '<b>裏技④</b>：台形 ABCD（AD∥BC）の対角線の交点を O、AD $=a$、BC $=b$ とすると<br>△AOD : △AOB : △DOC : △COB ＝ $a^2:ab:ab:b^2$<br>全体 ＝ $(a+b)^2$。<br>ふつうは、△AOD∽△COB の面積比に、△AOB:△AOD ＝ OB:OD も使う…と、手順が長い。' + trap(2, 3).html + '例：AD:BC $=2:3$ → $4:6:6:9$。',
  d: '<b>裏技⑤</b>：DE∥BC のとき △ADE∽△ABC。<br>△ADE : △ABC ＝ $m^2:n^2$、△ADE : 台形 DBCE ＝ $m^2:(n^2-m^2)$。<br>（$m$ ＝ AD、$n$ ＝ AB）' + triADE(1, 2, 1, 2).fig.html,
  g: '<b>裏技⑥</b>：重心 G は、中線を<b>頂点から 2:1</b> に分ける。<br>△GBC ＝ △GCA ＝ △GAB ＝ △ABC の $\\dfrac{1}{3}$。（図の色をぬった △GBC が、全体の $\\dfrac{1}{3}$）' + figG3().html + '3本の中線で、△ABC は<b>6等分</b>される。<br><b>中点連結</b>：D、E が AB、AC の中点のとき、色をぬった <b>小さい三角形 △ADE</b> は、△ABC の $\\dfrac{1}{4}$。' + figMid().html,
  z: '<b>総まとめ</b>：図形の面積の問題は、<br>① 相似 → 2乗　② 高さが同じ → 底辺の比　③ 頂点を共有 → 辺の比の積　④ 台形の対角線 → $a^2,ab,ab,b^2$。<br>この4つで、図形の大問の面積は、ほぼ解ける。'
};
const ABOUT = {
  a: [{ p: '相似な図形は、比で決まる。' }, { p: RT([['面積比', '→', '相似比の2乗'], ['体積比', '→', '相似比の3乗'], ['同じ高さ', '→', '面積比 ＝ 底辺の比']]) }, { cap: '比だけで、面積が出せる。' }],
  b: [{ p: '4つの型で、面積の大問が解ける。' }, { p: RT([['頂点を共有', '→', '辺の比の積'], ['台形の対角線', '→', '$a^2:ab:ab:b^2$'], ['DE∥BC', '→', '$m^2:(n^2-m^2)$']]) }, { cap: '図に、比を書き込んでから使う。' }],
  c: [{ p: '重心と中点、それから総まとめ。' }, { p: RT([['重心', '→', '2:1、全体の $\\dfrac{1}{3}$'], ['中点', '→', '半分ずつ'], ['中点連結', '→', '全体の $\\dfrac{1}{4}$']]) }, { cap: '入試で出る形を、まとめて練習する。' }]
};
const PARTS = [
  { id: 'a', title: '相似と同じ高さ', sub: 'ふつうの解き方・基本', about: ABOUT.a, aboutTitle: 'まず見てみよう：基本の2つ', aboutSub: '相似比の2乗、同じ高さ',
    steps: [{ id: 'a-0', title: 'ふつうに解くと…', sub: '補助線・2回の比', intro: I.h, qs: sHard() }, { id: 'a-1', title: '相似比 → 面積比・体積比', sub: '2乗と3乗', intro: I.s, qs: sSim() }, { id: 'a-2', title: '同じ高さの三角形', sub: '面積比 ＝ 底辺の比', intro: I.b, qs: sBase() }] },
  { id: 'b', title: '4つの型', sub: '辺の比・台形・平行線', about: ABOUT.b, aboutTitle: 'まず見てみよう：4つの型', aboutSub: '図に比を書き込む',
    steps: [{ id: 'b-1', title: '辺の比の積', sub: '全体との比をかける', intro: I.p, qs: sProd() }, { id: 'b-2', title: '台形の対角線', sub: 'a²・ab・ab・b²', intro: I.t, qs: sTrap() }, { id: 'b-3', title: 'DE∥BC で切る', sub: '三角形と台形の比', intro: I.d, qs: sPar() }] },
  { id: 'c', title: '重心と総合', sub: '中線・入試', about: ABOUT.c, aboutTitle: 'まず見てみよう：重心と中点', aboutSub: '2:1、6等分',
    steps: [{ id: 'c-1', title: '重心と中点', sub: '2:1・6等分', intro: I.g, qs: sCent() }, { id: 'c-2', title: '入試レベルの総合', sub: '型を組み合わせる', intro: I.z, qs: sSogo() }] }
];
const RBM = { '相似比': 'そうじひ', '相似': 'そうじ', '面積比': 'めんせきひ', '面積': 'めんせき', '体積比': 'たいせきひ', '体積': 'たいせき', '重心': 'じゅうしん', '台形': 'だいけい', '対角線': 'たいかくせん', '平行四辺形': 'へいこうしへんけい', '平行': 'へいこう', '中線': 'ちゅうせん', '中点': 'ちゅうてん', '三角形': 'さんかくけい', '四角形': 'しかくけい', '底辺': 'ていへん', '円錐': 'えんすい', '側面積': 'そくめんせき', '表面積': 'ひょうめんせき', '立体': 'りったい', '頂点': 'ちょうてん', '平方根': 'へいほうこん', '交点': 'こうてん' };
const RBR = new RegExp(Object.keys(RBM).sort((a, b) => b.length - a.length).join('|'), 'g');
const RB = s => s.replace(RBR, w => '<ruby>' + w + '<rt>' + RBM[w] + '</rt></ruby>');
const ruby = o => typeof o === 'string' ? o.split(/(<svg[\s\S]*?<\/svg>)/).map((t, k) => k % 2 ? t : RB(t)).join('')
  : Array.isArray(o) ? o.map(ruby) : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, (k === 'expr' || k === 'id' || k === 'html') ? v : ruby(v)])) : o;
const out = '// 自動生成（node genS.js）。手で直すときは genS.js を直す。\nconst PARTS = ' + JSON.stringify(ruby(PARTS)) + ';\nif (typeof module !== \'undefined\') module.exports = PARTS;\n';
fs.writeFileSync(path.join(__dirname, 'src/data.js'), out);
let n = 0; PARTS.forEach(P => P.steps.forEach(s => { n += s.qs.length; }));
console.log('src/data.js を作成：' + n + '問、' + (out.length / 1024).toFixed(0) + 'KB');
