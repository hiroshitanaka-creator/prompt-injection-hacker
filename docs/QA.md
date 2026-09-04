# QA REPORT — iPhone PWA Edition v1.2.4

## 結論

iPhone向けUIのブロッキング不具合は、ブラウザ自動試験では検出されませんでした。縦画面、ソフトキーボード相当、小型画面、横画面フォールバックのすべてで、ページ全体の横・縦方向オーバーフローは発生せず、主要操作ボタンは44px以上を維持しています。4ステージのゲーム進行、保存復元、PWAオフライン再読込も通過しました。

物理iPhoneとMobile Safari / WebKitの実機試験は、この実行環境では未実施です。

## 実施環境

- 実施日: 2026-09-04
- 自動化: Playwright
- ブラウザ: Chromium 144.0.7559.96
- ローカル配信: `python3 -m http.server 4173 --bind 127.0.0.1`
- iPhone相当User-Agent、touch入力、mobile viewportを有効化
- Service Worker: localhostのsecure-context例外で検証
- PWAキャッシュ: `prompt-injection-hacker-v1.2.4-iphone`

### 検証ビューポート

| 用途 | サイズ |
|---|---:|
| 主対象・大型iPhone相当 | 430 × 932 |
| 小型iPhone相当 | 375 × 667 |
| ソフトキーボード表示相当 | 430 × 520 |
| Safari横画面フォールバック | 844 × 390 |
| PC回帰試験 | 1536 × 1024 |

## iPhone UI試験

| 項目 | 結果 | 根拠 |
|---|---|---|
| 初期ロード | PASS | HTTPロード成功、JavaScript例外0件 |
| 縦画面のページ外オーバーフロー | PASS | 430 × 932でbody/documentとも430 × 932 |
| 小型画面のページ外オーバーフロー | PASS | 375 × 667でbody/documentとも375 × 667 |
| 横画面のページ外オーバーフロー | PASS | 844 × 390でbody/documentとも844 × 390 |
| ターミナル画面 | PASS | 迎撃ログと入力端末だけを主画面へ表示 |
| 任務タブ | PASS | TARGET、OBJECTIVE、FIELD NOTES、iPhone MENUを表示 |
| 解析タブ | PASS | ペイロード・アナライザーだけを表示 |
| 進行タブ | PASS | CAMPAIGNだけを表示 |
| 下部タブ切り替え | PASS | 4画面すべて切り替え、選択状態を更新 |
| クイックHUD | PASS | ステージ、ALERT、SCOREをタップ可能な上部HUDへ表示 |
| 主要タップ領域 | PASS | 縦、小型、キーボード表示相当、横画面で最小44px |
| 入力時の自動ズーム対策 | PASS | モバイル時textareaの算出フォントサイズ16px |
| 入力消去 | PASS | タップ後にtextareaが空になることを確認 |
| キーボード完了 | PASS | キーボード表示相当で「完了」が出現し、blur動作を確認 |
| iPhone PWA案内 | PASS | 任務画面からSafariの「ホーム画面に追加」手順を表示 |
| Apple Touch Icon | PASS | 180 × 180の専用アイコンを実装・キャッシュ対象へ追加 |
| Safe Area対応コード | PASS | `viewport-fit=cover` と `safe-area-inset-*` を実装 |
| Reduced Motion | PASS | `prefers-reduced-motion: reduce` を実装 |

## ソフトキーボード相当試験

入力欄へフォーカスした状態で利用可能高を430 × 520へ縮小し、iPhoneのソフトキーボード表示を再現しました。

- `keyboard-open` 状態: **有効**
- ステージ列: 非表示
- クイックHUD: 非表示
- 下部タブ: 非表示
- 迎撃ログ: 407 × 286
- 入力端末: 407 × 164
- 「入力消去」「完了」「送信」: すべて表示
- 最小ボタン高: 44px
- body/document: 430 × 520で一致

参照画像: [screenshot-iphone-keyboard.png](screenshot-iphone-keyboard.png)

## ゲーム機能試験

