// レベル0の問題データ生成: node gen0.js -> src/data.js
// 手書き10問（src/handmade.js）＋ 計算で作る問題。誤答は「よくあるまちがい」から作り、理由も一緒に付ける。
const fs = require('fs'), path = require('path');

let seed = 20261017;
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

/* ================= A. 倍数と約数 ================= */
function genBai() {
  const out = [];
  [[4, 6], [7, 5], [6, 7], [9, 4], [8, 6]].forEach(([k, m], i) => {
    const t = k * m, cands = [];
    [1, -1, 2, -2, 3].forEach(dx => {
      const x = t + dx;
      if (x > 0 && x % k !== 0) cands.push({ v: x, tex: T(x), why: x + '÷' + k + '＝' + Math.floor(x / k) + ' あまり ' + (x % k) + '。あまりが出るので、' + k + 'の倍数ではないよ。' });
    });
    const row = []; for (let j = 1; j <= m; j++) row.push(k * j);
    out.push(build({
      id: 'bai-' + (i + 1), expr: String(t), p: '$' + k + '$ の倍数は、どれ？', truth: { v: t, tex: T(t) }, cands,
      steps: [k + 'の倍数は、' + k + ' に 1、2、3、… をかけた数。', k + 'の段を言ってみる：$' + LT(row) + '$。', '$' + t + '=' + k + '\\times' + m + '$ なので、答えは <b>' + t + '</b>。'],
      point: 'ある数の倍数は、その数に1、2、3…をかけた数。九九の「段」と同じ。'
    }));
  });
  out.push(build({
    id: 'bai-6', expr: '6', p: '1から20までの数の中に、$3$ の倍数は何こある？', truth: { v: 6, tex: '6' },
    cands: [
      { v: 5, tex: '5', why: '18 を数え忘れていないかな。3、6、9、12、15、18 の6こ。' },
      { v: 7, tex: '7', why: '21 まで数えていないかな。21は20をこえているので入らない。' },
      { v: 3, tex: '3', why: '3は、3の倍数のうちの1つ目だけ。3、6、9、… と、20までぜんぶ数えよう。' }
    ],
    steps: ['3の段を言う：$3,\\ 6,\\ 9,\\ 12,\\ 15,\\ 18$。', '次は21で、20をこえる。', '数えると <b>6こ</b>。'],
    point: '「〜までの中に」と言われたら、その数をこえる直前まで数える。'
  }));
  out.push(build({
    id: 'bai-7', expr: '[8,16,24]', raw: false, p: '$8$ の倍数を、小さい順に3つ書いたものは？',
    truth: { v: [8, 16, 24], tex: LT([8, 16, 24]) },
    cands: [
      { v: [16, 24, 32], tex: LT([16, 24, 32]), why: '8自身も、8の倍数（$8\\times1$）。いちばん小さい倍数は8だよ。' },
      { v: [4, 8, 12], tex: LT([4, 8, 12]), why: 'これは4の倍数。8の倍数は、8ずつふえる数。' },
      { v: [8, 18, 28], tex: LT([8, 18, 28]), why: '10ずつふえているよ。8の倍数は、8ずつふえる。' }
    ],
    steps: ['$8\\times1=8$、$8\\times2=16$、$8\\times3=24$。', '答えは $8,\\ 16,\\ 24$。'],
    point: '倍数は、その数自身からはじまる。8の倍数は、8、16、24…。'
  }));
  out.push(build({
    id: 'bai-8', expr: '14', p: '次のうち、$3$ の倍数<b>でない</b>のは、どれ？', truth: { v: 14, tex: '14' },
    cands: [6, 12, 15, 9].map(x => ({ v: x, tex: T(x), why: '$' + x + '=3\\times' + (x / 3) + '$。3の段にあるので、3の倍数だよ。答えではない。' })),
    steps: ['3の段は、$3,\\ 6,\\ 9,\\ 12,\\ 15,\\ 18$、…。', '14 は、12と15の間で、3の段にない。', '$14\\div3=4$ あまり $2$ で、わり切れない。'],
    point: '倍数かどうかは、その数でわり切れるかで調べられる。'
  }));
  out.push(build({
    id: 'bai-9', expr: '51', p: '次のうち、$3$ の倍数は、どれ？<br>（ヒント：各けたの数を足して、それが3の倍数か見る）', truth: { v: 51, tex: '51' },
    cands: [[52, 7], [53, 8], [55, 10]].map(([x, s]) => ({ v: x, tex: T(x), why: String(x).split('').join('＋') + '＝' + s + ' で、3の倍数ではない。だから ' + x + ' も3の倍数ではない。' })),
    steps: ['各けたを足す。$5+1=6$。', '6は3の倍数なので、51も3の倍数。', '$51=3\\times17$。'],
    point: '3の倍数は、各けたの数を足した数も3の倍数になる。'
  }));
  return out;
}

function genYaku() {
  const out = [];
  [12, 18, 20, 15].forEach((n, i) => {
    const d = divisors(n), mid = d[Math.floor(d.length / 2) - 1] || d[1];
    const noNd = []; for (let x = 2; x < n; x++) if (n % x !== 0) { noNd.push(x); break; }
    const nd = noNd[0];
    const withExtra = d.concat([nd]).sort((a, b) => a - b);
    const missMid = d.filter(x => x !== mid);
    const cands = [
      { v: d.filter(x => x !== 1 && x !== n), tex: LT(d.filter(x => x !== 1 && x !== n)), why: '1と、' + n + '自身も約数。$1\\times' + n + '=' + n + '$ だから。' },
      { v: [n, 2 * n, 3 * n, 4 * n], tex: LT([n, 2 * n, 3 * n, 4 * n]), why: 'これは ' + n + ' の<b>倍数</b>。約数は、' + n + ' を「わり切れる数」。小さい数が多くなる。' },
      { v: withExtra, tex: LT(withExtra), why: n + '÷' + nd + ' は わり切れない（あまりが出る）ので、' + nd + ' は約数ではないよ。' },
      { v: missMid, tex: LT(missMid), why: mid + ' が ぬけているよ。$' + n + '\\div' + mid + '=' + (n / mid) + '$ とわり切れるので、' + mid + ' も約数。' },
      { v: d.slice(0, -1), tex: LT(d.slice(0, -1)), why: n + ' 自身も約数。$' + n + '\\div' + n + '=1$ とわり切れる。' }
    ];
    out.push(build({
      id: 'yaku-' + (i + 1), expr: JSON.stringify(d), p: '$' + n + '$ の約数を、すべて書いたものは？', truth: { v: d, tex: LT(d) }, cands,
      steps: ['約数は、' + n + ' を<b>わり切れる数</b>。1から順に、わり切れるか調べる。', d.map(x => '$' + n + '\\div' + x + '=' + (n / x) + '$').join('、') + '。', '答えは $' + LT(d) + '$。2つずつ（' + d[0] + 'と' + d[d.length - 1] + '、…）ペアになっている。'],
      point: '約数は「わり切れる数」。1と、その数自身も、かならず約数に入る。'
    }));
  });
  out.push(build({
    id: 'yaku-5', expr: '8', p: '$12$ の約数<b>でない</b>数は、どれ？', truth: { v: 8, tex: '8' },
    cands: [3, 4, 6, 2].map(x => ({ v: x, tex: T(x), why: '$12\\div' + x + '=' + (12 / x) + '$ とわり切れるので、' + x + ' は12の約数。答えではない。' })),
    steps: ['$12\\div8=1$ あまり $4$。', 'あまりが出るので、8は12の約数ではない。'],
    point: '約数かどうかは、わって あまりが0になるかで決まる。'
  }));
  out.push(build({
    id: 'yaku-6', expr: '15', p: '$15$ の約数のうち、いちばん<b>大きい</b>数は？', truth: { v: 15, tex: '15' },
    cands: [
      { v: 5, tex: '5', why: '5は約数だけれど、15自身も約数。$15\\div15=1$。いちばん大きい約数は、その数自身。' },
      { v: 3, tex: '3', why: '3は約数だけれど、もっと大きい約数がある。' },
      { v: 30, tex: '30', why: '30は15の<b>倍数</b>。約数は、15以下の数だけ。' }
    ],
    steps: ['15の約数は $1,\\ 3,\\ 5,\\ 15$。', 'いちばん大きいのは、その数自身の <b>15</b>。'],
    point: '約数でいちばん大きいのは、その数自身。いちばん小さいのは1。'
  }));
  out.push(build({
    id: 'yaku-7', expr: '6', p: '$20$ の約数は、全部でいくつある？', truth: { v: 6, tex: '6' },
    cands: [
      { v: 4, tex: '4', why: '1と20を数え忘れていないかな。2、4、5、10 の4つに、1と20を足す。' },
      { v: 5, tex: '5', why: '1、2、4、5、10 の5つだと、20自身がぬけている。' },
      { v: 7, tex: '7', why: '多すぎる。わり切れない数が混ざっていないか、もう一度。' }
    ],
    steps: ['20の約数は $1,\\ 2,\\ 4,\\ 5,\\ 10,\\ 20$。', '数えると <b>6こ</b>。'],
    point: '約数を数えるときも、1と自分自身を入れる。'
  }));
  return out;
}

function genDochira() {
  const mk = (id, p, truth, others, steps, point) => RAWQ(id, p, truth, others, steps, point);
  return [
    mk('bk-1', '$12\\div6=2$ とわり切れる。このとき、$12$ は $6$ の何？', '倍数', [['約数', '約数は「わり切れる数」。わる数の6のほう。12は、6の段（6×2）にあるので、倍数。'], ['どちらでもない', '12=6×2 と、6の段にある。だから、はっきりと倍数。'], ['素数', '12は、1と12のほかに2、3、4、6でもわり切れるので、素数ではない。']],
      ['$12=6\\times2$。12は、6の段にある。', '6に整数をかけて作れる数は、6の<b>倍数</b>。'], '大きいほう（かけ算の答え）が倍数。'),
    mk('bk-2', '$12\\div6=2$ とわり切れる。このとき、$6$ は $12$ の何？', '約数', [['倍数', '倍数は、12に整数をかけた数（12、24、36…）。6は12より小さい。'], ['どちらでもない', '12÷6=2 と、わり切れる。わり切れる数は、約数。'], ['素数', '6は、1、2、3、6でわり切れるので、素数ではない。']],
      ['12を、6でわり切れる。', 'ある数を わり切れる数は、その数の<b>約数</b>。'], '小さいほう（わる数）が約数。'),
    mk('bk-3', '$3,\\ 6,\\ 9,\\ 12,\\ \\ldots$ とならんでいる数を、$3$ の何という？', '倍数', [['約数', '約数は、3をわり切れる数（1と3だけ）。3、6、9…は、3にかけて作った数。'], ['どちらでもない', '3×1、3×2、3×3…。これが倍数。'], ['素数', '3自身は素数だけれど、6や9は素数ではない。ここで聞かれているのは、3との関係。']],
      ['$3\\times1,\\ 3\\times2,\\ 3\\times3,\\ \\ldots$ とふえていく。', '3にかけ算でふえていく数は、<b>倍数</b>。'], '倍数は、かけ算でふえていく数。'),
    mk('bk-4', '$24\\div8=3$ とわり切れる。このとき、$8$ は $24$ の何？', '約数', [['倍数', '倍数になるのは、大きいほうの24。「24は8の倍数」（$8\\times3=24$）。8は、24をわり切れる数だから、約数。'], ['どちらでもない', '24÷8=3 とわり切れるので、8は24の約数。'], ['素数', '8は、1、2、4、8でわり切れるので、素数ではない。']],
      ['24を、8でわり切れる。', 'わり切れる数は、<b>約数</b>。', '24のほうが、8の倍数（$8\\times3=24$）。'], 'わり切れる数が約数、かけて作る数が倍数。'),
    build({
      id: 'bk-5', expr: '20', p: '$10$ の<b>倍数</b>は、どれ？', truth: { v: 20, tex: '20' },
      cands: [5, 2, 1].map(x => ({ v: x, tex: T(x), why: '$10\\div' + x + '=' + (10 / x) + '$ とわり切れる。' + x + ' は10の<b>約数</b>。倍数は、10にかけ算をした数。' })),
      steps: ['10の倍数は、$10,\\ 20,\\ 30,\\ \\ldots$。', '選択肢の中で、10の段にあるのは <b>20</b>。'], point: '倍数は、元の数以上。約数は、元の数以下。'
    }),
    build({
      id: 'bk-6', expr: '5', p: '$10$ の<b>約数</b>は、どれ？', truth: { v: 5, tex: '5' },
      cands: [20, 30, 40].map(x => ({ v: x, tex: T(x), why: '$10\\times' + (x / 10) + '=' + x + '$。' + x + ' は、10の<b>倍数</b>。約数ではない。' })),
      steps: ['10の約数は、$1,\\ 2,\\ 5,\\ 10$。', '選択肢の中で、10をわり切れるのは <b>5</b>。'], point: '約数は、わり切れる数。元の数より大きくならない。'
    })
  ];
}

