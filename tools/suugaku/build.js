// 数学の各ページを作る:  node tools/suugaku/build.js            -> 全部作る
//                        node tools/suugaku/build.js lv3 koushiki -> 指定したものだけ
// 出力: public/suugaku/<名前>.html （KaTeXの式表示・フォントも中に入った1枚のHTML）
// 元データは tools/suugaku/<名前>/src/ （data.js と index.template.html）。
// KaTeX は全ページ共通なので tools/suugaku/_shared/ に1セットだけ置く。
// NOINJECT=1 をつけると「記録の引っ越し」スクリプトを入れずに作る（旧サイトとの照合用）。
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
const OUT = path.join(ROOT, '..', '..', 'public', 'suugaku');
const SHARED = path.join(ROOT, '_shared');

// 旧サイト（別URL）から記録を引っ越すための小さなスクリプト。
// 旧サイトが  #migrate=（記録を符号にしたもの） をつけて転送してくるので、
// アプリが記録を読む前に localStorage へ書き込む。すでに記録がある項目は上書きしない。
const MIGRATE = '<script>/* 旧サイトからの記録の引っ越し */(function(){try{var h=location.hash;if(h.indexOf("#migrate=")!==0)return;' +
  'var d=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(h.slice(9))))));' +
  'for(var k in d){if(k.indexOf("suugaku-")===0&&localStorage.getItem(k)===null)localStorage.setItem(k,String(d[k]));}' +
  'history.replaceState(null,"",location.pathname+location.search);}catch(e){}})();</script>\n';

let css = fs.readFileSync(path.join(SHARED, 'katex.min.css'), 'utf8');
css = css.replace(/src:url\(fonts\/([A-Za-z0-9_-]+)\.woff2\) format\("woff2"\)[^;}]*/g, (_, name) => {
  const b64 = fs.readFileSync(path.join(SHARED, 'fonts', name + '.woff2')).toString('base64');
  return 'src:url(data:font/woff2;base64,' + b64 + ') format("woff2")';
});
if (/fonts\//.test(css)) throw new Error('未置換のフォント参照が残っています');
const katexJs = fs.readFileSync(path.join(SHARED, 'katex.min.js'), 'utf8');

const all = fs.readdirSync(ROOT).filter(n => n !== '_shared' && fs.statSync(path.join(ROOT, n)).isDirectory()).sort();
const want = process.argv.slice(2);
const targets = want.length ? want : all;
fs.mkdirSync(OUT, { recursive: true });
for (const s of targets) {
  if (!all.includes(s)) throw new Error('そんな名前はありません: ' + s);
  const src = p => fs.readFileSync(path.join(ROOT, s, 'src', p), 'utf8');
  const html = src('index.template.html')
    .replace('{{KATEX_CSS}}', () => '<style>' + css + '</style>')
    .replace('{{KATEX_JS}}', () => '<script>' + katexJs + '</script>')
    .replace('{{DATA_JS}}', () => src('data.js'));
  const cut = html.indexOf('<main id="app">');
  const doc = '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
    (process.env.NOINJECT ? '' : MIGRATE) +
    html.slice(0, cut) + '</head>\n<body>\n' + html.slice(cut) + '</body>\n</html>\n';
  fs.writeFileSync(path.join(OUT, s + '.html'), doc);
  console.log('public/suugaku/' + s + '.html', (doc.length / 1024).toFixed(0) + 'KB');
}
