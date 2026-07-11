import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { vocabulary, vocabularyById } from '@/content/catalog';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { colors, radii, space } from '@/constants/theme';
import { buildChoices } from '@/domain/sprint';
import { uiCopy } from '@/i18n/copy';
import { speakEnglish } from '@/services/pronunciation';
import { useApp } from '@/state/app-provider';

interface Feedback {
  wordId: string;
  selected: string;
  correct: boolean;
}

const correctSound = require('../../assets/audio/correct.wav');
const incorrectSound = require('../../assets/audio/incorrect.wav');

export default function SprintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const correctPlayer = useAudioPlayer(correctSound, { keepAudioSessionActive: true });
  const incorrectPlayer = useAudioPlayer(incorrectSound, { keepAudioSessionActive: true });
  const { session, submitAnswer, data } = useApp();
  const copy = uiCopy[data.settings.uiLanguage].sprint;
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const displayedWordId = feedback?.wordId ?? session?.queue[session.cursor];
  const word = displayedWordId ? vocabularyById.get(displayedWordId) : undefined;
  const choices = useMemo(() => word ? buildChoices(word, vocabulary) : [], [word]);

  useEffect(() => {
    void setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  const playAnswerSound = (correct: boolean) => {
    const player = correct ? correctPlayer : incorrectPlayer;
    player.pause();
    void player.seekTo(0)
      .then(() => player.play())
      .catch(() => {
        try {
          player.play();
        } catch {
          // Sound effects are non-critical feedback. Haptics and visual feedback still run.
        }
      });
  };

  if (!session || !word) return <Redirect href="/home" />;

  const select = (choice: string) => {
    if (feedback) return;
    const correct = submitAnswer(choice);
    if (correct === null) return;
    setFeedback({ wordId: word.id, selected: choice, correct });
    playAnswerSound(correct);
    void Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => undefined);
  };

  const continueSprint = () => {
    if (session.completed) router.replace('/results');
    else setFeedback(null);
  };

  const speak = () => {
    void speakEnglish(word.term).catch(() => undefined);
  };

  const visiblePosition = feedback ? session.cursor : session.cursor + 1;

  return (
    <Screen
      scroll={false}
      contentStyle={styles.content}
      footer={feedback ? (
        <View style={[styles.feedback, { paddingBottom: Math.max(insets.bottom + space.sm, space.lg) }, feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <View style={styles.feedbackCopy}>
            <Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.success : colors.danger }]}>{feedback.correct ? copy.correct : copy.repeat}</Text>
            {!feedback.correct ? <Text style={styles.answerText}>{copy.answer}{word.meaningJa}</Text> : null}
            <Text style={styles.explanation}>{word.explanationJa}</Text>
          </View>
          <Button label={session.completed ? copy.results : copy.next} onPress={continueSprint} />
        </View>
      ) : undefined}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={() => router.replace('/home')} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        <View style={styles.progressWrap}><ProgressBar value={Math.min(1, session.cursor / session.queue.length)} /></View>
        <Text style={styles.count}>{Math.min(visiblePosition, session.queue.length)}/{session.queue.length}</Text>
      </View>

      <View style={styles.question}>
        <Text style={styles.prompt}>{copy.prompt}</Text>
        {session.cursor >= session.initialWordIds.length && !feedback ? <Text style={styles.repeatBadge}>{copy.again}</Text> : null}
        <View style={styles.wordRow}>
          <View>
            <Text style={styles.term}>{word.term}</Text>
            <Text style={styles.pronunciation}>
              {word.pronunciation === '英語音声' ? word.partOfSpeech : `${word.pronunciation} · ${word.partOfSpeech}`}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${word.term}${copy.listen}`} onPress={speak} style={styles.speaker}><Text style={styles.speakerText}>♪</Text></Pressable>
        </View>

        <View accessibilityRole="radiogroup" style={styles.options}>
          {choices.map((choice, index) => {
            const isAnswer = feedback && choice === word.meaningJa;
            const isWrongSelection = feedback && choice === feedback.selected && !feedback.correct;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: feedback?.selected === choice, disabled: Boolean(feedback) }}
                key={choice}
                onPress={() => select(choice)}
                style={({ pressed }) => [
                  styles.option,
                  isAnswer && styles.correctOption,
                  isWrongSelection && styles.wrongOption,
                  pressed && !feedback && styles.pressed,
                ]}
              >
                <View style={[styles.optionLetter, isAnswer && styles.correctLetter, isWrongSelection && styles.wrongLetter]}>
                  <Text style={[styles.optionLetterText, (isAnswer || isWrongSelection) && styles.optionLetterActive]}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={styles.optionText}>{choice}</Text>
                {isAnswer ? <Text style={styles.check}>✓</Text> : null}
                {isWrongSelection ? <Text style={styles.cross}>×</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  closeText: { color: colors.muted, fontSize: 26, lineHeight: 28, fontWeight: '500' },
  progressWrap: { flex: 1 },
  count: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  question: { flex: 1, justifyContent: 'center', paddingBottom: space.xl },
  prompt: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: space.sm },
  repeatBadge: { alignSelf: 'center', color: colors.amber, backgroundColor: colors.amberSoft, paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radii.pill, fontSize: 11, fontWeight: '800', marginBottom: space.sm },
  wordRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.lg, marginBottom: space.xl },
  term: { color: colors.ink, fontSize: 39, fontWeight: '900', letterSpacing: -1.4, textAlign: 'center' },
  pronunciation: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: space.xs },
  speaker: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  speakerText: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  options: { gap: space.sm },
  option: { minHeight: 62, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', padding: space.sm, paddingRight: space.md, gap: space.md },
  optionLetter: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  optionText: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' },
  correctOption: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrongOption: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  correctLetter: { backgroundColor: colors.success },
  wrongLetter: { backgroundColor: colors.danger },
  optionLetterActive: { color: colors.white },
  check: { color: colors.success, fontSize: 21, fontWeight: '900' },
  cross: { color: colors.danger, fontSize: 23, fontWeight: '900' },
  pressed: { transform: [{ scale: 0.99 }], borderColor: colors.primary },
  feedback: { width: '100%', maxWidth: 560, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg },
  feedbackCorrect: { backgroundColor: colors.successSoft },
  feedbackWrong: { backgroundColor: colors.dangerSoft },
  feedbackCopy: { marginBottom: space.md },
  feedbackTitle: { fontSize: 18, fontWeight: '900' },
  answerText: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: space.xs },
  explanation: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: space.xs },
});
