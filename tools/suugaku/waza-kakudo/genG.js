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

/* ===== 図形・角度ツール ===== */
const near = (a, b, m) => { if (Math.abs(a - b) > 1e-6) throw new Error('検算ちがい ' + m + ' ' + a + ' vs ' + b); };
const RAD = Math.PI / 180;
const vec = (p, q) => [q[0] - p[0], q[1] - p[1]];
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const add = (p, v, k) => [p[0] + v[0] * (k === undefined ? 1 : k), p[1] + v[1] * (k === undefined ? 1 : k)];
const ang = (P, Q, R) => { const a = unit(vec(Q, P)), b = unit(vec(Q, R)); return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))) / RAD; };
const polar = (c, r, deg) => [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)];
function isect(p, d1, q, d2) { const det = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(det) < 1e-12) throw new Error('平行'); const t = ((q[0] - p[0]) * d2[1] - (q[1] - p[1]) * d2[0]) / det; return [p[0] + d1[0] * t, p[1] + d1[1] * t]; }
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const rnd = x => Math.round(x * 1e6) / 1e6;
const labAng = (Q, P, R, d, text, col) => { const u = unit(add(unit(vec(Q, P)), unit(vec(Q, R)))); const m = add(Q, u, d); return [m[0], m[1], text, col || '--neg']; };
/* 汎用の図：pts, fill, segs([a,b,'d']), len, tx([x,y,文字,色]), circles([cx,cy,r]), show */
function figGeo(o) {
  const nm = Object.keys(o.pts), xs = nm.map(n => o.pts[n][0]), ys = nm.map(n => o.pts[n][1]);
  const minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
  const sc = Math.min(200 / (maxx - minx || 1), 135 / (maxy - miny || 1));
  const ox = (260 - (maxx - minx) * sc) / 2 - minx * sc, oy = 26;
  const P = n => [+(ox + o.pts[n][0] * sc).toFixed(1), +(oy + (maxy - o.pts[n][1]) * sc).toFixed(1)];
  const Q = p => [+(ox + p[0] * sc).toFixed(1), +(oy + (maxy - p[1]) * sc).toFixed(1)];
  const shown = o.show || nm;
  const cx = shown.map(n => P(n)[0]).reduce((a, b) => a + b, 0) / (shown.length || 1), cy = shown.map(n => P(n)[1]).reduce((a, b) => a + b, 0) / (shown.length || 1);
  const out = (x, y, d) => { const vx = x - cx, vy = y - cy, l = Math.hypot(vx, vy) || 1; return [x + vx / l * d, y + vy / l * d]; };
  let s = '';
  (o.circles || []).forEach(c => { const p = Q([c[0], c[1]]); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (c[2] * sc).toFixed(1) + '" fill="none"' + S_('stroke:var(--fg);stroke-width:2.2') + '/>'; });
  (o.fill || []).forEach(f => { const col = f[f.length - 1], names = f.slice(0, -1); s += '<polygon points="' + names.map(n => P(n).join(',')).join(' ') + '" fill="var(' + col + ')" fill-opacity=".22"' + S_('stroke:none') + '/>'; });
  (o.segs || []).forEach(g => { const a = P(g[0]), b = P(g[1]); s += ln(a[0], a[1], b[0], b[1], g[2] === 'd' ? '--muted' : (g[2] === 'p' ? '--pos' : '--fg'), g[2] === 'd' ? 1.6 : 2.4, g[2] === 'd'); });
  (o.tx || []).forEach(t => { const p = Q(t); s += txc(p[0], p[1] + 5, t[2], t[3] || '--neg'); });
  shown.forEach(n => { const p = P(n), q = out(p[0], p[1], 13); s += txc(q[0], q[1] + 5, o.rename && o.rename[n] ? o.rename[n] : n, '--fg'); });
  (o.dots || []).forEach(n => { const p = P(n); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="var(--pos)"/>'; });
  return { type: 'svg', html: svgW(190, s) };
}
const AU = '°';
const WQ = (id, p, t, ws, steps, point, fig) => Object.assign(NQ(id, p, t, ws.map(c => [Math.round(c[0] * 1e6) / 1e6, c[1]]).filter(c => Number.isInteger(c[0]) && c[0] > 0 && c[0] <= 3600), steps, point, AU), fig ? { fig } : {});
const DG = n => '$' + n + '^\\circ$';
/* 三角形 B(0,0) C(6,0)、角 B・C から A を作る */
function triBC(bd, cd) { const B = [0, 0], C = [6, 0], AB = 6 * Math.sin(cd * RAD) / Math.sin((bd + cd) * RAD); return { A: polar(B, AB, bd), B, C }; }

/* ---- ⓪ ふつうに解くと（ブーメラン型） ---- */
function bmg(Bd, Cd, bd, cd) {
  const T = triBC(Bd, Cd), A = T.A, B = T.B, C = T.C;
  const P = isect(B, [Math.cos((Bd - bd) * RAD), Math.sin((Bd - bd) * RAD)], C, [Math.cos((180 - Cd + cd) * RAD), Math.sin((180 - Cd + cd) * RAD)]);
  const dirBP = unit(vec(B, P)), D = isect(B, dirBP, A, vec(A, C));
  const Ad = 180 - Bd - Cd;
  near(ang(B, A, C), Ad, 'A'); near(ang(A, B, P), bd, 'b'); near(ang(A, C, P), cd, 'c');
  near(ang(B, P, C), Ad + bd + cd, 'bmg');
  return { A, B, C, P, D, Ad };
}
function figBmg(g, hid, ext) {
  const o = { pts: { A: g.A, B: g.B, C: g.C, P: g.P }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['B', 'P'], ['C', 'P']], fill: [['B', 'P', 'C', '--pos']], dots: ['P'], tx: [] };
  if (ext) { o.pts.D = g.D; o.segs.push(['P', 'D', 'd']); }
  return o;
}
function sHard() {
  const A1 = bmg(70, 60, 20, 25), qs = [];
  const mk = (g, extra) => { const o = figBmg(g, false, true); o.tx = [labAng(g.A, g.B, g.C, 0.9, g.Ad + '°', '--neg'), labAng(g.B, g.A, g.P, 0.85, '', '--neg')].filter(t => t[2]); return Object.assign(o, extra || {}); };
  const f1 = (g, bd, cd, lab) => { const o = mk(g); o.tx = [labAng(g.A, g.B, g.C, 1.4, g.Ad + '°'), labAng(g.B, g.A, g.P, 1.2, bd + '°'), labAng(g.C, g.A, g.P, 1.2, cd + '°')]; if (lab) o.tx.push([g.P[0], g.P[1] - 0.55, 'x', '--neg']); return figGeo(o); };
  qs.push(WQ('ft-1', '【ふつうの解き方】△ABC の内側に点 P がある。∠A ＝ ' + DG(50) + '、∠ABP ＝ ' + DG(20) + '、∠ACP ＝ ' + DG(25) + '。∠BPC（図の x）を求めたい。まず BP を延長して、AC との交点を D とする。∠BDC は？', 70, [[20, '$\\angle ABP$ だけではない。外角の定理で、$\\angle A+\\angle ABD$。'], [50, '$\\angle A$ だけではない。外角は2つの内角の和。'], [110, '$180-70$ ではない。$\\angle BDC$ は △ABD の外角。'], [95, 'これは最後の答え（∠BPC）。まだ途中。']], ['△ABD で、∠BDC は ∠ADB の外角。', '外角の定理：∠BDC ＝ ∠A ＋ ∠ABD ＝ $50+20=70$。（1回目）'], '補助線 → 外角の定理（1回目）。', f1(A1, 20, 25, true)));
  qs.push(WQ('ft-2', '【つづき】∠BDC ＝ ' + DG(70) + '。△PDC に注目する。∠ACP ＝ ' + DG(25) + '。∠BPC は ∠PDC の外角のとき、∠BPC は？', 95, [[70, '∠BDC の大きさ。∠BPC は、さらに ∠ACP をたす。'], [25, '∠ACP の大きさ。∠BPC は、70 とのたし算。'], [45, '$70-25$ ではない。外角はたし算。'], [85, '$70+15$ ではない。$70+25$。']], ['△PDC で、∠BPC は ∠DPC の外角。', '外角の定理：∠BPC ＝ ∠PDC ＋ ∠PCD ＝ $70+25=95$。（2回目）'], '補助線のあと、もう1回外角の定理。', f1(A1, 20, 25, true)));
  const A2 = bmg(75, 65, 25, 20);
  qs.push(WQ('ft-3', '【別の問題】△ABC の内側に点 P。∠A ＝ ' + DG(40) + '、∠ABP ＝ ' + DG(25) + '、∠ACP ＝ ' + DG(20) + '。BP を延長して AC と交わる点を D とする。∠BDC は？', 65, [[25, '$\\angle ABP$ だけ。外角は $\\angle A+\\angle ABD$。'], [40, '$\\angle A$ だけ。$\\angle ABD=25$ もたす。'], [115, '$180-65$ ではない。外角はたし算。'], [85, 'これは最後の答え（∠BPC）。まだ途中。']], ['∠BDC は △ABD の外角。', '∠BDC ＝ ∠A ＋ ∠ABD ＝ $40+25=65$。（1回目）'], '外角の定理（1回目）。', f1(A2, 25, 20, true)));
  qs.push(WQ('ft-4', '【つづき】∠BDC ＝ ' + DG(65) + '、∠ACP ＝ ' + DG(20) + '。∠BPC は？', 85, [[65, '∠BDC の大きさ。∠ACP をたす。'], [20, '∠ACP の大きさ。∠BDC とたす。'], [45, '$65-20$ ではない。たし算。'], [105, '$65+40$ ではない。$65+20$。']], ['△PDC の外角：∠BPC ＝ ∠PDC ＋ ∠PCD ＝ $65+20=85$。（2回目）'], '2回目の外角の定理で、やっと答え。', f1(A2, 25, 20, true)));
  const A3 = bmg(68, 52, 18, 24);
  qs.push(WQ('ft-5', '【もう1問】△ABC の内側に点 P。∠A ＝ ' + DG(60) + '、∠ABP ＝ ' + DG(18) + '、∠ACP ＝ ' + DG(24) + '。BP を延長して AC との交点 D をとる。∠BDC は？', 78, [[18, '$\\angle ABP$ だけ。$\\angle A$ もたす。'], [60, '$\\angle A$ だけ。$\\angle ABD=18$ もたす。'], [102, 'これは最後の答え（∠BPC）。まだ途中。']], ['∠BDC ＝ ∠A ＋ ∠ABD ＝ $60+18=78$。（1回目）'], '1回目の外角の定理。', f1(A3, 18, 24, true)));
  qs.push(WQ('ft-6', '【つづき】∠BDC ＝ ' + DG(78) + '、∠ACP ＝ ' + DG(24) + '。∠BPC は？', 102, [[78, '∠BDC の大きさ。∠ACP をたす。'], [54, '$78-24$ ではない。たし算。'], [24, '∠ACP の大きさ。∠BDC ととたす。'], [90, '$78+12$ ではない。$78+24$。']], ['∠BPC ＝ ∠BDC ＋ ∠ACP ＝ $78+24=102$。（2回目）'], '補助線を引いて、外角の定理を2回。', f1(A3, 18, 24, true)));
  qs.push(RAWQ('ft-7', '【裏技なら】△ABC の内側の点 P で、∠BPC は、∠A、∠ABP、∠ACP から、どう求める？', '3つの角を足し算する', [['どれか1つだけ使う', '3つとも使う。'], ['∠A − ∠ABP − ∠ACP', '引き算ではなく、足し算。'], ['180° − (3つの角の和)', '$180-$ ではなく、そのまま足す。']], ['補助線もいらない。', '∠BPC ＝ ∠A ＋ ∠ABP ＋ ∠ACP。足し算1回で出る。'], '裏技は、補助線なし・足し算だけ。', { fig: f1(A1, 20, 25, true) }));
  return qs;
}

/* ---- ① 外角の定理 ---- */
function sExt() {
  const L = [[50, 60], [35, 40], [70, 45], [28, 64], [65, 55]], qs = [];
  const fig = (Ad, Bd, hide) => { const T = triBC(Bd, 180 - Ad - Bd), D = [8.2, 0]; const o = { pts: { A: T.A, B: T.B, C: T.C, D }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']], tx: [labAng(T.A, T.B, T.C, 1.4, Ad + '°'), labAng(T.B, T.A, T.C, 1.3, Bd + '°'), [7.0, 0.75, 'x', '--neg']], show: ['A', 'B', 'C', 'D'] }; return figGeo(o); };
  L.forEach(([Ad, Bd], i) => { const T = triBC(Bd, 180 - Ad - Bd), D = [9, 0]; near(ang(T.A, T.C, D), Ad + Bd, 'ext'); const t = Ad + Bd, Cd = 180 - t;
    qs.push(WQ('ex-' + (i + 1), '△ABC の辺 BC を C の側に延長して D とする。∠A ＝ ' + DG(Ad) + '、∠B ＝ ' + DG(Bd) + '。外角 ∠ACD（図の x）は？', t, [[Cd, 'これは内角 ∠ACB。外角は、∠ACB の反対側。'], [Ad, '∠A だけ。∠B もたす。'], [Bd, '∠B だけ。∠A もたす。'], [180 - Ad, '$180-\\angle A$ ではない。外角は、離れた2つの内角の和。']], ['外角 ∠ACD は、となりの内角 ∠ACB 以外の、2つの内角の和。', '∠ACD ＝ ∠A ＋ ∠B ＝ $' + Ad + '+' + Bd + '=' + t + '$。'], '外角 ＝ 離れた2つの内角の和。', fig(Ad, Bd))); });
  qs.push(WQ('ex-6', '△ABC の辺 BC を C の側に延長して D とする。外角 ∠ACD ＝ ' + DG(120) + '、∠A ＝ ' + DG(50) + '。∠B は？', 70, [[60, '$180-120$ は ∠ACB。∠B ではない。'], [170, '$120+50$ ではない。外角から ∠A を引く。'], [130, '$180-50$ ではない。'], [50, '∠A と同じではない。$120-50$。']], ['外角 ＝ 離れた2つの内角の和。', '$\\angle B=120-50=70$。'], '外角 − もう1つの内角 ＝ 残りの内角。', fig(50, 70)));
  qs.push(WQ('ex-7', '△ABC の辺 BC を C の側に延長して D とする。外角 ∠ACD ＝ ' + DG(110) + '、∠B ＝ ' + DG(40) + '。∠A は？', 70, [[150, '$110+40$ ではない。外角から ∠B を引く。'], [30, '$110-80$ ではない。$110-40$。'], [40, '∠B と同じではない。$110-40$。']], ['外角 ＝ ∠A ＋ ∠B。', '$\\angle A=110-40=70$。'], '外角から1つの内角を引く。', fig(70, 40)));
  return qs;
}
/* ---- ② ブーメラン型 ---- */
function sBmg() {
  const L = [[70, 60, 20, 25], [75, 65, 25, 20], [80, 55, 30, 15], [65, 65, 20, 20], [68, 52, 18, 24]], qs = [];
  const fig = (g, bd, cd, x) => figGeo({ pts: { A: g.A, B: g.B, C: g.C, P: g.P }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['B', 'P'], ['C', 'P']], fill: [['B', 'P', 'C', '--pos']], tx: [labAng(g.A, g.B, g.C, 1.4, (g.Ad !== undefined && x !== 'A' ? g.Ad + '°' : 'a')), labAng(g.B, g.A, g.P, 1.3, bd + '°'), labAng(g.C, g.A, g.P, 1.3, cd + '°'), [g.P[0], g.P[1] - 0.6, x === 'A' ? '?' : 'x', '--neg']], dots: ['P'] });
  L.forEach(([Bd, Cd, bd, cd], i) => { const g = bmg(Bd, Cd, bd, cd), Ad = g.Ad, t = Ad + bd + cd;
    qs.push(WQ('bm-' + (i + 1), '△ABC の内側に点 P がある。∠A ＝ ' + DG(Ad) + '、∠ABP ＝ ' + DG(bd) + '、∠ACP ＝ ' + DG(cd) + '。∠BPC（図の x）は？', t, [[Ad + bd, '∠ACP をたし忘れている。3つとも足す。'], [Ad + cd, '∠ABP をたし忘れている。3つとも足す。'], [bd + cd, '∠A をたし忘れている。3つとも足す。'], [180 - t, '$180-$ ではない。3つの和がそのまま答え。'], [Ad - bd - cd, '引き算ではなく、足し算。']], ['矢じり（ブーメラン）型。∠BPC ＝ ∠A ＋ ∠ABP ＋ ∠ACP。', '$' + Ad + '+' + bd + '+' + cd + '=' + t + '$。'], '∠BPC ＝ 3つの角の和（足し算だけ）。', fig(g, bd, cd, 'x'))); });
  { const g = bmg(70, 60, 20, 30), Ad = g.Ad, x = Ad + 20 + 30;
    qs.push(WQ('bm-6', '△ABC の内側に点 P がある。∠A ＝ ' + DG(Ad) + '、∠ABP ＝ ' + DG(20) + '、∠BPC ＝ ' + DG(x) + '。∠ACP は？', 30, [[x - Ad, '$x-\\angle A$ は、∠ABP と ∠ACP の和。∠ABP も引く。'], [x - 20, '$x-\\angle ABP$ は、∠A と ∠ACP の和。∠A も引く。'], [x + 20, '足し算ではない。$x$ から引く。'], [20, '∠ABP と同じではない。$x-\\angle A-\\angle ABP$。']], ['∠BPC ＝ ∠A ＋ ∠ABP ＋ ∠ACP。', '$\\angle ACP=' + x + '-' + Ad + '-20=30$。'], '和から、分かっている2つを引く。', fig(g, 20, 30, 'A'))); }
  { const g = bmg(75, 55, 15, 25), Ad = g.Ad, x = Ad + 15 + 25;
    qs.push(WQ('bm-7', '△ABC の内側に点 P がある。∠ABP ＝ ' + DG(15) + '、∠ACP ＝ ' + DG(25) + '、∠BPC ＝ ' + DG(x) + '。∠A は？', 50, [[x - 15, '∠ACP も引く。$x-15-25$。'], [x - 25, '∠ABP も引く。$x-15-25$。'], [x, '$x$ そのもの。$x-15-25$。'], [x - 15 - 25 + 10, 'ひき算の数をまちがえている。']], ['∠BPC ＝ ∠A ＋ ∠ABP ＋ ∠ACP。', '$\\angle A=' + x + '-15-25=50$。'], '和から、分かっている2つを引く。', fig(g, 15, 25, 'A'))); }
  return qs;
}
/* ---- ③ 星形 ---- */
function starFig(tips, ask) {
  const arcs = tips.map((t, k) => 0), n = 5;
  // tip_i = a_{i+2} / 2 → a_k = 2*tip_{k-2}
  for (let k = 0; k < n; k++) arcs[k] = 2 * tips[((k - 2) % n + n) % n];
  const V = []; let th = 90; for (let i = 0; i < n; i++) { V.push(polar([0, 0], 3, th)); th -= arcs[i]; }
  // 検算：V_i の角（V_{i+2} と V_{i-2} のあいだ）
  for (let i = 0; i < n; i++) near(ang(V[(i + 2) % n], V[i], V[(i + 3) % n]), tips[i], 'star' + i);
  const pts = {}; const nameS = ['A', 'B', 'C', 'D', 'E']; V.forEach((v, i) => { pts[nameS[i]] = v; });
  const segs = []; for (let i = 0; i < n; i++) segs.push([nameS[i], nameS[(i + 2) % n]]);
  const rename = {}; tips.forEach((t, i) => { rename[nameS[i]] = i === ask ? 'x' : t + '°'; });
  return figGeo({ pts, segs, rename });
}
function sStar() {
  const L = [[30, 40, 50, 20, 40], [35, 45, 25, 50, 25], [20, 60, 30, 40, 30], [50, 35, 45, 25, 25], [28, 52, 36, 44, 20]], qs = [];
  L.forEach((tp, i) => { const tips = tp.slice(0, 4).concat([180 - tp.slice(0, 4).reduce((a, b) => a + b, 0)]); near(tips[4], tp[4], 'tipsum');
    qs.push(WQ('st-' + (i + 1), '星形の5つの先端の角が、$' + tips.slice(0, 4).join('^\\circ,\\ ') + '^\\circ$、と $x$。$x$ は？', tp[4], [[360 - tips.slice(0, 4).reduce((a, b) => a + b, 0), '先端の角の和は、$360^\\circ$ ではなく $180^\\circ$。'], [tp[4] + 10, '$180^\\circ$ から、4つの和を引く。'], [tp[4] - 10 > 0 ? tp[4] - 10 : tp[4] + 20, '$180^\\circ$ から、4つの和を引く。'], [540 - tips.slice(0, 4).reduce((a, b) => a + b, 0), '五角形の内角の和ではない。先端の角の和は $180^\\circ$。']], ['星形の5つの先端の角の和は $180^\\circ$。', '$x=180-(' + tips.slice(0, 4).join('+') + ')=' + tp[4] + '$。'], '星形の先端の角の和 ＝ $180^\\circ$。', starFig(tips, 4))); });
  qs.push(WQ('st-6', '正五角形の頂点を1つおきに結んだ星形で、1つの先端の角は？', 36, [[180, '5つの先端の和。1つは $180\\div5$。'], [72, '$180\\div5$ ではない。$360\\div5$ になっている。'], [108, '正五角形の内角。先端の角は $180\\div5$。'], [45, '$180\\div4$ ではない。先端は5つ。']], ['正五角形だから、5つの先端の角は、すべて等しい。', '$180\\div5=36$。'], '先端の和 $180^\\circ$ を、5で割る。', starFig([36, 36, 36, 36, 36], -1)));
  qs.push(WQ('st-7', '星形の5つの先端の角の和は？', 180, [[360, '$360^\\circ$ ではない。$180^\\circ$。'], [540, '五角形の内角の和。先端の角の和は $180^\\circ$。'], [90, '$90^\\circ$ ではない。$180^\\circ$。'], [270, '$270^\\circ$ ではない。$180^\\circ$。']], ['5つの先端の角の和は、いつも $180^\\circ$。'], '星形の先端の和 ＝ $180^\\circ$。', starFig([30, 40, 50, 20, 40], -1)));
  return qs;
}
/* ---- ④ 平行線と折れ線 ---- */
function parFig(a, b, ask) {
  const H = 6, A = [0, H], B = [1.4, 0];
  const P = isect(A, [Math.cos(-a * RAD), Math.sin(-a * RAD)], B, [Math.cos(b * RAD), Math.sin(b * RAD)]);
  if (!(P[1] > 0.6 && P[1] < H - 0.6)) throw new Error('P が外 ' + [a, b]);
  near(ang(A, P, B), a + b, 'par');
  const K = [A[0] + 3, A[1]], L = [B[0] + 3, B[1]];
  const f = { pts: { l1: [-2, H], l2: [8, H], m1: [-2, 0], m2: [8, 0], A, B, P }, segs: [['l1', 'l2'], ['m1', 'm2'], ['A', 'P'], ['B', 'P']], show: ['A', 'B', 'P'], tx: [[A[0] + 1.3, A[1] - 0.55, ask === 'a' ? '?' : a + '°', ask === 'a' ? '--neg' : '--pos'], [B[0] + 1.35, B[1] + 0.6, ask === 'b' ? '?' : b + '°', ask === 'b' ? '--neg' : '--pos'], [P[0] - 0.65, P[1], ask === 'x' ? 'x' : (a + b) + '°', ask === 'x' ? '--neg' : '--pos'], [7.4, H + 0.55, 'l', '--fg'], [7.4, 0.55, 'm', '--fg']] };
  return { fig: figGeo(f), P };
}
function sPar() {
  const L = [[30, 45], [25, 38], [52, 28], [40, 35], [33, 22]], qs = [];
  L.forEach(([a, b], i) => { const t = a + b, pf = parFig(a, b, 'x');
    qs.push(WQ('pl-' + (i + 1), '平行な2直線 $l$、$m$ のあいだに、折れ線 A-P-B がある。図の ' + DG(a) + '、' + DG(b) + ' のとき、∠APB（図の x）は？', t, [[180 - t, '$180-$ ではない。2つの角を足すだけ。'], [Math.abs(a - b), '引き算ではなく、足し算。'], [a, '∠a だけ。∠b もたす。'], [b, '∠b だけ。∠a もたす。']], ['P を通る平行線を考える（または、折れ線の法則）。', '∠APB ＝ ∠a ＋ ∠b ＝ $' + a + '+' + b + '=' + t + '$。'], '平行線にはさまれた折れ線：x ＝ 両側の角の和。', pf.fig)); });
  { const pf = parFig(50, 35, 'a'); qs.push(WQ('pl-6', '平行な2直線 $l$、$m$ のあいだに折れ線 A-P-B。∠APB ＝ ' + DG(85) + '、図の ∠b ＝ ' + DG(35) + '。? の角は？', 50, [[120, '$85+35$ ではない。引き算。'], [85, '∠APB と同じではない。$85-35$。'], [35, '∠b と同じではない。$85-35$。'], [60, '$85-25$ ではない。$85-35$。']], ['∠APB ＝ ∠a ＋ ∠b。', '$\\angle a=85-35=50$。'], '和から、分かっている角を引く。', pf.fig)); }
  { const pf = parFig(45, 25, 'b'); qs.push(WQ('pl-7', '平行な2直線 $l$、$m$ のあいだに折れ線 A-P-B。∠APB ＝ ' + DG(70) + '、図の ∠a ＝ ' + DG(45) + '。? の角は？', 25, [[115, '$70+45$ ではない。引き算。'], [70, '∠APB と同じではない。$70-45$。'], [45, '∠a と同じではない。$70-45$。'], [35, '$70-35$ ではない。$70-45$。']], ['∠APB ＝ ∠a ＋ ∠b。', '$\\angle b=70-45=25$。'], '和から、分かっている角を引く。', pf.fig)); }
  return qs;
}
/* ---- ⑤ 内心（角の二等分線） ---- */
function incFig(Ad, Bd, Cd, ex) {
  const T = triBC(Bd, Cd), A = T.A, B = T.B, C = T.C;
  const db = add(unit(vec(B, A)), unit(vec(B, C))), dc = add(unit(vec(C, A)), unit(vec(C, B)));
  const I = isect(B, db, C, dc);
  const E = isect(B, [-db[1], db[0]], C, [-dc[1], dc[0]]);
  const X = ex ? E : I;
  near(ang(B, I, C), 90 + Ad / 2, 'inc'); near(ang(B, E, C), 90 - Ad / 2, 'exc');
  const f = { pts: { A, B, C, [ex ? 'E' : 'I']: X }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['B', ex ? 'E' : 'I'], ['C', ex ? 'E' : 'I']], dots: [ex ? 'E' : 'I'] };
  if (ex) { f.pts.Bx = add(B, unit(vec(A, B)), 2.2); f.pts.Cx = add(C, unit(vec(A, C)), 2.2); f.segs.push(['B', 'Bx', 'd'], ['C', 'Cx', 'd']); f.show = ['A', 'B', 'C', 'E']; }
  return figGeo(f);
}
function sInc() {
  const L = [[60, 50, 70], [80, 60, 40], [40, 70, 70], [100, 40, 40]], qs = [];
  L.forEach(([Ad, Bd, Cd], i) => { const t = 90 + Ad / 2;
    qs.push(WQ('ic-' + (i + 1), '△ABC で、∠B と ∠C の二等分線の交点を I とする。∠A ＝ ' + DG(Ad) + ' のとき、∠BIC は？', t, [[90 + Ad, '$\\dfrac{1}{2}$ をかけ忘れている。$90+\\dfrac{\\angle A}{2}$。'], [180 - (Bd + Cd) / 2, 'これは正しい計算に見えるが、数字を入れ直す。∠B と ∠C は、半分ずつで $90+\\dfrac{A}{2}$。'], [90 - Ad / 2, '$90-\\dfrac{A}{2}$ は、外側の二等分線のとき。'], [Ad / 2, '$\\dfrac{A}{2}$ だけではない。$90$ をたす。']].filter((c, k) => !(k === 1)), ['内心 I：∠BIC ＝ $90^\\circ+\\dfrac{1}{2}\\angle A$。', '$90+' + (Ad / 2) + '=' + t + '$。'], '二等分線2本 → ∠BIC ＝ $90+\\dfrac{A}{2}$。', incFig(Ad, Bd, Cd, false))); });
  qs.push(WQ('ic-5', '△ABC で、∠B と ∠C の二等分線の交点を I とする。∠BIC ＝ ' + DG(125) + ' のとき、∠A は？', 70, [[35, '$125-90=35$ は、$\\dfrac{A}{2}$。$A$ は、その2倍。'], [55, '$180-125$ ではない。$(125-90)\\times2$。'], [140, '$125+15$ ではない。$(125-90)\\times2$。'], [250, '$125\\times2$ ではない。$(125-90)\\times2$。']], ['∠BIC ＝ $90+\\dfrac{A}{2}$。', '$\\dfrac{A}{2}=125-90=35$。$A=70$。'], '逆算：$(\\angle BIC-90)\\times2$。', incFig(70, 55, 55, false)));
  qs.push(WQ('ic-6', '△ABC で、∠B と ∠C の二等分線の交点を I とする。∠BIC ＝ ' + DG(100) + ' のとき、∠A は？', 20, [[10, '$100-90=10$ は、$\\dfrac{A}{2}$。$A$ は、その2倍。'], [80, '$180-100$ ではない。$(100-90)\\times2$。'], [40, '$(100-90)\\times4$ ではない。$\\times2$。'], [200, '$100\\times2$ ではない。$(100-90)\\times2$。']], ['∠BIC ＝ $90+\\dfrac{A}{2}$。', '$\\dfrac{A}{2}=10$。$A=20$。'], '逆算：$(\\angle BIC-90)\\times2$。', incFig(20, 80, 80, false)));
  qs.push(WQ('ic-7', '△ABC の辺 AB、AC を延長してできる外角の二等分線が、B、C から出て交わる点を E とする。∠A ＝ ' + DG(60) + ' のとき、∠BEC は？', 60, [[120, '$90+\\dfrac{A}{2}$ は、内側の二等分線のとき。外側は $90-\\dfrac{A}{2}$。'], [30, '$\\dfrac{A}{2}$ だけ。$90-\\dfrac{A}{2}$。'], [90, '$90$ だけ。$\\dfrac{A}{2}$ を引く。'], [150, '$90+60$ ではない。外側は $90-\\dfrac{A}{2}$。']], ['外側（外角）の二等分線は、$90^\\circ-\\dfrac{1}{2}\\angle A$。', '$90-30=60$。'], '内側は $90+\\dfrac{A}{2}$、外側は $90-\\dfrac{A}{2}$。', incFig(60, 50, 70, true)));
  return qs;
}

/* ---- ⑥ 多角形 ---- */
function polyFig(n, label) {
  const R = 3, V = []; for (let i = 0; i < n; i++) V.push(polar([0, 0], R, 90 + 360 * i / n));
  const pts = {}, names = []; V.forEach((v, i) => { pts[String.fromCharCode(65 + i)] = v; names.push(String.fromCharCode(65 + i)); });
  const segs = []; for (let i = 0; i < n; i++) segs.push([names[i], names[(i + 1) % n]]);
  const X = add(V[1], unit(vec(V[0], V[1])), 1.8); pts.X = X; segs.push([names[1], 'X', 'd']);
  const tg = add(V[1], unit(add(unit(vec(V[1], X)), unit(vec(V[1], V[2])))), 0.7);
  return figGeo({ pts, segs, tx: [[tg[0], tg[1], label || 'x', '--neg']], show: names });
}
function sPoly() {
  const qs = [];
  qs.push(WQ('pg-1', '六角形の内角の和は？', 720, [[540, '五角形の内角の和。六角形は $180\\times(6-2)$。'], [360, '$360^\\circ$ は外角の和。内角の和は $180(n-2)$。'], [1080, '八角形の内角の和。六角形は $n=6$。']], ['内角の和 ＝ $180\\times(n-2)$。', '$180\\times(6-2)=720$。'], '内角の和 ＝ $180(n-2)$。', null));
  qs.push(WQ('pg-2', '正八角形の1つの外角（図の x）は？', 45, [[135, '正八角形の1つの内角。外角は $360\\div8$。'], [60, '$360\\div6$ ではない。八角形は $360\\div8$。'], [40, '$360\\div9$ ではない。$360\\div8$。']], ['外角の和は、いつも $360^\\circ$。', '正八角形の外角は、すべて等しい。$360\\div8=45$。'], '正n角形の1つの外角 ＝ $360\\div n$。', polyFig(8, 'x')));
  qs.push(WQ('pg-3', '正八角形の1つの内角は？', 135, [[45, '正八角形の1つの外角。内角は、$180-45$。'], [1080, '内角の和。1つの内角は、$180-45$。'], [120, '正六角形の1つの内角。八角形は $180-45$。']], ['外角 ＝ $360\\div8=45$。', '内角 ＝ $180-45=135$。'], '1つの内角 ＝ $180^\\circ-$ 外角。', polyFig(8, '45°')));
  qs.push(WQ('pg-4', '正十二角形の1つの内角は？', 150, [[30, '正十二角形の1つの外角。内角は $180-30$。'], [1800, '内角の和。1つの内角は $180-30$。'], [135, '正八角形の1つの内角。十二角形は $180-30$。']], ['外角 ＝ $360\\div12=30$。', '内角 ＝ $180-30=150$。'], '1つの内角 ＝ $180-360\\div n$。', polyFig(12, '30°')));
  qs.push(Object.assign(NQ('pg-5', '1つの外角が $40^\\circ$ の正多角形は、何角形？', 9, [[8, '$360\\div45$ のとき。$360\\div40=9$。'], [10, '$360\\div36$ のとき。$360\\div40=9$。'], [140, '$180-40$ は内角。角の数は、$360\\div40$。'], [320, '$360-40$ ではない。$360\\div40$。']], ['外角の和は $360^\\circ$。', '$360\\div40=9$。'], '外角から、$n=360\\div$外角。', '角形'), { fig: polyFig(9, '40°') }));
  qs.push(WQ('pg-6', '五角形の4つの内角が ' + DG(100) + '、' + DG(110) + '、' + DG(120) + '、' + DG(130) + ' のとき、残りの内角は？', 80, [[100, '$540-440$ ではない。$540-460=80$。'], [460, '4つの和。五角形の内角の和は $540^\\circ$。'], [60, '$540-480$ ではない。$540-460$。']], ['五角形の内角の和 ＝ $180\\times3=540$。', '$540-(100+110+120+130)=80$。'], '内角の和から、4つの和を引く。', null));
  qs.push(Object.assign(NQ('pg-7', '1つの内角が $156^\\circ$ の正多角形は、何角形？', 15, [[12, '正十二角形の内角は $150^\\circ$。'], [10, '正十角形の内角は $144^\\circ$。'], [24, '外角 $24^\\circ$ の値。角の数は $360\\div24$。'], [14, '$360\\div26$ ではない。外角は $180-156=24$。']], ['外角 ＝ $180-156=24$。', '$360\\div24=15$。'], '内角 → 外角 → $360\\div$外角。', '角形'), {}));
  return qs;
}
/* ---- ⑦ 円周角 ---- */
function circFig(o) {
  const c = [0, 0], pts = { O: c, h1: [-3, -3], h2: [3, 3], h3: [-3, 3], h4: [3, -3] }, shown = ['O'].concat(Object.keys(o.p)), segs = [], tx = [];
  Object.keys(o.p).forEach(k => { pts[k] = polar(c, 3, o.p[k]); });
  Object.keys(o.extra || {}).forEach(k => { pts[k] = o.extra[k]; shown.push(k); });
  (o.s || []).forEach(g => segs.push(g));
  (o.t || []).forEach(t => tx.push(t));
  return figGeo({ pts, circles: [[0, 0, 3]], segs, tx, show: shown.filter(n => n !== 'O' || o.showO), dots: o.showO ? ['O'] : [] });
}
function sCirc() {
  const qs = [];
  { const pp = { A: 220, B: 320, P: 90 }; const O = [0, 0], A = polar(O, 3, 220), B = polar(O, 3, 320), P = polar(O, 3, 90); near(ang(A, O, B), 100, 'cen'); near(ang(A, P, B), 50, 'cir');
    qs.push(WQ('cr-1', '円 O の周上に3点 A、B、P がある。中心角 ∠AOB ＝ ' + DG(100) + ' のとき、円周角 ∠APB（図の x）は？', 50, [[100, '中心角と同じではない。円周角は半分。'], [200, '2倍ではない。円周角は、中心角の半分。'], [80, '$180-100$ ではない。円周角は $100\\div2$。']], ['円周角 ＝ 中心角の $\\dfrac{1}{2}$。', '$100\\div2=50$。'], '円周角 ＝ 中心角 ÷ 2。', circFig({ p: pp, s: [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], t: [[0, -1.0, '100°', '--pos'], [0, 1.9, 'x', '--neg']], showO: true }))); }
  { const pp = { A: 220, B: 320, P: 90 }; const O = [0, 0], A = polar(O, 3, 220), B = polar(O, 3, 320), P = polar(O, 3, 90); near(ang(A, P, B), 50, 'c2');
    qs.push(WQ('cr-2', '円 O の周上に3点 A、B、P がある。円周角 ∠APB ＝ ' + DG(35) + ' のとき、中心角 ∠AOB（図の x）は？', 70, [[35, '円周角と同じではない。中心角は2倍。'], [17.5 + 0.5, '半分ではない。中心角は2倍。'], [145, '$180-35$ ではない。中心角は $35\\times2$。']], ['中心角 ＝ 円周角の2倍。', '$35\\times2=70$。'], '中心角 ＝ 円周角 × 2。', circFig({ p: pp, s: [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], t: [[0, -1.0, 'x', '--neg'], [0, 1.9, '35°', '--pos']], showO: true }))); }
  { const A = polar([0, 0], 3, 180), B = polar([0, 0], 3, 0), Cc = polar([0, 0], 3, 70); near(ang(A, Cc, B), 90, 'dia'); near(ang(B, A, Cc), 35, 'dia2');
    const pp = { A: 180, B: 0, C: 70 }; qs.push(WQ('cr-3', '円で、AB は直径。円周上に点 C をとる。∠CAB ＝ ' + DG(35) + ' のとき、∠ABC は？', 55, [[35, '∠CAB と同じではない。直径の円周角は $90^\\circ$。'], [90, '∠ACB ＝ $90^\\circ$。∠ABC は、残りの角。'], [145, '$180-35$ ではない。$90-35$。']], ['直径に対する円周角 ∠ACB ＝ $90^\\circ$。', '∠ABC ＝ $90-35=55$。'], '直径 → 円周角 $90^\\circ$。', circFig({ p: pp, s: [['A', 'B'], ['A', 'C'], ['B', 'C']], t: [[-1.9, 0.5, '35°', '--pos']] }))); }
  { const pp = { A: 200, B: 340, C: 70, D: 130 }; const O = [0, 0], A = polar(O, 3, 200), B = polar(O, 3, 340), Cc = polar(O, 3, 70), D = polar(O, 3, 130); near(ang(A, Cc, B), ang(A, D, B), 'same');
    const v = Math.round(ang(A, Cc, B)); qs.push(WQ('cr-4', '円周上に4点 A、B、C、D がある（C、D は同じ側）。∠ACB ＝ ' + DG(v) + ' のとき、∠ADB は？', v, [[2 * v, '2倍ではない。同じ弧 AB の円周角は等しい。'], [Math.round(v / 2), '半分ではない。同じ弧の円周角は等しい。'], [180 - v, '$180-$ ではない。等しい。']], ['同じ弧 AB に対する円周角は、すべて等しい。', '∠ADB ＝ ∠ACB ＝ ' + v + '°。'], '同じ弧の円周角は等しい。', circFig({ p: pp, s: [['A', 'C'], ['B', 'C'], ['A', 'D'], ['B', 'D']], t: [] }))); }
  { const pp = { A: 100, B: 200, C: 300, D: 350 }; const O = [0, 0], A = polar(O, 3, 100), B = polar(O, 3, 200), Cc = polar(O, 3, 300), D = polar(O, 3, 350); const dA = Math.round(ang(B, A, D)), dC = Math.round(ang(B, Cc, D)); near(dA + dC, 180, 'cyc');
    qs.push(WQ('cr-5', '円に内接する四角形 ABCD で、∠A ＝ ' + DG(dA) + ' のとき、∠C は？', dC, [[dA, '∠A と同じではない。向かい合う角の和は $180^\\circ$。'], [360 - dA, '$360-$ ではない。$180-\\angle A$。'], [90, '$90^\\circ$ ではない。$180-\\angle A$。']], ['円に内接する四角形：向かい合う角の和は $180^\\circ$。', '∠C ＝ $180-' + dA + '=' + dC + '$。'], '内接四角形：対角の和 ＝ $180^\\circ$。', circFig({ p: pp, s: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']], t: [] }))); }
  { const pp = { A: 100, B: 200, C: 300, D: 350 }; const E = add(polar([0, 0], 3, 300), unit(vec(polar([0, 0], 3, 200), polar([0, 0], 3, 300))), 1.6); const O = [0, 0], A = polar(O, 3, 100), B = polar(O, 3, 200), Cc = polar(O, 3, 300), D = polar(O, 3, 350); const dA = Math.round(ang(B, A, D)); near(ang(D, Cc, E), dA, 'ext');
    const f = circFig({ p: pp, s: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['C', 'E', 'd']], extra: { E }, t: [] });
    qs.push(WQ('cr-6', '円に内接する四角形 ABCD で、辺 BC を C の側に延長した点を E とする。∠A ＝ ' + DG(dA) + ' のとき、外角 ∠DCE は？', dA, [[180 - dA, '$180-$ ではない。外角は、向かいの内角に等しい。'], [2 * dA, '2倍ではない。外角 ＝ 向かいの内角 ∠A。'], [360 - dA, '$360-$ ではない。外角 ＝ ∠A。']], ['∠BCD ＝ $180-\\angle A$（対角の和）。', '外角 ∠DCE ＝ $180-\\angle BCD=\\angle A$。'], '内接四角形の外角 ＝ 向かいの内角。', f));
    // 検算のみ（図に延長線なし）
  }
  { const pp = { A: 90, B: 162, C: 234, D: 306, E: 18 }; const O = [0, 0], A = polar(O, 3, 90), B = polar(O, 3, 162), Cc = polar(O, 3, 234); near(ang(A, Cc, B), 36, 'pent');
    qs.push(WQ('cr-7', '円周を5等分する点を A、B、C、D、E とする。∠ACB は？', 36, [[72, '中心角 $72^\\circ$。円周角は、その半分。'], [108, '正五角形の内角。∠ACB は円周角。'], [18, '$72\\div4$ ではない。$72\\div2$。']], ['弧 AB の中心角 ＝ $360\\div5=72$。', '円周角 ∠ACB ＝ $72\\div2=36$。'], '等分した弧 → 中心角 → ÷2。', circFig({ p: pp, s: [['A', 'B'], ['A', 'C'], ['B', 'C']], t: [] }))); }
  return qs;
}
/* ---- ⑧ 総合 ---- */
function sSog() {
  const qs = [];
  { const V = []; for (let i = 0; i < 5; i++) V.push(polar([0, 0], 3, 90 - 72 * i)); near(ang(V[1], V[0], V[2]), 36, 'pent');
    qs.push(WQ('sg-1', '正五角形 ABCDE で、∠BAC は？', 36, [[108, '正五角形の内角 ∠BAE。∠BAC は、その一部。'], [72, '外角 $72^\\circ$ ではない。△ABC は AB＝BC の二等辺三角形。'], [54, '$(180-72)\\div2$ ではない。∠ABC ＝ $108$、底角は $(180-108)\\div2$。']], ['正五角形の1つの内角は $108^\\circ$。', '△ABC は AB＝BC の二等辺三角形。∠BAC ＝ $(180-108)\\div2=36$。'], '正n角形 → 内角 → 二等辺三角形の底角。', figGeo({ pts: { A: V[0], B: V[1], C: V[2], D: V[3], E: V[4] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'A'], ['A', 'C', 'd']] }))); }
  { const V = []; for (let i = 0; i < 6; i++) V.push(polar([0, 0], 3, 90 - 60 * i)); near(ang(V[0], V[2], V[3]), 90, 'hex');
    qs.push(WQ('sg-2', '正六角形 ABCDEF で、∠ACD は？', 90, [[120, '正六角形の内角 ∠BCD。∠ACD は、その一部。'], [60, '∠ACD ではなく、∠CAD のような角。'], [30, '∠ACB（底角）。∠ACD は、$120-30$。']], ['∠BCD ＝ $120^\\circ$。△ABC は二等辺で、∠ACB ＝ $30^\\circ$。', '∠ACD ＝ $120-30=90$。'], '正六角形 → 内角 $120^\\circ$ → 二等辺の底角 $30^\\circ$。', figGeo({ pts: { A: V[0], B: V[1], C: V[2], D: V[3], E: V[4], F: V[5] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'A'], ['A', 'C', 'd']] }))); }
  { const V = []; for (let i = 0; i < 10; i++) V.push(polar([0, 0], 3, 90 - 36 * i)); near(ang(V[1], V[0], V[2]), 18, 'dec');
    qs.push(WQ('sg-3', '正十角形 ABCDEFGHIJ で、∠BAC は？', 18, [[36, '外角 $36^\\circ$ ではない。∠BAC は底角。'], [144, '正十角形の内角。∠BAC は底角。'], [72, '$144\\div2$ ではない。底角は $(180-144)\\div2$。']], ['外角 ＝ $360\\div10=36$。内角 ＝ $144$。', '△ABC は二等辺。∠BAC ＝ $(180-144)\\div2=18$。'], '正n角形 → 内角 → 底角。', figGeo({ pts: { A: V[0], B: V[1], C: V[2], D: V[3], E: V[4], F: V[5], G: V[6], H: V[7], I: V[8], J: V[9] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'G'], ['G', 'H'], ['H', 'I'], ['I', 'J'], ['J', 'A'], ['A', 'C', 'd']] }))); }
  { const T = triBC(70, 70); near(ang(T.A, T.C, [9, 0]), 110, 'iso');
    qs.push(WQ('sg-4', '二等辺三角形 ABC（AB＝AC）で、∠A ＝ ' + DG(40) + '。辺 BC を C の側に延長した点を D とするとき、∠ACD は？', 110, [[70, '∠ACB（底角）。外角はその反対側。'], [140, '$40\\times\\ldots$ ではない。外角は、離れた2つの内角の和。'], [40, '∠A だけ。∠B もたす。']], ['底角 ∠B ＝ ∠C ＝ $(180-40)\\div2=70$。', '外角 ∠ACD ＝ ∠A ＋ ∠B ＝ $40+70=110$。'], '底角を出して、外角の定理。', figGeo({ pts: { A: T.A, B: T.B, C: T.C, D: [9, 0] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']], tx: [labAng(T.A, T.B, T.C, 1, '40°', '--pos')] }))); }
  { const A = [0, 0], B = [3, 0], C = [3, 3], D = [0, 3], E = [1.5, 3 - 1.5 * Math.sqrt(3)]; const Ed = [1.5, 3 - 1.5 * Math.sqrt(3)];
    const Ei = [1.5, 3 - 1.5 * 1.7320508075688772 * 1]; const Ein = lerp([0, 3], [3, 3], 0.5); const E2 = [1.5, 3 - (3 * Math.sqrt(3) / 2)];
    const sq = [[0, 0], [3, 0], [3, 3], [0, 3]], Ep = [1.5, 3 * Math.sqrt(3) / 2 > 3 ? 0 : 3 - 3 * Math.sqrt(3) / 2];
    const Ein2 = [1.5, 3 - 3 * Math.sqrt(3) / 2]; // CD=3 を1辺とする正三角形（正方形の内側）
    near(ang([0, 3], [1.5, 3 - 3 * Math.sqrt(3) / 2], [0, 0]), 75, 'sq'); // A=(0,0)? D=(0,3)
    qs.push(WQ('sg-5', '正方形 ABCD の内側に、辺 CD を1辺とする正三角形 CDE をつくる。∠AED は？', 75, [[60, '正三角形の角。∠AED は別の角。'], [45, '$90\\div2$ ではない。△DAE は DA＝DE の二等辺三角形。'], [105, '$180-75$ ではない。頂角は $90-60=30$、底角は $(180-30)\\div2$。']], ['∠ADE ＝ $90-60=30$。', '△DAE は DA＝DE の二等辺三角形。∠AED ＝ $(180-30)\\div2=75$。'], '正方形＋正三角形 → 二等辺三角形の底角。', figGeo({ pts: { A: [0, 0], B: [3, 0], C: [3, 3], D: [0, 3], E: Ein2 }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['C', 'E'], ['D', 'E'], ['A', 'E', 'd']] }))); }
  { const O = [0, 0], V = []; for (let i = 0; i < 6; i++) V.push(polar(O, 3, 90 - 60 * i)); near(ang(V[0], V[2], V[4]), 60, 'tri'); // 90, 90-120=-30(=330)... 点0,2,4
    qs.push(WQ('sg-6', '円周を6等分する点を A、B、C、D、E、F とする。∠ACE は？', 60, [[30, '∠ACB のような角。∠ACE は、弧 AE に対する円周角。'], [120, '弧 AE（中心角 $120^\\circ$）。円周角は、その半分。'], [90, '$90^\\circ$ ではない。弧 AE の中心角 $120^\\circ$ の半分。']], ['弧 AE（Cを通らない側）の中心角 ＝ $360\\div6\\times2=120$。', '円周角 ∠ACE ＝ $120\\div2=60$。'], '等分 → 中心角 → ÷2。', circFig({ p: { A: 90, B: 30, C: -30, D: -90, E: -150, F: 150 }, s: [['A', 'C'], ['C', 'E'], ['E', 'A']], t: [] }))); }
  { const pp = { A: 180, B: 0, C: 90 }; const O = [0, 0], A = polar(O, 3, 180), B = polar(O, 3, 0), Cc = polar(O, 3, 90); near(ang(Cc, A, B), 45, 'dia45');
    qs.push(WQ('sg-7', '円で、AB は直径。円周上の点 C が AC＝BC となる位置にあるとき、∠CAB は？', 45, [[90, '∠ACB ＝ $90^\\circ$。∠CAB は、残りを2等分した底角。'], [60, '正三角形ではない。∠C ＝ $90^\\circ$、底角は $(180-90)\\div2$。'], [30, '$30^\\circ$ ではない。$(180-90)\\div2=45$。']], ['直径に対する円周角 ∠ACB ＝ $90^\\circ$。', '△ABC は AC＝BC の二等辺。∠CAB ＝ $(180-90)\\div2=45$。'], '直径 → $90^\\circ$ → 二等辺の底角。', circFig({ p: pp, s: [['A', 'B'], ['A', 'C'], ['B', 'C']], t: [[-1.7, 0.55, '?', '--neg']] }))); }
  return qs;
}
const I = {
  h: '<b>まず、ふつうに解いてみよう</b>：△ABC の内側に点 P。∠A ＝ $50^\\circ$、∠ABP ＝ $20^\\circ$、∠ACP ＝ $25^\\circ$。∠BPC は？<br>【ふつうの解き方】<br>① BP を延長して、AC との交点 D をとる。<br>② △ABD の外角：∠BDC ＝ $50+20=70$。<br>③ △PDC の外角：∠BPC ＝ $70+25=95$。<br>補助線を引いて、外角の定理を2回。<br><b>裏技なら</b>：$50+20+25=95$。<b>足し算1回</b>。補助線もいらない。' + figGeo(Object.assign(figBmg(bmg(70, 60, 20, 25), false, true), { tx: [] })).html,
  e: '<b>裏技①</b>：三角形の<b>外角</b> ＝ となりにない<b>2つの内角の和</b>。<br>∠ACD ＝ ∠A ＋ ∠B。' + (function () { const T = triBC(60, 70); return figGeo({ pts: { A: T.A, B: T.B, C: T.C, D: [9, 0] }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']], tx: [labAng(T.A, T.B, T.C, 0.9, 'A'), labAng(T.B, T.A, T.C, 1.0, 'B'), [7.0, 0.75, '外角', '--neg']] }).html; })() + '外角から1つの内角を引けば、もう1つの内角が出る。',
  b: '<b>裏技②</b>：矢じり（ブーメラン）型<br>∠BPC ＝ ∠A ＋ ∠ABP ＋ ∠ACP<br><b>3つの角の足し算</b>。補助線は、いらない。' + figBmg(bmg(70, 60, 20, 25), false, false) && figGeo({ pts: { A: bmg(70, 60, 20, 25).A, B: [0, 0], C: [6, 0], P: bmg(70, 60, 20, 25).P }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['B', 'P'], ['C', 'P']], fill: [['B', 'P', 'C', '--pos']], dots: ['P'] }).html,
  s: '<b>裏技③</b>：星形の<b>5つの先端の角の和</b> ＝ $180^\\circ$。<br>どんな形の星でも、先端の角を足すと $180^\\circ$。' + starFig([30, 40, 50, 20, 40], -1).html,
  p: '<b>裏技④</b>：平行線にはさまれた折れ線<br>∠APB ＝ ∠a ＋ ∠b（両側の角の和）。' + parFig(30, 45, 'x').fig.html + 'P を通る平行線を引く方法でも同じ答え。裏技は、すぐに足せる。',
  i: '<b>裏技⑤</b>：∠B と ∠C の<b>二等分線</b>の交点を I とすると<br>∠BIC ＝ $90^\\circ+\\dfrac{1}{2}\\angle A$。<br>外側（外角）の二等分線のときは $90^\\circ-\\dfrac{1}{2}\\angle A$。' + incFig(60, 50, 70, false).html,
  g: '<b>裏技⑥</b>：多角形の角<br>内角の和 ＝ $180(n-2)$、外角の和 ＝ $360^\\circ$。<br>正n角形の1つの外角 ＝ $360\\div n$、1つの内角 ＝ $180-360\\div n$。' + polyFig(8, '45°').html,
  c: '<b>裏技⑦</b>：円周角<br>・円周角 ＝ 中心角の半分<br>・同じ弧の円周角は等しい　・直径 → $90^\\circ$<br>・内接四角形：対角の和 $180^\\circ$（外角 ＝ 向かいの内角）' + circFig({ p: { A: 220, B: 320, P: 90 }, s: [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], t: [[0, -1.0, '2倍', '--pos'], [0, 1.9, '半分', '--neg']], showO: true }).html,
  z: '<b>総まとめ</b>：角度の問題は、<br>① 外角 ＝ 2つの内角の和　② ブーメラン ＝ 3つの和　③ 星形 ＝ 先端の和 $180^\\circ$<br>④ 折れ線 ＝ 両側の和　⑤ 内心 ＝ $90+\\dfrac{A}{2}$　⑥ 多角形・円周角。<br>この型を見つけたら、補助線を引く前に、足し算。'
};
const ABOUT = {
  a: [{ p: '補助線を引く前に、<b>型</b>を探す。' }, { p: RT([['外角', '→', '2つの内角の和'], ['ブーメラン', '→', '3つの和'], ['星形', '→', '先端の和 $180^\\circ$']]) }, { cap: '足し算だけで、角度が出る。' }],
  b: [{ p: '平行線と、内心。' }, { p: RT([['折れ線', '→', '両側の和'], ['内心', '→', '$90+\\dfrac{A}{2}$'], ['外側', '→', '$90-\\dfrac{A}{2}$']]) }, { cap: '型を見つけたら、補助線なし。' }],
  c: [{ p: '多角形・円と、総まとめ。' }, { p: RT([['多角形', '→', '$180(n-2)$、外角 $360\\div n$'], ['円周角', '→', '中心角の半分'], ['内接四角形', '→', '対角の和 $180^\\circ$']]) }, { cap: '入試で出る形を、まとめて練習する。' }]
};
const PARTS = [
  { id: 'a', title: '三角形の角', sub: 'ふつう・外角・ブーメラン・星形', about: ABOUT.a, aboutTitle: 'まず見てみよう：足し算の裏技', aboutSub: '外角・ブーメラン・星形',
    steps: [{ id: 'a-0', title: 'ふつうに解くと…', sub: '補助線・外角を2回', intro: I.h, qs: sHard() }, { id: 'a-1', title: '外角の定理', sub: '2つの内角の和', intro: I.e, qs: sExt() }, { id: 'a-2', title: 'ブーメラン型', sub: '3つの角の和', intro: I.b, qs: sBmg() }, { id: 'a-3', title: '星形', sub: '先端の和は180°', intro: I.s, qs: sStar() }] },
  { id: 'b', title: '平行線と内心', sub: '折れ線・二等分線', about: ABOUT.b, aboutTitle: 'まず見てみよう：折れ線と内心', aboutSub: '両側の和、90＋A/2',
    steps: [{ id: 'b-1', title: '平行線と折れ線', sub: '両側の角の和', intro: I.p, qs: sPar() }, { id: 'b-2', title: '角の二等分線', sub: '90°＋A/2', intro: I.i, qs: sInc() }] },
  { id: 'c', title: '多角形・円・総合', sub: '内角・外角・円周角', about: ABOUT.c, aboutTitle: 'まず見てみよう：多角形と円', aboutSub: '外角360°、円周角は半分',
    steps: [{ id: 'c-1', title: '多角形の角', sub: '内角の和・外角の和', intro: I.g, qs: sPoly() }, { id: 'c-2', title: '円周角', sub: '半分・等しい・90°', intro: I.c, qs: sCirc() }, { id: 'c-3', title: '入試レベルの総合', sub: '型を組み合わせる', intro: I.z, qs: sSog() }] }
];
const RBM = { '外角': 'がいかく', '内角': 'ないかく', '多角形': 'たかくけい', '円周角': 'えんしゅうかく', '中心角': 'ちゅうしんかく', '二等分線': 'にとうぶんせん', '内接': 'ないせつ', '平行線': 'へいこうせん', '折れ線': 'おれせん', '二等辺三角形': 'にとうへんさんかくけい', '正多角形': 'せいたかくけい', '直径': 'ちょっけい', '正方形': 'せいほうけい', '対角': 'たいかく', '五角形': 'ごかくけい', '六角形': 'ろっかくけい', '八角形': 'はっかくけい', '十角形': 'じっかくけい', '十二角形': 'じゅうにかくけい', '星形': 'ほしがた', '先端': 'せんたん', '内心': 'ないしん', '三角形': 'さんかくけい', '四角形': 'しかくけい', '延長': 'えんちょう', '補助線': 'ほじょせん', '正五角形': 'せいごかくけい', '正六角形': 'せいろっかくけい', '正八角形': 'せいはっかくけい', '底角': 'ていかく', '頂角': 'ちょうかく' };
const RBR = new RegExp(Object.keys(RBM).sort((a, b) => b.length - a.length).join('|'), 'g');
const RB = s => s.replace(RBR, w => '<ruby>' + w + '<rt>' + RBM[w] + '</rt></ruby>');
const ruby = o => typeof o === 'string' ? o.split(/(<svg[\s\S]*?<\/svg>)/).map((t, k) => k % 2 ? t : RB(t)).join('')
  : Array.isArray(o) ? o.map(ruby) : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, (k === 'expr' || k === 'id' || k === 'html') ? v : ruby(v)])) : o;
const out = '// 自動生成（node genG.js）。手で直すときは genG.js を直す。\nconst PARTS = ' + JSON.stringify(ruby(PARTS)) + ';\nif (typeof module !== \'undefined\') module.exports = PARTS;\n';
fs.writeFileSync(path.join(__dirname, 'src/data.js'), out);
let n = 0; PARTS.forEach(P => P.steps.forEach(s => { n += s.qs.length; }));
console.log('src/data.js を作成：' + n + '問、' + (out.length / 1024).toFixed(0) + 'KB');
