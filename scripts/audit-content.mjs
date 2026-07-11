import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = ['vocabulary.json', 'essential-vocabulary.json', 'topic-vocabulary.json'];
const records = (await Promise.all(files.map(async (file) => (
  JSON.parse(await readFile(resolve('src/content', file), 'utf8'))
)))).flat();
const tests = JSON.parse(await readFile(resolve('src/content/part5-tests.json'), 'utf8'));
const grammarLessons = JSON.parse(await readFile(resolve('src/content/grammar-lessons.json'), 'utf8'));

const ocrArtifacts = /»|�|\b(?:wark|untess|canterence|callected|porttolio|porttolios|empioyee|aftemoon|chets|concems|dacided|foom|lusually|shauld|heaith|vatus|paople)\b/i;
const failures = [];
const ids = new Set();

for (const record of records) {
  if (ids.has(record.id)) failures.push(`Duplicate vocabulary id: ${record.id}`);
  ids.add(record.id);
  if (ocrArtifacts.test(record.example)) failures.push(`OCR artifact in ${record.id}: ${record.example}`);
  if (new Set(record.distractors).size !== record.distractors.length) failures.push(`Duplicate distractor in ${record.id}`);
  if (record.distractors.includes(record.meaningJa)) failures.push(`Correct answer used as distractor in ${record.id}`);
}

for (const test of tests) {
  for (const question of test.questions) {
    if ((question.prompt.match(/_____/g) ?? []).length !== 1) failures.push(`Invalid blank count in ${question.id}`);
    if (new Set(question.options).size !== 4) failures.push(`Duplicate options in ${question.id}`);
  }
}

const grammarIds = new Set();
for (const lesson of grammarLessons) {
  if (grammarIds.has(lesson.id)) failures.push(`Duplicate grammar lesson id: ${lesson.id}`);
  grammarIds.add(lesson.id);
  if (!Array.isArray(lesson.examples) || lesson.examples.length < 2) failures.push(`Too few examples in ${lesson.id}`);
  if (!Array.isArray(lesson.questions) || lesson.questions.length < 3) failures.push(`Too few questions in ${lesson.id}`);
  for (const question of lesson.questions ?? []) {
    if (grammarIds.has(question.id)) failures.push(`Duplicate grammar question id: ${question.id}`);
    grammarIds.add(question.id);
    if ((question.prompt.match(/_____/g) ?? []).length !== 1) failures.push(`Invalid grammar blank count in ${question.id}`);
    if (new Set(question.options).size !== 4) failures.push(`Duplicate grammar options in ${question.id}`);
    if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) failures.push(`Invalid grammar answer in ${question.id}`);
  }
}

if (failures.length) throw new Error(`Content audit failed:\n${failures.join('\n')}`);
console.log(`Audited ${records.length} vocabulary records, ${tests.flatMap((test) => test.questions).length} Part 5 questions, and ${grammarLessons.length} grammar lessons.`);
