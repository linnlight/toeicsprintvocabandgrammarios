import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const headings = new Set([
  'Vocabulary in the main contexts of TOEIC items', '2019-11', 'Companies and businesses',
  'Company structure', 'Business procedures', 'Office and procedures', 'Employment', 'Office',
  'Telephone', 'Computers', 'Finance and bank', 'Job interview', 'Insurance', 'Post office',
  'Science', 'Construction', 'Travel, occupations, and places (and other)',
  'Planes, trains, cars, buses, and taxis', 'Entertainment', 'Economy', 'Occupations',
  'Museums and libraries', 'Feelings', 'Places', 'Other',
]);

const parentHeadings = new Set([
  'Vocabulary in the main contexts of TOEIC items', '2019-11', 'Companies and businesses',
  'Travel, occupations, and places (and other)',
]);

const categoryJa = {
  'Company structure': '会社組織', 'Business procedures': 'ビジネス手続き',
  'Office and procedures': 'オフィス業務', Employment: '雇用・製造', Office: 'オフィス',
  Telephone: '電話', Computers: 'コンピューター', 'Finance and bank': '金融・銀行',
  'Job interview': '採用面接', Insurance: '保険', 'Post office': '郵便', Science: '科学',
  Construction: '建設', 'Planes, trains, cars, buses, and taxis': '旅行・交通',
  Entertainment: '娯楽', Economy: '経済', Occupations: '職業',
  'Museums and libraries': '博物館・図書館', Feelings: '感情', Places: '場所', Other: 'その他',
};

const normalizations = new Map(Object.entries({
  'trade (n. & v.)': 'trade', '(re)schedule': 'reschedule', 'participant(s)': 'participant',
  'policy (statement)': 'policy statement', 'photocopy (ier)': 'photocopy',
  'manual (instructions)': 'manual', 'run (a program)': 'run', 'account(s)': 'account',
  'deposit(s)': 'deposit', 'check (cheque)': 'check', 'payment(s)': 'payment',
  'curriculum vitae (C.V.)': 'curriculum vitae', 'laboratory (lab)': 'laboratory',
  'call (a flight)': 'call', 'carriage (car)': 'carriage', 'check (oil)': 'check',
  'tire (flat tire)': 'tire', 'shelf (shelves)': 'shelf',
}));

function slugify(term) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function translateTerms(terms) {
  const lines = terms.map((term, index) => `__TERM_${index}__ ${term} (word or phrase)`);
  const params = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'ja', dt: 't', q: lines.join('\n') });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
  const data = await response.json();
  const translated = data[0].map((item) => item[0]).join('');
  const result = Array.from({ length: terms.length }, () => '');
  for (const line of translated.split('\n')) {
    const match = line.match(/^__TERM_(\d+)__\s*(.*)$/);
    if (match) result[Number(match[1])] = match[2].replace(/\s*[（(](?:単語|語句|単語または語句)[）)]\s*$/, '').trim();
  }
  return result;
}

const input = resolve(process.argv[2] ?? '/tmp/vocabulary-toeic.txt');
const outputIndex = process.argv.indexOf('--out');
const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
if (!output) throw new Error('Use --out <file.json>.');

const lines = (await readFile(input, 'utf8')).split(/\r?\n/);
const extracted = [];
let category = 'Other';
for (const line of lines) {
  const value = line.trim();
  if (!value || value.startsWith('--')) continue;
  if (headings.has(value)) {
    if (!parentHeadings.has(value)) category = value;
    continue;
  }
  for (const rawTerm of line.split('\t').map((term) => term.trim()).filter(Boolean)) {
    extracted.push({ term: normalizations.get(rawTerm) ?? rawTerm, category });
  }
}

const unique = [];
const seen = new Set();
for (const entry of extracted) {
  const key = entry.term.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(entry);
}

const meanings = [];
for (let index = 0; index < unique.length; index += 25) {
  meanings.push(...await translateTerms(unique.slice(index, index + 25).map((entry) => entry.term)));
  console.log(`Translated ${Math.min(index + 25, unique.length)}/${unique.length} topic terms`);
}

const records = unique.map((entry, index) => {
  const meaningJa = meanings[index] || entry.term;
  const japaneseCategory = categoryJa[entry.category] ?? entry.category;
  return {
    id: `topic-${slugify(entry.term)}`,
    term: entry.term,
    pronunciation: '英語音声',
    partOfSpeech: '語句',
    meaningJa,
    category: japaneseCategory,
    level: 1,
    example: `The TOEIC material uses "${entry.term}" in a ${entry.category.toLowerCase()} context.`,
    exampleJa: `「${meaningJa}」は${japaneseCategory}の文脈で使われる語句です。`,
    explanationJa: `${japaneseCategory}に関連するTOEIC語彙です。意味と使われる場面を確認しましょう。`,
    distractors: [],
    sourceId: 'vocabulary-toeic-2019',
    sourceLocator: `pp.1–2 / ${entry.category}`,
    contentTypes: ['source_term', 'editorial_translation', 'ai_assisted_learning'],
  };
});

records.forEach((record, index) => {
  const distractors = [];
  for (let offset = 5; distractors.length < 3; offset += 13) {
    const candidate = records[(index + offset) % records.length].meaningJa;
    if (candidate !== record.meaningJa && !distractors.includes(candidate)) distractors.push(candidate);
  }
  record.distractors = distractors;
});

await writeFile(resolve(output), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Extracted ${extracted.length} source items and wrote ${records.length} unique topic records.`);
