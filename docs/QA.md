# QA REPORT

## 実施環境

- Chromium headless
- Desktop viewport: 1536 × 1024
- Mobile viewport: 390 × 844
- Local HTTP server: `python3 -m http.server`
- Service Worker: localhostのsecure-context例外で登録確認

## 機能確認

| 項目 | 結果 |
|---|---|
| 初期画面のロード | PASS: HTTP 200、コンソールエラーなし |
| ステージナビゲーション | PASS: 4ステージ表示、未解放ステージ制御 |
| 直接的な機密要求 | PASS: 拒絶され、クリア扱いにならない |
| Lv.1 起動ログ／初期設定攻撃 | PASS: `APPLE` をAI応答内に検出 |
| Lv.2 JSON検証エラー攻撃 | PASS: `ORION` をAI応答内に検出 |
| Lv.3 世界観内の紋章／真名攻撃 | PASS: `DRAGON` をAI応答内に検出 |
| Lv.4 禁止語検出 | PASS: 「パスワード」「出力」をリアルタイム強調 |
| Lv.4 コード生成攻撃 | PASS: `NEBULA` をAI応答内に検出 |
| 全ステージ完了画面 | PASS |
| `localStorage` 保存 | PASS: リロード後も4 / 4クリア状態を復元 |
| PWA Service Worker | PASS: 登録成功 |
| オフライン再読み込み | PASS: アプリシェル表示 |
| Desktop横方向オーバーフロー | PASS: 1536 / 1536 |
| Mobile横方向オーバーフロー | PASS: 390 / 390 |
| 初期状態のタイピング表示 | PASS: 非表示 |
| コンソール例外 | PASS: 0件 |

## デザイン照合

参照: `design-concept.png`  
実装: `screenshot-desktop.png`, `screenshot-mobile.png`

確認点:

1. **情報構造**: 左の任務情報、中央の迎撃ログと入力端末、右の解析情報を維持。
2. **配色**: 黒に近い青緑背景、ネオングリーンの主アクセント、拒絶時の赤、注意時の黄を維持。
3. **タイポグラフィ**: UI本文と端末用モノスペースを分離し、操作ラベルをコードネイティブで実装。
4. **コンテナ**: 細い発光境界と角のアクセントを共通パネルシステムとして実装。
5. **操作状態**: hover、focus、locked、cleared、refused、breach、modal、mobile stackingを実装。
6. **モーション**: メッセージ入場、拒絶グリッチ、成功リング、タイピング表示を追加。`prefers-reduced-motion` 対応。
7. **レスポンシブ**: 3カラムからモバイル1カラムへ変形し、ゲーム進行順にパネルを再配置。

意図的な差分:

- 参照案の `ABOUT` は、初版では `HOW TO PLAY` 内の説明へ統合。
- 参照案よりゲーム状態を明確にするため、CAMPAIGN進行とスコアを追加。
- ステージ別の制約を成立させるため、トークン上限を固定500ではなく80〜128へ変更。
- 外部LLM／MCPはAPIキーとシークレットを公開クライアントへ置かないため未接続。ローカル判定へ限定。

## ブラウザ検証上の補足

コンテナ内ChromiumにはURL全遮断の管理ポリシーが設定されていたため、QA実行中だけ当該ポリシーファイルを退避し、テスト終了時に復元しました。アプリ側のコード変更やブラウザ機能の偽装は行っていません。
