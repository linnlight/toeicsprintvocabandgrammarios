# Content workflow

## Sources

`src/content/sources.json` が教材の出典台帳です。提供された2冊を登録済みです。

- `Vocabulary-TOEIC.pdf`: 2ページ。346項目を抽出し、表記正規化後326の重複なしレコードを生成。
- `600-Essential-Words-For-The-TOEIC-Test.pdf`: 374ページ。50レッスン×12語の語彙ページをOCRし、600レコードを生成。

編集済み20語を優先し、次に600語教材、最後にトピック一覧の順で同じ見出し語を統合します。現在のアプリ内カタログは重複なし875語です。

語彙レコードは `sourceId` と `sourceLocator` を持ちます。`contentTypes` は原典語彙、編集訳、AI支援学習コンテンツを区別します。

## Editing JSON

`src/content/vocabulary.json` を直接編集し、次を実行します。

```bash
npm run content:validate
npm run typecheck
```

IDは進捗データのキーなので、公開後は変更しません。削除したIDの履歴は害を与えませんが、画面には表示されなくなります。

## Importing CSV / spreadsheets

1. `src/content/templates/vocabulary.csv` をGoogle SheetsまたはExcelへ読み込む。
2. 1行1語で編集する。`distractors` と `contentTypes` は `|` 区切り。
3. UTF-8 CSVで書き出す。
4. 検証してからJSONを生成する。

```bash
npm run content:import -- words.csv --check
npm run content:import -- words.csv --out src/content/vocabulary.json
```

インポーターは必須列、レベル、選択肢数、重複ID、出典IDを検証します。アプリ起動時にはZodが完全なレコード形状を再検証します。

## Recommended production pipeline

OCR/出版社データ → 自動整形 → 人手校正 → 翻訳・例文生成 → 教育レビュー → CSV承認 → JSON/API import

AI生成項目は原典と混同せず、モデル・プロンプト・レビュー状態を将来のsource metadataに追加してください。

## PDF regeneration

OCR済みテキストから600語教材を再生成する場合は次を使います。

```bash
node scripts/build-pdf-vocabulary.mjs /path/to/psm3-ocr /path/to/psm6-ocr \
  --translate --out src/content/essential-vocabulary.json
node scripts/build-topic-vocabulary.mjs /path/to/Vocabulary-TOEIC.txt \
  --out src/content/topic-vocabulary.json
```

生成後は `npm run content:validate` と `npm test` を必ず実行します。OCR由来語彙のページ情報は各レコードの `sourceLocator` に保持されます。
