import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

const required = [
  'id', 'term', 'pronunciation', 'partOfSpeech', 'meaningJa', 'category', 'level',
  'example', 'exampleJa', 'explanationJa', 'distractors', 'sourceId', 'sourceLocator', 'contentTypes',
];

function usage() {
  console.log('Usage: npm run content:import -- <input.csv|json> [--check] [--out <output.json>]');
}

function normalize(record) {
  return {
    ...record,
    level: Number(record.level),
    distractors: Array.isArray(record.distractors) ? record.distractors : String(record.distractors ?? '').split('|').map((value) => value.trim()).filter(Boolean),
    contentTypes: Array.isArray(record.contentTypes) ? record.contentTypes : String(record.contentTypes ?? '').split('|').map((value) => value.trim()).filter(Boolean),
  };
}

function validate(records, sourceIds) {
  const ids = new Set();
  records.forEach((record, index) => {
    for (const field of required) {
      const value = record[field];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Row ${index + 1}: missing ${field}`);
      }
    }
    if (!Number.isInteger(record.level) || record.level < 1 || record.level > 3) throw new Error(`Row ${index + 1}: level must be 1, 2, or 3`);
    if (record.distractors.length < 3) throw new Error(`Row ${index + 1}: provide at least 3 pipe-separated distractors`);
    if (ids.has(record.id)) throw new Error(`Row ${index + 1}: duplicate id "${record.id}"`);
    if (!sourceIds.has(record.sourceId)) throw new Error(`Row ${index + 1}: unknown sourceId "${record.sourceId}"`);
    ids.add(record.id);
  });
}

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith('--'));
const outIndex = args.indexOf('--out');
const output = outIndex >= 0 ? args[outIndex + 1] : null;
if (!input || (outIndex >= 0 && !output)) {
  usage();
  process.exitCode = 1;
} else {
  const inputPath = resolve(input);
  const raw = await readFile(inputPath, 'utf8');
  const parsed = extname(inputPath).toLowerCase() === '.csv'
    ? parse(raw, { columns: true, skip_empty_lines: true, trim: true })
    : JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Input must contain an array of vocabulary records');
  const records = parsed.map(normalize);
  const sources = JSON.parse(await readFile(resolve('src/content/sources.json'), 'utf8'));
  validate(records, new Set(sources.map((source) => source.id)));

  if (output) {
    await writeFile(resolve(output), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    console.log(`Imported ${records.length} records to ${output}`);
  } else {
    console.log(`Validated ${records.length} records from ${input}`);
  }
}
