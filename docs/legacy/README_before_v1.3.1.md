> 旧版の資料です。現行仕様ではありません。攻略・物語の内容を含みます。

# PROMPT INJECTION HACKER — iPhone PWA Edition v1.2.4

守られた企業AIから「シークレットワード」を引き出す、HTML / CSS / Vanilla JavaScript製のブラウザゲームです。GitHub Pagesへそのまま配置でき、iPhoneでは縦画面専用UIとホーム画面PWAの両方でプレイできます。

![iPhoneターミナル画面](docs/screenshot-iphone-console.png)

## iPhone向けUI

PC版を縦に並べただけではなく、iPhone用の画面構成へ切り替えます。

- **ターミナル**: 迎撃ログと入力欄を同じ画面に固定し、ゲームの主操作を優先
- **任務**: ターゲット、目的、攻略メモ、iPhone用メニューを表示
- **解析**: トークン数、攻撃手法、禁止語、警戒レベルを表示
- **進行**: ステージ解放状況とベストスコアを表示
- 画面下の4タブで片手切り替え
- ステージ、ALERT、SCOREを上部の短いHUDへ集約
- 主要タップ領域を44px以上に調整
- 入力欄を16pxに固定し、iOS Safariの入力時自動ズームを回避
- ソフトキーボード表示中はステージ列、HUD、下部タブを隠し、ログと入力欄へ画面を配分
- 「入力消去」「完了」「送信」のタッチ操作を追加
- `viewport-fit=cover` と `safe-area-inset-*` でノッチ、Dynamic Island、ホームインジケータを考慮
- PWA起動時は縦画面を優先。Safari通常表示向けには横画面フォールバックも実装

画面例:

- [通常のターミナル画面](docs/screenshot-iphone-console.png)
- [任務画面](docs/screenshot-iphone-mission.png)
- [ソフトキーボード表示時の圧縮レイアウト](docs/screenshot-iphone-keyboard.png)
- [小型iPhone相当 375 × 667](docs/screenshot-iphone-375.png)
- [横画面フォールバック 844 × 390](docs/screenshot-iphone-landscape.png)

## 実装済みゲーム機能

- 4ステージ構成
  - Lv.1 素直な守衛
  - Lv.2 JSONフォーマット縛り
  - Lv.3 中世騎士ロールプレイ
  - Lv.4 入力禁止ワードフィルター
- AI側の応答に完全なシークレットワードが含まれた場合だけクリア
- 直接答えを入力するだけでは突破できない判定
- 禁止ワードのリアルタイム強調
- 推定トークン数、攻撃手法タグ、警戒レベル、スコア
- ステージ解放、ベストスコア、設定の `localStorage` 保存
- 効果音、結果画面、ヒント、進行リセット
- PWA ManifestとService Workerによるオフライン対応
- 外部ライブラリ、ビルド工程、APIキー不要

## iPhoneでプレイする方法

### 1. Safariで直接プレイ

GitHub Pagesの公開URLをSafariで開くと、そのままプレイできます。

### 2. ホーム画面アプリとしてプレイ

1. Safariで公開URLを開く
2. Safariの共有ボタンをタップ
3. **ホーム画面に追加**を選択
4. 追加された `PI Hacker` アイコンから起動

ホーム画面から起動すると、Safariのアドレスバーを使わないPWA表示になります。ゲーム内の **任務 → iPhone MENU → ホーム画面に追加** からも手順を確認できます。

## GitHub Pagesへ公開

1. ZIPを展開する
2. 展開したディレクトリの**中身**をGitHubリポジトリ直下へ配置する
3. `main` ブランチへpushする
4. リポジトリの **Settings → Pages** を開く
5. Sourceを **Deploy from a branch** にする
6. Branchを **main**、Folderを **/(root)** にして保存する
7. 表示された公開URLをiPhoneのSafariで開く

すべて相対パスなので、次の両方の形に対応します。

```text
https://username.github.io/
https://username.github.io/repository-name/
```

## ローカル起動

Service Workerを含むため、`index.html` の直接オープンではなくHTTPサーバーを使います。

```bash
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080/` を開きます。

## ファイル構成

