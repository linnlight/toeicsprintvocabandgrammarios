# Architecture

## Decisions

- **Expo Router + thin routes:** 画面は表示とナビゲーションを担当し、学習ロジックは `src/domain` に置く。Web/iOSで同じルートとコンポーネントを使う。
- **Pure domain functions:** 出題順、誤答再出題、復習間隔、結果、ストリークはReactに依存しない。高速な単体テストが可能。
- **Repository boundary for storage:** UIはAsyncStorageを直接呼ばない。`ProgressStorage`を実装するクラウドリポジトリへ将来差し替えられる。
- **JSON content catalog:** 語彙と出典を進捗データから分離し、Zodで起動時に検証する。単語IDは安定した外部キーとしてレビュー履歴に保存する。
- **Single local app provider:** MVP規模では追加の状態管理ライブラリを導入せず、reducer + Contextで永続状態と実行中Sprintを管理する。

## Data flow

```text
content JSON ──validated catalog──┐
                                 ├── AppProvider ── route screens
AsyncStorage ── ProgressStorage ──┘       │
                                          └── pure domain functions
```

永続化するのは設定・レビュー履歴・集計だけです。実行中Sprintはセッション状態なので、アプリ再起動時には新しく開始します。

## Spaced repetition

MVPではSM-2を簡略化した決定的な方式です。初回正解は1日後、2回目は3日後、それ以降は前回間隔×易度係数。誤答は反復回数をリセットし、翌日に再出題します。同一Sprintでは誤答語をキュー末尾へ1回だけ追加します。

## Future seams

- Accounts/cloud sync: `ProgressStorage`の別実装と認証Providerを追加
- Subscriptions: entitlement serviceを追加し、ルートまたはコンテンツセットを保護
- RevenueCat/StoreKit: entitlement serviceのiOS実装として隔離
- Notifications: `dueAt`の最短値を通知スケジューラへ渡す
- Analytics: AppProviderの操作境界から匿名イベントを送信
- AI explanations: content repository経由で生成済みレコードを取得し、出典・生成モデルをメタデータに追加
- Larger libraries: JSON importをAPI/SQLite repositoryへ交換。画面はIDとcatalog interfaceを維持

## Deliberate MVP limits

- 進捗は1端末のみで、端末間同期はしない。
- 実行中Sprintの再開はしない。
- 現在の教材は提供PDFから生成した875語。OCR結果と機械翻訳には継続的な教育レビューが必要。
- 復習アルゴリズムは学習データを得てから調整する。
