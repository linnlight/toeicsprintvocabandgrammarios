import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const lessonPages = [
  13, 19, 25, 31, 37, 45, 51, 57, 63, 69,
  77, 83, 89, 95, 101, 109, 115, 121, 127, 133,
  141, 147, 153, 159, 165, 173, 179, 185, 191, 197,
  205, 211, 217, 223, 229, 237, 243, 249, 255, 261,
  269, 275, 281, 287, 293, 301, 307, 313, 319, 325,
];

const lessonCategories = [
  'Contracts', 'Marketing', 'Warranties', 'Business Planning', 'Conferences',
  'Computers', 'Office Technology', 'Office Procedures', 'Electronics', 'Correspondence',
  'Job Advertising and Recruiting', 'Applying and Interviewing', 'Hiring and Training', 'Salaries and Benefits', 'Promotions, Pensions, and Awards',
  'Shopping', 'Ordering Supplies', 'Shipping', 'Invoices', 'Inventory',
  'Banking', 'Accounting', 'Investments', 'Taxes', 'Financial Statements',
  'Property and Departments', 'Board Meetings and Committees', 'Quality Control', 'Product Development', 'Renting and Leasing',
  'Selecting a Restaurant', 'Eating Out', 'Ordering Lunch', 'Cooking as a Career', 'Events',
  'General Travel', 'Airlines', 'Trains', 'Hotels', 'Car Rentals',
  'Movies', 'Theater', 'Music', 'Museums', 'Media',
  "Doctor's Office", "Dentist's Office", 'Health Insurance', 'Hospitals', 'Pharmacy',
];

const categoryJa = {
  Contracts: '契約', Marketing: 'マーケティング', Warranties: '保証', 'Business Planning': '事業計画', Conferences: '会議',
  Computers: 'コンピューター', 'Office Technology': 'オフィス技術', 'Office Procedures': 'オフィス業務', Electronics: '電子機器', Correspondence: 'ビジネス文書',
  'Job Advertising and Recruiting': '求人・採用', 'Applying and Interviewing': '応募・面接', 'Hiring and Training': '雇用・研修', 'Salaries and Benefits': '給与・福利厚生', 'Promotions, Pensions, and Awards': '昇進・年金・表彰',
  Shopping: '購買', 'Ordering Supplies': '備品発注', Shipping: '配送', Invoices: '請求書', Inventory: '在庫',
  Banking: '銀行', Accounting: '会計', Investments: '投資', Taxes: '税務', 'Financial Statements': '財務諸表',
  'Property and Departments': '施設・部門', 'Board Meetings and Committees': '取締役会・委員会', 'Quality Control': '品質管理', 'Product Development': '製品開発', 'Renting and Leasing': '賃貸・リース',
  'Selecting a Restaurant': 'レストラン選び', 'Eating Out': '外食', 'Ordering Lunch': '昼食の注文', 'Cooking as a Career': '調理の仕事', Events: 'イベント',
  'General Travel': '旅行', Airlines: '航空', Trains: '鉄道', Hotels: 'ホテル', 'Car Rentals': 'レンタカー',
  Movies: '映画', Theater: '劇場', Music: '音楽', Museums: '博物館', Media: 'メディア',
  "Doctor's Office": '診療所', "Dentist's Office": '歯科医院', 'Health Insurance': '健康保険', Hospitals: '病院', Pharmacy: '薬局',
};

const partOfSpeechJa = {
  v: '動詞', n: '名詞', adj: '形容詞', adv: '副詞', prep: '前置詞', phrase: '語句',
};

const partOfSpeechEn = {
  v: 'verb', n: 'noun', adj: 'adjective', adv: 'adverb', prep: 'preposition', phrase: 'phrase',
};

const ocrTermCorrections = new Map(Object.entries({
  specitic: 'specific',
  avold: 'avoid',
  'bring In': 'bring in',
  Imply: 'imply',
  ellent: 'client',
  Joint: 'joint',
  awe: 'owe',
  Influx: 'influx',
  distingulsh: 'distinguish',
  evincide: 'coincide',
  Ilcense: 'license',
  tler: 'tier',
  categery: 'category',
  'atch up': 'catch up',
  Illuminate: 'illuminate',
  pesition: 'position',
  concer: 'concern',
  polly: 'policy',
}));

const meaningCorrectionsJa = new Map(Object.entries({
  'as needed': '必要に応じて',
}));

function clean(value) {
  return value
    .replaceAll('|', 'I')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHeaders(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  const headerPattern = /(?:^|\s)(\d{1,2})[.,]?\s+_?(.+?)\s+(v\.\s*phrase|n\.\s*phrase|adj[.,]|adv[.,]|prep[.,]|v[.,]|n[.,])\s*(.*)$/i;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(headerPattern);
    if (!match) continue;
    const term = clean(match[2]).replace(/^_+/, '');
    if (!term || term.length > 45 || /definitions|examples/i.test(term)) continue;
    const posToken = match[3].toLowerCase();
    const pos = posToken.startsWith('adj') ? 'adj' : posToken.startsWith('adv') ? 'adv' : posToken.startsWith('prep') ? 'prep' : posToken.startsWith('n') ? 'n' : 'v';
    let definition = clean(match[4]).replace(/^,+\s*/, '');
    const exampleLines = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (headerPattern.test(lines[cursor])) break;
      const line = clean(lines[cursor]);
      if (/^[ab][.,]\s+/i.test(line)) exampleLines.push(line.replace(/^[ab][.,]\s+/i, ''));
      else if (exampleLines.length > 0 && line && !/^\d+$/.test(line)) exampleLines[exampleLines.length - 1] += ` ${line}`;
      else if (!exampleLines.length && line && !/^[ab][.,]\s*/i.test(line)) definition += ` ${line}`;
    }
    entries.push({ number: Number(match[1]), term: ocrTermCorrections.get(term) ?? term, pos, definition: clean(definition), example: clean(exampleLines[0] ?? '') });
  }
  return entries;
}

