import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { VoiceQuality, type Voice } from 'expo-speech';

let preferredVoicePromise: Promise<string | undefined> | undefined;
let audioModePromise: Promise<void> | undefined;

// Ava and Samantha are Apple's most natural broadly available US English
// voices. Enhanced variants are preferred by voiceScore when installed.
const preferredVoiceNames = ['ava', 'samantha', 'allison', 'zoe', 'susan', 'karen', 'daniel'];
const noveltyVoiceNames = ['bad news', 'bells', 'boing', 'bubbles', 'cellos', 'jester', 'organ', 'trinoids', 'whisper', 'wobble', 'zarvox'];

function voiceScore(voice: Voice): number {
  const language = voice.language.replace('_', '-').toLowerCase();
  const description = `${voice.name} ${voice.identifier}`.toLowerCase();
  let score = voice.quality === VoiceQuality.Enhanced ? 2_000 : 0;

  if (description.includes('premium')) score += 3_000;
  else if (description.includes('enhanced')) score += 1_000;

  if (language === 'en-us') score += 200;
  else if (language.startsWith('en-')) score += 100;

  const preferredIndex = preferredVoiceNames.findIndex((name) => description.includes(name));
  if (preferredIndex >= 0) score += preferredVoiceNames.length - preferredIndex;
  if (noveltyVoiceNames.some((name) => description.includes(name))) score -= 2_000;

  return score;
}

export function selectPreferredEnglishVoice(voices: Voice[]): Voice | undefined {
  return voices
    .filter((voice) => voice.language.replace('_', '-').toLowerCase().startsWith('en-'))
    .sort((left, right) => voiceScore(right) - voiceScore(left))[0];
}

async function preferredVoiceIdentifier(): Promise<string | undefined> {
  preferredVoicePromise ??= Speech.getAvailableVoicesAsync()
    .then((voices) => selectPreferredEnglishVoice(voices)?.identifier)
    .catch(() => undefined);
  return preferredVoicePromise;
}

async function prepareAudioSession(): Promise<void> {
  audioModePromise ??= setAudioModeAsync({
    interruptionMode: 'duckOthers',
    playsInSilentMode: true,
  }).catch(() => undefined);
  return audioModePromise;
}

export async function speakEnglish(text: string): Promise<void> {
  const normalizedText = text.trim();
  if (!normalizedText) return;

  const [, voice] = await Promise.all([prepareAudioSession(), preferredVoiceIdentifier()]);
  await Speech.stop();
  Speech.speak(normalizedText, {
    language: 'en-US',
    pitch: 0.98,
    rate: 0.82,
    voice,
    volume: 1,
  });
}