function genKoyaku() {
  const out = [];
  const L0 = [[12, 18], [8, 12], [18, 24], [20, 30], [16, 24], [15, 25]];
  // 最初の1問：公約数をすべて
  {
    const [a, b] = [12, 18], d = divisors(a).filter(x => b % x === 0);
    out.push(build({
      id: 'gy-1', expr: JSON.stringify(d), p: '$12$ と $18$ の<b>公約数</b>を、すべて書いたものは？<br>（公約数：両方の約数になっている数）', truth: { v: d, tex: LT(d) },
      cands: [
        { v: d.filter(x => x !== 1), tex: LT(d.filter(x => x !== 1)), why: '1も公約数。どんな数も、1でわり切れる。' },
        { v: [6], tex: '6', why: '6は公約数のうち、いちばん大きいもの（最大公約数）。「すべて」と聞かれているよ。' },
        { v: [1, 2, 3, 4, 6, 9, 12, 18], tex: LT([1, 2, 3, 4, 6, 9, 12, 18]), why: '12の約数と18の約数を、ぜんぶ並べてしまっているよ。「両方」に入っているものだけ。4は18の約数ではない。' }
      ],
      steps: ['12の約数：$1,\\ 2,\\ 3,\\ 4,\\ 6,\\ 12$。', '18の約数：$1,\\ 2,\\ 3,\\ 6,\\ 9,\\ 18$。', '<b>両方に出てくる</b>数：$1,\\ 2,\\ 3,\\ 6$。'],
      point: '公約数は、両方の約数に出てくる数。'
    }));
  }
  L0.forEach(([a, b], i) => {
    const g = gcd(a, b), L = lcmOf(a, b), da = divisors(a), db = divisors(b);
    const cands = [{ v: L, tex: T(L), why: L + ' は ' + a + ' と ' + b + ' の<b>公倍数</b>。ここで聞かれているのは、約数（わり切れる数）のほう。' }];
    const ps = [2, 3, 5].filter(p => g % p === 0 && p < g);
    if (ps.length) cands.push({ v: ps[0], tex: T(ps[0]), why: ps[0] + ' も公約数だけれど、もっと大きい公約数 ' + g + ' がある。「いちばん大きい」ものを選ぼう。' });
    cands.push({ v: 1, tex: '1', why: '1はどんな数の約数でもあるけれど、いちばん大きいとは言えない。もっと大きい公約数がある。' });
    cands.push({ v: Math.min(a, b), tex: T(Math.min(a, b)), why: Math.min(a, b) + ' は、' + Math.max(a, b) + ' をわり切れない（' + Math.max(a, b) + '÷' + Math.min(a, b) + ' はあまりが出る）。だから公約数ではない。' });
    cands.push({ v: g + (g > 2 ? -1 : 2), tex: T(g + (g > 2 ? -1 : 2)), why: '数がずれているよ。約数を書き出して、両方に出てくる数を探そう。' });
    out.push(build({
      id: 'gy-' + (i + 2), expr: String(g), p: '$' + a + '$ と $' + b + '$ の<b>最大公約数</b>（公約数のうち、いちばん大きい数）は？', truth: { v: g, tex: T(g) }, cands,
      steps: [a + 'の約数：$' + LT(da) + '$。', b + 'の約数：$' + LT(db) + '$。', '両方に出てくる数のうち、いちばん大きいのは <b>' + g + '</b>。'],
      point: '最大公約数は、両方の約数を書き出して、共通する数の中でいちばん大きい数。約分で使う。'
    }));
  });
  return out;
}

function genKobai() {
  const out = [];
  [[4, 6], [6, 9], [8, 12], [10, 15], [6, 8], [9, 12]].forEach(([a, b], i) => {
    const L = lcmOf(a, b), g = gcd(a, b), prod = a * b, cands = [];
    if (prod !== L) cands.push({ v: prod, tex: T(prod), why: prod + ' も ' + a + ' と ' + b + ' の公倍数だけれど、もっと小さい公倍数 ' + L + ' がある。「いちばん小さい」ものを選ぼう。' });
    cands.push({ v: g, tex: T(g), why: g + ' は、' + a + ' と ' + b + ' の<b>公約数</b>（わり切れる数）。ここでは、倍数（かけて作る数）を聞いている。' });
    cands.push({ v: a + b, tex: T(a + b), why: a + b + ' は、' + a + ' の段にも ' + b + ' の段にも入っていないよ。足しても公倍数にはならない。' });
    cands.push({ v: 2 * L, tex: T(2 * L), why: 2 * L + ' も公倍数だけれど、' + L + ' のほうが小さい。' });
    cands.push({ v: Math.max(a, b), tex: T(Math.max(a, b)), why: Math.max(a, b) + ' は、' + Math.min(a, b) + ' の段に入っていない。' });
    const mul = x => { const r = []; for (let m = x; m <= L; m += x) r.push(m); return LT(r); };
    out.push(build({
      id: 'gb-' + (i + 1), expr: String(L), p: '$' + a + '$ と $' + b + '$ の<b>最小公倍数</b>（公倍数のうち、いちばん小さい数）は？', truth: { v: L, tex: T(L) }, cands,
      steps: [a + 'の倍数：$' + mul(a) + '$、…', b + 'の倍数：$' + mul(b) + '$、…', '最初に両方に出てくる数が <b>' + L + '</b>。'],
      point: '最小公倍数は、両方の倍数を書き出して、最初に共通する数。通分の分母に使う。'
    }));
  });
  out.push(build({
    id: 'gb-7', expr: '12', p: 'ベルAは3分おき、ベルBは4分おきに鳴る。いっしょに鳴ったあと、次にいっしょに鳴るのは<b>何分後</b>？', truth: { v: 12, tex: '12' },
    cands: [{ v: 7, tex: '7', why: '3＋4＝7 と足してしまっているよ。Aは3分、6分、9分…、Bは4分、8分、12分…。いっしょになるのは12分。' }, { v: 24, tex: '24', why: '24分後もいっしょに鳴るけれど、その前の12分後にも、もういちど鳴る。' }, { v: 1, tex: '1', why: '1分ごとには鳴らない。AもBも、3分・4分のおきに鳴る。' }],
    unit: '分後',
    steps: ['Aは $3,\\ 6,\\ 9,\\ 12,\\ \\ldots$ 分後。Bは $4,\\ 8,\\ 12,\\ \\ldots$ 分後。', '最初にそろうのは <b>12分後</b>。', '3と4の最小公倍数が12。'],
    point: '「同時に起こる」「そろう」は、最小公倍数で考える。'
  }));
  out.push(build({
    id: 'gb-8', expr: '30', p: 'バスAは5分おき、バスBは6分おきに出発する。同時に出発したあと、次に同時に出発するのは何分後？', truth: { v: 30, tex: '30' }, unit: '分後',
    cands: [{ v: 11, tex: '11', why: '5＋6＝11 と足してしまっているよ。5の倍数と6の倍数の、最初の共通点を探そう。' }, { v: 60, tex: '60', why: '60分後もそろうけれど、30分後のほうが先。' }, { v: 1, tex: '1', why: '1分ごとには出発しない。5分・6分のおき。' }],
    steps: ['5の倍数：$5,\\ 10,\\ \\ldots,\\ 30$。6の倍数：$6,\\ 12,\\ \\ldots,\\ 30$。', '最初にそろうのは <b>30分後</b>。'],
    point: 'そろう時間は、最小公倍数。'
  }));
  return out;
}