function score(entries) {
  return new Set(entries.map((entry) => entry.term.toLowerCase())).size;
}

function slugify(term) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function translateBlock(entries) {
  const lines = entries.flatMap((entry, index) => [
    `__TERM_${index}__ ${entry.term} (${partOfSpeechEn[entry.pos] ?? 'word'})`,
    `__DEF_${index}__ ${entry.definition}`,
    `__EX_${index}__ ${entry.example}`,
  ]);
  const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'ja', dt: 't', q: lines.join('\n') });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = data[0].map((item) => item[0]).join('');
  const result = entries.map(() => ({ meaningJa: '', explanationJa: '', exampleJa: '' }));
  for (const line of translated.split('\n')) {
    const match = line.match(/^__(TERM|DEF|EX)_(\d+)__\s*(.*)$/);
    if (!match) continue;
    const target = result[Number(match[2])];
    if (!target) continue;
    if (match[1] === 'TERM') target.meaningJa = clean(match[3])
      .replace(/^[（(](?:動詞|名詞|形容詞|副詞|前置詞|語句|単語)[）)]\s*/, '')
      .replace(/\s*[（(](?:動詞|名詞|形容詞|副詞|前置詞|語句|単語)[）)]\s*$/, '')
      .replace(/^(?:を|に|が)(?=[一-龯ぁ-んァ-ン])/, '');
    if (match[1] === 'DEF') target.explanationJa = clean(match[3]);
    if (match[1] === 'EX') target.exampleJa = clean(match[3]);
  }
  return result;
}

async function main() {
  const ocrPrimary = resolve(process.argv[2] ?? '/tmp/toeic-ocr-hi');
  const ocrSecondary = resolve(process.argv[3] ?? '/tmp/toeic-lessons-ocr');
  const outputArg = process.argv.indexOf('--out');
  const output = outputArg >= 0 ? process.argv[outputArg + 1] : null;
  const shouldTranslate = process.argv.includes('--translate');
  const lessons = [];

  for (let index = 0; index < lessonPages.length; index += 1) {
    const page = lessonPages[index];
    const [primary, secondary] = await Promise.all([
      readFile(resolve(ocrPrimary, `page_${page}_screenshot.txt`), 'utf8'),
      readFile(resolve(ocrSecondary, `page_${page}.txt`), 'utf8'),
    ]);
    const primaryEntries = parseHeaders(primary);
    const secondaryEntries = parseHeaders(secondary);
    const entries = score(primaryEntries) >= score(secondaryEntries) ? primaryEntries : secondaryEntries;
    lessons.push({ lesson: index + 1, page, category: lessonCategories[index], entries });
  }

  const total = lessons.reduce((sum, lesson) => sum + lesson.entries.length, 0);
  const incomplete = lessons.filter((lesson) => score(lesson.entries) !== 12);
  if (incomplete.length > 0 || !shouldTranslate) {
    console.log(`Parsed ${total}/600 entries.`);
    for (const lesson of incomplete) {
      console.log(`Lesson ${lesson.lesson} (${lesson.page}, ${lesson.category}): ${score(lesson.entries)} entries`);
      console.log(`  ${lesson.entries.map((entry) => entry.term).join(' | ')}`);
    }
    if (incomplete.length > 0) process.exitCode = 1;
    if (!shouldTranslate || incomplete.length > 0) return;
  }

  const records = [];
  for (const lesson of lessons) {
    const translations = await translateBlock(lesson.entries);
    lesson.entries.forEach((entry, index) => {
      const translation = translations[index];
      records.push({
        id: `essential-${String(lesson.lesson).padStart(2, '0')}-${slugify(entry.term)}`,
        term: entry.term,
        pronunciation: '英語音声',
        partOfSpeech: partOfSpeechJa[entry.pos] ?? '語句',
        meaningJa: meaningCorrectionsJa.get(entry.term) ?? (translation.meaningJa || translation.explanationJa),
        category: categoryJa[lesson.category] ?? lesson.category,
        level: lesson.lesson <= 15 ? 1 : lesson.lesson <= 35 ? 2 : 3,
        example: entry.example || `The term "${entry.term}" is useful in this context.`,
        exampleJa: translation.exampleJa || `${entry.term}はこの場面で役立つ語句です。`,
        explanationJa: translation.explanationJa || `${entry.term}の意味と使い方を確認しましょう。`,
        distractors: [],
        sourceId: '600-essential-words',
        sourceLocator: `Lesson ${lesson.lesson}: ${lesson.category} / PDF p.${lesson.page}`,
        contentTypes: ['source_term', 'editorial_translation', 'ai_assisted_learning'],
      });
    });
    console.log(`Translated lesson ${lesson.lesson}/50`);
  }

  const meanings = records.map((record) => record.meaningJa);
  records.forEach((record, index) => {
    const distractors = [];
    for (let offset = 7; distractors.length < 3; offset += 11) {
      const candidate = meanings[(index + offset) % meanings.length];
      if (candidate !== record.meaningJa && !distractors.includes(candidate)) distractors.push(candidate);
    }
    record.distractors = distractors;
  });

  if (!output) throw new Error('Use --out <file.json> when translating.');
  await writeFile(resolve(output), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${records.length} records to ${basename(output)}`);
}

await main();
