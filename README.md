# Vocab Sprint

TOEIC対策向けのモバイルファースト語彙学習MVPです。Expo SDK 56、React Native、TypeScript、Expo RouterでWebとiOSを同じコードベースから提供します。アカウントは不要で、進捗は端末内に保存されます。

## Run

Node.js 22 LTSとnpm 10.9.4を使います。`.nvmrc`を読める環境では、最初に次を実行してください。

```bash
nvm use
npm ci
npm run web
```

XcodeでiOS Simulatorへローカルビルドする場合は `npm run ios`、USB接続したiPhoneへインストールする場合は `npm run ios:device`を使います。初回ビルド後の通常開発は `npm run start:dev-client` でFast Refreshを利用できます。

品質チェック一式は次の1コマンドです。

```bash
npm run check
npm run export:web
```

## MVP flow

`Onboarding → Home → Sprint → Results → Review → Progress`

- 現在・目標スコアと1日の語数を設定
- 期限到来語、新規語、復習予定語の順に出題
- 回答直後の正誤・日本語解説と英語読み上げ
- 間違えた単語を同一Sprint内で1回再出題
- 正答履歴から次回復習日を計算
- 復習一覧、単語詳細、連続学習日数、定着度、正答率
- 毎日の学習通知、日曜の週間まとめ通知、直近7日間の学習サマリー
- 1日休んだ場合に月1回だけ自動適用されるストリークフリーズ
- AsyncStorageによるWeb/iOS共通のローカル保存
- 日本語・英語UI切替（語彙の解説コンテンツは日本語を維持）
- RevenueCatによるPro月額・年額、購入復元、Appleプロモーションコード
- 無料プランは1日20語、Proは設定した1日の目標語数まで利用可能
- 提供PDFから抽出・検証した875の重複なし語彙レコード
- TOEIC Part 5形式の短文穴埋めテスト10セット・400問
- 提供された文法教材を網羅する文法レッスン40件・練習問題120問
- Part 5テスト1〜2は無料、テスト3〜10はPro。得点・ベストスコア・受験回数を端末に保存

AsyncStorageに保存するのは学習設定・復習履歴・集計のみです。認証情報、決済情報、シークレットは保存しません。

通知はiOS/Androidのネイティブ機能です。`expo-notifications`を追加した後は、Expo Goではなく `npm run ios` または `npm run ios:device` で開発ビルドを作り直してください。Webでは週間サマリーとフリーズ状態を確認できますが、通知の予約は行いません。

## Project layout

```text
src/app/            Expo Routerの画面とルート
src/components/ui/  小さな共通デザインシステム
src/content/        UIから独立した語彙・出典JSON
src/domain/         Sprint、復習間隔、ストリークの純粋ロジック
src/services/       保存など外部I/Oの境界
src/state/          画面から使うアプリ状態と操作
scripts/            コンテンツ取込・検証ツール
```

Part 5問題は提供PDFの二段組みレイアウトと解答マークを検証してから
`src/content/part5-tests.json` に格納しています。再取込にはPython 3、
`pdfplumber`、および `scripts/import-part5-pdf.py` を使用します。

設計判断と拡張ポイントは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、コンテンツ更新手順は [docs/CONTENT.md](docs/CONTENT.md)、決済設定は [docs/PAYMENTS.md](docs/PAYMENTS.md) に記載しています。