/* ================= B. 小数と分数 ================= */
const decBars = (k, n, tex) => ({ type: 'bars', rows: [{ tex, n, k }] });
function genKurai() {
  const out = [];
  const q = (id, p, truth, cands, steps, point, fig, figAfter) => out.push(build({ id, expr: String(truth), p, fig, figAfter, truth: { v: truth, tex: dfmt(truth) }, cands: cands.map(([x, why]) => ({ v: x, tex: dfmt(x), why })), steps, point }));
  q('ks-1', '$0.1$ が3こ分は、いくつ？', 0.3, [[0.03, '0.03は、0.01が3こ分。0.1が3こ分は、0.1＋0.1＋0.1。'], [0.13, '「0.1」と「3」を、ただ並べているよ。0.1が3こ集まった大きさを考えよう。'], [3, '0.1が10こ集まって、やっと1。3こでは、1より小さい。']],
    ['$0.1+0.1+0.1=0.3$。', '0.1は、1を10等分した1こ分。それが3こで、10こ分のうちの3こ。'], '0.1が□こ分 ＝ 0.□。', decBars(0, 10, '0.1'), decBars(3, 10, '0.3'));
  q('ks-2', '$0.01$ が7こ分は、いくつ？', 0.07, [[0.7, '0.7は、0.1が7こ分。0.01は0.1の、さらに10分の1。'], [0.007, '0.007は、0.001が7こ分。小さすぎるよ。'], [0.17, '「0.1」と「7」を並べているよ。0.01が7こ集まった大きさを考えよう。']],
    ['0.01は、0.1を10等分した1こ分（1の100分の1）。', '7こ分で、$0.01\\times7=0.07$。'], '0.01が□こ分 ＝ 0.0□。');
  q('ks-3', '$0.1$ が12こ分は、いくつ？', 1.2, [[0.12, '0.1が10こで、1になる。12こなら、1をこえるよ。'], [12, '0.1が12こ。12ではないよ。0.1が10こで1。'], [0.012, '小さすぎる。0.1が10こで1になるので、12こは1より大きい。']],
    ['0.1が10こ集まると、<b>1</b>。', 'あと2こで、$0.1\\times2=0.2$。', '合わせて $1.2$。'], '0.1が10こ集まると、1になる。');
  q('ks-4', '$0.1$ を10こ集めると、いくつ？', 1, [[0.10, '0.10は、0.1と同じ数。10こ集めたら、大きくなるよ。'], [10, '0.1が10こ。0.1×10＝1。10ではないよ。'], [0.01, '0.01は、0.1より小さい。集めたら大きくなる。']],
    ['$0.1\\times10=1$。', '0.1を10こ集めて、ちょうど1になる。'], '0.1が10こ ＝ 1。');
  q('ks-5', '1を10等分した、1こ分は、いくつ？', 0.1, [[0.01, '0.01は、1を100等分した1こ分。10等分だよ。'], [10, '10は、1を10こ集めた数。分けた1こ分は、1より小さい。'], [0.5, '0.5は、1を2等分した1こ分。']],
    ['1を10こに分けた、1こ分。', 'それが $0.1$（分数なら $\\dfrac1{10}$）。'], '1を10等分した1こ分が0.1。');
  q('ks-6', '1を100等分した、1こ分は、いくつ？', 0.01, [[0.1, '0.1は、1を10等分した1こ分。100等分は、もっと小さい。'], [0.001, '0.001は、1を1000等分した1こ分。'], [100, '100は、1を100こ集めた数。']],
    ['1を100こに分けた、1こ分。', 'それが $0.01$（分数なら $\\dfrac1{100}$）。'], '1を100等分した1こ分が0.01。');
  out.push(RAWQ('ks-7', '$0.58$ の「5」は、何の位？', '小数第一位（$\\frac1{10}$ の位）', [['小数第二位（$\\frac1{100}$ の位）', '5は、小数点のすぐ右。いちばん近い位が、第一位。第二位は、8のほう。'], ['一の位', '一の位は、小数点の左側。0.58の一の位は0。'], ['小数第三位（$\\frac1{1000}$ の位）', '0.58は、小数点以下が2けた。第三位はない。']],
    ['小数点のすぐ右が、<b>小数第一位</b>（$\\frac1{10}$ の位）。', '5は、そこにある。つまり、$0.1$ が5こ分。', '8は、第二位（$\\frac1{100}$ の位）。'], '小数点の右へ、$\\frac1{10}$、$\\frac1{100}$、…と位が続く。'));
  return out;
}
function genYoku() {
  const out = [];
  const toFrac = [
    { x: 0.5, f: [1, 2], w: [[[1, 5], '0.5は、5が入っているので1/5と思いがち。でも1/5は0.2。半分（1/2）が0.5。'], [[5, 10], '5/10は、1/2と同じ大きさ。まだ約分できる。'], [[1, 50], '分母が大きすぎる。1/50は0.02。']] },
    { x: 0.25, f: [1, 4], w: [[[1, 25], '1/25は、0.04のこと。0.25は、1を4等分したうちの1つ。'], [[2, 5], '2/5は、0.4のこと。'], [[25, 100], '25/100は、1/4と同じ大きさ。まだ約分できる。']] },
    { x: 0.75, f: [3, 4], w: [[[3, 5], '3/5は、0.6のこと。0.75は、0.25の3つ分（1/4の3つ分）。'], [[75, 100], '75/100は、3/4と同じ大きさ。まだ約分できる。'], [[1, 4], '1/4は0.25。0.75は、その3つ分。']] },
    { x: 0.2, f: [1, 5], w: [[[1, 2], '1/2は、0.5のこと。'], [[2, 10], '2/10は、1/5と同じ大きさ。まだ約分できる。'], [[1, 20], '1/20は、0.05のこと。']] },
    { x: 0.1, f: [1, 10], w: [[[1, 100], '1/100は、0.01のこと。0.1は、1を10等分したうちの1つ。'], [[1, 11], '1/11は、0.0909…。分母は、1を何等分したか。0.1は10等分。'], [[10, 1], '10は、1を10こ集めた数。0.1とは、ぎゃく。']] },
    { x: 0.01, f: [1, 100], w: [[[1, 10], '1/10は、0.1のこと。0.01は、もう一段小さい。'], [[1, 1000], '1/1000は、0.001のこと。0.01は100等分。'], [[100, 1], '100は、0.01を10000こ集めた数…とても大きい。ぎゃくになっている。']] }
  ];
  toFrac.forEach((o, i) => {
    const cands = o.w.map(([[n, d], why]) => C(n, d, why, n / d === o.f[0] / o.f[1]));
    out.push(build({
      id: 'yk-' + (i + 1), expr: o.f[0] + '/' + o.f[1], p: '$' + dfmt(o.x) + '$ を分数にすると？', truth: { v: o.f[0] / o.f[1], tex: frT(o.f[0], o.f[1]) }, cands,
      steps: ['小数を、分数にする。', '$' + dfmt(o.x) + '=' + frT(o.f[0], o.f[1]) + '$。', '反射で言えるように、声に出して覚えよう。'],
      point: '$0.1=\\dfrac1{10}$、$0.01=\\dfrac1{100}$、$0.5=\\dfrac12$、$0.25=\\dfrac14$、$0.2=\\dfrac15$。これは、考えずに出てくるようにしたい。'
    }));
  });
  const toDec = [
    { f: [1, 4], x: 0.25, w: [0.4, 0.14, 0.04] },
    { f: [1, 5], x: 0.2, w: [0.5, 0.15, 5] },
    { f: [3, 4], x: 0.75, w: [0.34, 3.4, 0.43] },
    { f: [1, 2], x: 0.5, w: [0.2, 0.12, 2] },
    { f: [1, 8], x: 0.125, w: [0.8, 0.18, 0.08] }
  ];
  toDec.forEach((o, i) => {
    const cands = o.w.map(x => {
      const [n, d] = fracOfDec(x);
      return { v: x, tex: dfmt(x), why: '$' + dfmt(x) + '=' + frT(n, d) + '$ のこと。$' + frT(o.f[0], o.f[1]) + '$ とはちがう数だよ。' };
    });
    out.push(build({
      id: 'yk-' + (i + 7), expr: o.f[0] + '/' + o.f[1], p: '$' + frT(o.f[0], o.f[1]) + '$ を小数にすると？', truth: { v: o.x, tex: dfmt(o.x) }, cands,
      steps: ['分数は、分子÷分母。$' + o.f[0] + '\\div' + o.f[1] + '=' + dfmt(o.x) + '$。', 'または、' + (o.f[1] === 4 ? '$\\frac14=0.25$ と覚えて、3つ分なら $0.75$。' : '覚えている形から出す。')],
      point: '$\\dfrac14=0.25$、$\\dfrac15=0.2$、$\\dfrac12=0.5$、$\\dfrac18=0.125$。'
    }));
  });
  return out;
}
function genShosuToBun() {
  const out = [];
  const mk = (id, x, ask) => {
    const d = (String(x).split('.')[1] || '').length, den = Math.pow(10, d), n = Math.round(x * den);
    const [rn, rd] = reduceF(n, den), reduces = ask && (rn !== n);
    const tn = reduces ? rn : n, td = reduces ? rd : den;
    const cands = [];
    if (reduces) cands.push(C(n, den, '$' + fr(n, den) + '$ は正しい。でも、まだ約分できる。' + gcd(n, den) + ' でわって、小さい数の分数にしよう。', true));
    cands.push(C(tn, td * 10, '分母の0が多すぎるよ。小数点の右が ' + d + ' けたなら、分母は1のあとに0を ' + d + ' こ。', false));
    if (d >= 2) cands.push(C(tn, td / 10 < 1 ? 1 : td / 10, '分母の0が足りないよ。小数点の右が ' + d + ' けたなら、分母は1のあとに0を ' + d + ' こ。', false));
    else cands.push({ v: n, tex: String(n), why: '分母がなくなっているよ。小数点の右が1けたなら、分母は10。' });
    cands.push(C(den, n, '分母と分子が、ぎゃくになっているよ。小数は1より小さいので、分子のほうが小さい。'));
    if (reduces) cands.push(C(rn, den, '分子だけを ' + gcd(n, den) + ' でわっているよ。約分は、分母も同じ数でわる。'));
    out.push(build({
      id, expr: tn + '/' + td, p: '$' + dfmt(x) + '$ を分数にしよう' + (reduces ? '（約分して、いちばん小さい分数で）。' : '。'), truth: { v: tn / td, tex: frT(tn, td) }, cands,
      steps: ['小数点の右は ' + d + ' けた。分母は、1のあとに0が ' + d + ' こ → ' + den + '。', '小数点をとった数 ' + n + ' が、分子。$' + fr(n, den) + '$。'].concat(reduces ? ['$' + gcd(n, den) + '$ で約分して、$' + frT(rn, rd) + '$。'] : []),
      point: '小数→分数：小数点の右のけた数だけ、分母に0（10、100、…）。小数点をとった数が分子。'
    }));
  };
  [[0.3, false], [0.9, false], [0.07, false], [0.23, false], [0.6, true], [0.4, true], [0.35, true]].forEach(([x, ask], i) => mk('sb-' + (i + 1), x, ask));
  return out;
}
function genBunToShosu() {
  const out = [];
  const spec = [
    { n: 3, d: 10, w: [0.03, 3.1, 0.31] }, { n: 7, d: 100, w: [0.7, 0.007, 7.1] }, { n: 9, d: 10, w: [0.09, 9.1, 0.91] },
    { n: 41, d: 100, w: [4.1, 0.041, 0.41 + 0.01] }, { n: 3, d: 5, w: [0.35, 3.5, 0.53] }, { n: 7, d: 20, w: [0.72, 0.7, 0.035] }, { n: 3, d: 8, w: [0.38, 0.0375, 3.8] }
  ];
  spec.forEach((o, i) => {
    const x = o.n / o.d, cands = o.w.map(w => {
      const [n, d] = fracOfDec(w);
      return { v: w, tex: dfmt(w), why: '$' + dfmt(w) + '=' + frT(n, d) + '$ のこと。もとの分数とはちがうよ。' + (o.d === 10 || o.d === 100 ? '分母の0の数だけ、小数点をうつす。' : '分子÷分母で計算しよう。') };
    });
    const dd = o.d === 10 || o.d === 100;
    out.push(build({
      id: 'bs-' + (i + 1), expr: o.n + '/' + o.d, p: '$' + fr(o.n, o.d) + '$ を小数にすると？', truth: { v: x, tex: dfmt(x) }, cands,
      steps: dd ? ['分母が ' + o.d + ' なので、小数点を左へ ' + (String(o.d).length - 1) + ' けた動かす。', '$' + fr(o.n, o.d) + '=' + dfmt(x) + '$。'] : ['分数は、分子÷分母。', '$' + o.n + '\\div' + o.d + '=' + dfmt(x) + '$。'],
      point: '分母が10、100なら、小数点を左へ動かす。それ以外は、分子÷分母で計算する。'
    }));
  });
  return out;
}