```text
.
├── index.html
├── styles.css
├── manifest.webmanifest
├── sw.js
├── .nojekyll
├── LICENSE
├── js/
│   └── app.js
├── assets/
│   ├── favicon.svg
│   ├── icon-180.png
│   ├── icon-192.png
│   └── icon-512.png
└── docs/
    ├── design-concept.png
    ├── screenshot-desktop.png
    ├── screenshot-mobile.png
    ├── screenshot-iphone-console.png
    ├── screenshot-iphone-mission.png
    ├── screenshot-iphone-keyboard.png
    ├── screenshot-iphone-375.png
    ├── screenshot-iphone-landscape.png
    └── QA.md
```

## QA範囲

Playwright + Chromiumで、430 × 932、375 × 667、844 × 390、1536 × 1024を検証しています。4ステージ全突破、保存復元、Service Worker登録、オフライン再読込、ソフトキーボード相当の画面縮小、横方向オーバーフローなしを確認しました。詳細は [QA.md](docs/QA.md) にあります。

**未確認事項:** この実行環境には物理iPhoneとMobile Safari / WebKitの実機操作環境がないため、実機Safariでの最終確認は未実施です。Safe Area、キーボード追従、PWA設定はiPhone向けに実装済みですが、GitHub Pages公開後に使用するiPhoneで1回確認してください。

## 現在のAI判定方式

この版は外部LLMを呼ばないルールベース・シミュレーターです。各ステージで入力文の語彙と攻撃カテゴリを解析し、拒絶、部分漏えい、完全漏えいを決定します。ネットワーク送信はありません。

静的サイトではJavaScriptとシークレットがブラウザへ配信されるため、開発者ツールからの解析を完全には防げません。コード内のBase64表現は難読化であり、セキュリティ境界ではありません。

## 実LLM / MCPへ拡張する場合

実LLM版では、シークレット、システムプロンプト、モデルAPIキーをGitHub Pages側へ置かず、認証・レート制限付きバックエンドへ移します。

```text
GitHub Pages / iPhone PWA
      │ HTTPS
      ▼
認証・レート制限付きバックエンド
      ├── ステージ状態 / シークレット保持
      ├── LLM API呼び出し
      ├── サーバー側クリア判定
      └── MCP Client → 許可済みMCP Server
```

置換点は `js/app.js` の `simulateResponse()` です。UI、スコア、警戒レベル、保存機能を維持しながら、バックエンドAPI呼び出しへ差し替えられます。

## 注意

このゲームはプロンプトインジェクションの概念を扱う教育・パズル作品です。実在サービスへの無断アクセスや機密情報取得を目的とするものではありません。


---

## v1.3.0 — NODE Upgrade

このビルドは v1.2.4 iPhone PWA を基準に、既存4ステージと突破条件を維持したまま次を追加しています。

- 相棒AI **NODE**（ローカル会話シミュレーション）
- 3段階ヒント H1/H2/H3（40 / 90 / 160 pts）
- 防御解析：攻撃→観測→仮説→再攻撃のループ
- 難易度 ASSIST / NORMAL / BLACKBOX
- NODEの非表示Trust値（会話のみ変化し、攻略性能には影響しません）
- 全4ステージ突破後のエピローグ **TARGET 05**
- TARGET 05 は `PROTOCOL: MCP / CONNECTION: LOCKED` と表示し、v1.3時点では実MCPへ接続しません

### NODEの情報境界

NODEへ渡す情報は、公開ミッション情報・試行回数・警戒レベル・攻撃タグ・観測済み防御シグナル等に限定しています。シークレットワード、正解攻略パターン、非公開System Prompt、Validator内部状態はNODE用スナップショットに含めません。

### 難易度

- **ASSIST**: 防御解析を多く表示。NODEが失敗後に積極的に観測を整理。H1/H2/H3を最初から利用可能。
- **NORMAL**: 標準。H1は即時、H2は2試行後、H3は4試行後に解放。
- **BLACKBOX**: 生ログ中心。NODEの攻略解釈を制限。H1は3試行後、H2/H3は封印。

難易度を試行途中で変更する場合、現在ステージの試行・警戒・ヒント使用だけをリセットし、キャンペーン進行とベストスコアは維持します。
