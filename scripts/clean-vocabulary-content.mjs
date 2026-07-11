import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const file = resolve('src/content/essential-vocabulary.json');
const records = JSON.parse(await readFile(file, 'utf8'));

const replacements = new Map([
  ['wark', 'work'],
  ['One the customer', 'Once the customer'],
  ['Inthe competition', 'In the competition'],
  ['heat- resistant', 'heat-resistant'],
  ['Awarranty', 'A warranty'],
  ['Acar warranty', 'A car warranty'],
  ["I's important", "It's important"],
  ['business pian', 'business plan'],
  ['concered', 'concerned'],
  ['Abusiness plan', 'A business plan'],
  ['untess', 'unless'],
  ['mode! computer', 'model computer'],
  ["the 'one introduced", 'the one introduced'],
  ['how fo fix', 'how to fix'],
  ['canterence', 'conference'],
  ['callected', 'collected'],
  ['itis ', 'it is '],
  ['Itis ', 'It is '],
  ['per- fect', 'perfect'],
  ['porttolios', 'portfolios'],
  ['porttolio', 'portfolio'],
  ['eared their respect', 'earned their respect'],
  ['empioyee', 'employee'],
  ['position an working', 'position on working'],
  ['eamed a better salary', 'earned a better salary'],
  ['fast two years', 'past two years'],
  ["what 'Il do", "what I'll do"],
  ['conduoting', 'conducting'],
  ['at atime', 'at a time'],
  ['lam very impressed', 'I am very impressed'],
  ['aftemoon', 'afternoon'],
  ['chets borrow', 'chefs borrow'],
  ['concems', 'concerns'],
  ['dacided', 'decided'],
  ['emergency foom', 'emergency room'],
  ['lusually', 'I usually'],
  ['responsibili- ties', 'responsibilities'],
  ['satis- faction', 'satisfaction'],
  ['shauld', 'should'],
  ['tis important', 'It is important'],
  ['heaith', 'health'],
  ['dollar vatus', 'dollar values'],
  ['wellbaby', 'well-baby'],
  ['paople', 'people'],
  ['company \'ast month', 'company last month'],
  ['Aquality control', 'A quality control'],
  ['Aluxury vacation', 'A luxury vacation'],
]);

const fieldCorrections = {
  'essential-34-method': {
    exampleJa: '多くのシェフは、さまざまな文化の調理法を自分たちの料理スタイルに取り入れています。',
  },
  'essential-46-appointment': {
    exampleJa: '診察を最大限に活用するため、症状や懸念事項を記録しておきましょう。',
  },
};

function cleanEnglish(value) {
  let result = value.split(/\s*»\.?\s*/)[0].trim();
  for (const [before, after] of replacements) result = result.replaceAll(before, after);
  result = result.replace(/,\s*$/, '.');
  if (!/[.!?]$/.test(result)) result += '.';
  return result;
}

function cleanJapanese(value) {
  const result = value.split(/\s*»。?\s*/)[0].trim();
  return /[。！？]$/.test(result) ? result : `${result}。`;
}

for (const record of records) {
  record.example = cleanEnglish(record.example);
  record.exampleJa = cleanJapanese(record.exampleJa);
  Object.assign(record, fieldCorrections[record.id]);
}

await writeFile(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Cleaned ${records.length} vocabulary records.`);