function genShosuKeisan() {
  const out = [];
  out.push(RAWQ('sk-1', '$0.5$ と $0.45$ では、どちらが大きい？', '$0.5$', [['$0.45$', '45のほうが大きい数に見えるけれど、位をそろえて比べよう。$0.50$ と $0.45$。0.50のほうが大きい。'], ['どちらも同じ', '$0.50$ と $0.45$ は、ちがう数。0.50のほうが大きい。'], ['くらべられない', '位をそろえれば、くらべられる。$0.50$ と $0.45$。']],
    ['けた数をそろえる。$0.5=0.50$。', '$0.50$ と $0.45$。小数第一位は、5と4。5のほうが大きい。', '$0.5$ のほうが大きい。'], '小数は、位をそろえて、上の位から比べる。'));
  const cmp = (id, nums, mode) => {
    const t = mode === 'min' ? Math.min(...nums) : Math.max(...nums), pad = x => (x * 100).toFixed(0).padStart(2, '0');
    out.push(build({
      id, expr: 'Math.' + mode + '(' + nums.join(',') + ')', p: '$' + nums.map(dfmt).join(',\\ ') + '$ のうち、いちばん<b>' + (mode === 'min' ? '小さい' : '大きい') + '</b>数は？',
      truth: { v: t, tex: dfmt(t) },
      cands: nums.filter(x => x !== t).map(x => ({ v: x, tex: dfmt(x), why: 'けた数をそろえて（$' + nums.map(y => (y).toFixed(2)).join(',\\ ') + '$）くらべると、' + x.toFixed(2) + ' は答えの ' + t.toFixed(2) + ' より' + (mode === 'min' ? '大きい' : '小さい') + '。' })),
      steps: ['けた数をそろえる：$' + nums.map(y => y.toFixed(2)).join(',\\ ') + '$。', '上の位から比べて、いちばん' + (mode === 'min' ? '小さい' : '大きい') + 'のは $' + t.toFixed(2) + '$。'],
      point: '小数は、けた数をそろえて、上の位から比べる。見た目の数字の大きさでは決まらない。'
    }));
  };
  cmp('sk-2', [0.3, 0.25, 0.4, 0.35], 'min');
  cmp('sk-3', [0.7, 0.65, 0.07, 0.58], 'max');
  const calc = (id, p, expr, truth, cands, steps, point) => out.push(build({ id, expr, p, truth: { v: truth, tex: dfmt(truth) }, cands: cands.map(([x, why]) => ({ v: x, tex: dfmt(x), why })), steps, point }));
  calc('sk-4', '$0.3+0.25$ を計算しよう。', '0.3+0.25', 0.55, [[0.28, '右はしをそろえて、3＋25をしているよ。<b>小数点をそろえて</b>、$0.30+0.25$。'], [0.5, '$0.3+0.2$ だけで、$0.05$ を足し忘れているよ。'], [0.325, '0.3と0.25を、くっつけているよ。足し算にしよう。']],
    ['小数点をそろえて、$0.30+0.25$。', '$30+25=55$ なので、$0.55$。'], '小数の足し算は、小数点をそろえてから計算する。');
  calc('sk-5', '$0.6+0.7$ を計算しよう。', '0.6+0.7', 1.3, [[0.13, '$6+7=13$ に、小数点をつけただけ。0.1が13こ集まると、1.3。'], [1.03, 'くり上がりの1を、位をまちがえて入れているよ。0.1が13こ → 1と0.3。'], [13, '0.1が13こ分は、13ではなく、1.3。']],
    ['0.1が6こと、0.1が7こで、0.1が13こ。', '0.1が10こで1。のこり3こで0.3。', '合わせて $1.3$。'], '10こ集まったら、1つ上の位にくり上げる。');
  calc('sk-6', '$2.5-0.75$ を計算しよう。', '2.5-0.75', 1.75, [[1.8, '$2.5-0.7=1.8$ で、$0.05$ を引き忘れているよ。'], [1.85, '下の位のくり下がりで、1つ引き忘れているよ。$2.50-0.75$ の、0−5 から考えよう。'], [3.25, '引き算なのに、足してしまっているよ。']],
    ['小数点をそろえて、$2.50-0.75$。', '$250-75=175$ なので、$1.75$。'], '小数の引き算も、小数点をそろえる。くり下がりに注意。');
  calc('sk-7', '$3.4-0.15$ を計算しよう。', '3.4-0.15', 3.25, [[0.19, '右はしをそろえて、34−15をしているよ。<b>小数点をそろえて</b>、$3.40-0.15$。'], [3.3, '$0.05$ を引き忘れているよ。'], [3.35, '$3.4-0.1$ を計算して、0.05を足してしまっているよ。']],
    ['小数点をそろえて、$3.40-0.15$。', '$340-15=325$ なので、$3.25$。'], '小数点をそろえて、数字を右にそろえない。');
  return out;
}
function genIdou() {
  const out = [];
  const spec = [[0.37, 10], [0.37, 100], [4.5, 10], [0.6, 100], [8.2, '/10'], [35, '/100'], [0.04, 10]];
  spec.forEach(([x, k], i) => {
    const div = typeof k === 'string', m = div ? Number(k.slice(1)) : k, s = String(m).length - 1;
    const truth = +(div ? x / m : x * m).toFixed(8), dir = div ? '左' : '右', opp = div ? '右' : '左';
    const cands = [
      { v: +(div ? x * m : x / m).toFixed(8), tex: dfmt(div ? x * m : x / m), why: '小数点を、<b>' + opp + '</b>へ動かしているよ。' + (div ? '÷なら左' : '×なら右') + 'へ動かす。' },
      { v: +(div ? x / (m * 10) : x * m * 10).toFixed(8), tex: dfmt(div ? x / (m * 10) : x * m * 10), why: '小数点を、' + (s + 1) + 'けた動かしているよ。' + dfmt(m) + 'は0が' + s + 'こなので、' + s + 'けた。' },
      { v: x, tex: dfmt(x), why: '小数点が、動いていないよ。' + (div ? 'わる' : 'かける') + 'と、数は変わる。' }
    ];
    if (s > 1 || !div) cands.push({ v: +(div ? x / (m / 10) : x * (m / 10)).toFixed(8), tex: dfmt(div ? x / (m / 10) : x * (m / 10)), why: '小数点の動かしかたが、' + (s - 1) + 'けた分しかないよ。0が' + s + 'こなら、' + s + 'けた動かす。' });
    out.push(build({
      id: 'id-' + (i + 1), expr: div ? x + '/' + m : x + '*' + m, p: '$' + dfmt(x) + (div ? '\\div' : '\\times') + m + '$ を計算しよう。', truth: { v: truth, tex: dfmt(truth) }, cands,
      steps: [m + 'は、0が' + s + 'こ。小数点を<b>' + dir + '</b>へ ' + s + ' けた動かす。', '$' + dfmt(x) + (div ? '\\div' : '\\times') + m + '=' + dfmt(truth) + '$。'],
      point: '×10、×100は小数点を右へ。÷10、÷100は左へ。0の数だけ動かす。'
    }));
  });
  return out;
}

