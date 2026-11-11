# 中学トップ（chugaku）

公開URL: https://chugaku.senta1111.workers.dev/

## 数学（21ページ）はこのサイトの中にあります
- 数学トップ: `/suugaku` ／ 各ページ: `/suugaku/lv0`〜`lv13`、`/suugaku/koushiki`、`/suugaku/kakuritsu`、`/suugaku/waza-kansuu|souji|kakudo|kisoku|root`
- 元データ: `tools/suugaku/<名前>/src/`（`data.js` と `index.template.html`）。問題を足す・直すときは、その名前のフォルダの `gen*.js` を直して `node gen*.js` → `node check.js`（ALL OK）の順に実行。
- 公開用HTMLを作る: `node tools/suugaku/build.js lv3`（名前を省くと全部）→ `public/suugaku/lv3.html` ができる。
- 数学トップのカードを直す: `tools/build.js` を直して `node tools/build.js`。
- KaTeX（式の表示）は全ページ共通で `tools/suugaku/_shared/` に1セット。

## 旧サイトからの記録の引っ越し
- 以前は数学21ページが別々のURL（`chugaku-suugaku3.senta1111.workers.dev` など）だった。記録（ベスト・連続日数）はURLごとにブラウザ内に保存されるため、新URLには自動では届かない。
- 旧サイトを「転送ページ」にして、記録を `#migrate=` に載せて新ページへ運ぶ（雛形: `tools/suugaku/old-site-redirect.template.html`）。新ページ側の受け取りは `build.js` が各ページに入れている。
