import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sampleRate = 48_000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'assets', 'audio');

function midiFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function envelope(time, duration, attack = 0.012, release = 0.1) {
  if (time < 0 || time >= duration) return 0;
  const attackGain = Math.min(1, time / attack);
  const releaseGain = Math.min(1, (duration - time) / release);
  return Math.sin((Math.PI / 2) * attackGain) * Math.sin((Math.PI / 2) * releaseGain) * Math.exp(-2.4 * time / duration);
}

function renderSound(duration, notes, peakLevel) {
  const samples = new Float64Array(Math.ceil(duration * sampleRate));

  for (const note of notes) {
    const frequency = midiFrequency(note.midi);
    const startSample = Math.floor(note.start * sampleRate);
    const endSample = Math.min(samples.length, Math.ceil((note.start + note.duration) * sampleRate));

    for (let index = startSample; index < endSample; index += 1) {
      const time = (index / sampleRate) - note.start;
      const gain = note.gain * envelope(time, note.duration, note.attack, note.release);
      const fundamental = Math.sin(2 * Math.PI * frequency * time);
      const overtone = 0.18 * Math.sin((2 * Math.PI * frequency * 2 * time) + 0.18);
      samples[index] += gain * (fundamental + overtone);
    }
  }

  const peak = samples.reduce((maximum, sample) => Math.max(maximum, Math.abs(sample)), 0) || 1;
  const scale = peakLevel / peak;
  return Int16Array.from(samples, (sample) => Math.round(Math.max(-1, Math.min(1, sample * scale)) * 32_767));
}

function writeWave(fileName, samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => buffer.writeInt16LE(sample, 44 + (index * bytesPerSample)));
  fs.writeFileSync(path.join(outputDirectory, fileName), buffer);
}

fs.mkdirSync(outputDirectory, { recursive: true });

writeWave('correct.wav', renderSound(0.72, [
  { midi: 72, start: 0, duration: 0.3, gain: 0.72, release: 0.12 },
  { midi: 76, start: 0.1, duration: 0.37, gain: 0.78, release: 0.14 },
  { midi: 79, start: 0.22, duration: 0.48, gain: 0.9, release: 0.2 },
], 0.76));

writeWave('incorrect.wav', renderSound(0.58, [
  { midi: 64, start: 0, duration: 0.3, gain: 0.7, attack: 0.02, release: 0.14 },
  { midi: 60, start: 0.16, duration: 0.4, gain: 0.78, attack: 0.02, release: 0.2 },
], 0.62));

console.log('Generated correct.wav and incorrect.wav');