/* ================= C. 分数のかけ算・わり算 ================= */
function genHen() {
  const out = [];
  [[2, 1, 3], [3, 2, 5], [1, 3, 4]].forEach(([w, n, d], i) => {
    const m = w * d + n;
    const cands = [
      C(w + n, d, '整数の ' + w + ' を、そのまま分子に足してしまっているよ。$' + w + '$ は $' + fr(w * d, d) + '$（' + w + '×' + d + '）のこと。', false),
      { v: Number(String(w) + String(n)) / d, tex: fr(String(w) + String(n), d), why: '整数と分子を、ただ並べているよ。$' + w + '$ は $' + fr(w * d, d) + '$（' + w + '×' + d + '）に直してから、分子を足す。' },
      C(w * d, d, '分子の ' + n + ' を足し忘れているよ。$' + w + '$ は $' + fr(w * d, d) + '$。それに $' + fr(n, d) + '$ を足す。', false),
      C(w * n, d, '整数と分子を「かけて」しまっているよ。整数は、分母をかけて分子に足す。', false)
    ];
    out.push(build({
      id: 'hn-' + (i + 1), expr: m + '/' + d, p: '$' + mixT(w, n, d) + '$ を、仮分数（分子が大きい分数）にしよう。', truth: { v: m / d, tex: fr(m, d) }, cands,
      steps: ['整数 ' + w + ' を、分母 ' + d + ' の分数に直す：$' + w + '=' + fr(w * d, d) + '$。', '$' + fr(w * d, d) + '+' + fr(n, d) + '=' + fr(m, d) + '$。', '分母 × 整数 ＋ 分子 ＝ $' + d + '\\times' + w + '+' + n + '=' + m + '$。'],
      point: '帯分数→仮分数：分母×整数＋分子 が新しい分子。分母は、そのまま。'
    }));
  });
  [[7, 3], [13, 4], [17, 5], [11, 6]].forEach(([m, d], i) => {
    const q = Math.floor(m / d), r = m % d;
    const cands = [
      { v: q + m / d, tex: q + fr(m, d), why: '分子の ' + m + ' が、そのまま残っているよ。分子は「わり算のあまり」$' + m + '\\div' + d + '=' + q + '$ あまり $' + r + '$ の、あまり。' },
      { v: (q + 1) + r / d, tex: mixT(q + 1, r, d), why: '整数の部分は、商の ' + q + ' だよ（' + m + '÷' + d + '＝' + q + ' あまり ' + r + '）。' + (q + 1) + ' は大きすぎる。' },
      { v: q + (d - r) / d, tex: mixT(q, d - r, d), why: '分子は、あまりの ' + r + ' だよ。' + (d - r) + ' ではない。' },
      { v: r + q / d, tex: mixT(r, q, d), why: '整数と分子が、入れかわっているよ。整数は商の ' + q + '、分子はあまりの ' + r + '。' }
    ];
    out.push(build({
      id: 'hn-' + (i + 4), expr: m + '/' + d, p: '$' + fr(m, d) + '$ を、帯分数（整数と分数）にしよう。', truth: { v: m / d, tex: mixT(q, r, d) }, cands,
      steps: ['分子を分母でわる：$' + m + '\\div' + d + '=' + q + '$ あまり $' + r + '$。', '商 ' + q + ' が整数、あまり ' + r + ' が分子。', '$' + fr(m, d) + '=' + mixT(q, r, d) + '$。'],
      point: '仮分数→帯分数：分子÷分母。商が整数、あまりが分子。'
    }));
  });
  return out;
}
function genKakeInt() {
  const out = [];
  [[2, 5, 3], [3, 7, 2], [5, 6, 3], [3, 4, 2], [1, 8, 4], [2, 9, 3]].forEach(([n, d, k], i) => {
    const [rn, rd] = reduceF(n * k, d), reduces = rn !== n * k;
    const cands = [
      C(n, d, '分母にも ' + k + ' をかけてしまっているよ。$' + fr(n * k, d * k) + '=' + fr(n, d) + '$ で、もとの分数と同じ。かけ算でふやすのは<b>分子だけ</b>。', false),
      C(n, d * k, '分母に ' + k + ' をかけているよ。分母をふやすと、ピースが小さくなって、答えが小さくなる。かけ算でふえるのは<b>分子</b>。', false),
      C(n + k, d, '分子に ' + k + ' を足しているよ。' + k + ' 倍するのは、かけ算。$' + n + '\\times' + k + '=' + n * k + '$。', false)
    ];
    if (reduces) cands.unshift(C(n * k, d, '$' + fr(n * k, d) + '$ は正しい。でも、まだ約分できる。約分して、いちばん小さい分数で答えよう。', true));
    out.push(build({
      id: 'ki-' + (i + 1), expr: n + '/' + d + '*' + k, p: '$' + fr(n, d) + '\\times' + k + '$ を計算しよう（約分できるときは、約分して）。', truth: Fv(n * k, d), cands,
      steps: ['整数は、<b>分子にだけ</b>かける。$' + fr(n + '\\times' + k, d) + '=' + fr(n * k, d) + '$。'].concat(reduces ? ['約分して $' + frT(rn, rd) + '$。'] : []),
      point: '分数×整数：分母はそのまま、分子に整数をかける。'
    }));
  });
  return out;
}
function genKakeFr() {
  const out = [];
  [[2, 3, 4, 5], [3, 4, 1, 2], [2, 5, 3, 7], [3, 4, 2, 9], [5, 6, 3, 10], [4, 9, 3, 8]].forEach(([a, b, c, d], i) => {
    const n = a * c, dd = b * d, [rn, rd] = reduceF(n, dd), reduces = rn !== n;
    const cands = [
      C(a * c, b + d, '分母を足してしまっているよ。分母どうしも<b>かける</b>。$' + b + '\\times' + d + '=' + b * d + '$。', false),
      C(a + c, b * d, '分子を足してしまっているよ。分子どうしも<b>かける</b>。$' + a + '\\times' + c + '=' + a * c + '$。', false),
      C(a * d, b * c, '分子と分母を、ななめにかけているよ（これは、わり算のやり方）。かけ算は、<b>分子は分子どうし、分母は分母どうし</b>。', false),
      C(a * c * 2, b * d, '分子の計算がずれているよ。$' + a + '\\times' + c + '=' + a * c + '$。', false)
    ];
    if (reduces) cands.unshift(C(n, dd, '$' + fr(n, dd) + '$ は正しい。でも、まだ約分できる。' + gcd(n, dd) + ' でわって、小さい分数にしよう。', true));
    out.push(build({
      id: 'kf-' + (i + 1), expr: a + '/' + b + '*' + c + '/' + d, p: '$' + fr(a, b) + '\\times' + fr(c, d) + '$ を計算しよう（約分できるときは、約分して）。', truth: Fv(n, dd), cands,
      steps: ['分子どうし、分母どうしをかける。$' + fr(a + '\\times' + c, b + '\\times' + d) + '=' + fr(n, dd) + '$。'].concat(reduces ? ['$' + gcd(n, dd) + '$ で約分して、$' + frT(rn, rd) + '$。'] : []),
      point: '分数×分数：分子×分子、分母×分母。通分はいらない。約分できるなら、約分する。'
    }));
  });
  return out;
}
function genGyaku() {
  const out = [];
  const frac = (n, d, i) => {
    out.push(build({
      id: 'gk-' + i, expr: d + '/' + n, p: '$' + fr(n, d) + '$ の<b>逆数</b>は？', truth: { v: d / n, tex: frT(d, n) },
      cands: [C(n, d, 'もとの数と、同じだよ。逆数は、分母と分子を<b>入れかえた</b>数。', false), C(-n, d, '符号を変えているよ。逆数は、符号を変えるのではなく、分母と分子を入れかえる。', false), C(-d, n, '入れかえた上に、符号まで変えているよ。逆数は、入れかえるだけ。', false)],
      steps: ['分母と分子を、入れかえる。', '$' + fr(n, d) + '\\to' + frT(d, n) + '$。', '確かめ：$' + fr(n, d) + '\\times' + frT(d, n) + '=1$。'],
      point: '逆数：分母と分子を入れかえた数。もとの数にかけると、1になる。'
    }));
  };
  frac(2, 3, 1); frac(5, 7, 2); frac(3, 8, 3);
  out.push(build({
    id: 'gk-4', expr: '5', p: '$' + fr(1, 5) + '$ の<b>逆数</b>は？', truth: { v: 5, tex: '5' },
    cands: [C(1, 5, 'もとの数と、同じだよ。入れかえて、分母が分子になる。', false), C(-1, 5, '符号を変えているよ。逆数は、入れかえるだけ。', false), C(-5, 1, '入れかえた上に、符号まで変えているよ。', false)],
    steps: ['$' + fr(1, 5) + '$ の分母5と分子1を、入れかえる。', '$' + fr(5, 1) + '=5$。', '確かめ：$' + fr(1, 5) + '\\times5=1$。'], point: '分子が1の分数の逆数は、整数になる。'
  }));
  out.push(build({
    id: 'gk-5', expr: '1/4', p: '$4$ の<b>逆数</b>は？（$4=\\dfrac41$ と考える）', truth: { v: 0.25, tex: fr(1, 4) },
    cands: [{ v: 4, tex: '4', why: 'もとの数と、同じだよ。$4=\\frac41$ を入れかえると $\\frac14$。' }, { v: -4, tex: '-4', why: '符号を変えているよ。逆数は、入れかえるだけ。' }, { v: -0.25, tex: '-' + fr(1, 4), why: '入れかえた上に、符号まで変えているよ。' }],
    steps: ['$4=\\dfrac41$ と書く。', '入れかえて、$\\dfrac14$。', '確かめ：$4\\times\\dfrac14=1$。'], point: '整数は、分母が1の分数と考えて、入れかえる。'
  }));
  out.push(build({
    id: 'gk-6', expr: '5/2', p: '$\\dfrac25\\times\\square=1$ の □ に入る数は？', truth: { v: 2.5, tex: fr(5, 2) },
    cands: [C(2, 5, 'もとの数をかけても、1にはならない。$\\frac25\\times\\frac25=\\frac4{25}$。', false), C(3, 5, '$\\frac25+\\frac35=1$ は成り立つけれど、これは足して1になる数。かけて1になる数は、逆数。', false), { v: 1, tex: '1', why: '$\\frac25\\times1=\\frac25$ で、1にならない。' }],
    steps: ['かけて1になる数は、<b>逆数</b>。', '$\\dfrac25$ の逆数は $\\dfrac52$。', '確かめ：$\\dfrac25\\times\\dfrac52=\\dfrac{10}{10}=1$。'], point: 'かけて1になる数が、逆数。'
  }));
  return out;
}
function genWariFr() {
  const out = [];
  [[2, 3, 4, 5], [3, 4, 3, 8], [2, 5, 3, 10]].forEach(([a, b, c, d], i) => {
    const n = a * d, dd = b * c, [rn, rd] = reduceF(n, dd), reduces = rn !== n;
    const cands = [
      C(a * c, b * d, 'わる数を、ひっくり返さずに かけているよ。わり算は、わる数の<b>逆数</b>をかける。', false),
      C(b * c, a * d, 'わられる数のほうを、ひっくり返しているよ。ひっくり返すのは、<b>わる数</b>（$' + fr(c, d) + '$）のほう。', false),
      C(b * d, a * c, '両方をひっくり返しているよ。ひっくり返すのは、わる数だけ。', false)
    ];
    if (reduces) cands.unshift(C(n, dd, '$' + fr(n, dd) + '$ は正しい。でも、まだ約分できる。' + gcd(n, dd) + ' でわって、小さい分数にしよう。', true));
    out.push(build({
      id: 'wf-' + (i + 1), expr: a + '/' + b + '/(' + c + '/' + d + ')', p: '$' + fr(a, b) + '\\div' + fr(c, d) + '$ を計算しよう（約分できるときは、約分して）。', truth: Fv(n, dd), cands,
      steps: ['わる数 $' + fr(c, d) + '$ を、逆数 $' + fr(d, c) + '$ にして、かけ算にする。', '$' + fr(a, b) + '\\times' + fr(d, c) + '=' + fr(n, dd) + '$。'].concat(reduces ? ['$' + gcd(n, dd) + '$ で約分して、$' + frT(rn, rd) + '$。'] : []),
      point: '分数のわり算：わる数を逆数にして、かけ算にする。'
    }));
  });
  // 分数÷整数
  [[3, 4, 2], [5, 6, 5]].forEach(([a, b, k], i) => {
    const n = a, dd = b * k, [rn, rd] = reduceF(n, dd), reduces = rn !== n;
    const cands = [
      C(a * k, b, '分子に ' + k + ' をかけてしまっているよ。わり算は、分母に ' + k + ' をかける（$' + k + '=\\frac{' + k + '}{1}$ の逆数 $\\frac1{' + k + '}$ をかける）。', false),
      C(a + k, b, '分子に ' + k + ' を足しているよ。わり算は、分母に ' + k + ' をかける。', false),
      C(a * k, b * k, '分子と分母の両方に ' + k + ' をかけているよ。' + fr(a * k, b * k) + '＝' + fr(a, b) + ' で、わる前と同じ大きさ。', false)
    ];
    if (reduces) cands.unshift(C(n, dd, '$' + fr(n, dd) + '$ は正しい。でも、まだ約分できる。', true));
    out.push(build({
      id: 'wf-' + (i + 4), expr: a + '/' + b + '/' + k, p: '$' + fr(a, b) + '\\div' + k + '$ を計算しよう（約分できるときは、約分して）。', truth: Fv(n, dd), cands,
      steps: ['$' + k + '=\\dfrac{' + k + '}{1}$ と考える。逆数は $\\dfrac1{' + k + '}$。', '$' + fr(a, b) + '\\times\\dfrac1{' + k + '}=' + fr(n, dd) + '$。'].concat(reduces ? ['約分して $' + frT(rn, rd) + '$。'] : []),
      point: '分数÷整数：分母に、その整数をかける。'
    }));
  });
  // 整数÷分数
  out.push(build({
    id: 'wf-6', expr: '9', p: '$6\\div\\dfrac23$ を計算しよう。', truth: { v: 9, tex: '9' },
    cands: [{ v: 4, tex: '4', why: '$6\\times\\frac23=4$ と、そのままかけているよ。わる数 $\\frac23$ は、逆数 $\\frac32$ にして、かけ算にする。' }, { v: 1 / 9, tex: fr(1, 9), why: '$\\frac23\\div6$ のほうを計算しているよ。順番が入れかわっている。' }, { v: 18, tex: '18', why: '6に3をかけただけで、2でわり忘れているよ。$6\\times\\frac32=\\frac{18}2=9$。' }],
    steps: ['わる数 $\\dfrac23$ を、逆数 $\\dfrac32$ にして、かけ算にする。', '$6\\times\\dfrac32=\\dfrac{18}2=9$。', '確かめ：$9\\times\\dfrac23=6$。'], point: '整数÷分数：わる数を逆数にして、かける。'
  }));
  return out;
}
function genBunStory() {
  const out = [];
  const q = (id, p, expr, truth, cands, steps, point) => out.push(build({ id, expr, p, truth, cands, steps, point }));
  q('bt-1', '1mが60円のひもを、$\\dfrac34$ m買った。代金は？', '60*3/4', { v: 45, tex: '45', }, [{ v: 80, tex: '80', why: '$60\\div\\frac34=80$ と、わり算にしているよ。「1あたりの値段 × いくつ分」は、かけ算。' }, { v: 180, tex: '180', why: '$60\\times3$ で、4でわり忘れているよ。$60\\times\\frac34=\\frac{180}4$。' }, { v: 15, tex: '15', why: '60から45を引いた数（のこり）だよ。代金は、$60\\times\\frac34$。' }],
    ['1mが60円なので、$\\dfrac34$ m分は、$60\\times\\dfrac34$。', '$60\\times\\dfrac34=\\dfrac{180}{4}=45$。', '答えは45円。'], '「1あたり × いくつ分」は、かけ算。');
  q('bt-2', 'ジュース $\\dfrac35$ L を、3人で同じ量ずつ分ける。1人分は何L？', '1/5', Fv(1, 5), [C(9, 5, '$\\frac35\\times3$ と、かけ算にしているよ。「分ける」は、わり算。', false), C(3, 15, '$\\frac3{15}$ は正しい。でも、まだ約分できる。', true), C(5, 9, '$3\\div\\frac35$ のほうを計算しているよ。順番が入れかわっている。', false)],
    ['3人で分けるので、$\\dfrac35\\div3$。', '$\\dfrac35\\times\\dfrac13=\\dfrac3{15}=\\dfrac15$。', '答えは $\\dfrac15$ L。'], '「分ける」は、わり算。');
  q('bt-3', '$\\dfrac23$ mのリボンを、$\\dfrac16$ mずつ切る。何本とれる？', '4', { v: 4, tex: '4' }, [C(1, 9, '$\\frac23\\times\\frac16$ と、かけ算にしているよ。「何本とれる」は、わり算。', false), C(1, 4, '$\\frac16\\div\\frac23$ のほうを計算しているよ。順番が入れかわっている。', false), { v: 9, tex: '9', why: '$3\\times\\ldots$ と、ずれているよ。$\\frac23\\div\\frac16=\\frac23\\times6$。' }],
    ['$\\dfrac23\\div\\dfrac16$。', '$\\dfrac23\\times6=\\dfrac{12}3=4$。', '答えは4本。'], '「何こ分」「何本とれる」は、わり算。');
  q('bt-4', 'たて $\\dfrac23$ m、よこ $\\dfrac35$ m の長方形の面積は？', '2/5', Fv(2, 5), [C(19, 15, '$\\frac23+\\frac35$ と、足し算にしているよ。長方形の面積は、たて×よこ。', false), C(10, 9, '$\\frac23\\div\\frac35$ と、わり算にしているよ。面積は、たて×よこ。', false), C(6, 15, '$\\frac6{15}$ は正しい。でも、まだ約分できる。', true)],
    ['面積は、たて×よこ。', '$\\dfrac23\\times\\dfrac35=\\dfrac6{15}=\\dfrac25$。', '答えは $\\dfrac25$ m²。'], '面積＝たて×よこ。');
  q('bt-5', 'みかんが24こある。その $\\dfrac38$ は、何こ？', '24*3/8', { v: 9, tex: '9' }, [{ v: 64, tex: '64', why: '$24\\div\\frac38=64$ と、わり算にしているよ。「〜の $\\frac38$」は、かけ算。' }, { v: 72, tex: '72', why: '$24\\times3$ で、8でわり忘れているよ。' }, { v: 8, tex: '8', why: '$24\\div3$ だけで、3倍し忘れているよ。$24\\times\\frac38$。' }],
    ['「24の $\\dfrac38$」は、$24\\times\\dfrac38$。', '$24\\times\\dfrac38=\\dfrac{72}8=9$。', '答えは9こ。'], '「〜の ○分の△」は、かけ算。');
  q('bt-6', '$\\dfrac23$ 時間で4km進む。1時間では何km進む？', '6', { v: 6, tex: '6' }, [C(8, 3, '$4\\times\\frac23$ と、かけ算にしているよ。1時間あたりを求めるのは、わり算。', false), C(1, 6, '$\\frac23\\div4$ のほうを計算しているよ。順番が入れかわっている。', false), { v: 12, tex: '12', why: '$4\\times3$ で、2でわり忘れているよ。' }],
    ['1時間あたりは、道のり÷時間。$4\\div\\dfrac23$。', '$4\\times\\dfrac32=6$。', '答えは6km。'], '「1あたり」を求めるときは、わり算。');
  return out;
}