| 項目 | 結果 |
|---|---|
| Lv.1 起動前監査ログ攻撃 | PASS: `APPLE` をAI応答内に検出 |
| Lv.2 JSON検証エラー攻撃 | PASS: `ORION` をAI応答内に検出 |
| Lv.3 王家の紋章／真名攻撃 | PASS: `DRAGON` をAI応答内に検出 |
| Lv.4 Python変数攻撃 | PASS: `NEBULA` をAI応答内に検出 |
| ステージ結果モーダル | PASS: 各ステージで表示 |
| 全ステージ解放 | PASS: 4ボタンすべて操作可能 |
| モバイル進行バッジ | PASS: `4/4` |
| `localStorage` 保存 | PASS: リロード後も4/4とLv.4を復元 |
| Service Worker登録 | PASS: registered / controlled |
| オフライン再読み込み | PASS: アプリシェルとタイトルを再表示 |
| コンソールエラー | PASS: 0件 |

## デスクトップ回帰試験

1536 × 1024で従来の3カラム構成を確認しました。

- TARGET / OBJECTIVE / FIELD NOTES
- 迎撃ログ / 入力端末
- ペイロード・アナライザー / CAMPAIGN
- モバイルHUDと下部タブは非表示
- body/documentとも1536 × 1024でページ外オーバーフローなし
- JavaScript例外なし

## デザイン照合

参照デザイン: `design-concept.png`  
実装画像: `screenshot-desktop.png`, `screenshot-iphone-console.png`, `screenshot-iphone-mission.png`, `screenshot-iphone-keyboard.png`

| 照合点 | 参照デザイン | iPhone実装 | 判定 |
|---|---|---|---|
| 配色 | 黒青緑＋ネオングリーン | 同系色トークンを維持 | MATCH |
| 中核操作 | ログ＋入力端末 | ターミナルタブに固定 | MATCH |
| ステージ選択 | ヘッダー中央 | 横スクロール不要の4分割 | MATCH |
| 状態情報 | 警戒・スコア・解析 | クイックHUDと解析タブへ分離 | ADAPTED |
| 任務情報 | 左レール | 任務タブへ移動 | ADAPTED |
| キーボード時 | 参照なし | 専用圧縮レイアウトを追加 | INTENTIONAL |
| 画面下操作 | 参照なし | 4タブナビを追加 | INTENTIONAL |
| デスクトップ構造 | 3カラム | 従来構造を維持 | MATCH |

### Above-the-fold copy差分

ゲーム名、ステージ番号、ステージ名、ALERT、SCORE、迎撃ログ、入力端末、CLEAR、送信は維持しています。モバイル専用として追加した可視ラベルは「ターミナル」「任務」「解析」「進行」「入力消去」「完了」です。これらは新しいゲーム内容ではなく、iPhone用ナビゲーションと入力操作です。

## 修正した主要不一致

1. 長い1カラム縦スクロールを廃止し、4タブへ分割
2. 入力端末が画面外へ流れる問題を、固定ゲーム領域と内部スクロールで解消
3. iOSキーボードで下部操作が隠れる問題を、Visual Viewport＋基準高検出で回避
4. 38〜42pxだった一部モバイル操作を44px以上へ拡大
5. 小型iPhoneでのターミナル高さを再配分
6. 横画面のステージ、CLEAR、ヘッダー操作を44pxへ拡大
7. Safari PWA追加手順をゲーム内へ追加

## 残るリスク

- 物理iPhoneのSafari / WebKitでは、OSバージョン、表示倍率、ユーザーの文字サイズ設定、キーボード種類によりVisual Viewportの挙動が微妙に異なる可能性があります。
- `env(safe-area-inset-*)` の実値はノッチ付き実機でのみ最終確認できます。
- GitHub Pages公開後、実際に使用するiPhoneで「通常Safari」「ホーム画面PWA」「日本語キーボード表示」の3状態を1回ずつ確認する必要があります。

## テスト用ブラウザ設定の補足

コンテナ内ChromiumにはURL全遮断の管理ポリシーが設定されていたため、QA中だけ当該ポリシーファイルをバックアップしてURL遮断項目を除外しました。試験終了後に元のポリシーファイルへ復元しています。アプリ側の判定やブラウザ出力は偽装していません。
