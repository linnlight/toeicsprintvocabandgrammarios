# Vocab Sprint

TOEIC対策向けのモバイルファースト語彙学習MVPです。Expo SDK 56、React Native、TypeScript、Expo RouterでWebとiOSを同じコードベースから提供します。アカウントは不要で、進捗は端末内に保存されます。

## Run

```bash
npm install
npm run web
```

iOS Simulatorでは `npm run ios` を使います。品質チェック一式は次のとおりです。

```bash
npm run typecheck
npm run lint
npm test
npm run content:validate
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
- AsyncStorageによるWeb/iOS共通のローカル保存
- 日本語・英語UI切替（語彙の解説コンテンツは日本語を維持）
- 提供PDFから抽出・検証した875の重複なし語彙レコード

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

設計判断と拡張ポイントは [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、コンテンツ更新手順は [docs/CONTENT.md](docs/CONTENT.md) に記載しています。