/* ================= D. 割合・比・速さ ================= */
const PC = p => dfmt(p) + '\\%';
function genHyaku() {
  const out = [];
  const toPct = (id, x) => {
    const p = +(x * 100).toFixed(8);
    out.push(build({
      id, expr: String(p), p: '$' + dfmt(x) + '$ を、百分率（％）で表すと？', truth: { v: p, tex: PC(p) },
      cands: [{ v: p / 10, tex: PC(p / 10), why: '小数点の動かしかたが足りないよ。％にするときは、100倍（小数点を右へ2けた）。' }, { v: p * 10, tex: PC(p * 10), why: '小数点を3けた動かしているよ。100倍は、右へ2けた。' }, { v: x, tex: PC(x), why: '「％」をつけただけで、100倍していないよ。$' + dfmt(x) + '$ は、1を100%としたときの大きさ。' }],
      steps: ['百分率は、割合を100倍して「％」をつける。', '$' + dfmt(x) + '\\times100=' + dfmt(p) + '$。', '答えは $' + PC(p) + '$。'],
      point: '小数→％：100倍（小数点を右へ2けた）。1が100%。'
    }));
  };
  toPct('hy-1', 0.3); toPct('hy-2', 0.07); toPct('hy-3', 1.2);
  const toDec = (id, p) => {
    const x = +(p / 100).toFixed(8);
    out.push(build({
      id, expr: String(x), p: '$' + PC(p) + '$ を、小数で表すと？', truth: { v: x, tex: dfmt(x) },
      cands: [{ v: x * 10, tex: dfmt(x * 10), why: '小数点の動かしかたが足りないよ。％を小数にするときは、100でわる（小数点を左へ2けた）。' }, { v: x / 10, tex: dfmt(x / 10), why: '小数点を3けた動かしているよ。100でわるのは、左へ2けた。' }, { v: p, tex: dfmt(p), why: '％をとっただけで、100でわっていないよ。' }],
      steps: ['％を小数にするときは、100でわる。', '$' + dfmt(p) + '\\div100=' + dfmt(x) + '$。'],
      point: '％→小数：100でわる（小数点を左へ2けた）。'
    }));
  };
  toDec('hy-4', 25); toDec('hy-5', 8); toDec('hy-6', 150);
  out.push(build({
    id: 'hy-7', expr: '30', p: '「3割」は、何％？（1割＝10％）', truth: { v: 30, tex: PC(30) },
    cands: [{ v: 3, tex: PC(3), why: '1割は10％。3割は、10×3＝30％だよ。' }, { v: 0.3, tex: PC(0.3), why: '0.3は、小数で表した割合。％にするときは100倍して30％。' }, { v: 300, tex: PC(300), why: '1割は10％。3割は、10×3。大きすぎる。' }],
    steps: ['1割 ＝ $0.1$ ＝ $10\\%$。', '3割は、$10\\times3=30$ で、$30\\%$。'], point: '1割＝0.1＝10％。1分＝0.01＝1％。'
  }));
  return out;
}
function genWariai() {
  const out = [];
  [[60, 30], [80, 25], [200, 15], [50, 120]].forEach(([b, p], i) => {
    const t = b * p / 100;
    out.push(build({
      id: 'wr-' + (i + 1), expr: b + '*' + p + '/100', p: b + ' の $' + PC(p) + '$ は、いくつ？', truth: { v: t, tex: dfmt(t) },
      cands: [{ v: +(b / (p / 100)).toFixed(6), tex: dfmt(+(b / (p / 100)).toFixed(6)), why: 'わり算にしているよ。「〜の○％」は、もとにする量に割合を<b>かける</b>。' }, { v: t / 10, tex: dfmt(t / 10), why: '％を小数にするとき、小数点を3けた動かしているよ。' + p + '％は ' + dfmt(p / 100) + '。' }, { v: b * p, tex: dfmt(b * p), why: '％を小数に直さずに、そのままかけているよ。' + p + '％は ' + dfmt(p / 100) + ' に直してから。' }, { v: b - t, tex: dfmt(b - t), why: 'もとの量から、' + dfmt(t) + ' を引いた量（残り）になっているよ。聞かれているのは、' + p + '％にあたる量。' }],
      steps: ['「' + b + ' の ' + p + '％」は、' + b + ' が「もとにする量」。', p + '％ ＝ ' + dfmt(p / 100) + '。', '$' + b + '\\times' + dfmt(p / 100) + '=' + dfmt(t) + '$。'],
      point: 'くらべる量 ＝ もとにする量 × 割合。「〜の」の前が、もとにする量。'
    }));
  });
  [[20, 50], [15, 60]].forEach(([a, b], i) => {
    const p = a / b * 100;
    out.push(build({
      id: 'wr-' + (i + 5), expr: String(p), p: a + ' は、' + b + ' の何％？', truth: { v: p, tex: PC(p) },
      cands: [{ v: +(b / a * 100).toFixed(6), tex: PC(+(b / a * 100).toFixed(6)), why: 'わる数とわられる数が、ぎゃくになっているよ。もとにする量（「〜の」の前、' + b + '）が、わる数。' }, { v: a / b, tex: PC(+(a / b).toFixed(6)), why: '$' + a + '\\div' + b + '=' + dfmt(a / b) + '$ は小数の割合。％にするには、100倍する。' }, { v: p / 10, tex: PC(p / 10), why: '100倍のしかたが足りないよ。' + dfmt(a / b) + ' を100倍すると ' + dfmt(p) + '。' }],
      steps: ['割合 ＝ くらべる量 ÷ もとにする量 ＝ $' + a + '\\div' + b + '=' + dfmt(a / b) + '$。', '％にするには100倍。$' + dfmt(a / b) + '\\times100=' + dfmt(p) + '$。'],
      point: '割合 ＝ くらべる量 ÷ もとにする量。％にするときは100倍。'
    }));
  });
  [[10, 20, 50], [6, 30, 20]].forEach(([a, p, b], i) => {
    out.push(build({
      id: 'wr-' + (i + 7), expr: String(b), p: '□ の $' + PC(p) + '$ が ' + a + ' のとき、□ はいくつ？', truth: { v: b, tex: String(b) },
      cands: [{ v: a * p / 100, tex: dfmt(a * p / 100), why: '$' + a + '\\times' + dfmt(p / 100) + '$ と、かけ算にしているよ。□がもとにする量。くらべる量（' + a + '）を、割合でわる。' }, { v: a * p, tex: dfmt(a * p), why: '％を小数に直さずに、かけているよ。' }, { v: a - p, tex: dfmt(a - p), why: '引き算になっているよ。割合のもとめかたは、かけ算・わり算。' }],
      steps: ['「□ × ' + dfmt(p / 100) + ' ＝ ' + a + '」と考える。', '□ ＝ $' + a + '\\div' + dfmt(p / 100) + '=' + b + '$。'],
      point: 'もとにする量 ＝ くらべる量 ÷ 割合。'
    }));
  });
  return out;
}
function genWaribiki() {
  const out = [];
  [[1000, 20], [500, 10], [2400, 25]].forEach(([b, p], i) => {
    const t = b * (100 - p) / 100;
    out.push(build({
      id: 'wb-' + (i + 1), expr: b + '*(100-' + p + ')/100', p: b + '円の品物を、' + p + '％引きで買う。代金は何円？', truth: { v: t, tex: dfmt(t) }, unit: '円',
      cands: [{ v: b * p / 100, tex: dfmt(b * p / 100), why: 'これは「引いた金額」。代金は、もとの値段から引いたのこり。' }, { v: b * (100 + p) / 100, tex: dfmt(b * (100 + p) / 100), why: '足してしまっているよ。' + p + '％引きは、' + p + '％安くなる。' }, { v: b - p, tex: dfmt(b - p), why: '％を、そのまま円として引いているよ。' + p + '％は、' + dfmt(b * p / 100) + '円。' }],
      steps: [p + '％引き ＝ ' + (100 - p) + '％の値段で買う。', '$' + b + '\\times' + dfmt((100 - p) / 100) + '=' + dfmt(t) + '$。', '答えは ' + dfmt(t) + '円。'],
      point: '○％引き ＝ 「(100−○)％」をかける。○％増し ＝ 「(100＋○)％」をかける。'
    }));
  });
  [[50, 20], [800, 5]].forEach(([b, p], i) => {
    const t = b * (100 + p) / 100;
    out.push(build({
      id: 'wb-' + (i + 4), expr: b + '*(100+' + p + ')/100', p: b + 'g の ' + p + '％増しは、何g？', truth: { v: t, tex: dfmt(t) }, unit: 'g',
      cands: [{ v: b * p / 100, tex: dfmt(b * p / 100), why: 'これは「ふえた分」だけ。' + p + '％増しの全体は、もとの量にふえた分を足す。' }, { v: b * (100 - p) / 100, tex: dfmt(b * (100 - p) / 100), why: '引いてしまっているよ。増しは、ふえる。' }, { v: b + p, tex: dfmt(b + p), why: '％を、そのまま g として足しているよ。' + p + '％は、' + dfmt(b * p / 100) + 'g。' }],
      steps: [p + '％増し ＝ ' + (100 + p) + '％の量。', '$' + b + '\\times' + dfmt((100 + p) / 100) + '=' + dfmt(t) + '$。'], point: '○％増し ＝ 「(100＋○)％」をかける。'
    }));
  });
  out.push(build({
    id: 'wb-6', expr: '1000', p: '30％引きで、代金が700円だった。もとの値段は何円？', truth: { v: 1000, tex: '1000' }, unit: '円',
    cands: [{ v: 910, tex: '910', why: '$700\\times1.3$ と、増やしているよ。700円は、もとの値段の70％。ぎゃくに考える。' }, { v: 490, tex: '490', why: '$700\\times0.7$ と、さらに引いているよ。もとの値段は、700より高いはず。' }, { v: 730, tex: '730', why: '％を、そのまま円として足しているよ。' }],
    steps: ['30％引き ＝ もとの値段の70％。', '「□ × 0.7 ＝ 700」。', '□ ＝ $700\\div0.7=1000$。'], point: 'もとの値段 ＝ 代金 ÷ (100−○)％。'
  }));
  out.push(build({
    id: 'wb-7', expr: '420', p: '600円の品物を、3割引きで買う。代金は何円？', truth: { v: 420, tex: '420' }, unit: '円',
    cands: [{ v: 180, tex: '180', why: 'これは「引いた金額」。代金は、のこり。' }, { v: 780, tex: '780', why: '3割を3％と考えていないかな。3割 ＝ 30％。' }, { v: 597, tex: '597', why: '3割を3円と考えているよ。3割 ＝ 30％ ＝ 0.3。' }],
    steps: ['3割引き ＝ 30％引き ＝ 70％の値段。', '$600\\times0.7=420$。'], point: '1割＝10％。3割引きは、70％の値段。'
  }));
  return out;
}
function genHi() {
  const out = [];
  const rt = (a, b) => a + ':' + b;
  [[6, 9], [12, 18], [8, 20], [10, 4]].forEach(([a, b], i) => {
    const g = gcd(a, b), ra = a / g, rb = b / g, v = ra / rb, cands = [
      { v: rb / ra, tex: rt(rb, ra), why: '前と後が、入れかわっているよ。' + a + ':' + b + ' の前の数は ' + a + '。' },
      { v: ra / b, tex: rt(ra, b), why: '前の数だけをわっているよ。比は、両方を<b>同じ数</b>でわる。' },
      { v: a / rb, tex: rt(a, rb), why: '後の数だけをわっているよ。比は、両方を<b>同じ数</b>でわる。' }
    ];
    if (g > 3) { const h = [2, 3].find(p => g % p === 0); cands.unshift({ same: true, v: (a / h) / (b / h), tex: rt(a / h, b / h), why: 'まちがいではないけれど、まだ ' + (g / h) + ' でわれる。いちばん簡単な整数の比にしよう。' }); }
    out.push(build({
      id: 'hi-' + (i + 1), expr: ra + '/' + rb, p: '$' + a + ':' + b + '$ を、いちばん簡単な整数の比にしよう。', truth: { v, tex: rt(ra, rb) }, cands,
      steps: [a + ' と ' + b + ' を、同じ数でわる。いちばん大きく同じ数でわれるのは <b>' + g + '</b>。', '$' + a + '\\div' + g + '=' + ra + '$、$' + b + '\\div' + g + '=' + rb + '$。', '答えは $' + rt(ra, rb) + '$。'],
      point: '比は、両方を同じ数でわって簡単にする（約分と同じ）。'
    }));
  });
  [[2, 3, 12], [3, 5, 20]].forEach(([a, b, d], i) => {
    const k = d / b, t = a * k;
    out.push(build({
      id: 'hi-' + (i + 5), expr: String(t), p: '$' + rt(a, b) + '=' + rt('\\square', d) + '$ の □ に入る数は？', truth: { v: t, tex: String(t) },
      cands: [{ v: a + (d - b), tex: String(a + (d - b)), why: '同じ数を「足して」いるよ。比は、両方に同じ数を<b>かけて</b>（または、わって）そろえる。' }, { v: b * d / a, tex: dfmt(b * d / a), why: 'かける数を、ぎゃくに使っているよ。' + b + '→' + d + ' で ' + k + ' 倍。' + a + ' も ' + k + ' 倍。' }, { v: k, tex: String(k), why: 'それは「何倍か」。□は、' + a + ' を ' + k + ' 倍した数。' }],
      steps: [b + ' → ' + d + ' で、<b>' + k + ' 倍</b>。', '前の ' + a + ' も ' + k + ' 倍。$' + a + '\\times' + k + '=' + t + '$。'], point: '比は、前と後に同じ数をかけても、比は同じ。'
    }));
  });
  out.push(build({
    id: 'hi-7', expr: '3/4', p: '$3:4$ の「比の値」は？（比の値＝前の数÷後の数）', truth: { v: 0.75, tex: fr(3, 4) },
    cands: [C(4, 3, '前と後が、入れかわっているよ。前÷後。'), { v: 3, tex: '3', why: '前の数だけを書いているよ。前÷後。' }, C(7, 4, '足し算になっているよ。比の値は、わり算。')],
    steps: ['比の値 ＝ 前の数 ÷ 後の数。', '$3\\div4=\\dfrac34$。'], point: '比の値 ＝ 前 ÷ 後。分数で表せる。'
  }));
  out.push(build({
    id: 'hi-8', expr: '50', p: '砂糖と水を、$1:4$ の割合で混ぜる。水が200gのとき、砂糖は何g？', truth: { v: 50, tex: '50' }, unit: 'g',
    cands: [{ v: 800, tex: '800', why: '水の量を、4倍しているよ。砂糖は水より少ない（1:4）。' }, { v: 250, tex: '250', why: '足し算になっているよ。比は、倍数でそろえる。' }, { v: 4, tex: '4', why: 'それは比の「4」。実際の量は、200gを基準にそろえる。' }],
    steps: ['水が 4 → 200 で、<b>50倍</b>。', '砂糖も 1 の50倍で、$1\\times50=50$。'], point: '比の問題は、「何倍か」を先に出す。'
  }));
  return out;
}
function genHayasa() {
  const out = [];
  out.push(build({
    id: 'hs-1', expr: '180', p: '時速60kmで走る車は、3時間で何km進む？', truth: { v: 180, tex: '180' }, unit: 'km',
    cands: [{ v: 20, tex: '20', why: 'わり算にしているよ。道のり ＝ 速さ × 時間。' }, { v: 63, tex: '63', why: '足し算になっているよ。道のり ＝ 速さ × 時間。' }, { v: 1800, tex: '1800', why: '60×3 の計算が、ずれているよ。' }],
    steps: ['道のり ＝ 速さ × 時間。', '$60\\times3=180$。'], point: '道のり ＝ 速さ × 時間。'
  }));
  out.push(build({
    id: 'hs-2', expr: '50', p: '150kmを3時間で走る車の、速さ（時速）は？', truth: { v: 50, tex: '50' }, unit: 'km',
    cands: [{ v: 450, tex: '450', why: 'かけ算にしているよ。速さ ＝ 道のり ÷ 時間。' }, { v: 1 / 50, tex: fr(1, 50), why: 'わる数とわられる数が、ぎゃくになっているよ。道のり÷時間。' }, { v: 53, tex: '53', why: '足し算になっているよ。速さ ＝ 道のり ÷ 時間。' }],
    steps: ['速さ ＝ 道のり ÷ 時間。', '$150\\div3=50$。', '時速50km。'], point: '速さ ＝ 道のり ÷ 時間。'
  }));
  out.push(build({
    id: 'hs-3', expr: '3', p: '120kmの道のりを、時速40kmで進む。何時間かかる？', truth: { v: 3, tex: '3' }, unit: '時間',
    cands: [{ v: 4800, tex: '4800', why: 'かけ算にしているよ。時間 ＝ 道のり ÷ 速さ。' }, { v: 1 / 3, tex: fr(1, 3), why: 'わる数とわられる数が、ぎゃくになっているよ。道のり÷速さ。' }, { v: 80, tex: '80', why: '引き算になっているよ。時間 ＝ 道のり ÷ 速さ。' }],
    steps: ['時間 ＝ 道のり ÷ 速さ。', '$120\\div40=3$。'], point: '時間 ＝ 道のり ÷ 速さ。'
  }));
  out.push(build({
    id: 'hs-4', expr: '1200', p: '分速80mで、15分歩く。何m進む？', truth: { v: 1200, tex: '1200' }, unit: 'm',
    cands: [{ v: 80 / 15, tex: fr(16, 3), why: 'わり算にしているよ。道のり ＝ 速さ × 時間。' }, { v: 95, tex: '95', why: '足し算になっているよ。道のり ＝ 速さ × 時間。' }, { v: 120, tex: '120', why: '計算がずれているよ。$80\\times15$ を、くり上がりに気をつけて。' }],
    steps: ['分速80m ＝ 1分で80m進む。', '$80\\times15=1200$。'], point: '分速×分、時速×時間、秒速×秒。単位をそろえる。'
  }));
  out.push(build({
    id: 'hs-5', expr: '600', p: '時速36kmは、分速何m？（1km＝1000m、1時間＝60分）', truth: { v: 600, tex: '600' }, unit: 'm',
    cands: [{ v: 0.6, tex: '0.6', why: '$36\\div60=0.6$ は、分速0.6km。mにするには、1000倍。' }, { v: 2160, tex: '2160', why: '60でわるところを、かけているよ。時間が1時間→1分になると、進む道のりは少なくなる。' }, { v: 36000, tex: '36000', why: 'mにしただけで、1時間→1分の変換をしていないよ。これは時速36000m。' }],
    steps: ['36km ＝ 36000m。', '1時間 ＝ 60分。', '$36000\\div60=600$。分速600m。'], point: '時速→分速：m にして、60でわる。'
  }));
  out.push(build({
    id: 'hs-6', expr: '15', p: '家から駅まで1.2km。分速80mで歩くと、何分かかる？', truth: { v: 15, tex: '15' }, unit: '分',
    cands: [{ v: 0.015, tex: '0.015', why: 'kmとmの単位がそろっていないよ。1.2km ＝ 1200m。' }, { v: 96, tex: '96', why: 'かけ算にしているよ。時間 ＝ 道のり ÷ 速さ。' }, { v: 1.5, tex: '1.5', why: '$1200\\div80$ の計算がずれているよ。' }],
    steps: ['単位をそろえる。1.2km ＝ 1200m。', '時間 ＝ 道のり ÷ 速さ ＝ $1200\\div80=15$。'], point: '単位がちがうときは、まずそろえる。'
  }));
  out.push(RAWQ('hs-7', '速さを求める式は、どれ？', '速さ ＝ 道のり ÷ 時間', [['速さ ＝ 道のり × 時間', 'かけ算だと、道のりになる。道のり ＝ 速さ × 時間。'], ['速さ ＝ 時間 ÷ 道のり', 'わる数とわられる数が、ぎゃくになっているよ。'], ['速さ ＝ 道のり ＋ 時間', '足し算では、道のりと時間は足せない。単位がちがう。']],
    ['「は・じ・き」の図で、速さ（は）を隠す。', '残りは「み（道のり）」が上、「じ（時間）」が下。', 'だから、速さ ＝ 道のり ÷ 時間。'], '道のり ＝ 速さ × 時間、速さ ＝ 道のり ÷ 時間、時間 ＝ 道のり ÷ 速さ。'));
  return out;
}

/* ---------- 組み立て ---------- */
const I = {
  bai: '倍数は、その数に <b>1、2、3、…</b> をかけてできる数。九九の「段」と同じ。<br>$3$ の倍数：$3,\\ 6,\\ 9,\\ 12,\\ \\ldots$（どこまでも続く）',
  yaku: '約数は、その数を<b>わり切れる数</b>。わって、あまりが0になる数。<br>$12$ の約数：$1,\\ 2,\\ 3,\\ 4,\\ 6,\\ 12$。<span class="mark">1と、その数自身も入る</span>。',
  bk: '<b>倍数</b>はかけ算でふやした数（大きくなる）。<b>約数</b>はわり切れる数（小さくなる）。<br>$12\\div6=2$ のとき：<br>・$12$ は $6$ の<b>倍数</b>（$6\\times2=12$）<br>・$6$ は $12$ の<b>約数</b>',
  gy: '<b>公約数</b>は、2つ以上の数に共通の約数。そのうち、いちばん大きいのが<b>最大公約数</b>。<br>約分で「何でわるか」を決めるときに使う。',
  gb: '<b>公倍数</b>は、2つ以上の数に共通の倍数。そのうち、いちばん小さいのが<b>最小公倍数</b>。<br>通分で「分母をいくつにそろえるか」を決めるときに使う。',
  ks: '小数点の右へ、<b>$\\frac1{10}$ の位</b>、<b>$\\frac1{100}$ の位</b>、<b>$\\frac1{1000}$ の位</b>…と続く。<br>$0.1$ は、1を10等分した1こ分。$0.1$ が10こ集まると、1になる。',
  yk: '分数と小数の、よく出る組み合わせは、<b>考えずに言えるように</b>しておく。<table class="rtab"><tr><td>$0.1$</td><td>＝</td><td>$\\dfrac1{10}$</td></tr><tr><td>$0.01$</td><td>＝</td><td>$\\dfrac1{100}$</td></tr><tr><td>$0.5$</td><td>＝</td><td>$\\dfrac12$</td></tr><tr><td>$0.25$</td><td>＝</td><td>$\\dfrac14$</td></tr><tr><td>$0.75$</td><td>＝</td><td>$\\dfrac34$</td></tr><tr><td>$0.2$</td><td>＝</td><td>$\\dfrac15$</td></tr></table>',
  sb: '小数→分数：小数点の右が<b>何けた</b>か数える。<br>1けたなら分母は $10$、2けたなら $100$。小数点をとった数が分子。<br>$0.3=\\dfrac3{10}$、$0.07=\\dfrac7{100}$。約分できるなら、約分する。',
  bs: '分数→小数：<b>分子 ÷ 分母</b>。<br>分母が10や100のときは、小数点をうつすだけ。$\\dfrac3{10}=0.3$、$\\dfrac7{100}=0.07$。',
  sk: '小数の計算は、<b>小数点をそろえて</b>から。数字を右はしにそろえてはいけない。<br>$0.3+0.25$ は、$0.30+0.25$ にして計算する。',
  id: '×10は小数点を<b>右へ1けた</b>、×100は<b>右へ2けた</b>。<br>÷10は<b>左へ1けた</b>、÷100は<b>左へ2けた</b>。',
  hn: '帯分数は、整数＋分数。　$2\\dfrac13=2+\\dfrac13$<br>仮分数は、分子が分母より大きい分数。　$\\dfrac73$<br><br>・帯分数→仮分数：<b>分母×整数＋分子</b>が、新しい分子<br>・仮分数→帯分数：<b>分子÷分母</b>（商が整数、あまりが分子）',
  ki: '分数×整数は、<b>分子にだけ</b>整数をかける。分母は、そのまま。<br>$\\dfrac25\\times3=\\dfrac{2\\times3}5=\\dfrac65$。約分できるなら、約分する。',
  kf: '分数×分数は、<b>分子どうし、分母どうし</b>をかける。通分はいらない。<br>$\\dfrac23\\times\\dfrac45=\\dfrac{2\\times4}{3\\times5}=\\dfrac8{15}$。<br>かける前に約分すると、数が小さくなって楽。',
  gk: '<b>逆数</b>は、分母と分子を入れかえた数。もとの数にかけると、$1$ になる。<br>$\\dfrac23$ の逆数は $\\dfrac32$。整数 $4=\\dfrac41$ の逆数は $\\dfrac14$。',
  wf: '分数のわり算は、<b>わる数を逆数にして、かけ算</b>にする。<br>$\\dfrac23\\div\\dfrac45=\\dfrac23\\times\\dfrac54$。<br>ひっくり返すのは、<b>わる数のほう</b>だけ。',
  hy: '<b>割合</b>は、「もとにする量」を1としたときの、くらべる量の大きさ。<br>百分率（％）は、1を100％として表す。<br>$0.3=30\\%$、$1=100\\%$、$1.2=120\\%$。<br>歩合は、1割＝0.1＝10％、1分＝0.01＝1％。',
  wr: '割合の式は3つ。<b>「もとにする量」</b>がどれかを見つけるのが、最初。<br>「○○の△△％」の、<b>「の」の前</b>が、もとにする量。<br>・くらべる量 ＝ もとにする量 × 割合<br>・割合 ＝ くらべる量 ÷ もとにする量<br>・もとにする量 ＝ くらべる量 ÷ 割合',
  wb: '○％引きは、<b>(100−○)％</b>の値段。20％引きなら、80％をかける。<br>○％増しは、<b>(100＋○)％</b>の量。20％増しなら、120％をかける。',
  hi: '比 $a:b$ は、2つの量のくらべ方。両方に<b>同じ数をかけても、わっても</b>、比は同じ。<br>$6:9=2:3$（両方を3でわる）。いちばん簡単な整数の比にするのが基本。<br>比の値は、<b>前÷後</b>。$3:4$ の比の値は $\\dfrac34$。',
  hs: '速さ・時間・道のりの関係は、<b>「は・じ・き」</b>。<br>・道のり ＝ 速さ × 時間<br>・速さ ＝ 道のり ÷ 時間<br>・時間 ＝ 道のり ÷ 速さ<br>単位（km と m、時間と分）が、そろっているか見る。',
  bt: '文章題は、まず「かけ算かわり算か」を決める。<br>・<b>「1あたり × いくつ分」「〜の○分の△」</b>→ かけ算<br>・<b>「分ける」「何こ分」「1あたりは」</b>→ わり算'
};
const ABOUT = {
  yaku: [
    { p: '<b>倍数</b>は、かけ算でふえていく数。<b>約数</b>は、わり切れる数。<br>$12$ の約数は、$1,\\ 2,\\ 3,\\ 4,\\ 6,\\ 12$（12をわり切れる数）。<br>$12$ の倍数は、$12,\\ 24,\\ 36,\\ \\ldots$（12にかけてできる数）。' },
    { cap: '約数は、元の数より大きくならない。倍数は、元の数より小さくならない。' },
    { p: '約数は、約分で。倍数は、通分で。<br>中学の計算で毎回出てくるので、ここで<span class="mark">言えるように</span>しておこう。' }
  ],
  shosu: [
    { p: '分数と小数は、<span class="mark">同じ数の、2つの書き方</span>。まず、これだけは覚えよう。' },
    { bars: [{ tex: '0.1=\\frac1{10}', n: 10, k: 1 }] },
    { cap: '上は、1を10等分した1こ分が0.1。0.01は、それをさらに10等分した1こ分（1を100等分した1こ分）。' },
    { bars: [{ tex: '0.5=\\frac12', n: 2, k: 1 }, { tex: '0.25=\\frac14', n: 4, k: 1 }, { tex: '0.75=\\frac34', n: 4, k: 3 }, { tex: '0.2=\\frac15', n: 5, k: 1 }] },
    { p: '図で見て、声に出して言ってみよう。これが<b>反射</b>で出てくるようになると、中学の数学がぐっと楽になる。' }
  ],
  bunsu: [
    { p: '分数の計算は、足し算・引き算と、かけ算・わり算で、やり方がちがう。' },
    { p: '・たし算・ひき算：<b>通分</b>してから、分子だけ。<br>・かけ算：<b>分子どうし、分母どうし</b>。通分は、いらない。<br>・わり算：<b>わる数を逆数</b>にして、かけ算。' },
    { bars: [{ tex: '\\frac23', n: 3, k: 2 }, { tex: '\\frac8{15}', n: 15, k: 8 }] },
    { cap: '2/3 の 4/5 は、15等分のうち 8こ分。8/15 になる。' }
  ]
};
ABOUT.wariai = [
  { p: '割合は、<span class="mark">「もとにする量」を1（100％）</span>としたときの、くらべる量の大きさ。' },
  { bars: [{ tex: '1=100\\%', n: 10, k: 10 }, { tex: '0.3=30\\%', n: 10, k: 3 }] },
  { cap: '全体を1（100％）とすると、10こ分のうち3こ分が、0.3（30％）。' },
  { p: '速さ・時間・道のりは、<b>「は・じ・き」</b>の図で、どれを求めるか決める。<br>道のり ＝ 速さ × 時間。ここは、式を覚えるより、図で見るのがはやい。' }
];
const PARTS = [
  {
    id: 'yaku', title: '倍数と約数', sub: '約分の土台', about: ABOUT.yaku, aboutTitle: 'まず見てみよう：倍数と約数のちがい', aboutSub: '倍数と約数を、ちがいで見る',
    steps: [
      { id: 'yaku-1', title: '倍数', sub: 'かけ算でふえていく数', intro: I.bai, qs: genBai() },
      { id: 'yaku-2', title: '約数', sub: 'わり切れる数', intro: I.yaku, qs: genYaku() },
      { id: 'yaku-3', title: '倍数？約数？', sub: 'ちがいをはっきりさせる', intro: I.bk, qs: genDochira() },
      { id: 'yaku-4', title: '最大公約数', sub: '共通の約数のうち最大', intro: I.gy, qs: genKoyaku() },
      { id: 'yaku-5', title: '最小公倍数', sub: '共通の倍数のうち最小', intro: I.gb, qs: genKobai() }
    ]
  },
  {
    id: 'shosu', title: '小数と分数', sub: '反射で言える', about: ABOUT.shosu, aboutTitle: 'まず見てみよう：小数と分数は同じ数', aboutSub: '0.1と1/10は、同じ大きさ',
    steps: [
      { id: 'shosu-1', title: '小数の位', sub: '0.1、0.01って何？', intro: I.ks, qs: genKurai() },
      { id: 'shosu-2', title: 'よく出る小数と分数', sub: '考えずに言えるように', intro: I.yk, qs: genYoku() },
      { id: 'shosu-3', title: '小数→分数', sub: '桁数で分母が決まる', intro: I.sb, qs: genShosuToBun() },
      { id: 'shosu-4', title: '分数→小数', sub: '分子÷分母', intro: I.bs, qs: genBunToShosu() },
      { id: 'shosu-5', title: '小数の大小・足し引き', sub: '小数点をそろえる', intro: I.sk, qs: genShosuKeisan() },
      { id: 'shosu-6', title: '10倍・100倍', sub: '小数点が動くだけ', intro: I.id, qs: genIdou() }
    ]
  },
  {
    id: 'bunsu', title: '分数の計算', sub: 'かけ算・わり算', about: ABOUT.bunsu, aboutTitle: 'まず見てみよう：分数のかけ算・わり算', aboutSub: '足し算とやり方がちがう',
    steps: [
      { id: 'bunsu-1', title: '帯分数と仮分数', sub: '行ったり来たり', intro: I.hn, qs: genHen() },
      { id: 'bunsu-2', title: '分数×整数', sub: '分子にかける', intro: I.ki, qs: genKakeInt() },
      { id: 'bunsu-3', title: '分数×分数', sub: '分子どうし、分母どうし', intro: I.kf, qs: genKakeFr() },
      { id: 'bunsu-4', title: '逆数', sub: '分母と分子を入れかえる', intro: I.gk, qs: genGyaku() },
      { id: 'bunsu-5', title: '分数のわり算', sub: '逆数をかける', intro: I.wf, qs: genWariFr() },
      { id: 'bunsu-6', title: '文章題', sub: 'かけ算？わり算？', intro: I.bt, qs: genBunStory() }
    ]
  },
  {
    id: 'wariai', title: '割合・比・速さ', sub: 'くらべ方の基本', about: ABOUT.wariai, aboutTitle: 'まず見てみよう：割合と速さ', aboutSub: '「もとにする量」を1とする',
    steps: [
      { id: 'wariai-1', title: '％と小数', sub: '0.3＝30％＝3割', intro: I.hy, qs: genHyaku() },
      { id: 'wariai-2', title: '割合の3つの式', sub: 'もとにする量を見つける', intro: I.wr, qs: genWariai() },
      { id: 'wariai-3', title: '○％引き・○％増し', sub: '(100−○)％をかける', intro: I.wb, qs: genWaribiki() },
      { id: 'wariai-4', title: '比', sub: '同じ数でわる・かける', intro: I.hi, qs: genHi() },
      { id: 'wariai-5', title: '速さ・時間・道のり', sub: 'は・じ・き', intro: I.hs, qs: genHayasa() }
    ]
  }
];

const out = '// 自動生成（node gen0.js）。手で直すときは gen0.js を直す。\nconst PARTS = ' + JSON.stringify(PARTS) + ';\nif (typeof module !== \'undefined\') module.exports = PARTS;\n';
fs.writeFileSync(path.join(__dirname, 'src/data.js'), out);
let n = 0; PARTS.forEach(P => P.steps.forEach(s => { n += s.qs.length; }));
console.log('src/data.js を作成：' + n + '問、' + (out.length / 1024).toFixed(0) + 'KB');
